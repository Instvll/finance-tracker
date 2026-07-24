"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
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
  featuredIndexes?: number[];
};

const patchNotes: PatchNote[] = [
  {
    version: "v2.0 Beta",
    title: "Connected by Design",
    date: "Current Build",
    badge: "Latest",
    summary:
      "A new generation of leftovr built on automatic saving, guarded account sync, safer device updates, and a calmer experience that now feels connected from end to end.",
    featuredIndexes: [0, 2, 8, 15],
    highlights: [
      "Rebuilt leftovr’s saving foundation around automatic local-first saving with account-backed cloud state.",
      "Kept the current device responsive by saving locally first, then uploading through one guarded sync path.",
      "Added cloud comparison and device update checks so newer account data can be reviewed and applied intentionally.",
      "Added guarded cloud restore with verification and rollback protection before newer data replaces the current device state.",
      "Added conflict detection for meaningful changes made on multiple devices instead of silently overwriting either version.",
      "Added offline pending-save recovery so local changes can finish syncing after the connection returns.",
      "Improved account recovery behavior while preserving the signed-in account, selected theme, and current app identity.",
      "Added clearer Account & Sync status, update states, advanced details, and consumer-friendly recovery messaging.",
      "Refined Dashboard, Bills, Credit Cards, and Editor into one consistent mobile-first visual system.",
      "Tightened Dashboard hierarchy, wording, previews, empty states, and pay-period readability.",
      "Refined Bills with clearer pay-period sections, recently paid feedback, calmer empty states, and more consistent list styling.",
      "Refined Credit Cards with clearer balance language, cleaner paid-off states, expandable details, and more focused utilization feedback.",
      "Refined Editor tabs, rows, sheets, field spacing, autosave feedback, and add-item focus behavior.",
      "Added a persistent bottom navigation experience and refined the side menu, page motion, and safe-area spacing.",
      "Redesigned Settings, Appearance, Preferences, Account & Sync, About, What’s New, and Patch Notes around the current leftovr design language.",
      "Expanded theme consistency across dark, light, and special themes while preserving the sage, slate, cream, and liquid-glass identity.",
      "Refreshed Login, Sign Up, Welcome, and update announcements so the full account journey now matches the app.",
      "Improved theme startup, selection persistence, and contrast across supporting pages and controls.",
      "Improved bill occurrence cleanup, payment history safety, and card-balance revision handling during edits and deletes.",
      "Standardized copy, icons, dividers, buttons, motion, and empty states across the app for a more fluid everyday experience.",
    ],
  },
  {
    version: "v1.3 Beta",
    title: "Clearer by Payday",
    date: "Previous Build",
    badge: "Archived",
    summary:
      "A major refinement of leftovr’s everyday experience, built around clearer payday planning, dependable bill progress, safer editing, and a more unified design across the app.",
    featuredIndexes: [0, 2, 12, 15],
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
    featuredIndexes: [0, 1, 3, 6],
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
    featuredIndexes: [0, 3, 5, 7],
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
    featuredIndexes: [0, 1, 7, 8],
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
    featuredIndexes: [0, 1, 4, 6],
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
    featuredIndexes: [0, 1, 2, 3],
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

function getFeaturedHighlights(patch: PatchNote) {
  const indexes = patch.featuredIndexes ?? [0, 1, 2, 3];

  return indexes
    .map((index) => patch.highlights[index])
    .filter((highlight): highlight is string => Boolean(highlight));
}

function getRemainingHighlights(patch: PatchNote) {
  const featuredIndexes = new Set(
    patch.featuredIndexes ?? [0, 1, 2, 3],
  );

  return patch.highlights.filter(
    (_, index) => !featuredIndexes.has(index),
  );
}

export default function PatchNotesPage() {
  const pathname = usePathname();
  const archiveScrollPosition = useRef(0);

  const [selectedVersion, setSelectedVersion] = useState<string | null>(
    null,
  );
  const [showAllChanges, setShowAllChanges] = useState(false);

  const selectedPatch =
    patchNotes.find((patch) => patch.version === selectedVersion) ?? null;

  useEffect(() => {
    setSelectedVersion(null);
    setShowAllChanges(false);

    function resetOnPageShow() {
      setSelectedVersion(null);
      setShowAllChanges(false);
    }

    window.addEventListener("pageshow", resetOnPageShow);

    return () => {
      window.removeEventListener("pageshow", resetOnPageShow);
    };
  }, [pathname]);

  function openRelease(version: string) {
    archiveScrollPosition.current = window.scrollY;
    setSelectedVersion(version);
    setShowAllChanges(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    });
  }

  function returnToArchive() {
    const previousScrollPosition = archiveScrollPosition.current;

    setSelectedVersion(null);
    setShowAllChanges(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: previousScrollPosition,
          behavior: "auto",
        });
      });
    });
  }

  return (
    <PageShell>
      <TopNav />

      <main className="min-h-[70vh] pb-3">
        {selectedPatch ? (
          <ReleaseDetail
            patch={selectedPatch}
            showAllChanges={showAllChanges}
            onBack={returnToArchive}
            onToggleAllChanges={() =>
              setShowAllChanges((current) => !current)
            }
          />
        ) : (
          <ReleaseArchive onSelectRelease={openRelease} />
        )}
      </main>
    </PageShell>
  );
}

