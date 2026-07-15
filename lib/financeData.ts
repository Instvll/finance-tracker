import {
  getBillIdentity,
  getLegacyBillIdentity,
  type PaidBillOccurrences,
} from "./billStatus";

export type PaymentSource =
  | {
      type: "checking";
    }
  | {
      type: "credit-card";
      creditCardId: string;
    };

export type CreditCardAdjustment = {
  creditCardId: string;
  amount: string;
  balanceRevision?: number;
};

export type ManualBill = {
  id?: string;
  name: string;
  amount: string;
  dueDate: string;
  status: "Paid" | "Upcoming" | "Due Soon" | "Overdue";
  paymentMethod: string;
  paymentSource?: PaymentSource;
};

export type ManualCreditCard = {
  id?: string;
  name: string;
  balance: string;
  balanceRevision?: number;
  limit: string;
  minimumPayment: string;
  dueDate: string;
  status: "Good" | "Watch" | "Pay Down";
};

export type PaidBillAction = {
  occurrenceKey: string;
  occurrenceDateKey: string;
  billIdentity: string;
  billId?: string;
  billName: string;
  nextOccurrenceDateKey: string | null;
  paidAt: string;
  billAmount?: string;
  paymentSource?: PaymentSource;
  creditCardAdjustment?: CreditCardAdjustment;
};

export type ActiveBillOccurrenceDates = Record<string, string>;

export type MigratedBillOccurrenceState = {
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
};

export const summaryStorageKey =
  "finance-tracker-manual-data";
export const billsStorageKey =
  "finance-tracker-manual-bills";
export const cardsStorageKey =
  "finance-tracker-manual-cards";
export const lastSavedStorageKey =
  "finance-tracker-last-saved";
export const paidBillsStorageKey =
  "leftovr-paid-bill-occurrences";
export const activeBillOccurrencesStorageKey =
  "leftovr-active-bill-occurrences";
export const recentPaidActionsStorageKey =
  "leftovr-recent-paid-bill-actions";
export const legacyLastPaidActionStorageKey =
  "leftovr-last-paid-bill-action";
export const preferencesStorageKey =
  "leftovr-preferences";

