import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AttemptStatus } from '@/app/generated/prisma/client';

/**
 * POST /api/exam/[attemptId]/complete
 *
 * Finalizes an exam attempt.
 * - Sums up all sections' scoreObtained into the attempt's totalScore.
 * - Marks the attempt and all its sections as COMPLETED.
 * - Sets the completedAt timestamp.
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

    const body = await request.json().catch(() => ({}));
    const { sectionTimes } = body as { sectionTimes?: Record<string, number> };

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        sections: {
          select: { id: true, sectionConfigId: true, scoreObtained: true, timeSpentSeconds: true }
        }
      }
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.status === AttemptStatus.COMPLETED) {
      return NextResponse.json({ success: true, message: 'Attempt already completed' });
    }

    // Aggregate total score from all sections
    const totalScore = attempt.sections.reduce((sum, section) => sum + (section.scoreObtained || 0), 0);
    // Round to 2 decimal places to avoid floating point anomalies
    const finalScore = Math.round(totalScore * 100) / 100;

    // Transaction to update attempt and all its sections
    await prisma.$transaction([
      prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: AttemptStatus.COMPLETED,
          completedAt: new Date(),
          totalScore: finalScore,
        },
      }),
      // Instead of updateMany, update each section individually if sectionTimes provided
      ...attempt.sections.map((section) => 
        prisma.attemptSection.update({
          where: { id: section.id },
          data: {
            status: AttemptStatus.COMPLETED,
            timeSpentSeconds: sectionTimes?.[section.sectionConfigId] || section.timeSpentSeconds || 0,
          },
        })
      )
    ]);

    return NextResponse.json({
      success: true,
      totalScore: finalScore
    });
  } catch (error) {
    console.error('[Exam Complete POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete exam', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
