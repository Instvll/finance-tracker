"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell } from "../../../components/Layout";
import { supabase } from "../../../lib/supabase/client";
import {
  getFinanceCloudHandshake,
  replaceCloudFinanceStateFromConfirmedLocal,
  uploadCloudFinanceState,
  type FinanceStateComparison,
} from "../../../lib/financeCloud";
import {
  flushFinanceStateRefresh,
  saveFinanceState,
} from "../../../lib/financeStorage";
import type { FinanceState } from "../../../lib/financeState";
import { updateThisDeviceFromSavedAccount } from "../../../lib/financeDeviceUpdate";
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
      const result = await updateThisDeviceFromSavedAccount({
        allowConflict: syncComparison === "conflict",
      });

      setLocalFinanceState(result.handshake.localState);
      setCloudFinanceState(result.handshake.cloudState);
      setSyncComparison(result.handshake.comparison);
      setIsBackgroundSyncActive(result.backgroundSyncActive);
      setBackgroundSyncStatus(getFinanceBackgroundSyncStatus());

      setSyncMessage(
        result.backgroundSyncActive
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

  const consumerSyncTitle = getConsumerSyncTitle(
    isSignedIn,
    syncComparison,
    backgroundSyncStatus,
    automaticUpdateStatus,
    isCheckingCloud || isAutomaticCheckRunning,
    isUploadingState,
    isRestoringState,
  );

  const consumerSyncPill = getConsumerSyncPillLabel(
    isSignedIn,
    syncComparison,
    backgroundSyncStatus,
    automaticUpdateStatus,
    isCheckingCloud || isAutomaticCheckRunning,
    isUploadingState,
    isRestoringState,
  );

  const automaticSavingTitle = getAutomaticSavingTitle(
    isSignedIn,
    isBackgroundSyncActive,
    backgroundSyncStatus,
  );

  const automaticSavingDetail = getAutomaticSavingDetail(
    isSignedIn,
    isBackgroundSyncActive,
    backgroundSyncStatus,
  );

  const showSaveNowAction =
    canUploadLocalState &&
    (!isBackgroundSyncActive ||
      backgroundSyncStatus?.status === "error" ||
      backgroundSyncStatus?.status === "blocked");

  const showUseThisDeviceDataAction =
    isConflictResolution && canUseThisDeviceData;

  const showAdvancedUseThisDeviceAction =
    canUseThisDeviceData && !isConflictResolution;

  const shouldShowRetryAction =
    isSignedIn &&
    !isSyncBusy &&
    automaticUpdateStatus?.status === "error";

  const hasVisibleSyncActions =
    canRestoreCloudState ||
    showSaveNowAction ||
    showUseThisDeviceDataAction ||
    shouldShowRetryAction;

  return (
    <PageShell>
      <TopNav />

      <main className="min-h-[70vh] pb-3">
        <BackLink />

        <header className="motion-card mb-3 px-0.5">
          <h1
            className="text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
            style={{ color: "var(--theme-text)" }}
          >
            Account &amp; Sync
          </h1>
        </header>

        <section className="grid gap-3">
          <section
            id="account-sync"
            className="motion-card motion-card-delay-1 scroll-mt-24 overflow-hidden rounded-[1.5rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 64%, transparent)",
            }}
          >
            <div className="px-5 py-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.05rem] border"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--theme-accent) 30%, var(--theme-border-default))",
                    background:
                      "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
                    color: "var(--theme-accent)",
                  }}
                >
                  <CloudSyncIcon
                    comparison={syncComparison}
                    isBusy={isSyncBusy}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2
                        className="text-[1.08rem] font-semibold leading-6 tracking-[-0.02em]"
                        style={{ color: "var(--theme-text)" }}
                        aria-live="polite"
                      >
                        {consumerSyncTitle}
                      </h2>

                      <p
                        className="mt-1 text-sm leading-5"
                        style={{ color: "var(--theme-text-tertiary)" }}
                      >
                        {syncStatusMessage}
                      </p>
                    </div>

                    <StatusBadge>{consumerSyncPill}</StatusBadge>
                  </div>
                </div>
              </div>

              <div
                className="my-4 h-px"
                style={{ background: "var(--theme-divider)" }}
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background:
                          isBackgroundSyncActive &&
                          backgroundSyncStatus?.status !== "error" &&
                          backgroundSyncStatus?.status !== "blocked"
                            ? "var(--theme-accent)"
                            : "var(--theme-text-tertiary)",
                        boxShadow:
                          isBackgroundSyncActive &&
                          backgroundSyncStatus?.status !== "error" &&
                          backgroundSyncStatus?.status !== "blocked"
                            ? "0 0 12px color-mix(in srgb, var(--theme-accent) 26%, transparent)"
                            : "none",
                      }}
                      aria-hidden="true"
                    />

                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--theme-text)" }}
                    >
                      {automaticSavingTitle}
                    </p>
                  </div>

                  <p
                    className="mt-1 pl-4 text-xs leading-5"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    {automaticSavingDetail}
                  </p>
                </div>

                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: "var(--theme-text-secondary)" }}
                >
                  {backgroundUploadLabel}
                </span>
              </div>

              {hasVisibleSyncActions ? (
                <div
                  className={`mt-4 grid gap-2 ${
                    [
                      canRestoreCloudState,
                      showSaveNowAction,
                      showUseThisDeviceDataAction,
                      shouldShowRetryAction,
                    ].filter(Boolean).length > 1
                      ? "sm:grid-cols-2"
                      : ""
                  }`}
                >
                  {canRestoreCloudState ? (
                    <PrimaryAction
                      onClick={requestCloudFinanceRestore}
                      disabled={isSyncBusy}
                    >
                      {isRestoringState
                        ? "Updating This Device…"
                        : isConflictResolution
                          ? "Use Saved Account Data"
                          : "Update This Device"}
                    </PrimaryAction>
                  ) : null}

                  {showUseThisDeviceDataAction ? (
                    <SecondaryAction
                      onClick={requestLocalFinanceRecovery}
                      disabled={isSyncBusy}
                    >
                      Keep This Device&apos;s Data
                    </SecondaryAction>
                  ) : null}

                  {showSaveNowAction ? (
                    <PrimaryAction
                      onClick={uploadLocalFinanceState}
                      disabled={isSyncBusy}
                    >
                      {isUploadingState ? "Saving…" : "Save Now"}
                    </PrimaryAction>
                  ) : null}

                  {shouldShowRetryAction ? (
                    <SecondaryAction
                      onClick={checkCloudFinanceState}
                      disabled={!isSignedIn || isSyncBusy}
                    >
                      Try Again
                    </SecondaryAction>
                  ) : null}
                </div>
              ) : null}

              {isConfirmingLocalRecovery && canUseThisDeviceData ? (
                <ConfirmationPanel
                  title="Keep the data on this device?"
                  detail="Choose this only when the information shown here is the copy you want on your other devices."
                  cancelLabel="Not Now"
                  confirmLabel="Keep This Device's Data"
                  onCancel={cancelLocalFinanceRecovery}
                  onConfirm={recoverCloudFromThisDevice}
                />
              ) : null}

              {isConfirmingCloudRestore && canRestoreCloudState ? (
                <ConfirmationPanel
                  title={
                    isConflictResolution
                      ? "Use the data saved to your account?"
                      : "Update this device?"
                  }
                  detail={
                    isConflictResolution
                      ? "The saved account copy will replace what is currently shown here. leftovr creates a recovery copy first."
                      : "Your latest saved information will replace the older copy on this device. leftovr creates a recovery copy first."
                  }
                  cancelLabel="Not Now"
                  confirmLabel={
                    isConflictResolution
                      ? "Use Saved Account Data"
                      : "Update This Device"
                  }
                  onCancel={cancelCloudFinanceRestore}
                  onConfirm={restoreCloudFinanceState}
                />
              ) : null}

              {syncMessage ? (
                <Notice tone="positive">{syncMessage}</Notice>
              ) : null}

              {syncError ? (
                <Notice tone="danger">{syncError}</Notice>
              ) : null}
            </div>
          </section>

          <section
            className="motion-card motion-card-delay-2 overflow-hidden rounded-[1.5rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 64%, transparent)",
            }}
          >
            <div className="flex min-w-0 items-start gap-3.5 px-5 py-5">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.05rem] border"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--theme-accent) 24%, var(--theme-border-default))",
                  background:
                    "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
                  color: "var(--theme-accent)",
                }}
              >
                <AccountIcon />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      className="text-[1.02rem] font-semibold"
                      style={{ color: "var(--theme-text)" }}
                    >
                      Your account
                    </h2>

                    <p
                      className="mt-1 break-all text-sm leading-5"
                      style={{ color: "var(--theme-text-secondary)" }}
                      aria-live="polite"
                    >
                      {accountTitle}
                    </p>
                  </div>

                  <StatusBadge>{statusLabel}</StatusBadge>
                </div>
              </div>
            </div>

            <div
              className="mx-5 h-px"
              style={{ background: "var(--theme-divider)" }}
              aria-hidden="true"
            />

            <InfoRow
              label="Email"
              value={
                isLoading
                  ? "Checking"
                  : isEmailVerified
                    ? "Verified"
                    : isSignedIn
                      ? "Review"
                      : "Not connected"
              }
            />

            <InfoRow
              label="This device"
              value={isSignedIn ? "Connected" : "Not connected"}
            />

            <div
              className="mx-5 h-px"
              style={{ background: "var(--theme-divider)" }}
              aria-hidden="true"
            />

            <div className="px-5 py-4">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="pressable inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "#dc2626" }}
                >
                  <ExitIcon />
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="pressable inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--theme-accent)" }}
                >
                  Sign in
                  <ChevronIcon />
                </Link>
              )}
            </div>
          </section>

          <details
            id="advanced-sync"
            className="motion-card motion-card-delay-3 scroll-mt-24 overflow-hidden rounded-[1.5rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 64%, transparent)",
            }}
          >
            <summary className="group cursor-pointer list-none px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    className="text-[0.98rem] font-semibold"
                    style={{ color: "var(--theme-text)" }}
                  >
                    Advanced sync
                  </h2>

                  <p
                    className="mt-1 text-xs leading-5"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    Check devices, updates, and recovery options.
                  </p>
                </div>

                <span
                  className="transition-transform duration-200 group-open:rotate-90"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  <ChevronIcon />
                </span>
              </div>
            </summary>

            <div
              className="h-px"
              style={{ background: "var(--theme-divider)" }}
              aria-hidden="true"
            />

            <div className="px-5 py-5">
              <div className="flex items-start gap-3.5">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] border"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--theme-accent) 24%, var(--theme-border-default))",
                    background:
                      "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
                    color: "var(--theme-accent)",
                  }}
                >
                  <CloudSyncIcon
                    comparison={syncComparison}
                    isBusy={isSyncBusy}
                  />
                </span>

                <div className="min-w-0">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--theme-text)" }}
                  >
                    Your saved copies
                  </h3>

                  <p
                    className="mt-1 text-xs leading-5"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    leftovr compares this device with your account before
                    replacing anything.
                  </p>
                </div>
              </div>

              <div
                className="mt-4 overflow-hidden rounded-[1.1rem] border"
                style={{
                  borderColor: "var(--theme-border-default)",
                  background: "var(--theme-surface-control)",
                }}
              >
                <AdvancedStatusRow
                  label="This device"
                  value={getDeviceCopyLabel(
                    syncComparison,
                    localFinanceState,
                  )}
                  detail={getDeviceCopyDetail(syncComparison)}
                />

                <div
                  className="mx-4 h-px"
                  style={{ background: "var(--theme-divider)" }}
                  aria-hidden="true"
                />

                <AdvancedStatusRow
                  label="Saved account"
                  value={getSavedCopyLabel(
                    syncComparison,
                    cloudFinanceState,
                  )}
                  detail={getSavedCopyDetail(syncComparison)}
                />

                <div
                  className="mx-4 h-px"
                  style={{ background: "var(--theme-divider)" }}
                  aria-hidden="true"
                />

                <AdvancedStatusRow
                  label="Automatic saving"
                  value={backgroundUploadLabel}
                  detail={automaticSavingDetail}
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <SecondaryAction
                  onClick={checkCloudFinanceState}
                  disabled={!isSignedIn || isSyncBusy}
                >
                  {isCheckingCloud ? "Checking…" : "Check for Updates"}
                </SecondaryAction>

                {canUploadLocalState ? (
                  <SecondaryAction
                    onClick={uploadLocalFinanceState}
                    disabled={isSyncBusy}
                  >
                    Save This Device Now
                  </SecondaryAction>
                ) : null}

                {showAdvancedUseThisDeviceAction ? (
                  <div className="sm:col-span-2">
                    <SecondaryAction
                      onClick={requestLocalFinanceRecovery}
                      disabled={isSyncBusy}
                    >
                      Keep This Device&apos;s Data Instead
                    </SecondaryAction>
                  </div>
                ) : null}
              </div>

              <details
                className="mt-4 overflow-hidden rounded-[1.1rem] border"
                style={{
                  borderColor: "var(--theme-border-default)",
                  background:
                    "color-mix(in srgb, var(--theme-surface-control) 72%, transparent)",
                }}
              >
                <summary className="group cursor-pointer list-none px-4 py-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--theme-text-secondary)" }}
                      >
                        Technical details
                      </p>

                      <p
                        className="mt-0.5 text-xs leading-5"
                        style={{ color: "var(--theme-text-tertiary)" }}
                      >
                        Versions and timestamps for troubleshooting.
                      </p>
                    </div>

                    <span
                      className="transition-transform duration-200 group-open:rotate-90"
                      style={{ color: "var(--theme-text-tertiary)" }}
                    >
                      <ChevronIcon />
                    </span>
                  </div>
                </summary>

                <div
                  className="h-px"
                  style={{ background: "var(--theme-divider)" }}
                  aria-hidden="true"
                />

                <InfoRow
                  label="This device version"
                  value={formatStateRevision(localFinanceState)}
                />

                <InfoRow
                  label="Saved account version"
                  value={
                    syncComparison === null
                      ? "Not checked"
                      : formatStateRevision(cloudFinanceState)
                  }
                />

                <InfoRow
                  label="Comparison"
                  value={getSyncComparisonLabel(syncComparison)}
                />

                <InfoRow
                  label="Member since"
                  value={
                    isLoading
                      ? "Checking"
                      : formatAccountDate(user?.createdAt)
                  }
                />

                <InfoRow
                  label="Last sign-in"
                  value={
                    isLoading
                      ? "Checking"
                      : formatAccountDateTime(user?.lastSignInAt)
                  }
                />

                <div
                  className="mx-4 h-px"
                  style={{ background: "var(--theme-divider)" }}
                  aria-hidden="true"
                />

                <div
                  className="grid gap-1 px-4 py-3.5 text-xs leading-5 sm:grid-cols-2"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  <p>
                    Device updated{" "}
                    {formatSyncTimestamp(localFinanceState?.updatedAt)}
                  </p>

                  <p className="sm:text-right">
                    Account updated{" "}
                    {syncComparison === null
                      ? "not checked"
                      : formatSyncTimestamp(cloudFinanceState?.updatedAt)}
                  </p>
                </div>

                {backgroundSyncStatus && isBackgroundSyncActive ? (
                  <p
                    className="px-4 pb-3.5 text-xs leading-5"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    {backgroundSyncStatus.message}
                  </p>
                ) : null}
              </details>
            </div>
          </details>
        </section>
      </main>
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

