import { resetCloudFinanceData } from "./financeCloud";
import { waitForFinanceBackgroundSyncIdle } from "./financeSync";

const financeResetStorageKeys = [
  "finance-tracker-manual-data",
  "finance-tracker-manual-bills",
  "finance-tracker-manual-cards",
  "finance-tracker-last-saved",
  "leftovr-preferences",
  "leftovr-active-bill-occurrences",
  "leftovr-paid-bill-occurrences",
  "leftovr-recent-paid-bill-actions",
  "leftovr-last-paid-bill-action",
  "leftovr-pre-restore-snapshot",
  "leftovr-finance-state",
  "leftovr-finance-state-restore-backup",
  "leftovr-finance-sync-owner",
  "leftovr-finance-background-sync-status",
  "leftovr-finance-update-check-status",
  "leftovr-welcome-seen",
] as const;

function isBrowser() {
  return typeof window !== "undefined";
}

function clearLocalFinanceSetup() {
  for (const key of financeResetStorageKeys) {
    window.localStorage.removeItem(key);
  }

  const remainingKeys = Array.from(
    { length: window.localStorage.length },
    (_, index) => window.localStorage.key(index),
  ).filter((key): key is string => Boolean(key));

  for (const key of remainingKeys) {
    if (key.startsWith("leftovr-finance-")) {
      window.localStorage.removeItem(key);
    }
  }
}

export async function resetFinanceSetupForFreshStart() {
  if (!isBrowser()) {
    throw new Error(
      "A fresh start can only be completed in the browser.",
    );
  }

  if (!window.navigator.onLine) {
    throw new Error(
      "Connect to the internet before starting fresh so the saved account copy can be erased safely.",
    );
  }

  const becameIdle = await waitForFinanceBackgroundSyncIdle({
    timeoutMs: 15000,
    quietPeriodMs: 1000,
  });

  if (!becameIdle) {
    throw new Error(
      "This device is still finishing a save. Wait a moment, then try again.",
    );
  }

  await resetCloudFinanceData();

  try {
    clearLocalFinanceSetup();
  } catch {
    throw new Error(
      "The saved account copy was erased, but this device could not finish clearing its local setup. Try Start Fresh again on this device.",
    );
  }
}