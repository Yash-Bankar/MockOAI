/**
 * lib/code/languages.ts
 *
 * Maps our language names (what the frontend sends) to Piston's
 * {language, version} identifiers.
 *
 * The frontend only ever sends "cpp" | "python" | "java".
 * This is the ONLY place that translation happens — routes and UI code
 * should never hard-code Piston language strings.
 *
 * Versions confirmed against the local Piston runtime list:
 *   curl http://localhost:2000/api/v2/runtimes
 */

export interface PistonLanguageSpec {
  language: string;  // Piston's language field (e.g. "c++", not "cpp")
  version: string;
}

export type SupportedLanguage = 'cpp' | 'python' | 'java';

const LANGUAGE_MAP: Record<SupportedLanguage, PistonLanguageSpec> = {
  cpp:    { language: 'c++',    version: '10.2.0' },
  python: { language: 'python', version: '3.12.0' },
  java:   { language: 'java',   version: '15.0.2' },
};

/**
 * Resolve a frontend language name to Piston's identifiers.
 * Throws if the language isn't supported — callers should surface a clear
 * error rather than silently sending a bad request to Piston.
 */
export function resolvePistonLanguage(language: string): PistonLanguageSpec {
  const spec = LANGUAGE_MAP[language as SupportedLanguage];
  if (!spec) {
    const supported = Object.keys(LANGUAGE_MAP).join(', ');
    throw new Error(
      `[languages] Unsupported language "${language}". Supported: ${supported}`
    );
  }
  return spec;
}

export { LANGUAGE_MAP };
