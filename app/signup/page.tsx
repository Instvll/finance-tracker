"use client";

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

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
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
    <main className="min-h-screen bg-[#11100d] px-4 py-6 text-[#f5f0e8] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <section className="liquid-glass-accent motion-card rounded-[2rem] p-6 shadow-2xl sm:p-7">
          <div className="liquid-content">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link
                href="/login"
                className="flex items-center gap-3 transition hover:opacity-85"
              >
                <LogoMark />

                <div>
                  <p className="text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                    leftovr
                  </p>

                  <p className="mt-1 text-[0.62rem] uppercase tracking-[0.24em] text-[#c7ad75]/75">
                    Private Beta
                  </p>
                </div>
              </Link>

              <span className="rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/10 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">
                v1.1.1
              </span>
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c7ad75]/75">
                Get Started
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f0e8]">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-stone-400">
                Set up your private leftovr account to save your finance tracker
                data and use backup tools.
              </p>
            </div>

            <form onSubmit={handleSignup} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#f5f0e8]">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded-2xl border border-[#f5f0e8]/12 bg-[#11100d]/45 px-4 py-3 text-sm text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/55"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#f5f0e8]">
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
                  className="rounded-2xl border border-[#f5f0e8]/12 bg-[#11100d]/45 px-4 py-3 text-sm text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/55"
                />
              </label>

              <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/30 px-4 py-3">
                <p className="text-xs leading-5 text-stone-400">
                  Use a password you do not use anywhere else. Stronger password
                  guidance is planned for a future beta update.
                </p>
              </div>

              {message && (
                <div className="rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/10 px-4 py-3 text-sm leading-6 text-[#f5f0e8]">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isWorking}
                className="pressable mt-2 rounded-2xl border border-[#c7ad75]/35 bg-[#c7ad75]/18 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-[#c7ad75]/24 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/35 p-4">
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

        <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-stone-500">
          leftovr is a private beta finance tracker built for simple manual
          tracking and cleaner money visibility.
        </p>
      </div>
    </main>
  );
}