"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";
import { supabase } from "../../../lib/supabase/client";

type AccountUser = {
  id: string;
  email?: string;
};

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setIsLoading(true);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setUser({
      id: data.user.id,
      email: data.user.email,
    });

    setIsLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const accountStatus = isLoading
    ? "Checking..."
    : user?.email
      ? user.email
      : "Not signed in";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-4 motion-card">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Settings
            </p>

            <Pill>Account</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Profile
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
            View your signed-in account and manage your session.
          </p>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
          <div className="liquid-content grid gap-3">
            <InfoItem label="Email" value={accountStatus} />

            <button
              type="button"
              onClick={signOut}
              disabled={!user}
              className="pressable w-full rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1.5 break-words text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}