"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/glass/Card";
import { EntryReframe } from "@/components/timeline/EntryReframe";

export interface EntryRowProps {
  id: string;
  /** ISO timestamp of the entry. */
  createdAt: string;
  content: string;
  /** Optional 1-5 mood scale. */
  mood?: 1 | 2 | 3 | 4 | 5;
}

const MOOD_COLORS: Record<NonNullable<EntryRowProps["mood"]>, string> = {
  1: "#7A8A9A",
  2: "#9AA8B6",
  3: "#B7B7BC",
  4: "#E0B57F",
  5: "#FF6B4A",
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/**
 * One entry on the /timeline tab.
 *
 * The Liquid Glass specular highlight tracks scroll position: as the row
 * progresses through the viewport (top edge entering at viewport bottom →
 * bottom edge exiting at viewport top), --lg-y is driven from 0.92 to 0.08,
 * and --lg-x sways gently to add lateral parallax. Mimics the iOS 26 Lock
 * Screen clock's response to environmental motion.
 *
 * Implementation notes:
 *   - Direct rAF-throttled scroll listener (no motion useScroll), because
 *     the 280ms .liquid-glass transition was preempting motion's per-frame
 *     updates and the highlight visibly didn't move.
 *   - Inline `transition: none` on this card overrides the global liquid-glass
 *     transition, so scroll updates apply instantaneously.
 */
export function EntryRow({ id, createdAt, content, mood }: EntryRowProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 0;
      // Progress goes 0 → 1 as the row passes from "top edge at viewport
      // bottom" to "bottom edge at viewport top".
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      const progress = Math.max(0, Math.min(1, traveled / total));
      // Highlight rises through the card (low → high on the card surface).
      const lgY = 0.95 - progress * 0.9;
      // Subtle horizontal sway for lateral parallax.
      const lgX = 0.5 + (progress - 0.5) * 0.3;
      el.style.setProperty("--lg-y", lgY.toFixed(3));
      el.style.setProperty("--lg-x", lgX.toFixed(3));
      el.style.setProperty("--lg-strength", "1");
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const date = new Date(createdAt);
  const datePart = DATE_FMT.format(date).toUpperCase();
  const timePart = TIME_FMT.format(date);

  return (
    <Card
      ref={ref}
      staticHighlight
      // Disable the 280ms cursor-tracking transition for this card —
      // scroll updates happen every frame and need to apply instantly.
      style={{ transition: "none" }}
    >
      <header className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-[0.16em] tabular-nums opacity-55">
          {datePart}
          <span className="mx-1.5 opacity-40">·</span>
          {timePart}
        </span>
        {mood != null ? (
          <span
            aria-label={`Mood ${mood} of 5`}
            className="h-2 w-2 rounded-full"
            style={{
              background: MOOD_COLORS[mood],
              boxShadow: `0 0 12px -2px ${MOOD_COLORS[mood]}`,
            }}
          />
        ) : null}
      </header>

      <p className="mt-3 line-clamp-4 text-[15px] leading-[22px]">{content}</p>

      {/* Reframe is only worth offering on entries with enough substance. */}
      {content.length > 50 ? <EntryReframe entryId={id} /> : null}
    </Card>
  );
}
