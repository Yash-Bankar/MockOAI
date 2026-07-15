import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getGenaiClient, GEMINI_MODEL } from '@/lib/gemini';

const AI_UNAVAILABLE_PLACEHOLDER =
  'AI analysis unavailable — quota limit reached. Your scores above are unaffected.';

/**
 * POST /api/exam/[attemptId]/summary
 *
 * Generates an AI-written summary of the completed exam and persists it to
 * ExamAttempt.aiSummary. Single-attempt call — no retries, graceful degradation.
 *
 * If the Gemini call fails for any reason (quota exhaustion, transient error, etc.),
 * the route stores the placeholder string and still returns 200 so the client
 * (which fire-and-forgets this call) never blocks on it.
 */
export async function POST(
  _request: NextRequest,
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
      include: {
        pattern: { select: { name: true } },
        sections: {
          select: {
            name: true,
            scoreObtained: true,
            maxScore: true,
            timeSpentSeconds: true,
            questions: {
              select: {
                type: true,
                subType: true,
                maxScore: true,
                promptText: true,
                submission: {
                  select: {
                    selectedOptionId: true,
                    isCorrect: true,
                    scoreAwarded: true,
                    aiFeedback: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // If already has a summary, skip regeneration
    if (attempt.aiSummary && attempt.aiSummary !== AI_UNAVAILABLE_PLACEHOLDER) {
      return NextResponse.json({ success: true, aiSummary: attempt.aiSummary });
    }

    // Build a compact JSON summary for Gemini
    const summaryData = {
      exam: attempt.pattern.name,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      sections: attempt.sections.map((s: any) => {
        const missedMCQSubtypes = s.questions
          .filter((q: any) => q.type === "MCQ" && (!q.submission?.isCorrect))
          .map((q: any) => q.subType);
        
        const codingPassRates = s.questions
          .filter((q: any) => q.type === "CODING")
          .map((q: any) => ({
            subType: q.subType,
            score: q.submission?.scoreAwarded ?? 0,
            max: q.maxScore,
            feedback: q.submission?.aiFeedback
          }));

        return {
          name: s.name,
          score: s.scoreObtained ?? 0,
          max: s.maxScore,
          timeSpentSeconds: s.timeSpentSeconds || 0,
          missedMCQSubtypes,
          codingPassRates
        };
      })
    };

    const prompt = `You are an expert technical interviewer evaluating a candidate's mock OA performance.
Here is the JSON summary of their results:
${JSON.stringify(summaryData, null, 2)}

Write a short written analysis for the student:
1. 2-3 sentences on overall performance (be encouraging but honest).
2. 3 specific, concrete focus areas for improvement. Do NOT use generic advice like "practice more". You MUST reference the actual missed MCQ subtypes or the specific coding AI feedback. Keep each focus area to a single, punchy sentence.

Do NOT use bullet points or markdown bolding. Write in flowing prose for the overall performance, and numbered sentences for the focus areas.`;

    let aiSummary = AI_UNAVAILABLE_PLACEHOLDER;

    try {
      const genai = getGenaiClient();
      const result = await genai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.7 },
      });
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        aiSummary = text;
      }
    } catch (err) {
      // Single attempt — no retry. Graceful degradation: store placeholder.
      console.warn('[Exam Summary] Gemini call failed (non-blocking):', err instanceof Error ? err.message : String(err));
    }

    // Always persist — either the real summary or the placeholder
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { aiSummary },
    });

    return NextResponse.json({ success: true, aiSummary });
  } catch (error) {
    console.error('[Exam Summary POST] Unhandled error:', error);
    // Even on unhandled error, try to store the placeholder so the results page doesn't break
    try {
      const { attemptId } = await context.params;
      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: { aiSummary: AI_UNAVAILABLE_PLACEHOLDER },
      });
    } catch { /* ignore secondary failure */ }

    return NextResponse.json({ success: false, aiSummary: AI_UNAVAILABLE_PLACEHOLDER });
  }
}
