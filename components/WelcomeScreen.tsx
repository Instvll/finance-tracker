"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/LogoMark";

const welcomeStorageKey = "leftovr-welcome-seen";
const lastSeenVersionStorageKey = "leftovr-last-seen-version";
const guidedSetupStorageKey =
  "leftovr-finance-onboarding-active";
const currentRelease = "v1.3-beta";

export default function WelcomeScreen() {
  const pathname = usePathname();

  const [hasMounted, setHasMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (isAuthPage) {
      setShowWelcome(false);
      return;
    }

    const hasSeenWelcome = window.localStorage.getItem(welcomeStorageKey);

    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [pathname]);

  function handleGetStarted() {
    window.localStorage.setItem(welcomeStorageKey, "true");
    window.localStorage.setItem(
      lastSeenVersionStorageKey,
      currentRelease,
    );
    window.localStorage.setItem(guidedSetupStorageKey, "true");

    setShowWelcome(false);
    window.location.assign("/manual?setup=1");
  }

  if (!hasMounted || !showWelcome) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto px-4 py-5">
      <div
        className="absolute inset-0 bg-black/58 backdrop-blur-[14px] backdrop-saturate-150"
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="liquid-glass-accent hero-glass-card dashboard-hero motion-card relative my-auto w-full max-w-md overflow-hidden rounded-[2rem]"
      >
        <div className="liquid-content dashboard-hero-content relative p-4 sm:p-5">
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

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                  leftovr
                </p>

                <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.24em] text-[#c7ad75]/70">
                  Personal Finance
                </p>
              </div>
            </div>

            <span className="dashboard-pill-button shrink-0 !px-3 !py-1 text-[10px] uppercase tracking-[0.14em]">
              v1.3 Beta
            </span>
          </div>

          <div className="relative mt-5">
            <div className="flex items-center gap-2.5">
              <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/75">
                Clearer by Payday
              </p>
            </div>

            <h1
              id="welcome-title"
              className="mt-3 max-w-[20rem] text-[2.15rem] font-bold leading-[1.05] tracking-[-0.045em] text-[#f5f0e8] sm:text-[2.35rem]"
            >
              Know what&apos;s left before payday.
            </h1>

            <p className="mt-3 max-w-[23rem] text-sm leading-6 text-stone-400">
              Start with the essentials. leftovr will guide you through the
              real Editor, save as you go, and build your Dashboard around
              your numbers.
            </p>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
            <WelcomeMetricRow
              label="Balances"
              value="Checking, savings & income"
              detail="Start here"
            />

            <WelcomeMetricRow
              label="Bills"
              value="Payments & due dates"
              detail="Optional"
            />

            <WelcomeMetricRow
              label="Credit Cards"
              value="Balances & utilization"
              detail="Optional"
              last
            />
          </div>

          <button
            type="button"
            onClick={handleGetStarted}
            className="pressable relative mt-4 w-full rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(245,240,232,0.09),0_14px_30px_rgba(0,0,0,0.18)] transition hover:border-[#c7ad75]/50 hover:bg-[#c7ad75]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7ad75]/35"
          >
            Set Up leftovr
          </button>

          <p className="relative mt-2.5 text-center text-[11px] leading-5 text-stone-500">
            Usually takes about two minutes. You can change anything later.
          </p>
        </div>
      </section>
    </div>
  );
}

function WelcomeMetricRow({
  label,
  value,
  detail,
  last = false,
}: {
  label: string;
  value: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-3 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
          {label}
        </p>

        <p className="mt-0.5 text-xs text-stone-500">{detail}</p>
      </div>

      <p className="shrink-0 text-right text-sm font-semibold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}