import { NextResponse } from "next/server";
import { reframe, EntryNotFoundError } from "@/lib/ai/reframe";
import {
  AICapError,
  AIUnauthError,
  requireUser,
} from "@/lib/ai/_shared";
import { reframeLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Resolve auth (and the cookies() read it depends on) FIRST, before
  // anything that could disrupt the request's async-storage context.
  // Specifically: `await req.json()` further down would otherwise eat
  // the cookies scope and createClient() inside reframe() would throw.
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof AIUnauthError) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    console.error("[api.reframe.auth]", err);
    return NextResponse.json(
      { error: "Couldn't reframe that one." },
      { status: 500 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const { success } = await reframeLimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many reframes. Try again in a bit." },
      { status: 429 },
    );
  }

  let entryId: string;
  try {
    const body = (await req.json()) as { entryId?: unknown };
    if (typeof body.entryId !== "string" || body.entryId.length < 8) {
      return NextResponse.json(
        { error: "Missing entryId." },
        { status: 400 },
      );
    }
    entryId = body.entryId;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const result = await reframe(user.id, entryId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EntryNotFoundError) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    if (err instanceof AICapError) {
      return NextResponse.json(
        { error: "Daily AI cap reached." },
        { status: 429 },
      );
    }
    console.error("[api.reframe]", err);
    return NextResponse.json(
      { error: "Couldn't reframe that one." },
      { status: 500 },
    );
  }
}