function ReleaseArchive({
  onSelectRelease,
}: {
  onSelectRelease: (version: string) => void;
}) {
  return (
    <>
      <Link
        href="/whats-new"
        className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold transition"
        style={{ color: "var(--theme-text-tertiary)" }}
      >
        <span aria-hidden="true">←</span>
        What&apos;s New
      </Link>

      <header className="motion-card mb-3 px-0.5">
        <h1
          className="text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
          style={{ color: "var(--theme-text)" }}
        >
          Patch Notes
        </h1>
      </header>

      <section className="motion-card motion-card-delay-1">
        <div className="mb-2 flex items-center justify-between gap-4 px-1">
          <h2
            className="text-[0.95rem] font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            Release archive
          </h2>

          <span
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-control)",
              color: "var(--theme-text-secondary)",
            }}
          >
            {patchNotes.length} releases
          </span>
        </div>

        <div
          className="overflow-hidden rounded-[1.55rem] border"
          style={{
            borderColor: "var(--theme-border-default)",
            background: "var(--theme-surface-sheet)",
            boxShadow:
              "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent), 0 16px 34px color-mix(in srgb, var(--theme-shadow) 14%, transparent)",
          }}
        >
          {patchNotes.map((patch, index) => (
            <ReleaseArchiveRow
              key={patch.version}
              patch={patch}
              divided={index > 0}
              onSelect={() => onSelectRelease(patch.version)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function ReleaseArchiveRow({
  patch,
  divided,
  onSelect,
}: {
  patch: PatchNote;
  divided: boolean;
  onSelect: () => void;
}) {
  const isLatest = patch.badge === "Latest";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="pressable group block w-full px-4 py-4 text-left transition"
      style={{
        borderTop: divided
          ? "1px solid var(--theme-divider)"
          : "1px solid transparent",
        background: isLatest
          ? "color-mix(in srgb, var(--theme-accent) 5%, transparent)"
          : "transparent",
      }}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <IconBubble>
          <ReleaseIcon />
        </IconBubble>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="truncate text-[0.98rem] font-semibold"
              style={{ color: "var(--theme-text)" }}
            >
              {patch.version}
            </p>

            {isLatest ? <LatestPill /> : null}
          </div>

          <p
            className="mt-1 truncate text-sm"
            style={{ color: "var(--theme-text-tertiary)" }}
          >
            {patch.title}
          </p>

          <p
            className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--theme-text-tertiary)" }}
          >
            {patch.date}
            <span className="mx-1.5">·</span>
            {patch.highlights.length} changes
          </p>
        </div>

        <ArrowIcon />
      </div>
    </button>
  );
}

function ReleaseDetail({
  patch,
  showAllChanges,
  onBack,
  onToggleAllChanges,
}: {
  patch: PatchNote;
  showAllChanges: boolean;
  onBack: () => void;
  onToggleAllChanges: () => void;
}) {
  const isLatest = patch.badge === "Latest";
  const featuredHighlights = getFeaturedHighlights(patch);
  const remainingHighlights = getRemainingHighlights(patch);

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold transition"
        style={{ color: "var(--theme-text-tertiary)" }}
      >
        <span aria-hidden="true">←</span>
        All releases
      </button>

      <header className="motion-card mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--theme-accent)" }}
          >
            {patch.version}
          </p>

          {isLatest ? <LatestPill /> : null}
        </div>

        <h1
          className="mt-2 text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
          style={{ color: "var(--theme-text)" }}
        >
          {patch.title}
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: "var(--theme-text-tertiary)" }}
        >
          {patch.date} · {patch.highlights.length} changes
        </p>
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
              className="text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--theme-accent)" }}
            >
              Release overview
            </p>

            <p
              className="mt-1.5 text-sm leading-6"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              {patch.summary}
            </p>
          </div>
        </div>
      </section>

      <section className="motion-card motion-card-delay-2 mt-3">
        <h2
          className="mb-2 px-1 text-[0.95rem] font-semibold"
          style={{ color: "var(--theme-text)" }}
        >
          Key improvements
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
          {featuredHighlights.map((highlight, index) => (
            <ChangeRow
              key={`${patch.version}-featured-${highlight}`}
              text={highlight}
              divided={index > 0}
            />
          ))}
        </div>
      </section>

      {remainingHighlights.length > 0 ? (
        <section className="motion-card motion-card-delay-3 mt-3">
          <button
            type="button"
            onClick={onToggleAllChanges}
            aria-expanded={showAllChanges}
            className="pressable flex w-full items-center justify-between gap-4 rounded-[1.35rem] border px-4 py-3.5 text-left transition"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              color: "var(--theme-text)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent)",
            }}
          >
            <div>
              <p className="text-[0.95rem] font-semibold">
                {showAllChanges ? "Hide additional changes" : "View all changes"}
              </p>

              <p
                className="mt-1 text-xs"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                {remainingHighlights.length} more in this release
              </p>
            </div>

            <ChevronIcon open={showAllChanges} />
          </button>

          {showAllChanges ? (
            <div
              className="mt-2 overflow-hidden rounded-[1.55rem] border"
              style={{
                borderColor: "var(--theme-border-default)",
                background: "var(--theme-surface-sheet)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent)",
              }}
            >
              {remainingHighlights.map((highlight, index) => (
                <ChangeRow
                  key={`${patch.version}-remaining-${highlight}`}
                  text={highlight}
                  divided={index > 0}
                  compact
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function ChangeRow({
  text,
  divided = false,
  compact = false,
}: {
  text: string;
  divided?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 ${
        compact ? "py-3.5" : "py-4"
      }`}
      style={{
        borderTop: divided
          ? "1px solid var(--theme-divider)"
          : "1px solid transparent",
      }}
    >
      <span
        className="mt-[0.45rem] h-2 w-2 shrink-0 rounded-full"
        style={{ background: "var(--theme-accent)" }}
        aria-hidden="true"
      />

      <p
        className={`${
          compact ? "text-xs sm:text-sm" : "text-sm"
        } leading-6`}
        style={{ color: "var(--theme-text-secondary)" }}
      >
        {text}
      </p>
    </div>
  );
}

function LatestPill() {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
      style={{
        borderColor:
          "color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-default))",
        background:
          "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
        color: "var(--theme-accent)",
      }}
    >
      Latest
    </span>
  );
}

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] border"
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
