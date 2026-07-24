"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell } from "../../components/Layout";
import {
  getFinanceUpdateCheckStatus,
  subscribeFinanceUpdateCheckStatus,
  type FinanceUpdateCheckStatus,
} from "../../lib/financeUpdateCheck";
import {
  getFinanceBackgroundSyncStatus,
  subscribeFinanceBackgroundSyncStatus,
  type FinanceBackgroundSyncStatus,
} from "../../lib/financeSync";

type ThemeId =
  | "classic"
  | "mocha"
  | "forest"
  | "slate"
  | "rose-gold"
  | "classic-light"
  | "mocha-light"
  | "forest-light"
  | "slate-light"
  | "rose-gold-light"
  | "july-fourth";

type PayFrequency = "weekly" | "biweekly";

type StoredPreferences = {
  payFrequency?: PayFrequency;
};

type SettingsRowItem = {
  title: string;
  description: string;
  href: string;
  value: string;
  icon: ReactNode;
  valueLive?: boolean;
};

const themeStorageKey = "leftovr-theme";
const preferencesStorageKey = "leftovr-preferences";

const themeNames: Record<ThemeId, string> = {
  classic: "leftovr Dark",
  mocha: "Mocha",
  forest: "Forest",
  slate: "Slate",
  "rose-gold": "Rose Gold",
  "classic-light": "leftovr Light",
  "mocha-light": "Mocha Light",
  "forest-light": "Forest Light",
  "slate-light": "Slate Light",
  "rose-gold-light": "Rose Gold Light",
  "july-fourth": "Fourth of July",
};

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && value in themeNames);
}

function readThemeName() {
  const savedTheme = window.localStorage.getItem(themeStorageKey);

  return isThemeId(savedTheme)
    ? themeNames[savedTheme]
    : themeNames.classic;
}

function readPayFrequencyLabel() {
  const savedPreferences = window.localStorage.getItem(
    preferencesStorageKey,
  );

  if (!savedPreferences) {
    return "Bi-weekly";
  }

  try {
    const preferences = JSON.parse(
      savedPreferences,
    ) as StoredPreferences;

    return preferences.payFrequency === "weekly"
      ? "Weekly"
      : "Bi-weekly";
  } catch {
    return "Bi-weekly";
  }
}

