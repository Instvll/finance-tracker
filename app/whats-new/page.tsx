"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

const patchNotes = [
  {
      version: "v1.1 Beta",
  title: "Visual Refresh & Theme Expansion",
  date: "Current Build",
  badge: "Latest",
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

const testerNotes = [
  "Use the app normally and look for anything that feels confusing, cramped, or slow.",
  "The more feedback the better. Send any bugs, crashes, or suggestions to Dylan!",
  "Backups are manual for now, so use Settings when you want to save or restore your data.",
];

export default function WhatsNewPage() {
  const [openVersion, setOpenVersion] = useState("");
  const [showTesterNotes, setShowTesterNotes] = useState(false);

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="mb-6 motion-card">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Release Notes
            </p>

            <Pill>v1.1 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            What&apos;s New
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
            Follow leftovr updates, redesign notes, and beta testing changes.
          </p>
        </header>

        <section className="grid gap-4">
          {patchNotes.map((patch, index) => {
            const isOpen = openVersion === patch.version;

            return (
              <PatchNoteCard
                key={patch.version}
                patch={patch}
                isOpen={isOpen}
                motionDelay={
                  index === 0 ? "motion-card-delay-1" : "motion-card-delay-2"
                }
                onToggle={() =>
                  setOpenVersion((current) =>
                    current === patch.version ? "" : patch.version
                  )
                }
              />
            );
          })}

          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.65rem] p-5">
            <div className="liquid-content">
              <button
                type="button"
                onClick={() => setShowTesterNotes((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/12 text-[#c7ad75]">
                    <TesterIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-[#f5f0e8]">
                      Tester Notes
                    </p>

                    <p className="mt-1 text-sm leading-6 text-stone-400">
                      Quick reminders for beta testing.
                    </p>

                    <p className="mt-2 truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/70">
                      {testerNotes.length} Notes
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/8 px-3 py-1 text-xs font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/14">
                  {showTesterNotes ? "Hide" : "View"}
                </span>
              </button>

              {showTesterNotes && (
                <div className="mt-5 border-t border-[#f5f0e8]/10 pt-5">
                  <div className="grid gap-3">
                    {testerNotes.map((note, index) => (
                      <div
                        key={note}
                        className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/45 p-4"
                      >
                        <div className="flex gap-3">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/12 text-xs font-bold text-[#c7ad75]">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-stone-300">
                            {note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <Link
            href="/"
            className="motion-card motion-card-delay-3 flex rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/35 px-5 py-4 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          >
            <span className="w-full">Back to Dashboard</span>
          </Link>
        </section>
      </div>
    </PageShell>
  );
}

function PatchNoteCard({
  patch,
  isOpen,
  motionDelay,
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
  motionDelay: string;
  onToggle: () => void;
}) {
  return (
    <section
      className={`liquid-glass motion-card ${motionDelay} rounded-[1.65rem] p-5`}
    >
      <div className="liquid-content">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/12 text-[#c7ad75]">
              <ReleaseIcon />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-[#f5f0e8]">
                  {patch.version}
                </p>

                <span className="rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#c7ad75]">
                  {patch.badge}
                </span>
              </div>

              <p className="text-sm font-semibold text-stone-300">
                {patch.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-400">
                {patch.summary}
              </p>

              <p className="mt-2 truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/70">
                {patch.date}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/8 px-3 py-1 text-xs font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/14">
            {isOpen ? "Hide" : "View"}
          </span>
        </button>

        {isOpen && (
          <div className="mt-5 border-t border-[#f5f0e8]/10 pt-5">
            <div className="grid gap-3">
              {patch.highlights.map((highlight, index) => (
                <ReleaseItem
                  key={`${patch.version}-${highlight}`}
                  number={index + 1}
                  text={highlight}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ReleaseItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/45 p-4">
      <div className="flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/12 text-xs font-bold text-[#c7ad75]">
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

function TesterIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 4h8M10 4v5l-4.5 7.5A2.3 2.3 0 0 0 7.5 20h9a2.3 2.3 0 0 0 2-3.5L14 9V4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8 15h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}