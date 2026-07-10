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

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsWorking(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsWorking(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email if confirmation is required.");

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[#11100d] px-4 py-5 text-[#f5f0e8] sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center sm:min-h-[calc(100vh-3rem)]">
        <section className="liquid-glass-accent hero-glass-card motion-card rounded-[2rem] p-5 shadow-2xl sm:p-6">
          <div className="liquid-content">
            <div className="mb-5 flex items-center justify-between gap-4">
              <Link
                href="/login"
                className="flex min-w-0 items-center gap-3 transition hover:opacity-85"
              >
                <LogoMark />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                    leftovr
                  </p>

                  <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.24em] text-[#c7ad75]/75">
                    Private Beta
                  </p>
                </div>
              </Link>

              <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/10 px-3 py-0.5 text-xs font-semibold text-[#f5f0e8]">
                v1.2.2 Beta
              </span>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c7ad75]/75">
                Get Started
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f5f0e8]">
                Create your account
              </h1>
            </div>

            <form onSubmit={handleSignup} className="grid gap-3">
              <label className="grid gap-1.5 rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/24 p-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-full border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-2.5 text-base font-semibold text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
                />
              </label>

              <label className="grid gap-1.5 rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/24 p-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className="w-full rounded-full border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-2.5 text-base font-semibold text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
                />
              </label>

              <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/24 px-3.5 py-2.5">
                <p className="text-xs leading-5 text-stone-400">
                  Use a password you do not use anywhere else.
                </p>
              </div>

              {message ? (
                <div className="rounded-[1.15rem] border border-[#c7ad75]/25 bg-[#c7ad75]/12 px-3.5 py-2.5">
                  <p className="text-sm font-semibold leading-6 text-[#f5f0e8]">
                    {message}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isWorking}
                className="pressable rounded-full border border-[#c7ad75]/35 bg-[#c7ad75]/18 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-[#c7ad75]/24 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-4 rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/30 px-3.5 py-3">
              <p className="text-sm leading-6 text-stone-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#c7ad75] transition hover:opacity-80"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}