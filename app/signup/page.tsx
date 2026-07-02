"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell } from "../../components/Layout";
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
          Create an account so your finance tracker can later back up and
          restore your saved data.
        </p>
      </header>

      <section className="rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 rounded-2xl border border-stone-300/20 bg-[#2b2925] p-4">
          <p className="text-sm font-semibold text-[#f5f0e8]">
            New here?
          </p>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            Create your account first. After that, you’ll be able to log in from
            the Account page and use backup tools.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-300">
              Email
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-300">
              Password
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
              placeholder="At least 6 characters"
            />
          </label>

          {message && (
            <div className="rounded-2xl border border-stone-300/20 bg-[#2b2925] p-4">
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

          <Link
            href="/login"
            className="block rounded-2xl border border-stone-300/20 px-5 py-4 text-center text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            I Already Have an Account
          </Link>

          <Link
            href="/"
            className="block rounded-2xl border border-stone-300/20 px-5 py-4 text-center text-sm text-stone-400 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </PageShell>
  );
}