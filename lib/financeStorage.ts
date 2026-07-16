import {
  activeBillOccurrencesStorageKey,
  billsStorageKey,
  cardsStorageKey,
  lastSavedStorageKey,
  legacyLastPaidActionStorageKey,
  migrateBillOccurrenceState,
  normalizeManualBills,
  normalizeManualCards,
  paidBillsStorageKey,
  preferencesStorageKey,
  readJsonStorage,
  recentPaidActionsStorageKey,
  summaryStorageKey,
  writeJsonStorage,
  type ActiveBillOccurrenceDates,
  type ManualBill,
  type ManualCreditCard,
  type PaidBillAction,
} from "./financeData";
import {
  readPayPeriodPreferences,
  type PaidBillOccurrences,
  type PayPeriodPreferences,
} from "./billStatus";
import {
  createFinanceState,
  currentFinanceStateSchemaVersion,
  isFinanceState,
  type CreateFinanceStateOptions,
  type FinanceState,
  type FinanceSummaryData,
} from "./financeState";
import { scheduleFinanceCloudUpload } from "./financeSync";

export const financeStateStorageKey = "leftovr-finance-state";

export const financeRestoreBackupStorageKey =
  "leftovr-finance-state-restore-backup";

const financeRestoreBackupVersion = 1;

export type FinanceRestoreBackup = {
  version: typeof financeRestoreBackupVersion;
  createdAt: string;
  source: "cloud-restore";
  incomingRevision: number;
  previousRevision: number | null;
  values: Record<string, string | null>;
};

export type FinanceStorageDefaults<TSummary> = {
  summary: TSummary;
  bills: ManualBill[];
  cards: ManualCreditCard[];
};

export type FinanceStorageState<TSummary> = {
  summary: TSummary;
  bills: ManualBill[];
  cards: ManualCreditCard[];
  preferences: PayPeriodPreferences;
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  legacyPaidAction: Partial<PaidBillAction> | null;
  lastSaved: string;
};

export type FinanceStorageLoadOptions = {
  syncLegacyPaymentMethod?: boolean;
};

export type FinanceSnapshotOptions = FinanceStorageLoadOptions &
  CreateFinanceStateOptions;

export type SaveFinanceStateResult = {
  state: FinanceState;
  savedAt: string;
};

export type SaveFinanceStateOptions = {
  scheduleCloudUpload?: boolean;
};

export type PersistCurrentFinanceStateOptions = FinanceStorageLoadOptions & {
  updatedAt?: string;
};

export type BillOccurrenceStorageState = {
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  legacyPaidAction: Partial<PaidBillAction> | null;
};

export type BillTrackingStorageState = BillOccurrenceStorageState & {
  bills: ManualBill[];
  cards: ManualCreditCard[];
  preferences: PayPeriodPreferences;
};

function mergeStoredObjectWithDefaults<TValue>(
  defaults: TValue,
  storedValue: TValue,
): TValue {
  if (
    defaults === null ||
    storedValue === null ||
    Array.isArray(defaults) ||
    Array.isArray(storedValue) ||
    typeof defaults !== "object" ||
    typeof storedValue !== "object"
  ) {
    return storedValue;
  }

  return {
    ...(defaults as Record<string, unknown>),
    ...(storedValue as Record<string, unknown>),
  } as TValue;
}

export function loadFinanceStorageState<TSummary>(
  defaults: FinanceStorageDefaults<TSummary>,
  options: FinanceStorageLoadOptions = {},
): FinanceStorageState<TSummary> {
  const storedSummary = readJsonStorage(
    summaryStorageKey,
    defaults.summary,
  );
  const cards = normalizeManualCards(
    readJsonStorage(cardsStorageKey, defaults.cards),
  );
  const bills = normalizeManualBills(
    readJsonStorage(billsStorageKey, defaults.bills),
    cards,
    options.syncLegacyPaymentMethod ?? false,
  );

  return {
    summary: mergeStoredObjectWithDefaults(
      defaults.summary,
      storedSummary,
    ),
    bills,
    cards,
    preferences: readPayPeriodPreferences(),
    activeOccurrenceDates: readJsonStorage<ActiveBillOccurrenceDates>(
      activeBillOccurrencesStorageKey,
      {},
    ),
    paidOccurrences: readJsonStorage<PaidBillOccurrences>(
      paidBillsStorageKey,
      {},
    ),
    paidActions: readJsonStorage<PaidBillAction[]>(
      recentPaidActionsStorageKey,
      [],
    ),
    legacyPaidAction: readJsonStorage<Partial<PaidBillAction> | null>(
      legacyLastPaidActionStorageKey,
      null,
    ),
    lastSaved: window.localStorage.getItem(lastSavedStorageKey) ?? "",
  };
}

