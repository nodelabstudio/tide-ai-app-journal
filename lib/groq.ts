import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Primary model: llama-3.3-70b-versatile.
 * Fallback used when the primary returns a 5xx or rate-limit error: qwen3-32b.
 *
 * Both run on Groq's LPU and stream at ~300-1000 tok/s.
 */
export const MODEL_PRIMARY = "llama-3.3-70b-versatile" as const;
export const MODEL_FALLBACK = "qwen3-32b" as const;

export type GroqModel = typeof MODEL_PRIMARY | typeof MODEL_FALLBACK;
