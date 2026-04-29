import { NextResponse } from "next/server";
import { weeklyPatterns } from "@/lib/ai/weeklyPatterns";
import { AICapError, AIUnauthError } from "@/lib/ai/_shared";
import { weeklyPatternsLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  // weeklyPatterns is cap-heavy, so the sliding window is keyed on user
  // (not IP) — a VPN-hopping user can't drain the daily cap by re-running.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { success } = await weeklyPatternsLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Already refreshed twice this hour." },
      { status: 429 },
    );
  }

  try {
    const summary = await weeklyPatterns();
    if (!summary) {
      return NextResponse.json({ summary: null }, { status: 200 });
    }
    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof AIUnauthError) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    if (err instanceof AICapError) {
      return NextResponse.json(
        { error: "Daily AI cap reached." },
        { status: 429 },
      );
    }
    console.error("[api.weekly-patterns]", err);
    return NextResponse.json(
      { error: "Couldn't summarize the week." },
      { status: 500 },
    );
  }
}