function getPaidActionsIncludingLegacyAction(
  storedState: FinanceStorageState<FinanceSummaryData>,
) {
  const legacyAction = storedState.legacyPaidAction;

  const migratedLegacyAction =
    legacyAction?.occurrenceKey &&
    legacyAction.occurrenceDateKey &&
    legacyAction.billIdentity &&
    legacyAction.billName &&
    storedState.paidOccurrences[legacyAction.occurrenceKey]
      ? ({
          occurrenceKey: legacyAction.occurrenceKey,
          occurrenceDateKey: legacyAction.occurrenceDateKey,
          billIdentity: legacyAction.billIdentity,
          billId: legacyAction.billId,
          billName: legacyAction.billName,
          nextOccurrenceDateKey: legacyAction.nextOccurrenceDateKey ?? null,
          paidAt:
            legacyAction.paidAt ||
            storedState.paidOccurrences[legacyAction.occurrenceKey],
          billAmount: legacyAction.billAmount,
          paymentSource: legacyAction.paymentSource,
          creditCardAdjustment: legacyAction.creditCardAdjustment,
        } satisfies PaidBillAction)
      : null;

  return migratedLegacyAction
    ? [migratedLegacyAction, ...storedState.paidActions]
    : storedState.paidActions;
}

export function loadFinanceState<TSummary extends FinanceSummaryData>(
  defaults: FinanceStorageDefaults<TSummary>,
  options: FinanceSnapshotOptions = {},
): FinanceState {
  const storedState = loadFinanceStorageState(defaults, options);
  const migratedOccurrenceState = migrateBillOccurrenceState(
    storedState.bills,
    storedState.activeOccurrenceDates,
    storedState.paidOccurrences,
    getPaidActionsIncludingLegacyAction(storedState),
  );

  return createFinanceState(
    {
      summary: storedState.summary,
      bills: storedState.bills,
      cards: storedState.cards,
      preferences: storedState.preferences,
      activeOccurrenceDates: migratedOccurrenceState.activeOccurrenceDates,
      paidOccurrences: migratedOccurrenceState.paidOccurrences,
      paidActions: migratedOccurrenceState.paidActions,
    },
    {
      revision: options.revision,
      updatedAt: options.updatedAt || storedState.lastSaved || undefined,
    },
  );
}

export function createFinanceSnapshot<TSummary extends FinanceSummaryData>(
  defaults: FinanceStorageDefaults<TSummary>,
  options: FinanceSnapshotOptions = {},
): FinanceState {
  return loadFinanceState(defaults, options);
}

let financeStateRefreshScheduled = false;

function getEmptyFinanceSummary(): FinanceSummaryData {
  return {
    checkingBalance: "0",
    monthlyIncome: "0",
    savingsBalance: "0",
    nextPayday: "",
  };
}

function normalizeFinanceSummary(
  summary: FinanceSummaryData | null | undefined,
): FinanceSummaryData {
  return {
    ...getEmptyFinanceSummary(),
    ...(summary ?? {}),
  };
}

function getFinanceStateRefreshDefaults(): FinanceStorageDefaults<FinanceSummaryData> {
  const persistedState = loadPersistedFinanceState();

  return {
    summary: normalizeFinanceSummary(
      persistedState?.summary,
    ),
    bills: persistedState?.bills ?? [],
    cards: persistedState?.cards ?? [],
  };
}

function scheduleFinanceStateRefresh() {
  if (typeof window === "undefined" || financeStateRefreshScheduled) {
    return;
  }

  financeStateRefreshScheduled = true;

  queueMicrotask(() => {
    financeStateRefreshScheduled = false;

    try {
      persistCurrentFinanceState(getFinanceStateRefreshDefaults());
    } catch (error) {
      console.error(
        "leftovr could not refresh its local finance state.",
        error,
      );
    }
  });
}

