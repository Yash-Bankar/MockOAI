/**
 * DB Integration Test — generates questions and writes them to the real database
 * Picks the most recent IN_PROGRESS ExamAttempt and generates questions for
 * one MCQ section and the Language Coding section, then reads them back.
 *
 * Usage: npx tsx scripts/test-db-generation.ts
 */

import { config } from "dotenv";
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SectionFormat, QuestionFormat, AttemptStatus } from "../app/generated/prisma/client";
import { generateMCQQuestions, generateCodingQuestions } from "../lib/question-generator";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("DB Integration Test — Question Generation → Database");
  console.log("=".repeat(60));

  // ── 1. Find a real IN_PROGRESS ExamAttempt ──────────────────
  const attempt = await prisma.examAttempt.findFirst({
    where: { status: AttemptStatus.IN_PROGRESS },
    include: {
      pattern: { include: { sections: { orderBy: { order: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!attempt) {
    console.error("❌ No IN_PROGRESS ExamAttempt found in the database.");
    console.error("   Go to the dashboard and click 'Start New Mock OA' first.");
    process.exit(1);
  }

  console.log(`\nAttempt ID : ${attempt.id}`);
  console.log(`User ID    : ${attempt.userId}`);
  console.log(`Sections   : ${attempt.pattern.sections.map((s) => s.name).join(", ")}`);

  // ── 2. Pick one MCQ section and the Coding section ─────────
  const mcqSection = attempt.pattern.sections.find((s) => s.format === SectionFormat.MCQ);
  const codingSection = attempt.pattern.sections.find((s) => s.format === SectionFormat.CODING);

  if (!mcqSection || !codingSection) {
    console.error("❌ Could not find both an MCQ and a Coding section in this attempt's pattern.");
    process.exit(1);
  }

  console.log(`\nTarget sections:`);
  console.log(`  MCQ    : ${mcqSection.name} (${mcqSection.questionCount} questions, ${mcqSection.maxScore} marks)`);
  console.log(`  Coding : ${codingSection.name} (${codingSection.questionCount} questions, ${codingSection.maxScore} marks)`);

  // ── 3. Generate MCQ questions ───────────────────────────────
  console.log(`\n[1/4] Generating MCQ questions for "${mcqSection.name}"...`);
  const mcqTypeMix = mcqSection.questionTypeMix as Record<string, { count: number; description: string }>;
  const mcqResult = await generateMCQQuestions(mcqSection.name, mcqTypeMix, mcqSection.questionCount);

  if (!mcqResult.success || !mcqResult.questions) {
    console.error(`❌ MCQ generation failed: ${mcqResult.error}`);
    process.exit(1);
  }
  console.log(`   ✓ Generated ${mcqResult.questions.length} MCQ questions, Zod validated`);

  // ── 4. Generate Coding questions ────────────────────────────
  console.log(`\n[2/4] Generating Coding questions for "${codingSection.name}"...`);
  const codingTypeMix = codingSection.questionTypeMix as Record<string, { count: number; description: string }>;
  const codingResult = await generateCodingQuestions(codingSection.name, codingTypeMix, codingSection.questionCount);

  if (!codingResult.success || !codingResult.questions) {
    console.error(`❌ Coding generation failed: ${codingResult.error}`);
    process.exit(1);
  }
  console.log(`   ✓ Generated ${codingResult.questions.length} Coding questions, Zod validated`);

  // ── 5. Write MCQ questions to DB ────────────────────────────
  console.log(`\n[3/4] Writing to database...`);

  // Create AttemptSection for MCQ (skip if already exists)
  let mcqAttemptSection = await prisma.attemptSection.findFirst({
    where: { attemptId: attempt.id, sectionConfigId: mcqSection.id },
  });
  if (!mcqAttemptSection) {
    mcqAttemptSection = await prisma.attemptSection.create({
      data: {
        attemptId: attempt.id,
        sectionConfigId: mcqSection.id,
        name: mcqSection.name,
        order: mcqSection.order,
        maxScore: mcqSection.maxScore,
        status: AttemptStatus.IN_PROGRESS,
      },
    });
    console.log(`   Created AttemptSection for "${mcqSection.name}": ${mcqAttemptSection.id}`);
  } else {
    console.log(`   AttemptSection for "${mcqSection.name}" already exists: ${mcqAttemptSection.id}`);
    // Clear old questions to avoid duplicates
    await prisma.question.deleteMany({ where: { attemptSectionId: mcqAttemptSection.id } });
  }

  const mcqScorePerQ = mcqSection.maxScore / mcqSection.questionCount;
  await prisma.question.createMany({
    data: mcqResult.questions.map((q, i) => ({
      attemptSectionId: mcqAttemptSection!.id,
      type: QuestionFormat.MCQ,
      subType: q.subType,
      difficulty: q.difficulty,
      order: i + 1,
      maxScore: mcqScorePerQ,
      promptText: q.promptText,
      options: q.options as any,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      // codingMeta omitted — defaults to null in DB for MCQ rows
    })),
  });

  // Create AttemptSection for Coding (skip if already exists)
  let codingAttemptSection = await prisma.attemptSection.findFirst({
    where: { attemptId: attempt.id, sectionConfigId: codingSection.id },
  });
  if (!codingAttemptSection) {
    codingAttemptSection = await prisma.attemptSection.create({
      data: {
        attemptId: attempt.id,
        sectionConfigId: codingSection.id,
        name: codingSection.name,
        order: codingSection.order,
        maxScore: codingSection.maxScore,
        status: AttemptStatus.IN_PROGRESS,
      },
    });
    console.log(`   Created AttemptSection for "${codingSection.name}": ${codingAttemptSection.id}`);
  } else {
    console.log(`   AttemptSection for "${codingSection.name}" already exists: ${codingAttemptSection.id}`);
    await prisma.question.deleteMany({ where: { attemptSectionId: codingAttemptSection.id } });
  }

  const codingScorePerQ = codingSection.maxScore / codingSection.questionCount;
  await prisma.question.createMany({
    data: codingResult.questions.map((q, i) => ({
      attemptSectionId: codingAttemptSection!.id,
      type: QuestionFormat.CODING,
      subType: q.subType,
      difficulty: q.difficulty,
      order: i + 1,
      maxScore: codingScorePerQ,
      promptText: q.promptText,
      // options, correctOptionId, explanation omitted for coding rows
      codingMeta: {
        constraints: q.constraints,
        examples: q.examples,
        starterCode: q.starterCode,
        referenceSolution: q.referenceSolution,
        visibleTestCases: q.visibleTestCases,
        hiddenTestCases: q.hiddenTestCases,
        timeLimitMs: q.timeLimitMs,
      },
    })),
  });

  // ── 6. Read back and display rows ───────────────────────────
  console.log(`\n[4/4] Reading back from database...`);

  const mcqRows = await prisma.question.findMany({
    where: { attemptSectionId: mcqAttemptSection.id },
    orderBy: { order: "asc" },
  });

  const codingRows = await prisma.question.findMany({
    where: { attemptSectionId: codingAttemptSection.id },
    orderBy: { order: "asc" },
  });

  console.log(`\n${"─".repeat(60)}`);
  console.log(`MCQ Questions in DB (${mcqRows.length} rows):`);
  console.log(`${"─".repeat(60)}`);
  for (const row of mcqRows) {
    const opts = row.options as any[];
    console.log(`\n  Row ID  : ${row.id}`);
    console.log(`  Type    : ${row.type}`);
    console.log(`  SubType : ${row.subType}`);
    console.log(`  Difficulty: ${row.difficulty}`);
    console.log(`  Prompt  : ${row.promptText.substring(0, 80)}${row.promptText.length > 80 ? "..." : ""}`);
    console.log(`  Options : ${opts?.map((o: any) => `${o.id}. ${o.text.substring(0, 20)}`).join(" | ")}`);
    console.log(`  Correct : ${row.correctOptionId}`);
    console.log(`  HasExplanation: ${!!row.explanation}`);
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Coding Questions in DB (${codingRows.length} rows):`);
  console.log(`${"─".repeat(60)}`);
  for (const row of codingRows) {
    const meta = row.codingMeta as any;
    console.log(`\n  Row ID  : ${row.id}`);
    console.log(`  Type    : ${row.type}`);
    console.log(`  SubType : ${row.subType}`);
    console.log(`  Difficulty: ${row.difficulty}`);
    console.log(`  Prompt  : ${row.promptText.substring(0, 80)}${row.promptText.length > 80 ? "..." : ""}`);
    console.log(`  Constraints : ${meta?.constraints?.length ?? 0} items`);
    console.log(`  Examples    : ${meta?.examples?.length ?? 0}`);
    console.log(`  VisibleTests: ${meta?.visibleTestCases?.length ?? 0}`);
    console.log(`  HiddenTests : ${meta?.hiddenTestCases?.length ?? 0}`);
    console.log(`  StarterCode langs: ${meta?.starterCode ? Object.keys(meta.starterCode).join(", ") : "MISSING"}`);
    console.log(`  HasReferenceSolution: ${!!meta?.referenceSolution}`);
    console.log(`  TimeLimitMs : ${meta?.timeLimitMs}`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ DB Integration Test PASSED`);
  console.log(`   ${mcqRows.length} MCQ rows + ${codingRows.length} Coding rows written and verified in Neon.`);
  console.log(`${"=".repeat(60)}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
