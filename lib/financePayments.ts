import {
  getAdjustmentBalanceRevision,
  getCardBalanceRevision,
  getStoredMoneyValue,
  parseMoney,
  resolveBillPaymentSource,
  type ActiveBillOccurrenceDates,
  type CheckingBalanceAdjustment,
  type CreditCardAdjustment,
  type ManualBill,
  type ManualCreditCard,
  type PaidBillAction,
} from "./financeData";
import {
  formatLocalDateKey,
  getFollowingBillDueDate,
  isDateInCurrentPayPeriod,
  type ActiveBillOccurrence,
  type PaidBillOccurrences,
  type PayPeriodPreferences,
} from "./billStatus";

export type BillOccurrencePaymentItem = {
  bill: ManualBill;
  occurrence: ActiveBillOccurrence;
};

export type BillPaymentSummary = {
  checkingBalance: string;
};

export type MarkBillPaidInput<
  TSummary extends BillPaymentSummary,
> = {
  item: BillOccurrencePaymentItem;
  summary: TSummary;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  preferences: PayPeriodPreferences;
  paidAt?: string;
  recentActionLimit?: number;
};

export type MarkBillPaidResult<
  TSummary extends BillPaymentSummary,
> = {
  didApply: boolean;
  summary: TSummary;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  paidAction: PaidBillAction | null;
};

export type UndoBillPaymentInput<
  TSummary extends BillPaymentSummary,
> = {
  action: PaidBillAction;
  summary: TSummary;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
};

export type UndoBillPaymentBlockedReason =
  | "card-not-found"
  | "card-balance-changed"
  | "checking-balance-changed"
  | "missing-balance-history";

export type UndoBillPaymentResult<
  TSummary extends BillPaymentSummary,
> = {
  didUndo: boolean;
  summary: TSummary;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  didReverseCardBalance: boolean;
  didReverseCheckingBalance: boolean;
  blockedReason: UndoBillPaymentBlockedReason | null;
};

function normalizeOptionalMoneyValue(
  value: string | undefined,
) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return getStoredMoneyValue(numericValue);
}

function getSafeCardUndoBalance(
  card: ManualCreditCard,
  adjustment: CreditCardAdjustment,
) {
  const currentBalance = getStoredMoneyValue(
    parseMoney(card.balance),
  );
  const savedBalanceBefore = normalizeOptionalMoneyValue(
    adjustment.balanceBefore,
  );
  const savedBalanceAfter = normalizeOptionalMoneyValue(
    adjustment.balanceAfter,
  );

  if (savedBalanceBefore !== null && savedBalanceAfter !== null) {
    return currentBalance === savedBalanceAfter
      ? savedBalanceBefore
      : null;
  }

  const currentRevision = getCardBalanceRevision(card);
  const paymentRevision = getAdjustmentBalanceRevision(
    adjustment,
  );

  if (currentRevision !== paymentRevision) {
    return null;
  }

  return getStoredMoneyValue(
    Math.max(
      0,
      parseMoney(currentBalance) -
        parseMoney(adjustment.amount),
    ),
  );
}

function getSafeCheckingUndoBalance(
  summary: BillPaymentSummary,
  adjustment: CheckingBalanceAdjustment,
) {
  const currentBalance = getStoredMoneyValue(
    parseMoney(summary.checkingBalance),
  );
  const savedBalanceBefore = normalizeOptionalMoneyValue(
    adjustment.balanceBefore,
  );
  const savedBalanceAfter = normalizeOptionalMoneyValue(
    adjustment.balanceAfter,
  );

  if (savedBalanceBefore === null || savedBalanceAfter === null) {
    return null;
  }

  return currentBalance === savedBalanceAfter
    ? savedBalanceBefore
    : null;
}

export function normalizeRecentPaidActions(
  actions: PaidBillAction[],
  paidOccurrences: PaidBillOccurrences,
  preferences: PayPeriodPreferences,
  referenceDate = new Date(),
  limit?: number,
) {
  const seenOccurrenceKeys = new Set<string>();

  const normalizedActions = actions
    .filter((action) => {
      const paidAt =
        action?.paidAt ||
        paidOccurrences[action?.occurrenceKey ?? ""];

      if (
        !action?.occurrenceKey ||
        !paidOccurrences[action.occurrenceKey] ||
        seenOccurrenceKeys.has(action.occurrenceKey) ||
        !paidAt ||
        !isDateInCurrentPayPeriod(
          paidAt,
          preferences,
          referenceDate,
        )
      ) {
        return false;
      }

      seenOccurrenceKeys.add(action.occurrenceKey);
      return true;
    })
    .map((action) => ({
      ...action,
      paidAt:
        action.paidAt ||
        paidOccurrences[action.occurrenceKey] ||
        new Date(0).toISOString(),
    }))
    .sort(
      (firstAction, secondAction) =>
        new Date(secondAction.paidAt).getTime() -
        new Date(firstAction.paidAt).getTime(),
    );

  return typeof limit === "number"
    ? normalizedActions.slice(0, limit)
    : normalizedActions;
}

