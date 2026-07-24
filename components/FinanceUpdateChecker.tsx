"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { updateThisDeviceFromSavedAccount } from "../lib/financeDeviceUpdate";
import {
  checkForFinanceUpdates,
  getFinanceUpdateCheckStatus,
  subscribeFinanceUpdateCheckStatus,
  type FinanceUpdateCheckStatus,
} from "../lib/financeUpdateCheck";
import {
  activateFinanceBackgroundSyncForCurrentUser,
} from "../lib/financeSync";

const automaticFinanceUpdateCheckCooldown = 1200;
const dismissedUpdateRevisionStorageKey =
  "leftovr-dismissed-account-update-revision";

export default function FinanceUpdateChecker() {
  const pathname = usePathname();

  const [status, setStatus] =
    useState<FinanceUpdateCheckStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdatingDevice, setIsUpdatingDevice] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const lastCheckStartedAtRef = useRef(0);
  const activationAttemptedRef = useRef(false);

  useEffect(() => {
    let isDisposed = false;

    const publishStatus = (nextStatus: FinanceUpdateCheckStatus) => {
      if (isDisposed) {
        return;
      }

      setStatus(nextStatus);

      const dismissedRevision = window.sessionStorage.getItem(
        dismissedUpdateRevisionStorageKey,
      );
      const nextRevision = getPromptRevision(nextStatus);

      setIsDismissed(
        Boolean(nextRevision && dismissedRevision === nextRevision),
      );

      if (
        nextStatus.status === "up-to-date" &&
        !activationAttemptedRef.current
      ) {
        activationAttemptedRef.current = true;
        void activateFinanceBackgroundSyncForCurrentUser();
      }
    };

    const runUpdateCheck = () => {
      if (isDisposed) {
        return;
      }

      const now = Date.now();

      if (
        now - lastCheckStartedAtRef.current <
        automaticFinanceUpdateCheckCooldown
      ) {
        return;
      }

      lastCheckStartedAtRef.current = now;
      void checkForFinanceUpdates().then(publishStatus);
    };

    const handleWindowFocus = () => {
      runUpdateCheck();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runUpdateCheck();
      }
    };

    const handleOnline = () => {
      runUpdateCheck();
    };

    const savedStatus = getFinanceUpdateCheckStatus();

    if (savedStatus) {
      publishStatus(savedStatus);
    }

    const unsubscribe =
      subscribeFinanceUpdateCheckStatus(publishStatus);

    /*
     * Begin the account check as soon as the global checker mounts.
     * The network comparison can still take a brief moment, but there
     * is no longer an extra artificial startup delay.
     */
    runUpdateCheck();

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      isDisposed = true;
      unsubscribe();

      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  const promptType = getPromptType(status);
  const shouldHideForRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/account/profile");

  const shouldShowPrompt =
    !shouldHideForRoute &&
    !isDismissed &&
    promptType !== null;

  useEffect(() => {
    if (!shouldShowPrompt) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldShowPrompt]);

  function dismissPrompt() {
    if (isUpdatingDevice) {
      return;
    }

    if (status) {
      const revision = getPromptRevision(status);

      if (revision) {
        window.sessionStorage.setItem(
          dismissedUpdateRevisionStorageKey,
          revision,
        );
      }
    }

    setIsDismissed(true);
    setUpdateError("");
  }

  async function updateDeviceAndContinue() {
    if (isUpdatingDevice) {
      return;
    }

    setIsUpdatingDevice(true);
    setUpdateError("");

    try {
      await updateThisDeviceFromSavedAccount();

      /*
       * Publish the new in-sync result before reloading so a stale
       * "update available" status cannot reopen the sheet.
       */
      await checkForFinanceUpdates();

      window.location.reload();
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "leftovr could not update this device.",
      );
      setIsUpdatingDevice(false);
    }
  }

  if (!shouldShowPrompt || !status || !promptType) {
    return null;
  }

  const isUpdateAvailable = promptType === "update";

  return (
    <div className="fixed inset-0 z-[98] flex items-end justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Dismiss account update"
        onClick={dismissPrompt}
        disabled={isUpdatingDevice}
        className="absolute inset-0 bg-black/58 backdrop-blur-[11px] backdrop-saturate-125 disabled:cursor-wait"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-update-title"
        className="liquid-glass-accent hero-glass-card dashboard-hero motion-card relative w-full max-w-md overflow-hidden rounded-[1.8rem]"
      >
        <div className="liquid-content dashboard-hero-content relative p-4 sm:p-5">
          <div
            className="dashboard-hero-glow dashboard-hero-glow-accent"
            aria-hidden="true"
          />

          <div
            className="dashboard-hero-glow dashboard-hero-glow-soft"
            aria-hidden="true"
          />

          <div
            className="dashboard-hero-reflection"
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]"
                  aria-hidden="true"
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/80">
                  {isUpdateAvailable
                    ? "Account Update"
                    : "Sync Review"}
                </p>
              </div>

              <h2
                id="finance-update-title"
                className="mt-3 text-[1.55rem] font-bold leading-[1.08] tracking-[-0.04em] text-[#f5f0e8]"
              >
                {isUpdateAvailable
                  ? "Your latest leftovr data is ready."
                  : "Your data needs a quick review."}
              </h2>
            </div>

            <span className="dashboard-pill-button shrink-0 !px-2.5 !py-1 text-[9px] uppercase tracking-[0.12em]">
              {isUpdatingDevice
                ? "Updating"
                : isUpdateAvailable
                  ? "Update Ready"
                  : "Protected"}
            </span>
          </div>

          <p className="relative mt-3 text-sm leading-6 text-stone-400">
            {isUpdateAvailable
              ? "Bring your newest saved balances, bills, and cards onto this device, then continue exactly where you are."
              : "Different changes were found on this device and in your account. Nothing was replaced automatically."}
          </p>

          {updateError ? (
            <div
              role="alert"
              className="relative mt-3 rounded-[1rem] border border-[#dc2626]/35 bg-[#dc2626]/10 px-3 py-2.5"
            >
              <p className="text-sm leading-5 text-[#dc2626]">
                {updateError}
              </p>
            </div>
          ) : null}

          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={dismissPrompt}
              disabled={isUpdatingDevice}
              className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.045] px-3 py-2.5 text-sm font-semibold text-stone-300 disabled:cursor-wait disabled:opacity-45"
            >
              Not Now
            </button>

            {isUpdateAvailable ? (
              <button
                type="button"
                onClick={updateDeviceAndContinue}
                disabled={isUpdatingDevice}
                aria-busy={isUpdatingDevice}
                className="pressable rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-3 py-2.5 text-center text-sm font-semibold text-[#f5f0e8] disabled:cursor-wait disabled:opacity-55"
              >
                {isUpdatingDevice
                  ? "Updating…"
                  : "Update & Continue"}
              </button>
            ) : (
              <Link
                href="/account/profile#account-sync"
                onClick={dismissPrompt}
                className="pressable rounded-full border border-[#c7ad75]/38 bg-[#c7ad75]/16 px-3 py-2.5 text-center text-sm font-semibold text-[#f5f0e8]"
              >
                Review Sync
              </Link>
            )}
          </div>

          <p className="relative mt-2.5 text-center text-[10px] leading-5 text-stone-500">
            {isUpdateAvailable
              ? "leftovr creates a local recovery copy before applying the saved account update."
              : "Conflicts still open Account & Sync so nothing is overwritten without review."}
          </p>
        </div>
      </section>
    </div>
  );
}

function getPromptType(
  status: FinanceUpdateCheckStatus | null,
) {
  if (status?.status === "update-available") {
    return "update" as const;
  }

  if (status?.status === "needs-attention") {
    return "review" as const;
  }

  return null;
}

function getPromptRevision(
  status: FinanceUpdateCheckStatus,
) {
  return status.cloudRevision === null
    ? status.status
    : `${status.status}:${status.cloudRevision}`;
}