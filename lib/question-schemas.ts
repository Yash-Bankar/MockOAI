import { z } from "zod";

// ─── MCQ Question Schema ──────────────────────────────────────────────────────

export const MCQOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const MCQQuestionSchema = z.object({
  promptText: z.string(),
  options: z.array(MCQOptionSchema).length(4),
  correctOptionId: z.string(),
  explanation: z.string(),
  subType: z.string(),
  difficulty: z.string(),
});

export type MCQQuestion = z.infer<typeof MCQQuestionSchema>;

// ─── Coding Question Schema ───────────────────────────────────────────────────

export const CodingExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
});

export const StarterCodeSchema = z.object({
  python: z.string(),
  cpp: z.string(),
  java: z.string(),
  javascript: z.string(),
});

export const TestCaseInputSchema = z.object({
  input: z.string(),
});

export const TestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string().optional(), // Will be filled after verification
});

export const CodingQuestionSchema = z.object({
  promptText: z.string(),
  constraints: z.array(z.string()),
  examples: z.array(CodingExampleSchema).min(1),
  starterCode: StarterCodeSchema,
  referenceSolution: z.string(),
  visibleTestCases: z.array(TestCaseInputSchema).min(2).max(3),
  hiddenTestCases: z.array(TestCaseInputSchema).min(1).max(10),
  timeLimitMs: z.number(),
  subType: z.string(),
  difficulty: z.string(),
});

export type CodingQuestion = z.infer<typeof CodingQuestionSchema>;

// ─── Combined Question Schema ─────────────────────────────────────────────────

export const QuestionSchema = z.union([
  z.object({ type: z.literal("MCQ"), question: MCQQuestionSchema }),
  z.object({ type: z.literal("CODING"), question: CodingQuestionSchema }),
]);

export type Question = z.infer<typeof QuestionSchema>;

// ─── Generated Section Schema ─────────────────────────────────────────────────

export const GeneratedSectionSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type GeneratedSection = z.infer<typeof GeneratedSectionSchema>;
