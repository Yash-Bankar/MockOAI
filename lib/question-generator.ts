/**
 * Question Generation Service
 * 
 * Handles question generation using Gemini with structured output,
 * validation, and retry logic.
 */

import { getGenaiClient, GEMINI_MODEL } from "./gemini";
import { MCQQuestionSchema, CodingQuestionSchema, type MCQQuestion, type CodingQuestion } from "./question-schemas";
import { buildMCQPrompt, buildCodingPrompt } from "./question-prompts";
import { MCQ_RESPONSE_SCHEMA, CODING_RESPONSE_SCHEMA } from "./gemini-schemas";
import { ZodError, type ZodSchema } from "zod";

export interface QuestionTypeMix {
  [subType: string]: {
    count: number;
    description: string;
  };
}

export interface GenerationResult<T> {
  success: boolean;
  questions?: T[];
  error?: string;
}

/**
 * Generate MCQ questions using Gemini with structured output
 */
export async function generateMCQQuestions(
  sectionName: string,
  questionTypeMix: QuestionTypeMix,
  totalCount: number
): Promise<GenerationResult<MCQQuestion>> {
  const client = getGenaiClient();
  const prompt = buildMCQPrompt({
    sectionName,
    questionCount: totalCount,
    questionTypeMix,
    maxScore: totalCount
  });

  try {
    const result = await generateWithRetry(
      client,
      GEMINI_MODEL,
      prompt,
      MCQ_RESPONSE_SCHEMA,
      MCQQuestionSchema,
      totalCount
    );

    return result;
  } catch (error) {
    console.error("MCQ generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during MCQ generation"
    };
  }
}

/**
 * Generate coding questions using Gemini with structured output
 */
export async function generateCodingQuestions(
  sectionName: string,
  questionTypeMix: QuestionTypeMix,
  totalCount: number
): Promise<GenerationResult<CodingQuestion>> {
  const client = getGenaiClient();
  const prompt = buildCodingPrompt({
    sectionName,
    questionCount: totalCount,
    questionTypeMix,
    maxScore: totalCount * 15 // Approximate: coding problems worth more
  });

  try {
    const result = await generateWithRetry(
      client,
      GEMINI_MODEL,
      prompt,
      CODING_RESPONSE_SCHEMA,
      CodingQuestionSchema,
      totalCount
    );

    return result;
  } catch (error) {
    console.error("Coding question generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during coding question generation"
    };
  }
}

/**
 * Generate questions with retry logic and validation
 */
async function generateWithRetry<T>(
  client: any,
  model: string,
  prompt: string,
  responseSchema: any,
  zodSchema: ZodSchema<T>,
  expectedCount: number,
  maxRetries: number = 1
): Promise<GenerationResult<T>> {
  let lastError: Error | null = null;
  let isValidationRetry = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use the correct API: ai.models.generateContent()
      const result = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.8,
          topP: 0.95,
        },
      });

      const text = result.text;
      
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Response missing 'questions' array");
      }

      // Validate each question against Zod schema
      const validatedQuestions: T[] = [];
      const validationErrors: string[] = [];

      for (let i = 0; i < parsed.questions.length; i++) {
        const item = parsed.questions[i];
        
        try {
          // Extract the question object from the wrapper
          const questionData = item.question || item;
          const validated = zodSchema.parse(questionData);
          validatedQuestions.push(validated as T);
        } catch (validationError) {
          if (validationError instanceof ZodError) {
            validationErrors.push(
              `Question ${i + 1}: ${validationError.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
            );
          } else {
            validationErrors.push(`Question ${i + 1}: ${validationError}`);
          }
        }
      }

      // If we have validation errors on first attempt, retry with error correction
      if (validationErrors.length > 0 && attempt < maxRetries) {
        const errorPrompt = `${prompt}

PREVIOUS ATTEMPT HAD VALIDATION ERRORS:
${validationErrors.join('\n')}

Please fix these errors and regenerate ALL ${expectedCount} questions correctly.`;
        
        // Retry with error correction prompt (no delay needed — this is a prompt fix)
        prompt = errorPrompt;
        isValidationRetry = true;
        continue;
      }

      // If we still have errors after retries, return what we have
      if (validationErrors.length > 0) {
        console.warn(`Validation errors after ${maxRetries + 1} attempts:`, validationErrors);
      }

      // Check if we got the expected number of valid questions
      if (validatedQuestions.length === 0) {
        throw new Error(`No valid questions generated. Validation errors: ${validationErrors.join('; ')}`);
      }

      if (validatedQuestions.length < expectedCount) {
        console.warn(`Expected ${expectedCount} questions but only got ${validatedQuestions.length} valid ones`);
      }

      return {
        success: true,
        questions: validatedQuestions
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Generation attempt ${attempt + 1} failed:`, lastError);
      
      // If this is the last retry, break out
      if (attempt === maxRetries) {
        break;
      }

      // For server errors (503/429/etc), back off before retrying
      // Validation retries don't need a delay — they send a corrected prompt
      if (!isValidationRetry) {
        const delaySecs = 8;
        console.log(`[Retry] Waiting ${delaySecs}s before retry (server error backoff)...`);
        await new Promise((resolve) => setTimeout(resolve, delaySecs * 1000));
      }
      isValidationRetry = false;
    }
  }

  return {
    success: false,
    error: lastError?.message || "Generation failed after retries"
  };
}
