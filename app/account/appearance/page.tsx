"use client";

import Link from "next/link";
import TopNav from "../../../components/TopNav";
import ThemeSelector from "../../../components/ThemeSelector";
import { PageShell } from "../../../components/Layout";

export default function AppearanceSettingsPage() {
  return (
    <PageShell>
      <TopNav />

      <main className="min-h-[70vh] pb-3">
        <BackLink />

        <header className="motion-card mb-3 px-0.5">
          <h1
            className="text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
            style={{ color: "var(--theme-text)" }}
          >
            Appearance
          </h1>
        </header>

        <ThemeSelector />
      </main>
    </PageShell>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-3 inline-flex items-center gap-2 text-sm font-semibold transition"
      style={{ color: "var(--theme-text-tertiary)" }}
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}