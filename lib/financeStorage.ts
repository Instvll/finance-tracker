import {
  activeBillOccurrencesStorageKey,
  billsStorageKey,
  cardsStorageKey,
  lastSavedStorageKey,
  legacyLastPaidActionStorageKey,
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

export function loadFinanceStorageState<TSummary>(
  defaults: FinanceStorageDefaults<TSummary>,
  options: FinanceStorageLoadOptions = {},
): FinanceStorageState<TSummary> {
  const cards = normalizeManualCards(
    readJsonStorage(
      cardsStorageKey,
      defaults.cards,
    ),
  );
  const bills = normalizeManualBills(
    readJsonStorage(
      billsStorageKey,
      defaults.bills,
    ),
    cards,
    options.syncLegacyPaymentMethod ?? false,
  );

  return {
    summary: readJsonStorage(
      summaryStorageKey,
      defaults.summary,
    ),
    bills,
    cards,
    preferences: readPayPeriodPreferences(),
    activeOccurrenceDates:
      readJsonStorage<ActiveBillOccurrenceDates>(
        activeBillOccurrencesStorageKey,
        {},
      ),
    paidOccurrences:
      readJsonStorage<PaidBillOccurrences>(
        paidBillsStorageKey,
        {},
      ),
    paidActions:
      readJsonStorage<PaidBillAction[]>(
        recentPaidActionsStorageKey,
        [],
      ),
    legacyPaidAction:
      readJsonStorage<Partial<PaidBillAction> | null>(
        legacyLastPaidActionStorageKey,
        null,
      ),
    lastSaved:
      window.localStorage.getItem(
        lastSavedStorageKey,
      ) ?? "",
  };
}

export function loadBillOccurrenceStorageState():
  BillOccurrenceStorageState {
  return {
    activeOccurrenceDates:
      readJsonStorage<ActiveBillOccurrenceDates>(
        activeBillOccurrencesStorageKey,
        {},
      ),
    paidOccurrences:
      readJsonStorage<PaidBillOccurrences>(
        paidBillsStorageKey,
        {},
      ),
    paidActions:
      readJsonStorage<PaidBillAction[]>(
        recentPaidActionsStorageKey,
        [],
      ),
    legacyPaidAction:
      readJsonStorage<Partial<PaidBillAction> | null>(
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
    readJsonStorage(
      cardsStorageKey,
      defaultCards,
    ),
  );

  return {
    bills: normalizeManualBills(
      readJsonStorage(
        billsStorageKey,
        defaultBills,
      ),
      cards,
    ),
    cards,
    preferences: readPayPeriodPreferences(),
    ...loadBillOccurrenceStorageState(),
  };
}

export function saveFinanceSummary<TSummary>(
  summary: TSummary,
) {
  writeJsonStorage(summaryStorageKey, summary);
}

export function saveFinanceBills(
  bills: ManualBill[],
) {
  writeJsonStorage(billsStorageKey, bills);
}

export function saveFinanceCards(
  cards: ManualCreditCard[],
) {
  writeJsonStorage(cardsStorageKey, cards);
}

export function saveFinancePreferences(
  preferences: PayPeriodPreferences,
) {
  writeJsonStorage(
    preferencesStorageKey,
    preferences,
  );
}

export function saveActiveBillOccurrenceDates(
  activeOccurrenceDates: ActiveBillOccurrenceDates,
) {
  writeJsonStorage(
    activeBillOccurrencesStorageKey,
    activeOccurrenceDates,
  );
}

export function savePaidBillOccurrences(
  paidOccurrences: PaidBillOccurrences,
) {
  writeJsonStorage(
    paidBillsStorageKey,
    paidOccurrences,
  );
}

export function saveRecentPaidActions(
  paidActions: PaidBillAction[],
) {
  writeJsonStorage(
    recentPaidActionsStorageKey,
    paidActions,
  );
}

export function saveLastSavedTime(
  savedAt: string,
) {
  window.localStorage.setItem(
    lastSavedStorageKey,
    savedAt,
  );
}

export function saveBillOccurrenceStorageState(
  state: Omit<
    BillOccurrenceStorageState,
    "legacyPaidAction"
  >,
) {
  saveActiveBillOccurrenceDates(
    state.activeOccurrenceDates,
  );
  savePaidBillOccurrences(
    state.paidOccurrences,
  );
  saveRecentPaidActions(
    state.paidActions,
  );
  clearLegacyPaidAction();
}

export function clearLegacyPaidAction() {
  window.localStorage.removeItem(
    legacyLastPaidActionStorageKey,
  );
}