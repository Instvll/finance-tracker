"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoMark from "@/components/LogoMark";

const welcomeStorageKey = "leftovr-welcome-seen";
const lastSeenVersionStorageKey = "leftovr-last-seen-version";
const currentRelease = "v1.3-beta";

export default function UpdateAnnouncements() {
  const pathname = usePathname();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (isAuthPage) {
      setShowAnnouncement(false);
      return;
    }

    try {
      const hasSeenWelcome = Boolean(
        window.localStorage.getItem(welcomeStorageKey),
      );
      const lastSeenVersion = window.localStorage.getItem(
        lastSeenVersionStorageKey,
      );

      setShowAnnouncement(
        hasSeenWelcome && lastSeenVersion !== currentRelease,
      );
    } catch {
      setShowAnnouncement(false);
    }
  }, [pathname]);

  function markCurrentReleaseSeen() {
    try {
      window.localStorage.setItem(
        lastSeenVersionStorageKey,
        currentRelease,
      );
    } catch {
      // The announcement can still close if browser storage is unavailable.
    }
  }

  function handleContinue() {
    markCurrentReleaseSeen();
    setShowAnnouncement(false);
  }

  function handleSeeWhatsNew() {
    markCurrentReleaseSeen();
    setShowAnnouncement(false);
    router.push("/whats-new");
  }

  if (!hasMounted || !showAnnouncement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[94] flex items-center justify-center overflow-y-auto px-4 py-5">
      <div
        className="absolute inset-0 bg-black/58 backdrop-blur-[14px] backdrop-saturate-150"
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-announcement-title"
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
                  What&apos;s New
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
              id="update-announcement-title"
              className="mt-3 max-w-[21rem] text-[2rem] font-bold leading-[1.07] tracking-[-0.04em] text-[#f5f0e8] sm:text-[2.2rem]"
            >
              Planning between paychecks just got clearer.
            </h1>

            <p className="mt-3 max-w-[23rem] text-sm leading-6 text-stone-400">
              v1.3 brings leftovr&apos;s bills, payday planning, editing, and
              backups into a more connected experience.
            </p>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
            <UpdateHighlight
              title="Payday-aware planning"
              description="Upcoming bills now stay organized around your next paycheck."
            />

            <UpdateHighlight
              title="Bill progress that stays in sync"
              description="Paid, overdue, and upcoming bills now match across the app."
            />

            <UpdateHighlight
              title="Safer editing and backups"
              description="Your tracker preserves more history and restores more completely."
              last
            />
          </div>

          <div className="relative mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSeeWhatsNew}
              className="pressable dashboard-wide-button w-full"
            >
              See What&apos;s New
            </button>

            <button
              type="button"
              onClick={handleContinue}
              className="pressable w-full rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(245,240,232,0.09),0_14px_30px_rgba(0,0,0,0.18)] transition hover:border-[#c7ad75]/50 hover:bg-[#c7ad75]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7ad75]/35"
            >
              Continue
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function UpdateHighlight({
  title,
  description,
  last = false,
}: {
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 px-3.5 py-3 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <span
        className="dashboard-hero-status-dot mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c7ad75]"
        aria-hidden="true"
      />

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#f5f0e8]">{title}</p>

        <p className="mt-0.5 text-xs leading-5 text-stone-500">
          {description}
        </p>
      </div>
    </div>
  );
}