"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import { PageShell, Pill } from "../components/Layout";
import { financeSummary, bills, creditCards } from "../data/bandData";
import {
  findBillForPaidAction,
  migrateBillOccurrenceState,
  parseMoney,
  resolveBillPaymentSource,
  type ManualBill,
  type ManualCreditCard,
  type PaidBillAction,
  type PaymentSource,
} from "../lib/financeData";
import {
  clearLegacyPaidAction,
  loadFinanceStorageState,
  saveActiveBillOccurrenceDates,
  saveBillPaymentStorageState,
  saveFinanceBills,
  saveFinanceCards,
  saveFinancePreferences,
  savePaidBillOccurrences,
  saveRecentPaidActions,
} from "../lib/financeStorage";
import {
  markBillOccurrencePaid,
  normalizeRecentPaidActions,
  undoBillPayment,
} from "../lib/financePayments";

import {
  defaultPayPeriodPreferences,
  getActiveBillOccurrence,
  getBillIdentity,
  getBillOccurrencePayPeriod,
  getDaysUntilDate,
  getPayPeriodLength,
  getPlanningAmount,
  parseLocalDate,
  type ActiveBillOccurrence,
  type PaidBillOccurrences,
  type PayPeriodPreferences,
} from "../lib/billStatus";

type ManualFinanceData = {
  checkingBalance: string;
  savingsBalance: string;
};

type ActiveBillOccurrenceDates = Record<string, string>;

type BillOccurrenceItem = {
  bill: ManualBill;
  occurrence: ActiveBillOccurrence;
};

const defaultManualData: ManualFinanceData = {
  checkingBalance: String(financeSummary.checkingBalance),
  savingsBalance: String(financeSummary.savingsBalance),
};

const defaultManualBills: ManualBill[] = bills.map((bill) => ({
  name: bill.name,
  amount: String(bill.amount),
  dueDate: bill.dueDate,
  status: bill.status,
  paymentMethod: bill.paymentMethod,
}));

const defaultManualCards: ManualCreditCard[] = creditCards.map((card) => ({
  name: card.name,
  balance: String(card.balance),
  limit: String(card.limit),
  minimumPayment: String(card.minimumPayment),
  dueDate: card.dueDate,
  status: card.status,
}));

function getPaidActionPaymentSource(
  action: PaidBillAction,
  currentBills: ManualBill[],
  cards: ManualCreditCard[],
): PaymentSource {
  const savedPaymentSource = action.paymentSource;

  if (savedPaymentSource?.type === "checking") {
    return savedPaymentSource;
  }

  if (
    savedPaymentSource?.type === "credit-card" &&
    cards.some(
      (card) => card.id === savedPaymentSource.creditCardId,
    )
  ) {
    return savedPaymentSource;
  }

  const matchingBill = findBillForPaidAction(
    action,
    currentBills,
  );

  return matchingBill
    ? resolveBillPaymentSource(matchingBill, cards)
    : { type: "checking" };
}

function getPaymentSourceLabel(
  paymentSource: PaymentSource,
  cards: ManualCreditCard[],
) {
  if (paymentSource.type === "checking") {
    return "Checking";
  }

  const linkedCard = cards.find(
    (card) => card.id === paymentSource.creditCardId,
  );

  return linkedCard?.name.trim() || "Credit card";
}

function getBillPaymentSourceLabel(
  bill: ManualBill,
  cards: ManualCreditCard[],
) {
  return getPaymentSourceLabel(
    resolveBillPaymentSource(bill, cards),
    cards,
  );
}

function getPaidActionPaymentSourceLabel(
  action: PaidBillAction,
  currentBills: ManualBill[],
  cards: ManualCreditCard[],
) {
  return getPaymentSourceLabel(
    getPaidActionPaymentSource(action, currentBills, cards),
    cards,
  );
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const savedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatMoney(amount: number) {
  return currencyFormatter.format(amount);
}

function formatSavedTime(value: string) {
  return value
    ? savedTimeFormatter.format(new Date(value))
    : "Not saved yet";
}

function formatPayday(value: string) {
  const payday = parseLocalDate(value);
  return payday ? shortDateFormatter.format(payday) : "Not set";
}

function formatBillDate(value: Date) {
  return shortDateFormatter.format(value);
}

function getTimeGreeting(referenceDate = new Date()) {
  const hour = referenceDate.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getPayPeriodProgress(
  currentPreferences: PayPeriodPreferences,
  referenceDate = new Date(),
) {
  const nextPayday = parseLocalDate(currentPreferences.nextPayday);

  if (!nextPayday) {
    return null;
  }

  const intervalDays = getPayPeriodLength(
    currentPreferences.payFrequency,
  );
  const periodEnd = new Date(
    nextPayday.getFullYear(),
    nextPayday.getMonth(),
    nextPayday.getDate(),
    12,
  );
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - intervalDays);

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
  );
  const totalDuration = periodEnd.getTime() - periodStart.getTime();
  const elapsedDuration = today.getTime() - periodStart.getTime();
  const rawProgress =
    totalDuration > 0 ? elapsedDuration / totalDuration : 0;
  const percentage = Math.round(
    Math.min(Math.max(rawProgress, 0), 1) * 100,
  );

  return {
    percentage,
    startDate: periodStart,
    endDate: periodEnd,
  };
}

function formatLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentPayPeriodPreferences(
  currentPreferences: PayPeriodPreferences,
  referenceDate = new Date(),
) {
  const savedPayday = parseLocalDate(currentPreferences.nextPayday);

  if (!savedPayday) {
    return {
      preferences: currentPreferences,
      didAdvance: false,
    };
  }

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
  );

  const nextPayday = new Date(
    savedPayday.getFullYear(),
    savedPayday.getMonth(),
    savedPayday.getDate(),
    12,
  );

  const intervalDays = getPayPeriodLength(
    currentPreferences.payFrequency,
  );

  let advancedPeriods = 0;

  while (nextPayday < today && advancedPeriods < 260) {
    nextPayday.setDate(nextPayday.getDate() + intervalDays);
    advancedPeriods += 1;
  }

  const nextPaydayValue = formatLocalDateKey(nextPayday);

  if (nextPaydayValue === currentPreferences.nextPayday) {
    return {
      preferences: currentPreferences,
      didAdvance: false,
    };
  }

  return {
    preferences: {
      ...currentPreferences,
      nextPayday: nextPaydayValue,
    },
    didAdvance: true,
  };
}

function sortBillOccurrenceItems(items: BillOccurrenceItem[]) {
  return [...items].sort(
    (firstItem, secondItem) =>
      firstItem.occurrence.dueDate.getTime() -
      secondItem.occurrence.dueDate.getTime(),
  );
}

function getBillOccurrenceItemsTotal(
  items: BillOccurrenceItem[],
  preferences: PayPeriodPreferences,
) {
  return items.reduce(
    (total, item) =>
      total +
      getPlanningAmount(
        item.bill.amount,
        preferences.roundBillsForPlanning,
      ),
    0,
  );
}

function getCheckingBillOccurrenceItemsTotal(
  items: BillOccurrenceItem[],
  preferences: PayPeriodPreferences,
  cards: ManualCreditCard[],
) {
  return items.reduce((total, item) => {
    const paymentSource = resolveBillPaymentSource(item.bill, cards);

    if (paymentSource.type !== "checking") {
      return total;
    }

    return (
      total +
      getPlanningAmount(
        item.bill.amount,
        preferences.roundBillsForPlanning,
      )
    );
  }, 0);
}

function getPaidActionPlanningAmount(
  action: PaidBillAction,
  currentBills: ManualBill[],
  preferences: PayPeriodPreferences,
) {
  const matchingBill = findBillForPaidAction(
    action,
    currentBills,
  );

  const amount = action.billAmount ?? matchingBill?.amount;

  return amount
    ? getPlanningAmount(
        amount,
        preferences.roundBillsForPlanning,
      )
    : 0;
}

function normalizeActiveBillOccurrenceDates(
  currentBills: ManualBill[],
  savedOccurrenceDates: ActiveBillOccurrenceDates,
  paidOccurrences: PaidBillOccurrences,
  referenceDate = new Date(),
) {
  const normalizedDates: ActiveBillOccurrenceDates = {};

  currentBills.forEach((bill) => {
    const billIdentity = getBillIdentity(bill);
    const occurrence = getActiveBillOccurrence(
      bill,
      savedOccurrenceDates[billIdentity],
      paidOccurrences,
      referenceDate,
    );

    if (occurrence) {
      normalizedDates[billIdentity] = occurrence.dueDateKey;
    }
  });

  return normalizedDates;
}

