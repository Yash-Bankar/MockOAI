import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AttemptStatus } from '@/app/generated/prisma/client';
import { executeAgainstTestCases } from '@/lib/code/executor';
import { ensureExpectedOutputs } from '@/lib/code/verify-reference';
import { getGenaiClient, GEMINI_MODEL } from '@/lib/gemini';

/**
 * POST /api/exam/[attemptId]/code/submit
 *
 * Final submission — runs against ALL test cases (visible + hidden).
 * - Score is computed arithmetically from Piston's execution results.
 * - AI is asked only to explain mistakes — never to judge correctness.
 * - After scoring, recomputes AttemptSection.scoreObtained.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await context.params;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return NextResponse.json({ error: 'Cannot submit code for a completed attempt' }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, code, language } = body as { questionId?: string; code?: string; language?: string };

    if (!questionId || !code || !language) {
      return NextResponse.json({ error: 'Missing required fields: questionId, code, language' }, { status: 400 });
    }

    // Load question — includes codingMeta with ALL test cases server-side
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        codingMeta: true,
        maxScore: true,
        promptText: true,
        attemptSection: {
          select: {
            id: true,
            attemptId: true,
          },
        },
      },
    });

    if (!question || question.attemptSection.attemptId !== attemptId) {
      return NextResponse.json({ error: 'Question not found or does not belong to this attempt' }, { status: 400 });
    }

    const meta = question.codingMeta as any;
    if (!meta?.visibleTestCases || !meta?.hiddenTestCases) {
      return NextResponse.json({ error: 'Question has no test cases' }, { status: 400 });
    }

    // Build full test case list (dynamically filling missing expectedOutput if needed)
    let visibleTestCases: { input: string; expectedOutput?: string }[];
    let hiddenTestCases: { input: string; expectedOutput?: string }[];
    
    try {
      const patched = await ensureExpectedOutputs(questionId, meta);
      visibleTestCases = patched.visibleTestCases as any;
      hiddenTestCases = patched.hiddenTestCases as any;
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to verify reference solution for grading', message: String(err) },
        { status: 500 }
      );
    }
    
    const allTestCases = [...visibleTestCases, ...hiddenTestCases];

    // ── Execute against all test cases ────────────────────────────────────────
    // includeExpected=true so we can compute the score; we strip it from the
    // response below (only visible results go back to the client).
    let execResult;
    try {
      execResult = await executeAgainstTestCases(code, language, allTestCases, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('[Piston]')) {
        return NextResponse.json(
          { error: `Execution service unavailable: ${msg}`, message: msg },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: `Bad request: ${msg}`, message: msg }, { status: 400 });
    }

    const { results, passedCount, totalCount } = execResult;

    // ── Score computation (deterministic — AI is not involved) ────────────────
    // scoreAwarded = maxScore × (passedCount / totalCount)
    // Rounded to 2 decimal places to avoid floating-point noise in the DB.
    const scoreAwarded = Math.round((question.maxScore * (passedCount / totalCount)) * 100) / 100;
    const isCorrect = passedCount === totalCount;

    // Visible results go to the client; hidden results are never exposed
    const visibleResults = results.slice(0, visibleTestCases.length).map((r, i) => ({
      status: r.status,
      passed: r.status === 'Passed',
      input: visibleTestCases[i].input,
      actualOutput: r.actualOutput,
      // expectedOutput included for submit (student can see what was expected)
      expectedOutput: r.expectedOutput,
    }));

    // For AI feedback: only the hidden test case verdicts (not their content)
    const hiddenSummary = results
      .slice(visibleTestCases.length)
      .map((r, i) => `Hidden test ${i + 1}: ${r.status}`)
      .join('\n');

    // ── AI Feedback ───────────────────────────────────────────────────────────
    // Gemini is told correctness as a fact — it explains mistakes, never judges.
    // Short prompt to minimise token usage.
    let aiFeedback: string | null = null;
    try {
      const genai = getGenaiClient();
      const failedVisible = visibleResults.filter(r => r.status !== 'Passed');

      const feedbackPrompt = `You are a coding mentor reviewing a student's submission.

Problem: ${question.promptText.slice(0, 500)}

Student's code (${language}):
\`\`\`${language}
${code.slice(0, 1500)}
\`\`\`

Execution results (already computed — do NOT re-judge correctness):
- Visible tests: ${visibleResults.filter(r => r.status === 'Passed').length}/${visibleTestCases.length} passed
${failedVisible.length > 0 ? `- First failing visible output: "${failedVisible[0].actualOutput.slice(0, 200)}" (expected: "${failedVisible[0].expectedOutput?.slice(0, 200) ?? 'N/A'}")` : ''}
- Hidden tests: ${hiddenSummary}

Score: ${passedCount}/${totalCount} test cases passed (${scoreAwarded}/${question.maxScore} marks).

In 2-4 sentences, explain what mistakes in the code caused the failures above. Do not re-evaluate whether the results are correct — they are final. If all tests passed, briefly confirm the approach is correct.`;

      const response = await genai.models.generateContent({
        model: GEMINI_MODEL,
        contents: feedbackPrompt,
      });
      aiFeedback = response.text ?? null;
    } catch (aiErr) {
      // AI feedback is best-effort — grading is already done, don't fail the submission
      console.warn('[Code Submit] AI feedback generation failed:', aiErr instanceof Error ? aiErr.message : String(aiErr));
    }

    // ── Persist submission ────────────────────────────────────────────────────
    const submission = await prisma.submission.upsert({
      where: { questionId },
      update: {
        code,
        language,
        isCorrect,
        scoreAwarded,
        testCaseResults: {
          visible: visibleResults,
          hiddenSummary: results.slice(visibleTestCases.length).map(r => ({ status: r.status })),
        },
        aiFeedback,
        attemptCount: { increment: 1 },
      },
      create: {
        questionId,
        code,
        language,
        isCorrect,
        scoreAwarded,
        testCaseResults: {
          visible: visibleResults,
          hiddenSummary: results.slice(visibleTestCases.length).map(r => ({ status: r.status })),
        },
        aiFeedback,
        attemptCount: 1,
      },
    });

    // ── Recompute AttemptSection.scoreObtained ────────────────────────────────
    // Sum all submissions' scoreAwarded for questions in this section.
    const sectionSubmissions = await prisma.submission.findMany({
      where: {
        question: { attemptSectionId: question.attemptSection.id },
      },
      select: { scoreAwarded: true },
    });
    const sectionScore = sectionSubmissions.reduce((sum, s) => sum + s.scoreAwarded, 0);

    await prisma.attemptSection.update({
      where: { id: question.attemptSection.id },
      data: { scoreObtained: Math.round(sectionScore * 100) / 100 },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      isCorrect,
      scoreAwarded,
      passedCount,
      totalCount,
      aiFeedback,
      // Only visible test case results — hidden results never leave the server
      results: visibleResults,
    });
  } catch (error) {
    console.error('[Code Submit POST] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to submit code', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
