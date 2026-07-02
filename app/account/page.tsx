"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { supabase } from "../../lib/supabase/client";

type CloudFinanceData = {
  user_id: string;
  dashboard_data: unknown;
  bills_data: unknown;
  cards_data: unknown;
  plan_data: unknown;
  manual_last_saved: string | null;
  plan_last_saved: string | null;
  updated_at?: string;
};

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";

const planStorageKey = "finance-tracker-paycheck-plan";
const planLastSavedStorageKey = "finance-tracker-paycheck-plan-last-saved";

function formatSavedTime(value?: string | null) {
  if (!value) {
    return "No backup yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function readJsonStorage(key: string, fallback: unknown) {
  const value = window.localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("Checking account...");
  const [message, setMessage] = useState("");
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setStatus("Signed out");
        setEmail("");
        setUserId("");
        return;
      }

      setEmail(data.user.email || "");
      setUserId(data.user.id);
      setStatus("Signed in");

      const { data: cloudData } = await supabase
        .from("finance_data")
        .select("updated_at")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (cloudData?.updated_at) {
        setCloudUpdatedAt(cloudData.updated_at);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    setIsWorking(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function backupThisDevice() {
    if (!userId) {
      setMessage("Log in before backing up this device.");
      return;
    }

    setIsWorking(true);
    setMessage("");

    const payload: CloudFinanceData = {
      user_id: userId,
      dashboard_data: readJsonStorage(summaryStorageKey, {}),
      bills_data: readJsonStorage(billsStorageKey, []),
      cards_data: readJsonStorage(cardsStorageKey, []),
      plan_data: readJsonStorage(planStorageKey, {}),
      manual_last_saved: window.localStorage.getItem(lastSavedStorageKey),
      plan_last_saved: window.localStorage.getItem(planLastSavedStorageKey),
    };

    const { data, error } = await supabase
      .from("finance_data")
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("updated_at")
      .single();

    if (error) {
      setMessage(error.message);
      setIsWorking(false);
      return;
    }

    setCloudUpdatedAt(data.updated_at);
    setMessage("Backup complete. This device's saved data is now backed up.");
    setIsWorking(false);
  }

  async function restoreBackup() {
    if (!userId) {
      setMessage("Log in before restoring a backup.");
      return;
    }

    const confirmed = window.confirm(
      "Restore your backup onto this device? This will replace the saved finance data currently on this browser."
    );

    if (!confirmed) {
      return;
    }

    setIsWorking(true);
    setMessage("");

    const { data, error } = await supabase
      .from("finance_data")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setIsWorking(false);
      return;
    }

    if (!data) {
      setMessage("No backup found yet. Back up a device first.");
      setIsWorking(false);
      return;
    }

    writeJsonStorage(summaryStorageKey, data.dashboard_data || {});
    writeJsonStorage(billsStorageKey, data.bills_data || []);
    writeJsonStorage(cardsStorageKey, data.cards_data || []);
    writeJsonStorage(planStorageKey, data.plan_data || {});

    if (data.manual_last_saved) {
      window.localStorage.setItem(lastSavedStorageKey, data.manual_last_saved);
    }

    if (data.plan_last_saved) {
      window.localStorage.setItem(
        planLastSavedStorageKey,
        data.plan_last_saved
      );
    }

    setCloudUpdatedAt(data.updated_at || null);
    setMessage("Backup restored. Refresh the dashboard to see your data.");
    setIsWorking(false);
  }

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
          Account
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Account
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Manage your sign-in and keep a backup of your finance tracker data.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Account Status
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#f5f0e8]">
              {status}
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              {email
                ? "Your account is connected on this device."
                : "Log in when you are ready to use backup and restore."}
            </p>
          </div>

          <Pill>{email ? "Connected" : "Guest"}</Pill>
        </div>

        {email ? (
          <div className="space-y-4">
            <InfoCard label="Signed in as" value={email} />
            <InfoCard label="Last backup" value={formatSavedTime(cloudUpdatedAt)} />

            {message && (
              <div className="rounded-2xl border border-stone-300/20 bg-[#171614] p-4">
                <p className="text-sm leading-6 text-stone-300">{message}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={backupThisDevice}
                disabled={isWorking}
                className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Working..." : "Back Up This Device"}
              </button>

              <button
                type="button"
                onClick={restoreBackup}
                disabled={isWorking}
                className="rounded-2xl border border-stone-300/20 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Restore Backup
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isWorking}
              className="w-full rounded-2xl border border-stone-300/20 px-5 py-4 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <Link
              href="/login"
              className="block rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className="block rounded-2xl border border-stone-300/20 px-5 py-4 text-center text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
            >
              Create Account
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-stone-100/60" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
            Backup
          </h2>
        </div>

        <div className="space-y-3 text-sm leading-6 text-stone-300">
          <p>
            <span className="font-semibold text-[#f5f0e8]">
              Back Up This Device
            </span>{" "}
            saves the finance data currently stored on this browser.
          </p>

          <p>
            <span className="font-semibold text-[#f5f0e8]">
              Restore Backup
            </span>{" "}
            brings your saved backup onto the device you are using.
          </p>

          <p className="text-stone-400">
            For now, backup is manual so you stay in control of when data moves
            between devices.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-300/20 bg-[#2b2925] p-4">
      <p className="text-sm text-stone-400">{label}</p>

      <p className="mt-1 break-words text-lg font-semibold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}