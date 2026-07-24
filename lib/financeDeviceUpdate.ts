import {
  getFinanceCloudHandshake,
  type FinanceCloudHandshake,
} from "./financeCloud";
import {
  flushFinanceStateRefresh,
  restoreFinanceStateFromCloud,
} from "./financeStorage";
import type { FinanceState } from "./financeState";
import {
  activateFinanceBackgroundSyncForCurrentUser,
  waitForFinanceBackgroundSyncIdle,
} from "./financeSync";

export type FinanceDeviceUpdateOptions = {
  allowConflict?: boolean;
};

export type FinanceDeviceUpdateResult = {
  restoredState: FinanceState;
  handshake: FinanceCloudHandshake;
  backgroundSyncActive: boolean;
};

export async function updateThisDeviceFromSavedAccount(
  options: FinanceDeviceUpdateOptions = {},
): Promise<FinanceDeviceUpdateResult> {
  const becameIdle = await waitForFinanceBackgroundSyncIdle({
    timeoutMs: 12000,
    quietPeriodMs: 500,
  });

  if (!becameIdle) {
    throw new Error(
      "This device is still finishing a save. Wait a moment, then try updating again.",
    );
  }

  const localState = await flushFinanceStateRefresh();
  const currentHandshake = await getFinanceCloudHandshake(localState);
  const canUseSavedAccountData =
    currentHandshake.comparison === "cloud-only" ||
    currentHandshake.comparison === "cloud-newer" ||
    (options.allowConflict === true &&
      currentHandshake.comparison === "conflict");

  if (!canUseSavedAccountData) {
    throw new Error(
      "The device or saved account changed before the update. Check again before continuing.",
    );
  }

  if (!currentHandshake.cloudState) {
    throw new Error(
      "No verified saved account data is available for this device.",
    );
  }

  const restoredResult = restoreFinanceStateFromCloud(
    currentHandshake.cloudState,
  );

  const verifiedHandshake = await getFinanceCloudHandshake(
    restoredResult.state,
  );

  if (verifiedHandshake.comparison !== "in-sync") {
    throw new Error(
      "The saved account data was restored, but final verification did not complete. Your pre-update recovery copy is still available.",
    );
  }

  const backgroundSyncActive =
    await activateFinanceBackgroundSyncForCurrentUser();

  return {
    restoredState: restoredResult.state,
    handshake: verifiedHandshake,
    backgroundSyncActive,
  };
}