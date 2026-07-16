import {
  FinanceCloudError,
  getFinanceCloudHandshake,
  type FinanceCloudHandshake,
  type FinanceStateComparison,
} from "./financeCloud";
import { flushFinanceStateRefresh } from "./financeStorage";
import {
  isFinanceBackgroundSyncActiveForUser,
  scheduleFinanceCloudUpload,
  waitForFinanceBackgroundSyncIdle,
} from "./financeSync";
import { supabase } from "./supabase/client";

const financeUpdateCheckStatusStorageKey =
  "leftovr-finance-update-check-status";
const financeUpdateCheckStatusEventName =
  "leftovr:finance-update-check-status";

export type FinanceUpdateCheckStatusName =
  | "idle"
  | "checking"
  | "ready"
  | "up-to-date"
  | "update-available"
  | "save-needed"
  | "needs-attention"
  | "offline"
  | "signed-out"
  | "deferred"
  | "error";

export type FinanceUpdateCheckStatus = {
  status: FinanceUpdateCheckStatusName;
  message: string;
  updatedAt: string;
  comparison: FinanceStateComparison | null;
  localRevision: number | null;
  cloudRevision: number | null;
};

let financeUpdateCheckInFlight:
  Promise<FinanceUpdateCheckStatus> | null = null;

let latestFinanceUpdateCheckHandshake:
  FinanceCloudHandshake | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function createFinanceUpdateCheckStatus(
  status: FinanceUpdateCheckStatusName,
  message: string,
  comparison: FinanceStateComparison | null = null,
  localRevision: number | null = null,
  cloudRevision: number | null = null,
): FinanceUpdateCheckStatus {
  return {
    status,
    message,
    updatedAt: new Date().toISOString(),
    comparison,
    localRevision,
    cloudRevision,
  };
}

function isFinanceUpdateCheckStatusName(
  value: unknown,
): value is FinanceUpdateCheckStatusName {
  return (
    value === "idle" ||
    value === "checking" ||
    value === "ready" ||
    value === "up-to-date" ||
    value === "update-available" ||
    value === "save-needed" ||
    value === "needs-attention" ||
    value === "offline" ||
    value === "signed-out" ||
    value === "deferred" ||
    value === "error"
  );
}

function isFinanceStateComparison(
  value: unknown,
): value is FinanceStateComparison {
  return (
    value === "no-local-or-cloud-state" ||
    value === "local-only" ||
    value === "cloud-only" ||
    value === "in-sync" ||
    value === "local-newer" ||
    value === "cloud-newer" ||
    value === "conflict"
  );
}

function isNullableRevision(value: unknown) {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0)
  );
}

function publishFinanceUpdateCheckStatus(
  status: FinanceUpdateCheckStatusName,
  message: string,
  comparison: FinanceStateComparison | null = null,
  localRevision: number | null = null,
  cloudRevision: number | null = null,
) {
  const nextStatus = createFinanceUpdateCheckStatus(
    status,
    message,
    comparison,
    localRevision,
    cloudRevision,
  );

  if (!isBrowser()) {
    return nextStatus;
  }

  try {
    window.localStorage.setItem(
      financeUpdateCheckStatusStorageKey,
      JSON.stringify(nextStatus),
    );
  } catch {
    // This status is helpful UI state, not required finance data.
  }

  window.dispatchEvent(
    new CustomEvent<FinanceUpdateCheckStatus>(
      financeUpdateCheckStatusEventName,
      {
        detail: nextStatus,
      },
    ),
  );

  return nextStatus;
}

export function getFinanceUpdateCheckStatus():
  FinanceUpdateCheckStatus | null {
  if (!isBrowser()) {
    return null;
  }

  const savedValue = window.localStorage.getItem(
    financeUpdateCheckStatusStorageKey,
  );

  if (!savedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(
      savedValue,
    ) as Partial<FinanceUpdateCheckStatus>;

    if (
      !isFinanceUpdateCheckStatusName(parsedValue.status) ||
      typeof parsedValue.message !== "string" ||
      typeof parsedValue.updatedAt !== "string" ||
      !(
        parsedValue.comparison === null ||
        isFinanceStateComparison(parsedValue.comparison)
      ) ||
      !isNullableRevision(parsedValue.localRevision) ||
      !isNullableRevision(parsedValue.cloudRevision)
    ) {
      return null;
    }

    return parsedValue as FinanceUpdateCheckStatus;
  } catch {
    return null;
  }
}

export function getLatestFinanceUpdateCheckHandshake():
  FinanceCloudHandshake | null {
  return latestFinanceUpdateCheckHandshake;
}

export function subscribeFinanceUpdateCheckStatus(
  listener: (status: FinanceUpdateCheckStatus) => void,
) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStatus = (event: Event) => {
    const customEvent =
      event as CustomEvent<FinanceUpdateCheckStatus>;

    listener(customEvent.detail);
  };

  window.addEventListener(
    financeUpdateCheckStatusEventName,
    handleStatus,
  );

  return () => {
    window.removeEventListener(
      financeUpdateCheckStatusEventName,
      handleStatus,
    );
  };
}

