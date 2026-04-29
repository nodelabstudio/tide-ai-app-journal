import "server-only";

import { REFRAME_SYSTEM } from "@/lib/prompts";
import { createServiceClient } from "@/lib/supabase/server";
import { bumpDailyCap, tryGroq } from "@/lib/ai/_shared";

export class EntryNotFoundError extends Error {
  constructor() {
    super("Entry not found or not owned");
    this.name = "EntryNotFoundError";
  }
}

export interface ReframeResult {
  question: string;
  model: string;
}

/**
 * Generate one gentle reframing question for a single entry.
 *
 * Takes a pre-resolved userId rather than re-reading cookies. Auth must
 * be performed by the caller (the route handler) BEFORE the request body
 * is consumed — Next 15 loses async context for cookies() after req.json(),
 * so we resolve the user once at the route boundary and thread it through.
 *
 * Uses the service-role client + manual user_id filter for ownership,
 * which is equivalent to relying on RLS (the entry must be owned by
 * the supplied userId) without needing a second cookies() call.
 */
export async function reframe(
  userId: string,
  entryId: string,
): Promise<ReframeResult> {
  const supabase = createServiceClient();
  const { data: entry } = await supabase
    .from("entries")
    .select("id, content")
    .eq("id", entryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!entry) throw new EntryNotFoundError();

  await bumpDailyCap(userId);

  const { text, model } = await tryGroq({
    messages: [
      { role: "system", content: REFRAME_SYSTEM },
      { role: "user", content: entry.content },
    ],
    maxTokens: 96,
    temperature: 0.8,
  });

  const cleaned = text
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return { question: cleaned, model };
}
