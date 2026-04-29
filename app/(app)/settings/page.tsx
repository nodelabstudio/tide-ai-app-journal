"use client";

import { ChevronRight, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Card } from "@/components/glass/Card";
import { Button } from "@/components/glass/Button";
import { Toggle } from "@/components/settings/Toggle";
import {
  useTheme,
  type ThemePreference,
} from "@/components/theme/ThemeProvider";
import { signOut } from "@/lib/actions/auth";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "midnight", label: "Midnight" },
  { value: "system", label: "System" },
];

const SPRING = { type: "spring" as const, stiffness: 500, damping: 34 };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1 text-[11px] font-medium tracking-[0.18em] uppercase opacity-45">
      {children}
    </span>
  );
}

function Row({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[var(--spacing-tap)] items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-medium">{label}</span>
        {hint ? <span className="text-[12px] opacity-55">{hint}</span> : null}
      </div>
      <div className="flex flex-none items-center">{control}</div>
    </div>
  );
}

function Hairline() {
  return (
    <div
      aria-hidden
      className="h-px w-full"
      style={{
        background:
          "color-mix(in srgb, var(--color-tide-ink) 9%, transparent)",
      }}
    />
  );
}

function ThemeSegmentedControl() {
  const { preference, setPreference } = useTheme();
  return (
    <div
      className="relative inline-flex rounded-full p-0.5"
      style={{
        background:
          "color-mix(in srgb, var(--color-tide-ink) 8%, transparent)",
      }}
    >
      {THEME_OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPreference(opt.value)}
            className="relative px-3 py-1.5 text-[12px] font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tide-blue)]/60"
            aria-pressed={active}
          >
            {active ? (
              <motion.span
                layoutId="theme-pill"
                transition={SPRING}
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: "var(--color-tide-canvas)",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.06), 0 4px 10px -4px rgba(0,0,0,0.1)",
                }}
              />
            ) : null}
            <span
              className="relative z-[1]"
              style={{
                color: active
                  ? "var(--color-tide-ink)"
                  : "color-mix(in srgb, var(--color-tide-ink) 60%, transparent)",
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const [reminderOn, setReminderOn] = useState(true);
  const [weeklyOn, setWeeklyOn] = useState(true);
  const [localOnly, setLocalOnly] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium tracking-[0.18em] uppercase opacity-50">
          Preferences
        </span>
        <h1 className="font-display text-[34px] leading-[40px] font-semibold tracking-[-0.022em]">
          Settings
        </h1>
      </header>

      <div className="flex flex-col gap-2">
        <SectionLabel>Appearance</SectionLabel>
        <Card className="flex flex-col">
          <Row
            label="Theme"
            hint="Midnight follows iOS 26's dark glass."
            control={<ThemeSegmentedControl />}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Notifications</SectionLabel>
        <Card className="flex flex-col gap-1">
          <Row
            label="Daily reflection"
            hint="A quiet nudge once a day."
            control={
              <Toggle checked={reminderOn} onChange={setReminderOn} />
            }
          />
          <Hairline />
          <Row
            label="Weekly Patterns"
            hint="Sunday evening recap of the week."
            control={<Toggle checked={weeklyOn} onChange={setWeeklyOn} />}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Data & privacy</SectionLabel>
        <Card className="flex flex-col gap-1">
          <Row
            label="Local-only mode"
            hint="Skip syncing entries to the cloud."
            control={<Toggle checked={localOnly} onChange={setLocalOnly} />}
          />
          <Hairline />
          <Row
            label="AI calls today"
            hint="Resets at midnight UTC."
            control={
              <span className="text-[15px] font-semibold tabular-nums opacity-60">
                12<span className="opacity-40"> / 40</span>
              </span>
            }
          />
          <Hairline />
          <button
            type="button"
            className="flex min-h-[var(--spacing-tap)] items-center justify-between gap-4 text-left outline-none"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium">Export entries</span>
              <span className="text-[12px] opacity-55">Download a JSON archive.</span>
            </div>
            <ChevronRight
              width={18}
              height={18}
              strokeWidth={2}
              className="opacity-40"
              aria-hidden
            />
          </button>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <form action={signOut}>
          <Button
            type="submit"
            variant="glass"
            className="w-full"
            style={{ color: "var(--color-tide-coral)" }}
          >
            <LogOut width={16} height={16} strokeWidth={2.2} />
            Sign out
          </Button>
        </form>
        <p className="px-1 text-center text-[11px] tracking-tight opacity-40">
          Tide v0.1.0 · Built with care.
        </p>
      </div>
    </section>
  );
}
