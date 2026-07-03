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

        <Pill>v1.1 Beta</Pill>
      </header>

      <main className="mx-auto max-w-xl">
        <section className="mb-5 rounded-[2rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15 sm:p-6">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/80">
                Get Started
              </p>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
              Create account
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-300">
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
              <div className="rounded-2xl border border-[#f5f0e8]/10 bg-[#11100d] p-4">
                <p className="text-sm leading-6 text-stone-300">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isWorking}
              className="w-full rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? "Creating..." : "Create Account"}
            </button>
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 text-center shadow-xl shadow-black/15">
          <p className="text-sm leading-6 text-stone-300">
            Already have an account?
          </p>

          <Link
            href="/login"
            className="mt-3 block rounded-2xl border border-[#f5f0e8]/12 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
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
        className="w-full rounded-2xl border border-[#f5f0e8]/12 bg-[#11100d] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/40 focus:bg-[#181713]"
      />
    </label>
  );
}
