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

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
            Choose how leftovr looks on this device.
          </p>
        </header>

        <section className="grid gap-4">
          <ThemeSelector />

          <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
            <div className="liquid-content">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Device-only setting
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-400">
                Appearance is saved on this device only. Your backup saves your
                finance data, but not your selected theme yet.
              </p>
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