function getDeviceCopyLabel(
  comparison: FinanceStateComparison | null,
  state: FinanceState | null,
) {
  if (!state) {
    return comparison === "cloud-only" ? "No local copy" : "Ready";
  }

  switch (comparison) {
    case "local-only":
    case "local-newer":
      return "Newer changes";
    case "cloud-only":
    case "cloud-newer":
      return "Update available";
    case "in-sync":
      return "Up to date";
    case "conflict":
      return "Review needed";
    case "no-local-or-cloud-state":
      return "Ready";
    default:
      return "Not checked";
  }
}

function getDeviceCopyDetail(
  comparison: FinanceStateComparison | null,
) {
  switch (comparison) {
    case "local-only":
    case "local-newer":
      return "This device has changes that still need to finish saving.";
    case "cloud-only":
    case "cloud-newer":
      return "A newer saved copy is available for this device.";
    case "in-sync":
      return "This device matches the copy saved to your account.";
    case "conflict":
      return "Different changes were found here and in your account.";
    case "no-local-or-cloud-state":
      return "leftovr is ready for your first saved update.";
    default:
      return "Run a check to compare this device with your account.";
  }
}

function getSavedCopyLabel(
  comparison: FinanceStateComparison | null,
  state: FinanceState | null,
) {
  if (comparison === null) {
    return "Not checked";
  }

  if (!state) {
    return "No saved copy";
  }

  switch (comparison) {
    case "local-only":
    case "local-newer":
      return "Waiting to update";
    case "cloud-only":
    case "cloud-newer":
      return "Newer copy";
    case "in-sync":
      return "Up to date";
    case "conflict":
      return "Review needed";
    case "no-local-or-cloud-state":
      return "Ready";
    default:
      return "Not checked";
  }
}

