"use client";

import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoMark from "@/components/LogoMark";
import { supabase } from "@/lib/supabase/client";

const pageStyle: CSSProperties = {
  background: "var(--theme-background, var(--theme-bg, #11100d))",
  color: "var(--theme-text, #f5f0e8)",
};

const panelStyle: CSSProperties = {
  borderColor: "var(--theme-border-default, rgba(245, 240, 232, 0.12))",
  background:
    "color-mix(in srgb, var(--theme-surface-sheet, #1b211f) 96%, transparent)",
  boxShadow:
    "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight, #ffffff) 58%, transparent), 0 24px 64px color-mix(in srgb, var(--theme-shadow, #000000) 18%, transparent)",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main
      className="relative min-h-[100svh] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8"
      style={pageStyle}
    >
      <AuthBackdrop />

      <div className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-md flex-col justify-center sm:min-h-[calc(100svh-4rem)]">
        <header className="motion-card mb-5 flex items-center justify-between gap-4 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark />

            <div className="min-w-0">
              <p
                className="truncate text-[1.05rem] font-semibold lowercase tracking-[-0.02em]"
                style={{ color: "var(--theme-text, #f5f0e8)" }}
              >
                leftovr
              </p>

              <p
                className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--theme-text-tertiary, #8f948f)" }}
              >
                Personal finance
              </p>
            </div>
          </div>

          <span
            className="shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold"
            style={{
              borderColor:
                "color-mix(in srgb, var(--theme-accent, #9db49a) 30%, var(--theme-border-default, rgba(245,240,232,0.12)))",
              background:
                "color-mix(in srgb, var(--theme-accent, #9db49a) 8%, var(--theme-surface-control, transparent))",
              color: "var(--theme-text-secondary, #c4c6c2)",
            }}
          >
            v2.0 Beta
          </span>
        </header>

        <section
          className="motion-card motion-card-delay-1 rounded-[2rem] border p-5 sm:p-6"
          style={panelStyle}
        >
          <header className="mb-5">
            <p
              className="text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--theme-accent, #9db49a)" }}
            >
              Welcome back
            </p>

            <h1
              className="mt-2 text-[2rem] font-bold leading-[1.02] tracking-[-0.045em]"
              style={{ color: "var(--theme-text, #f5f0e8)" }}
            >
              Sign in to leftovr
            </h1>

            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--theme-text-secondary, #b3b7b2)" }}
            >
              Your balances, bills, and cards are waiting.
            </p>
          </header>

          <form
            onSubmit={handleLogin}
            className="grid gap-3"
            aria-busy={isLoading}
          >
            <AuthField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="you@example.com"
            />

            <AuthField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            {message ? <StatusMessage>{message}</StatusMessage> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="pressable mt-1 w-full rounded-[1.15rem] border px-4 py-3.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--theme-accent, #9db49a) 48%, var(--theme-border-default, rgba(245,240,232,0.12)))",
                background:
                  "color-mix(in srgb, var(--theme-accent, #9db49a) 24%, var(--theme-surface-control, #26302d))",
                color: "var(--theme-text, #f5f0e8)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight, #ffffff) 62%, transparent)",
              }}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div
            className="mt-5 flex items-center justify-center gap-2 border-t pt-4 text-sm"
            style={{
              borderColor: "var(--theme-divider, rgba(245,240,232,0.08))",
              color: "var(--theme-text-tertiary, #8f948f)",
            }}
          >
            <span>New to leftovr?</span>

            <Link
              href="/signup"
              className="pressable font-semibold transition hover:opacity-75"
              style={{ color: "var(--theme-text, #f5f0e8)" }}
            >
              Create an account
            </Link>
          </div>
        </section>

        <p
          className="motion-card motion-card-delay-2 mt-4 text-center text-[0.72rem] leading-5"
          style={{ color: "var(--theme-text-tertiary, #8f948f)" }}
        >
          A calmer view of what is due and what is left.
        </p>
      </div>
    </main>
  );
}

function AuthBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute -left-28 top-[-9rem] h-80 w-80 rounded-full blur-3xl"
        style={{
          background:
            "color-mix(in srgb, var(--theme-accent, #9db49a) 10%, transparent)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-28 bottom-[-11rem] h-96 w-96 rounded-full blur-3xl"
        style={{
          background:
            "color-mix(in srgb, var(--theme-accent, #9db49a) 7%, transparent)",
        }}
        aria-hidden="true"
      />
    </>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label
      className="grid gap-1.5 rounded-[1.15rem] border px-3.5 py-3 transition focus-within:ring-2 focus-within:ring-[var(--theme-accent)]"
      style={{
        borderColor: "var(--theme-border-default, rgba(245, 240, 232, 0.12))",
        background: "var(--theme-surface-control, rgba(17, 16, 13, 0.2))",
      }}
    >
      <span
        className="text-[0.66rem] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "var(--theme-text-tertiary, #8f948f)" }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full bg-transparent text-base font-semibold outline-none"
        style={{ color: "var(--theme-text, #f5f0e8)" }}
      />
    </label>
  );
}

function StatusMessage({ children }: { children: string }) {
  const color = "var(--theme-danger, #d85b55)";

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[1.05rem] border px-3.5 py-3"
      style={{
        borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
      }}
    >
      <p className="text-sm font-medium leading-5" style={{ color }}>
        {children}
      </p>
    </div>
  );
}