export async function flushFinanceStateRefresh() {
  if (financeStateRefreshScheduled) {
    await Promise.resolve();
  }

  return loadPersistedFinanceState();
}

export function loadPersistedFinanceState(): FinanceState | null {
  const savedValue = window.localStorage.getItem(financeStateStorageKey);

  if (!savedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(savedValue);

    if (!isFinanceState(parsedValue)) {
      return null;
    }

    return createFinanceState(
      {
        ...parsedValue,
        summary: normalizeFinanceSummary(
          parsedValue.summary,
        ),
      },
      {
        revision: parsedValue.revision,
        updatedAt: parsedValue.updatedAt,
      },
    );
  } catch {
    return null;
  }
}

export function createNextFinanceSnapshot<TSummary extends FinanceSummaryData>(
  defaults: FinanceStorageDefaults<TSummary>,
  options: PersistCurrentFinanceStateOptions = {},
): FinanceState {
  const currentPersistedState = loadPersistedFinanceState();

  return createFinanceSnapshot(defaults, {
    ...options,
    revision: (currentPersistedState?.revision ?? 0) + 1,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  });
}

function getComparableFinanceStateContent(state: FinanceState) {
  return {
    schemaVersion: state.schemaVersion,
    summary: state.summary,
    bills: state.bills,
    cards: state.cards,
    preferences: state.preferences,
    activeOccurrenceDates: state.activeOccurrenceDates,
    paidOccurrences: state.paidOccurrences,
    paidActions: state.paidActions,
  };
}

function financeStateContentMatches(
  firstState: FinanceState,
  secondState: FinanceState,
) {
  return (
    JSON.stringify(
      canonicalizeJsonValue(
        getComparableFinanceStateContent(firstState),
      ),
    ) ===
    JSON.stringify(
      canonicalizeJsonValue(
        getComparableFinanceStateContent(secondState),
      ),
    )
  );
}

export function persistCurrentFinanceState<TSummary extends FinanceSummaryData>(
  defaults: FinanceStorageDefaults<TSummary>,
  options: PersistCurrentFinanceStateOptions = {},
): SaveFinanceStateResult {
  const currentPersistedState = loadPersistedFinanceState();
  const nextState = createNextFinanceSnapshot(defaults, options);

  if (
    currentPersistedState &&
    financeStateContentMatches(
      currentPersistedState,
      nextState,
    )
  ) {
    return {
      state: currentPersistedState,
      savedAt: currentPersistedState.updatedAt,
    };
  }

  return saveFinanceState(nextState);
}

type FinanceStorageWrite = {
  key: string;
  value: string | null;
};

const financeStateManagedStorageKeys = [
  financeStateStorageKey,
  summaryStorageKey,
  billsStorageKey,
  cardsStorageKey,
  preferencesStorageKey,
  activeBillOccurrencesStorageKey,
  paidBillsStorageKey,
  recentPaidActionsStorageKey,
  lastSavedStorageKey,
  legacyLastPaidActionStorageKey,
] as const;

function captureFinanceStorageValues() {
  return financeStateManagedStorageKeys.reduce<Record<string, string | null>>(
    (values, key) => {
      values[key] = window.localStorage.getItem(key);
      return values;
    },
    {},
  );
}

