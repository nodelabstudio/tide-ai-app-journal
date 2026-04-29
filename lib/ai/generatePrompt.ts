import "server-only";

import { GENERATE_PROMPT_SYSTEM } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { bumpDailyCap, requireUser, tryGroq } from "@/lib/ai/_shared";

export interface GeneratePromptResult {
  prompt: string;
  model: string;
}

const FIRST_DAY_FALLBACK_USER_MSG =
  "(this is the user's first day — no entries yet — produce a gentle opening prompt)";

/**
 * Generate one fresh reflection prompt based on the user's last 10 entries.
 * Pulls the entries via the authenticated client (RLS-scoped), assembles a
 * compact context block, and asks Groq for one question in the user's tone.
 *
 * Throws AICapError if the daily cap is reached, AIUnauthError if no session.
 */
export async function generatePrompt(): Promise<GeneratePromptResult> {
  const user = await requireUser();
  await bumpDailyCap(user.id);

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("entries")
    .select("content, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const userMsg =
    entries && entries.length > 0
      ? `Recent entries (most recent first):\n\n${entries
          .map((e, i) => `[${i + 1}] ${e.content}`)
          .join("\n\n---\n\n")}`
      : FIRST_DAY_FALLBACK_USER_MSG;

  const { text, model } = await tryGroq({
    messages: [
      { role: "system", content: GENERATE_PROMPT_SYSTEM },
      { role: "user", content: userMsg },
    ],
    maxTokens: 96,
    temperature: 0.85,
  });

  // Strip wrapping quotes / trailing punctuation from any over-eager model.
  const cleaned = text
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return { prompt: cleaned, model };
}
