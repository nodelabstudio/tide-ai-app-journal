import { PromptCard } from "@/components/prompts/PromptCard";
import { generatePrompt } from "@/lib/ai/generatePrompt";
import { AICapError } from "@/lib/ai/_shared";
import { entryDaysSince } from "@/lib/queries/entries";

export const dynamic = "force-dynamic";

// Used when Groq is capped or unreachable, so the UI never breaks.
const SEED_PROMPT =
  "What is one thing you noticed today that you almost let pass — and what made it worth catching?";

const GREETING_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function greetingForHour(hour: number): string {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

async function fetchPrompt(): Promise<string> {
  try {
    const { prompt } = await generatePrompt();
    return prompt;
  } catch (err) {
    if (err instanceof AICapError) {
      // Cap reached → keep the seed; not worth surfacing as an error.
      return SEED_PROMPT;
    }
    console.warn("[today] prompt fallback:", (err as Error).message);
    return SEED_PROMPT;
  }
}

export default async function TodayPage() {
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const dateLine = GREETING_FMT.format(now);

  const [prompt, entryDays] = await Promise.all([
    fetchPrompt(),
    entryDaysSince(13),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium tracking-[0.18em] tabular-nums uppercase opacity-50">
          {dateLine}
        </span>
        <h1 className="font-display text-[34px] leading-[40px] font-semibold tracking-[-0.022em]">
          {greeting}.
        </h1>
      </header>

      <PromptCard prompt={prompt} entryDays={entryDays} today={now} />
    </section>
  );
}
