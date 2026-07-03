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
  const [profileOpen, setProfileOpen] = useState(false);
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

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const accountStatus = isLoading
    ? "Checking..."
    : user?.email
      ? user.email
      : "Not signed in";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="mb-6 motion-card">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              App Settings
            </p>

            <Pill>v1.1 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Settings
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-400">
            Manage your account, appearance, backups, and app information.
          </p>
        </header>

        <section className="grid gap-4">
          <SettingsRow
            icon={<ProfileIcon />}
            title="Profile"
            description="View your signed-in account."
            status={accountStatus}
            isOpen={profileOpen}
            onToggle={() => setProfileOpen((current) => !current)}
          >
            <InfoCard label="Email" value={accountStatus} />

            <button
              type="button"
              onClick={signOut}
              disabled={!user}
              className="mt-3 flex w-full rounded-2xl border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="w-full">Sign Out</span>
            </button>
          </SettingsRow>

          <ThemeSelector />

          <SettingsRow
            icon={<BackupIcon />}
            title="Data & Backup"
            description="Manually back up or restore tracker data."
            status={`Local save: ${formatSavedTime(lastSaved)}`}
            isOpen={backupOpen}
            onToggle={() => setBackupOpen((current) => !current)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Local Save" value={formatSavedTime(lastSaved)} />

              <InfoCard
                label="Backup Type"
                value="Manual"
                detail="You choose when to back up or restore."
              />
            </div>

            {message && (
              <div className="mt-4 rounded-[1.25rem] border border-[#c7ad75]/25 bg-[#c7ad75]/14 p-4">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  {message}
                </p>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={backUpThisDevice}
                disabled={isBackingUp || isRestoring || !user}
                className="rounded-2xl border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBackingUp ? "Backing Up..." : "Back Up This Device"}
              </button>

              <button
                type="button"
                onClick={restoreBackup}
                disabled={isBackingUp || isRestoring || !user}
                className="rounded-2xl border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRestoring ? "Restoring..." : "Restore Backup"}
              </button>
            </div>
          </SettingsRow>

          <SettingsRow
            icon={<InfoIcon />}
            title="About leftovr"
            description="Version, build, and safety information."
            status="v1.1 Beta"
            isOpen={aboutOpen}
            onToggle={() => setAboutOpen((current) => !current)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Version" value="v1.1 Beta" />

              <InfoCard label="Build" value="Private Testing" />
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
                Safety Note
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-300">
                leftovr is built for personal tracking and private beta testing.
                Avoid storing full card numbers, passwords, Social Security
                numbers, bank account numbers, or other sensitive account
                details.
              </p>
            </div>
          </SettingsRow>
        </section>
      </div>
    </PageShell>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  status,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.65rem] p-5">
      <div className="liquid-content">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/12 text-[#c7ad75]">
              {icon}
            </div>

            <div className="min-w-0">
              <p className="text-lg font-semibold text-[#f5f0e8]">{title}</p>

              <p className="mt-1 text-sm leading-6 text-stone-400">
                {description}
              </p>

              <p className="mt-2 truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/70">
                {status}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/8 px-3 py-1 text-xs font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/14">
            {isOpen ? "Hide" : "View"}
          </span>
        </button>

        {isOpen && (
          <div className="mt-5 border-t border-[#f5f0e8]/10 pt-5">
            {children}
          </div>
        )}
      </div>
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
    <div className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/45 p-4">
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

function ProfileIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackupIcon() {
  return (
    <svg
      className="h-5 w-5"
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
        d="M12 12v7M9.5 14.5 12 12l2.5 2.5"
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
      className="h-5 w-5"
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