import "server-only";

import {
  groq,
  MODEL_FALLBACK,
  MODEL_PRIMARY,
  type GroqModel,
} from "@/lib/groq";
import { DAILY_CAP_PER_USER } from "@/lib/ratelimit";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export class AICapError extends Error {
  constructor() {
    super("Daily AI cap reached");
    this.name = "AICapError";
  }
}

export class AIUnauthError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "AIUnauthError";
  }
}

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * Resolve the signed-in user or throw AIUnauthError.
 * Routes catch this and return 401; pages let it bubble (auth guard already
 * ran in (app)/layout, so this should be unreachable from a rendered page).
 */
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AIUnauthError();
  return { id: user.id, email: user.email ?? null };
}

/**
 * Atomically increment the user's per-day AI counter (server-defined cap).
 * Throws AICapError if already at or above the cap.
 *
 * Uses the service-role client because writes to ai_call_counters happen
 * via the security-definer SQL function, not authenticated direct writes.
 */
export async function bumpDailyCap(userId: string): Promise<number> {
  const service = createServiceClient();
  const { data, error } = await service.rpc("bump_ai_call_counter", {
    p_user_id: userId,
    p_cap: DAILY_CAP_PER_USER,
  });
  if (error) {
    console.error("[ai.cap]", error.message);
    throw new Error("Counter unavailable");
  }
  if (data == null) throw new AICapError();
  return data as number;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface TryGroqOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

export interface TryGroqResult {
  text: string;
  model: GroqModel;
}

/**
 * Call Groq with the primary model; on transient failure fall back to qwen3.
 * Throws if both fail.
 */
export async function tryGroq({
  messages,
  maxTokens = 256,
  temperature = 0.7,
  json = false,
}: TryGroqOptions): Promise<TryGroqResult> {
  const order: GroqModel[] = [MODEL_PRIMARY, MODEL_FALLBACK];
  let lastError: unknown = null;

  for (const model of order) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(json
          ? { response_format: { type: "json_object" as const } }
          : {}),
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return { text, model };
      lastError = new Error("Empty completion");
    } catch (err) {
      lastError = err;
      console.warn(`[ai.groq] ${model} failed:`, (err as Error).message);
    }
  }

  throw lastError ?? new Error("Groq unreachable");
}
