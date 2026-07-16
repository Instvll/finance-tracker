import {
  getAdjustmentBalanceRevision,
  getCardBalanceRevision,
  getStoredMoneyValue,
  parseMoney,
  resolveBillPaymentSource,
  type ActiveBillOccurrenceDates,
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

export type MarkBillPaidInput = {
  item: BillOccurrencePaymentItem;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  preferences: PayPeriodPreferences;
  paidAt?: string;
  recentActionLimit?: number;
};

export type MarkBillPaidResult = {
  didApply: boolean;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  paidAction: PaidBillAction | null;
};

export type UndoBillPaymentInput = {
  action: PaidBillAction;
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
};

export type UndoBillPaymentResult = {
  cards: ManualCreditCard[];
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
  didReverseCardBalance: boolean;
};

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

export function markBillOccurrencePaid(
  input: MarkBillPaidInput,
): MarkBillPaidResult {
  const {
    item,
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
  const linkedCreditCard =
    paymentSource.type === "credit-card"
      ? cards.find(
          (card) =>
            card.id === paymentSource.creditCardId,
        )
      : undefined;
  const creditCardAdjustment = linkedCreditCard?.id
    ? {
        creditCardId: linkedCreditCard.id,
        amount: getStoredMoneyValue(billAmount),
        balanceRevision:
          getCardBalanceRevision(linkedCreditCard),
      }
    : undefined;

  const nextCards = creditCardAdjustment
    ? cards.map((card) =>
        card.id === creditCardAdjustment.creditCardId
          ? {
              ...card,
              balance: getStoredMoneyValue(
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
    cards: nextCards,
    activeOccurrenceDates:
      nextActiveOccurrenceDates,
    paidOccurrences: nextPaidOccurrences,
    paidActions: nextPaidActions,
    paidAction,
  };
}

export function undoBillPayment(
  input: UndoBillPaymentInput,
): UndoBillPaymentResult {
  const {
    action,
    cards,
    activeOccurrenceDates,
    paidOccurrences,
    paidActions,
  } = input;
  const creditCardAdjustment =
    action.creditCardAdjustment;
  let didReverseCardBalance = false;

  const nextCards = creditCardAdjustment
    ? cards.map((card) => {
        if (
          card.id !==
          creditCardAdjustment.creditCardId
        ) {
          return card;
        }

        const currentRevision =
          getCardBalanceRevision(card);
        const paymentRevision =
          getAdjustmentBalanceRevision(
            creditCardAdjustment,
          );

        if (currentRevision !== paymentRevision) {
          return card;
        }

        didReverseCardBalance = true;

        return {
          ...card,
          balance: getStoredMoneyValue(
            Math.max(
              0,
              parseMoney(card.balance) -
                parseMoney(
                  creditCardAdjustment.amount,
                ),
            ),
          ),
        };
      })
    : cards;

  const nextPaidOccurrences = {
    ...paidOccurrences,
  };
  delete nextPaidOccurrences[action.occurrenceKey];

  return {
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
  };
}