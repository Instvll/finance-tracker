"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";

const patchNotes = [
  {
    version: "v1.1.1 Beta",
    title: "Post-Launch Polish",
    date: "Current Build",
    badge: "Latest",
    summary:
      "A focused polish update that makes leftovr feel cleaner, smoother, more app-like, and easier to use across every core page.",
    highlights: [
      "Fixed iPhone input zoom behavior when editing numbers and text fields.",
      "Fixed saved themes loading incorrectly when reopening the app from a cold start.",
      "Added a first-open welcome screen for new and existing beta users.",
      "Matched the signup screen to the redesigned login screen.",
      "Refined the leftovr logo and app icon direction.",
      "Cleaned up Dashboard spacing, hero card layout, and bill/card list styling.",
      "Cleaned up Bills and Credit Cards pages with tighter spacing and softer divided lists.",
      "Improved Editor usability with simpler tabs, cleaner editing rows, easier inputs, and clearer save behavior.",
      "Rebuilt Settings into modern dedicated pages for Profile, Appearance, Data & Backup, and About.",
      "Added a dedicated Appearance page with Dark, Light, and Special theme sections.",
      "Added a Fourth of July special theme.",
      "Sorted credit card lists by highest balance first on Dashboard, Credit Cards, and Editor.",
      "Added faint list dividers to improve readability without bringing back bulky cards.",
    ],
  },
  {
    version: "v1.1 Beta",
    title: "Visual Refresh & Theme Expansion",
    date: "Previous Build",
    badge: "Archived",
    summary:
      "A major visual and usability update focused on making leftovr feel more polished, more app-like, and easier to navigate.",
    highlights: [
      "Introduced the new liquid glass visual system across the app.",
      "Refined the top navigation into a cleaner floating app bar.",
      "Added a right-side slide-out app drawer for Dashboard, Bills, Credit Cards, Editor, Settings, and What’s New.",
      "Redesigned the leftovr logo into a cleaner theme-aware mark that adapts across themes.",
      "Added six total appearance themes: three dark themes and three matching light themes.",
      "Updated Settings into a simpler app-style settings screen that is easier to scan.",
      "Updated What’s New into a cleaner version history page with compact patch notes.",
      "Polished Dashboard, Bills, Credit Cards, and Editor to better match the new design system.",
      "Improved Credit Cards with compact default view and smoother utilization bar animation.",
      "Softened page motion so transitions feel more polished without feeling distracting.",
      "Improved spacing, borders, glass depth, and theme consistency across the app.",
    ],
  },
  {
    version: "v1.0 Beta",
    title: "Private Beta Launch",
    date: "Initial Beta",
    badge: "Archived",
    summary:
      "The first usable private beta with core finance tracking, editing, login, backups, and iPhone install support.",
    highlights: [
      "Added Dashboard with checking, savings, bills, and credit card snapshots.",
      "Added Bills tracking with upcoming bill detection.",
      "Added Credit Cards tracking with balance, limit, credit left, and utilization.",
      "Added Manual Editor for updating balances, bills, and cards.",
      "Added account login and private beta access.",
      "Added manual backup and restore tools.",
      "Added iPhone home screen install support.",
    ],
  },
];

export default function PatchNotesPage() {
  const [openVersion, setOpenVersion] = useState("");

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <Link
          href="/whats-new"
          className="motion-card mb-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
        >
          <span aria-hidden="true">←</span>
          What&apos;s New
        </Link>

        <header className="-mt-1 mb-4 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Version History
            </p>

            <Pill>v1.1.1 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Patch Notes
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
            Full update history for leftovr private beta builds.
          </p>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
          <div className="liquid-content grid gap-1">
            {patchNotes.map((patch) => {
              const isOpen = openVersion === patch.version;

              return (
                <PatchNoteRow
                  key={patch.version}
                  patch={patch}
                  isOpen={isOpen}
                  onToggle={() =>
                    setOpenVersion((current) =>
                      current === patch.version ? "" : patch.version
                    )
                  }
                />
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function PatchNoteRow({
  patch,
  isOpen,
  onToggle,
}: {
  patch: {
    version: string;
    title: string;
    date: string;
    badge: string;
    summary: string;
    highlights: string[];
  };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-[#f5f0e8]/10 px-3 py-4 first:border-t-0 last:border-b last:border-[#f5f0e8]/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-[#c7ad75]">
            <ReleaseIcon />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-[#f5f0e8]">
                {patch.version}
              </p>

              <span className="rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#c7ad75]">
                {patch.badge}
              </span>
            </div>

            <p className="text-sm font-semibold text-stone-300">
              {patch.title}
            </p>

            <p className="mt-1.5 text-sm leading-6 text-stone-400">
              {patch.summary}
            </p>

            <p className="mt-1.5 truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/70">
              {patch.date}
            </p>
          </div>
        </div>

        <span className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
          {isOpen ? "Hide" : "View"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 grid pt-1">
          {patch.highlights.map((highlight, index) => (
            <ReleaseItem
              key={`${patch.version}-${highlight}`}
              number={index + 1}
              text={highlight}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReleaseItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="border-t border-[#f5f0e8]/10 px-1 py-3 first:border-t-0 last:border-b last:border-[#f5f0e8]/10">
      <div className="flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-xs font-bold text-[#c7ad75]">
          {number}
        </span>

        <p className="text-sm leading-6 text-stone-300">{text}</p>
      </div>
    </div>
  );
}

function ReleaseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 4h10a2 2 0 0 1 2 2v14l-3-1.6-3 1.6-3-1.6L7 20V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 8.5h5M9.5 12h5M9.5 15.5h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}