function getSavedCopyDetail(
  comparison: FinanceStateComparison | null,
) {
  switch (comparison) {
    case "local-only":
    case "local-newer":
      return "Your account will update after this device finishes saving.";
    case "cloud-only":
    case "cloud-newer":
      return "Your account has newer information ready for this device.";
    case "in-sync":
      return "Your saved account and this device match.";
    case "conflict":
      return "Nothing was replaced automatically.";
    case "no-local-or-cloud-state":
      return "No finance data has been saved yet.";
    default:
      return "Run a check to see what is saved to your account.";
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
    return "Sign in to keep your finance data available on your other devices.";
  }

  if (isChecking) {
    return "Making sure this device has your latest saved information.";
  }

  if (isUploading) {
    return "Saving this device’s latest changes to your account.";
  }

  if (isRestoring) {
    return "Bringing your latest saved information onto this device.";
  }

  switch (automaticUpdateStatus?.status) {
    case "offline":
      return "Your information is safe here. leftovr will reconnect automatically.";
    case "deferred":
      return "leftovr is finishing a save before checking again.";
    case "error":
      return "leftovr could not check your account. Your information was not changed.";
    default:
      break;
  }

  switch (backgroundStatus?.status) {
    case "uploading":
      return "Your latest changes are being saved to your account.";
    case "offline":
      return "Your changes are safe on this device and will save when the internet returns.";
    case "blocked":
      return "Changes were found in two places. Nothing was replaced.";
    case "error":
      return "Your changes are safe on this device, but account saving needs another try.";
    default:
      break;
  }

  switch (comparison) {
    case "no-local-or-cloud-state":
      return "Account saving is ready for your first finance update.";
    case "local-only":
    case "local-newer":
      return "Your latest changes are safe here and are being saved to your account.";
    case "cloud-only":
    case "cloud-newer":
      return "Your latest saved information is ready to bring onto this device.";
    case "in-sync":
      return isBackgroundSyncActive
        ? "New changes save to your account automatically."
        : "Your information matches. leftovr is finishing automatic saving setup.";
    case "conflict":
      return "Different changes were found on this device and in your account. Nothing was replaced.";
    default:
      return "leftovr is checking your saved information.";
  }
}

