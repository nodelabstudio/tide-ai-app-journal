"use client";

import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/glass/Button";
import { Card } from "@/components/glass/Card";
import {
  signInWithEmail,
  type AuthFormState,
} from "@/lib/actions/auth";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const INITIAL: AuthFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="mt-2 w-full"
      disabled={pending}
    >
      {pending ? "Sending…" : "Send magic link"}
      {pending ? null : <ArrowRight width={16} height={16} strokeWidth={2.2} />}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    signInWithEmail,
    INITIAL,
  );

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 py-10">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING}
        className="flex h-14 w-14 items-center justify-center rounded-[18px]"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-tide-coral) 80%, transparent), color-mix(in srgb, var(--color-tide-blue) 80%, transparent))",
          boxShadow:
            "0 12px 40px -12px color-mix(in srgb, var(--color-tide-coral) 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.45)",
        }}
      >
        <Sparkles
          width={26}
          height={26}
          strokeWidth={1.8}
          color="white"
          aria-hidden
        />
      </motion.div>

      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-[40px] leading-[44px] font-semibold tracking-[-0.025em]">
          Tide
        </h1>
        <p className="text-[15px] leading-[22px] opacity-60">
          Three prompts a day.
          <br />A timeline of your own.
        </p>
      </header>

      <Card className="w-full">
        {state.success ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex flex-col items-center gap-3 py-2 text-center"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background:
                  "color-mix(in srgb, var(--color-tide-blue) 16%, transparent)",
                color: "var(--color-tide-blue)",
              }}
            >
              <Mail width={18} height={18} strokeWidth={2} aria-hidden />
            </div>
            <p className="text-[15px] font-medium">
              Check{" "}
              <span className="font-semibold">{state.email}</span>
            </p>
            <p className="text-[13px] opacity-55">
              We sent a one-time sign-in link. It expires in 15 minutes.
            </p>
          </motion.div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <label
              htmlFor="email"
              className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-50"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.email}
              placeholder="you@somewhere.com"
              className="rounded-[var(--radius-card-inner)] px-4 py-3 text-[16px] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-tide-blue)]/40"
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
            <SubmitButton />
          </form>
        )}
      </Card>

      <p className="px-2 text-center text-[12px] leading-[18px] opacity-50">
        No passwords. We&apos;ll email you a one-tap link.
      </p>
    </div>
  );
}
