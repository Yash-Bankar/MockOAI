import type { MCQQuestion, CodingQuestion } from "@/lib/question-schemas";

/**
 * A QuestionSource produces questions for a section without knowing or
 * caring whether they came from Gemini or a static bank.
 * generate/route.ts should depend only on this interface.
 */
export interface QuestionSource {
  /**
   * Returns exactly `count` MCQ questions matching the section's
   * questionTypeMix, ready to be inserted as Question rows.
   * Should throw on failure — callers decide fallback behavior.
   */
  getMCQQuestions(params: {
    sectionName: string;
    questionTypeMix: { type: string; count: number }[];
    /** subType strings the user has already seen in THIS attempt, to avoid immediate repeats when sampling from a static bank. AI sources can ignore this. */
    excludeSubTypeSeen?: string[];
  }): Promise<MCQQuestion[]>;

  /**
   * Returns exactly `count` coding questions. hiddenTestCases/visibleTestCases
   * from the static source intentionally omit expectedOutput — that gets
   * filled in by Phase 9's Piston verification step, same as it will for
   * Gemini-generated coding questions. Do NOT treat a missing expectedOutput
   * as a bug in this module.
   */
  getCodingQuestions(params: {
    sectionName: string;
    count: number;
    excludePromptTextSeen?: string[];
  }): Promise<CodingQuestion[]>;
}

export type QuestionSourceMode = "ai" | "static" | "hybrid";