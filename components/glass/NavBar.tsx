"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import type { Route } from "next";
import type { ComponentType, SVGProps } from "react";
import {
  ClockGlyph,
  GearshapeGlyph,
  SparklesGlyph,
  WaterWavesGlyph,
} from "@/components/icons/sf";

type Tab = {
  href: Route;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const tabs: Tab[] = [
  { href: "/today", label: "Today", Icon: SparklesGlyph },
  { href: "/timeline", label: "Timeline", Icon: ClockGlyph },
  { href: "/patterns", label: "Patterns", Icon: WaterWavesGlyph },
  { href: "/settings", label: "Settings", Icon: GearshapeGlyph },
];

const SPRING = { type: "spring" as const, stiffness: 400, damping: 32 };

/**
 * Floating bottom tab bar.
 *
 * The active indicator is a single motion.div with a shared layoutId, so it
 * physically glides between cells when the route changes — the slick part
 * of an iOS-clean tab bar.
 */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md px-1"
    >
      <ul className="liquid-glass flex items-stretch justify-between rounded-[26px] p-1">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="relative flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-[var(--spacing-tap)] flex-col items-center justify-center gap-0.5 rounded-[20px] px-2 py-1.5"
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={SPRING}
                    aria-hidden
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-tide-ink) 8%, transparent)",
                    }}
                  />
                ) : null}
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING}
                  className="relative z-[1] flex flex-col items-center gap-0.5"
                >
                  <Icon
                    aria-hidden
                    width={20}
                    height={20}
                    strokeWidth={active ? 2.2 : 1.7}
                    className={
                      active
                        ? "text-[color:var(--color-tide-ink)]"
                        : "text-[color:var(--color-tide-ink)]/55"
                    }
                  />
                  <span
                    className={`text-[10px] leading-none font-medium tracking-tight ${
                      active
                        ? "text-[color:var(--color-tide-ink)]"
                        : "text-[color:var(--color-tide-ink)]/55"
                    }`}
                  >
                    {label}
                  </span>
                </motion.span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
