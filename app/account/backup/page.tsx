"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";
import { supabase } from "../../../lib/supabase/client";

type AccountUser = {
  id: string;
  email?: string;
};

type TrackerStateBackup = {
  version: 1;
  preferences: unknown;
  activeBillOccurrences: unknown;
  paidBillOccurrences: unknown;
  recentPaidActions: unknown;
};

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";
const preferencesStorageKey = "leftovr-preferences";
const activeBillOccurrencesStorageKey =
  "leftovr-active-bill-occurrences";
const paidBillsStorageKey = "leftovr-paid-bill-occurrences";
const recentPaidActionsStorageKey =
  "leftovr-recent-paid-bill-actions";
const legacyLastPaidActionStorageKey =
  "leftovr-last-paid-bill-action";

export default function BackupSettingsPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [billCount, setBillCount] = useState(0);
  const [cardCount, setCardCount] = useState(0);

  useEffect(() => {
    loadAccount();
    loadLocalDataSummary();
  }, []);

  async function loadAccount() {
    setIsLoading(true);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setUser({
      id: data.user.id,
      email: data.user.email,
    });

    setIsLoading(false);
  }

  function loadLocalDataSummary() {
    const savedTime = window.localStorage.getItem(lastSavedStorageKey);

    if (savedTime) {
      setLastSaved(savedTime);
    } else {
      setLastSaved("");
    }

    setBillCount(getStoredArrayCount(billsStorageKey));
    setCardCount(getStoredArrayCount(cardsStorageKey));
  }

  function getStoredArrayCount(key: string) {
    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) {
      return 0;
    }

    const parsedValue = parseStoredJson<unknown>(storedValue, []);

    return Array.isArray(parsedValue) ? parsedValue.length : 0;
  }

  function formatSavedTime(value: string) {
    if (!value) {
      return "Not saved yet";
    }

    const savedDate = new Date(value);

    if (Number.isNaN(savedDate.getTime())) {
      return "Not saved yet";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(savedDate);
  }

  function readStorageValue(key: string, fallback: string) {
    return window.localStorage.getItem(key) || fallback;
  }

  function parseStoredJson<T>(value: string, fallback: T) {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  function getTrackerStateBackup(): TrackerStateBackup {
    return {
      version: 1,
      preferences: parseStoredJson(
        readStorageValue(preferencesStorageKey, "{}"),
        {},
      ),
      activeBillOccurrences: parseStoredJson(
        readStorageValue(
          activeBillOccurrencesStorageKey,
          "{}",
        ),
        {},
      ),
      paidBillOccurrences: parseStoredJson(
        readStorageValue(paidBillsStorageKey, "{}"),
        {},
      ),
      recentPaidActions: parseStoredJson(
        readStorageValue(
          recentPaidActionsStorageKey,
          "[]",
        ),
        [],
      ),
    };
  }

  function restoreTrackerStateBackup(value: unknown) {
    if (!value || typeof value !== "object") {
      window.localStorage.removeItem(
        activeBillOccurrencesStorageKey,
      );
      window.localStorage.removeItem(paidBillsStorageKey);
      window.localStorage.removeItem(
        recentPaidActionsStorageKey,
      );
      window.localStorage.removeItem(
        legacyLastPaidActionStorageKey,
      );
      return;
    }

    const backup = value as Partial<TrackerStateBackup>;

    if (backup.preferences !== undefined) {
      window.localStorage.setItem(
        preferencesStorageKey,
        JSON.stringify(backup.preferences),
      );
    }

    window.localStorage.setItem(
      activeBillOccurrencesStorageKey,
      JSON.stringify(
        backup.activeBillOccurrences ?? {},
      ),
    );
    window.localStorage.setItem(
      paidBillsStorageKey,
      JSON.stringify(backup.paidBillOccurrences ?? {}),
    );
    window.localStorage.setItem(
      recentPaidActionsStorageKey,
      JSON.stringify(backup.recentPaidActions ?? []),
    );
    window.localStorage.removeItem(
      legacyLastPaidActionStorageKey,
    );
  }

  async function backUpThisDevice() {
    if (!user) {
      setMessage("Sign in before backing up.");
      return;
    }

    setIsBackingUp(true);
    setMessage("");

    const dashboardData = parseStoredJson(
      readStorageValue(summaryStorageKey, "{}"),
      {}
    );

    const billsData = parseStoredJson(
      readStorageValue(billsStorageKey, "[]"),
      []
    );

    const cardsData = parseStoredJson(
      readStorageValue(cardsStorageKey, "[]"),
      []
    );

    const manualLastSaved = window.localStorage.getItem(lastSavedStorageKey);
    const trackerState = getTrackerStateBackup();

    const { error } = await supabase.from("finance_data").upsert({
      user_id: user.id,
      dashboard_data: dashboardData,
      bills_data: billsData,
      cards_data: cardsData,
      plan_data: trackerState,
      notes_data: [],
      manual_last_saved: manualLastSaved,
      plan_last_saved: null,
      notes_last_saved: null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(`Backup failed: ${error.message}`);
      setIsBackingUp(false);
      return;
    }

    setMessage("Backup complete.");
    setIsBackingUp(false);
  }

  async function restoreBackup() {
    if (!user) {
      setMessage("Sign in before restoring.");
      return;
    }

    const confirmed = window.confirm(
      "Restore your saved backup to this device? This will replace the current tracker data on this device."
    );

    if (!confirmed) {
      return;
    }

    setIsRestoring(true);
    setMessage("");

    const { data, error } = await supabase
      .from("finance_data")
      .select(
        "dashboard_data, bills_data, cards_data, plan_data, manual_last_saved, updated_at"
      )
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      setMessage(
        error
          ? `Restore failed: ${error.message}`
          : "No backup was found for this account."
      );
      setIsRestoring(false);
      return;
    }

    window.localStorage.setItem(
      summaryStorageKey,
      JSON.stringify(data.dashboard_data || {})
    );

    window.localStorage.setItem(
      billsStorageKey,
      JSON.stringify(data.bills_data || [])
    );

    window.localStorage.setItem(
      cardsStorageKey,
      JSON.stringify(data.cards_data || [])
    );

    restoreTrackerStateBackup(data.plan_data);

    if (data.manual_last_saved) {
      window.localStorage.setItem(lastSavedStorageKey, data.manual_last_saved);
      setLastSaved(data.manual_last_saved);
    } else if (data.updated_at) {
      window.localStorage.setItem(lastSavedStorageKey, data.updated_at);
      setLastSaved(data.updated_at);
    }

    loadLocalDataSummary();

    setMessage("Restore complete.");
    setIsRestoring(false);
  }

  const accountStatus = isLoading
    ? "Checking"
    : user?.email
      ? "Signed In"
      : "Signed Out";

  const accountValue = isLoading
    ? "Checking your account..."
    : user?.email || "No account connected";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-1.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Data
          </h1>
        </header>

        <div className="grid gap-2">
          <section className="dashboard-surface motion-card motion-card-delay-1 rounded-[1.7rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SectionTitle title="Local Data" />

                  <p className="mt-1 text-sm leading-5 text-stone-400">
                    A snapshot of the tracker data stored on this device.
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>This Device</Pill>
                </div>
              </div>

              <div className="dashboard-compact-panel overflow-hidden">
                <div className="grid sm:grid-cols-[1fr_1fr_1.35fr]">
                  <DataSummaryItem
                    label="Bills"
                    value={billCount.toString()}
                  />

                  <DataSummaryItem
                    label="Credit Cards"
                    value={cardCount.toString()}
                    divider
                  />

                  <DataSummaryItem
                    label="Last Saved"
                    value={formatSavedTime(lastSaved)}
                    divider
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-2 rounded-[1.7rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <SectionHeader
                title="Backup & Restore"
                description="Save your balances, bills, cards, pay schedule, and payment progress—or restore an existing backup."
                status={accountStatus}
              />

              <div className="dashboard-preview-row mt-2 !px-3 !py-2">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
                    <AccountIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
                      Backup Account
                    </p>

                    <p className="mt-0.5 break-words text-sm font-semibold text-[#f5f0e8] sm:text-base">
                      {accountValue}
                    </p>
                  </div>
                </div>

                {!isLoading && !user ? (
                  <p className="mt-1.5 border-t border-[#f5f0e8]/8 pt-1.5 text-sm leading-5 text-stone-400">
                    Sign in from Profile to use backup and restore.
                  </p>
                ) : null}
              </div>

              {message ? <StatusMessage message={message} /> : null}

              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={backUpThisDevice}
                  disabled={isBackingUp || isRestoring || !user}
                  aria-busy={isBackingUp}
                  className="pressable rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-5 py-2 text-sm font-semibold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)] transition hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBackingUp ? "Backing Up..." : "Back Up"}
                </button>

                <button
                  type="button"
                  onClick={restoreBackup}
                  disabled={isBackingUp || isRestoring || !user}
                  aria-busy={isRestoring}
                  className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-5 py-2 text-sm font-semibold text-stone-300 shadow-[inset_0_1px_0_rgba(245,240,232,0.05)] transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRestoring ? "Restoring..." : "Restore"}
                </button>
              </div>

              <div className="mt-2 flex items-start gap-2 border-t border-[#f5f0e8]/8 px-1 pt-2">
                <DeviceIcon />

                <p className="text-xs leading-5 text-stone-500">
                  Appearance settings remain stored separately on each device.
                </p>
              </div>
            </div>
          </section>
        </div>
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

function SectionHeader({
  title,
  description,
  status,
}: {
  title: string;
  description?: string;
  status: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <SectionTitle title={title} />

        {description ? (
          <p className="mt-1 text-sm leading-5 text-stone-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0">
        <Pill>{status}</Pill>
      </div>
    </div>
  );
}

function DataSummaryItem({
  label,
  value,
  divider = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      className={[
        "min-w-0 px-3 py-2",
        divider
          ? "border-t border-[#f5f0e8]/8 sm:border-l sm:border-t-0"
          : "",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-0.5 break-words text-base font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div
      className="mt-2 rounded-[1.1rem] border border-[#c7ad75]/25 bg-[#c7ad75]/12 px-3 py-2 shadow-[inset_0_1px_0_rgba(245,240,232,0.06)]"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-[#f5f0e8]">{message}</p>
    </div>
  );
}

function AccountIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5.5 20c.6-3.6 3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-[#c7ad75]/65"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6.5"
        y="2.5"
        width="11"
        height="19"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M10 18.5h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}