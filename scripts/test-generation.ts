/**
 * Standalone test script to verify question generation pipeline
 * Tests: Gemini API connectivity, structured output, Zod validation, response quality
 * 
 * Usage: npx tsx scripts/test-generation.ts
 */

// Load environment variables
import { config } from "dotenv";
config();

import { generateMCQQuestions, generateCodingQuestions } from "../lib/question-generator";

// Mock questionTypeMix for English section (MCQ)
const mockEnglishTypeMix = {
  "Fill in the Blank": { count: 2, description: "Fill in the blank questions" },
  "Error Detection": { count: 2, description: "Error detection questions" },
  "Reading Comprehension": { count: 1, description: "Reading comprehension questions" },
};

// Mock questionTypeMix for Coding section
const mockCodingTypeMix = {
  "Coding 1": { count: 1, description: "Easy coding problem" },
  "Coding 2": { count: 1, description: "Medium coding problem" },
};

async function testMCQGeneration() {
  console.log("\n=== Testing MCQ Generation ===\n");
  
  try {
    const startTime = Date.now();
    const result = await generateMCQQuestions("English", mockEnglishTypeMix, 5);
    const duration = Date.now() - startTime;

    if (!result.success) {
      throw new Error(`Generation failed: ${result.error}`);
    }

    const questions = result.questions!;

    console.log(`✓ Generation completed in ${duration}ms`);
    console.log(`✓ Generated ${questions.length} questions`);
    console.log(`✓ Zod validation passed for all questions\n`);

    // Display sample question for quality check
    const sample = questions[0];
    console.log("Sample MCQ Question:");
    console.log("━".repeat(80));
    console.log(`Type: ${sample.subType}`);
    console.log(`Difficulty: ${sample.difficulty}`);
    console.log(`\nPrompt: ${sample.promptText}`);
    console.log(`\nOptions:`);
    sample.options?.forEach((opt: any) => {
      const marker = opt.id === sample.correctOptionId ? "✓" : " ";
      console.log(`  ${marker} ${opt.id}. ${opt.text}`);
    });
    console.log(`\nExplanation: ${sample.explanation}`);
    console.log("━".repeat(80));

    return true;
  } catch (error) {
    console.error("✗ MCQ Generation failed:");
    console.error(error);
    return false;
  }
}

async function testCodingGeneration() {
  console.log("\n=== Testing Coding Question Generation ===\n");

  try {
    const startTime = Date.now();
    const result = await generateCodingQuestions("Language Coding", mockCodingTypeMix, 2);
    const duration = Date.now() - startTime;

    if (!result.success) {
      throw new Error(`Generation failed: ${result.error}`);
    }

    const questions = result.questions!;

    console.log(`✓ Generation completed in ${duration}ms`);
    console.log(`✓ Generated ${questions.length} coding questions`);
    console.log(`✓ Zod validation passed for all questions\n`);

    // Display sample coding question for quality check
    const sample = questions[0];

    console.log("Sample Coding Question:");
    console.log("━".repeat(80));
    console.log(`Type: ${sample.subType}`);
    console.log(`Difficulty: ${sample.difficulty}`);
    console.log(`Time Limit: ${sample.timeLimitMs}ms`);
    console.log(`\nProblem Statement:\n${sample.promptText}`);
    console.log(`\nConstraints:\n${sample.constraints}`);
    console.log(`\nExamples (${sample.examples.length}):`);
    sample.examples.forEach((ex: any, i: number) => {
      console.log(`  Example ${i + 1}:`);
      console.log(`    Input: ${ex.input}`);
      console.log(`    Output: ${ex.output}`);
      console.log(`    Explanation: ${ex.explanation}`);
    });
    console.log(`\nVisible Test Cases: ${sample.visibleTestCases.length}`);
    console.log(`Hidden Test Cases: ${sample.hiddenTestCases.length}`);
    console.log(`\nStarter Code Languages: ${Object.keys(sample.starterCode).join(", ")}`);
    console.log(`\nReference Solution (Python):`);
    console.log("```python");
    console.log(sample.referenceSolution);
    console.log("```");
    console.log("━".repeat(80));

    return true;
  } catch (error) {
    console.error("✗ Coding Generation failed:");
    console.error(error);
    return false;
  }
}

async function main() {
  console.log("Question Generation Pipeline Test");
  console.log("=".repeat(80));
  console.log(`Model: ${process.env.GEMINI_MODEL || "gemini-3.5-flash"}`);
  console.log(`API Key: ${process.env.GEMINI_API_KEY?.substring(0, 20)}...`);
  
  const mcqSuccess = await testMCQGeneration();
  const codingSuccess = await testCodingGeneration();

  console.log("\n" + "=".repeat(80));
  console.log("Test Results:");
  console.log(`  MCQ Generation: ${mcqSuccess ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`  Coding Generation: ${codingSuccess ? "✓ PASS" : "✗ FAIL"}`);
  console.log("=".repeat(80));

  process.exit(mcqSuccess && codingSuccess ? 0 : 1);
}

main();
