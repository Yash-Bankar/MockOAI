import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AttemptStatus, QuestionFormat } from '@/app/generated/prisma/client';

/**
 * POST /api/exam/[attemptId]/answer
 *
 * Unified autosave for MCQ and coding (code draft save only — no grading here).
 *
 * For MCQ: computes isCorrect server-side against Question.correctOptionId.
 * Never trusts a client-supplied correctness flag. Sets scoreAwarded accordingly.
 * After upsert, recomputes AttemptSection.scoreObtained.
 *
 * For CODING: saves code draft only — grading happens in /code/submit.
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
      return NextResponse.json({ error: 'Exam attempt not found or forbidden' }, { status: 404 });
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return NextResponse.json({ error: 'Cannot modify a completed attempt' }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, selectedOptionId, code, language, timeSpentSeconds } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    // Load question with enough info for server-side grading
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        type: true,
        correctOptionId: true,
        maxScore: true,
        attemptSection: {
          select: {
            id: true,
            attemptId: true,
          },
        },
      },
    });

    if (!question || question.attemptSection.attemptId !== attemptId) {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
    }

    // ── MCQ: compute correctness server-side ──────────────────────────────────
    let isCorrect: boolean | undefined;
    let scoreAwarded: number | undefined;

    if (question.type === QuestionFormat.MCQ && selectedOptionId !== undefined) {
      // Server computes correctness — never trust client-supplied flag
      isCorrect = selectedOptionId === question.correctOptionId;
      scoreAwarded = isCorrect ? question.maxScore : 0;
    }

    // ── Upsert submission ─────────────────────────────────────────────────────
    const submission = await prisma.submission.upsert({
      where: { questionId },
      update: {
        ...(selectedOptionId !== undefined && { selectedOptionId }),
        ...(code !== undefined && { code }),
        ...(language !== undefined && { language }),
        ...(timeSpentSeconds !== undefined && { timeSpentSeconds: { increment: timeSpentSeconds } }),
        ...(isCorrect !== undefined && { isCorrect }),
        ...(scoreAwarded !== undefined && { scoreAwarded }),
        attemptCount: { increment: 1 },
      },
      create: {
        questionId,
        selectedOptionId: selectedOptionId ?? null,
        code: code ?? null,
        language: language ?? null,
        timeSpentSeconds: timeSpentSeconds ?? 0,
        isCorrect: isCorrect ?? null,
        scoreAwarded: scoreAwarded ?? 0,
        attemptCount: 1,
      },
    });

    // ── Recompute AttemptSection.scoreObtained after every MCQ answer ─────────
    // Sum all submissions' scoreAwarded for questions in this section.
    if (question.type === QuestionFormat.MCQ && scoreAwarded !== undefined) {
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
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      // Return computed correctness for MCQ so the UI can show feedback
      ...(isCorrect !== undefined && { isCorrect, scoreAwarded }),
    });
  } catch (error) {
    console.error('[Answer POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save answer', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