function getConsumerSyncTitle(
  isSignedIn: boolean,
  comparison: FinanceStateComparison | null,
  backgroundStatus: FinanceBackgroundSyncStatus | null,
  automaticUpdateStatus: FinanceUpdateCheckStatus | null,
  isChecking: boolean,
  isUploading: boolean,
  isRestoring: boolean,
) {
  if (!isSignedIn) {
    return "Sign in to use account sync";
  }

  if (isChecking) {
    return "Checking your saved data";
  }

  if (isUploading) {
    return "Saving your latest changes";
  }

  if (isRestoring) {
    return "Updating this device";
  }

  if (
    automaticUpdateStatus?.status === "offline" ||
    backgroundStatus?.status === "offline"
  ) {
    return "You’re currently offline";
  }

  if (
    automaticUpdateStatus?.status === "error" ||
    backgroundStatus?.status === "error"
  ) {
    return "Account saving needs another try";
  }

  if (backgroundStatus?.status === "blocked") {
    return "Your data needs attention";
  }

  switch (comparison) {
    case "no-local-or-cloud-state":
      return "Account sync is ready";
    case "local-only":
    case "local-newer":
      return "Saving your latest changes";
    case "cloud-only":
    case "cloud-newer":
      return "An update is ready";
    case "in-sync":
      return "Everything is saved";
    case "conflict":
      return "Choose which data to keep";
    default:
      return "Checking your saved data";
  }
}

