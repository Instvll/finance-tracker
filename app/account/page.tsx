"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import ThemeSelector from "../../components/ThemeSelector";
import { PageShell, Pill } from "../../components/Layout";
import { supabase } from "../../lib/supabase/client";

type AccountUser = {
  id: string;
  email?: string;
};

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";

export default function AccountPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

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
      return "No local save yet";
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

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-lg font-semibold uppercase tracking-[0.24em] text-stone-300">
            Settings
          </p>

          <Pill>v1.0 Beta</Pill>
        </div>

        <p className="max-w-xl text-sm leading-6 text-stone-300">
          Customize leftovr, manage your account, and control your backup tools.
        </p>
      </header>

      <section className="grid gap-4">
        <ThemeSelector />

        <SettingsDropdown
          eyebrow="Account"
          title="Signed In"
          description="View your current account and sign out when needed."
          isOpen={accountOpen}
          onToggle={() => setAccountOpen((current) => !current)}
        >
          <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
              Email
            </p>

            <p className="mt-2 break-words text-lg font-bold text-[#f5f0e8]">
              {isLoading ? "Loading..." : user?.email || "Not signed in"}
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 w-full rounded-2xl border border-[#f5f0e8]/12 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          >
            Sign Out
          </button>
        </SettingsDropdown>

        <SettingsDropdown
          eyebrow="Backup"
          title="Backup Tools"
          description="Save this device's tracker data to your account, then restore it on another device when needed."
          isOpen={backupOpen}
          onToggle={() => setBackupOpen((current) => !current)}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Local Save" value={formatSavedTime(lastSaved)} />

            <InfoCard
              label="Backup Type"
              value="Manual"
              detail="You choose when to back up or restore."
            />
          </div>

          {message && (
            <div className="mb-4 rounded-[1.25rem] border border-[#c7ad75]/25 bg-[#c7ad75]/14 p-4">
              <p className="text-sm font-semibold text-[#f5f0e8]">{message}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={backUpThisDevice}
              disabled={isBackingUp || isRestoring || !user}
              className="rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBackingUp ? "Backing Up..." : "Back Up This Device"}
            </button>

            <button
              type="button"
              onClick={restoreBackup}
              disabled={isBackingUp || isRestoring || !user}
              className="rounded-2xl border border-[#f5f0e8]/12 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRestoring ? "Restoring..." : "Restore Backup"}
            </button>
          </div>
        </SettingsDropdown>

        <SettingsDropdown
          eyebrow="About"
          title="About leftovr"
          description="Version notes and beta safety information."
          isOpen={aboutOpen}
          onToggle={() => setAboutOpen((current) => !current)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label="Version" value="v1.0 Beta" />

            <InfoCard label="Build Type" value="Private Testing" />
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
              Important Note
            </p>

            <p className="mt-2 text-sm leading-6 text-stone-300">
              leftovr is currently built for personal tracking and private beta
              testing. Avoid storing full card numbers, passwords, Social
              Security numbers, bank account numbers, or other sensitive account
              details.
            </p>
          </div>
        </SettingsDropdown>
      </section>
    </PageShell>
  );
}

function SettingsDropdown({
  eyebrow,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
            {eyebrow}
          </p>

          <div className="mb-3 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />

            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
              {title}
            </h2>
          </div>

          <p className="text-sm leading-6 text-stone-400">{description}</p>
        </div>

        <span className="shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
          {isOpen ? "Hide" : "View"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-5 border-t border-[#f5f0e8]/10 pt-5">
          {children}
        </div>
      )}
    </section>
  );
}

function InfoCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>

      {detail && <p className="mt-2 text-sm text-stone-400">{detail}</p>}
    </div>
  );
}