export function markBillOccurrencePaid<
  TSummary extends BillPaymentSummary,
>(
  input: MarkBillPaidInput<TSummary>,
): MarkBillPaidResult<TSummary> {
  const {
    item,
    summary,
    cards,
    activeOccurrenceDates,
    paidOccurrences,
    paidActions,
    preferences,
    recentActionLimit,
  } = input;
  const { bill, occurrence } = item;

  if (paidOccurrences[occurrence.occurrenceKey]) {
    return {
      didApply: false,
      summary,
      cards,
      activeOccurrenceDates,
      paidOccurrences,
      paidActions,
      paidAction: null,
    };
  }

  const paidAt = input.paidAt ?? new Date().toISOString();
  const paymentSource = resolveBillPaymentSource(
    bill,
    cards,
  );
  const billAmount = parseMoney(bill.amount);

  const checkingBalanceBefore =
    paymentSource.type === "checking"
      ? getStoredMoneyValue(
          parseMoney(summary.checkingBalance),
        )
      : null;
  const checkingBalanceAfter =
    checkingBalanceBefore !== null
      ? getStoredMoneyValue(
          parseMoney(checkingBalanceBefore) - billAmount,
        )
      : null;
  const checkingBalanceAdjustment =
    checkingBalanceBefore !== null &&
    checkingBalanceAfter !== null
      ? {
          amount: getStoredMoneyValue(billAmount),
          balanceBefore: checkingBalanceBefore,
          balanceAfter: checkingBalanceAfter,
        }
      : undefined;

  const nextSummary = checkingBalanceAdjustment
    ? {
        ...summary,
        checkingBalance:
          checkingBalanceAdjustment.balanceAfter,
      }
    : summary;

  const linkedCreditCard =
    paymentSource.type === "credit-card"
      ? cards.find(
          (card) =>
            card.id === paymentSource.creditCardId,
        )
      : undefined;
  const linkedCardBalanceBefore = linkedCreditCard
    ? getStoredMoneyValue(
        parseMoney(linkedCreditCard.balance),
      )
    : null;
  const linkedCardBalanceAfter =
    linkedCreditCard && linkedCardBalanceBefore !== null
      ? getStoredMoneyValue(
          parseMoney(linkedCardBalanceBefore) + billAmount,
        )
      : null;
  const creditCardAdjustment =
    linkedCreditCard?.id &&
    linkedCardBalanceBefore !== null &&
    linkedCardBalanceAfter !== null
      ? {
          creditCardId: linkedCreditCard.id,
          amount: getStoredMoneyValue(billAmount),
          balanceRevision:
            getCardBalanceRevision(linkedCreditCard),
          balanceBefore: linkedCardBalanceBefore,
          balanceAfter: linkedCardBalanceAfter,
        }
      : undefined;

  const nextCards = creditCardAdjustment
    ? cards.map((card) =>
        card.id === creditCardAdjustment.creditCardId
          ? {
              ...card,
              balance:
                creditCardAdjustment.balanceAfter ??
                getStoredMoneyValue(
                  parseMoney(card.balance) +
                    parseMoney(
                      creditCardAdjustment.amount,
                    ),
                ),
            }
          : card,
      )
    : cards;

  const followingOccurrence =
    getFollowingBillDueDate(
      bill.dueDate,
      occurrence.dueDate,
    );
  const nextOccurrenceDateKey = followingOccurrence
    ? formatLocalDateKey(followingOccurrence)
    : null;

  const nextPaidOccurrences = {
    ...paidOccurrences,
    [occurrence.occurrenceKey]: paidAt,
  };
  const nextActiveOccurrenceDates =
    nextOccurrenceDateKey
      ? {
          ...activeOccurrenceDates,
          [occurrence.billIdentity]:
            nextOccurrenceDateKey,
        }
      : activeOccurrenceDates;

  const paidAction: PaidBillAction = {
    occurrenceKey: occurrence.occurrenceKey,
    occurrenceDateKey: occurrence.dueDateKey,
    billIdentity: occurrence.billIdentity,
    billId: bill.id,
    billName: bill.name || "Bill",
    nextOccurrenceDateKey,
    paidAt,
    billAmount: bill.amount,
    paymentSource,
    creditCardAdjustment,
    checkingBalanceAdjustment,
  };

  const nextPaidActions =
    normalizeRecentPaidActions(
      [
        paidAction,
        ...paidActions.filter(
          (action) =>
            action.occurrenceKey !==
            paidAction.occurrenceKey,
        ),
      ],
      nextPaidOccurrences,
      preferences,
      new Date(paidAt),
      recentActionLimit,
    );

  return {
    didApply: true,
    summary: nextSummary,
    cards: nextCards,
    activeOccurrenceDates:
      nextActiveOccurrenceDates,
    paidOccurrences: nextPaidOccurrences,
    paidActions: nextPaidActions,
    paidAction,
  };
}

