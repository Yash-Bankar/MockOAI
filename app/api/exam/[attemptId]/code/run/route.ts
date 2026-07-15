import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AttemptStatus } from '@/app/generated/prisma/client';
import { executeAgainstTestCases } from '@/lib/code/executor';
import { ensureExpectedOutputs } from '@/lib/code/verify-reference';

/**
 * POST /api/exam/[attemptId]/code/run
 *
 * Practice run against VISIBLE test cases only.
 * - Loads visibleTestCases server-side — client never receives hidden cases.
 * - Returns { status, actualOutput } per test case — never exposes expectedOutput.
 * - Does NOT set scoreAwarded or isCorrect — this is not a submission.
 * - Does increment Submission.attemptCount (for tracking how many times they ran).
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

    // Verify attempt belongs to user and is in progress
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return NextResponse.json({ error: 'Cannot run code for a completed attempt' }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, code, language } = body as { questionId?: string; code?: string; language?: string };

    if (!questionId || !code || !language) {
      return NextResponse.json({ error: 'Missing required fields: questionId, code, language' }, { status: 400 });
    }

    // Load the question and verify it belongs to this attempt
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        codingMeta: true,
        maxScore: true,
        attemptSection: { select: { attemptId: true } },
      },
    });

    if (!question || question.attemptSection.attemptId !== attemptId) {
      return NextResponse.json({ error: 'Question not found or does not belong to this attempt' }, { status: 400 });
    }

    const meta = question.codingMeta as any;
    if (!meta?.visibleTestCases) {
      return NextResponse.json({ error: 'Question has no test cases' }, { status: 400 });
    }

    // Just-in-Time verification: ensure expected outputs exist
    let visibleTestCases: { input: string; expectedOutput?: string }[];
    try {
      const patched = await ensureExpectedOutputs(questionId, meta);
      visibleTestCases = patched.visibleTestCases as any;
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to verify reference solution', message: String(err) },
        { status: 500 }
      );
    }

    // Execute against visible test cases — includeExpected=false hides expected output from client
    let execResult;
    try {
      execResult = await executeAgainstTestCases(code, language, visibleTestCases, false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('[Piston]')) {
        return NextResponse.json(
          { error: `Execution service unavailable: ${msg}`, message: msg },
          { status: 503 }
        );
      }
      // Language mapping error
      return NextResponse.json({ error: `Bad request: ${msg}`, message: msg }, { status: 400 });
    }

    // Increment attemptCount (practice run tracking) — upsert so first run creates the row
    await prisma.submission.upsert({
      where: { questionId },
      update: {
        code,
        language,
        attemptCount: { increment: 1 },
      },
      create: {
        questionId,
        code,
        language,
        attemptCount: 1,
        scoreAwarded: 0,
      },
    });

    return NextResponse.json({
      success: true,
      passed: execResult.passedCount,
      failed: execResult.totalCount - execResult.passedCount,
      total: execResult.totalCount,
      results: execResult.results.map((r, i) => ({
        status: r.status,
        passed: r.status === 'Passed',
        input: visibleTestCases[i].input,
        actualOutput: r.actualOutput,
        // expectedOutput deliberately NOT included here — only submit exposes it
      })),
    });
  } catch (error) {
    console.error('[Code Run POST] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Failed to run code', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
