import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refreshes the Supabase session cookie on every matching request so RSCs
 * always see the current user. Per @supabase/ssr docs, the response object
 * must be the SAME instance modified by the cookies adapter — don't return
 * a fresh NextResponse, or set cookies will be dropped.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching getUser() forces a session refresh if the access token expired.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every request EXCEPT:
     *   - _next/static / _next/image (build assets)
     *   - favicon.ico, manifest, public icons & generated images
     *   - any file with an extension (e.g. .png, .svg, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|generated/|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
