import {
  type ActiveBillOccurrenceDates,
  type ManualBill,
  type ManualCreditCard,
  type PaidBillAction,
} from "./financeData";
import {
  type PaidBillOccurrences,
  type PayPeriodPreferences,
} from "./billStatus";

export const currentFinanceStateSchemaVersion = 1 as const;

export type FinanceSummaryData = {
  checkingBalance: string;
  savingsBalance: string;
  monthlyIncome?: string;
  nextPayday?: string;
};

export type FinanceStatePayload = {
  summary: FinanceSummaryData;
  bills: ManualBill[];
  cards: ManualCreditCard[];
  preferences: PayPeriodPreferences;
  activeOccurrenceDates: ActiveBillOccurrenceDates;
  paidOccurrences: PaidBillOccurrences;
  paidActions: PaidBillAction[];
};

export type FinanceState = FinanceStatePayload & {
  schemaVersion: typeof currentFinanceStateSchemaVersion;
  revision: number;
  updatedAt: string;
};

export type CreateFinanceStateOptions = {
  revision?: number;
  updatedAt?: string;
};

export function createFinanceState(
  payload: FinanceStatePayload,
  options: CreateFinanceStateOptions = {},
): FinanceState {
  const requestedRevision = Number(options.revision);
  const revision =
    Number.isInteger(requestedRevision) &&
    requestedRevision >= 0
      ? requestedRevision
      : 0;

  return {
    schemaVersion: currentFinanceStateSchemaVersion,
    revision,
    updatedAt:
      options.updatedAt ?? new Date().toISOString(),
    summary: {
      ...payload.summary,
    },
    bills: payload.bills.map((bill) => ({
      ...bill,
      paymentSource: bill.paymentSource
        ? { ...bill.paymentSource }
        : undefined,
    })),
    cards: payload.cards.map((card) => ({
      ...card,
    })),
    preferences: {
      ...payload.preferences,
    },
    activeOccurrenceDates: {
      ...payload.activeOccurrenceDates,
    },
    paidOccurrences: {
      ...payload.paidOccurrences,
    },
    paidActions: payload.paidActions.map((action) => ({
      ...action,
      paymentSource: action.paymentSource
        ? { ...action.paymentSource }
        : undefined,
      creditCardAdjustment:
        action.creditCardAdjustment
          ? { ...action.creditCardAdjustment }
          : undefined,
    })),
  };
}

export function createNextFinanceState(
  currentState: FinanceState,
  payload: FinanceStatePayload,
): FinanceState {
  return createFinanceState(payload, {
    revision: currentState.revision + 1,
  });
}

export function isFinanceState(
  value: unknown,
): value is FinanceState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FinanceState>;

  return (
    candidate.schemaVersion ===
      currentFinanceStateSchemaVersion &&
    Number.isInteger(candidate.revision) &&
    Number(candidate.revision) >= 0 &&
    typeof candidate.updatedAt === "string" &&
    Boolean(candidate.summary) &&
    typeof candidate.summary === "object" &&
    Array.isArray(candidate.bills) &&
    Array.isArray(candidate.cards) &&
    Boolean(candidate.preferences) &&
    typeof candidate.preferences === "object" &&
    Boolean(candidate.activeOccurrenceDates) &&
    typeof candidate.activeOccurrenceDates === "object" &&
    Boolean(candidate.paidOccurrences) &&
    typeof candidate.paidOccurrences === "object" &&
    Array.isArray(candidate.paidActions)
  );
}