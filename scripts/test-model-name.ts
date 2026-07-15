/**
 * Quick test to validate Gemini model name and API connectivity
 * Usage: npx tsx scripts/test-model-name.ts
 */

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testModel(
  client: GoogleGenAI,
  modelName: string,
  timeoutMs: number
): Promise<boolean> {
  console.log(`\nTrying model: ${modelName} (timeout: ${timeoutMs / 1000}s)...`);
  try {
    const result = await Promise.race([
      client.models.generateContent({
        model: modelName,
        contents: "Say 'Hello' in one word only.",
        config: {
          temperature: 0.1,
          maxOutputTokens: 10,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
      ),
    ]);

    console.log(`✓ SUCCESS with ${modelName}`);
    console.log(`  Response: ${(result as any).text?.trim()}`);
    console.log(`\n  → Set in .env: GEMINI_MODEL="${modelName}"`);
    return true;
  } catch (error: any) {
    console.log(`✗ Failed: ${error.message}`);
    return false;
  }
}

async function testModelName() {
  console.log("Gemini API Connectivity Test");
  console.log("=".repeat(60));
  console.log(`API Key: ${process.env.GEMINI_API_KEY?.substring(0, 20)}...`);

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Primary target: gemini-2.5-flash (GA, confirmed free-tier eligible)
  // Test with generous 30s timeout to avoid false negatives
  const primary = await testModel(client, "gemini-2.5-flash", 30000);
  if (primary) {
    console.log("\n✅ Primary model gemini-2.5-flash is working. Use this.");
  }

  // Secondary: gemini-3.5-flash — previous test timed out at 10s (not a 404/quota error)
  // Retry with 30s to get a definitive answer
  console.log("\n--- Secondary model check ---");
  const secondary = await testModel(client, "gemini-3.5-flash", 30000);
  if (secondary) {
    console.log("  ↳ gemini-3.5-flash is also viable as an alternative.");
  }

  // Additional fallbacks (should 404 — retired models, here for reference only)
  if (!primary && !secondary) {
    console.log("\n--- Fallback sweep (retired models, expected to fail) ---");
    const fallbacks = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];
    for (const name of fallbacks) {
      await testModel(client, name, 10000);
    }

    console.log(
      "\n❌ All models failed. Check https://aistudio.google.com for real-time quota/tier status."
    );
  } else if (!primary) {
    console.log(
      "\n⚠️  gemini-2.5-flash failed but gemini-3.5-flash worked — update GEMINI_MODEL in .env accordingly."
    );
  }
}

testModelName();
