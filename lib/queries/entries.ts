import { createClient } from "@/lib/supabase/server";

export interface Entry {
  id: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  created_at: string;
}

/** Most recent entries for the signed-in user, RLS scoped. */
export async function listRecentEntries(limit = 50): Promise<Entry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("id, content, mood, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[entries.list]", error.message);
    return [];
  }
  return (data ?? []) as Entry[];
}

/**
 * ISO day strings (YYYY-MM-DD) that have ≥1 entry, within the last `daysBack`
 * UTC days inclusive. Used by the /today calendar ribbon.
 */
export async function entryDaysSince(daysBack: number): Promise<string[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - daysBack);
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("entries")
    .select("created_at")
    .gte("created_at", since.toISOString());
  if (error) {
    console.error("[entries.days]", error.message);
    return [];
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    set.add(row.created_at.slice(0, 10));
  }
  return Array.from(set);
}
