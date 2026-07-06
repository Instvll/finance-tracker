"use client";

import Link from "next/link";
import TopNav from "../../../components/TopNav";
import ThemeSelector from "../../../components/ThemeSelector";
import { PageShell, Pill } from "../../../components/Layout";

export default function AppearanceSettingsPage() {
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

            <Pill>Themes</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Appearance
          </h1>
        </header>

        <section className="grid gap-4">
          <ThemeSelector />

          <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
            <div className="liquid-content flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  Device-only theme
                </p>

                <p className="mt-1 text-sm text-stone-400">
                  Your selected theme is saved on this device.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-3 py-1 text-xs font-semibold text-stone-300">
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
      className="motion-card mb-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}