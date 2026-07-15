import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getQuestionSource } from '@/lib/question-source';
import { verifyReferenceSolution } from '@/lib/code/verify-reference';
import { AttemptStatus, QuestionFormat, SectionFormat } from '@/app/generated/prisma/client';

/**
 * POST /api/exam/[attemptId]/sections/[sectionConfigId]/generate
 *
 * Generates questions for a specific section of an exam attempt.
 * Idempotent: returns existing questions if section already generated.
 *
 * Architecture: Prefetch-while-attempting
 * - Section 1 generated synchronously when attempt starts (blocks loading screen briefly)
 * - Subsequent sections generated on-demand before student needs them
 * - Client calls this endpoint after rendering current section to prefetch next section
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string; sectionConfigId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId, sectionConfigId } = await context.params;

    // Verify the attempt belongs to the user and is in progress
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        pattern: {
          include: {
            sections: true,
          },
        },
      },
    });

    if (!attempt) {
      console.log('[Generate] Attempt not found:', attemptId);
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'Cannot generate questions for completed or abandoned attempt' },
        { status: 400 }
      );
    }

    // Find the section config
    const sectionConfig = attempt.pattern.sections.find(
      (s) => s.id === sectionConfigId
    );

    if (!sectionConfig) {
      console.log('[Generate] Section config not found:', sectionConfigId, 'available configs:', attempt.pattern.sections.map(s => s.id));
      return NextResponse.json({ error: 'Section config not found' }, { status: 404 });
    }

    // Verify the section belongs to this attempt
    const attemptSectionExists = await prisma.attemptSection.findFirst({
      where: {
        attemptId,
        sectionConfigId,
      },
    });

    if (!attemptSectionExists) {
      console.log('[Generate] AttemptSection not found for attemptId:', attemptId, 'sectionConfigId:', sectionConfigId);
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Check if section already exists (idempotency)
    const existingSection = await prisma.attemptSection.findFirst({
      where: {
        attemptId,
        sectionConfigId,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (existingSection && existingSection.questions.length > 0) {
      console.log(`[Generate] Section ${sectionConfigId} already generated, returning existing`);
      return NextResponse.json({
        success: true,
        sectionId: existingSection.id,
        questionCount: existingSection.questions.length,
        cached: true,
      });
    }

    // Generate questions — route based on section format
    console.log(`[Generate] Generating questions for section ${sectionConfig.name} (${sectionConfig.format})`);

    // The DB stores questionTypeMix as JSON. For MCQ sections it's { type, count }[].
    // For CODING sections the shape differs (has maxScore, difficulty).
    let generatedQuestions;

    if (sectionConfig.format === SectionFormat.MCQ) {
      // Use the QuestionSource abstraction (respects QUESTION_SOURCE_MODE env var).
      // The source.getMCQQuestions expects array-style mix: { type, count }[].
      const questionTypeMixArray = sectionConfig.questionTypeMix as { type: string; count: number }[];
      const source = getQuestionSource();
      try {
        generatedQuestions = await source.getMCQQuestions({
          sectionName: sectionConfig.name,
          questionTypeMix: questionTypeMixArray,
        });
      } catch (err) {
        return NextResponse.json(
          {
            error: 'Question generation failed',
            message: err instanceof Error ? err.message : 'Unknown generation error',
          },
          { status: 500 }
        );
      }
    } else {
      // CODING branch — now routes through getQuestionSource() so CODING_SOURCE_MODE
      // controls whether this uses Gemini, the static bank, or hybrid with fallback.
      const source = getQuestionSource();
      try {
        generatedQuestions = await source.getCodingQuestions({
          sectionName: sectionConfig.name,
          count: sectionConfig.questionCount,
        });
      } catch (err) {
        return NextResponse.json(
          {
            error: 'Question generation failed',
            message: err instanceof Error ? err.message : 'Unknown generation error',
          },
          { status: 500 }
        );
      }
    }

    // Double check that another request hasn't populated the section while we were generating
    const doubleCheck = await prisma.attemptSection.findFirst({
      where: { attemptId, sectionConfigId },
      include: { questions: { select: { id: true } } }
    });

    if (doubleCheck && doubleCheck.questions.length > 0) {
      console.log(`[Generate] Race condition mitigated: section ${sectionConfigId} already populated.`);
      return NextResponse.json({
        success: true,
        sectionId: doubleCheck.id,
        questionCount: doubleCheck.questions.length,
        cached: true,
      });
    }

    // Create or update AttemptSection (it likely already exists from attempt creation)
    const attemptSection = existingSection || await prisma.attemptSection.create({
      data: {
        attemptId,
        sectionConfigId,
        name: sectionConfig.name,
        order: sectionConfig.order,
        maxScore: sectionConfig.maxScore,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    // Calculate score per question
    const scorePerQuestion = sectionConfig.maxScore / sectionConfig.questionCount;

    // Store questions in database
    await prisma.question.createMany({
      data: generatedQuestions.map((q: any, index: number) => {
        const baseQuestion = {
          attemptSectionId: attemptSection.id,
          subType: q.subType,
          difficulty: q.difficulty || 'medium',
          order: index + 1,
          maxScore: scorePerQuestion,
          promptText: q.promptText,
        };

        if (sectionConfig.format === SectionFormat.MCQ) {
          const mcq = q as any;
          return {
            ...baseQuestion,
            type: QuestionFormat.MCQ,
            options: mcq.options,
            correctOptionId: mcq.correctOptionId,
            explanation: mcq.explanation,
            // codingMeta omitted — defaults to null in DB for MCQ rows
          };
        } else {
          // Coding question
          const coding = q as any;
          return {
            ...baseQuestion,
            type: QuestionFormat.CODING,
            // options, correctOptionId, explanation omitted for coding rows
            codingMeta: {
              constraints: coding.constraints,
              examples: coding.examples,
              starterCode: coding.starterCode,
              referenceSolution: coding.referenceSolution,
              visibleTestCases: coding.visibleTestCases,
              hiddenTestCases: coding.hiddenTestCases,
              timeLimitMs: coding.timeLimitMs,
            },
          };
        }
      }),
    });

    console.log(`[Generate] Successfully created ${generatedQuestions.length} questions for section ${sectionConfig.name}`);

    // ── Reference-solution verification (Phase 7 step 8) ─────────────────────
    // For CODING sections: run referenceSolution through Piston on every stored
    // question to fill in expectedOutput on each test case. This happens after
    // createMany so the question IDs exist. Non-fatal — if Piston is down at
    // generation time, the question still exists and compare.ts handles missing
    // expectedOutput leniently, but grading accuracy requires this to succeed.
    if (sectionConfig.format === SectionFormat.CODING) {
      const storedQuestions = await prisma.question.findMany({
        where: { attemptSectionId: attemptSection.id },
        select: { id: true, codingMeta: true },
      });

      for (const sq of storedQuestions) {
        const meta = sq.codingMeta as any;
        if (!meta?.referenceSolution) continue;

        const allTestCases = [
          ...(meta.visibleTestCases ?? []),
          ...(meta.hiddenTestCases ?? []),
        ];

        const verification = await verifyReferenceSolution(meta.referenceSolution, allTestCases);

        if (!verification.success) {
          console.warn(`[Generate] Reference solution verification failed for question ${sq.id}: ${verification.error}`);
          continue;
        }

        const visibleCount = (meta.visibleTestCases ?? []).length;
        const patchedVisible = (meta.visibleTestCases ?? []).map((tc: any, i: number) => ({
          ...tc,
          expectedOutput: verification.expectedOutputs[i],
        }));
        const patchedHidden = (meta.hiddenTestCases ?? []).map((tc: any, i: number) => ({
          ...tc,
          expectedOutput: verification.expectedOutputs[visibleCount + i],
        }));

        await prisma.question.update({
          where: { id: sq.id },
          data: {
            codingMeta: {
              ...meta,
              visibleTestCases: patchedVisible,
              hiddenTestCases: patchedHidden,
            },
          },
        });
        console.log(`[Generate] Reference solution verified and expectedOutputs stored for question ${sq.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      sectionId: attemptSection.id,
      questionCount: generatedQuestions.length,
      cached: false,
    });
  } catch (error) {
    console.error('[Generate] Error generating questions:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
