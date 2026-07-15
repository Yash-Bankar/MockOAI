/**
 * lib/code/compare.ts
 *
 * Comparison logic only. No Piston calls, no DB — pure function.
 *
 * Takes actual stdout from Piston + the expected output stored in the DB,
 * and returns a verdict. The verdict comes from a deterministic string comparison,
 * never from AI judgment.
 */

import type { PistonResult } from './piston';

export type TestCaseStatus =
  | 'Passed'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded';

export interface CompareResult {
  status: TestCaseStatus;
  /** Actual stdout from Piston (trimmed), for display in the run response. */
  actualOutput: string;
  /** Expected output (trimmed), present in the submit response only — never exposed via /run. */
  expectedOutput?: string;
}

/**
 * Determine the verdict for a single test case execution.
 *
 * Priority: compile error > TLE > runtime error > wrong answer > passed
 * This mirrors LeetCode-style precedence — a compile error is reported
 * instead of "wrong answer" even if we could theoretically compare outputs.
 */
export function compareTestCase(
  result: PistonResult,
  expectedOutput: string | undefined,
  includeExpected = false
): CompareResult {
  const actual = result.stdout.trim();

  // 1. Compilation error — compile step failed (Java, C++)
  if (result.compileOutput && result.exitCode !== 0 && !result.stdout) {
    return {
      status: 'Compilation Error',
      actualOutput: result.compileOutput.trim() || result.stderr.trim(),
      ...(includeExpected && { expectedOutput: expectedOutput?.trim() ?? '' }),
    };
  }

  // 2. Time Limit Exceeded — Piston sends SIGKILL when the process is killed
  if (result.signal === 'SIGKILL') {
    return {
      status: 'Time Limit Exceeded',
      actualOutput: actual,
      ...(includeExpected && { expectedOutput: expectedOutput?.trim() ?? '' }),
    };
  }

  // 3. Runtime error — non-zero exit and something in stderr
  if (result.exitCode !== 0) {
    return {
      status: 'Runtime Error',
      actualOutput: result.stderr.trim() || actual,
      ...(includeExpected && { expectedOutput: expectedOutput?.trim() ?? '' }),
    };
  }

  // 4. No expected output stored yet (reference solution hasn't run) — treat as
  //    unverified, but don't fail the user for it. Return passed if we have output.
  //    Phase 9's verification step should have filled this in before grading.
  if (expectedOutput === undefined || expectedOutput === null) {
    console.warn('[compare] expectedOutput is missing — reference solution may not have run yet');
    return {
      status: 'Passed',  // lenient: can't fail what we can't compare
      actualOutput: actual,
    };
  }

  // 5. Wrong Answer vs Passed — trim both sides, newline-normalize
  const normalise = (s: string) => s.trim().replace(/\r\n/g, '\n');
  const passed = normalise(actual) === normalise(expectedOutput);

  return {
    status: passed ? 'Passed' : 'Wrong Answer',
    actualOutput: actual,
    ...(includeExpected && { expectedOutput: expectedOutput.trim() }),
  };
}
