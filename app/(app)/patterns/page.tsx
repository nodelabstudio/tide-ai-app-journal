import Link from "next/link";
import { Card } from "@/components/glass/Card";
import { WeeklySummary } from "@/components/patterns/WeeklySummary";
import { weeklyPatterns } from "@/lib/ai/weeklyPatterns";
import { AICapError } from "@/lib/ai/_shared";

export const dynamic = "force-dynamic";

async function fetchSummary() {
  try {
    return await weeklyPatterns();
  } catch (err) {
    if (err instanceof AICapError) return "capped" as const;
    console.warn("[patterns] fallback:", (err as Error).message);
    return null;
  }
}

export default async function PatternsPage() {
  const summary = await fetchSummary();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium tracking-[0.18em] uppercase opacity-50">
          This week
        </span>
        <h1 className="font-display text-[34px] leading-[40px] font-semibold tracking-[-0.022em]">
          Patterns
        </h1>
      </header>

      {summary === "capped" ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-[15px] opacity-80">Today&apos;s AI cap is full.</p>
          <p className="text-[13px] opacity-55">
            Patterns refresh daily. Check back after midnight UTC.
          </p>
        </Card>
      ) : summary === null ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-[15px] opacity-80">Not enough yet.</p>
          <p className="text-[13px] opacity-55">
            Patterns appear once you&apos;ve written at least two entries this week.
          </p>
          <Link
            href="/today"
            className="text-[15px] font-medium"
            style={{ color: "var(--color-tide-blue)" }}
          >
            Start on Today →
          </Link>
        </Card>
      ) : (
        <WeeklySummary
          range={summary.range}
          weatherIcon={summary.weatherIcon}
          weatherText={summary.weather}
          themes={summary.themes}
          reframe={summary.reframe}
        />
      )}
    </section>
  );
}
