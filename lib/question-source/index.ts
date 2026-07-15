import type { QuestionSource, QuestionSourceMode } from "./types";
import { aiSource } from "./ai-source";
import { staticSource } from "./static-source";

// Two INDEPENDENT switches — MCQ and coding don't have to run the same mode.
// This is what lets you do "MCQ always static, coding always live AI" (or
// any other combination) instead of being forced into one shared setting.
//
//   MCQ_SOURCE_MODE=static
//   CODING_SOURCE_MODE=ai
//
// Both fall back to QUESTION_SOURCE_MODE if their specific var isn't set,
// and both fall back to "hybrid" if neither is set — so existing .env files
// using the old single QUESTION_SOURCE_MODE keep working unchanged.
const MCQ_MODE = (process.env.MCQ_SOURCE_MODE ||
  process.env.QUESTION_SOURCE_MODE ||
  "hybrid") as QuestionSourceMode;
const CODING_MODE = (process.env.CODING_SOURCE_MODE ||
  process.env.QUESTION_SOURCE_MODE ||
  "hybrid") as QuestionSourceMode;

// ── Circuit breaker for the "hybrid" mode ──────────────────────────────────
// Gemini's free-tier RPD (requests-per-day) exhaustion and genuine transient
// 503 "high demand" errors are NOT reliably distinguishable by status code
// alone (confirmed from real logs: both surface as 503 UNAVAILABLE). Retrying
// blindly on RPD exhaustion just burns more of the daily quota for nothing.
//
// Strategy: after a Gemini call fails, open the circuit (skip AI entirely,
// go straight to static) for a cooldown window. This is in-memory and scoped
// to the running server process — fine for a local single-user dev setup.
// If you deploy this or run multiple instances, replace with a DB-backed flag.
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours — comfortably less than a day,
                                          // long enough to stop burning quota on a bad day
let circuitOpenUntil: number | null = null;

function isCircuitOpen(): boolean {
  return circuitOpenUntil !== null && Date.now() < circuitOpenUntil;
}

function tripCircuit(reason: string) {
  circuitOpenUntil = Date.now() + COOLDOWN_MS;
  console.warn(
    `[question-source] Circuit opened until ${new Date(circuitOpenUntil).toISOString()} ` +
    `— falling back to static bank for all sections. Reason: ${reason}`
  );
}

// No backoff-and-retry here on purpose — retrying against an exhausted daily
// quota just spends more of it for no benefit; a single fast failure into
// the static fallback (when in hybrid mode) is strictly better.

export function getQuestionSource(): QuestionSource {
  return {
    async getMCQQuestions(params) {
      if (MCQ_MODE === "ai") return aiSource.getMCQQuestions(params);
      if (MCQ_MODE === "static") return staticSource.getMCQQuestions(params);

      // hybrid
      if (isCircuitOpen()) return staticSource.getMCQQuestions(params);
      try {
        return await aiSource.getMCQQuestions(params);
      } catch (err) {
        tripCircuit(err instanceof Error ? err.message : String(err));
        return staticSource.getMCQQuestions(params);
      }
    },

    async getCodingQuestions(params) {
      if (CODING_MODE === "ai") return aiSource.getCodingQuestions(params);
      if (CODING_MODE === "static") return staticSource.getCodingQuestions(params);

      // hybrid — only consults the shared circuit if coding is ALSO running
      // in hybrid mode. If CODING_SOURCE_MODE=ai explicitly, coding always
      // calls Gemini directly regardless of whether MCQ's circuit is open —
      // an explicit "ai" mode means "always try AI," full stop, no fallback.
      if (isCircuitOpen()) return staticSource.getCodingQuestions(params);
      try {
        return await aiSource.getCodingQuestions(params);
      } catch (err) {
        tripCircuit(err instanceof Error ? err.message : String(err));
        return staticSource.getCodingQuestions(params);
      }
    },
  };
}

export { aiSource, staticSource };
export type { QuestionSource, QuestionSourceMode };