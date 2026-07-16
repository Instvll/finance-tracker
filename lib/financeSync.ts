import {
  FinanceCloudError,
  uploadCloudFinanceState,
} from "./financeCloud";
import {
  isFinanceState,
  type FinanceState,
} from "./financeState";
import { supabase } from "./supabase/client";

export const financeSyncOwnerStorageKey =
  "leftovr-finance-sync-owner";

const financeBackgroundSyncStatusStorageKey =
  "leftovr-finance-background-sync-status";
const financeBackgroundSyncEventName =
  "leftovr:finance-background-sync";
const financeBackgroundUploadDelay = 1800;

export type FinanceBackgroundSyncStatusName =
  | "inactive"
  | "ready"
  | "uploading"
  | "saved"
  | "offline"
  | "protected"
  | "blocked"
  | "error";

export type FinanceBackgroundSyncStatus = {
  status: FinanceBackgroundSyncStatusName;
  message: string;
  updatedAt: string;
  revision: number | null;
};

let pendingFinanceState: FinanceState | null = null;
let backgroundUploadTimer: number | null = null;
let backgroundUploadInFlight = false;
let onlineListenerRegistered = false;

function isBrowser() {
  return typeof window !== "undefined";
}

function createBackgroundSyncStatus(
  status: FinanceBackgroundSyncStatusName,
  message: string,
  revision: number | null = null,
): FinanceBackgroundSyncStatus {
  return {
    status,
    message,
    updatedAt: new Date().toISOString(),
    revision,
  };
}

function publishBackgroundSyncStatus(
  status: FinanceBackgroundSyncStatusName,
  message: string,
  revision: number | null = null,
) {
  if (!isBrowser()) {
    return;
  }

  const nextStatus = createBackgroundSyncStatus(
    status,
    message,
    revision,
  );

  try {
    window.localStorage.setItem(
      financeBackgroundSyncStatusStorageKey,
      JSON.stringify(nextStatus),
    );
  } catch {
    // Status persistence is helpful, but never required for finance saves.
  }

  window.dispatchEvent(
    new CustomEvent<FinanceBackgroundSyncStatus>(
      financeBackgroundSyncEventName,
      { detail: nextStatus },
    ),
  );
}

function registerOnlineListener() {
  if (!isBrowser() || onlineListenerRegistered) {
    return;
  }

  onlineListenerRegistered = true;

  window.addEventListener("online", () => {
    if (pendingFinanceState) {
      schedulePendingFinanceCloudUpload(250);
    }
  });
}

function schedulePendingFinanceCloudUpload(delay: number) {
  if (!isBrowser()) {
    return;
  }

  if (backgroundUploadTimer) {
    window.clearTimeout(backgroundUploadTimer);
  }

  backgroundUploadTimer = window.setTimeout(() => {
    backgroundUploadTimer = null;
    void flushFinanceCloudUpload();
  }, delay);
}

function getFinanceSyncOwnerId() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(
    financeSyncOwnerStorageKey,
  );
}

export function isFinanceBackgroundSyncActiveForUser(
  userId: string,
) {
  return getFinanceSyncOwnerId() === userId;
}

export function getFinanceBackgroundSyncStatus():
  FinanceBackgroundSyncStatus | null {
  if (!isBrowser()) {
    return null;
  }

  const savedValue = window.localStorage.getItem(
    financeBackgroundSyncStatusStorageKey,
  );

  if (!savedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(
      savedValue,
    ) as Partial<FinanceBackgroundSyncStatus>;

    if (
      typeof parsedValue.status !== "string" ||
      typeof parsedValue.message !== "string" ||
      typeof parsedValue.updatedAt !== "string" ||
      !(
        parsedValue.revision === null ||
        (typeof parsedValue.revision === "number" &&
          Number.isSafeInteger(parsedValue.revision))
      )
    ) {
      return null;
    }

    return parsedValue as FinanceBackgroundSyncStatus;
  } catch {
    return null;
  }
}

export function subscribeFinanceBackgroundSyncStatus(
  listener: (status: FinanceBackgroundSyncStatus) => void,
) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStatus = (event: Event) => {
    const customEvent =
      event as CustomEvent<FinanceBackgroundSyncStatus>;

    listener(customEvent.detail);
  };

  window.addEventListener(
    financeBackgroundSyncEventName,
    handleStatus,
  );

  return () => {
    window.removeEventListener(
      financeBackgroundSyncEventName,
      handleStatus,
    );
  };
}

export async function activateFinanceBackgroundSyncForCurrentUser() {
  if (!isBrowser()) {
    return false;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    publishBackgroundSyncStatus(
      "inactive",
      "Sign in before enabling background finance uploads.",
    );
    return false;
  }

  try {
    window.localStorage.setItem(
      financeSyncOwnerStorageKey,
      data.user.id,
    );
  } catch {
    publishBackgroundSyncStatus(
      "error",
      "leftovr could not securely bind this device to the signed-in account.",
    );
    return false;
  }

  publishBackgroundSyncStatus(
    "ready",
    "Background finance uploads are active on this verified device.",
  );

  return true;
}

export function scheduleFinanceCloudUpload(
  state: FinanceState,
) {
  if (!isBrowser() || !isFinanceState(state)) {
    return;
  }

  pendingFinanceState = state;
  registerOnlineListener();
  schedulePendingFinanceCloudUpload(
    financeBackgroundUploadDelay,
  );
}

export async function flushFinanceCloudUpload() {
  if (
    !isBrowser() ||
    backgroundUploadInFlight ||
    !pendingFinanceState
  ) {
    return;
  }

  const stateToUpload = pendingFinanceState;
  pendingFinanceState = null;

  if (!window.navigator.onLine) {
    pendingFinanceState = stateToUpload;
    publishBackgroundSyncStatus(
      "offline",
      "Finance changes are safe on this device and will retry when the connection returns.",
      stateToUpload.revision,
    );
    return;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    publishBackgroundSyncStatus(
      "inactive",
      "Finance changes remain on this device until the account is signed in.",
      stateToUpload.revision,
    );
    return;
  }

  if (!isFinanceBackgroundSyncActiveForUser(data.user.id)) {
    publishBackgroundSyncStatus(
      "protected",
      "Automatic upload is paused until this device is verified for the signed-in account.",
      stateToUpload.revision,
    );
    return;
  }

  backgroundUploadInFlight = true;
  publishBackgroundSyncStatus(
    "uploading",
    "Saving the latest finance changes to the cloud.",
    stateToUpload.revision,
  );

  try {
    const uploadedState =
      await uploadCloudFinanceState(stateToUpload);

    publishBackgroundSyncStatus(
      "saved",
      "The latest finance changes are safely stored in the cloud.",
      uploadedState.revision,
    );
  } catch (uploadError) {
    if (
      uploadError instanceof FinanceCloudError &&
      (uploadError.code === "cloud-newer" ||
        uploadError.code === "conflict")
    ) {
      publishBackgroundSyncStatus(
        "blocked",
        "Automatic upload stopped because another finance state needs review. Nothing was overwritten.",
        stateToUpload.revision,
      );
    } else {
      publishBackgroundSyncStatus(
        "error",
        "The cloud upload did not complete. The finance changes remain safe on this device and will retry after the next change.",
        stateToUpload.revision,
      );
    }
  } finally {
    backgroundUploadInFlight = false;

    if (pendingFinanceState) {
      schedulePendingFinanceCloudUpload(
        financeBackgroundUploadDelay,
      );
    }
  }
}