"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoMark from "@/components/LogoMark";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsWorking(true);
    setMessage("");
    setIsSuccess(false);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsWorking(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setIsSuccess(true);
    setMessage("Account created. Check your email if confirmation is required.");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11100d] px-4 py-5 text-[#f5f0e8] sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute -left-24 top-[-8rem] h-72 w-72 rounded-full bg-[#c7ad75]/10 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-24 bottom-[-10rem] h-80 w-80 rounded-full bg-[#c7ad75]/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center sm:min-h-[calc(100vh-3rem)]">
        <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card rounded-[2rem]">
          <div className="liquid-content dashboard-hero-content relative p-4 sm:p-5">
            <div
              className="dashboard-hero-glow dashboard-hero-glow-accent"
              aria-hidden="true"
            />

            <div
              className="dashboard-hero-glow dashboard-hero-glow-soft"
              aria-hidden="true"
            />

            <div className="dashboard-hero-reflection" aria-hidden="true" />

            <div className="relative mb-5 flex items-center justify-between gap-4">
              <Link
                href="/login"
                className="flex min-w-0 items-center gap-3 transition hover:opacity-85"
              >
                <LogoMark />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                    leftovr
                  </p>

                  <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.24em] text-[#c7ad75]/70">
                    Personal Finance
                  </p>
                </div>
              </Link>

              <span className="dashboard-pill-button !px-3 !py-1 text-[10px] uppercase tracking-[0.14em]">
                v1.3 Beta
              </span>
            </div>

            <div className="relative mb-4">
              <div className="flex items-center gap-2.5">
                <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/75">
                  Get Started
                </p>
              </div>

              <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8]">
                Create your account
              </h1>
            </div>

            <form onSubmit={handleSignup} className="grid gap-3">
              <div className="overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
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
                  autoComplete="new-password"
                  placeholder="Create a password"
                  minLength={6}
                  last
                />
              </div>

              <div className="flex items-center gap-3 rounded-[1.15rem] border border-[#f5f0e8]/9 bg-[#11100d]/16 px-3.5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.9rem] border border-[#c7ad75]/24 bg-[#c7ad75]/10 text-[#c7ad75]">
                  <LockIcon />
                </span>

                <p className="text-sm leading-5 text-stone-400">
                  Use a password you do not use anywhere else.
                </p>
              </div>

              {message ? (
                <div
                  className={`rounded-[1.1rem] border px-3.5 py-3 ${
                    isSuccess
                      ? "border-[#c7ad75]/34 bg-[#c7ad75]/10"
                      : "border-[#dc2626]/35 bg-[#dc2626]/10"
                  }`}
                >
                  <p
                    className={`text-sm font-medium leading-6 ${
                      isSuccess ? "text-[#f5f0e8]" : "text-[#dc2626]"
                    }`}
                  >
                    {message}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isWorking}
                className="pressable rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(245,240,232,0.09),0_14px_30px_rgba(0,0,0,0.18)] transition hover:border-[#c7ad75]/50 hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Creating Account…" : "Create Account"}
              </button>
            </form>

            <div className="relative mt-3 flex items-center justify-between gap-4 rounded-[1.2rem] border border-[#f5f0e8]/9 bg-[#11100d]/16 px-3.5 py-3">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Already have an account?
              </p>

              <Link
                href="/login"
                className="dashboard-pill-button pressable shrink-0 !px-3 !py-1"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
  last = false,
}: {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
  minLength?: number;
  last?: boolean;
}) {
  return (
    <label
      className={`grid gap-1.5 px-3.5 py-3.5 transition focus-within:bg-[#c7ad75]/[0.045] ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/72">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full bg-transparent text-base font-semibold text-[#f5f0e8] outline-none placeholder:text-stone-600"
      />
    </label>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}