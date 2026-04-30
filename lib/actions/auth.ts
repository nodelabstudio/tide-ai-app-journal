"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SendCodeState {
  error?: string;
  success?: boolean;
  email?: string;
}

export interface VerifyCodeState {
  error?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[0-9]{6}$/;

/**
 * Step 1: send a 6-digit OTP code to the user's email.
 *
 * Supabase's "Magic Link" email template must include {{ .Token }} so the
 * user receives the code as plain text. (See dashboard → Authentication →
 * Email Templates → Magic Link.) When `emailRedirectTo` is omitted from the
 * call, Supabase still sends an email; the template determines whether
 * users see a clickable link, a code, or both.
 *
 * Why OTP code instead of magic link: the magic-link PKCE flow stores a
 * `code_verifier` cookie that iOS Safari's tracking-prevention can evict
 * before the user clicks the link, breaking sign-in on mobile. The 6-digit
 * code never leaves the browser tab, so there's nothing to evict.
 */
export async function sendCode(
  _prev: SendCodeState,
  formData: FormData,
): Promise<SendCodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "That doesn't look like an email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) return { error: error.message, email };
  return { success: true, email };
}

/**
 * Step 2: verify the 6-digit code typed back into the form. Sets the
 * session cookie via the cookie adapter and redirects to /today on success.
 */
export async function verifyCode(
  _prev: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "")
    .replace(/\s+/g, "")
    .trim();

  if (!EMAIL_RE.test(email)) {
    return { error: "Email missing — start again.", email };
  }
  if (!CODE_RE.test(token)) {
    return { error: "Enter the 6-digit code.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return {
      error:
        "That code didn't work. It may have expired — request a new one.",
      email,
    };
  }

  // redirect() throws NEXT_REDIRECT; useActionState handles the navigation.
  // The session cookie set above is attached to the redirect response.
  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
