import fs from "fs/promises";
import path from "path";
import type { QuestionSource } from "./types";
import { MCQQuestionSchema, CodingQuestionSchema, type MCQQuestion, type CodingQuestion } from "@/lib/question-schemas";

// Maps SectionConfig.name -> bank filename. Adjust if your section names differ.
const BANK_FILE_BY_SECTION: Record<string, string> = {
  "English": "english.json",
  "Logical and Analytical Reasoning": "reasoning.json",
  "Quantitative Ability": "quant.json",
  "Computer Fundamentals": "cs-fundamentals.json",
};

const BANK_DIR = path.join(process.cwd(), "data", "question-banks");

let bankCache: Record<string, MCQQuestion[]> = {};

async function loadBank(sectionName: string): Promise<MCQQuestion[]> {
  if (bankCache[sectionName]) return bankCache[sectionName];

  const file = BANK_FILE_BY_SECTION[sectionName];
  if (!file) {
    throw new Error(
      `[static-source] No question bank mapped for section "${sectionName}". ` +
      `Check BANK_FILE_BY_SECTION in lib/question-source/static-source.ts.`
    );
  }

  const raw = await fs.readFile(path.join(BANK_DIR, file), "utf-8");
  const parsed = JSON.parse(raw);

  // Validate every question against the real Zod schema before trusting it —
  // a malformed bank entry should fail loudly here, not silently corrupt an attempt.
  const validated: MCQQuestion[] = [];
  for (const q of parsed.questions) {
    const result = MCQQuestionSchema.safeParse(q);
    if (!result.success) {
      throw new Error(
        `[static-source] Invalid question in ${file}: ${JSON.stringify(result.error.issues)}`
      );
    }
    validated.push(result.data);
  }

  bankCache[sectionName] = validated;
  return validated;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let codingBankCache: CodingQuestion[] | null = null;

async function loadCodingBank(): Promise<CodingQuestion[]> {
  if (codingBankCache) return codingBankCache;

  const raw = await fs.readFile(path.join(BANK_DIR, "coding.json"), "utf-8");
  const parsed = JSON.parse(raw);

  const validated: CodingQuestion[] = [];
  for (const q of parsed.questions) {
    const result = CodingQuestionSchema.safeParse(q);
    if (!result.success) {
      throw new Error(
        `[static-source] Invalid coding question in coding.json: ${JSON.stringify(result.error.issues)}`
      );
    }
    validated.push(result.data);
  }

  codingBankCache = validated;
  return validated;
}

export const staticSource: QuestionSource = {
  async getCodingQuestions({ count, excludePromptTextSeen = [] }) {
    const bank = await loadCodingBank();
    if (bank.length < count) {
      throw new Error(
        `[static-source] coding.json only has ${bank.length} questions, but ${count} are needed.`
      );
    }
    const unseen = bank.filter((q) => !excludePromptTextSeen.includes(q.promptText));
    const drawFrom = unseen.length >= count ? unseen : bank;
    return shuffle(drawFrom).slice(0, count);
  },

  async getMCQQuestions({ sectionName, questionTypeMix, excludeSubTypeSeen = [] }) {
    const bank = await loadBank(sectionName);
    const result: MCQQuestion[] = [];

    for (const { type, count } of questionTypeMix) {
      const pool = bank.filter((q) => q.subType === type);
      if (pool.length < count) {
        throw new Error(
          `[static-source] Bank for "${sectionName}" only has ${pool.length} questions ` +
          `of subType "${type}", but ${count} are needed. Bank needs more entries for this subtype.`
        );
      }

      // Prefer questions not already seen this attempt; fall back to the full pool
      // once the unseen set is exhausted (better than erroring on repeat attempts).
      const unseen = pool.filter((q) => !excludeSubTypeSeen.includes(q.promptText));
      const drawFrom = unseen.length >= count ? unseen : pool;

      result.push(...shuffle(drawFrom).slice(0, count));
    }

    return shuffle(result);
  },
};