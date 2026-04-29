"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Magic-link sign-in. Supabase emails the user a one-tap link; clicking it
 * lands on /auth/callback?code=… which exchanges the code for a session.
 */
export async function signInWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "That doesn't look like an email." };
  }

  const supabase = await createClient();
  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    (hdrs.get("host") ? `https://${hdrs.get("host")}` : "http://localhost:3000");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/today`,
    },
  });

  if (error) return { error: error.message, email };
  return { success: true, email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
