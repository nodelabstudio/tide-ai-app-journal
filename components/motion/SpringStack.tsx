"use client";

import { motion, useReducedMotion } from "motion/react";
import { Children, type ReactNode } from "react";

export interface SpringStackProps {
  children: ReactNode;
  /** Per-child delay in seconds. Defaults to 0.05 for a snappy stagger. */
  stagger?: number;
  className?: string;
}

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };

/**
 * Vertical stack with spring-bounced staggered enter for each child.
 * Honors prefers-reduced-motion: the stack still renders, just static.
 */
export function SpringStack({
  children,
  stagger = 0.05,
  className = "",
}: SpringStackProps) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={reduced ? false : { opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING, delay: reduced ? 0 : i * stagger }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