export default function SettingsPage() {
  const [themeName, setThemeName] = useState("leftovr Dark");
  const [payFrequencyLabel, setPayFrequencyLabel] =
    useState("Bi-weekly");
  const [updateStatus, setUpdateStatus] =
    useState<FinanceUpdateCheckStatus | null>(null);
  const [backgroundStatus, setBackgroundStatus] =
    useState<FinanceBackgroundSyncStatus | null>(null);

  useEffect(() => {
    function refreshLocalSettings() {
      setThemeName(readThemeName());
      setPayFrequencyLabel(readPayFrequencyLabel());
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshLocalSettings();
      }
    }

    refreshLocalSettings();

    window.addEventListener("focus", refreshLocalSettings);
    window.addEventListener("pageshow", refreshLocalSettings);
    window.addEventListener("storage", refreshLocalSettings);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener("focus", refreshLocalSettings);
      window.removeEventListener("pageshow", refreshLocalSettings);
      window.removeEventListener("storage", refreshLocalSettings);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  useEffect(() => {
    setUpdateStatus(getFinanceUpdateCheckStatus());
    setBackgroundStatus(getFinanceBackgroundSyncStatus());

    const unsubscribeUpdate =
      subscribeFinanceUpdateCheckStatus(setUpdateStatus);
    const unsubscribeBackground =
      subscribeFinanceBackgroundSyncStatus(setBackgroundStatus);

    return () => {
      unsubscribeUpdate();
      unsubscribeBackground();
    };
  }, []);

  const syncLabel = getSyncLabel(
    updateStatus,
    backgroundStatus,
  );

  const settingsItems: SettingsRowItem[] = [
    {
      title: "Appearance",
      description: "Themes and visual style.",
      href: "/account/appearance",
      value: themeName,
      icon: <AppearanceIcon />,
    },
    {
      title: "Planning Preferences",
      description: "Pay schedule and planning behavior.",
      href: "/account/preferences",
      value: payFrequencyLabel,
      icon: <PreferencesIcon />,
    },
    {
      title: "Account & Sync",
      description: "Account, devices, and automatic saving.",
      href: "/account/profile",
      value: syncLabel,
      icon: <SyncIcon />,
      valueLive: true,
    },
    {
      title: "About leftovr",
      description: "Version and release information.",
      href: "/account/about",
      value: "v2.0 Beta",
      icon: <InfoIcon />,
    },
  ];

  return (
    <PageShell>
      <TopNav />

      <main className="min-h-[70vh] pb-3">
        <header className="motion-card mb-3 px-0.5">
          <p
            className="text-[0.66rem] font-semibold uppercase tracking-[0.3em]"
            style={{
              color:
                "color-mix(in srgb, var(--theme-accent) 82%, var(--theme-text))",
            }}
          >
            App Settings
          </p>

          <h1
            className="mt-1.5 text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
            style={{ color: "var(--theme-text)" }}
          >
            Settings
          </h1>

          <p
            className="mt-2 max-w-[31rem] text-sm leading-6"
            style={{ color: "var(--theme-text-secondary)" }}
          >
            Personalize leftovr and manage how it plans and saves.
          </p>
        </header>

        <section className="motion-card motion-card-delay-1">
          <div
            className="relative isolate overflow-hidden rounded-[1.5rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 72%, transparent), 0 14px 30px color-mix(in srgb, var(--theme-shadow) 12%, transparent)",
            }}
          >
            {settingsItems.map((item, index) => (
              <SettingsRow
                key={item.href}
                item={item}
                divided={index > 0}
              />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function SettingsRow({
  item,
  divided,
}: {
  item: SettingsRowItem;
  divided: boolean;
}) {
  return (
    <Link
      href={item.href}
      className="pressable group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{
        borderTop: divided
          ? "1px solid var(--theme-divider)"
          : undefined,
      }}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3.5 sm:px-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] border transition duration-200"
          style={{
            borderColor:
              "color-mix(in srgb, var(--theme-accent) 24%, var(--theme-border-default))",
            background:
              "color-mix(in srgb, var(--theme-accent) 9%, var(--theme-surface-control))",
            color: "var(--theme-accent)",
            boxShadow:
              "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 68%, transparent)",
          }}
          aria-hidden="true"
        >
          {item.icon}
        </span>

        <div className="min-w-0">
          <p
            className="text-[0.96rem] font-semibold tracking-[-0.012em]"
            style={{ color: "var(--theme-text)" }}
          >
            {item.title}
          </p>

          <p
            className="mt-0.5 text-xs leading-5"
            style={{ color: "var(--theme-text-tertiary)" }}
          >
            {item.description}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className="max-w-[7.5rem] truncate text-right text-xs font-semibold sm:max-w-[10rem] sm:text-sm"
            style={{ color: "var(--theme-text-secondary)" }}
            aria-live={item.valueLive ? "polite" : undefined}
          >
            {item.value}
          </span>

          <ArrowIcon />
        </div>
      </div>
    </Link>
  );
}

function getSyncLabel(
  updateStatus: FinanceUpdateCheckStatus | null,
  backgroundStatus: FinanceBackgroundSyncStatus | null,
) {
  if (
    backgroundStatus?.status === "uploading" ||
    updateStatus?.status === "save-needed"
  ) {
    return "Saving";
  }

  if (updateStatus?.status === "checking") {
    return "Checking";
  }

  if (updateStatus?.status === "update-available") {
    return "Update Ready";
  }

  if (
    updateStatus?.status === "needs-attention" ||
    backgroundStatus?.status === "blocked"
  ) {
    return "Review";
  }

  if (
    updateStatus?.status === "offline" ||
    backgroundStatus?.status === "offline"
  ) {
    return "Offline";
  }

  if (
    updateStatus?.status === "signed-out" ||
    backgroundStatus?.status === "inactive" ||
    backgroundStatus?.status === "protected"
  ) {
    return "Sign In";
  }

  if (
    updateStatus?.status === "error" ||
    backgroundStatus?.status === "error"
  ) {
    return "Try Again";
  }

  if (
    updateStatus?.status === "up-to-date" ||
    backgroundStatus?.status === "saved" ||
    backgroundStatus?.status === "ready"
  ) {
    return "In Sync";
  }

  return "Ready";
}

function ArrowIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0 transition duration-200 group-hover:translate-x-0.5"
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

function AppearanceIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3a9 9 0 0 0 0 18h.6a2.2 2.2 0 0 0 1.6-3.7 1.4 1.4 0 0 1 1-2.4H16a5 5 0 0 0 5-5C21 6.1 17 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M7.6 10.2h.01M9.9 6.9h.01M14.1 6.9h.01M16.4 10.2h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PreferencesIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M8 12h11M11 17h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="7"
        cy="7"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17"
        cy="12"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="9"
        cy="17"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 18a5 5 0 0 1-.8-9.9A6.5 6.5 0 0 1 18.8 10 4 4 0 0 1 18 18H7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m8.8 14.3 2.1 2.1 4.5-4.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 10v6M12 7.5h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}