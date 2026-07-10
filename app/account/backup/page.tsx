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

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";

export default function BackupSettingsPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    loadAccount();
    loadLastSaved();
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

  function loadLastSaved() {
    const savedTime = window.localStorage.getItem(lastSavedStorageKey);

    if (savedTime) {
      setLastSaved(savedTime);
    }
  }

  function formatSavedTime(value: string) {
    if (!value) {
      return "No local save";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
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

    const { error } = await supabase.from("finance_data").upsert({
      user_id: user.id,
      dashboard_data: dashboardData,
      bills_data: billsData,
      cards_data: cardsData,
      plan_data: {},
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
        "dashboard_data, bills_data, cards_data, manual_last_saved, updated_at"
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

    if (data.manual_last_saved) {
      window.localStorage.setItem(lastSavedStorageKey, data.manual_last_saved);
      setLastSaved(data.manual_last_saved);
    } else if (data.updated_at) {
      window.localStorage.setItem(lastSavedStorageKey, data.updated_at);
      setLastSaved(data.updated_at);
    }

    setMessage("Restore complete.");
    setIsRestoring(false);
  }

  const accountStatus = isLoading
    ? "Checking"
    : user?.email
      ? "Signed In"
      : "Signed Out";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-3 motion-card">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Settings
            </p>

            <Pill>Backup</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Data & Backup
          </h1>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.7rem] p-3.5">
          <div className="liquid-content grid gap-2.5">
            <div className="mb-0.5 flex items-center justify-between gap-4">
              <SectionTitle title="Manual Backup" />

              <span className="shrink-0 rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
                {accountStatus}
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <InfoItem label="Account" value={user?.email || accountStatus} />

              <InfoItem label="Local Save" value={formatSavedTime(lastSaved)} />
            </div>

            {message ? <StatusMessage message={message} /> : null}

            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={backUpThisDevice}
                disabled={isBackingUp || isRestoring || !user}
                className="pressable rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-5 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBackingUp ? "Backing Up..." : "Back Up"}
              </button>

              <button
                type="button"
                onClick={restoreBackup}
                disabled={isBackingUp || isRestoring || !user}
                className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-5 py-2.5 text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRestoring ? "Restoring..." : "Restore"}
              </button>
            </div>

            <div className="rounded-[1.05rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 px-3.5 py-2.5">
              <p className="text-sm text-stone-400">
                Themes stay local to each device.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-3 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/22 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1.5 break-words text-base font-semibold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[#c7ad75]/25 bg-[#c7ad75]/12 px-3.5 py-2.5">
      <p className="text-sm font-semibold text-[#f5f0e8]">{message}</p>
    </div>
  );
}