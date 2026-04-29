"use client";

import { Flame, Leaf, Mountain, Waves } from "lucide-react";
import { motion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/glass/Card";

export type WeatherIcon = "wave" | "mountain" | "candle" | "leaf";

const ICONS: Record<
  WeatherIcon,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  wave: Waves,
  mountain: Mountain,
  candle: Flame,
  leaf: Leaf,
};

export interface WeeklySummaryProps {
  /** Default visual cue for the week's emotional weather. */
  weatherIcon?: WeatherIcon;
  /** One-sentence description of the week. */
  weatherText: string;
  /** 2–4 short noun phrases. */
  themes: string[];
  /** One honest, gentle reframing question. */
  reframe: string;
  /** Optional ISO range like "Apr 22 — Apr 28" shown as a small overline. */
  range?: string;
}

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const Hairline = () => (
  <div
    aria-hidden
    className="h-px w-full"
    style={{
      background:
        "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-tide-ink) 14%, transparent) 12%, color-mix(in srgb, var(--color-tide-ink) 14%, transparent) 88%, transparent)",
    }}
  />
);

/**
 * Renders the weekly AI synthesis on /patterns. Three sections:
 * recurring themes, emotional weather, one honest reframing question.
 *
 * Pictograms are lucide stand-ins until Angel commits the custom SF
 * Symbols-style assets to /public/generated/pictograms/.
 */
export function WeeklySummary({
  weatherIcon = "wave",
  weatherText,
  themes,
  reframe,
  range,
}: WeeklySummaryProps) {
  const Icon = ICONS[weatherIcon];

  return (
    <Card className="flex flex-col gap-7">
      {range ? (
        <span className="text-[11px] font-medium tracking-[0.18em] tabular-nums uppercase opacity-50">
          {range}
        </span>
      ) : null}

      {/* Emotional weather */}
      <section className="flex items-start gap-4">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING}
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--color-tide-blue) 14%, transparent)",
            color: "var(--color-tide-blue)",
          }}
        >
          <Icon width={22} height={22} strokeWidth={1.7} aria-hidden />
        </motion.span>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-50">
            Emotional weather
          </span>
          <p className="font-display text-[20px] leading-[26px] font-medium tracking-[-0.005em]">
            {weatherText}
          </p>
        </div>
      </section>

      <Hairline />

      {/* Themes */}
      <section className="flex flex-col gap-3">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-50">
          Recurring themes
        </span>
        <ul className="flex flex-wrap gap-1.5">
          {themes.map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.05 * i }}
              className="rounded-full px-3 py-1 text-[13px] font-medium"
              style={{
                background:
                  "color-mix(in srgb, var(--color-tide-ink) 6%, transparent)",
                color: "var(--color-tide-ink)",
              }}
            >
              {t}
            </motion.li>
          ))}
        </ul>
      </section>

      <Hairline />

      {/* Reframe */}
      <section className="flex flex-col gap-3">
        <span className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-50">
          One honest question
        </span>
        <p
          className="font-display text-[19px] leading-[26px] italic tracking-[-0.005em]"
          style={{
            color:
              "color-mix(in srgb, var(--color-tide-ink) 92%, transparent)",
          }}
        >
          “{reframe}”
        </p>
      </section>
    </Card>
  );
}
