"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

const latestUpdate = {
  version: "v1.2 Beta",
  title: "Refined Experience",
  summary:
    "A cleaner, calmer polish update focused on layout, readability, mobile views, and a more refined app experience.",
  highlights: [
    "Cleaner Dashboard, Bills, Credit Cards, Editor, and Settings layouts.",
    "Improved mobile Editor controls and softer app-style list cells.",
    "Tighter copy, clearer sections, smoother navigation, and stronger visual hierarchy.",
  ],
};

const testerNotes = [
  "Use the app normally and watch for anything that feels confusing, cramped, or slow.",
  "Send bugs, spacing issues, crashes, or suggestions to Dylan.",
  "Backups are manual for now. Use Settings when you want to back up or restore your data.",
];

export default function WhatsNewPage() {
  const [showTesterNotes, setShowTesterNotes] = useState(false);

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-4 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Release Notes
            </p>

            <Pill>{latestUpdate.version}</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            What&apos;s New
          </h1>
        </header>

        <section className="liquid-glass-accent hero-glass-card motion-card motion-card-delay-1 mb-4 rounded-[2.15rem]">
          <div className="liquid-content relative p-4 sm:p-5">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c7ad75]/10 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

            <div className="relative mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />

                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f5f0e8]">
                    Latest Update
                  </p>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-[#f5f0e8]">
                  {latestUpdate.title}
                </h2>

                <p className="mt-1 text-sm font-semibold text-stone-300">
                  {latestUpdate.version}
                </p>
              </div>

              <Pill>Latest</Pill>
            </div>

            <p className="relative text-sm leading-6 text-stone-400">
              {latestUpdate.summary}
            </p>

            <div className="relative mt-4 grid gap-2">
              {latestUpdate.highlights.map((highlight) => (
                <HighlightRow key={highlight} text={highlight} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <Link
            href="/whats-new/patch-notes"
            className="pressable liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4 transition hover:border-[#c7ad75]/30"
          >
            <div className="liquid-content">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <IconBubble>
                    <ReleaseIcon />
                  </IconBubble>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#f5f0e8]">
                      Patch Notes
                    </p>

                    <p className="mt-1 truncate text-sm text-stone-400">
                      Full version history.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-1 text-xs font-semibold text-stone-400 sm:inline-flex">
                    History
                  </span>

                  <ArrowIcon />
                </div>
              </div>
            </div>
          </Link>

          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.85rem] p-4">
            <div className="liquid-content">
              <button
                type="button"
                onClick={() => setShowTesterNotes((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IconBubble>
                    <TesterIcon />
                  </IconBubble>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#f5f0e8]">
                      Tester Notes
                    </p>

                    <p className="mt-1 truncate text-sm text-stone-400">
                      Private beta reminders.
                    </p>
                  </div>
                </div>

                <span className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                  {showTesterNotes ? "Hide" : "View"}
                </span>
              </button>

              {showTesterNotes && (
                <div className="mt-4 grid gap-2">
                  {testerNotes.map((note, index) => (
                    <TesterNoteRow
                      key={note}
                      number={index + 1}
                      text={note}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <Link
            href="/"
            className="pressable motion-card motion-card-delay-3 rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 px-5 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          >
            Back to Dashboard
          </Link>
        </section>
      </div>
    </PageShell>
  );
}

function HighlightRow({ text }: { text: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#f5f0e8]/10 bg-[#11100d]/22 px-3.5 py-3">
      <div className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c7ad75]" />

        <p className="text-sm leading-6 text-stone-300">{text}</p>
      </div>
    </div>
  );
}

function TesterNoteRow({ number, text }: { number: number; text: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#f5f0e8]/10 bg-[#11100d]/22 px-3.5 py-3">
      <div className="flex gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-xs font-bold text-[#c7ad75]">
          {number}
        </span>

        <p className="text-sm leading-6 text-stone-300">{text}</p>
      </div>
    </div>
  );
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
      {children}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-[#c7ad75]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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