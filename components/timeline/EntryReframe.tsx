"use client";

import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { XmarkGlyph } from "@/components/icons/sf";

export interface EntryReframeProps {
  entryId: string;
}

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; question: string }
  | { kind: "error"; message: string };

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

/**
 * Per-entry "ask another angle" affordance. Sits inside an EntryRow.
 * On tap: POST /api/ai/reframe, animate in the italic question.
 * 429 / cap → small inline message; tap again to retry once limit clears.
 */
export function EntryReframe({ entryId }: EntryReframeProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  async function handleReframe() {
    setPhase({ kind: "loading" });
    try {
      const res = await fetch("/api/ai/reframe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = (await res.json()) as {
        question?: string;
        error?: string;
      };
      if (!res.ok) {
        setPhase({
          kind: "error",
          message: data.error ?? "Couldn't reframe right now.",
        });
        return;
      }
      if (!data.question) {
        setPhase({ kind: "error", message: "Empty response." });
        return;
      }
      setPhase({ kind: "result", question: data.question });
    } catch {
      setPhase({ kind: "error", message: "Network issue. Try again?" });
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <AnimatePresence mode="wait" initial={false}>
        {phase.kind === "result" ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
            className="flex items-start gap-3 rounded-[var(--radius-card-inner)] p-3"
            style={{
              background:
                "color-mix(in srgb, var(--color-tide-blue) 8%, transparent)",
            }}
          >
            <Sparkles
              width={16}
              height={16}
              strokeWidth={2}
              className="mt-0.5 flex-none"
              style={{ color: "var(--color-tide-blue)" }}
              aria-hidden
            />
            <p className="font-display flex-1 text-[15px] leading-[22px] italic">
              {phase.question}
            </p>
            <button
              type="button"
              onClick={() => setPhase({ kind: "idle" })}
              aria-label="Dismiss"
              className="-m-2 flex h-8 w-8 flex-none items-center justify-center rounded-full opacity-50 transition-opacity hover:opacity-100"
            >
              <XmarkGlyph width={14} height={14} strokeWidth={2} />
            </button>
          </motion.div>
        ) : phase.kind === "error" ? (
          <motion.button
            key="error"
            type="button"
            onClick={handleReframe}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="self-start rounded-full px-3 py-1 text-[12px] font-medium"
            style={{
              background:
                "color-mix(in srgb, var(--color-tide-coral) 12%, transparent)",
              color: "var(--color-tide-coral)",
            }}
          >
            {phase.message} Tap to retry.
          </motion.button>
        ) : (
          <motion.button
            key="idle"
            type="button"
            onClick={handleReframe}
            disabled={phase.kind === "loading"}
            whileTap={{ scale: 0.96 }}
            transition={SPRING}
            className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[12px] font-medium opacity-55 transition-opacity hover:opacity-90 disabled:opacity-100"
            style={{
              background:
                "color-mix(in srgb, var(--color-tide-ink) 5%, transparent)",
            }}
          >
            <motion.span
              animate={
                phase.kind === "loading"
                  ? { rotate: [0, 360], scale: [1, 1.15, 1] }
                  : { rotate: 0, scale: 1 }
              }
              transition={
                phase.kind === "loading"
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : SPRING
              }
            >
              <Sparkles width={13} height={13} strokeWidth={2} aria-hidden />
            </motion.span>
            {phase.kind === "loading" ? "Reframing…" : "Reframe"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
