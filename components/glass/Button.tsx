"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

type Variant = "primary" | "glass" | "ghost";
type Size = "md" | "lg";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: Variant;
  size?: Size;
  children?: React.ReactNode;
}

const SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-tide-blue)] text-white shadow-[0_8px_24px_-6px_rgba(0,122,255,0.45)] hover:brightness-105",
  glass:
    "liquid-glass text-[color:var(--color-tide-ink)] hover:[--lg-strength:0.85]",
  ghost:
    "bg-transparent text-[color:var(--color-tide-ink)] hover:bg-black/[0.04]",
};

const sizeClasses: Record<Size, string> = {
  md: "min-h-[var(--spacing-tap)] px-5 text-[15px]",
  lg: "min-h-[52px] px-7 text-[17px]",
};

/**
 * Spring-press button. Tap target is enforced at 44px minimum (Apple HIG)
 * and the press scale uses the spec's (stiffness: 400, damping: 30) spring
 * — the "haptic-feeling" 120Hz curve.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.01 }}
      transition={SPRING}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-[var(--radius-pill)] font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tide-blue)]/60 focus-visible:ring-offset-2 disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
