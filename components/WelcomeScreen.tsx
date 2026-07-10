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
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <section className="liquid-glass-accent hero-glass-card motion-card relative w-full max-w-md rounded-[2rem] p-5 shadow-2xl sm:p-6">
        <div className="liquid-content">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                  leftovr
                </p>

                <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.24em] text-[#c7ad75]/75">
                  Private Beta
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/10 px-3 py-0.5 text-xs font-semibold text-[#f5f0e8]">
              v1.2.2 Beta
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c7ad75]/75">
              Welcome
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f5f0e8]">
              Make your money feel easier to read.
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              Track your bills, cards, balances, and money left over in one
              calm place. leftovr is built to give you a clearer view without
              making your finances feel more complicated.
            </p>
          </div>

          <div className="mt-5 grid gap-2.5">
            <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/35 px-3.5 py-3">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Simple manual tracking
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-400">
                Add your numbers, update them when needed, and use manual
                backup when you want to save your data.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGetStarted}
              className="pressable rounded-full border border-[#c7ad75]/35 bg-[#c7ad75]/18 px-4 py-3 text-sm font-semibold text-[#f5f0e8] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-[#c7ad75]/24"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}