function getConsumerSyncPillLabel(
  isSignedIn: boolean,
  comparison: FinanceStateComparison | null,
  backgroundStatus: FinanceBackgroundSyncStatus | null,
  automaticUpdateStatus: FinanceUpdateCheckStatus | null,
  isChecking: boolean,
  isUploading: boolean,
  isRestoring: boolean,
) {
  if (!isSignedIn) {
    return "Signed Out";
  }

  if (isChecking) {
    return "Checking";
  }

  if (isUploading || backgroundStatus?.status === "uploading") {
    return "Saving";
  }

  if (isRestoring) {
    return "Updating";
  }

  if (
    automaticUpdateStatus?.status === "offline" ||
    backgroundStatus?.status === "offline"
  ) {
    return "Offline";
  }

  if (
    automaticUpdateStatus?.status === "error" ||
    backgroundStatus?.status === "error"
  ) {
    return "Try Again";
  }

  if (
    comparison === "conflict" ||
    backgroundStatus?.status === "blocked"
  ) {
    return "Review";
  }

  if (
    comparison === "cloud-only" ||
    comparison === "cloud-newer"
  ) {
    return "Update Ready";
  }

  if (
    comparison === "local-only" ||
    comparison === "local-newer"
  ) {
    return "Saving";
  }

  if (comparison === "in-sync") {
    return "Saved";
  }

  return "Ready";
}

