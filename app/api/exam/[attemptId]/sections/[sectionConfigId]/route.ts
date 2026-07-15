import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { QuestionFormat } from '@/app/generated/prisma/client';

/**
 * GET /api/exam/[attemptId]/sections/[sectionConfigId]
 * 
 * Fetches questions for a specific section of an exam attempt.
 * 
 * Security: Strips sensitive data from response:
 * - MCQ: correctOptionId, explanation (until submission)
 * - Coding: hiddenTestCases, referenceSolution (until submission)
 * 
 * Returns 404 if section not generated yet (client should call /generate first).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string; sectionConfigId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId, sectionConfigId } = await context.params;

    // Verify the attempt belongs to the user
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the section with questions and submissions
    const section = await prisma.attemptSection.findFirst({
      where: {
        attemptId,
        sectionConfigId,
      },
      include: {
        questions: {
          include: {
            submission: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found. Call /generate first to create questions.' },
        { status: 404 }
      );
    }

    if (section.questions.length === 0) {
      return NextResponse.json(
        { error: 'Section has no questions. Call /generate to create them.' },
        { status: 404 }
      );
    }

    // Strip sensitive data from questions before sending to client
    const sanitizedQuestions = section.questions.map((question) => {
      const baseQuestion = {
        id: question.id,
        type: question.type,
        subType: question.subType,
        difficulty: question.difficulty,
        order: question.order,
        maxScore: question.maxScore,
        promptText: question.promptText,
        submission: question.submission,
      };

      if (question.type === QuestionFormat.MCQ) {
        // Strip correctOptionId and explanation (will be revealed after submission)
        return {
          ...baseQuestion,
          options: question.options,
          // correctOptionId: STRIPPED
          // explanation: STRIPPED
        };
      } else {
        // Coding question: strip hiddenTestCases and referenceSolution
        const codingMeta = question.codingMeta as any;
        return {
          ...baseQuestion,
          codingMeta: codingMeta ? {
            constraints: codingMeta.constraints,
            examples: codingMeta.examples,
            starterCode: codingMeta.starterCode,
            visibleTestCases: codingMeta.visibleTestCases,
            timeLimitMs: codingMeta.timeLimitMs,
            // hiddenTestCases: STRIPPED
            // referenceSolution: STRIPPED
          } : null,
        };
      }
    });

    return NextResponse.json({
      section: {
        id: section.id,
        name: section.name,
        order: section.order,
        maxScore: section.maxScore,
        scoreObtained: section.scoreObtained,
        timeSpentSeconds: section.timeSpentSeconds,
        status: section.status,
      },
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('[Fetch Section] Error fetching questions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
