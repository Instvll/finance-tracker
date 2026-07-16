"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";
import { supabase } from "../../../lib/supabase/client";
import {
  getFinanceCloudHandshake,
  uploadCloudFinanceState,
  type FinanceStateComparison,
} from "../../../lib/financeCloud";
import {
  flushFinanceStateRefresh,
  restoreFinanceStateFromCloud,
} from "../../../lib/financeStorage";
import type { FinanceState } from "../../../lib/financeState";

type AccountUser = {
  id: string;
  email?: string;
  createdAt?: string;
  emailConfirmedAt?: string;
  lastSignInAt?: string;
};

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [localFinanceState, setLocalFinanceState] =
    useState<FinanceState | null>(null);
  const [cloudFinanceState, setCloudFinanceState] =
    useState<FinanceState | null>(null);
  const [syncComparison, setSyncComparison] =
    useState<FinanceStateComparison | null>(null);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [isUploadingState, setIsUploadingState] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [isConfirmingCloudRestore, setIsConfirmingCloudRestore] =
    useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    void loadAccount();
    void refreshLocalFinanceState();
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
      createdAt: data.user.created_at,
      emailConfirmedAt: data.user.email_confirmed_at,
      lastSignInAt: data.user.last_sign_in_at,
    });

    setIsLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function refreshLocalFinanceState() {
    const state = await flushFinanceStateRefresh();

    setLocalFinanceState(state);
    return state;
  }

  async function checkCloudFinanceState() {
    if (!user) {
      setSyncError("Sign in before checking cloud finance data.");
      return;
    }

    setIsCheckingCloud(true);
    setIsConfirmingCloudRestore(false);
    setSyncMessage("");
    setSyncError("");

    try {
      const localState = await refreshLocalFinanceState();
      const handshake = await getFinanceCloudHandshake(localState);

      setCloudFinanceState(handshake.cloudState);
      setSyncComparison(handshake.comparison);
      setSyncMessage(getSyncCheckMessage(handshake.comparison));
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    } finally {
      setIsCheckingCloud(false);
    }
  }

  async function uploadLocalFinanceState() {
    if (!user) {
      setSyncError("Sign in before uploading finance data.");
      return;
    }

    if (syncComparison !== "local-only" && syncComparison !== "local-newer") {
      setSyncError(
        "Check the cloud first. Upload is only allowed when this device is the confirmed newer source.",
      );
      return;
    }

    setIsUploadingState(true);
    setIsConfirmingCloudRestore(false);
    setSyncMessage("");
    setSyncError("");

    try {
      const localState = await refreshLocalFinanceState();

      if (!localState) {
        throw new Error("No local finance state is available to upload.");
      }

      await uploadCloudFinanceState(localState);

      const verifiedHandshake = await getFinanceCloudHandshake(localState);

      setCloudFinanceState(verifiedHandshake.cloudState);
      setSyncComparison(verifiedHandshake.comparison);

      if (verifiedHandshake.comparison !== "in-sync") {
        throw new Error(
          "The upload completed, but the cloud read-back did not match this device.",
        );
      }

      setSyncMessage(
        "Upload verified. This device and the cloud now contain the same finance state.",
      );
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    } finally {
      setIsUploadingState(false);
    }
  }

  function requestCloudFinanceRestore() {
    if (!user) {
      setSyncError("Sign in before restoring cloud finance data.");
      return;
    }

    if (syncComparison !== "cloud-only" && syncComparison !== "cloud-newer") {
      setSyncError(
        "Check the cloud first. Restore is only allowed when the cloud is the confirmed source.",
      );
      return;
    }

    if (!cloudFinanceState) {
      setSyncError("No verified cloud finance state is available to restore.");
      return;
    }

    setSyncMessage("");
    setSyncError("");
    setIsConfirmingCloudRestore(true);
  }

  function cancelCloudFinanceRestore() {
    setIsConfirmingCloudRestore(false);
  }

  async function restoreCloudFinanceState() {
    if (!user) {
      setSyncError("Sign in before restoring cloud finance data.");
      return;
    }

    if (syncComparison !== "cloud-only" && syncComparison !== "cloud-newer") {
      setSyncError(
        "The cloud is no longer confirmed as the restore source. Check the cloud again.",
      );
      setIsConfirmingCloudRestore(false);
      return;
    }

    setIsRestoringState(true);
    setIsConfirmingCloudRestore(false);
    setSyncMessage("");
    setSyncError("");

    try {
      const localState = await refreshLocalFinanceState();
      const currentHandshake = await getFinanceCloudHandshake(localState);

      setCloudFinanceState(currentHandshake.cloudState);
      setSyncComparison(currentHandshake.comparison);

      if (
        currentHandshake.comparison !== "cloud-only" &&
        currentHandshake.comparison !== "cloud-newer"
      ) {
        throw new Error(
          "The local or cloud finance state changed before restore. Check the cloud again before continuing.",
        );
      }

      if (!currentHandshake.cloudState) {
        throw new Error(
          "No verified cloud finance state is available to restore.",
        );
      }

      const restoredResult = restoreFinanceStateFromCloud(
        currentHandshake.cloudState,
      );

      const verifiedHandshake = await getFinanceCloudHandshake(
        restoredResult.state,
      );

      setLocalFinanceState(restoredResult.state);
      setCloudFinanceState(verifiedHandshake.cloudState);
      setSyncComparison(verifiedHandshake.comparison);

      if (verifiedHandshake.comparison !== "in-sync") {
        throw new Error(
          "The cloud data was saved locally, but the final sync verification did not complete. Your pre-restore rollback snapshot is still available.",
        );
      }

      setSyncMessage(
        "Cloud restore verified. This device now matches the saved cloud finance state.",
      );
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    } finally {
      setIsRestoringState(false);
    }
  }

  const isSignedIn = Boolean(user);
  const isEmailVerified = Boolean(user?.emailConfirmedAt);

  const statusLabel = isLoading
    ? "Checking"
    : isSignedIn
      ? "Connected"
      : "Signed Out";

  const accountTitle = isLoading
    ? "Checking your account"
    : user?.email || "No account connected";

  const accountDescription = isLoading
    ? "Confirming your current leftovr session."
    : isSignedIn
      ? "Your leftovr account is active on this device."
      : "Sign in to manage your account and restore saved data.";

  const isSyncBusy = isCheckingCloud || isUploadingState || isRestoringState;

  const syncStatusLabel = isCheckingCloud
    ? "Checking"
    : isUploadingState
      ? "Uploading"
      : isRestoringState
        ? "Restoring"
        : getSyncComparisonLabel(syncComparison);

  const canUploadLocalState =
    isSignedIn &&
    !isSyncBusy &&
    (syncComparison === "local-only" || syncComparison === "local-newer");

  const canRestoreCloudState =
    isSignedIn &&
    !isSyncBusy &&
    Boolean(cloudFinanceState) &&
    (syncComparison === "cloud-only" || syncComparison === "cloud-newer");

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-1.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Account
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

              <div className="dashboard-hero-reflection" aria-hidden="true" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5 pr-1">
                  <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                  <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                    Account Access
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>{statusLabel}</Pill>
                </div>
              </div>

              <div className="relative mt-2.5">
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-[1rem] border border-[#c7ad75]/28 bg-[#c7ad75]/12 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.10),0_10px_24px_rgba(0,0,0,0.14)]">
                  <AccountIcon />
                </div>

                <p
                  className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.15rem,5.2vw,1.55rem)] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-3xl"
                  aria-live="polite"
                  title={accountTitle}
                >
                  {accountTitle}
                </p>

                <p className="mt-1 text-sm leading-5 text-stone-300/80">
                  {accountDescription}
                </p>
              </div>

              <div className="relative mt-2.5 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
                <AccountMetricRow
                  label="Status"
                  value={
                    isLoading
                      ? "Checking"
                      : isSignedIn
                        ? "Signed In"
                        : "Signed Out"
                  }
                />

                <AccountMetricRow
                  label="Email"
                  value={
                    isLoading
                      ? "Checking"
                      : isSignedIn
                        ? isEmailVerified
                          ? "Verified"
                          : "Not Verified"
                        : "Not Connected"
                  }
                />

                <AccountMetricRow
                  label="Member Since"
                  value={
                    isLoading ? "Checking" : formatAccountDate(user?.createdAt)
                  }
                  last
                />
              </div>
            </div>
          </section>

          <section className="motion-card motion-card-delay-2">
            <div className="mb-1.5 px-1">
              <SectionTitle title="Account Details" />
            </div>

            <div className="dashboard-surface relative overflow-hidden rounded-[1.55rem] border border-[#f5f0e8]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.05),0_16px_34px_rgba(0,0,0,0.08)]">
              <div className="dashboard-surface-glow" aria-hidden="true" />

              <div className="liquid-content relative">
                <DetailRow
                  icon={<EmailIcon />}
                  title="Email Address"
                  detail={
                    isLoading
                      ? "Checking your account"
                      : user?.email || "No email connected"
                  }
                  status={
                    isLoading
                      ? "Checking"
                      : isEmailVerified
                        ? "Verified"
                        : isSignedIn
                          ? "Review"
                          : "Offline"
                  }
                />

                <DetailRow
                  icon={<SessionIcon />}
                  title="Current Session"
                  detail={
                    isLoading
                      ? "Confirming this device"
                      : isSignedIn
                        ? `Last sign-in ${formatAccountDateTime(
                            user?.lastSignInAt,
                          )}`
                        : "No active account session"
                  }
                  status={isSignedIn ? "Active" : "Inactive"}
                  divided
                />

                <Link
                  href="/account/backup"
                  className="pressable group block border-t border-[#f5f0e8]/8 px-3.5 py-2.5 transition hover:bg-[#f5f0e8]/[0.035] sm:px-4 sm:py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
                      <DataIcon />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
                        Data on This Device
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-stone-500 sm:text-sm">
                        Review, back up, or restore your saved finance data.
                      </p>
                    </div>

                    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
                      Manage
                    </span>

                    <ArrowIcon />
                  </div>
                </Link>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.55rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SectionTitle title="Sync Preview" />

                  <p className="mt-1 text-sm leading-5 text-stone-400">
                    Manually test the new account sync foundation.
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>{syncStatusLabel}</Pill>
                </div>
              </div>

              <div className="rounded-[1.1rem] border border-[#c7ad75]/18 bg-[#c7ad75]/[0.055] px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c7ad75]/80">
                  Guarded Test Mode
                </p>

                <p className="mt-1 text-sm leading-5 text-stone-400">
                  Cloud restore is manual and requires confirmation. leftovr
                  saves a local rollback snapshot before replacing anything on
                  this device.
                </p>
              </div>

              <div className="mt-2 overflow-hidden rounded-[1.15rem] border border-[#f5f0e8]/8 bg-[#11100d]/18">
                <SyncMetricRow
                  label="Local Revision"
                  value={formatStateRevision(localFinanceState)}
                />

                <SyncMetricRow
                  label="Cloud Revision"
                  value={
                    syncComparison === null
                      ? "Not Checked"
                      : formatStateRevision(cloudFinanceState)
                  }
                />

                <SyncMetricRow
                  label="Comparison"
                  value={getSyncComparisonLabel(syncComparison)}
                  last
                />
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={checkCloudFinanceState}
                  disabled={!isSignedIn || isSyncBusy}
                  className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.055] px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#f5f0e8]/[0.085] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isCheckingCloud ? "Checking Cloud…" : "Check Cloud"}
                </button>

                <button
                  type="button"
                  onClick={uploadLocalFinanceState}
                  disabled={!canUploadLocalState}
                  className="pressable rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#c7ad75]/50 hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isUploadingState ? "Uploading…" : "Upload This Device"}
                </button>

                <button
                  type="button"
                  onClick={requestCloudFinanceRestore}
                  disabled={!canRestoreCloudState}
                  className="pressable rounded-full border border-[#9dbdb4]/34 bg-[#9dbdb4]/12 px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#9dbdb4]/48 hover:bg-[#9dbdb4]/18 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isRestoringState ? "Restoring…" : "Use Cloud Data"}
                </button>
              </div>

              {isConfirmingCloudRestore && canRestoreCloudState ? (
                <div
                  role="dialog"
                  aria-label="Confirm cloud finance restore"
                  className="mt-2 rounded-[1.05rem] border border-[#9dbdb4]/28 bg-[#9dbdb4]/[0.075] px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    Replace this device with{" "}
                    {formatStateRevision(cloudFinanceState)}?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-stone-400">
                    The current local finance data will be saved as a rollback
                    snapshot first. This will not change or delete the cloud
                    copy.
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={cancelCloudFinanceRestore}
                      className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.045] px-3 py-2 text-xs font-semibold text-stone-300 transition hover:bg-[#f5f0e8]/[0.075]"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={restoreCloudFinanceState}
                      className="pressable rounded-full border border-[#9dbdb4]/42 bg-[#9dbdb4]/18 px-3 py-2 text-xs font-semibold text-[#f5f0e8] transition hover:border-[#9dbdb4]/58 hover:bg-[#9dbdb4]/24"
                    >
                      Restore Cloud Data
                    </button>
                  </div>
                </div>
              ) : null}

              {!isSignedIn ? (
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Sign in to test the cloud connection.
                </p>
              ) : syncComparison === "conflict" ? (
                <p className="mt-2 text-xs leading-5 text-[#d7b27d]">
                  Upload and restore are blocked because both copies share a
                  revision but do not match.
                </p>
              ) : syncComparison === "cloud-only" ||
                syncComparison === "cloud-newer" ? (
                <p className="mt-2 text-xs leading-5 text-[#9dbdb4]">
                  Cloud restore is available. Nothing changes until you review
                  and confirm it.
                </p>
              ) : syncComparison === null ? (
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Check the cloud before uploading or restoring anything.
                </p>
              ) : null}

              {syncMessage ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 rounded-[1.05rem] border border-[#c7ad75]/24 bg-[#c7ad75]/9 px-3 py-2.5"
                >
                  <p className="text-sm leading-5 text-stone-300">
                    {syncMessage}
                  </p>
                </div>
              ) : null}

              {syncError ? (
                <div
                  role="alert"
                  className="mt-2 rounded-[1.05rem] border border-[#dc2626]/35 bg-[#dc2626]/10 px-3 py-2.5"
                >
                  <p className="text-sm leading-5 text-[#dc2626]">
                    {syncError}
                  </p>
                </div>
              ) : null}

              <div className="mt-2 grid gap-1 text-xs text-stone-500 sm:grid-cols-2">
                <p>
                  Local updated{" "}
                  {formatSyncTimestamp(localFinanceState?.updatedAt)}
                </p>

                <p className="sm:text-right">
                  Cloud updated{" "}
                  {syncComparison === null
                    ? "not checked"
                    : formatSyncTimestamp(cloudFinanceState?.updatedAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.55rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2">
                <SectionTitle title="Account Actions" />

                <p className="mt-1 text-sm leading-5 text-stone-400">
                  Manage access to leftovr on this device.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-[#f5f0e8]/8 bg-[#11100d]/18 px-3 py-2">
                <p className="text-sm leading-5 text-stone-400">
                  {isSignedIn
                    ? "Signing out will not remove financial data stored on this device."
                    : "Your local financial data remains available while signed out."}
                </p>
              </div>

              {isSignedIn ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="pressable mt-2 w-full rounded-full border border-[#dc2626]/52 bg-[#dc2626]/14 px-4 py-2 text-center text-sm font-bold text-[#dc2626] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(127,29,29,0.10)] transition hover:border-[#dc2626]/70 hover:bg-[#dc2626]/20"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="pressable mt-2 block w-full rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-2 text-center text-sm font-bold text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_24px_rgba(17,16,13,0.12)] transition hover:border-[#c7ad75]/45 hover:bg-[#c7ad75]/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}

function formatAccountDate(value?: string) {
  if (!value) {
    return "Not Available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatAccountDateTime(value?: string) {
  if (!value) {
    return "not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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

function AccountMetricRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="shrink-0 text-right text-base font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function SyncMetricRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>

      <p className="shrink-0 text-sm font-semibold text-[#f5f0e8]">{value}</p>
    </div>
  );
}

function formatStateRevision(state: FinanceState | null) {
  return state ? `Revision ${state.revision}` : "None";
}

function formatSyncTimestamp(value?: string) {
  if (!value) {
    return "not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getSyncComparisonLabel(comparison: FinanceStateComparison | null) {
  switch (comparison) {
    case "no-local-or-cloud-state":
      return "No Data";
    case "local-only":
      return "Device Only";
    case "cloud-only":
      return "Cloud Only";
    case "in-sync":
      return "In Sync";
    case "local-newer":
      return "Device Newer";
    case "cloud-newer":
      return "Cloud Newer";
    case "conflict":
      return "Needs Review";
    default:
      return "Not Checked";
  }
}

function getSyncCheckMessage(comparison: FinanceStateComparison) {
  switch (comparison) {
    case "local-only":
      return "No cloud finance state exists yet. This device is safe to upload.";
    case "cloud-only":
      return "A cloud finance state exists and is available to restore on this device.";
    case "in-sync":
      return "The local and cloud finance states match.";
    case "local-newer":
      return "This device has the newer revision and is safe to upload.";
    case "cloud-newer":
      return "The cloud has the newer revision and can be restored after confirmation.";
    case "conflict":
      return "Local and cloud data share a revision but do not match. Upload is blocked.";
    default:
      return "No local or cloud finance state was found.";
  }
}

function getSyncErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "leftovr could not complete the sync preview.";
}

function DetailRow({
  icon,
  title,
  detail,
  status,
  divided = false,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  status: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 ${
        divided ? "border-t border-[#f5f0e8]/8" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">{title}</p>

          <p className="mt-0.5 break-all text-xs leading-5 text-stone-500 sm:text-sm">
            {detail}
          </p>
        </div>

        <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
          {status}
        </span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-stone-600 transition group-hover:translate-x-0.5 group-hover:text-[#c7ad75]"
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

function AccountIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function EmailIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m5 7.5 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
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

function DataIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="12"
        cy="6"
        rx="7"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}