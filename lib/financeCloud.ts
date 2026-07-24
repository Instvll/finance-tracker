import { supabase } from "./supabase/client";
import {
  currentFinanceStateSchemaVersion,
  isFinanceState,
  type FinanceState,
} from "./financeState";

const financeTableName = "finance_data";

const financeCloudSelectColumns = [
  "user_id",
  "finance_state",
  "finance_revision",
  "finance_schema_version",
  "finance_state_updated_at",
].join(",");

type FinanceCloudRow = {
  user_id: string;
  finance_state: unknown;
  finance_revision: number | string;
  finance_schema_version: number | string;
  finance_state_updated_at: string | null;
};

type FinanceCloudWritePayload = {
  user_id: string;
  finance_state: FinanceState;
  finance_revision: number;
  finance_schema_version: number;
  finance_state_updated_at: string;
  updated_at: string;
};

export type FinanceStateComparison =
  | "no-local-or-cloud-state"
  | "local-only"
  | "cloud-only"
  | "in-sync"
  | "local-newer"
  | "cloud-newer"
  | "conflict";

export type FinanceCloudHandshake = {
  localState: FinanceState | null;
  cloudState: FinanceState | null;
  comparison: FinanceStateComparison;
};

export type FinanceCloudErrorCode =
  | "unknown"
  | "not-signed-in"
  | "invalid-state"
  | "read-failed"
  | "upload-failed"
  | "cloud-newer"
  | "conflict"
  | "verification-failed"
  | "reset-failed";

export class FinanceCloudError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    readonly code: FinanceCloudErrorCode = "unknown",
  ) {
    super(message);
    this.name = "FinanceCloudError";
  }
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not verify the signed-in account.",
      error,
      "read-failed",
    );
  }

  if (!data.user) {
    throw new FinanceCloudError(
      "Sign in before using cloud finance sync.",
      undefined,
      "not-signed-in",
    );
  }

  return data.user.id;
}

function normalizeCloudRevision(value: number | string) {
  const revision = Number(value);

  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new FinanceCloudError(
      "The cloud finance revision is invalid.",
      undefined,
      "invalid-state",
    );
  }

  return revision;
}

function normalizeCloudSchemaVersion(value: number | string) {
  const schemaVersion = Number(value);

  if (!Number.isSafeInteger(schemaVersion) || schemaVersion < 1) {
    throw new FinanceCloudError(
      "The cloud finance schema version is invalid.",
      undefined,
      "invalid-state",
    );
  }

  return schemaVersion;
}

function canonicalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue);
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = canonicalizeJsonValue(record[key]);
        return result;
      }, {});
  }

  return value;
}

function getComparableStateValue(state: FinanceState) {
  const comparableState = {
    schemaVersion: state.schemaVersion,
    summary: state.summary,
    bills: state.bills,
    cards: state.cards,
    preferences: state.preferences,
    activeOccurrenceDates: state.activeOccurrenceDates,
    paidOccurrences: state.paidOccurrences,
    paidActions: state.paidActions,
  };

  return JSON.stringify(canonicalizeJsonValue(comparableState));
}

function normalizeCloudFinanceState(row: FinanceCloudRow) {
  if (!isFinanceState(row.finance_state)) {
    throw new FinanceCloudError(
      "The cloud finance state is missing or invalid.",
      undefined,
      "invalid-state",
    );
  }

  const revision = normalizeCloudRevision(row.finance_revision);
  const schemaVersion = normalizeCloudSchemaVersion(
    row.finance_schema_version,
  );

  if (
    schemaVersion !== currentFinanceStateSchemaVersion ||
    row.finance_state.schemaVersion !== currentFinanceStateSchemaVersion
  ) {
    throw new FinanceCloudError(
      "The cloud finance state uses an unsupported schema version.",
      undefined,
      "invalid-state",
    );
  }

  return {
    ...row.finance_state,
    revision,
    updatedAt:
      row.finance_state_updated_at ?? row.finance_state.updatedAt,
  } satisfies FinanceState;
}

function createFinanceCloudWritePayload(
  userId: string,
  state: FinanceState,
): FinanceCloudWritePayload {
  return {
    user_id: userId,
    finance_state: state,
    finance_revision: state.revision,
    finance_schema_version: state.schemaVersion,
    finance_state_updated_at: state.updatedAt,
    updated_at: new Date().toISOString(),
  };
}

