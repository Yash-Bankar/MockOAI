import { GoogleGenAI } from "@google/genai";

// Lazy initialization of the GoogleGenAI client
let genaiInstance: GoogleGenAI | null = null;

export function getGenaiClient(): GoogleGenAI {
  if (!genaiInstance) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    genaiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genaiInstance;
}

// Model configuration - overridable via env for when model names get retired
// gemini-2.5-flash: confirmed GA, stable, free-tier eligible as of July 2026
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
