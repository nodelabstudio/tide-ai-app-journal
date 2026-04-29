"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateEntryState {
  error?: string;
  success?: boolean;
}

const MIN = 1;
const MAX = 20_000;

/**
 * Insert one entry for the signed-in user. RLS policy "entries: owner can
 * insert" guarantees we can only write rows where user_id matches auth.uid().
 */
export async function createEntry(
  _prev: CreateEntryState,
  formData: FormData,
): Promise<CreateEntryState> {
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < MIN) {
    return { error: "Write a few words before saving." };
  }
  if (content.length > MAX) {
    return { error: "Entry is too long — keep it under 20,000 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expired. Sign in again." };

  const moodRaw = formData.get("mood");
  const mood =
    typeof moodRaw === "string" && /^[1-5]$/.test(moodRaw)
      ? Number(moodRaw)
      : null;

  const { error } = await supabase.from("entries").insert({
    user_id: user.id,
    content,
    mood,
  });

  if (error) {
    console.error("[entries.create]", error.message);
    return { error: "Couldn't save that one. Try again?" };
  }

  revalidatePath("/today");
  revalidatePath("/timeline");
  return { success: true };
}
