"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { supabase } from "../../lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  async function handleCreateAccount() {
    setIsWorking(true);
    setMessage("");

    if (!email || !password) {
      setMessage("Enter an email and password to create your account.");
      setIsWorking(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password should be at least 6 characters.");
      setIsWorking(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsWorking(false);
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account, then come back and log in."
    );
    setIsWorking(false);
  }

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
          Account
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Create Account
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Create an account so your finance tracker can back up and restore your
          saved data.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                New Account
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#f5f0e8]">
              Set up your login
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              Use an email you can access. Supabase may ask you to confirm it
              before logging in.
            </p>
          </div>

          <Pill>Signup</Pill>
        </div>

        <div className="space-y-4">
          <InputField
            label="Email"
            value={email}
            type="email"
            placeholder="you@example.com"
            onChange={setEmail}
          />

          <InputField
            label="Password"
            value={password}
            type="password"
            placeholder="At least 6 characters"
            onChange={setPassword}
          />

          {message && (
            <div className="rounded-2xl border border-stone-300/20 bg-[#171614] p-4">
              <p className="text-sm leading-6 text-stone-300">{message}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={isWorking}
            className="w-full rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWorking ? "Creating account..." : "Create Account"}
          </button>
        </div>
      </section>

      <section className="grid gap-3">
        <Link
          href="/login"
          className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 transition hover:border-stone-100/30 hover:bg-[#2b2925]"
        >
          <p className="text-sm font-semibold text-[#f5f0e8]">
            Already have an account?
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-400">
            Go back to login and sign in with your email and password.
          </p>
        </Link>

        <Link
          href="/"
          className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 text-center text-sm text-stone-300 shadow-xl shadow-black/10 transition hover:border-stone-100/30 hover:bg-[#2b2925] hover:text-stone-100"
        >
          Back to Dashboard
        </Link>
      </section>
    </PageShell>
  );
}

function InputField({
  label,
  value,
  type,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type: "email" | "password";
  placeholder: string;
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
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
        placeholder={placeholder}
      />
    </label>
  );
}