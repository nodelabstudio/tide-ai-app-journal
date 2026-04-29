"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "midnight" | "system";
export type ResolvedTheme = "light" | "midnight";

const STORAGE_KEY = "tide-theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystem(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "midnight"
    : "light";
}

function apply(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  if (resolved === "midnight") {
    document.documentElement.setAttribute("data-theme", "midnight");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Initial read on mount.
  useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? (window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null)
      : null) ?? "system";
    setPreferenceState(stored);
    const next = stored === "system" ? readSystem() : stored;
    setResolved(next);
    apply(next);
  }, []);

  // React to system changes when in "system" mode.
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = mq.matches ? "midnight" : "light";
      setResolved(next);
      apply(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const r = next === "system" ? readSystem() : next;
    setResolved(r);
    apply(r);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Inline-script string that runs in <head> before paint, applying the
 * stored theme synchronously. Prevents the flash of wrong theme on load.
 */
export const themeBootstrapScript = `
  try {
    var p = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var resolved = p === "midnight" ? "midnight"
      : p === "light" ? "light"
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "light");
    if (resolved === "midnight") document.documentElement.setAttribute("data-theme", "midnight");
  } catch (_) {}
`.trim();
