import Link from "next/link";
import { EntryRow } from "@/components/timeline/EntryRow";
import { SpringStack } from "@/components/motion/SpringStack";
import { Card } from "@/components/glass/Card";
import { listRecentEntries } from "@/lib/queries/entries";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const entries = await listRecentEntries(50);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium tracking-[0.18em] uppercase opacity-50">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        <h1 className="font-display text-[34px] leading-[40px] font-semibold tracking-[-0.022em]">
          Timeline
        </h1>
      </header>

      {entries.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-[15px] opacity-70">No entries yet.</p>
          <Link
            href="/today"
            className="text-[15px] font-medium"
            style={{ color: "var(--color-tide-blue)" }}
          >
            Start on Today →
          </Link>
        </Card>
      ) : (
        <SpringStack stagger={0.04}>
          {entries.map((e) => (
            <EntryRow
              key={e.id}
              id={e.id}
              createdAt={e.created_at}
              mood={e.mood ?? undefined}
              content={e.content}
            />
          ))}
        </SpringStack>
      )}
    </section>
  );
}
