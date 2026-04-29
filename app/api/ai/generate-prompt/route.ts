import { NextResponse } from "next/server";
import { generatePrompt } from "@/lib/ai/generatePrompt";
import {
  AICapError,
  AIUnauthError,
} from "@/lib/ai/_shared";
import { generatePromptLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const { success } = await generatePromptLimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  try {
    const result = await generatePrompt();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIUnauthError) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    if (err instanceof AICapError) {
      return NextResponse.json(
        { error: "Daily AI cap reached. Resets at midnight UTC." },
        { status: 429 },
      );
    }
    console.error("[api.generate-prompt]", err);
    return NextResponse.json(
      { error: "Couldn't generate a prompt." },
      { status: 500 },
    );
  }
}
