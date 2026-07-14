"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

const latestUpdate = {
  version: "v1.3 Beta",
  title: "Clearer by Payday",
  summary:
    "A more dependable everyday view of what is due, what is left, and what has already been handled before your next paycheck.",
  highlights: [
    {
      title: "Payday-Aware Planning",
      text: "Dashboard and Bills now organize what is due around the current and next pay periods.",
    },
    {
      title: "Smarter Bill Progress",
      text: "Overdue bills stay visible, paid bills advance correctly, and Recent Payments supports individual Undo actions.",
    },
    {
      title: "Safer Editing & Backup",
      text: "Bill changes, deletions, backups, and restores now preserve the same shared payment state.",
    },
    {
      title: "A More Unified leftovr",
      text: "Core pages, motion, settings, themes, and supporting screens now feel more consistent throughout the app.",
    },
  ],
};

const testerNotes = [
  "Pay a few bills from both Dashboard and Bills, then confirm the same Recent Payments list appears on both pages.",
  "Undo an older payment and make sure only that bill returns to the correct pay-period or overdue section.",
  "Edit, rename, change the due date of, and delete a bill to confirm no old payment or overdue records remain behind.",
  "Create a backup, make a visible change, restore it, and confirm your pay schedule and bill progress return correctly.",
  "Use the app normally and send bugs, spacing issues, crashes, or anything that feels unclear to Dylan.",
];

function scrollExpandedSectionIntoView(sectionId: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const section = document.getElementById(sectionId);

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const topClearance = 112;
      const bottomClearance = 24;
      const isComfortablyVisible =
        rect.top >= topClearance &&
        rect.bottom <= window.innerHeight - bottomClearance;

      if (isComfortablyVisible) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      section.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });
}

export default function WhatsNewPage() {
  const [showTesterNotes, setShowTesterNotes] = useState(false);

  function toggleTesterNotes() {
    const isOpening = !showTesterNotes;

    setShowTesterNotes(isOpening);

    if (isOpening) {
      scrollExpandedSectionIntoView("whats-new-tester-notes");
    }
  }

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-3 motion-card sm:-mt-2">
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Release Notes
            </p>

            <Pill>{latestUpdate.version}</Pill>
          </div>

          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            What&apos;s New
          </h1>
        </header>

        <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 rounded-[2rem]">
          <div className="liquid-content dashboard-hero-content relative p-4 sm:p-5">
            <div
              className="dashboard-hero-glow dashboard-hero-glow-accent"
              aria-hidden="true"
            />

            <div
              className="dashboard-hero-glow dashboard-hero-glow-soft"
              aria-hidden="true"
            />

            <div className="dashboard-hero-reflection" aria-hidden="true" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/75">
                    Current Release
                  </p>
                </div>

                <p className="mt-3 text-sm font-semibold text-[#c7ad75]/80">
                  {latestUpdate.version}
                </p>

                <h2 className="mt-1 text-[2rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-[2.35rem]">
                  {latestUpdate.title}
                </h2>
              </div>

              <Pill>Latest</Pill>
            </div>

            <p className="relative mt-2 max-w-2xl text-sm leading-6 text-stone-400">
              {latestUpdate.summary}
            </p>

            <div className="relative mt-4 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/16 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
              {latestUpdate.highlights.map((highlight, index) => (
                <ReleaseHighlight
                  key={highlight.title}
                  title={highlight.title}
                  text={highlight.text}
                  last={index === latestUpdate.highlights.length - 1}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-surface motion-card motion-card-delay-2 relative mt-2.5 overflow-hidden rounded-[1.7rem] p-3.5">
          <div className="dashboard-surface-glow" aria-hidden="true" />

          <div className="liquid-content">
            <SectionTitle title="More" />

            <div className="mt-2.5 overflow-hidden rounded-[1.35rem] border border-[#f5f0e8]/10 bg-transparent">
              <Link
                href="/whats-new/patch-notes"
                className="pressable group block px-3.5 py-3.5 transition hover:bg-[#f5f0e8]/[0.025]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconBubble>
                      <ReleaseIcon />
                    </IconBubble>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[#f5f0e8]">
                        Patch Notes
                      </p>

                      <p className="mt-0.5 text-xs text-stone-500">
                        Browse the full v1.3 release details and version history.
                      </p>
                    </div>
                  </div>

                  <ArrowIcon />
                </div>
              </Link>

              <div
                id="whats-new-tester-notes"
                className="scroll-mt-28 border-t border-[#f5f0e8]/8"
              >
                <button
                  type="button"
                  onClick={toggleTesterNotes}
                  aria-expanded={showTesterNotes}
                  className="pressable w-full px-3.5 py-3.5 text-left transition hover:bg-[#f5f0e8]/[0.025]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <IconBubble>
                        <TesterIcon />
                      </IconBubble>

                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#f5f0e8]">
                          Tester Notes
                        </p>

                        <p className="mt-0.5 text-xs text-stone-500">
                          A few things to watch while using the beta.
                        </p>
                      </div>
                    </div>

                    <ChevronIcon open={showTesterNotes} />
                  </div>
                </button>

                {showTesterNotes ? (
                  <div className="border-t border-[#f5f0e8]/8 bg-transparent">
                    <div className="divide-y divide-[#f5f0e8]/8">
                      {testerNotes.map((note, index) => (
                        <TesterNoteRow
                          key={note}
                          number={index + 1}
                          text={note}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <Link
          href="/"
          className="dashboard-wide-button motion-card motion-card-delay-3 pressable mt-2.5 !py-2.5"
        >
          Back to Dashboard
        </Link>
      </div>
    </PageShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function ReleaseHighlight({
  title,
  text,
  last = false,
}: {
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-3.5 py-3 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_12px_rgba(199,173,117,0.22)]" />

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#f5f0e8]">{title}</p>

        <p className="mt-0.5 text-xs leading-5 text-stone-500">{text}</p>
      </div>
    </div>
  );
}

function TesterNoteRow({
  number,
  text,
}: {
  number: number;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#c7ad75]/22 bg-[#c7ad75]/8 text-[10px] font-bold text-[#c7ad75]">
        {number}
      </span>

      <p className="text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/24 bg-[#c7ad75]/8 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.07)]">
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/4 text-stone-400 transition-all duration-300 ${
        open ? "rotate-180 border-[#c7ad75]/26 text-[#c7ad75]" : ""
      }`}
      aria-hidden="true"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="m7 9 5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
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