"use client";

import {
  forwardRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
} from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * If true, uses the inner concentric radius (16px) instead of the outer
   * card radius (24px). Apply when this card is nested inside another glass
   * card with the default 8px padding.
   */
  inner?: boolean;
  /**
   * Disable the cursor-tracking specular. Useful for cards far from the
   * focal point — keeps the GPU quiet on long timeline lists.
   */
  staticHighlight?: boolean;
}

/**
 * Liquid Glass card — the centerpiece visual of Tide.
 *
 * On pointer move, --lg-x and --lg-y are mapped to (0..1) of the card's
 * bounding box and pushed onto the element. The specular overlay in
 * styles/liquid-glass.css picks them up via inheritance into ::before.
 *
 * Concentric corners are honored when consumers pass `inner` for nested
 * cards. See Apple HIG 2025 for the (parent radius - parent padding) rule.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = "", inner = false, staticHighlight = false, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (staticHighlight) return;
      const el = localRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      el.style.setProperty("--lg-x", x.toFixed(3));
      el.style.setProperty("--lg-y", y.toFixed(3));
      el.style.setProperty("--lg-strength", "1");
    },
    [staticHighlight],
  );

  const handlePointerLeave = useCallback(() => {
    if (staticHighlight) return;
    const el = localRef.current;
    if (!el) return;
    el.style.setProperty("--lg-x", "0.5");
    el.style.setProperty("--lg-y", "0.2");
    el.style.setProperty("--lg-strength", "0.6");
  }, [staticHighlight]);

  const setRef = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <div
      ref={setRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`liquid-glass ${
        inner
          ? "rounded-[var(--radius-card-inner)] p-4"
          : "rounded-[var(--radius-card)] p-6"
      } ${className}`}
      style={style}
      {...rest}
    />
  );
});
