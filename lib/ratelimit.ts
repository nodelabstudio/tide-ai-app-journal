import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

/**
 * In-memory cache outside the handler avoids a Redis round-trip on every
 * hot request. See https://upstash.com/blog/nextjs-ratelimiting.
 */
const ephemeralCache = new Map<string, number>();

/** generatePrompt: 6 req/min per IP. */
export const generatePromptLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, "60 s"),
  analytics: true,
  prefix: "tide:gen-prompt",
  ephemeralCache,
});

/** weeklyPatterns: 2 req/hr per user (token-heavy). */
export const weeklyPatternsLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "60 m"),
  analytics: true,
  prefix: "tide:weekly",
  ephemeralCache,
});

/** reframe: 10 req/hr per IP. */
export const reframeLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 m"),
  analytics: true,
  prefix: "tide:reframe",
  ephemeralCache,
});

/**
 * Daily hard cap: 40 AI calls per authenticated user per UTC day.
 * Enforced through the ai_call_counters table (see supabase migration),
 * not Redis — so a VPN-hopping user still hits the same row.
 */
export const DAILY_CAP_PER_USER = 40;
