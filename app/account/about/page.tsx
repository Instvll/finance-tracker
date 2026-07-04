"use client";

import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";

export default function AboutSettingsPage() {
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

            <Pill>About</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            About leftovr
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
            Version, build, and safety information for this beta.
          </p>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
          <div className="liquid-content grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="Version" value="v1.1.1 Beta" />

              <InfoItem label="Build" value="Private Testing" />
            </div>

            <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
                Safety Note
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-300">
                leftovr is built for personal tracking and private beta testing.
                Avoid storing full card numbers, passwords, Social Security
                numbers, bank account numbers, or other sensitive account
                details.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
                Current Focus
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-300">
                v1.1.1 Beta focuses on polish, spacing, cleaner settings,
                mobile fixes, and a more app-like experience.
              </p>
            </div>
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