export function undoBillPayment<
  TSummary extends BillPaymentSummary,
>(
  input: UndoBillPaymentInput<TSummary>,
): UndoBillPaymentResult<TSummary> {
  const {
    action,
    summary,
    cards,
    activeOccurrenceDates,
    paidOccurrences,
    paidActions,
  } = input;
  const creditCardAdjustment =
    action.creditCardAdjustment;
  const checkingBalanceAdjustment =
    action.checkingBalanceAdjustment;

  if (
    !creditCardAdjustment &&
    !checkingBalanceAdjustment
  ) {
    return {
      didUndo: false,
      summary,
      cards,
      activeOccurrenceDates,
      paidOccurrences,
      paidActions,
      didReverseCardBalance: false,
      didReverseCheckingBalance: false,
      blockedReason: "missing-balance-history",
    };
  }

  let nextSummary = summary;
  let nextCards = cards;
  let didReverseCardBalance = false;
  let didReverseCheckingBalance = false;

  if (creditCardAdjustment) {
    const linkedCard = cards.find(
      (card) =>
        card.id === creditCardAdjustment.creditCardId,
    );

    if (!linkedCard) {
      return {
        didUndo: false,
        summary,
        cards,
        activeOccurrenceDates,
        paidOccurrences,
        paidActions,
        didReverseCardBalance: false,
        didReverseCheckingBalance: false,
        blockedReason: "card-not-found",
      };
    }

    const safeUndoBalance = getSafeCardUndoBalance(
      linkedCard,
      creditCardAdjustment,
    );

    if (safeUndoBalance === null) {
      return {
        didUndo: false,
        summary,
        cards,
        activeOccurrenceDates,
        paidOccurrences,
        paidActions,
        didReverseCardBalance: false,
        didReverseCheckingBalance: false,
        blockedReason: "card-balance-changed",
      };
    }

    didReverseCardBalance = true;
    nextCards = cards.map((card) =>
      card.id === creditCardAdjustment.creditCardId
        ? {
            ...card,
            balance: safeUndoBalance,
          }
        : card,
    );
  }

  if (checkingBalanceAdjustment) {
    const safeUndoBalance = getSafeCheckingUndoBalance(
      summary,
      checkingBalanceAdjustment,
    );

    if (safeUndoBalance === null) {
      return {
        didUndo: false,
        summary,
        cards,
        activeOccurrenceDates,
        paidOccurrences,
        paidActions,
        didReverseCardBalance: false,
        didReverseCheckingBalance: false,
        blockedReason: "checking-balance-changed",
      };
    }

    didReverseCheckingBalance = true;
    nextSummary = {
      ...summary,
      checkingBalance: safeUndoBalance,
    };
  }

  const nextPaidOccurrences = {
    ...paidOccurrences,
  };
  delete nextPaidOccurrences[action.occurrenceKey];

  return {
    didUndo: true,
    summary: nextSummary,
    cards: nextCards,
    activeOccurrenceDates: {
      ...activeOccurrenceDates,
      [action.billIdentity]:
        action.occurrenceDateKey,
    },
    paidOccurrences: nextPaidOccurrences,
    paidActions: paidActions.filter(
      (recentAction) =>
        recentAction.occurrenceKey !==
        action.occurrenceKey,
    ),
    didReverseCardBalance,
    didReverseCheckingBalance,
    blockedReason: null,
  };
}