import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Handles the magic-link redirect. Supabase appends ?code=… (PKCE) which we
 * exchange for a session cookie, then bounce to the originally-intended
 * destination via ?next=. On any error, route to /login with a flag so the
 * page can show a one-line message.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
