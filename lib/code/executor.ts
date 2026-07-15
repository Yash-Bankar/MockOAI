/**
 * lib/code/executor.ts
 *
 * Shared execute-and-compare loop used by both the /run and /submit routes.
 * Factored here so neither route duplicates the loop logic — both call this,
 * passing their own test cases.
 *
 * Only returns comparison results. DB writes and AI calls happen in the routes.
 */

import { pistonExecute } from './piston';
import { resolvePistonLanguage } from './languages';
import { compareTestCase } from './compare';
import type { CompareResult } from './compare';

export interface TestCase {
  input: string;
  expectedOutput?: string;
}

export interface ExecuteAllResult {
  results: CompareResult[];
  passedCount: number;
  totalCount: number;
}

/**
 * Execute code against an array of test cases sequentially (not parallel —
 * Piston on a local Docker container handles one execution at a time cleanly;
 * parallel calls can cause port contention on the free tier).
 *
 * @param code         Source code to execute
 * @param language     Frontend language name ("cpp" | "python" | "java")
 * @param testCases    Array of { input, expectedOutput? } from the DB
 * @param includeExpected  If true, include expectedOutput in each result (submit only, never for /run)
 */
export async function executeAgainstTestCases(
  code: string,
  language: string,
  testCases: TestCase[],
  includeExpected = false
): Promise<ExecuteAllResult> {
  const langSpec = resolvePistonLanguage(language);
  const results: CompareResult[] = [];

  for (const tc of testCases) {
    const pistonResult = await pistonExecute({
      language: langSpec.language,
      version: langSpec.version,
      code,
      stdin: tc.input,
    });

    const comparison = compareTestCase(pistonResult, tc.expectedOutput, includeExpected);
    results.push(comparison);
  }

  const passedCount = results.filter(r => r.status === 'Passed').length;

  return { results, passedCount, totalCount: testCases.length };
}
