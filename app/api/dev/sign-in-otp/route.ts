import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * DEV-ONLY sign-in by email+OTP, used by scripts/screenshot.ts to authenticate
 * the screenshot bot without going through an inbox round-trip. Calls
 * supabase.auth.verifyOtp(), which sets the proper session cookies through
 * our cookie adapter.
 *
 * Refuses to run in production. Even if it ran, the caller still needs an
 * email + email_otp pair, which can only be obtained via admin.generateLink
 * (which requires the service-role key).
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let email: string;
  let token: string;
  try {
    const body = (await req.json()) as { email?: unknown; token?: unknown };
    if (typeof body.email !== "string" || typeof body.token !== "string") {
      return NextResponse.json(
        { error: "email and token required" },
        { status: 400 },
      );
    }
    email = body.email;
    token = body.token;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "magiclink",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
