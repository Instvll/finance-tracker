"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell } from "../../../components/Layout";

type PayFrequency = "weekly" | "biweekly";

type LeftovrPreferences = {
  payFrequency: PayFrequency;
  nextPayday: string;
  roundBillsForPlanning: boolean;
};

const preferencesStorageKey = "leftovr-preferences";

const defaultPreferences: LeftovrPreferences = {
  payFrequency: "biweekly",
  nextPayday: "",
  roundBillsForPlanning: true,
};

function readPreferences() {
  const savedValue = window.localStorage.getItem(preferencesStorageKey);

  if (!savedValue) {
    return defaultPreferences;
  }

  try {
    return {
      ...defaultPreferences,
      ...(JSON.parse(savedValue) as Partial<LeftovrPreferences>),
    };
  } catch {
    return defaultPreferences;
  }
}

function parsePayday(value: string) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function formatPaydayInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getUpcomingPayday(preferences: LeftovrPreferences) {
  const paydayDate = parsePayday(preferences.nextPayday);

  if (!paydayDate) {
    return {
      preferences,
      didAdvance: false,
    };
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const intervalDays = preferences.payFrequency === "weekly" ? 7 : 14;
  const nextPaydayDate = new Date(paydayDate);
  let advancedPeriods = 0;

  while (nextPaydayDate < today && advancedPeriods < 260) {
    nextPaydayDate.setDate(nextPaydayDate.getDate() + intervalDays);
    advancedPeriods += 1;
  }

  const nextPayday = formatPaydayInputValue(nextPaydayDate);

  return {
    preferences:
      nextPayday === preferences.nextPayday
        ? preferences
        : {
            ...preferences,
            nextPayday,
          },
    didAdvance: nextPayday !== preferences.nextPayday,
  };
}

function formatPayday(value: string) {
  const parsedDate = parsePayday(value);

  if (!parsedDate) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

export default function PreferencesSettingsPage() {
  const [preferences, setPreferences] =
    useState<LeftovrPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Saved on this device.",
  );
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedPreferences = readPreferences();
    const rolloverResult = getUpcomingPayday(savedPreferences);

    if (rolloverResult.didAdvance) {
      window.localStorage.setItem(
        preferencesStorageKey,
        JSON.stringify(rolloverResult.preferences),
      );

      setStatusMessage(
        `Next payday advanced automatically to ${formatPayday(
          rolloverResult.preferences.nextPayday,
        )}.`,
      );
    }

    setPreferences(rolloverResult.preferences);
    setIsLoaded(true);

    return () => {
      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  function showSavedMessage() {
    setStatusMessage("Saved.");

    if (savedTimerRef.current !== null) {
      window.clearTimeout(savedTimerRef.current);
    }

    savedTimerRef.current = window.setTimeout(() => {
      setStatusMessage("Saved on this device.");
      savedTimerRef.current = null;
    }, 1800);
  }

  function savePreferences(nextPreferences: LeftovrPreferences) {
    setPreferences(nextPreferences);
    window.localStorage.setItem(
      preferencesStorageKey,
      JSON.stringify(nextPreferences),
    );
    showSavedMessage();
  }

  function setPayFrequency(payFrequency: PayFrequency) {
    const rolloverResult = getUpcomingPayday({
      ...preferences,
      payFrequency,
    });

    savePreferences(rolloverResult.preferences);

    if (rolloverResult.didAdvance) {
      setStatusMessage(
        `Next payday advanced automatically to ${formatPayday(
          rolloverResult.preferences.nextPayday,
        )}.`,
      );
    }
  }

  function setNextPayday(nextPayday: string) {
    const rolloverResult = getUpcomingPayday({
      ...preferences,
      nextPayday,
    });

    savePreferences(rolloverResult.preferences);

    if (rolloverResult.didAdvance) {
      setStatusMessage(
        `Next payday advanced automatically to ${formatPayday(
          rolloverResult.preferences.nextPayday,
        )}.`,
      );
    }
  }

  function toggleRoundBills() {
    savePreferences({
      ...preferences,
      roundBillsForPlanning: !preferences.roundBillsForPlanning,
    });
  }

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
            Preferences
          </h1>
        </header>

        <section
          className="motion-card motion-card-delay-1 overflow-hidden rounded-[1.5rem] border"
          style={{
            borderColor: "var(--theme-border-default)",
            background: "var(--theme-surface-sheet)",
            boxShadow:
              "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 64%, transparent)",
          }}
          aria-busy={!isLoaded}
        >
          <PreferenceSection>
            <div>
              <h2
                className="text-[1rem] font-semibold"
                style={{ color: "var(--theme-text)" }}
              >
                Pay frequency
              </h2>

              <p
                className="mt-1 text-sm leading-5"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                How leftovr groups bills between paydays.
              </p>
            </div>

            <div
              className="mt-3 grid grid-cols-2 gap-1 rounded-[1rem] border p-1"
              style={{
                borderColor: "var(--theme-border-default)",
                background: "var(--theme-surface-control)",
              }}
            >
              <SegmentButton
                label="Weekly"
                active={preferences.payFrequency === "weekly"}
                disabled={!isLoaded}
                onClick={() => setPayFrequency("weekly")}
              />

              <SegmentButton
                label="Bi-weekly"
                active={preferences.payFrequency === "biweekly"}
                disabled={!isLoaded}
                onClick={() => setPayFrequency("biweekly")}
              />
            </div>
          </PreferenceSection>

          <PreferenceDivider />

          <PreferenceSection>
            <label
              htmlFor="next-payday"
              className="block text-[1rem] font-semibold"
              style={{ color: "var(--theme-text)" }}
            >
              Next payday
            </label>

            <p
              className="mt-1 text-sm leading-5"
              style={{ color: "var(--theme-text-tertiary)" }}
            >
              Advances automatically every 7 or 14 days.
            </p>

            <div
              className="relative mt-3 rounded-[1rem] border"
              style={{
                borderColor: "var(--theme-border-default)",
                background: "var(--theme-surface-control)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 48%, transparent)",
              }}
            >
              <input
                id="next-payday"
                type="date"
                value={preferences.nextPayday}
                disabled={!isLoaded}
                onChange={(event) => setNextPayday(event.target.value)}
                className="w-full bg-transparent py-3 pl-3.5 pr-12 text-base font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ color: "var(--theme-text)" }}
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--theme-accent)" }}
              >
                <CalendarIcon />
              </span>
            </div>
          </PreferenceSection>

          <PreferenceDivider />

          <button
            type="button"
            aria-pressed={preferences.roundBillsForPlanning}
            disabled={!isLoaded}
            onClick={toggleRoundBills}
            className="pressable flex w-full items-center justify-between gap-4 px-5 py-5 text-left disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="min-w-0">
              <span
                className="block text-[1rem] font-semibold"
                style={{ color: "var(--theme-text)" }}
              >
                Round bills for planning
              </span>

              <span
                className="mt-1 block text-sm leading-5"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                Round each bill up to the next dollar.
              </span>
            </span>

            <ToggleSwitch enabled={preferences.roundBillsForPlanning} />
          </button>
        </section>

        <p
          aria-live="polite"
          className="motion-card motion-card-delay-2 px-3 pt-3 text-center text-[0.76rem] leading-5"
          style={{ color: "var(--theme-text-tertiary)" }}
        >
          {statusMessage}
        </p>
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

function PreferenceSection({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="px-5 py-5">{children}</div>;
}

function PreferenceDivider() {
  return (
    <div
      className="mx-5 h-px"
      style={{ background: "var(--theme-divider)" }}
      aria-hidden="true"
    />
  );
}

function SegmentButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className="pressable rounded-[0.78rem] px-3 py-2.5 text-sm font-semibold transition-[background,border-color,color,box-shadow] duration-200 disabled:cursor-not-allowed"
      style={{
        border: `1px solid ${
          active
            ? "color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-default))"
            : "transparent"
        }`,
        background: active
          ? "color-mix(in srgb, var(--theme-accent) 12%, var(--theme-surface-sheet))"
          : "transparent",
        color: active
          ? "var(--theme-text)"
          : "var(--theme-text-tertiary)",
        boxShadow: active
          ? "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 72%, transparent), 0 4px 14px color-mix(in srgb, var(--theme-accent) 10%, transparent)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}


function CalendarIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 3V6M17 3V6M4.5 9H19.5M6.5 5H17.5C18.6046 5 19.5 5.89543 19.5 7V18C19.5 19.1046 18.6046 20 17.5 20H6.5C5.39543 20 4.5 19.1046 4.5 18V7C4.5 5.89543 5.39543 5 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-7 w-12 shrink-0 rounded-full border transition-[background,border-color] duration-200"
      style={{
        borderColor: enabled
          ? "color-mix(in srgb, var(--theme-accent) 58%, var(--theme-border-default))"
          : "var(--theme-border-default)",
        background: enabled
          ? "color-mix(in srgb, var(--theme-accent) 54%, var(--theme-surface-control))"
          : "var(--theme-surface-control)",
      }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full border transition-[left,background,border-color] duration-200"
        style={{
          left: enabled ? "1.45rem" : "0.25rem",
          borderColor: "var(--theme-border-default)",
          background: enabled
            ? "color-mix(in srgb, var(--theme-highlight) 88%, white)"
            : "var(--theme-text-secondary)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
        }}
      />
    </span>
  );
}