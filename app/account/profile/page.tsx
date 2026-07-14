"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";
import { supabase } from "../../../lib/supabase/client";

type AccountUser = {
  id: string;
  email?: string;
  createdAt?: string;
  emailConfirmedAt?: string;
  lastSignInAt?: string;
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
      createdAt: data.user.created_at,
      emailConfirmedAt: data.user.email_confirmed_at,
      lastSignInAt: data.user.last_sign_in_at,
    });

    setIsLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const isSignedIn = Boolean(user);
  const isEmailVerified = Boolean(user?.emailConfirmedAt);

  const statusLabel = isLoading
    ? "Checking"
    : isSignedIn
      ? "Connected"
      : "Signed Out";

  const accountTitle = isLoading
    ? "Checking your account"
    : user?.email || "No account connected";

  const accountDescription = isLoading
    ? "Confirming your current leftovr session."
    : isSignedIn
      ? "Your leftovr account is active on this device."
      : "Sign in to manage your account and restore saved data.";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-1.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Account
          </h1>
        </header>

        <section className="grid gap-2">
          <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 rounded-[2rem]">
            <div className="liquid-content dashboard-hero-content relative p-3 sm:p-3.5">
              <div
                className="dashboard-hero-glow dashboard-hero-glow-accent"
                aria-hidden="true"
              />

              <div
                className="dashboard-hero-glow dashboard-hero-glow-soft"
                aria-hidden="true"
              />

              <div
                className="dashboard-hero-reflection"
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5 pr-1">
                  <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                  <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                    Account Access
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>{statusLabel}</Pill>
                </div>
              </div>

              <div className="relative mt-2.5">
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-[1rem] border border-[#c7ad75]/28 bg-[#c7ad75]/12 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.10),0_10px_24px_rgba(0,0,0,0.14)]">
                  <AccountIcon />
                </div>

                <p
                  className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.15rem,5.2vw,1.55rem)] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-3xl"
                  aria-live="polite"
                  title={accountTitle}
                >
                  {accountTitle}
                </p>

                <p className="mt-1 text-sm leading-5 text-stone-300/80">
                  {accountDescription}
                </p>
              </div>

              <div className="relative mt-2.5 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
                <AccountMetricRow
                  label="Status"
                  value={
                    isLoading
                      ? "Checking"
                      : isSignedIn
                        ? "Signed In"
                        : "Signed Out"
                  }
                />

                <AccountMetricRow
                  label="Email"
                  value={
                    isLoading
                      ? "Checking"
                      : isSignedIn
                        ? isEmailVerified
                          ? "Verified"
                          : "Not Verified"
                        : "Not Connected"
                  }
                />

                <AccountMetricRow
                  label="Member Since"
                  value={
                    isLoading
                      ? "Checking"
                      : formatAccountDate(user?.createdAt)
                  }
                  last
                />
              </div>
            </div>
          </section>

          <section className="motion-card motion-card-delay-2">
            <div className="mb-1.5 px-1">
              <SectionTitle title="Account Details" />
            </div>

            <div className="dashboard-surface relative overflow-hidden rounded-[1.55rem] border border-[#f5f0e8]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.05),0_16px_34px_rgba(0,0,0,0.08)]">
              <div className="dashboard-surface-glow" aria-hidden="true" />

              <div className="liquid-content relative">
                <DetailRow
                  icon={<EmailIcon />}
                  title="Email Address"
                  detail={
                    isLoading
                      ? "Checking your account"
                      : user?.email || "No email connected"
                  }
                  status={
                    isLoading
                      ? "Checking"
                      : isEmailVerified
                        ? "Verified"
                        : isSignedIn
                          ? "Review"
                          : "Offline"
                  }
                />

                <DetailRow
                  icon={<SessionIcon />}
                  title="Current Session"
                  detail={
                    isLoading
                      ? "Confirming this device"
                      : isSignedIn
                        ? `Last sign-in ${formatAccountDateTime(
                            user?.lastSignInAt,
                          )}`
                        : "No active account session"
                  }
                  status={isSignedIn ? "Active" : "Inactive"}
                  divided
                />

                <Link
                  href="/account/backup"
                  className="pressable group block border-t border-[#f5f0e8]/8 px-3.5 py-2.5 transition hover:bg-[#f5f0e8]/[0.035] sm:px-4 sm:py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
                      <DataIcon />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
                        Data on This Device
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-stone-500 sm:text-sm">
                        Review, back up, or restore your saved finance data.
                      </p>
                    </div>

                    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
                      Manage
                    </span>

                    <ArrowIcon />
                  </div>
                </Link>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.55rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2">
                <SectionTitle title="Account Actions" />

                <p className="mt-1 text-sm leading-5 text-stone-400">
                  Manage access to leftovr on this device.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-[#f5f0e8]/8 bg-[#11100d]/18 px-3 py-2">
                <p className="text-sm leading-5 text-stone-400">
                  {isSignedIn
                    ? "Signing out will not remove financial data stored on this device."
                    : "Your local financial data remains available while signed out."}
                </p>
              </div>

              {isSignedIn ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="pressable mt-2 w-full rounded-full border border-[#dc2626]/52 bg-[#dc2626]/14 px-4 py-2 text-center text-sm font-bold text-[#dc2626] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(127,29,29,0.10)] transition hover:border-[#dc2626]/70 hover:bg-[#dc2626]/20"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="pressable mt-2 block w-full rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-2 text-center text-sm font-bold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_24px_rgba(17,16,13,0.12)] transition hover:border-[#c7ad75]/45 hover:bg-[#c7ad75]/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}

function formatAccountDate(value?: string) {
  if (!value) {
    return "Not Available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatAccountDateTime(value?: string) {
  if (!value) {
    return "not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function AccountMetricRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="shrink-0 text-right text-base font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  title,
  detail,
  status,
  divided = false,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  status: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 ${
        divided ? "border-t border-[#f5f0e8]/8" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
            {title}
          </p>

          <p className="mt-0.5 break-all text-xs leading-5 text-stone-500 sm:text-sm">
            {detail}
          </p>
        </div>

        <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
          {status}
        </span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-stone-600 transition group-hover:translate-x-0.5 group-hover:text-[#c7ad75]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m5 7.5 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6.5"
        y="2.5"
        width="11"
        height="19"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M10 18.5h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="12"
        cy="6"
        rx="7"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}