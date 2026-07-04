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

  async function backUpThisDevice() {
    if (!user) {
      setMessage("You need to be signed in before backing up.");
      return;
    }

    setIsBackingUp(true);
    setMessage("");

    const dashboardData = readStorageValue(summaryStorageKey, "{}");
    const billsData = readStorageValue(billsStorageKey, "[]");
    const cardsData = readStorageValue(cardsStorageKey, "[]");
    const manualLastSaved = window.localStorage.getItem(lastSavedStorageKey);

    const { error } = await supabase.from("finance_data").upsert({
      user_id: user.id,
      dashboard_data: JSON.parse(dashboardData),
      bills_data: JSON.parse(billsData),
      cards_data: JSON.parse(cardsData),
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
      setMessage("You need to be signed in before restoring.");
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

    setMessage("Restore complete. Go back to the Dashboard to view your data.");
    setIsRestoring(false);
  }

  const accountStatus = isLoading
    ? "Checking account..."
    : user?.email
      ? "Signed in"
      : "Not signed in";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-4 motion-card">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Settings
            </p>

            <Pill>Backup</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Data & Backup
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
            Manually back up or restore the tracker data saved on this device.
          </p>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
          <div className="liquid-content grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="Account" value={accountStatus} />

              <InfoItem label="Local Save" value={formatSavedTime(lastSaved)} />
            </div>

            <InfoItem
              label="Backup Type"
              value="Manual"
              detail="You choose when to back up or restore."
            />

            {message && (
              <div className="rounded-[1.25rem] border border-[#c7ad75]/25 bg-[#c7ad75]/12 px-4 py-3">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  {message}
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={backUpThisDevice}
                disabled={isBackingUp || isRestoring || !user}
                className="pressable rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-5 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBackingUp ? "Backing Up..." : "Back Up This Device"}
              </button>

              <button
                type="button"
                onClick={restoreBackup}
                disabled={isBackingUp || isRestoring || !user}
                className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-5 py-3 text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRestoring ? "Restoring..." : "Restore Backup"}
              </button>
            </div>

            <p className="text-xs leading-5 text-stone-500">
              Backup and restore only affect your tracker data. Theme choice is
              still saved locally on each device.
            </p>
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
      className="motion-card mb-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}

function InfoItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1.5 break-words text-base font-bold text-[#f5f0e8]">
        {value}
      </p>

      {detail && <p className="mt-1.5 text-sm text-stone-400">{detail}</p>}
    </div>
  );
}