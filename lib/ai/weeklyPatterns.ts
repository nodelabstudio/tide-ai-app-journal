import "server-only";

import { Redis } from "@upstash/redis";
import { WEEKLY_PATTERNS_SYSTEM } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { bumpDailyCap, requireUser, tryGroq } from "@/lib/ai/_shared";
import type { WeatherIcon } from "@/components/patterns/WeeklySummary";

const redis = Redis.fromEnv();
const CACHE_TTL_SECONDS = 24 * 60 * 60;

export interface WeeklySummary {
  themes: string[];
  weather: string;
  reframe: string;
  weatherIcon: WeatherIcon;
  /** ISO range string like "Apr 22 — Apr 28". */
  range: string;
  /** Number of entries the summary was computed over. */
  entryCount: number;
}

const RANGE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatRange(start: Date, end: Date): string {
  return `${RANGE_FMT.format(start)} — ${RANGE_FMT.format(end)}`;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Crude lexical map from the model's emotional-weather sentence to a glyph. */
function inferIcon(weather: string): WeatherIcon {
  const w = weather.toLowerCase();
  if (/(grow|bloom|tender|new|spring|fresh|gentle)/.test(w)) return "leaf";
  if (/(climb|hard|effort|push|strain|challenge|endure|heavy)/.test(w))
    return "mountain";
  if (/(focus|inward|quiet|still|alone|reflect|deep|narrow)/.test(w))
    return "candle";
  return "wave";
}

interface CachedShape {
  themes: string[];
  weather: string;
  reframe: string;
  weatherIcon: WeatherIcon;
  range: string;
  entryCount: number;
}

/**
 * Returns the weekly synthesis for the signed-in user. Cached for 24h in
 * Upstash keyed by (userId, isoDay) — same calendar day always returns the
 * same answer, doesn't burn the daily AI cap on refresh.
 *
 * Returns null when the user has fewer than 2 entries this week (not enough
 * signal to summarize) or when the cap is reached and there is no cache hit.
 */
export async function weeklyPatterns(): Promise<WeeklySummary | null> {
  const user = await requireUser();
  const today = new Date();
  const cacheKey = `tide:weekly:${user.id}:${isoDay(today)}`;

  const cached = await redis.get<CachedShape>(cacheKey);
  if (cached) return cached;

  const supabase = await createClient();
  const since = new Date(today);
  since.setDate(today.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const { data: entries } = await supabase
    .from("entries")
    .select("content, created_at, mood")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (!entries || entries.length < 2) return null;

  await bumpDailyCap(user.id);

  const corpus = entries
    .map(
      (e, i) =>
        `[#${i + 1} · ${e.created_at.slice(0, 10)}${
          e.mood ? ` · mood ${e.mood}/5` : ""
        }] ${e.content}`,
    )
    .join("\n\n---\n\n");

  const { text } = await tryGroq({
    messages: [
      { role: "system", content: WEEKLY_PATTERNS_SYSTEM },
      { role: "user", content: corpus },
    ],
    maxTokens: 400,
    temperature: 0.6,
    json: true,
  });

  let parsed: { themes?: unknown; weather?: unknown; reframe?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    console.warn("[ai.weekly] non-JSON output:", text.slice(0, 120));
    return null;
  }

  const themes = Array.isArray(parsed.themes)
    ? parsed.themes
        .filter((t): t is string => typeof t === "string")
        .slice(0, 4)
    : [];
  const weather =
    typeof parsed.weather === "string" ? parsed.weather.trim() : "";
  const reframe =
    typeof parsed.reframe === "string" ? parsed.reframe.trim() : "";

  if (!themes.length || !weather || !reframe) {
    console.warn("[ai.weekly] missing keys in JSON:", parsed);
    return null;
  }

  const summary: CachedShape = {
    themes,
    weather,
    reframe,
    weatherIcon: inferIcon(weather),
    range: formatRange(since, today),
    entryCount: entries.length,
  };

  await redis.set(cacheKey, summary, { ex: CACHE_TTL_SECONDS });
  return summary;
}
