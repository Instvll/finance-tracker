"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell, Pill } from "../../components/Layout";
import LogoMark from "../../components/LogoMark";
import { supabase } from "../../lib/supabase/client";

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

    if (error) {
      setMessage(error.message);
      setIsWorking(false);
      return;
    }

    setMessage("Account created. Check your email if confirmation is required.");
    setIsWorking(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <PageShell>
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link href="/login" className="flex items-center gap-3">
          <LogoMark />

          <span className="text-sm font-semibold lowercase tracking-[0.32em] text-[#f5f0e8]">
            leftovr
          </span>
        </Link>

        <Pill>v1.0 Beta</Pill>
      </header>

      <main className="mx-auto max-w-xl">
        <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Get Started
              </p>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
              Create account
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              Create an account to save your tracker data and use backup tools.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <InputField
              label="Email"
              value={email}
              type="email"
              onChange={setEmail}
            />

            <InputField
              label="Password"
              value={password}
              type="password"
              onChange={setPassword}
            />

            {message && (
              <div className="rounded-2xl border border-stone-300/20 bg-[#171614] p-4">
                <p className="text-sm leading-6 text-stone-300">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isWorking}
              className="w-full rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? "Creating..." : "Create Account"}
            </button>
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 text-center shadow-xl shadow-black/10">
          <p className="text-sm leading-6 text-stone-300">
            Already have an account?
          </p>

          <Link
            href="/login"
            className="mt-3 block rounded-2xl border border-stone-300/20 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            Log In
          </Link>
        </section>
      </main>
    </PageShell>
  );
}

function InputField({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string;
  type: "email" | "password";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={type === "password" ? 6 : undefined}
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
      />
    </label>
  );
}