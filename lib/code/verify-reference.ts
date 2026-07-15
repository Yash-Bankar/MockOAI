/**
 * lib/code/verify-reference.ts
 *
 * Runs a coding question's referenceSolution through Piston to fill in
 * expectedOutput for all test cases (visible + hidden).
 *
 * This is the Phase 7 step 8 that was previously stubbed with TODO.
 * Called from the /generate route after a coding question is stored in the DB,
 * so that by the time a student submits, the expectedOutput is already filled.
 *
 * Works identically for Gemini-generated and static-bank questions — both
 * produce the same CodingQuestion shape with expectedOutput absent at creation.
 */

import { pistonExecute } from './piston';
import { prisma } from '@/lib/prisma';

export interface TestCaseWithInput {
  input: string;
  expectedOutput?: string | null;
}

export interface VerificationResult {
  success: boolean;
  /** Parallel array to the input testCases — each entry is the stdout from referenceSolution */
  expectedOutputs: string[];
  error?: string;
}

/**
 * Execute referenceSolution (always Python) against all test cases and return
 * the expected outputs. The caller is responsible for persisting them.
 *
 * referenceSolution is always Python regardless of the question's starterCode
 * languages — Gemini and the static bank both store the reference in Python.
 */
export async function verifyReferenceSolution(
  referenceSolution: string,
  testCases: TestCaseWithInput[]
): Promise<VerificationResult> {
  const expectedOutputs: string[] = [];

  for (let i = 0; i < testCases.length; i++) {
    try {
      const result = await pistonExecute({
        language: 'python',
        version: '3.12.0',
        code: referenceSolution,
        stdin: testCases[i].input,
      });

      if (result.exitCode !== 0 || result.signal === 'SIGKILL') {
        return {
          success: false,
          expectedOutputs: [],
          error: `[verify-reference] Reference solution failed on test case ${i + 1}: exitCode=${result.exitCode} signal=${result.signal} stderr="${result.stderr}"`,
        };
      }

      expectedOutputs.push(result.stdout.trim());
    } catch (err) {
      return {
        success: false,
        expectedOutputs: [],
        error: `[verify-reference] Piston error on test case ${i + 1}: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return { success: true, expectedOutputs };
}

/**
 * Just-in-Time check: ensures a question has expectedOutputs computed.
 * If they are missing (e.g. older attempts), runs the reference solution now
 * and saves them to the DB.
 */
export async function ensureExpectedOutputs(
  questionId: string,
  meta: any
): Promise<{
  visibleTestCases: TestCaseWithInput[];
  hiddenTestCases: TestCaseWithInput[];
}> {
  const visible = (meta?.visibleTestCases ?? []) as TestCaseWithInput[];
  const hidden = (meta?.hiddenTestCases ?? []) as TestCaseWithInput[];
  
  const allTestCases = [...visible, ...hidden];
  
  // Check if any test case is missing an expectedOutput
  const needsVerification = allTestCases.some(tc => tc.expectedOutput === undefined || tc.expectedOutput === null);
  
  if (!needsVerification) {
    return { visibleTestCases: visible, hiddenTestCases: hidden };
  }
  
  console.log(`[verify-reference] JIT: Computing missing expectedOutputs for question ${questionId}`);
  
  if (!meta?.referenceSolution) {
    throw new Error('Cannot compute expectedOutputs: no referenceSolution available');
  }

  const verification = await verifyReferenceSolution(meta.referenceSolution, allTestCases);
  if (!verification.success) {
    throw new Error(`Reference solution verification failed: ${verification.error}`);
  }

  const patchedVisible = visible.map((tc, i) => ({
    ...tc,
    expectedOutput: verification.expectedOutputs[i],
  }));
  
  const patchedHidden = hidden.map((tc, i) => ({
    ...tc,
    expectedOutput: verification.expectedOutputs[visible.length + i],
  }));

  // Persist back to the DB so future runs don't have to compute this again
  await prisma.question.update({
    where: { id: questionId },
    data: {
      codingMeta: {
        ...meta,
        visibleTestCases: patchedVisible,
        hiddenTestCases: patchedHidden,
      },
    },
  });

  return {
    visibleTestCases: patchedVisible,
    hiddenTestCases: patchedHidden,
  };
}
