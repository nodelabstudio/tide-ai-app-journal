"use client";

import { Pencil } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/glass/Button";
import { Card } from "@/components/glass/Card";
import { XmarkGlyph } from "@/components/icons/sf";
import {
  createEntry,
  type CreateEntryState,
} from "@/lib/actions/entries";

export interface PromptCardProps {
  prompt: string;
  /** ISO date strings (YYYY-MM-DD) that have an entry. */
  entryDays?: readonly string[];
  /** Today's date — pass an override for testing/SSR-stable rendering. */
  today?: Date;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const INITIAL_ENTRY_STATE: CreateEntryState = {};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildLast14(today: Date): Date[] {
  const days: Date[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="md"
      disabled={pending}
      className="flex-1"
    >
      {pending ? "Saving…" : "Save entry"}
    </Button>
  );
}

/**
 * The single hero piece on /today. A Liquid Glass card with the AI-generated
 * prompt and a write affordance, plus a subtle 14-day ribbon underneath
 * showing recent activity.
 *
 * Tapping Write swaps the prompt+button area for a textarea + Save/Cancel
 * inline within the same card. The createEntry server action revalidates
 * /today and /timeline so the ribbon updates after save.
 */
export function PromptCard({
  prompt,
  entryDays = [],
  today = new Date(),
}: PromptCardProps) {
  const days = buildLast14(today);
  const todayKey = isoDay(today);
  const entrySet = new Set(entryDays);

  const [writing, setWriting] = useState(false);
  const [state, action] = useActionState<CreateEntryState, FormData>(
    createEntry,
    INITIAL_ENTRY_STATE,
  );

  // Successful save → close the writing UI; revalidatePath refreshes the ribbon.
  useEffect(() => {
    if (state.success) setWriting(false);
  }, [state.success]);

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-7">
        <div className="flex items-center gap-2 text-[12px] font-medium tracking-[0.18em] uppercase opacity-50">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-tide-coral)]" />
          Today&apos;s reflection
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {!writing ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING}
              className="flex flex-col gap-7"
            >
              <p className="font-display text-[26px] leading-[32px] font-medium tracking-[-0.01em]">
                {prompt}
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setWriting(true)}
                className="w-full"
              >
                <Pencil width={16} height={16} strokeWidth={2.2} />
                Write
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              action={action}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING}
              className="flex flex-col gap-3"
            >
              <p className="text-[15px] leading-[22px] opacity-60">{prompt}</p>
              <textarea
                name="content"
                autoFocus
                rows={6}
                required
                placeholder="Start anywhere…"
                maxLength={20000}
                className="resize-none rounded-[var(--radius-card-inner)] px-4 py-3 text-[15px] leading-[22px] outline-none transition-shadow focus:ring-2 focus:ring-[var(--color-tide-blue)]/40"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-tide-ink) 5%, transparent)",
                  color: "var(--color-tide-ink)",
                }}
              />
              {state.error ? (
                <p
                  role="alert"
                  className="text-[12px]"
                  style={{ color: "var(--color-tide-coral)" }}
                >
                  {state.error}
                </p>
              ) : null}
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setWriting(false)}
                >
                  <XmarkGlyph width={14} height={14} strokeWidth={2} />
                  Cancel
                </Button>
                <SaveButton />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <Card inner className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium tracking-[0.18em] uppercase opacity-50">
            Last 14 days
          </span>
          <span className="text-[11px] tabular-nums opacity-50">
            {entrySet.size}/14
          </span>
        </div>

        <ol
          className="grid gap-[6px]"
          style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
        >
          {days.map((d, i) => {
            const key = isoDay(d);
            const isToday = key === todayKey;
            const hasEntry = entrySet.has(key);
            const dow = DAY_LABELS[d.getDay()];

            return (
              <motion.li
                key={key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: i * 0.02 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[9px] leading-none font-medium opacity-40">
                  {dow}
                </span>
                <span
                  aria-label={key}
                  className="relative flex h-7 w-full items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
                  style={{
                    color: isToday
                      ? "#fff"
                      : hasEntry
                        ? "var(--color-tide-ink)"
                        : "color-mix(in srgb, var(--color-tide-ink) 35%, transparent)",
                    background: isToday
                      ? "var(--color-tide-blue)"
                      : hasEntry
                        ? "color-mix(in srgb, var(--color-tide-ink) 9%, transparent)"
                        : "transparent",
                    boxShadow: isToday
                      ? "0 4px 12px -4px color-mix(in srgb, var(--color-tide-blue) 60%, transparent)"
                      : undefined,
                  }}
                >
                  {d.getDate()}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
