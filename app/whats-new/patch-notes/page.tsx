"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TopNav from "../../../components/TopNav";
import { PageShell } from "../../../components/Layout";

type PatchNote = {
  version: string;
  title: string;
  date: string;
  badge: "Latest" | "Archived";
  summary: string;
  highlights: string[];
};

const patchNotes: PatchNote[] = [
  {
    version: "v1.3 Beta",
    title: "Clearer by Payday",
    date: "Current Build",
    badge: "Latest",
    summary:
      "A major refinement of leftovr’s everyday experience, built around clearer payday planning, dependable bill progress, safer editing, and a more unified design across the app.",
    highlights: [
      "Reworked the Dashboard around Left After Bills, checking, savings, and the total still due before the next payday.",
      "Added automatic payday rollover so the current and upcoming pay periods stay aligned as time moves forward.",
      "Rebuilt bill planning around Due This Pay Period, Next Pay Period, Later Bills, and a dedicated Needs Attention area for overdue bills.",
      "Improved bill totals so overdue obligations and bills due before payday are reflected consistently across Dashboard and Bills.",
      "Added persistent bill occurrences so unpaid overdue bills remain visible instead of silently moving to the next month.",
      "Added payment tracking that records the exact bill occurrence and automatically advances recurring bills to their next monthly due date.",
      "Added Recent Payments to Dashboard and Bills with individual Undo actions for each recorded payment.",
      "Limited Recent Payments to the active pay period so the list clears naturally when the next pay period begins.",
      "Unified Dashboard and Bills around the same bill-status, payday, payment, and undo logic.",
      "Improved bill editing so renaming or changing a bill preserves its payment state when safe.",
      "Added cleanup for deleted bills so old paid, active, or recent-payment records do not remain behind.",
      "Expanded backup and restore to include pay schedule preferences, active bill occurrences, paid bill records, and recent payment progress.",
      "Reworked the Credit Cards page with clearer available credit, total limit, minimum-due summaries, and expandable account details.",
      "Improved credit card expansion motion, utilization animation, automatic scrolling, and mobile layout.",
      "Removed outdated Good, Watch, and Pay Down labels from credit card views and the Editor.",
      "Refined the Editor with cleaner fields, calmer editing states, better add-and-focus behavior, safer deletion, and clearer save feedback.",
      "Added Rose Gold and Rose Gold Light themes.",
      "Refined Appearance with clearer theme organization, descriptions, and selection states.",
      "Updated Settings, Account, Login, Sign Up, Welcome, Data, and other supporting pages to better match the current leftovr design system.",
      "Improved side-menu motion, page transitions, theme contrast, footer consistency, and visual polish throughout the app.",
    ],
  },
  {
    version: "v1.2.2 Beta",
    title: "Refinement & Motion",
    date: "Previous Build",
    badge: "Archived",
    summary:
      "A focused polish update that tightened the app’s pages, smoothed navigation, improved credit card layout, and fixed light-theme action contrast.",
    highlights: [
      "Tightened spacing and visual hierarchy across core pages for a cleaner overall UI.",
      "Improved page motion so navigation feels smoother and more app-like.",
      "Refined the side menu animation for a cleaner open and close experience.",
      "Improved the Credit Cards page with clearer layout, better spacing, and a calmer card structure.",
      "Adjusted the Credit Cards mobile layout so utilization details and status pills sit more cleanly.",
      "Refined credit card utilization animation with a slightly slower, smoother, more natural feel.",
      "Improved Editor feedback with clearer saved states.",
      "Added safer delete confirmation behavior for bills and credit cards in the Editor.",
      "Fixed red action buttons not appearing correctly while using light themes.",
      "Cleaned up small copy, button states, and visual details across the app.",
    ],
  },
  {
    version: "v1.2 Beta",
    title: "Refined Experience",
    date: "Previous Build",
    badge: "Archived",
    summary:
      "A cleaner, calmer polish update focused on layout, readability, mobile views, and a more refined app experience.",
    highlights: [
      "Cleaned up Dashboard lists with softer bill and credit card cells.",
      "Tightened the Dashboard hero card and reduced extra helper copy.",
      "Removed unnecessary visual clutter across Bills, Credit Cards, Settings, and Editor.",
      "Redesigned the Credit Cards page with clearer card modules and better hierarchy.",
      "Improved the Bills page with cleaner upcoming and other bill sections.",
      "Simplified the Editor by removing the large hero card and making the page feel more focused.",
      "Added a mobile-friendly Editor segmented control while keeping richer section cards on desktop.",
      "Cleaned up Appearance and theme selection with clearer active states and polished theme cells.",
      "Refined Settings, Profile, Data & Backup, and About pages to better match the app’s new style.",
      "Updated What’s New and Patch Notes to better reflect the v1.2 polish direction.",
      "Refined the app’s theme identity with a new leftovr Classic look, added Mocha as the original warm theme, and tuned Forest and Slate to feel more distinct.",
    ],
  },
  {
    version: "v1.1.1 Beta",
    title: "Post-Launch Polish",
    date: "Previous Build",
    badge: "Archived",
    summary:
      "A focused polish update that made leftovr cleaner, smoother, more app-like, and easier to use across core pages.",
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

function getPatchId(version: string) {
  return `patch-${version.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function PatchNotesPage() {
  const pathname = usePathname();
  const [openVersion, setOpenVersion] = useState("");

  useEffect(() => {
    setOpenVersion("");

    function collapseOnPageShow() {
      setOpenVersion("");
    }

    window.addEventListener("pageshow", collapseOnPageShow);

    return () => {
      window.removeEventListener("pageshow", collapseOnPageShow);
    };
  }, [pathname]);

  function toggleVersion(version: string) {
    const isOpening = openVersion !== version;

    setOpenVersion(isOpening ? version : "");

    if (!isOpening) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const patch = document.getElementById(getPatchId(version));

        if (!patch) {
          return;
        }

        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        patch.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  }

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <Link
          href="/whats-new"
          className="motion-card mb-1.5 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
        >
          <span aria-hidden="true">←</span>
          What&apos;s New
        </Link>

        <header className="mb-2.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Patch Notes
          </h1>
        </header>

        <section className="motion-card motion-card-delay-1">
          <div className="mb-2 flex items-center justify-between gap-4 px-1">
            <SectionTitle title="Release Archive" />

            <span className="dashboard-pill-button shrink-0 !px-2.5 !py-0.5">
              {patchNotes.length} releases
            </span>
          </div>

          <div className="dashboard-surface relative overflow-hidden rounded-[1.55rem] border border-[#f5f0e8]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.05),0_16px_34px_rgba(0,0,0,0.08)]">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f5f0e8]/25 to-transparent"
              aria-hidden="true"
            />

            <div className="liquid-content relative">
              {patchNotes.map((patch, index) => (
                <PatchNoteRow
                  key={patch.version}
                  patch={patch}
                  isOpen={openVersion === patch.version}
                  divided={index > 0}
                  onToggle={() => toggleVersion(patch.version)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function PatchNoteRow({
  patch,
  isOpen,
  divided,
  onToggle,
}: {
  patch: PatchNote;
  isOpen: boolean;
  divided: boolean;
  onToggle: () => void;
}) {
  const isLatest = patch.badge === "Latest";

  return (
    <article
      id={getPatchId(patch.version)}
      className={`scroll-mt-28 ${
        divided ? "border-t border-[#f5f0e8]/8" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`pressable group relative block w-full px-3.5 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c7ad75]/35 sm:px-4 sm:py-3.5 ${
          isOpen
            ? "bg-[#c7ad75]/[0.035]"
            : "hover:bg-[#f5f0e8]/[0.035]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)] transition duration-200 ${
              isOpen
                ? "border-[#c7ad75]/34 bg-[#c7ad75]/13"
                : "border-[#c7ad75]/22 bg-[#c7ad75]/9 group-hover:border-[#c7ad75]/32 group-hover:bg-[#c7ad75]/12"
            }`}
          >
            <ReleaseIcon />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[0.95rem] font-semibold text-[#f5f0e8]">
                {patch.version}
              </p>

              {isLatest ? (
                <span className="rounded-full border border-[#c7ad75]/28 bg-[#c7ad75]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c7ad75]">
                  Latest
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 truncate text-xs leading-5 text-stone-500 sm:text-sm">
              {patch.title}
            </p>

            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500">
              {patch.date}
              <span className="mx-1.5 text-stone-600">•</span>
              {patch.highlights.length} changes
            </p>
          </div>

          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-[#f5f0e8]/8 px-3.5 pb-3.5 pt-3 sm:px-4">
          <p className="text-sm leading-6 text-stone-400">{patch.summary}</p>

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
              Included in this release
            </p>

            <div className="mt-2 divide-y divide-[#f5f0e8]/8 border-y border-[#f5f0e8]/8">
              {patch.highlights.map((highlight) => (
                <ReleaseItem
                  key={`${patch.version}-${highlight}`}
                  text={highlight}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
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

function ReleaseItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <p className="text-sm leading-6 text-stone-300">{text}</p>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/4 text-stone-500 transition-all duration-300 group-hover:border-[#c7ad75]/22 group-hover:text-[#c7ad75] ${
        open ? "rotate-180 border-[#c7ad75]/28 text-[#c7ad75]" : ""
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