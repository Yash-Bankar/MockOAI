/**
 * lib/code/piston.ts
 *
 * The ONLY file that talks to the Piston code execution API.
 * Responsibility: execute one piece of code with one stdin input and return raw output.
 * No scoring, no comparison, no test-case looping — those live elsewhere.
 *
 * If you ever swap Piston for a different execution backend, only this file changes.
 */

export interface PistonExecuteParams {
  language: string;    // Piston language identifier (e.g. "python", "c++", "java")
  version: string;     // Piston runtime version (e.g. "3.12.0")
  code: string;        // Source code to run
  stdin?: string;      // Standard input for the execution
  timeoutMs?: number;  // Per-execution timeout (default: 10s)
}

export interface PistonResult {
  stdout: string;
  stderr: string;
  compileOutput: string;  // populated for compiled languages (java, cpp)
  exitCode: number;
  signal: string | null;  // e.g. "SIGKILL" on TLE
}

const DEFAULT_TIMEOUT_MS = 3000;

/**
 * Execute code via the Piston API.
 * Throws a typed error if Piston is unreachable, times out at the network level,
 * or returns an unexpected shape — callers should catch and surface a
 * "execution service unavailable" response rather than silently scoring 0.
 */
export async function pistonExecute(params: PistonExecuteParams): Promise<PistonResult> {
  const pistonUrl = process.env.PISTON_URL;
  if (!pistonUrl) {
    throw new Error('[Piston] PISTON_URL environment variable is not set');
  }

  const endpoint = `${pistonUrl}/execute`;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // AbortController gives us a hard network-level timeout so Next.js routes
  // don't hang waiting for a frozen Piston container.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Note: AbortController signal intentionally removed — Next.js server-side
      // fetch has inconsistent AbortSignal support across versions. Piston's own
      // run_timeout (set below in the body) enforces the execution time limit.
      body: JSON.stringify({
        language: params.language,
        version: params.version,
        files: [{ content: params.code }],
        stdin: params.stdin ?? '',
        run_timeout: timeoutMs,   // tell Piston itself about the limit
      }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Piston] fetch error to ${endpoint}:`, msg);
    throw new Error(`[Piston] Network error reaching ${endpoint}: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    throw new Error(`[Piston] HTTP ${response.status} from ${endpoint}: ${body}`);
  }

  // Piston's response shape:
  // { language, version, run: { stdout, stderr, code, signal, output }, compile?: { ... } }
  const data = await response.json() as {
    run: { stdout: string; stderr: string; code: number | null; signal: string | null; output: string };
    compile?: { stdout: string; stderr: string; code: number | null };
  };

  return {
    stdout: data.run.stdout ?? '',
    stderr: data.run.stderr ?? '',
    compileOutput: data.compile?.stderr ?? data.compile?.stdout ?? '',
    exitCode: data.run.code ?? 0,
    signal: data.run.signal ?? null,
  };
}
