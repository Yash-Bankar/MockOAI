import type { QuestionSource } from "./types";
import type { QuestionTypeMix } from "@/lib/question-generator";
import { generateMCQQuestions, generateCodingQuestions } from "@/lib/question-generator";

/**
 * AI source — wraps the existing Phase 7 generators.
 *
 * getMCQQuestions: converts the QuestionSource interface's array-style mix
 * ({ type, count }[]) into the Record-style QuestionTypeMix the real generator
 * expects, then unwraps the GenerationResult envelope.
 *
 * getCodingQuestions: similarly adapts the count-based interface call into the
 * (sectionName, questionTypeMix, totalCount) signature of the real generator.
 */
export const aiSource: QuestionSource = {
  async getMCQQuestions({ sectionName, questionTypeMix }) {
    // Convert array-style mix → Record-style expected by generateMCQQuestions.
    // excludeSubTypeSeen intentionally ignored — Gemini generates fresh content.
    const mixRecord: QuestionTypeMix = {};
    let totalCount = 0;
    for (const { type, count } of questionTypeMix) {
      mixRecord[type] = { count, description: type };
      totalCount += count;
    }

    const result = await generateMCQQuestions(sectionName, mixRecord, totalCount);

    if (!result.success || !result.questions) {
      throw new Error(
        `[ai-source] Gemini MCQ generation failed for "${sectionName}": ${result.error ?? "unknown error"}`
      );
    }
    return result.questions;
  },

  async getCodingQuestions({ sectionName, count }) {
    // generateCodingQuestions takes (sectionName, questionTypeMix, totalCount).
    // For coding the "type mix" concept doesn't apply the same way —
    // build a minimal single-entry mix so the prompt builder gets a count it can use.
    const mixRecord: QuestionTypeMix = {
      "Coding": { count, description: "General coding problem" },
    };

    const result = await generateCodingQuestions(sectionName, mixRecord, count);

    if (!result.success || !result.questions) {
      throw new Error(
        `[ai-source] Gemini coding generation failed for "${sectionName}": ${result.error ?? "unknown error"}`
      );
    }
    return result.questions;
  },
};