function mapFinanceComparisonToStatus(
  comparison: FinanceStateComparison,
  localRevision: number | null,
  cloudRevision: number | null,
) {
  switch (comparison) {
    case "no-local-or-cloud-state":
      return publishFinanceUpdateCheckStatus(
        "ready",
        "Cloud sync is ready for your next save.",
        comparison,
        localRevision,
        cloudRevision,
      );

    case "in-sync":
      return publishFinanceUpdateCheckStatus(
        "up-to-date",
        "Everything is up to date.",
        comparison,
        localRevision,
        cloudRevision,
      );

    case "cloud-only":
    case "cloud-newer":
      return publishFinanceUpdateCheckStatus(
        "update-available",
        "Newer saved data is ready for this device.",
        comparison,
        localRevision,
        cloudRevision,
      );

    case "local-only":
    case "local-newer":
      return publishFinanceUpdateCheckStatus(
        "save-needed",
        "This device has newer changes that have not reached the account yet.",
        comparison,
        localRevision,
        cloudRevision,
      );

    case "conflict":
      return publishFinanceUpdateCheckStatus(
        "needs-attention",
        "Changes were found in two places. Nothing was replaced.",
        comparison,
        localRevision,
        cloudRevision,
      );
  }
}

async function performFinanceUpdateCheck() {
  if (!isBrowser()) {
    latestFinanceUpdateCheckHandshake = null;

    return createFinanceUpdateCheckStatus(
      "idle",
      "Automatic update checking is available in the browser.",
    );
  }

  if (!window.navigator.onLine) {
    latestFinanceUpdateCheckHandshake = null;

    return publishFinanceUpdateCheckStatus(
      "offline",
      "Your data remains available on this device. leftovr will check again when the internet returns.",
    );
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    latestFinanceUpdateCheckHandshake = null;

    return publishFinanceUpdateCheckStatus(
      "signed-out",
      "Sign in to check for saved account updates.",
    );
  }

  latestFinanceUpdateCheckHandshake = null;

  publishFinanceUpdateCheckStatus(
    "checking",
    "Checking for the latest saved data.",
  );

  const becameIdle = await waitForFinanceBackgroundSyncIdle({
    timeoutMs: 12000,
    quietPeriodMs: 500,
  });

  if (!becameIdle) {
    return publishFinanceUpdateCheckStatus(
      "deferred",
      "leftovr is waiting for this device to finish saving before checking for updates.",
    );
  }

  if (!window.navigator.onLine) {
    return publishFinanceUpdateCheckStatus(
      "offline",
      "Your data remains available on this device. leftovr will check again when the internet returns.",
    );
  }

  const localState = await flushFinanceStateRefresh();
  let handshake = await getFinanceCloudHandshake(localState);

  latestFinanceUpdateCheckHandshake = handshake;

  const shouldResumeInterruptedUpload =
    (handshake.comparison === "local-only" ||
      handshake.comparison === "local-newer") &&
    Boolean(handshake.localState) &&
    isFinanceBackgroundSyncActiveForUser(data.user.id);

  if (shouldResumeInterruptedUpload && handshake.localState) {
    publishFinanceUpdateCheckStatus(
      "checking",
      "Saving this device's latest changes to the account.",
      handshake.comparison,
      handshake.localState.revision,
      handshake.cloudState?.revision ?? null,
    );

    scheduleFinanceCloudUpload(handshake.localState);

    const uploadBecameIdle = await waitForFinanceBackgroundSyncIdle({
      timeoutMs: 16000,
      quietPeriodMs: 500,
    });

    if (!uploadBecameIdle) {
      return publishFinanceUpdateCheckStatus(
        "deferred",
        "leftovr is still saving this device's latest changes.",
        handshake.comparison,
        handshake.localState.revision,
        handshake.cloudState?.revision ?? null,
      );
    }

    if (!window.navigator.onLine) {
      return publishFinanceUpdateCheckStatus(
        "offline",
        "Your data remains available on this device. leftovr will save it when the internet returns.",
        handshake.comparison,
        handshake.localState.revision,
        handshake.cloudState?.revision ?? null,
      );
    }

    const refreshedLocalState = await flushFinanceStateRefresh();
    handshake = await getFinanceCloudHandshake(refreshedLocalState);
    latestFinanceUpdateCheckHandshake = handshake;
  }

  return mapFinanceComparisonToStatus(
    handshake.comparison,
    handshake.localState?.revision ?? null,
    handshake.cloudState?.revision ?? null,
  );
}

export function checkForFinanceUpdates():
  Promise<FinanceUpdateCheckStatus> {
  if (!isBrowser()) {
    return Promise.resolve(
      createFinanceUpdateCheckStatus(
        "idle",
        "Automatic update checking is available in the browser.",
      ),
    );
  }

  if (financeUpdateCheckInFlight) {
    return financeUpdateCheckInFlight;
  }

  financeUpdateCheckInFlight = performFinanceUpdateCheck()
    .catch((error: unknown) => {
      latestFinanceUpdateCheckHandshake = null;

      if (
        error instanceof FinanceCloudError &&
        error.code === "not-signed-in"
      ) {
        return publishFinanceUpdateCheckStatus(
          "signed-out",
          "Sign in to check for saved account updates.",
        );
      }

      return publishFinanceUpdateCheckStatus(
        "error",
        error instanceof Error
          ? error.message
          : "leftovr could not check for saved account updates.",
      );
    })
    .finally(() => {
      financeUpdateCheckInFlight = null;
    });

  return financeUpdateCheckInFlight;
}