async function loadCloudFinanceStateForUser(
  userId: string,
): Promise<FinanceState | null> {
  const { data, error } = await supabase
    .from(financeTableName)
    .select(financeCloudSelectColumns)
    .eq("user_id", userId)
    .maybeSingle<FinanceCloudRow>();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not read the cloud finance state.",
      error,
      "read-failed",
    );
  }

  if (!data || data.finance_state === null) {
    return null;
  }

  if (data.user_id !== userId) {
    throw new FinanceCloudError(
      "The cloud finance state does not belong to the signed-in account.",
      undefined,
      "invalid-state",
    );
  }

  return normalizeCloudFinanceState(data);
}

async function updateCloudFinanceStateIfUnchanged(
  userId: string,
  state: FinanceState,
  expectedCloudState: FinanceState,
) {
  const { data, error } = await supabase
    .from(financeTableName)
    .update(createFinanceCloudWritePayload(userId, state))
    .eq("user_id", userId)
    .eq("finance_revision", expectedCloudState.revision)
    .eq(
      "finance_state_updated_at",
      expectedCloudState.updatedAt,
    )
    .select(financeCloudSelectColumns)
    .maybeSingle<FinanceCloudRow>();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not upload the finance state.",
      error,
      "upload-failed",
    );
  }

  if (!data) {
    throw new FinanceCloudError(
      "The cloud changed before this upload completed. Nothing was overwritten.",
      undefined,
      "conflict",
    );
  }

  return normalizeCloudFinanceState(data);
}

async function createInitialCloudFinanceState(
  userId: string,
  state: FinanceState,
) {
  const payload = createFinanceCloudWritePayload(userId, state);

  const existingRowUpdate = await supabase
    .from(financeTableName)
    .update(payload)
    .eq("user_id", userId)
    .is("finance_state", null)
    .select(financeCloudSelectColumns)
    .maybeSingle<FinanceCloudRow>();

  if (existingRowUpdate.error) {
    throw new FinanceCloudError(
      "leftovr could not upload the finance state.",
      existingRowUpdate.error,
      "upload-failed",
    );
  }

  if (existingRowUpdate.data) {
    return normalizeCloudFinanceState(existingRowUpdate.data);
  }

  const insertedRow = await supabase
    .from(financeTableName)
    .insert(payload)
    .select(financeCloudSelectColumns)
    .single<FinanceCloudRow>();

  if (insertedRow.error) {
    const currentCloudState = await loadCloudFinanceStateForUser(userId);

    if (currentCloudState) {
      throw new FinanceCloudError(
        "The cloud changed before this first upload completed. Nothing was overwritten.",
        insertedRow.error,
        "conflict",
      );
    }

    throw new FinanceCloudError(
      "leftovr could not create the cloud finance state.",
      insertedRow.error,
      "upload-failed",
    );
  }

  if (!insertedRow.data) {
    throw new FinanceCloudError(
      "leftovr could not verify the newly created cloud finance state.",
      undefined,
      "verification-failed",
    );
  }

  return normalizeCloudFinanceState(insertedRow.data);
}

export function compareFinanceStates(
  localState: FinanceState | null,
  cloudState: FinanceState | null,
): FinanceStateComparison {
  if (!localState && !cloudState) {
    return "no-local-or-cloud-state";
  }

  if (localState && !cloudState) {
    return "local-only";
  }

  if (!localState && cloudState) {
    return "cloud-only";
  }

  if (!localState || !cloudState) {
    return "conflict";
  }

  const statesMatch =
    getComparableStateValue(localState) ===
    getComparableStateValue(cloudState);

  if (localState.revision === cloudState.revision) {
    return statesMatch ? "in-sync" : "conflict";
  }

  if (localState.revision > cloudState.revision) {
    return "local-newer";
  }

  return "cloud-newer";
}

export async function loadCloudFinanceState(): Promise<FinanceState | null> {
  const userId = await getAuthenticatedUserId();
  return loadCloudFinanceStateForUser(userId);
}

export async function uploadCloudFinanceState(
  state: FinanceState,
): Promise<FinanceState> {
  if (!isFinanceState(state)) {
    throw new FinanceCloudError(
      "leftovr cannot upload an invalid finance state.",
      undefined,
      "invalid-state",
    );
  }

  if (state.schemaVersion !== currentFinanceStateSchemaVersion) {
    throw new FinanceCloudError(
      "leftovr cannot upload an unsupported finance-state version.",
      undefined,
      "invalid-state",
    );
  }

  const userId = await getAuthenticatedUserId();
  const currentCloudState = await loadCloudFinanceStateForUser(userId);
  const comparison = compareFinanceStates(state, currentCloudState);

  if (comparison === "in-sync" && currentCloudState) {
    return currentCloudState;
  }

  if (comparison === "cloud-newer" || comparison === "cloud-only") {
    throw new FinanceCloudError(
      "The cloud contains newer finance data. Nothing was overwritten.",
      undefined,
      "cloud-newer",
    );
  }

  if (comparison === "conflict") {
    throw new FinanceCloudError(
      "The local and cloud finance states conflict. Nothing was overwritten.",
      undefined,
      "conflict",
    );
  }

  const uploadedState = currentCloudState
    ? await updateCloudFinanceStateIfUnchanged(
        userId,
        state,
        currentCloudState,
      )
    : await createInitialCloudFinanceState(userId, state);

  if (compareFinanceStates(state, uploadedState) !== "in-sync") {
    throw new FinanceCloudError(
      "The upload completed, but its cloud verification did not match this device.",
      undefined,
      "verification-failed",
    );
  }

  return uploadedState;
}

