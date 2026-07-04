"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/LogoMark";

const welcomeStorageKey = "leftovr-welcome-seen";

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
    setShowWelcome(false);
  }

  if (!hasMounted || !showWelcome) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <section className="liquid-glass-accent motion-card relative w-full max-w-md rounded-[2rem] p-6 shadow-2xl sm:p-7">
        <div className="liquid-content">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark />

              <div>
                <p className="text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                  leftovr
                </p>

                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.24em] text-[#c7ad75]/75">
                  Private Beta
                </p>
              </div>
            </div>

            <span className="rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/10 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">
              v1.1.1
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c7ad75]/75">
              Welcome
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#f5f0e8]">
              Let’s make your money feel organized.
            </h1>

            <p className="mt-4 text-sm leading-6 text-stone-400">
              Track your bills, cards, and balances in one calm place. leftovr
              is built to give you a clearer view of what you have, what you
              owe, and what is left over.
            </p>
          </div>

          <div className="mt-7 grid gap-3">
            <div className="rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/35 p-4">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Simple manual tracking
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-400">
                No clutter. No overcomplicated setup. Just your numbers, shown
                cleanly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGetStarted}
              className="pressable rounded-2xl border border-[#c7ad75]/35 bg-[#c7ad75]/18 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-[#c7ad75]/24"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}