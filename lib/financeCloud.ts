import { supabase } from "./supabase/client";
import {
  currentFinanceStateSchemaVersion,
  isFinanceState,
  type FinanceState,
} from "./financeState";

const financeTableName = "finance_data";

type FinanceCloudRow = {
  user_id: string;
  finance_state: unknown;
  finance_revision: number | string;
  finance_schema_version: number | string;
  finance_state_updated_at: string | null;
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

export class FinanceCloudError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FinanceCloudError";
  }
}

async function getAuthenticatedUserId() {
  const { data, error } =
    await supabase.auth.getUser();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not verify the signed-in account.",
      error,
    );
  }

  if (!data.user) {
    throw new FinanceCloudError(
      "Sign in before using cloud finance sync.",
    );
  }

  return data.user.id;
}

function normalizeCloudRevision(
  value: number | string,
) {
  const revision = Number(value);

  if (
    !Number.isSafeInteger(revision) ||
    revision < 0
  ) {
    throw new FinanceCloudError(
      "The cloud finance revision is invalid.",
    );
  }

  return revision;
}

function normalizeCloudSchemaVersion(
  value: number | string,
) {
  const schemaVersion = Number(value);

  if (
    !Number.isSafeInteger(schemaVersion) ||
    schemaVersion < 1
  ) {
    throw new FinanceCloudError(
      "The cloud finance schema version is invalid.",
    );
  }

  return schemaVersion;
}

function canonicalizeJsonValue(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const record =
      value as Record<string, unknown>;

    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>(
        (result, key) => {
          result[key] = canonicalizeJsonValue(
            record[key],
          );

          return result;
        },
        {},
      );
  }

  return value;
}

function getComparableStateValue(
  state: FinanceState,
) {
  const comparableState = {
    schemaVersion: state.schemaVersion,
    summary: state.summary,
    bills: state.bills,
    cards: state.cards,
    preferences: state.preferences,
    activeOccurrenceDates:
      state.activeOccurrenceDates,
    paidOccurrences: state.paidOccurrences,
    paidActions: state.paidActions,
  };

  return JSON.stringify(
    canonicalizeJsonValue(comparableState),
  );
}

function normalizeCloudFinanceState(
  row: FinanceCloudRow,
) {
  if (!isFinanceState(row.finance_state)) {
    throw new FinanceCloudError(
      "The cloud finance state is missing or invalid.",
    );
  }

  const revision = normalizeCloudRevision(
    row.finance_revision,
  );
  const schemaVersion =
    normalizeCloudSchemaVersion(
      row.finance_schema_version,
    );

  if (
    schemaVersion !==
      currentFinanceStateSchemaVersion ||
    row.finance_state.schemaVersion !==
      currentFinanceStateSchemaVersion
  ) {
    throw new FinanceCloudError(
      "The cloud finance state uses an unsupported schema version.",
    );
  }

  return {
    ...row.finance_state,
    revision,
    updatedAt:
      row.finance_state_updated_at ??
      row.finance_state.updatedAt,
  } satisfies FinanceState;
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

  if (
    localState.revision === cloudState.revision
  ) {
    return statesMatch ? "in-sync" : "conflict";
  }

  if (localState.revision > cloudState.revision) {
    return "local-newer";
  }

  return "cloud-newer";
}

export async function loadCloudFinanceState():
  Promise<FinanceState | null> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from(financeTableName)
    .select(
      [
        "user_id",
        "finance_state",
        "finance_revision",
        "finance_schema_version",
        "finance_state_updated_at",
      ].join(","),
    )
    .eq("user_id", userId)
    .maybeSingle<FinanceCloudRow>();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not read the cloud finance state.",
      error,
    );
  }

  if (!data || data.finance_state === null) {
    return null;
  }

  if (data.user_id !== userId) {
    throw new FinanceCloudError(
      "The cloud finance state does not belong to the signed-in account.",
    );
  }

  return normalizeCloudFinanceState(data);
}

export async function uploadCloudFinanceState(
  state: FinanceState,
): Promise<FinanceState> {
  if (!isFinanceState(state)) {
    throw new FinanceCloudError(
      "leftovr cannot upload an invalid finance state.",
    );
  }

  if (
    state.schemaVersion !==
    currentFinanceStateSchemaVersion
  ) {
    throw new FinanceCloudError(
      "leftovr cannot upload an unsupported finance-state version.",
    );
  }

  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from(financeTableName)
    .upsert(
      {
        user_id: userId,
        finance_state: state,
        finance_revision: state.revision,
        finance_schema_version:
          state.schemaVersion,
        finance_state_updated_at:
          state.updatedAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )
    .select(
      [
        "user_id",
        "finance_state",
        "finance_revision",
        "finance_schema_version",
        "finance_state_updated_at",
      ].join(","),
    )
    .single<FinanceCloudRow>();

  if (error) {
    throw new FinanceCloudError(
      "leftovr could not upload the finance state.",
      error,
    );
  }

  if (!data || data.user_id !== userId) {
    throw new FinanceCloudError(
      "leftovr could not verify the uploaded cloud state.",
    );
  }

  return normalizeCloudFinanceState(data);
}

export async function getFinanceCloudHandshake(
  localState: FinanceState | null,
): Promise<FinanceCloudHandshake> {
  const cloudState =
    await loadCloudFinanceState();

  return {
    localState,
    cloudState,
    comparison: compareFinanceStates(
      localState,
      cloudState,
    ),
  };
}