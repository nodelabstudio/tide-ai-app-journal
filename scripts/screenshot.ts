/**
 * Headless screenshot capture for the README.
 *
 * Flow:
 *   1. Service-role client creates (or refreshes) a `screenshot-bot` user
 *   2. Wipes + seeds 5 well-crafted entries within the last 7 days
 *   3. Generates a magic link via admin.generateLink — no email round-trip
 *   4. Playwright navigates the link → /auth/callback → /today (signed in)
 *   5. Captures /today, /timeline (with Reframe expanded),
 *      /patterns, /settings (Midnight mode), /login
 *
 * Run: `pnpm screenshots` (with `pnpm dev` running on :3000 in another shell).
 */

import {
  createClient as createSupabase,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

type Admin = SupabaseClient;

const APP_URL = process.env.SCREENSHOT_APP_URL ?? "http://localhost:3000";
const OUT_DIR = resolve("docs/screenshots");
const BOT_EMAIL = "screenshot-bot@tide.local";
const VIEWPORT = { width: 440, height: 900 } as const;

interface SeedEntry {
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  hoursAgo: number;
}

const SEED_ENTRIES: SeedEntry[] = [
  {
    hoursAgo: 132,
    mood: 3,
    content:
      "Late evening walk through the park. Quiet wind, no thoughts worth recording, which is itself worth recording. Sometimes a day is just transit between two better days.",
  },
  {
    hoursAgo: 98,
    mood: 5,
    content:
      "First time the timeline animation actually felt right — the specular highlight catching scroll position on the third row was the moment I knew the rest of the app would be possible. Months of small CSS taste compounding into one second of pure satisfaction.",
  },
  {
    hoursAgo: 74,
    mood: 3,
    content:
      "Reread some of last month's entries and noticed I'd been circling the same question about scope for three weeks without naming it. Naming it today: I'm scared I'm building something only I can love. Sitting with that instead of solving it.",
  },
  {
    hoursAgo: 27,
    mood: 4,
    content:
      "Finished the second pass on the auth flow before lunch. The thing that surprised me is how much friction the magic-link UX removed — I thought it would feel less serious than passwords, but it's the opposite. People trust it because there's nothing to forget.",
  },
  {
    hoursAgo: 4,
    mood: 2,
    content:
      "Quiet morning. The cold has hung on longer than expected. Did the bare minimum of email triage and called it. Maybe today's job is just to not make tomorrow worse.",
  },
];

function isoFromHoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

async function ensureDevServer() {
  // Allow up to ~30s of warmup since the first request triggers route compile.
  const deadline = Date.now() + 30_000;
  let lastErr: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${APP_URL}/login`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return;
      lastErr = new Error(`status ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.error(
    `\n✗ Dev server not reachable at ${APP_URL}. Start it in another shell:\n  pnpm dev\n`,
  );
  throw lastErr;
}

async function ensureBot(supabase: Admin) {
  // Find existing user (paginate through admin.listUsers)
  let userId: string | null = null;
  let page = 1;
  while (page <= 5) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email === BOT_EMAIL);
    if (found) {
      userId = found.id;
      break;
    }
    if (data.users.length < 200) break;
    page++;
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: BOT_EMAIL,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`  + created ${BOT_EMAIL}`);
  } else {
    console.log(`  ✓ found ${BOT_EMAIL}`);
  }
  return userId;
}

async function reseed(
  supabase: Admin,
  userId: string,
) {
  await supabase.from("entries").delete().eq("user_id", userId);
  await supabase.from("ai_call_counters").delete().eq("user_id", userId);

  const rows = SEED_ENTRIES.map((e) => ({
    user_id: userId,
    content: e.content,
    mood: e.mood,
    created_at: isoFromHoursAgo(e.hoursAgo),
    updated_at: isoFromHoursAgo(e.hoursAgo),
  }));
  const { error } = await supabase.from("entries").insert(rows);
  if (error) throw error;
  console.log(`  ✓ seeded ${rows.length} entries`);
}