function getAutomaticSavingTitle(
  isSignedIn: boolean,
  isActive: boolean,
  status: FinanceBackgroundSyncStatus | null,
) {
  if (!isSignedIn) {
    return "Automatic saving is off";
  }

  if (!isActive) {
    return "Automatic saving is getting ready";
  }

  switch (status?.status) {
    case "uploading":
      return "Saving changes to your account";
    case "offline":
      return "Changes are saved on this device";
    case "blocked":
      return "Automatic saving is paused";
    case "error":
      return "Automatic saving needs another try";
    default:
      return "Automatic saving is on";
  }
}

function getAutomaticSavingDetail(
  isSignedIn: boolean,
  isActive: boolean,
  status: FinanceBackgroundSyncStatus | null,
) {
  if (!isSignedIn) {
    return "Sign in to keep changes available on your other devices.";
  }

  if (!isActive) {
    return "leftovr will finish setting this up after your data is verified.";
  }

  switch (status?.status) {
    case "uploading":
      return "Your newest changes are being protected now.";
    case "offline":
      return "They will move to your account automatically when the internet returns.";
    case "blocked":
      return "Nothing was overwritten. Review the choices above to continue.";
    case "error":
      return "Your information remains safe here until saving succeeds.";
    default:
      return "New changes move to your account automatically after a brief pause.";
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


function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-3 inline-flex items-center gap-2 text-sm font-semibold transition"
      style={{ color: "var(--theme-text-tertiary)" }}
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}

function StatusBadge({ children }: { children: string }) {
  return (
    <span
      className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
      style={{
        borderColor:
          "color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-default))",
        background:
          "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
        color: "var(--theme-text-secondary)",
      }}
    >
      {children}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span
        className="min-w-0 text-sm"
        style={{ color: "var(--theme-text-tertiary)" }}
      >
        {label}
      </span>

      <span
        className="shrink-0 text-right text-sm font-semibold"
        style={{ color: "var(--theme-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function AdvancedStatusRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)" }}
        >
          {label}
        </p>

        <p
          className="mt-0.5 text-xs leading-5"
          style={{ color: "var(--theme-text-tertiary)" }}
        >
          {detail}
        </p>
      </div>

      <span
        className="shrink-0 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold"
        style={{
          borderColor: "var(--theme-border-default)",
          background:
            "color-mix(in srgb, var(--theme-accent) 7%, var(--theme-surface-sheet))",
          color: "var(--theme-text-secondary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PrimaryAction({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pressable w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        borderColor:
          "color-mix(in srgb, var(--theme-accent) 46%, var(--theme-border-default))",
        background:
          "color-mix(in srgb, var(--theme-accent) 18%, var(--theme-surface-control))",
        color: "var(--theme-text)",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryAction({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pressable w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        borderColor: "var(--theme-border-default)",
        background: "var(--theme-surface-control)",
        color: "var(--theme-text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function ConfirmationPanel({
  title,
  detail,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  detail: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      className="mt-4 rounded-[1.05rem] border px-4 py-3.5"
      style={{
        borderColor:
          "color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-default))",
        background:
          "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--theme-text)" }}
      >
        {title}
      </p>

      <p
        className="mt-1 text-xs leading-5"
        style={{ color: "var(--theme-text-tertiary)" }}
      >
        {detail}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SecondaryAction onClick={onCancel} disabled={false}>
          {cancelLabel}
        </SecondaryAction>

        <PrimaryAction onClick={onConfirm} disabled={false}>
          {confirmLabel}
        </PrimaryAction>
      </div>
    </div>
  );
}

function Notice({
  children,
  tone,
}: {
  children: string;
  tone: "positive" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <div
      role={isDanger ? "alert" : "status"}
      aria-live={isDanger ? undefined : "polite"}
      className="mt-4 rounded-[1.05rem] border px-4 py-3"
      style={{
        borderColor: isDanger
          ? "color-mix(in srgb, #dc2626 38%, var(--theme-border-default))"
          : "color-mix(in srgb, var(--theme-accent) 30%, var(--theme-border-default))",
        background: isDanger
          ? "color-mix(in srgb, #dc2626 8%, var(--theme-surface-control))"
          : "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
        color: isDanger ? "#dc2626" : "var(--theme-text-secondary)",
      }}
    >
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-5 w-5"
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

function ExitIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M14 8l4 4-4 4M8 12h10"
        stroke="currentColor"
        strokeWidth="1.8"
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