export async function replaceCloudFinanceStateFromConfirmedLocal(
  localState: FinanceState,
  expectedCloudState: FinanceState,
): Promise<FinanceState> {
  if (
    !isFinanceState(localState) ||
    !isFinanceState(expectedCloudState)
  ) {
    throw new FinanceCloudError(
      "leftovr cannot resolve cloud data with an invalid finance state.",
      undefined,
      "invalid-state",
    );
  }

  if (
    localState.schemaVersion !== currentFinanceStateSchemaVersion ||
    expectedCloudState.schemaVersion !==
      currentFinanceStateSchemaVersion
  ) {
    throw new FinanceCloudError(
      "leftovr cannot resolve an unsupported finance-state version.",
      undefined,
      "invalid-state",
    );
  }

  const userId = await getAuthenticatedUserId();
  const currentCloudState =
    await loadCloudFinanceStateForUser(userId);

  if (!currentCloudState) {
    throw new FinanceCloudError(
      "The saved account data changed before confirmation. Nothing was overwritten.",
      undefined,
      "conflict",
    );
  }

  const expectedCloudStillMatches =
    currentCloudState.revision ===
      expectedCloudState.revision &&
    currentCloudState.updatedAt ===
      expectedCloudState.updatedAt &&
    getComparableStateValue(currentCloudState) ===
      getComparableStateValue(expectedCloudState);

  if (!expectedCloudStillMatches) {
    throw new FinanceCloudError(
      "The saved account data changed before confirmation. Nothing was overwritten.",
      undefined,
      "conflict",
    );
  }

  const resolvedState = {
    ...localState,
    revision:
      Math.max(
        localState.revision,
        currentCloudState.revision,
      ) + 1,
    updatedAt: new Date().toISOString(),
  } satisfies FinanceState;

  const { data, error } = await supabase
    .from(financeTableName)
    .update(
      createFinanceCloudWritePayload(
        userId,
        resolvedState,
      ),
    )
    .eq("user_id", userId)
    .eq(
      "finance_revision",
      currentCloudState.revision,
    )
    .eq(
      "finance_state_updated_at",
      currentCloudState.updatedAt,
    )
    .select(financeCloudSelectColumns)
    .maybeSingle<FinanceCloudRow>();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not use this device as the saved account source.",
      error,
      "upload-failed",
    );
  }

  if (!data) {
    throw new FinanceCloudError(
      "The saved account data changed before confirmation. Nothing was overwritten.",
      undefined,
      "conflict",
    );
  }

  const uploadedState = normalizeCloudFinanceState(data);

  if (
    compareFinanceStates(
      resolvedState,
      uploadedState,
    ) !== "in-sync"
  ) {
    throw new FinanceCloudError(
      "The saved account update completed, but verification did not match this device.",
      undefined,
      "verification-failed",
    );
  }

  return uploadedState;
}

export async function resetCloudFinanceData(): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const resetAt = new Date().toISOString();

  const { error } = await supabase
    .from(financeTableName)
    .upsert(
      {
        user_id: userId,
        finance_state: null,
        finance_revision: 0,
        finance_schema_version: currentFinanceStateSchemaVersion,
        finance_state_updated_at: null,
        dashboard_data: {},
        bills_data: [],
        cards_data: [],
        plan_data: {},
        notes_data: [],
        manual_last_saved: null,
        plan_last_saved: null,
        notes_last_saved: null,
        updated_at: resetAt,
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not erase the saved finance data.",
      error,
      "reset-failed",
    );
  }

  const verifiedCloudState =
    await loadCloudFinanceStateForUser(userId);

  if (verifiedCloudState !== null) {
    throw new FinanceCloudError(
      "The saved finance data could not be verified as empty.",
      undefined,
      "verification-failed",
    );
  }
}

export async function getFinanceCloudHandshake(
  localState: FinanceState | null,
): Promise<FinanceCloudHandshake> {
  const cloudState = await loadCloudFinanceState();

  return {
    localState,
    cloudState,
    comparison: compareFinanceStates(localState, cloudState),
  };
}