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
  notes_data: unknown;
  manual_last_saved: string | null;
  plan_last_saved: string | null;
  notes_last_saved: string | null;
  updated_at?: string;
};

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";

const planStorageKey = "finance-tracker-paycheck-plan";
const planLastSavedStorageKey = "finance-tracker-paycheck-plan-last-saved";

const notesStorageKey = "finance-tracker-manual-notes";
const notesLastSavedStorageKey = "finance-tracker-notes-last-saved";

function formatSavedTime(value?: string | null) {
  if (!value) {
    return "Not saved yet";
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
        setStatus("You are not logged in.");
        setEmail("");
        setUserId("");
        return;
      }

      setEmail(data.user.email || "");
      setUserId(data.user.id);
      setStatus("Logged in");

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

  async function saveToCloud() {
    if (!userId) {
      setMessage("You need to log in before saving to cloud.");
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
      notes_data: readJsonStorage(notesStorageKey, []),
      manual_last_saved: window.localStorage.getItem(lastSavedStorageKey),
      plan_last_saved: window.localStorage.getItem(planLastSavedStorageKey),
      notes_last_saved: window.localStorage.getItem(notesLastSavedStorageKey),
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
    setMessage("Saved your current browser data to cloud.");
    setIsWorking(false);
  }

  async function loadFromCloud() {
    if (!userId) {
      setMessage("You need to log in before loading cloud data.");
      return;
    }

    const confirmed = window.confirm(
      "Load cloud data onto this browser? This will replace the saved finance data on this device."
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
      setMessage("No cloud data found yet. Save to cloud first.");
      setIsWorking(false);
      return;
    }

    writeJsonStorage(summaryStorageKey, data.dashboard_data || {});
    writeJsonStorage(billsStorageKey, data.bills_data || []);
    writeJsonStorage(cardsStorageKey, data.cards_data || []);
    writeJsonStorage(planStorageKey, data.plan_data || {});
    writeJsonStorage(notesStorageKey, data.notes_data || []);

    if (data.manual_last_saved) {
      window.localStorage.setItem(lastSavedStorageKey, data.manual_last_saved);
    }

    if (data.plan_last_saved) {
      window.localStorage.setItem(
        planLastSavedStorageKey,
        data.plan_last_saved
      );
    }

    if (data.notes_last_saved) {
      window.localStorage.setItem(
        notesLastSavedStorageKey,
        data.notes_last_saved
      );
    }

    setCloudUpdatedAt(data.updated_at || null);
    setMessage("Loaded cloud data onto this browser. Refresh the dashboard to see it.");
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
          Your Account
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Save your finance tracker data to the cloud and load it on another
          device.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Status
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#f5f0e8]">
              {status}
            </h2>
          </div>

          <Pill>{email ? "Active" : "Guest"}</Pill>
        </div>

        {email ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-300/20 bg-[#2b2925] p-4">
              <p className="text-sm text-stone-400">Email</p>
              <p className="mt-1 break-words text-lg font-semibold text-[#f5f0e8]">
                {email}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-300/20 bg-[#2b2925] p-4">
              <p className="text-sm text-stone-400">Cloud backup</p>
              <p className="mt-1 text-lg font-semibold text-[#f5f0e8]">
                {formatSavedTime(cloudUpdatedAt)}
              </p>
            </div>

            {message && (
              <div className="rounded-2xl border border-stone-300/20 bg-[#171614] p-4">
                <p className="text-sm leading-6 text-stone-300">{message}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={saveToCloud}
                disabled={isWorking}
                className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorking ? "Working..." : "Save to Cloud"}
              </button>

              <button
                type="button"
                onClick={loadFromCloud}
                disabled={isWorking}
                className="rounded-2xl border border-stone-300/20 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Load from Cloud
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isWorking}
              className="w-full rounded-2xl border border-stone-300/20 px-5 py-4 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? "Logging out..." : "Logout"}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="block rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
          >
            Go to login
          </Link>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
          How this works
        </h2>

        <p className="mt-4 text-sm leading-6 text-stone-300">
          Save to Cloud uploads the finance data currently saved in this browser.
          Load from Cloud downloads your saved account data onto the device you
          are using.
        </p>
      </section>
    </PageShell>
  );
}