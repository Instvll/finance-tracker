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

  const statusLabel = isLoading ? "Checking" : user ? "Signed In" : "Signed Out";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-3 motion-card">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Settings
            </p>

            <Pill>Account</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Profile
          </h1>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.7rem] p-3.5">
          <div className="liquid-content grid gap-2.5">
            <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/22 px-3.5 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
                    Email
                  </p>

                  <p
                    className="mt-1.5 truncate text-base font-semibold text-[#f5f0e8]"
                    title={accountStatus}
                  >
                    {accountStatus}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
                  {statusLabel}
                </span>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="pressable w-full rounded-full border border-[#dc2626]/45 bg-[#dc2626]/14 px-4 py-2.5 text-center text-sm font-bold text-[#991b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(127,29,29,0.14)] transition hover:border-[#dc2626]/60 hover:bg-[#dc2626]/20"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="pressable block w-full rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-2.5 text-center text-sm font-bold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_rgba(17,16,13,0.12)] transition hover:border-[#c7ad75]/45 hover:bg-[#c7ad75]/20"
              >
                Go to Login
              </Link>
            )}
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
      className="motion-card mb-3 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}