export function createPersistentId(prefix: string) {
  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomId}`;
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function parseMoney(value: string) {
  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

export function getStoredMoneyValue(amount: number) {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

export function getCardBalanceRevision(
  card: ManualCreditCard,
) {
  const revision = Number(card.balanceRevision);

  return Number.isInteger(revision) && revision >= 0
    ? revision
    : 0;
}

export function getAdjustmentBalanceRevision(
  adjustment: CreditCardAdjustment,
) {
  const revision = Number(adjustment.balanceRevision);

  return Number.isInteger(revision) && revision >= 0
    ? revision
    : 0;
}

export function normalizeManualCards(
  cards: ManualCreditCard[],
) {
  const usedIds = new Set<string>();

  return cards.map((card) => {
    let id = card.id?.trim();

    while (!id || usedIds.has(id)) {
      id = createPersistentId("card");
    }

    usedIds.add(id);

    return {
      ...card,
      id,
      balanceRevision: getCardBalanceRevision(card),
    };
  });
}

export function applyManualCardBalanceRevisions(
  cards: ManualCreditCard[],
  originalCards: ManualCreditCard[],
) {
  const originalCardsById = new Map(
    originalCards
      .filter((card) => card.id)
      .map((card) => [card.id as string, card]),
  );

  return cards.map((card) => {
    const originalCard = card.id
      ? originalCardsById.get(card.id)
      : undefined;

    if (!originalCard) {
      return card;
    }

    const originalBalance = getStoredMoneyValue(
      parseMoney(originalCard.balance),
    );
    const nextBalance = getStoredMoneyValue(
      parseMoney(card.balance),
    );

    if (originalBalance === nextBalance) {
      return card;
    }

    return {
      ...card,
      balanceRevision:
        getCardBalanceRevision(originalCard) + 1,
    };
  });
}

export function resolveBillPaymentSource(
  bill: ManualBill,
  cards: ManualCreditCard[],
): PaymentSource {
  const savedPaymentSource = bill.paymentSource;

  if (
    savedPaymentSource?.type === "credit-card" &&
    cards.some(
      (card) =>
        card.id === savedPaymentSource.creditCardId,
    )
  ) {
    return savedPaymentSource;
  }

  const normalizedMethod = normalizeText(
    bill.paymentMethod,
  );
  const checkingLabels = new Set([
    "checking",
    "checking account",
    "bank",
    "bank account",
  ]);

  if (
    !normalizedMethod ||
    checkingLabels.has(normalizedMethod)
  ) {
    return { type: "checking" };
  }

  const matchingCards = cards.filter(
    (card) =>
      normalizeText(card.name) === normalizedMethod,
  );

  if (matchingCards.length === 1 && matchingCards[0].id) {
    return {
      type: "credit-card",
      creditCardId: matchingCards[0].id,
    };
  }

  return { type: "checking" };
}

export function getPaymentMethodLabel(
  paymentSource: PaymentSource,
  cards: ManualCreditCard[],
) {
  if (paymentSource.type === "checking") {
    return "Checking";
  }

  const matchingCard = cards.find(
    (card) =>
      card.id === paymentSource.creditCardId,
  );

  return matchingCard?.name.trim() || "Credit Card";
}

export function getPaymentSourceLabel(
  paymentSource: PaymentSource | undefined,
  cards: ManualCreditCard[],
) {
  if (
    !paymentSource ||
    paymentSource.type === "checking"
  ) {
    return "Checking account";
  }

  const matchingCard = cards.find(
    (card) =>
      card.id === paymentSource.creditCardId,
  );

  return matchingCard?.name.trim() || "Credit card";
}

export function findBillForPaidAction(
  action: PaidBillAction,
  bills: ManualBill[],
) {
  if (action.billId) {
    const idMatch = bills.find(
      (bill) => bill.id === action.billId,
    );

    if (idMatch) {
      return idMatch;
    }
  }

  const identityMatches = bills.filter(
    (bill) =>
      getBillIdentity(bill) === action.billIdentity ||
      getLegacyBillIdentity(bill) ===
        action.billIdentity,
  );

  if (identityMatches.length === 1) {
    return identityMatches[0];
  }

  const nameMatches = bills.filter(
    (bill) =>
      normalizeText(bill.name) ===
      normalizeText(action.billName),
  );

  return nameMatches.length === 1
    ? nameMatches[0]
    : undefined;
}

export function normalizePaidBillActions(
  actions: PaidBillAction[],
  bills: ManualBill[],
) {
  return actions.map((action) => {
    const matchingBill = findBillForPaidAction(
      action,
      bills,
    );

    if (!matchingBill?.id) {
      return action;
    }

    return {
      ...action,
      billId: matchingBill.id,
      billName: action.billName || matchingBill.name || "Bill",
    };
  });
}

export function normalizeManualBillIds(
  currentBills: ManualBill[],
) {
  const usedIds = new Set<string>();

  return currentBills.map((bill) => {
    let id = bill.id?.trim();

    while (!id || usedIds.has(id)) {
      id = createPersistentId("bill");
    }

    usedIds.add(id);

    return {
      ...bill,
      id,
    };
  });
}

export function normalizeManualBills(
  currentBills: ManualBill[],
  cards: ManualCreditCard[],
  syncLegacyPaymentMethod = false,
) {
  return normalizeManualBillIds(currentBills).map(
    (bill) => {
      const paymentSource = resolveBillPaymentSource(
        bill,
        cards,
      );

      return {
        ...bill,
        ...(syncLegacyPaymentMethod
          ? {
              paymentMethod: getPaymentMethodLabel(
                paymentSource,
                cards,
              ),
            }
          : {}),
        paymentSource,
      };
    },
  );
}

export function migrateBillOccurrenceState(
  bills: ManualBill[],
  savedActiveOccurrenceDates: ActiveBillOccurrenceDates,
  savedPaidOccurrences: PaidBillOccurrences,
  savedPaidActions: PaidBillAction[],
): MigratedBillOccurrenceState {
  const normalizedActions = normalizePaidBillActions(
    savedPaidActions,
    bills,
  );
  const activeOccurrenceDates: ActiveBillOccurrenceDates = {};
  const paidOccurrences: PaidBillOccurrences = {};

  for (const bill of bills) {
    const stableIdentity = getBillIdentity(bill);
    const legacyIdentity = getLegacyBillIdentity(bill);
    const savedDate =
      savedActiveOccurrenceDates[stableIdentity] ??
      savedActiveOccurrenceDates[legacyIdentity];

    if (savedDate) {
      activeOccurrenceDates[stableIdentity] = savedDate;
    }
  }

  for (const [occurrenceKey, paidAt] of Object.entries(
    savedPaidOccurrences,
  )) {
    const matchingBill = bills.find((bill) => {
      const stablePrefix = `${getBillIdentity(bill)}|`;
      const legacyPrefix = `${getLegacyBillIdentity(bill)}|`;

      return (
        occurrenceKey.startsWith(stablePrefix) ||
        occurrenceKey.startsWith(legacyPrefix)
      );
    });

    if (!matchingBill) {
      paidOccurrences[occurrenceKey] = paidAt;
      continue;
    }

    const stableIdentity = getBillIdentity(matchingBill);
    const legacyIdentity = getLegacyBillIdentity(matchingBill);
    const currentPrefix = occurrenceKey.startsWith(
      `${stableIdentity}|`,
    )
      ? `${stableIdentity}|`
      : `${legacyIdentity}|`;
    const dateSuffix = occurrenceKey.slice(
      currentPrefix.length,
    );
    const migratedKey = `${stableIdentity}|${dateSuffix}`;

    if (!paidOccurrences[migratedKey]) {
      paidOccurrences[migratedKey] = paidAt;
    }
  }

  const paidActions = normalizedActions.map((action) => {
    const matchingBill = findBillForPaidAction(
      action,
      bills,
    );

    if (!matchingBill) {
      return action;
    }

    const stableIdentity = getBillIdentity(matchingBill);
    const migratedOccurrenceKey =
      `${stableIdentity}|${action.occurrenceDateKey}`;
    const paidAt =
      paidOccurrences[migratedOccurrenceKey] ??
      savedPaidOccurrences[action.occurrenceKey] ??
      action.paidAt;

    if (paidAt && !paidOccurrences[migratedOccurrenceKey]) {
      paidOccurrences[migratedOccurrenceKey] = paidAt;
    }

    return {
      ...action,
      occurrenceKey: migratedOccurrenceKey,
      billIdentity: stableIdentity,
      billId: matchingBill.id,
      billName:
        action.billName || matchingBill.name || "Bill",
      paidAt,
    };
  });

  return {
    activeOccurrenceDates,
    paidOccurrences,
    paidActions,
  };
}

export function readJsonStorage<T>(
  key: string,
  fallback: T,
) {
  const savedValue = window.localStorage.getItem(key);

  if (!savedValue) {
    return fallback;
  }

  try {
    return JSON.parse(savedValue) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(
  key: string,
  value: unknown,
) {
  window.localStorage.setItem(
    key,
    JSON.stringify(value),
  );
}