function createFinanceStorageWritesFromValues(
  values: Record<string, string | null>,
) {
  return financeStateManagedStorageKeys.map((key) => ({
    key,
    value: values[key] ?? null,
  }));
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

function financeStatesMatch(
  firstState: FinanceState,
  secondState: FinanceState,
) {
  return (
    JSON.stringify(canonicalizeJsonValue(firstState)) ===
    JSON.stringify(canonicalizeJsonValue(secondState))
  );
}

function applyFinanceStorageWrites(writes: FinanceStorageWrite[]) {
  const previousValues = writes.map(({ key }) => ({
    key,
    value: window.localStorage.getItem(key),
  }));

  try {
    for (const write of writes) {
      if (write.value === null) {
        window.localStorage.removeItem(write.key);
      } else {
        window.localStorage.setItem(write.key, write.value);
      }
    }
  } catch (error) {
    for (const previousValue of previousValues) {
      try {
        if (previousValue.value === null) {
          window.localStorage.removeItem(previousValue.key);
        } else {
          window.localStorage.setItem(previousValue.key, previousValue.value);
        }
      } catch {
        // Best-effort rollback if storage is unavailable.
      }
    }

    throw error;
  }
}

export function saveFinanceState(
  state: FinanceState,
  options: SaveFinanceStateOptions = {},
): SaveFinanceStateResult {
  if (!isFinanceState(state)) {
    throw new Error("Cannot save an invalid leftovr finance state.");
  }

  const savedAt = state.updatedAt;

  const writes: FinanceStorageWrite[] = [
    {
      key: financeStateStorageKey,
      value: JSON.stringify(state),
    },
    {
      key: summaryStorageKey,
      value: JSON.stringify(state.summary),
    },
    {
      key: billsStorageKey,
      value: JSON.stringify(state.bills),
    },
    {
      key: cardsStorageKey,
      value: JSON.stringify(state.cards),
    },
    {
      key: preferencesStorageKey,
      value: JSON.stringify(state.preferences),
    },
    {
      key: activeBillOccurrencesStorageKey,
      value: JSON.stringify(state.activeOccurrenceDates),
    },
    {
      key: paidBillsStorageKey,
      value: JSON.stringify(state.paidOccurrences),
    },
    {
      key: recentPaidActionsStorageKey,
      value: JSON.stringify(state.paidActions),
    },
    {
      key: lastSavedStorageKey,
      value: savedAt,
    },
    {
      key: legacyLastPaidActionStorageKey,
      value: null,
    },
  ];

  applyFinanceStorageWrites(writes);

  if (options.scheduleCloudUpload ?? true) {
    scheduleFinanceCloudUpload(state);
  }

  return {
    state,
    savedAt,
  };
}

export function loadFinanceRestoreBackup(): FinanceRestoreBackup | null {
  const savedValue = window.localStorage.getItem(
    financeRestoreBackupStorageKey,
  );

  if (!savedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<FinanceRestoreBackup>;

    if (
      parsedValue.version !== financeRestoreBackupVersion ||
      parsedValue.source !== "cloud-restore" ||
      typeof parsedValue.createdAt !== "string" ||
      typeof parsedValue.incomingRevision !== "number" ||
      !Number.isSafeInteger(parsedValue.incomingRevision) ||
      !(
        parsedValue.previousRevision === null ||
        (typeof parsedValue.previousRevision === "number" &&
          Number.isSafeInteger(parsedValue.previousRevision))
      ) ||
      !parsedValue.values ||
      typeof parsedValue.values !== "object"
    ) {
      return null;
    }

    const values = Object.entries(parsedValue.values).reduce<
      Record<string, string | null>
    >((result, [key, value]) => {
      if (typeof value === "string" || value === null) {
        result[key] = value;
      }

      return result;
    }, {});

    return {
      version: financeRestoreBackupVersion,
      createdAt: parsedValue.createdAt,
      source: "cloud-restore",
      incomingRevision: parsedValue.incomingRevision,
      previousRevision: parsedValue.previousRevision,
      values,
    };
  } catch {
    return null;
  }
}

export function restoreFinanceStateFromCloud(
  cloudState: FinanceState,
): SaveFinanceStateResult {
  if (!isFinanceState(cloudState)) {
    throw new Error("Cannot restore an invalid cloud finance state.");
  }

  if (cloudState.schemaVersion !== currentFinanceStateSchemaVersion) {
    throw new Error(
      "Cannot restore an unsupported cloud finance-state version.",
    );
  }

  const previousState = loadPersistedFinanceState();
  const previousValues = captureFinanceStorageValues();

  const restoreBackup: FinanceRestoreBackup = {
    version: financeRestoreBackupVersion,
    createdAt: new Date().toISOString(),
    source: "cloud-restore",
    incomingRevision: cloudState.revision,
    previousRevision: previousState?.revision ?? null,
    values: previousValues,
  };

  try {
    window.localStorage.setItem(
      financeRestoreBackupStorageKey,
      JSON.stringify(restoreBackup),
    );
  } catch {
    throw new Error(
      "leftovr could not create the local rollback snapshot, so no cloud data was restored.",
    );
  }

  try {
    saveFinanceState(cloudState, {
      scheduleCloudUpload: false,
    });

    const verifiedState = loadPersistedFinanceState();

    if (!verifiedState || !financeStatesMatch(cloudState, verifiedState)) {
      throw new Error("The cloud restore could not be verified.");
    }

    return {
      state: verifiedState,
      savedAt: verifiedState.updatedAt,
    };
  } catch (error) {
    try {
      applyFinanceStorageWrites(
        createFinanceStorageWritesFromValues(previousValues),
      );
    } catch (rollbackError) {
      console.error(
        "leftovr could not restore the pre-sync local snapshot.",
        rollbackError,
      );

      throw new Error(
        "The cloud restore failed, and leftovr could not automatically recover the previous local data.",
      );
    }

    throw error instanceof Error
      ? error
      : new Error("leftovr could not restore the cloud finance state.");
  }
}

export function loadFinanceCards(defaultCards: ManualCreditCard[]) {
  return normalizeManualCards(readJsonStorage(cardsStorageKey, defaultCards));
}

export function loadBillOccurrenceStorageState(): BillOccurrenceStorageState {
  return {
    activeOccurrenceDates: readJsonStorage<ActiveBillOccurrenceDates>(
      activeBillOccurrencesStorageKey,
      {},
    ),
    paidOccurrences: readJsonStorage<PaidBillOccurrences>(
      paidBillsStorageKey,
      {},
    ),
    paidActions: readJsonStorage<PaidBillAction[]>(
      recentPaidActionsStorageKey,
      [],
    ),
    legacyPaidAction: readJsonStorage<Partial<PaidBillAction> | null>(
      legacyLastPaidActionStorageKey,
      null,
    ),
  };
}

export function loadBillTrackingStorageState(
  defaultBills: ManualBill[],
  defaultCards: ManualCreditCard[],
): BillTrackingStorageState {
  const cards = normalizeManualCards(
    readJsonStorage(cardsStorageKey, defaultCards),
  );

  return {
    bills: normalizeManualBills(
      readJsonStorage(billsStorageKey, defaultBills),
      cards,
    ),
    cards,
    preferences: readPayPeriodPreferences(),
    ...loadBillOccurrenceStorageState(),
  };
}

export function saveFinanceSummary<TSummary>(summary: TSummary) {
  writeJsonStorage(summaryStorageKey, summary);
  scheduleFinanceStateRefresh();
}

export function saveFinanceBills(bills: ManualBill[]) {
  writeJsonStorage(billsStorageKey, bills);
  scheduleFinanceStateRefresh();
}

export function saveFinanceCards(cards: ManualCreditCard[]) {
  writeJsonStorage(cardsStorageKey, cards);
  scheduleFinanceStateRefresh();
}

export function saveFinancePreferences(preferences: PayPeriodPreferences) {
  writeJsonStorage(preferencesStorageKey, preferences);
  scheduleFinanceStateRefresh();
}

export function saveActiveBillOccurrenceDates(
  activeOccurrenceDates: ActiveBillOccurrenceDates,
) {
  writeJsonStorage(activeBillOccurrencesStorageKey, activeOccurrenceDates);
  scheduleFinanceStateRefresh();
}

export function savePaidBillOccurrences(paidOccurrences: PaidBillOccurrences) {
  writeJsonStorage(paidBillsStorageKey, paidOccurrences);
  scheduleFinanceStateRefresh();
}

export function saveRecentPaidActions(paidActions: PaidBillAction[]) {
  writeJsonStorage(recentPaidActionsStorageKey, paidActions);
  scheduleFinanceStateRefresh();
}

export function saveLastSavedTime(savedAt: string) {
  window.localStorage.setItem(lastSavedStorageKey, savedAt);
}

export function saveBillOccurrenceStorageState(
  state: Omit<BillOccurrenceStorageState, "legacyPaidAction">,
) {
  saveActiveBillOccurrenceDates(state.activeOccurrenceDates);
  savePaidBillOccurrences(state.paidOccurrences);
  saveRecentPaidActions(state.paidActions);
  clearLegacyPaidAction();
}

export function clearLegacyPaidAction() {
  window.localStorage.removeItem(legacyLastPaidActionStorageKey);
}