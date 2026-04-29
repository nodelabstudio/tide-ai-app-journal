"use client";

import { motion } from "motion/react";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  /** ID for the underlying input, in case you want a separate <label htmlFor>. */
  id?: string;
}

const SPRING = { type: "spring" as const, stiffness: 600, damping: 32 };

/**
 * iOS-style switch. The track is 51×31 (Apple HIG), thumb is 27 with a
 * shadow. Tap target wraps in a 44-tall row in <SettingsRow>.
 */
export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      onClick={() => onChange(!checked)}
      className="relative h-[31px] w-[51px] flex-none rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-tide-blue)]/60 focus-visible:ring-offset-2"
      style={{
        background: checked
          ? "var(--color-tide-blue)"
          : "color-mix(in srgb, var(--color-tide-ink) 18%, transparent)",
      }}
    >
      <motion.span
        aria-hidden
        animate={{ x: checked ? 22 : 2 }}
        transition={SPRING}
        className="absolute top-[2px] left-0 block h-[27px] w-[27px] rounded-full bg-white"
        style={{
          boxShadow:
            "0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
        }}
      />
    </button>
  );
}
