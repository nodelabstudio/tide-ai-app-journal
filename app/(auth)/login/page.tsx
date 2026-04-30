"use client";

import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/glass/Button";
import { Card } from "@/components/glass/Card";
import {
  sendCode,
  type SendCodeState,
  verifyCode,
  type VerifyCodeState,
} from "@/lib/actions/auth";

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };
const SEND_INITIAL: SendCodeState = {};
const VERIFY_INITIAL: VerifyCodeState = {};

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="mt-2 w-full"
      disabled={pending}
    >
      {pending ? "Sending…" : "Send code"}
      {pending ? null : <ArrowRight width={16} height={16} strokeWidth={2.2} />}
    </Button>
  );
}

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="mt-2 w-full"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
      {pending ? null : <ArrowRight width={16} height={16} strokeWidth={2.2} />}
    </Button>
  );
}

export default function LoginPage() {
  const [sendState, sendAction] = useActionState<SendCodeState, FormData>(
    sendCode,
    SEND_INITIAL,
  );
  const [verifyState, verifyAction] = useActionState<VerifyCodeState, FormData>(
    verifyCode,
    VERIFY_INITIAL,
  );
  const [step, setStep] = useState<"email" | "code">("email");
  const codeInputRef = useRef<HTMLInputElement>(null);

  // After "Send code" succeeds, swap the form for the code-entry step.
  useEffect(() => {
    if (sendState.success) setStep("code");
  }, [sendState.success]);

  // Autofocus the code field when the step swaps.
  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

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
        <AnimatePresence mode="wait" initial={false}>
          {step === "email" ? (
            <motion.form
              key="email"
              action={sendAction}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING}
              className="flex flex-col gap-3"
            >
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
                defaultValue={sendState.email}
                placeholder="you@somewhere.com"
                className="rounded-[var(--radius-card-inner)] px-4 py-3 text-[16px] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-tide-blue)]/40"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-tide-ink) 5%, transparent)",
                  color: "var(--color-tide-ink)",
                }}
              />
              {sendState.error ? (
                <p
                  role="alert"
                  className="text-[12px]"
                  style={{ color: "var(--color-tide-coral)" }}
                >
                  {sendState.error}
                </p>
              ) : null}
              <SendButton />
            </motion.form>
          ) : (
            <motion.form
              key="code"
              action={verifyAction}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING}
              className="flex flex-col gap-3"
            >
              <div className="flex items-start gap-3 pb-1">
                <div
                  className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-tide-blue) 16%, transparent)",
                    color: "var(--color-tide-blue)",
                  }}
                >
                  <Mail width={15} height={15} strokeWidth={2} aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] leading-[20px]">
                    Code sent to{" "}
                    <span className="font-semibold">{sendState.email}</span>
                  </p>
                  <p className="text-[12px] opacity-55">
                    Check your inbox — expires in 60 minutes.
                  </p>
                </div>
              </div>

              <input type="hidden" name="email" value={sendState.email ?? ""} />

              <label
                htmlFor="token"
                className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-50"
              >
                6-digit code
              </label>
              <input
                ref={codeInputRef}
                id="token"
                name="token"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                placeholder="000000"
                className="rounded-[var(--radius-card-inner)] px-4 py-3 text-center text-[22px] font-semibold tracking-[0.4em] tabular-nums outline-none transition-colors focus:ring-2 focus:ring-[var(--color-tide-blue)]/40"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-tide-ink) 5%, transparent)",
                  color: "var(--color-tide-ink)",
                }}
              />
              {verifyState.error ? (
                <p
                  role="alert"
                  className="text-[12px]"
                  style={{ color: "var(--color-tide-coral)" }}
                >
                  {verifyState.error}
                </p>
              ) : null}
              <VerifyButton />

              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-1 self-center text-[12px] opacity-55 transition-opacity hover:opacity-100"
              >
                Use a different email
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      <p className="px-2 text-center text-[12px] leading-[18px] opacity-50">
        No passwords. We&apos;ll email you a one-time code.
      </p>
    </div>
  );
}
