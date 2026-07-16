"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";
import { supabase } from "../../../lib/supabase/client";
import {
  getFinanceCloudHandshake,
  replaceCloudFinanceStateFromConfirmedLocal,
  uploadCloudFinanceState,
  type FinanceStateComparison,
} from "../../../lib/financeCloud";
import {
  flushFinanceStateRefresh,
  restoreFinanceStateFromCloud,
  saveFinanceState,
} from "../../../lib/financeStorage";
import type { FinanceState } from "../../../lib/financeState";
import {
  activateFinanceBackgroundSyncForCurrentUser,
  getFinanceBackgroundSyncStatus,
  isFinanceBackgroundSyncActiveForUser,
  subscribeFinanceBackgroundSyncStatus,
  waitForFinanceBackgroundSyncIdle,
  type FinanceBackgroundSyncStatus,
} from "../../../lib/financeSync";
import {
  checkForFinanceUpdates,
  getFinanceUpdateCheckStatus,
  getLatestFinanceUpdateCheckHandshake,
  subscribeFinanceUpdateCheckStatus,
  type FinanceUpdateCheckStatus,
} from "../../../lib/financeUpdateCheck";

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
  const [
    isConfirmingLocalRecovery,
    setIsConfirmingLocalRecovery,
  ] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [isBackgroundSyncActive, setIsBackgroundSyncActive] =
    useState(false);
  const [backgroundSyncStatus, setBackgroundSyncStatus] =
    useState<FinanceBackgroundSyncStatus | null>(null);
  const [automaticUpdateStatus, setAutomaticUpdateStatus] =
    useState<FinanceUpdateCheckStatus | null>(null);

  useEffect(() => {
    let isDisposed = false;

    void loadAccount();
    void refreshLocalFinanceState();

    setBackgroundSyncStatus(
      getFinanceBackgroundSyncStatus(),
    );
    setAutomaticUpdateStatus(
      getFinanceUpdateCheckStatus(),
    );
    applyLatestAutomaticUpdateHandshake();

    const unsubscribeBackgroundSync =
      subscribeFinanceBackgroundSyncStatus(
        setBackgroundSyncStatus,
      );

    const unsubscribeUpdateCheck =
      subscribeFinanceUpdateCheckStatus((status) => {
        if (isDisposed) {
          return;
        }

        setAutomaticUpdateStatus(status);
        applyLatestAutomaticUpdateHandshake();
      });

    void refreshAutomaticUpdateStatus();

    return () => {
      isDisposed = true;
      unsubscribeBackgroundSync();
      unsubscribeUpdateCheck();
    };
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
    setIsBackgroundSyncActive(
      isFinanceBackgroundSyncActiveForUser(
        data.user.id,
      ),
    );
    setBackgroundSyncStatus(
      getFinanceBackgroundSyncStatus(),
    );

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

  async function enableVerifiedBackgroundSync() {
    const wasActivated =
      await activateFinanceBackgroundSyncForCurrentUser();

    setIsBackgroundSyncActive(wasActivated);
    setBackgroundSyncStatus(
      getFinanceBackgroundSyncStatus(),
    );

    return wasActivated;
  }

  function applyLatestAutomaticUpdateHandshake() {
    const handshake =
      getLatestFinanceUpdateCheckHandshake();

    if (!handshake) {
      return false;
    }

    setLocalFinanceState(handshake.localState);
    setCloudFinanceState(handshake.cloudState);
    setSyncComparison(handshake.comparison);

    return true;
  }

  async function refreshAutomaticUpdateStatus() {
    const status = await checkForFinanceUpdates();

    setAutomaticUpdateStatus(status);
    applyLatestAutomaticUpdateHandshake();

    return status;
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
      const automaticStatus =
        await refreshAutomaticUpdateStatus();
      const handshake =
        getLatestFinanceUpdateCheckHandshake();

      if (!handshake) {
        if (automaticStatus.status === "error") {
          throw new Error(automaticStatus.message);
        }

        setSyncMessage(automaticStatus.message);
        return;
      }

      if (handshake.comparison === "in-sync") {
        const backgroundSyncActivated =
          await enableVerifiedBackgroundSync();

        setSyncMessage(
          backgroundSyncActivated
            ? "Everything is up to date. New saves will be protected automatically."
            : "Your data matches, but automatic saving could not be enabled on this device.",
        );
      } else {
        setSyncMessage(
          getSyncCheckMessage(handshake.comparison),
        );
      }
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
    setIsConfirmingLocalRecovery(false);
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

      const backgroundSyncActivated =
        await enableVerifiedBackgroundSync();

      setSyncMessage(
        backgroundSyncActivated
          ? "This device is now saved to your account. New changes will upload automatically."
          : "This device was saved to your account, but automatic saving could not be enabled.",
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

    if (
      syncComparison !== "cloud-only" &&
      syncComparison !== "cloud-newer" &&
      syncComparison !== "conflict"
    ) {
      setSyncError(
        "Check the cloud first. The saved account must be available before this device can be updated.",
      );
      return;
    }

    if (!cloudFinanceState) {
      setSyncError("No verified cloud finance state is available to restore.");
      return;
    }

    setSyncMessage("");
    setSyncError("");
    setIsConfirmingLocalRecovery(false);
    setIsConfirmingCloudRestore(true);
  }

  function requestLocalFinanceRecovery() {
    if (!user) {
      setSyncError("Sign in before using this device as the saved source.");
      return;
    }

    if (
      syncComparison !== "cloud-newer" &&
      syncComparison !== "conflict"
    ) {
      setSyncError(
        "Check again before choosing this device as the saved source.",
      );
      return;
    }

    if (!localFinanceState || !cloudFinanceState) {
      setSyncError(
        "Both this device and the saved account must be verified first.",
      );
      return;
    }

    setSyncMessage("");
    setSyncError("");
    setIsConfirmingCloudRestore(false);
    setIsConfirmingLocalRecovery(true);
  }

  function cancelLocalFinanceRecovery() {
    setIsConfirmingLocalRecovery(false);
  }

  async function recoverCloudFromThisDevice() {
    if (!user) {
      setSyncError("Sign in before using this device as the saved source.");
      return;
    }

    setIsUploadingState(true);
    setIsConfirmingCloudRestore(false);
    setIsConfirmingLocalRecovery(false);
    setSyncMessage("");
    setSyncError("");

    try {
      const becameIdle = await waitForFinanceBackgroundSyncIdle({
        timeoutMs: 12000,
        quietPeriodMs: 500,
      });

      if (!becameIdle) {
        throw new Error(
          "This device is still finishing a save. Wait a moment, then try again.",
        );
      }

      const localState = await refreshLocalFinanceState();

      if (!localState) {
        throw new Error(
          "No verified finance state is available on this device.",
        );
      }

      const currentHandshake =
        await getFinanceCloudHandshake(localState);

      setLocalFinanceState(currentHandshake.localState);
      setCloudFinanceState(currentHandshake.cloudState);
      setSyncComparison(currentHandshake.comparison);

      if (
        currentHandshake.comparison !== "cloud-newer" &&
        currentHandshake.comparison !== "conflict"
      ) {
        throw new Error(
          "The device or saved account changed before confirmation. Check again before continuing.",
        );
      }

      if (!currentHandshake.cloudState) {
        throw new Error(
          "No verified saved account state is available to replace.",
        );
      }

      const resolvedState =
        await replaceCloudFinanceStateFromConfirmedLocal(
          localState,
          currentHandshake.cloudState,
        );

      saveFinanceState(resolvedState, {
        scheduleCloudUpload: false,
      });

      const verifiedHandshake =
        await getFinanceCloudHandshake(resolvedState);

      setLocalFinanceState(verifiedHandshake.localState);
      setCloudFinanceState(verifiedHandshake.cloudState);
      setSyncComparison(verifiedHandshake.comparison);

      if (verifiedHandshake.comparison !== "in-sync") {
        throw new Error(
          "This device was saved to the account, but final verification did not match.",
        );
      }

      const backgroundSyncActivated =
        await enableVerifiedBackgroundSync();

      setSyncMessage(
        backgroundSyncActivated
          ? "This device is now the saved account source. Your other devices can update from it."
          : "This device was saved to the account, but automatic saving could not be enabled.",
      );

      window.location.reload();
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    } finally {
      setIsUploadingState(false);
    }
  }

  function cancelCloudFinanceRestore() {
    setIsConfirmingCloudRestore(false);
  }

  async function restoreCloudFinanceState() {
    if (!user) {
      setSyncError("Sign in before restoring cloud finance data.");
      return;
    }

    if (
      syncComparison !== "cloud-only" &&
      syncComparison !== "cloud-newer" &&
      syncComparison !== "conflict"
    ) {
      setSyncError(
        "The saved account is no longer available as the update source. Check again before continuing.",
      );
      setIsConfirmingCloudRestore(false);
      return;
    }

    setIsRestoringState(true);
    setIsConfirmingCloudRestore(false);
    setSyncMessage("");
    setSyncError("");

    try {
      const becameIdle = await waitForFinanceBackgroundSyncIdle({
        timeoutMs: 12000,
        quietPeriodMs: 500,
      });

      if (!becameIdle) {
        throw new Error(
          "This device is still finishing a save. Wait a moment, then try updating again.",
        );
      }

      const localState = await refreshLocalFinanceState();
      const currentHandshake = await getFinanceCloudHandshake(localState);

      setCloudFinanceState(currentHandshake.cloudState);
      setSyncComparison(currentHandshake.comparison);

      if (
        currentHandshake.comparison !== "cloud-only" &&
        currentHandshake.comparison !== "cloud-newer" &&
        currentHandshake.comparison !== "conflict"
      ) {
        throw new Error(
          "The device or saved account changed before the update. Check again before continuing.",
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

      const backgroundSyncActivated =
        await enableVerifiedBackgroundSync();

      setSyncMessage(
        backgroundSyncActivated
          ? "This device is up to date. New changes will upload automatically."
          : "This device was updated, but automatic saving could not be enabled.",
      );

      window.location.reload();
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

  const isAutomaticCheckRunning =
    automaticUpdateStatus?.status === "checking";

  const isSyncBusy =
    isCheckingCloud ||
    isAutomaticCheckRunning ||
    isUploadingState ||
    isRestoringState;

  const syncStatusLabel = isCheckingCloud || isAutomaticCheckRunning
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

  const isConflictResolution = syncComparison === "conflict";

  const canRestoreCloudState =
    isSignedIn &&
    !isSyncBusy &&
    Boolean(cloudFinanceState) &&
    (syncComparison === "cloud-only" ||
      syncComparison === "cloud-newer" ||
      isConflictResolution);

  const canUseThisDeviceData =
    isSignedIn &&
    !isSyncBusy &&
    Boolean(localFinanceState) &&
    Boolean(cloudFinanceState) &&
    (syncComparison === "cloud-newer" ||
      isConflictResolution);

  const backgroundUploadLabel =
    getBackgroundUploadLabel(
      isSignedIn,
      isBackgroundSyncActive,
      backgroundSyncStatus,
    );

  const syncStatusMessage = getSyncStatusMessage(
    isSignedIn,
    syncComparison,
    isBackgroundSyncActive,
    backgroundSyncStatus,
    isCheckingCloud || isAutomaticCheckRunning,
    isUploadingState,
    isRestoringState,
    automaticUpdateStatus,
  );

  const hasPrimarySyncAction =
    canUploadLocalState ||
    canRestoreCloudState ||
    canUseThisDeviceData;

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
                        Backup & Recovery
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-stone-500 sm:text-sm">
                        Export a copy or recover saved data manually.
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SectionTitle title="Cloud Sync" />

                  <p className="mt-1 text-sm leading-5 text-stone-400">
                    Keep your saved finance data available across your devices.
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>{syncStatusLabel}</Pill>
                </div>
              </div>

              <div className="mt-2 flex items-start gap-3 rounded-[1.2rem] border border-[#f5f0e8]/8 bg-[#11100d]/18 px-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#9dbdb4]/24 bg-[#9dbdb4]/10 text-[#9dbdb4] shadow-[inset_0_1px_0_rgba(245,240,232,0.06)]">
                  <CloudSyncIcon
                    comparison={syncComparison}
                    isBusy={isSyncBusy}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
                    {syncStatusLabel}
                  </p>

                  <p className="mt-0.5 text-sm leading-5 text-stone-400">
                    {syncStatusMessage}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {syncComparison === null
                      ? "leftovr checks automatically when this device becomes active."
                      : `Last checked ${formatSyncTimestamp(
                          automaticUpdateStatus?.updatedAt ??
                            cloudFinanceState?.updatedAt ??
                            localFinanceState?.updatedAt,
                        )}`}
                  </p>
                </div>
              </div>

              <div
                className={`mt-2 grid gap-2 ${
                  hasPrimarySyncAction
                    ? "sm:grid-cols-2"
                    : ""
                }`}
              >
                {canUploadLocalState ? (
                  <button
                    type="button"
                    onClick={uploadLocalFinanceState}
                    disabled={isSyncBusy}
                    className="pressable rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#c7ad75]/50 hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isUploadingState
                      ? "Saving to Account…"
                      : "Save This Device to My Account"}
                  </button>
                ) : null}

                {canUseThisDeviceData ? (
                  <button
                    type="button"
                    onClick={requestLocalFinanceRecovery}
                    disabled={isSyncBusy}
                    className="pressable rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#c7ad75]/50 hover:bg-[#c7ad75]/22 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Use This Device Data
                  </button>
                ) : null}

                {canRestoreCloudState ? (
                  <button
                    type="button"
                    onClick={requestCloudFinanceRestore}
                    disabled={isSyncBusy}
                    className="pressable rounded-full border border-[#9dbdb4]/34 bg-[#9dbdb4]/12 px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#9dbdb4]/48 hover:bg-[#9dbdb4]/18 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isRestoringState
                      ? "Updating This Device…"
                      : isConflictResolution
                        ? "Use Saved Account Data"
                        : "Update This Device"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={checkCloudFinanceState}
                  disabled={!isSignedIn || isSyncBusy}
                  className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.055] px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#f5f0e8]/[0.085] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isCheckingCloud
                    ? "Checking…"
                    : syncComparison === null
                      ? "Check for Updates"
                      : "Check Again"}
                </button>
              </div>

              {isConfirmingLocalRecovery &&
              canUseThisDeviceData ? (
                <div
                  role="dialog"
                  aria-label="Confirm saved account replacement"
                  className="mt-2 rounded-[1.05rem] border border-[#c7ad75]/28 bg-[#c7ad75]/[0.075] px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    Use this device as the saved account source?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-stone-400">
                    This will keep the finance data currently shown on this
                    device, create a newer verified version, and replace the
                    saved account copy. Use this only on the device with the
                    correct data.
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={cancelLocalFinanceRecovery}
                      className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.045] px-3 py-2 text-xs font-semibold text-stone-300 transition hover:bg-[#f5f0e8]/[0.075]"
                    >
                      Not Now
                    </button>

                    <button
                      type="button"
                      onClick={recoverCloudFromThisDevice}
                      className="pressable rounded-full border border-[#c7ad75]/42 bg-[#c7ad75]/18 px-3 py-2 text-xs font-semibold text-[#f5f0e8] transition hover:border-[#c7ad75]/58 hover:bg-[#c7ad75]/24"
                    >
                      Use This Device Data
                    </button>
                  </div>
                </div>
              ) : null}

              {isConfirmingCloudRestore && canRestoreCloudState ? (
                <div
                  role="dialog"
                  aria-label="Confirm device update"
                  className="mt-2 rounded-[1.05rem] border border-[#9dbdb4]/28 bg-[#9dbdb4]/[0.075] px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    {isConflictResolution
                      ? "Use your saved account data on this device?"
                      : "Update this device with your saved account data?"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-stone-400">
                    {isConflictResolution
                      ? "This device and your saved account contain different changes. leftovr will create a recovery copy first, then replace this device with the saved account version."
                      : "leftovr will save a recovery copy first, then bring the newer account data onto this device."}
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={cancelCloudFinanceRestore}
                      className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.045] px-3 py-2 text-xs font-semibold text-stone-300 transition hover:bg-[#f5f0e8]/[0.075]"
                    >
                      Not Now
                    </button>

                    <button
                      type="button"
                      onClick={restoreCloudFinanceState}
                      className="pressable rounded-full border border-[#9dbdb4]/42 bg-[#9dbdb4]/18 px-3 py-2 text-xs font-semibold text-[#f5f0e8] transition hover:border-[#9dbdb4]/58 hover:bg-[#9dbdb4]/24"
                    >
                      {isConflictResolution
                        ? "Use Saved Account Data"
                        : "Update This Device"}
                    </button>
                  </div>
                </div>
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

              <details className="mt-2 rounded-[1.05rem] border border-[#f5f0e8]/8 bg-[#11100d]/14">
                <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-stone-500 transition hover:text-stone-300">
                  Advanced sync details
                </summary>

                <div className="border-t border-[#f5f0e8]/8">
                  <SyncMetricRow
                    label="This Device"
                    value={formatStateRevision(localFinanceState)}
                  />

                  <SyncMetricRow
                    label="Saved Account"
                    value={
                      syncComparison === null
                        ? "Not Checked"
                        : formatStateRevision(cloudFinanceState)
                    }
                  />

                  <SyncMetricRow
                    label="Status"
                    value={getSyncComparisonLabel(syncComparison)}
                  />

                  <SyncMetricRow
                    label="Automatic Saves"
                    value={backgroundUploadLabel}
                    last
                  />
                </div>

                <div className="grid gap-1 border-t border-[#f5f0e8]/8 px-3 py-2.5 text-xs text-stone-600 sm:grid-cols-2">
                  <p>
                    Device updated{" "}
                    {formatSyncTimestamp(localFinanceState?.updatedAt)}
                  </p>

                  <p className="sm:text-right">
                    Account updated{" "}
                    {syncComparison === null
                      ? "not checked"
                      : formatSyncTimestamp(
                          cloudFinanceState?.updatedAt,
                        )}
                  </p>
                </div>

                {backgroundSyncStatus && isBackgroundSyncActive ? (
                  <p className="border-t border-[#f5f0e8]/8 px-3 py-2.5 text-xs leading-5 text-stone-600">
                    {backgroundSyncStatus.message}
                  </p>
                ) : null}
              </details>
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
  return state ? `Version ${state.revision}` : "None";
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

function getBackgroundUploadLabel(
  isSignedIn: boolean,
  isActive: boolean,
  status: FinanceBackgroundSyncStatus | null,
) {
  if (!isSignedIn) {
    return "Off";
  }

  if (!isActive) {
    return "Waiting";
  }

  switch (status?.status) {
    case "uploading":
      return "Saving";
    case "offline":
      return "Waiting for Internet";
    case "blocked":
      return "Needs Attention";
    case "error":
      return "Try Again";
    default:
      return "On";
  }
}

function getSyncComparisonLabel(comparison: FinanceStateComparison | null) {
  switch (comparison) {
    case "no-local-or-cloud-state":
      return "Ready";
    case "local-only":
    case "local-newer":
      return "Save Needed";
    case "cloud-only":
    case "cloud-newer":
      return "Update Available";
    case "in-sync":
      return "Up to Date";
    case "conflict":
      return "Needs Attention";
    default:
      return "Not Checked";
  }
}

function getSyncCheckMessage(comparison: FinanceStateComparison) {
  switch (comparison) {
    case "local-only":
    case "local-newer":
      return "This device has newer changes. Save them to your account before switching devices.";
    case "cloud-only":
    case "cloud-newer":
      return "Newer saved account data is ready for this device.";
    case "in-sync":
      return "Everything is up to date.";
    case "conflict":
      return "Changes were found in two places. Nothing was replaced.";
    default:
      return "Cloud sync is ready for your next save.";
  }
}

function getSyncStatusMessage(
  isSignedIn: boolean,
  comparison: FinanceStateComparison | null,
  isBackgroundSyncActive: boolean,
  backgroundStatus: FinanceBackgroundSyncStatus | null,
  isChecking: boolean,
  isUploading: boolean,
  isRestoring: boolean,
  automaticUpdateStatus: FinanceUpdateCheckStatus | null,
) {
  if (!isSignedIn) {
    return "Sign in to protect your data and use it on your other devices.";
  }

  if (isChecking) {
    return "Checking for the latest saved data.";
  }

  if (isUploading) {
    return "Saving this device to your account.";
  }

  if (isRestoring) {
    return "Bringing your latest saved data onto this device.";
  }

  switch (automaticUpdateStatus?.status) {
    case "offline":
      return "Your data remains available here. leftovr will check again when the internet returns.";
    case "deferred":
      return "leftovr is waiting for this device to finish saving before checking again.";
    case "error":
      return "leftovr could not check for updates. Your data was not changed.";
    default:
      break;
  }

  switch (backgroundStatus?.status) {
    case "uploading":
      return "Saving your latest changes.";
    case "offline":
      return "Your changes are safe here and will save when the internet returns.";
    case "blocked":
      return "Changes were found in more than one place. Nothing was replaced.";
    case "error":
      return "Your changes are safe on this device, but cloud saving needs another try.";
    default:
      break;
  }

  switch (comparison) {
    case "no-local-or-cloud-state":
      return "Sync is ready. Your next save can be protected by your account.";
    case "local-only":
    case "local-newer":
      return "This device has newer changes. Save them to your account before switching devices.";
    case "cloud-only":
    case "cloud-newer":
      return "A newer saved copy is ready. Update this device before making changes.";
    case "in-sync":
      return isBackgroundSyncActive
        ? "You’re all set. New changes upload automatically after you press Save."
        : "Your data matches. Check again to finish turning on automatic saving.";
    case "conflict":
      return "Changes were found in two places. Nothing has been replaced.";
    default:
      return "Check for updates before using leftovr on this device.";
  }
}

function CloudSyncIcon({
  comparison,
  isBusy,
}: {
  comparison: FinanceStateComparison | null;
  isBusy: boolean;
}) {
  if (isBusy) {
    return (
      <svg
        className="h-5 w-5 animate-pulse"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 19h9.5a4.5 4.5 0 0 0 .7-8.95A6.2 6.2 0 0 0 5.45 8.3 4.7 4.7 0 0 0 7 19Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (comparison === "in-sync") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 19h9.5a4.5 4.5 0 0 0 .7-8.95A6.2 6.2 0 0 0 5.45 8.3 4.7 4.7 0 0 0 7 19Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m8.5 13 2.1 2.1 4.8-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (
    comparison === "cloud-only" ||
    comparison === "cloud-newer"
  ) {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 19h9.5a4.5 4.5 0 0 0 .7-8.95A6.2 6.2 0 0 0 5.45 8.3 4.7 4.7 0 0 0 7 19Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v6m0 0-2.3-2.3M12 15l2.3-2.3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 19h9.5a4.5 4.5 0 0 0 .7-8.95A6.2 6.2 0 0 0 5.45 8.3 4.7 4.7 0 0 0 7 19Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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