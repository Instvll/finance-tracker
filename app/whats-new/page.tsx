"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell } from "../../components/Layout";

const latestUpdate = {
  version: "v2.0 Beta",
  title: "Connected by Design",
  summary:
    "A rebuilt foundation for saving, syncing, and planning with confidence, paired with a calmer and more consistent leftovr experience from end to end.",
  highlights: [
    {
      icon: <PaydayIcon />,
      title: "Automatic saving that feels natural",
      text: "Changes save quietly in the background while leftovr keeps your current device and account state aligned.",
    },
    {
      icon: <ShieldIcon />,
      title: "Safer updates across devices",
      text: "Cloud comparisons, guarded updates, recovery checks, and conflict review help protect newer data from being overwritten.",
    },
    {
      icon: <BillIcon />,
      title: "One connected planning experience",
      text: "Dashboard, Bills, Credit Cards, and Editor now share clearer states, calmer feedback, and more dependable everyday behavior.",
    },
    {
      icon: <SparklesIcon />,
      title: "Refined from sign-in to settings",
      text: "Navigation, themes, account tools, supporting pages, and release screens now feel like one thoughtful product.",
    },
  ],
};

const testerNotes = [
  "Make a visible change on one device, wait for it to save, then apply the newer update on another device and confirm both match.",
  "Edit while temporarily offline, reconnect, and confirm the pending save finishes without losing the local change.",
  "Create newer changes on two devices and confirm leftovr asks for review instead of silently replacing either version.",
  "Pay and undo bills from both Dashboard and Bills, then confirm balances, due sections, and Recently Paid remain consistent.",
  "Move through light, dark, and special themes while checking Dashboard, Bills, Cards, Editor, Settings, Account & Sync, and the release pages.",
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
        "(prefers-reduced-motion: reduce)",
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

      <main className="min-h-[70vh] pb-3">
        <header className="motion-card mb-3 px-0.5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1
                className="text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
                style={{ color: "var(--theme-text)" }}
              >
                What&apos;s New
              </h1>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                {latestUpdate.version} · {latestUpdate.title}
              </p>
            </div>

            <span
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-default))",
                background:
                  "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
                color: "var(--theme-text-secondary)",
              }}
            >
              Latest
            </span>
          </div>
        </header>

        <section
          className="motion-card motion-card-delay-1 rounded-[1.55rem] border p-5"
          style={{
            borderColor: "var(--theme-border-default)",
            background: "var(--theme-surface-sheet)",
            boxShadow:
              "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent), 0 16px 34px color-mix(in srgb, var(--theme-shadow) 14%, transparent)",
          }}
        >
          <div className="flex items-start gap-4">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.05rem] border"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--theme-accent) 28%, var(--theme-border-default))",
                background:
                  "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
                color: "var(--theme-accent)",
              }}
            >
              <ReleaseIcon />
            </span>

            <div className="min-w-0">
              <p
                className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--theme-accent)" }}
              >
                Current release
              </p>

              <h2
                className="mt-1 text-[1.35rem] font-semibold tracking-[-0.025em]"
                style={{ color: "var(--theme-text)" }}
              >
                {latestUpdate.title}
              </h2>

              <p
                className="mt-1.5 text-sm leading-6"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                {latestUpdate.summary}
              </p>
            </div>
          </div>
        </section>

        <section className="motion-card motion-card-delay-2 mt-3">
          <h2
            className="mb-2 px-1 text-[0.95rem] font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            In this release
          </h2>

          <div
            className="overflow-hidden rounded-[1.55rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent)",
            }}
          >
            {latestUpdate.highlights.map((highlight, index) => (
              <ReleaseHighlight
                key={highlight.title}
                icon={highlight.icon}
                title={highlight.title}
                text={highlight.text}
                divided={index > 0}
              />
            ))}
          </div>
        </section>

        <section className="motion-card motion-card-delay-3 mt-3">
          <h2
            className="mb-2 px-1 text-[0.95rem] font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            More
          </h2>

          <div
            className="overflow-hidden rounded-[1.55rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent)",
            }}
          >
            <Link
              href="/whats-new/patch-notes"
              className="pressable group block px-4 py-4 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <IconBubble>
                    <PatchNotesIcon />
                  </IconBubble>

                  <div className="min-w-0">
                    <p
                      className="text-[0.96rem] font-semibold"
                      style={{ color: "var(--theme-text)" }}
                    >
                      Full patch notes
                    </p>

                    <p
                      className="mt-1 text-xs leading-5"
                      style={{ color: "var(--theme-text-tertiary)" }}
                    >
                      Browse detailed changes and previous releases.
                    </p>
                  </div>
                </div>

                <ArrowIcon />
              </div>
            </Link>

            <div
              id="whats-new-tester-notes"
              className="scroll-mt-28"
              style={{ borderTop: "1px solid var(--theme-divider)" }}
            >
              <button
                type="button"
                onClick={toggleTesterNotes}
                aria-expanded={showTesterNotes}
                className="pressable w-full px-4 py-4 text-left transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <IconBubble>
                      <TesterIcon />
                    </IconBubble>

                    <div className="min-w-0">
                      <p
                        className="text-[0.96rem] font-semibold"
                        style={{ color: "var(--theme-text)" }}
                      >
                        Beta notes
                      </p>

                      <p
                        className="mt-1 text-xs leading-5"
                        style={{ color: "var(--theme-text-tertiary)" }}
                      >
                        A few things worth checking while using the beta.
                      </p>
                    </div>
                  </div>

                  <ChevronIcon open={showTesterNotes} />
                </div>
              </button>

              {showTesterNotes ? (
                <div
                  style={{
                    borderTop: "1px solid var(--theme-divider)",
                    background:
                      "color-mix(in srgb, var(--theme-surface-control) 58%, transparent)",
                  }}
                >
                  {testerNotes.map((note, index) => (
                    <TesterNoteRow
                      key={note}
                      number={index + 1}
                      text={note}
                      divided={index > 0}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function ReleaseHighlight({
  icon,
  title,
  text,
  divided = false,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  divided?: boolean;
}) {
  return (
    <div
      className="px-4 py-4"
      style={{
        borderTop: divided
          ? "1px solid var(--theme-divider)"
          : "1px solid transparent",
      }}
    >
      <div className="flex items-start gap-3.5">
        <IconBubble>{icon}</IconBubble>

        <div className="min-w-0 flex-1">
          <p
            className="text-[0.96rem] font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            {title}
          </p>

          <p
            className="mt-1 text-xs leading-5 sm:text-sm"
            style={{ color: "var(--theme-text-tertiary)" }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function TesterNoteRow({
  number,
  text,
  divided = false,
}: {
  number: number;
  text: string;
  divided?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5"
      style={{
        borderTop: divided
          ? "1px solid var(--theme-divider)"
          : "1px solid transparent",
      }}
    >
      <span
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.68rem] font-semibold"
        style={{
          borderColor:
            "color-mix(in srgb, var(--theme-accent) 28%, var(--theme-border-default))",
          background:
            "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-sheet))",
          color: "var(--theme-accent)",
        }}
      >
        {number}
      </span>

      <p
        className="text-xs leading-5 sm:text-sm"
        style={{ color: "var(--theme-text-secondary)" }}
      >
        {text}
      </p>
    </div>
  );
}

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] border"
      style={{
        borderColor:
          "color-mix(in srgb, var(--theme-accent) 24%, var(--theme-border-default))",
        background:
          "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
        color: "var(--theme-accent)",
      }}
    >
      {children}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
      style={{ color: "var(--theme-text-tertiary)" }}
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
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      style={{
        borderColor: "var(--theme-border-default)",
        background: "var(--theme-surface-control)",
        color: "var(--theme-text-tertiary)",
      }}
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

function PaydayIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 3.5v4M16 3.5v4M4 9.5h16M8 14h3M14 14h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BillIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3.5h10a2 2 0 0 1 2 2v15l-3-1.6-4 1.6-4-1.6-3 1.6v-15a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 8h6M9 12h6M9 16h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 19 6v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.5 13.4 7l3.6 1.4-3.6 1.4L12 13.5l-1.4-3.7L7 8.4 10.6 7 12 3.5ZM18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9L18 13ZM6 14l1.1 2.6L10 18l-2.9 1.1L6 22l-1.1-2.9L2 18l2.9-1.4L6 14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PatchNotesIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
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
      className="h-[18px] w-[18px]"
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