async function getEmailOtp(supabase: Admin): Promise<string> {
  // admin.generateLink returns an implicit-flow URL we can't use against
  // our PKCE callback, but it ALSO returns the raw email_otp — and that
  // we can verify server-side via /api/dev/sign-in-otp.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: BOT_EMAIL,
  });
  if (error) throw error;
  const otp = data.properties?.email_otp;
  if (!otp) throw new Error("no email_otp returned");
  return otp;
}

async function main() {
  await ensureDevServer();

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  console.log("→ Provisioning screenshot user");
  const userId = await ensureBot(supabase);
  await reseed(supabase, userId);

  console.log("→ Generating one-time OTP via admin");
  const otp = await getEmailOtp(supabase);

  mkdirSync(OUT_DIR, { recursive: true });

  console.log("→ Launching headless browser");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await context.newPage();

  // Hide Next.js dev-mode UI from every screenshot: build-status badge,
  // route announcer, dev tools button. They're rendered into shadow-DOM
  // portals at the document root with `nextjs` data attributes.
  const HIDE_DEV_UI = `
    nextjs-portal,
    [data-nextjs-toast],
    [data-nextjs-dev-tools-button],
    [data-nextjs-router-tree-button],
    #__next-build-watcher,
    #__nextjs_original-stack-frame { display: none !important; }
  `;
  await context.addInitScript((css: string) => {
    const tag = () => {
      const el = document.createElement("style");
      el.textContent = css;
      document.documentElement.appendChild(el);
    };
    if (document.documentElement) tag();
    else
      document.addEventListener("DOMContentLoaded", tag, { once: true });
  }, HIDE_DEV_UI);

  console.log("→ Signing in via /api/dev/sign-in-otp");
  await page.goto(`${APP_URL}/login`, { waitUntil: "networkidle" });
  const signInResult = await page.evaluate(
    async ({ email, token }) => {
      const res = await fetch("/api/dev/sign-in-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      return { ok: res.ok, status: res.status, body: await res.text() };
    },
    { email: BOT_EMAIL, token: otp },
  );
  if (!signInResult.ok) {
    throw new Error(
      `Sign-in failed (${signInResult.status}): ${signInResult.body}`,
    );
  }
  console.log("  ✓ session cookies set");

  // /today — wait for prompt to render past the SEED_PROMPT fallback if Groq responds in time
  console.log("→ /today");
  await page.goto(`${APP_URL}/today`, { waitUntil: "networkidle" });
  if (!page.url().endsWith("/today")) {
    throw new Error(
      `Expected /today after sign-in, currently at ${page.url()}`,
    );
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT_DIR}/today.png` });

  // /timeline — click first Reframe button to capture an in-context AI response
  console.log("→ /timeline (with Reframe expanded)");
  await page.goto(`${APP_URL}/timeline`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const reframeButtons = page.locator('button:has-text("Reframe")');
  const reframeCount = await reframeButtons.count();
  if (reframeCount > 0) {
    await reframeButtons.first().click();
    // Wait for italic question to appear (or error pill)
    await page
      .waitForSelector('p.italic, button:has-text("Tap to retry")', {
        timeout: 12000,
      })
      .catch(() => {
        console.warn("  ! reframe didn't resolve in time, capturing anyway");
      });
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `${OUT_DIR}/timeline.png` });

  // /patterns — wait long enough for weekly synthesis to render
  console.log("→ /patterns");
  await page.goto(`${APP_URL}/patterns`, { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT_DIR}/patterns.png` });

  // /settings — flip to Midnight, capture
  console.log("→ /settings (Midnight mode)");
  await page.goto(`${APP_URL}/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Midnight")').first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/settings.png` });

  // /login — clear cookies AND localStorage (the theme bootstrap reads it),
  // then reload so the page boots in light mode for a clean auth-free shot.
  console.log("→ /login");
  await context.clearCookies();
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(`${APP_URL}/login`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/login.png` });

  await browser.close();

  console.log(`\n✓ Wrote 5 screenshots to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("\n✗ Screenshot run failed:", err);
  process.exit(1);
});
