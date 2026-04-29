import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Safe to import from client components.
 * Auth is email magic link only (no passwords).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