export default function DashboardPage() {
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);
  const [preferences, setPreferences] = useState<PayPeriodPreferences>(
    defaultPayPeriodPreferences,
  );
  const [lastSaved, setLastSaved] = useState("");
  const [paidBillOccurrences, setPaidBillOccurrences] =
    useState<PaidBillOccurrences>({});
  const [activeBillOccurrenceDates, setActiveBillOccurrenceDates] =
    useState<ActiveBillOccurrenceDates>({});
  const [recentPaidActions, setRecentPaidActions] =
    useState<PaidBillAction[]>([]);
  const [paidConfirmationAction, setPaidConfirmationAction] =
    useState<PaidBillAction | null>(null);
  const [showPaidConfirmation, setShowPaidConfirmation] = useState(false);
  const [undoBlockedMessage, setUndoBlockedMessage] = useState("");

  const paidConfirmationTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoBlockedTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingPaymentKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    function loadDashboardData() {
      const storedState = loadFinanceStorageState({
        summary: defaultManualData,
        bills: defaultManualBills,
        cards: defaultManualCards,
      });
      const savedCards = storedState.cards;
      const savedBills = storedState.bills;
      const savedPaidOccurrences =
        storedState.paidOccurrences;
      const savedActiveOccurrenceDates =
        storedState.activeOccurrenceDates;

      setManualData(storedState.summary);
      setManualBills(savedBills);
      setManualCards(savedCards);

      saveFinanceCards(savedCards);
      saveFinanceBills(savedBills);

      const rolloverResult =
        getCurrentPayPeriodPreferences(
          storedState.preferences,
        );

      if (rolloverResult.didAdvance) {
        saveFinancePreferences(
          rolloverResult.preferences,
        );
      }

      const savedRecentPaidActions =
        storedState.paidActions;
      const legacyLastPaidAction =
        storedState.legacyPaidAction;

      const migratedLegacyAction =
        legacyLastPaidAction?.occurrenceKey &&
        legacyLastPaidAction.occurrenceDateKey &&
        legacyLastPaidAction.billIdentity &&
        legacyLastPaidAction.billName &&
        savedPaidOccurrences[
          legacyLastPaidAction.occurrenceKey
        ]
          ? ({
              occurrenceKey:
                legacyLastPaidAction.occurrenceKey,
              occurrenceDateKey:
                legacyLastPaidAction.occurrenceDateKey,
              billIdentity:
                legacyLastPaidAction.billIdentity,
              billName:
                legacyLastPaidAction.billName,
              nextOccurrenceDateKey:
                legacyLastPaidAction
                  .nextOccurrenceDateKey ?? null,
              paidAt:
                legacyLastPaidAction.paidAt ||
                savedPaidOccurrences[
                  legacyLastPaidAction.occurrenceKey
                ],
            } satisfies PaidBillAction)
          : null;

      const migratedOccurrenceState =
        migrateBillOccurrenceState(
          savedBills,
          savedActiveOccurrenceDates,
          savedPaidOccurrences,
          migratedLegacyAction
            ? [
                migratedLegacyAction,
                ...savedRecentPaidActions,
              ]
            : savedRecentPaidActions,
        );

      const normalizedOccurrenceDates =
        normalizeActiveBillOccurrenceDates(
          savedBills,
          migratedOccurrenceState.activeOccurrenceDates,
          migratedOccurrenceState.paidOccurrences,
        );

      const normalizedRecentPaidActions =
        normalizeRecentPaidActions(
          migratedOccurrenceState.paidActions,
          migratedOccurrenceState.paidOccurrences,
          rolloverResult.preferences,
        );

      setPreferences(rolloverResult.preferences);
      setPaidBillOccurrences(
        migratedOccurrenceState.paidOccurrences,
      );
      setActiveBillOccurrenceDates(
        normalizedOccurrenceDates,
      );
      setRecentPaidActions(
        normalizedRecentPaidActions,
      );

      saveActiveBillOccurrenceDates(
        normalizedOccurrenceDates,
      );
      savePaidBillOccurrences(
        migratedOccurrenceState.paidOccurrences,
      );
      saveRecentPaidActions(
        normalizedRecentPaidActions,
      );
      clearLegacyPaidAction();

      setLastSaved(storedState.lastSaved);
    }

    loadDashboardData();

    function refreshDashboardData() {
      loadDashboardData();
    }

    window.addEventListener("focus", refreshDashboardData);
    window.addEventListener("pageshow", refreshDashboardData);

    return () => {
      window.removeEventListener("focus", refreshDashboardData);
      window.removeEventListener("pageshow", refreshDashboardData);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (paidConfirmationTimeout.current) {
        clearTimeout(paidConfirmationTimeout.current);
      }

      if (undoBlockedTimeout.current) {
        clearTimeout(undoBlockedTimeout.current);
      }
    };
  }, []);

  const checkingBalance = parseMoney(manualData.checkingBalance);
  const savingsBalance = parseMoney(manualData.savingsBalance);

  const today = new Date();
  const payday = parseLocalDate(preferences.nextPayday);
  const hasCurrentPayday =
    payday !== null &&
    payday.getTime() >=
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ).getTime();

  const payPeriodDays = getPayPeriodLength(preferences.payFrequency);


  function markBillPaid(item: BillOccurrenceItem) {
    const occurrenceKey =
      item.occurrence.occurrenceKey;

    if (
      paidBillOccurrences[occurrenceKey] ||
      processingPaymentKeys.current.has(
        occurrenceKey,
      )
    ) {
      return;
    }

    processingPaymentKeys.current.add(
      occurrenceKey,
    );

    const result = markBillOccurrencePaid({
      item,
      summary: manualData,
      cards: manualCards,
      activeOccurrenceDates:
        activeBillOccurrenceDates,
      paidOccurrences: paidBillOccurrences,
      paidActions: recentPaidActions,
      preferences,
    });

    if (!result.didApply || !result.paidAction) {
      processingPaymentKeys.current.delete(
        occurrenceKey,
      );
      return;
    }

    setManualData(result.summary);
    setManualCards(result.cards);
    setPaidBillOccurrences(
      result.paidOccurrences,
    );
    setActiveBillOccurrenceDates(
      result.activeOccurrenceDates,
    );
    setRecentPaidActions(result.paidActions);

    saveBillPaymentStorageState({
      summary: result.summary,
      cards: result.cards,
      activeOccurrenceDates:
        result.activeOccurrenceDates,
      paidOccurrences: result.paidOccurrences,
      paidActions: result.paidActions,
    });

    setPaidConfirmationAction(
      result.paidAction,
    );
    setShowPaidConfirmation(true);

    if (paidConfirmationTimeout.current) {
      clearTimeout(
        paidConfirmationTimeout.current,
      );
    }

    paidConfirmationTimeout.current = setTimeout(() => {
      setShowPaidConfirmation(false);
      paidConfirmationTimeout.current = null;
    }, 6500);
  }

  function undoPaidBill(action: PaidBillAction) {
    const result = undoBillPayment({
      action,
      summary: manualData,
      cards: manualCards,
      activeOccurrenceDates:
        activeBillOccurrenceDates,
      paidOccurrences: paidBillOccurrences,
      paidActions: recentPaidActions,
    });

    if (!result.didUndo) {
      const message =
        result.blockedReason === "card-not-found"
          ? "The linked credit card is no longer available. Nothing was changed."
          : result.blockedReason === "card-balance-changed"
            ? "The linked card balance changed after this payment. Nothing was changed."
            : result.blockedReason === "checking-balance-changed"
              ? "The checking balance changed after this payment. Nothing was changed."
              : "This older payment does not include enough balance history to undo safely.";

      setUndoBlockedMessage(message);
      setShowPaidConfirmation(false);

      if (paidConfirmationTimeout.current) {
        clearTimeout(paidConfirmationTimeout.current);
        paidConfirmationTimeout.current = null;
      }

      if (undoBlockedTimeout.current) {
        clearTimeout(undoBlockedTimeout.current);
      }

      undoBlockedTimeout.current = setTimeout(() => {
        setUndoBlockedMessage("");
        undoBlockedTimeout.current = null;
      }, 6000);

      return;
    }

    setUndoBlockedMessage("");

    if (undoBlockedTimeout.current) {
      clearTimeout(undoBlockedTimeout.current);
      undoBlockedTimeout.current = null;
    }

    setManualData(result.summary);
    setManualCards(result.cards);
    setPaidBillOccurrences(
      result.paidOccurrences,
    );
    setActiveBillOccurrenceDates(
      result.activeOccurrenceDates,
    );
    setRecentPaidActions(result.paidActions);

    saveBillPaymentStorageState({
      summary: result.summary,
      cards: result.cards,
      activeOccurrenceDates:
        result.activeOccurrenceDates,
      paidOccurrences: result.paidOccurrences,
      paidActions: result.paidActions,
    });

    processingPaymentKeys.current.delete(
      action.occurrenceKey,
    );

    if (
      paidConfirmationAction?.occurrenceKey ===
      action.occurrenceKey
    ) {
      setPaidConfirmationAction(null);
      setShowPaidConfirmation(false);

      if (paidConfirmationTimeout.current) {
        clearTimeout(
          paidConfirmationTimeout.current,
        );
        paidConfirmationTimeout.current = null;
      }
    }
  }

  const activeBillItems = manualBills
    .map((bill) => {
      const billIdentity = getBillIdentity(bill);
      const occurrence = getActiveBillOccurrence(
        bill,
        activeBillOccurrenceDates[billIdentity],
        paidBillOccurrences,
        today,
      );

      return occurrence ? { bill, occurrence } : null;
    })
    .filter(
      (item): item is BillOccurrenceItem => item !== null,
    );

  const overdueBillItems = sortBillOccurrenceItems(
    activeBillItems.filter(
      (item) => item.occurrence.status === "Overdue",
    ),
  );

  const upcomingBillItems = activeBillItems.filter(
    (item) => item.occurrence.status === "Upcoming",
  );

  const beforeNextPaydayBillItems = hasCurrentPayday
    ? sortBillOccurrenceItems(
        upcomingBillItems.filter(
          (item) =>
            getBillOccurrencePayPeriod(
              item.occurrence.dueDate,
              preferences,
              today,
            ) === "before-next-payday",
        ),
      )
    : sortBillOccurrenceItems(
        upcomingBillItems.filter((item) => {
          const daysUntilDue = getDaysUntilDate(
            item.occurrence.dueDate,
            today,
          );

          return daysUntilDue >= 0 && daysUntilDue <= payPeriodDays;
        }),
      );

  const overdueTotal = getBillOccurrenceItemsTotal(
    overdueBillItems,
    preferences,
  );
  const beforeNextPaydayTotal = getBillOccurrenceItemsTotal(
    beforeNextPaydayBillItems,
    preferences,
  );
  const unpaidCheckingBeforePaydayTotal =
    getCheckingBillOccurrenceItemsTotal(
      overdueBillItems,
      preferences,
      manualCards,
    ) +
    getCheckingBillOccurrenceItemsTotal(
      beforeNextPaydayBillItems,
      preferences,
      manualCards,
    );

  const plannedBeforePaydayTotal =
    unpaidCheckingBeforePaydayTotal;

  const cardBalanceTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.balance),
    0,
  );

  const sortedManualCards = [...manualCards].sort(
    (firstCard, secondCard) =>
      parseMoney(secondCard.balance) - parseMoney(firstCard.balance),
  );

  const cardsWithBalances = sortedManualCards.filter(
    (card) => parseMoney(card.balance) > 0,
  );
  const dashboardCardPreviews = cardsWithBalances.slice(0, 3);

  const mostRecentPaidAction = recentPaidActions[0] ?? null;
  const mostRecentPaidAmount = mostRecentPaidAction
    ? getPaidActionPlanningAmount(
        mostRecentPaidAction,
        manualBills,
        preferences,
      )
    : 0;

  const moneyLeftAfterBills =
    checkingBalance - plannedBeforePaydayTotal;

  const primaryBillsTitle = hasCurrentPayday
    ? "Before next payday"
    : "Next bills";

  const primaryEmptyTitle = hasCurrentPayday
    ? "Nothing due"
    : "No bills due soon";

  const primaryEmptyText = hasCurrentPayday
    ? `All caught up through ${formatPayday(
        preferences.nextPayday,
      )}.`
    : `You’re all caught up for the next ${payPeriodDays} days.`;

  const primaryBillsSummary =
    beforeNextPaydayBillItems.length === 0
      ? hasCurrentPayday
        ? `All caught up through ${formatPayday(
            preferences.nextPayday,
          )}`
        : `Nothing due in the next ${payPeriodDays} days`
      : beforeNextPaydayBillItems.length === 1
        ? hasCurrentPayday
          ? `One payment left before ${formatPayday(
              preferences.nextPayday,
            )}`
          : `One payment due in the next ${payPeriodDays} days`
        : hasCurrentPayday
          ? `${beforeNextPaydayBillItems.length} payments left before ${formatPayday(
              preferences.nextPayday,
            )}`
          : `${beforeNextPaydayBillItems.length} payments due in the next ${payPeriodDays} days`;

  const heroLabel = hasCurrentPayday
    ? "Left After Bills"
    : "Left After Upcoming Bills";
  const greeting = getTimeGreeting(today);
  const dashboardMessage =
    moneyLeftAfterBills >= 0
      ? "You’re in a good spot."
      : "Let’s get ahead of it.";
  const payPeriodProgress = hasCurrentPayday
    ? getPayPeriodProgress(preferences, today)
    : null;
  const heroPlanningWindow = hasCurrentPayday
    ? `through ${formatPayday(preferences.nextPayday)}`
    : `next ${payPeriodDays} days`;
  const heroPlanningSummary =
    plannedBeforePaydayTotal <= 0
      ? "All caught up"
      : `${formatMoney(plannedBeforePaydayTotal)} planned`;

  return (
    <PageShell>
      <TopNav />

      <header className="dashboard-intro -mt-1 mb-2 motion-card sm:-mt-2">
        <p className="text-sm text-stone-400">{greeting}</p>

        <h1 className="dashboard-intro-title mt-1 font-bold leading-[1.05] tracking-[-0.035em] text-[#f5f0e8]">
          {dashboardMessage}
        </h1>

        <p className="mt-1.5 text-sm text-stone-400">
          Here’s your money at a glance.
        </p>
      </header>

      <section
        className="liquid-glass-accent hero-glass-card dashboard-hero dashboard-hero-focused motion-card motion-card-delay-1 mb-2 rounded-[1.55rem]"
        style={{
          borderRadius: "1.55rem",
          clipPath: "inset(0 round 1.55rem)",
          WebkitClipPath: "inset(0 round 1.55rem)",
        }}
      >
        <div className="liquid-content dashboard-hero-content relative p-3.5 sm:p-4">
          <div
            className="dashboard-hero-glow dashboard-hero-glow-accent"
            aria-hidden="true"
          />

          <div
            className="dashboard-hero-glow dashboard-hero-glow-soft"
            aria-hidden="true"
          />

          <div
            className="dashboard-hero-reflection"
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5 pr-1">
              <span className="dashboard-hero-status-dot mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

              <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                {heroLabel}
              </p>
            </div>

            <div
              className="shrink-0"
              title={
                lastSaved
                  ? `Saved ${formatSavedTime(lastSaved)}`
                  : "Saved locally"
              }
            >
              <Pill>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="dashboard-hero-saved-check"
                    aria-hidden="true"
                  >
                    ✓
                  </span>

                  <span>Saved</span>
                </span>
              </Pill>
            </div>
          </div>

          <div className="dashboard-hero-main relative mt-1">
            <div className="dashboard-hero-balance-block min-w-0">
              <p className="dashboard-hero-balance break-words font-bold leading-none tracking-[-0.05em] text-[#f5f0e8]">
                {formatMoney(moneyLeftAfterBills)}
              </p>

              <div className="dashboard-hero-context mt-2">
                <strong>{heroPlanningSummary}</strong>

                <span
                  className="dashboard-hero-context-divider"
                  aria-hidden="true"
                >
                  ·
                </span>

                <span>{heroPlanningWindow}</span>
              </div>
            </div>

            <HeroPaydayVisual
              progress={payPeriodProgress}
              payday={preferences.nextPayday}
            />
          </div>

          <div className="dashboard-hero-stats relative mt-2">
            <HeroMetricCard
              label="Checking"
              value={formatMoney(checkingBalance)}
              icon={<CheckingHeroIcon />}
            />

            <HeroMetricCard
              label="Savings"
              value={formatMoney(savingsBalance)}
              icon={<SavingsHeroIcon />}
            />
          </div>
        </div>
      </section>

      <section className="dashboard-section-stack grid gap-2.5">
        <section
          className="dashboard-surface dashboard-bills-surface motion-card motion-card-delay-2 rounded-[1.2rem]"
          style={{
            borderRadius: "1.2rem",
            padding: "0.6rem",
          }}
        >
          <div
            className="dashboard-surface-glow"
            aria-hidden="true"
          />

          <div className="liquid-content">
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SectionTitle title={primaryBillsTitle} icon="calendar" />

                {beforeNextPaydayBillItems.length > 0 ? (
                  <p className="dashboard-bills-summary mt-1">
                    {primaryBillsSummary}
                  </p>
                ) : null}
              </div>

              <Link
                href="/bills"
                className="dashboard-section-link pressable shrink-0"
              >
                View all
              </Link>
            </div>

            {beforeNextPaydayBillItems.length > 0 ? (
              <div className="dashboard-payday-list">
                {beforeNextPaydayBillItems.map((item) => (
                  <PaydayBillRow
                    key={item.occurrence.occurrenceKey}
                    bill={item.bill}
                    occurrenceDate={item.occurrence.dueDate}
                    paymentSourceLabel={getBillPaymentSourceLabel(
                      item.bill,
                      manualCards,
                    )}
                    onPay={() => markBillPaid(item)}
                  />
                ))}
              </div>
            ) : (
              <BillsClearState
                title={primaryEmptyTitle}
                text={primaryEmptyText}
              />
            )}

            {overdueBillItems.length > 0 ? (
              <div className="mt-3 border-t border-[#f5f0e8]/8 pt-3">
                <div className="mb-2.5">
                  <SectionTitle title="Needs attention" />

                  <p className="mt-1 text-xs text-stone-500">
                    {overdueBillItems.length} overdue •{" "}
                    {formatMoney(overdueTotal)} still unpaid
                  </p>
                </div>

                <div className="dashboard-bill-list dashboard-bill-list-overdue">
                  {overdueBillItems.map((item) => (
                    <BillPreviewRow
                      key={item.occurrence.occurrenceKey}
                      bill={item.bill}
                      occurrenceDate={item.occurrence.dueDate}
                      paymentSourceLabel={getBillPaymentSourceLabel(
                        item.bill,
                        manualCards,
                      )}
                      overdue
                      onPay={() => markBillPaid(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </section>

        {mostRecentPaidAction ? (
          <section
            className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.2rem]"
            style={{
              borderRadius: "1.2rem",
              padding: "0.6rem",
            }}
          >
            <div
              className="dashboard-surface-glow"
              aria-hidden="true"
            />

            <div className="liquid-content">
              <div className="mb-1 flex items-center justify-between gap-3">
                <SectionTitle title="Recently paid" icon="receipt" />

                <Link
                  href="/bills"
                  className="dashboard-section-link pressable shrink-0"
                >
                  View all
                </Link>
              </div>

              <div key={mostRecentPaidAction.occurrenceKey}>
                <RecentPaymentRow
                  action={mostRecentPaidAction}
                  amount={mostRecentPaidAmount}
                  paymentSourceLabel={getPaidActionPaymentSourceLabel(
                    mostRecentPaidAction,
                    manualBills,
                    manualCards,
                  )}
                  onUndo={() => undoPaidBill(mostRecentPaidAction)}
                />
              </div>
            </div>
          </section>
        ) : null}

        <section
          id="dashboard-credit-cards"
          className="dashboard-surface dashboard-cards-surface motion-card motion-card-delay-3 scroll-mt-28 rounded-[1.2rem] p-2.5"
          style={{ borderRadius: "1.2rem" }}
        >
          <div
            className="dashboard-surface-glow"
            aria-hidden="true"
          />

          <div className="liquid-content">
            <div className="dashboard-card-section-header">
              <div className="min-w-0">
                <SectionTitle title="Credit cards" icon="card" />

                <p
                  className="dashboard-card-section-summary mt-0.5"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  {cardsWithBalances.length > 0
                    ? `${cardsWithBalances.length} balance${
                        cardsWithBalances.length === 1 ? "" : "s"
                      } · ${formatMoney(cardBalanceTotal)} total`
                    : manualCards.length > 0
                      ? "All cards paid off"
                      : "No cards tracked"}
                </p>
              </div>

              <Link
                href="/cards"
                className="dashboard-section-link pressable shrink-0"
              >
                View all
              </Link>
            </div>

            {cardsWithBalances.length > 0 ? (
              <div
                className="dashboard-card-overview"
                style={{ marginTop: "0.42rem" }}
              >
                <div className="dashboard-card-balance-list">
                  {dashboardCardPreviews.map((card, index) => {
                    const balance = parseMoney(card.balance);
                    const limit = parseMoney(card.limit);
                    const utilization =
                      limit > 0
                        ? Math.round((balance / limit) * 100)
                        : 0;

                    return (
                      <CardPreviewRow
                        key={`dashboard-card-${index}`}
                        name={card.name}
                        balance={balance}
                        utilization={utilization}
                      />
                    );
                  })}
                </div>


              </div>
            ) : manualCards.length > 0 ? (
              <div className="mt-2">
                <EmptyPreview
                  title="No card balances"
                  text="Your credit cards are currently paid off."
                />
              </div>
            ) : (
              <div className="mt-2">
                <EmptyPreview
                  title="No credit cards yet"
                  text="Add a card in the Editor to track utilization."
                />
              </div>
            )}
          </div>
        </section>
      </section>

      {undoBlockedMessage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
          <div
            role="alert"
            aria-live="assertive"
            className="dashboard-surface pointer-events-auto relative w-full max-w-[23rem] overflow-hidden rounded-[1.35rem] border border-[#f5f0e8]/10 p-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
          >
            <div
              className="dashboard-surface-glow"
              aria-hidden="true"
            />

            <div className="liquid-content">
              <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
                Undo paused
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-400">
                {undoBlockedMessage}
              </p>
            </div>
          </div>
        </div>
      ) : paidConfirmationAction && showPaidConfirmation ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="dashboard-surface pointer-events-auto relative w-full max-w-[23rem] overflow-hidden rounded-[1.35rem] border border-[#f5f0e8]/10 p-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
          >
            <div
              className="dashboard-surface-glow"
              aria-hidden="true"
            />

            <div className="liquid-content flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  {paidConfirmationAction.billName} paid
                </p>

                <p className="mt-0.5 truncate text-xs text-stone-400">
                  {getPaidActionPaymentSource(
                    paidConfirmationAction,
                    manualBills,
                    manualCards,
                  ).type === "credit-card"
                    ? `${formatMoney(
                        getPaidActionPlanningAmount(
                          paidConfirmationAction,
                          manualBills,
                          preferences,
                        ),
                      )} added to ${getPaidActionPaymentSourceLabel(
                        paidConfirmationAction,
                        manualBills,
                        manualCards,
                      )}.`
                    : `${formatMoney(
                        getPaidActionPlanningAmount(
                          paidConfirmationAction,
                          manualBills,
                          {
                            ...preferences,
                            roundBillsForPlanning: false,
                          },
                        ),
                      )} paid from Checking.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => undoPaidBill(paidConfirmationAction)}
                className="dashboard-pill-button pressable shrink-0 !px-3 !py-1"
              >
                <span className="text-xs">Undo</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon?: "calendar" | "card" | "receipt";
}) {
  return (
    <div className="dashboard-section-title">
      {icon ? (
        <span
          className={`dashboard-section-symbol dashboard-section-symbol-${icon}`}
          aria-hidden="true"
        >
          {icon === "calendar" ? (
            <CalendarSectionIcon />
          ) : icon === "receipt" ? (
            <ReceiptSectionIcon />
          ) : (
            <CreditCardSectionIcon />
          )}
        </span>
      ) : (
        <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />
      )}

      <h2 className="text-[1.02rem] font-semibold tracking-[-0.012em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function CalendarSectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 3.8v3.4M16 3.8v3.4M4 9.3h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.2 13h2.2M13.6 13h2.2M8.2 16.2h2.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiptSectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 4.5h11v15l-2.2-1.25-2.2 1.25-2.2-1.25-2.2 1.25-2.2-1.25V4.5Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.2h5.6M9.2 11.5h5.6M9.2 14.8h3.7"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CreditCardSectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 9.5h17M7.2 14h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeroPaydayVisual({
  progress,
  payday,
}: {
  progress: {
    percentage: number;
    startDate: Date;
    endDate: Date;
  } | null;
  payday: string;
}) {
  if (!progress) {
    return (
      <Link
        href="/account/preferences"
        className="dashboard-hero-payday-compact dashboard-hero-payday-compact-link pressable"
        aria-label="Set your next payday"
      >
        <div className="dashboard-hero-payday-compact-heading">
          <span>Pay period</span>
          <strong>Set payday</strong>
        </div>

        <span
          className="dashboard-hero-payday-compact-line"
          aria-hidden="true"
        >
          <span />
        </span>
      </Link>
    );
  }

  const daysUntilPayday = Math.max(
    getDaysUntilDate(progress.endDate),
    0,
  );

  const daysUntilPaydayLabel =
    daysUntilPayday === 0
      ? "Payday today"
      : `${daysUntilPayday} day${
          daysUntilPayday === 1 ? "" : "s"
        } left`;

  return (
    <div
      className="dashboard-hero-payday-compact"
      aria-label={`${progress.percentage}% through the current pay period. ${daysUntilPaydayLabel}. Next payday ${formatPayday(
        payday,
      )}.`}
    >
      <div className="dashboard-hero-payday-compact-heading">
        <span>Pay period</span>
        <strong>{daysUntilPaydayLabel}</strong>
      </div>

      <span
        className="dashboard-hero-payday-compact-line"
        aria-hidden="true"
      >
        <span
          style={{
            width: `${progress.percentage}%`,
          }}
        />
      </span>
    </div>
  );
}

function HeroMetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="dashboard-hero-stat">
      <div className="dashboard-hero-stat-layout">
        {icon ? (
          <span className="dashboard-hero-stat-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <div className="min-w-0">
          <p className="dashboard-hero-stat-label">{label}</p>

          <p className="dashboard-hero-stat-value">{value}</p>

          {detail ? (
            <p className="dashboard-hero-stat-detail">{detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CheckingHeroIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 10h17M7 14.2h3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SavingsHeroIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 11.2c0-3.1 2.8-5.5 6.3-5.5h1.8c3.8 0 6.9 2.7 6.9 6.1v2.8c0 1.7-1.1 3.2-2.7 3.9V21h-3v-2h-4.5v2h-3v-2.4A5.1 5.1 0 0 1 5 14.6v-3.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 8.5h4.2M20 11.5h1.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="8.5" cy="11.5" r=".8" fill="currentColor" />
    </svg>
  );
}

function PaydayBillRow({
  bill,
  occurrenceDate,
  paymentSourceLabel,
  onPay,
}: {
  bill: ManualBill;
  occurrenceDate: Date;
  paymentSourceLabel: string;
  onPay: () => void;
}) {
  const month = occurrenceDate
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = occurrenceDate.getDate();

  return (
    <div className="dashboard-payday-row">
      <div className="dashboard-payday-date" aria-hidden="true">
        <span>{month}</span>
        <strong>{day}</strong>
      </div>

      <div className="dashboard-payday-copy">
        <p className="dashboard-payday-name">
          {bill.name || "Untitled Bill"}
        </p>

        <p className="dashboard-payday-source">
          From {paymentSourceLabel}
        </p>
      </div>

      <div className="dashboard-payday-trailing">
        <p className="dashboard-payday-amount">
          {formatMoney(parseMoney(bill.amount))}
        </p>

        <button
          type="button"
          onClick={onPay}
          aria-label={`Mark ${bill.name || "bill"} paid`}
          className="dashboard-payday-pay pressable"
        >
          Pay
        </button>
      </div>
    </div>
  );
}

function BillPreviewRow({
  bill,
  occurrenceDate,
  paymentSourceLabel,
  muted = false,
  overdue = false,
  onPay,
}: {
  bill: ManualBill;
  occurrenceDate: Date;
  paymentSourceLabel: string;
  muted?: boolean;
  overdue?: boolean;
  onPay?: () => void;
}) {
  return (
    <div
      className={`dashboard-bill-list-row ${
        muted ? "dashboard-bill-list-row-muted" : ""
      } ${overdue ? "dashboard-bill-list-row-overdue" : ""}`}
    >
      <BillIcon name={bill.name} muted={muted} />

      <div className="dashboard-bill-copy">
        <p
          className={`dashboard-bill-name ${
            muted ? "dashboard-bill-name-muted" : ""
          }`}
        >
          {bill.name || "Untitled Bill"}
        </p>

        <p
          className={`dashboard-bill-due ${
            overdue ? "dashboard-bill-due-overdue" : ""
          }`}
        >
          <span className="dashboard-bill-due-date">
            {overdue
              ? `Overdue · ${formatBillDate(occurrenceDate)}`
              : `Due ${formatBillDate(occurrenceDate)}`}
          </span>

          <span
            className="dashboard-bill-meta-divider"
            aria-hidden="true"
          >
            ·
          </span>

          <span className="dashboard-bill-payment-source">
            {paymentSourceLabel}
          </span>
        </p>
      </div>

      <div className="dashboard-bill-trailing">
        <p
          className={`dashboard-bill-amount ${
            muted ? "dashboard-bill-amount-muted" : ""
          }`}
        >
          {formatMoney(parseMoney(bill.amount))}
        </p>

        {onPay ? (
          <button
            type="button"
            onClick={onPay}
            aria-label={`Mark ${bill.name || "bill"} paid`}
            className="dashboard-pill-button dashboard-pay-button pressable"
          >
            <span className="text-xs">Pay</span>
          </button>
        ) : (
          <p className="dashboard-bill-frequency">Monthly</p>
        )}
      </div>
    </div>
  );
}

function BillIcon({
  name,
  muted = false,
}: {
  name: string;
  muted?: boolean;
}) {
  const normalizedName = name.toLowerCase();
  const iconType = normalizedName.includes("spotify")
    ? "spotify"
    : normalizedName.includes("chatgpt") ||
        normalizedName.includes("openai")
      ? "ai"
      : normalizedName.includes("phone")
        ? "phone"
        : "bill";

  return (
    <span
      className={`dashboard-bill-icon dashboard-bill-icon-${iconType} ${
        muted ? "dashboard-bill-icon-muted" : ""
      }`}
      aria-hidden="true"
    >
      {iconType === "spotify" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5.4 8.8c4.6-1.3 9.1-.9 13.2 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.2 12c3.8-1 7.7-.7 11.2.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 15.1c3-.7 6-.5 8.8.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : iconType === "ai" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4.25 13.35 8l3.75 1.35-3.75 1.35L12 14.45l-1.35-3.75L6.9 9.35 10.65 8 12 4.25Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path
            d="m17.4 14.3.7 1.95 1.95.7-1.95.7-.7 1.95-.7-1.95-1.95-.7 1.95-.7.7-1.95Z"
            fill="currentColor"
          />
        </svg>
      ) : iconType === "phone" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M7.1 4.8 9.4 8a1.3 1.3 0 0 1-.15 1.7l-1.1 1.05a14.4 14.4 0 0 0 5.1 5.1l1.05-1.1a1.3 1.3 0 0 1 1.7-.15l3.2 2.3a1.3 1.3 0 0 1 .45 1.55l-.45 1.15a2.25 2.25 0 0 1-2.3 1.4C9.8 20.25 3.75 14.2 3 7.1a2.25 2.25 0 0 1 1.4-2.3l1.15-.45a1.3 1.3 0 0 1 1.55.45Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M7 4.5h10v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V4.5Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 8.25h5M9.5 11.5h5M9.5 14.75h3.25"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

function RecentPaymentRow({
  action,
  amount,
  paymentSourceLabel,
  onUndo,
}: {
  action: PaidBillAction;
  amount: number;
  paymentSourceLabel: string;
  onUndo: () => void;
}) {
  return (
    <div
      className="dashboard-last-payment-row"
      style={{
        paddingTop: "0.3rem",
        paddingBottom: "0.35rem",
      }}
    >
      <span
        className="dashboard-last-payment-check"
        style={{
          width: "2rem",
          height: "2rem",
        }}
        aria-hidden="true"
      >
        ✓
      </span>

      <div className="min-w-0">
        <p className="dashboard-last-payment-name">
          {action.billName}
        </p>

        <p className="dashboard-last-payment-date">
          Paid {formatPayday(action.occurrenceDateKey)} •{" "}
          {paymentSourceLabel}
        </p>
      </div>

      <div className="dashboard-last-payment-trailing">
        <p className="dashboard-last-payment-amount">
          {formatMoney(amount)}
        </p>

        <button
          type="button"
          onClick={onUndo}
          className="dashboard-last-payment-undo pressable"
        >
          Undo
        </button>
      </div>
    </div>
  );
}

function CardPreviewRow({
  name,
  balance,
  utilization,
}: {
  name: string;
  balance: number;
  utilization: number;
}) {
  return (
    <div
      className="dashboard-card-balance-row"
      style={{
        minHeight: "4.05rem",
        paddingTop: "0.6rem",
        paddingBottom: "0.58rem",
        paddingLeft: "0.08rem",
        paddingRight: "0.08rem",
      }}
    >
      <span
        className="dashboard-card-balance-icon"
        style={{
          width: "2.05rem",
          height: "2.05rem",
          borderRadius: "0.68rem",
        }}
        aria-hidden="true"
      >
        <CreditCardDashboardIcon />
      </span>

      <div className="dashboard-card-balance-copy">
        <div
          className="dashboard-card-balance-heading"
          style={{ alignItems: "center" }}
        >
          <div className="min-w-0">
            <p
              className="dashboard-card-balance-name"
              style={{
                fontSize: "0.94rem",
                fontWeight: 650,
                letterSpacing: "-0.012em",
              }}
            >
              {name || "Untitled Card"}
            </p>

            <p
              className="dashboard-card-balance-utilization"
              style={{
                marginTop: "0.2rem",
                fontSize: "0.69rem",
                color: "var(--theme-text-tertiary)",
              }}
            >
              {utilization}% used
            </p>
          </div>

          <p
            className="dashboard-card-balance-amount"
            style={{
              fontSize: "0.98rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {formatMoney(balance)}
          </p>
        </div>

        <div
          className="dashboard-card-balance-track"
          style={{
            width: "100%",
            maxWidth: "none",
            height: "0.22rem",
            marginTop: "0.48rem",
          }}
        >
          <div
            className="liquid-progress dashboard-card-balance-fill"
            style={{
              width: `${Math.min(utilization, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CreditCardDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 9.5h17M7.2 14h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BillsClearState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-1.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#c7ad75]/22 bg-[#c7ad75]/8 text-[#c7ad75]"
        aria-hidden="true"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path
            d="m5.5 12.5 4 4L18.5 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#f5f0e8]">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-stone-400">
          {text}
        </p>
      </div>
    </div>
  );
}

function EmptyPreview({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="dashboard-empty-preview !p-2.5">
      <p className="font-semibold text-[#f5f0e8]">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-stone-400">
        {text}
      </p>
    </div>
  );
}