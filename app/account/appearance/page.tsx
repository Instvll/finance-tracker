"use client";

import Link from "next/link";
import TopNav from "../../../components/TopNav";
import ThemeSelector from "../../../components/ThemeSelector";
import { PageShell } from "../../../components/Layout";

export default function AppearanceSettingsPage() {
  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-1.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Appearance
          </h1>
        </header>

        <section className="grid gap-2">
          <ThemeSelector />

          <section className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.7rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content flex items-center gap-2.5">
              <div className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
                <DeviceIcon />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  Saved on this device
                </p>

                <p className="mt-0.5 text-xs leading-5 text-stone-400 sm:text-sm">
                  Appearance settings are stored separately on each device.
                </p>
              </div>

              <span className="hidden shrink-0 rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-0.5 text-xs font-semibold text-stone-400 sm:inline-flex">
                Local
              </span>
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
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

function DeviceIcon() {
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