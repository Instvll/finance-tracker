"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";

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
      advancedPeriods: 0,
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
    advancedPeriods,
  };
}

function formatPayFrequency(value: PayFrequency) {
  return value === "weekly" ? "Weekly" : "Bi-weekly";
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
  const [showSavedState, setShowSavedState] = useState(false);
  const [automaticUpdateMessage, setAutomaticUpdateMessage] = useState("");

  useEffect(() => {
    const savedPreferences = readPreferences();
    const rolloverResult = getUpcomingPayday(savedPreferences);

    if (rolloverResult.didAdvance) {
      window.localStorage.setItem(
        preferencesStorageKey,
        JSON.stringify(rolloverResult.preferences)
      );

      setAutomaticUpdateMessage(
        `Next payday advanced automatically to ${formatPayday(
          rolloverResult.preferences.nextPayday
        )}.`
      );
    }

    setPreferences(rolloverResult.preferences);
    setIsLoaded(true);
  }, []);

  function updatePreferences(
    nextPreferences:
      | LeftovrPreferences
      | ((current: LeftovrPreferences) => LeftovrPreferences)
  ) {
    setPreferences((current) => {
      const resolvedPreferences =
        typeof nextPreferences === "function"
          ? nextPreferences(current)
          : nextPreferences;

      window.localStorage.setItem(
        preferencesStorageKey,
        JSON.stringify(resolvedPreferences)
      );

      return resolvedPreferences;
    });

    setAutomaticUpdateMessage("");
    setShowSavedState(true);

    window.setTimeout(() => {
      setShowSavedState(false);
    }, 1800);
  }

  function setPayFrequency(payFrequency: PayFrequency) {
    const rolloverResult = getUpcomingPayday({
      ...preferences,
      payFrequency,
    });

    updatePreferences(rolloverResult.preferences);

    if (rolloverResult.didAdvance) {
      setAutomaticUpdateMessage(
        `Next payday advanced automatically to ${formatPayday(
          rolloverResult.preferences.nextPayday
        )}.`
      );
    }
  }

  function setNextPayday(nextPayday: string) {
    const rolloverResult = getUpcomingPayday({
      ...preferences,
      nextPayday,
    });

    updatePreferences(rolloverResult.preferences);

    if (rolloverResult.didAdvance) {
      setAutomaticUpdateMessage(
        `Next payday advanced automatically to ${formatPayday(
          rolloverResult.preferences.nextPayday
        )}.`
      );
    }
  }

  function toggleRoundBills() {
    updatePreferences((current) => ({
      ...current,
      roundBillsForPlanning: !current.roundBillsForPlanning,
    }));
  }

  const payFrequencyLabel = formatPayFrequency(preferences.payFrequency);
  const paydayLabel = formatPayday(preferences.nextPayday);
  const roundingLabel = preferences.roundBillsForPlanning ? "On" : "Off";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-1.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Preferences
          </h1>
        </header>

        <section className="grid gap-2">
          <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 rounded-[2rem]">
            <div className="liquid-content dashboard-hero-content relative p-3 sm:p-3.5">
              <div
                className="dashboard-hero-glow dashboard-hero-glow-accent"
                aria-hidden="true"
              />

              <div
                className="dashboard-hero-glow dashboard-hero-glow-soft"
                aria-hidden="true"
              />

              <div
                className="dashboard-hero-reflection"
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5 pr-1">
                  <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                  <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                    Planning Setup
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>{isLoaded ? payFrequencyLabel : "Loading"}</Pill>
                </div>
              </div>

              <div className="relative mt-2.5">
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-full border border-[#c7ad75]/28 bg-[#c7ad75]/12 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.10),0_10px_24px_rgba(0,0,0,0.14)]">
                  <PlanningIcon />
                </div>

                <p className="text-[1.8rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-4xl">
                  Your pay cycle
                </p>

                <p className="mt-1 max-w-xl text-sm leading-5 text-stone-300/80">
                  Set your pay cycle once. leftovr keeps your next payday
                  current automatically.
                </p>
              </div>

              <div className="dashboard-hero-stats relative mt-2.5">
                <div className="grid gap-1 sm:grid-cols-3">
                  <PreferenceStat
                    label="Frequency"
                    value={payFrequencyLabel}
                  />

                  <PreferenceStat label="Next Payday" value={paydayLabel} />

                  <PreferenceStat label="Round Bills" value={roundingLabel} />
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-2 rounded-[1.7rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2">
                <SectionTitle title="Pay Cycle" />

                <p className="mt-1 text-sm leading-5 text-stone-400">
                  Set how often you’re paid and when your next paycheck arrives.
                </p>
              </div>

              <div className="grid gap-2">
                <SettingGroup
                  label="Pay frequency"
                  description="Used to organize bills into weekly or bi-weekly planning windows."
                >
                  <div className="dashboard-compact-panel rounded-full p-1">
                    <div className="grid grid-cols-2 gap-1">
                      <SegmentButton
                        label="Weekly"
                        active={preferences.payFrequency === "weekly"}
                        onClick={() => setPayFrequency("weekly")}
                      />

                      <SegmentButton
                        label="Bi-weekly"
                        active={preferences.payFrequency === "biweekly"}
                        onClick={() => setPayFrequency("biweekly")}
                      />
                    </div>
                  </div>
                </SettingGroup>

                <SettingGroup
                  label="Next payday"
                  description="Choose one payday. leftovr advances it automatically every 7 or 14 days."
                >
                  <div className="rounded-[1rem] border border-[#f5f0e8]/12 bg-[#11100d]/20 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(245,240,232,0.04)] transition focus-within:border-[#c7ad75]/38">
                    <input
                      type="date"
                      value={preferences.nextPayday}
                      onChange={(event) => setNextPayday(event.target.value)}
                      className="w-full bg-transparent text-base font-semibold text-[#f5f0e8] outline-none"
                    />
                  </div>
                </SettingGroup>

                <button
                  type="button"
                  aria-pressed={preferences.roundBillsForPlanning}
                  onClick={toggleRoundBills}
                  className="dashboard-preview-row pressable w-full !px-3 !py-2.5 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#f5f0e8]">
                        Round bills for planning
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-stone-400">
                        Rounds each bill up to the next dollar when calculating
                        planned totals.
                      </p>
                    </div>

                    <ToggleSwitch
                      enabled={preferences.roundBillsForPlanning}
                    />
                  </div>
                </button>
              </div>

              <div
                aria-live="polite"
                className="mt-2 rounded-[1.1rem] border border-[#f5f0e8]/8 bg-[#11100d]/18 px-3 py-2"
              >
                <p className="text-sm leading-5 text-stone-400">
                  {showSavedState
                    ? "Preferences updated."
                    : automaticUpdateMessage ||
                      "Changes save automatically on this device."}
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
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

function PreferenceStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="dashboard-hero-stat !px-3 !py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-0.5 truncate text-base font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function SettingGroup({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-preview-row !px-3 !py-2.5">
      <div className="mb-2">
        <p className="text-sm font-semibold text-[#f5f0e8]">{label}</p>

        <p className="mt-0.5 text-xs leading-5 text-stone-400">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`pressable rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-[#c7ad75]/20 text-[#f5f0e8] shadow-[inset_0_0_0_1px_rgba(199,173,117,0.26),inset_0_1px_0_rgba(245,240,232,0.08)]"
          : "text-stone-400 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-300 ${
        enabled
          ? "border-[#c7ad75]/42 bg-[#c7ad75]/24"
          : "border-[#f5f0e8]/12 bg-[#f5f0e8]/6"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full border border-[#f5f0e8]/16 bg-[#f5f0e8] shadow-[0_3px_10px_rgba(0,0,0,0.22)] transition-all duration-300 ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </span>
  );
}

function PlanningIcon() {
  return (
    <svg
      className="h-5 w-5"
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
        d="M8 3.5v4M16 3.5v4M4 9.5h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M8 13h3M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}