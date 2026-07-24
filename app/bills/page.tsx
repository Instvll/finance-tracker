"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { financeSummary, bills, creditCards } from "../../data/bandData";
import {
  findBillForPaidAction,
  migrateBillOccurrenceState,
  parseMoney,
  resolveBillPaymentSource,
  type ManualBill,
  type ManualCreditCard,
  type PaidBillAction,
  type PaymentSource,
} from "../../lib/financeData";
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
} from "../../lib/financeStorage";
import {
  markBillOccurrencePaid,
  normalizeRecentPaidActions,
  undoBillPayment,
} from "../../lib/financePayments";

import {
  defaultPayPeriodPreferences,
  getActiveBillOccurrence,
  getBillIdentity,
  getBillOccurrencePayPeriod,
  getDaysUntilDate,
  getFollowingBillDueDate,
  getPayPeriodLength,
  getPlanningAmount,
  isDateInCurrentPayPeriod,
  parseLocalDate,
  type ActiveBillOccurrence,
  type PaidBillOccurrences,
  type PayPeriodPreferences,
} from "../../lib/billStatus";

type ManualFinanceData = {
  checkingBalance: string;
  savingsBalance: string;
};

type ActiveBillOccurrenceDates = Record<string, string>;

type BillOccurrenceItem = {
  bill: ManualBill;
  occurrence: ActiveBillOccurrence;
};

const billsEditSnapshotKey =
  "finance-tracker-bills-edit-snapshot";

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

const defaultManualCards: ManualCreditCard[] =
  creditCards.map((card) => ({
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


function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPayday(value: string) {
  const payday = parseLocalDate(value);

  if (!payday) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(payday);
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

function formatBillDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
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

function getBillsSnapshot(currentBills: ManualBill[]) {
  return JSON.stringify(currentBills);
}

export default function BillsPage() {
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(
      defaultManualCards,
    );
  const [preferences, setPreferences] = useState<PayPeriodPreferences>(
    defaultPayPeriodPreferences,
  );
  const [paidBillOccurrences, setPaidBillOccurrences] =
    useState<PaidBillOccurrences>({});
  const [activeBillOccurrenceDates, setActiveBillOccurrenceDates] =
    useState<ActiveBillOccurrenceDates>({});
  const [recentPaidActions, setRecentPaidActions] =
    useState<PaidBillAction[]>([]);
  const [paidConfirmationAction, setPaidConfirmationAction] =
    useState<PaidBillAction | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showPaidConfirmation, setShowPaidConfirmation] = useState(false);
  const [showRecentPayments, setShowRecentPayments] = useState(false);
  const [undoBlockedMessage, setUndoBlockedMessage] = useState("");

  const paidConfirmationTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
  const undoBlockedTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
  const processingPaymentKeys =
    useRef<Set<string>>(new Set());

  useEffect(() => {
    function loadBillsData(checkEditSnapshot: boolean) {
      const storedState =
        loadFinanceStorageState({
          summary: defaultManualData,
          bills: defaultManualBills,
          cards: defaultManualCards,
        });
      const savedBills = storedState.bills;
      const savedCards = storedState.cards;

      saveFinanceBills(savedBills);
      saveFinanceCards(savedCards);

      const rolloverResult =
        getCurrentPayPeriodPreferences(
          storedState.preferences,
        );

      if (rolloverResult.didAdvance) {
        saveFinancePreferences(
          rolloverResult.preferences,
        );
      }

      const savedPaidOccurrences =
        storedState.paidOccurrences;
      const savedActiveOccurrenceDates =
        storedState.activeOccurrenceDates;
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
          new Date(),
          8,
        );

      setManualData(storedState.summary);
      setManualBills(savedBills);
      setManualCards(savedCards);
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
      setShowRecentPayments(false);

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

      if (!checkEditSnapshot) {
        return;
      }

      const previousBillsSnapshot =
        window.sessionStorage.getItem(billsEditSnapshotKey);

      if (
        previousBillsSnapshot &&
        previousBillsSnapshot !== getBillsSnapshot(savedBills)
      ) {
        setShowSaveConfirmation(true);
      }

      window.sessionStorage.removeItem(billsEditSnapshotKey);
    }

    loadBillsData(true);

    function refreshBillsData() {
      loadBillsData(false);
    }

    window.addEventListener("focus", refreshBillsData);
    window.addEventListener("pageshow", refreshBillsData);

    return () => {
      window.removeEventListener("focus", refreshBillsData);
      window.removeEventListener("pageshow", refreshBillsData);
    };
  }, []);

  useEffect(() => {
    if (!showSaveConfirmation) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 3800);

    return () => window.clearTimeout(timeout);
  }, [showSaveConfirmation]);

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

  function rememberBillsEditSnapshot() {
    window.sessionStorage.setItem(
      billsEditSnapshotKey,
      getBillsSnapshot(manualBills),
    );
  }

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
      recentActionLimit: 8,
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
    }

    if (paidConfirmationTimeout.current) {
      clearTimeout(
        paidConfirmationTimeout.current,
      );
      paidConfirmationTimeout.current = null;
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

  const nextPayPeriodBillItems = hasCurrentPayday
    ? sortBillOccurrenceItems(
        upcomingBillItems.filter(
          (item) =>
            getBillOccurrencePayPeriod(
              item.occurrence.dueDate,
              preferences,
              today,
            ) === "next-pay-period",
        ),
      )
    : [];

  const laterBillItems = hasCurrentPayday
    ? sortBillOccurrenceItems(
        upcomingBillItems.filter((item) => {
          const period = getBillOccurrencePayPeriod(
            item.occurrence.dueDate,
            preferences,
            today,
          );

          return period === "later" || period === "unscheduled";
        }),
      )
    : sortBillOccurrenceItems(
        upcomingBillItems.filter(
          (item) =>
            getDaysUntilDate(item.occurrence.dueDate, today) >
            payPeriodDays,
        ),
      );

  const overdueTotal = getBillOccurrenceItemsTotal(
    overdueBillItems,
    preferences,
  );
  const beforeNextPaydayTotal = getBillOccurrenceItemsTotal(
    beforeNextPaydayBillItems,
    preferences,
  );
  const nextPayPeriodTotal = getBillOccurrenceItemsTotal(
    nextPayPeriodBillItems,
    preferences,
  );
  const laterBillsTotal = getBillOccurrenceItemsTotal(
    laterBillItems,
    preferences,
  );
  const dueBeforePaydayTotal =
    overdueTotal + beforeNextPaydayTotal;
  const dueBeforePaydayCount =
    overdueBillItems.length + beforeNextPaydayBillItems.length;
  const monthlyTotal = manualBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0,
  );

  const primaryTitle = hasCurrentPayday
    ? "Due this pay period"
    : "Next bills";
  const heroTitle = hasCurrentPayday
    ? "Due before next payday"
    : overdueBillItems.length > 0
      ? "Bills needing attention"
      : "Upcoming bills";
  const primaryEmptyTitle = hasCurrentPayday
    ? "Nothing due"
    : "No bills due soon";
  const primaryEmptyText = hasCurrentPayday
    ? `All caught up through ${formatPayday(preferences.nextPayday)}.`
    : `You have no unpaid bills due within the next ${payPeriodDays} days.`;

  const heroSummary =
    dueBeforePaydayCount === 0
      ? "All caught up"
      : overdueBillItems.length > 0
        ? `${overdueBillItems.length} overdue · ${
            beforeNextPaydayBillItems.length
          } upcoming`
        : `${dueBeforePaydayCount} payment${
            dueBeforePaydayCount === 1 ? "" : "s"
          } remaining`;

  const heroCutoffLabel = hasCurrentPayday
    ? formatPayday(preferences.nextPayday)
    : `Next ${payPeriodDays} days`;

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="dashboard-intro -mt-1 mb-2 motion-card sm:-mt-2">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-4xl">
            Bills
          </h1>

          <p className="mt-1 text-sm leading-6 text-stone-400">
            See what’s due, what’s next, and what you’ve paid.
          </p>
        </header>

        <section
          className="liquid-glass-accent hero-glass-card dashboard-hero dashboard-hero-focused bills-hero motion-card motion-card-delay-1 mb-2 rounded-[1.55rem]"
          style={{
            borderRadius: "1.55rem",
            clipPath: "inset(0 round 1.55rem)",
            WebkitClipPath: "inset(0 round 1.55rem)",
          }}
        >
          <div className="liquid-content dashboard-hero-content relative p-3 sm:p-3.5">
            <div
              className="dashboard-hero-glow dashboard-hero-glow-accent"
              aria-hidden="true"
            />
            <div
              className="dashboard-hero-glow dashboard-hero-glow-soft"
              aria-hidden="true"
            />
            <div className="dashboard-hero-reflection" aria-hidden="true" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5 pr-1">
                <span className="dashboard-hero-status-dot mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                  {heroTitle}
                </p>
              </div>

              <div className="shrink-0">
                <Pill>{heroCutoffLabel}</Pill>
              </div>
            </div>

            <div className="relative mt-2.5">
              <p className="dashboard-hero-balance break-words text-[3rem] font-bold leading-none tracking-[-0.045em] text-[#f5f0e8] sm:text-6xl">
                {formatMoney(dueBeforePaydayTotal)}
              </p>

              <p className="bills-hero-summary mt-2">
                {heroSummary}
              </p>
            </div>

            <div className="bills-hero-metrics relative mt-3">
              <BillsHeroMetric
                label={
                  hasCurrentPayday
                    ? "Next Pay Period"
                    : "Planning Window"
                }
                value={
                  hasCurrentPayday
                    ? formatMoney(nextPayPeriodTotal)
                    : `${payPeriodDays} days`
                }
              />

              <BillsHeroMetric
                label="Monthly Total"
                value={formatMoney(monthlyTotal)}
              />
            </div>
          </div>
        </section>

        {showSaveConfirmation ? (
          <SaveConfirmation onDismiss={() => setShowSaveConfirmation(false)} />
        ) : null}

        <section className="grid gap-2">
          <CurrentPayPeriodCard
            title={primaryTitle}
            description={
              beforeNextPaydayBillItems.length > 0
                ? `${beforeNextPaydayBillItems.length} bill${
                    beforeNextPaydayBillItems.length === 1 ? "" : "s"
                  } · ${formatMoney(beforeNextPaydayTotal)} remaining`
                : ""
            }
            bills={beforeNextPaydayBillItems}
            overdueBills={overdueBillItems}
            overdueTotal={overdueTotal}
            onPayBill={markBillPaid}
            emptyTitle={primaryEmptyTitle}
            emptyText={primaryEmptyText}
            action={
              <Link
                href="/manual?tab=bills"
                onClick={rememberBillsEditSnapshot}
                className="dashboard-pill-button pressable shrink-0 !px-2.5 !py-0.5"
              >
                Edit
              </Link>
            }
          />

          {recentPaidActions.length > 0 ? (
            <RecentPaymentsCard
              actions={recentPaidActions}
              bills={manualBills}
              cards={manualCards}
              expanded={showRecentPayments}
              onToggle={() =>
                setShowRecentPayments((current) => !current)
              }
              onUndo={undoPaidBill}
            />
          ) : null}

          {hasCurrentPayday ? (
            <BillSection
              title="Next pay period"
              description={`${nextPayPeriodBillItems.length} bill${
                nextPayPeriodBillItems.length === 1 ? "" : "s"
              } · ${formatMoney(nextPayPeriodTotal)} starting ${formatPayday(
                preferences.nextPayday,
              )}`}
              bills={nextPayPeriodBillItems}
              onPayBill={markBillPaid}
              emptyTitle="No bills in the next pay period"
              emptyText="Nothing is currently scheduled in this pay period."
              delayClass="motion-card-delay-4"
              forecast
              muted
            />
          ) : null}

          <BillSection
            title={hasCurrentPayday ? "Later bills" : "Other bills"}
            description={
              laterBillItems.length > 0
                ? `${laterBillItems.length} bill${
                    laterBillItems.length === 1 ? "" : "s"
                  } · ${formatMoney(laterBillsTotal)} scheduled later`
                : hasCurrentPayday
                  ? "Nothing scheduled after the next pay period"
                  : `Nothing outside the current ${payPeriodDays}-day window`
            }
            bills={laterBillItems}
            emptyTitle={hasCurrentPayday ? "No later bills" : "No other bills"}
            emptyText={
              hasCurrentPayday
                ? "You’re clear beyond the next pay period."
                : `You’re clear outside the current ${payPeriodDays}-day planning window.`
            }
            later
            muted
          />
        </section>
      </div>

      {undoBlockedMessage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
          <div
            role="alert"
            aria-live="assertive"
            className="dashboard-surface pointer-events-auto relative w-full max-w-[23rem] overflow-hidden rounded-[1.35rem] border border-[#f5f0e8]/10 p-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
          >
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <p className="text-sm font-semibold text-[#f5f0e8]">
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
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  Bill marked paid
                </p>
                <p className="mt-0.5 truncate text-xs text-stone-400">
                  {paidConfirmationAction.nextOccurrenceDateKey
                    ? `Next due ${formatPayday(
                        paidConfirmationAction.nextOccurrenceDateKey,
                      )}.`
                    : `${paidConfirmationAction.billName} payment recorded.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  undoPaidBill(paidConfirmationAction)
                }
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

function BillSection({
  title,
  description,
  bills,
  onPayBill,
  emptyTitle,
  emptyText,
  action,
  muted = false,
  attention = false,
  forecast = false,
  later = false,
  delayClass = "",
}: {
  title: string;
  description: string;
  bills: BillOccurrenceItem[];
  onPayBill?: (item: BillOccurrenceItem) => void;
  emptyTitle: string;
  emptyText: string;
  action?: React.ReactNode;
  muted?: boolean;
  attention?: boolean;
  forecast?: boolean;
  later?: boolean;
  delayClass?: string;
}) {
  return (
    <section
      className={`dashboard-surface dashboard-bills-surface motion-card ${delayClass} ${
        forecast
          ? "bills-next-section"
          : later
            ? "bills-later-section"
            : ""
      } rounded-[1.2rem]`}
      style={{
        borderRadius: "1.2rem",
        padding: "0.6rem",
      }}
    >
      <div className="dashboard-surface-glow" aria-hidden="true" />

      <div className="liquid-content">
        <div className="mb-1.5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionTitle
              title={title}
              icon={
                forecast
                  ? "calendar-forward"
                  : later
                    ? "clock"
                    : undefined
              }
            />

            {description ? (
              <p
                className={
                  forecast
                    ? "bills-next-summary mt-1"
                    : later
                      ? "bills-later-summary mt-1"
                      : "mt-1 text-sm text-stone-400"
                }
              >
                {description}
              </p>
            ) : null}
          </div>

          {action}
        </div>

        {bills.length > 0 ? (
          forecast ? (
            <div className="bills-next-list">
              {bills.map((item) => (
                <NextPayPeriodBillRow
                  key={item.occurrence.occurrenceKey}
                  bill={item.bill}
                  occurrenceDate={item.occurrence.dueDate}
                  onPay={
                    onPayBill
                      ? () => onPayBill(item)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : later ? (
            <div className="bills-later-list">
              {bills.map((item) => (
                <LaterBillRow
                  key={item.occurrence.occurrenceKey}
                  bill={item.bill}
                  occurrenceDate={item.occurrence.dueDate}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-1">
              {bills.map((item) => (
                <BillRow
                  key={item.occurrence.occurrenceKey}
                  bill={item.bill}
                  occurrenceDate={item.occurrence.dueDate}
                  muted={muted}
                  overdue={attention}
                  onPay={onPayBill ? () => onPayBill(item) : undefined}
                />
              ))}
            </div>
          )
        ) : later ? (
          <LaterBillsEmptyState title={emptyTitle} text={emptyText} />
        ) : (
          <BillsClearState title={emptyTitle} text={emptyText} />
        )}
      </div>
    </section>
  );
}

function CurrentPayPeriodCard({
  title,
  description,
  bills,
  overdueBills,
  overdueTotal,
  onPayBill,
  emptyTitle,
  emptyText,
  action,
}: {
  title: string;
  description: string;
  bills: BillOccurrenceItem[];
  overdueBills: BillOccurrenceItem[];
  overdueTotal: number;
  onPayBill: (item: BillOccurrenceItem) => void;
  emptyTitle: string;
  emptyText: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className="dashboard-surface dashboard-bills-surface motion-card motion-card-delay-2 rounded-[1.2rem]"
      style={{
        borderRadius: "1.2rem",
        padding: "0.6rem",
      }}
    >
      <div className="dashboard-surface-glow" aria-hidden="true" />

      <div className="liquid-content">
        <div className="mb-1 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionTitle title={title} icon="calendar" />

            {description ? (
              <p className="bills-current-summary mt-1">{description}</p>
            ) : null}
          </div>

          {action}
        </div>

        {bills.length > 0 ? (
          <div className="dashboard-bill-list dashboard-bill-list-primary bills-current-list">
            {bills.map((item) => (
              <CurrentBillRow
                key={item.occurrence.occurrenceKey}
                bill={item.bill}
                occurrenceDate={item.occurrence.dueDate}
                onPay={() => onPayBill(item)}
              />
            ))}
          </div>
        ) : (
          <BillsClearState
            title={emptyTitle}
            text={emptyText}
            compact
          />
        )}

        {overdueBills.length > 0 ? (
          <div className="mt-2.5 border-t border-[#f5f0e8]/8 pt-2.5">
            <div className="mb-2">
              <SectionTitle title="Needs attention" icon="warning" />

              <p className="mt-1 text-sm text-stone-400">
                {overdueBills.length} overdue • {formatMoney(overdueTotal)} still unpaid
              </p>
            </div>

            <div className="grid gap-1">
              {overdueBills.map((item) => (
                <BillRow
                  key={item.occurrence.occurrenceKey}
                  bill={item.bill}
                  occurrenceDate={item.occurrence.dueDate}
                  overdue
                  onPay={() => onPayBill(item)}
                />
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}

function RecentPaymentsCard({
  actions,
  bills,
  cards,
  expanded,
  onToggle,
  onUndo,
}: {
  actions: PaidBillAction[];
  bills: ManualBill[];
  cards: ManualCreditCard[];
  expanded: boolean;
  onToggle: () => void;
  onUndo: (action: PaidBillAction) => void;
}) {
  const visibleActions = expanded ? actions : actions.slice(0, 1);

  return (
    <section
      className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.2rem]"
      style={{
        borderRadius: "1.2rem",
        padding: "0.6rem",
      }}
    >
      <div className="dashboard-surface-glow" aria-hidden="true" />

      <div className="liquid-content">
        <div className="mb-1 flex items-center justify-between gap-3">
          <SectionTitle title="Recently paid" icon="receipt" />

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls="recent-payments-content"
            className="dashboard-section-link pressable shrink-0"
          >
            {expanded ? "Show less" : "View all"}
          </button>
        </div>

        <div id="recent-payments-content">
          {visibleActions.map((action, index) => {
            const amount =
              action.billAmount !== undefined
                ? formatMoney(parseMoney(action.billAmount))
                : "";
            const paymentSourceLabel =
              getPaidActionPaymentSourceLabel(
                action,
                bills,
                cards,
              );

            return (
              <div
                key={action.occurrenceKey}
                style={{
                  borderTop:
                    index > 0
                      ? "1px solid color-mix(in srgb, var(--theme-text) 7%, transparent)"
                      : undefined,
                }}
              >
                <div
                  className="dashboard-last-payment-row"
                  style={{
                    paddingTop:
                      index > 0 ? "0.55rem" : "0.3rem",
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
                    {amount ? (
                      <p className="dashboard-last-payment-amount">
                        {amount}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onUndo(action)}
                      className="dashboard-last-payment-undo pressable"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BillsClearState({
  title,
  text,
  compact = false,
}: {
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-1 ${
        compact ? "py-0.5" : "py-1.5"
      }`}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#c7ad75]/22 bg-[#c7ad75]/8 text-[#c7ad75]"
        aria-hidden="true"
      >
        ✓
      </span>

      <div className="min-w-0">
        <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
          {title}
        </p>

        <p
          className={`text-sm leading-5 text-stone-400 ${
            compact ? "mt-0.5" : "mt-1"
          }`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

type SectionTitleIcon =
  | "calendar"
  | "calendar-forward"
  | "receipt"
  | "clock"
  | "warning";

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon?: SectionTitleIcon;
}) {
  return (
    <div className="dashboard-section-title">
      {icon ? (
        <span
          className={`dashboard-section-symbol dashboard-section-symbol-${icon}`}
          aria-hidden="true"
        >
          <SectionTitleIconGraphic icon={icon} />
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

function SectionTitleIconGraphic({
  icon,
}: {
  icon: SectionTitleIcon;
}) {
  if (icon === "calendar") {
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

  if (icon === "calendar-forward") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="3.8"
          y="5.5"
          width="14.4"
          height="14"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.65"
        />
        <path
          d="M7.4 3.8v3.4M14.6 3.8v3.4M3.8 9.3h14.4"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
        <path
          d="M13.2 14.6h7M17.7 11.8l2.8 2.8-2.8 2.8"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "receipt") {
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

  if (icon === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M12 7.8v4.7l3.2 1.9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4.3 20 18H4L12 4.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4.2M12 16.2h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BillsHeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bills-hero-metric">
      <p className="bills-hero-metric-label">
        {label}
      </p>

      <p className="bills-hero-metric-value">
        {value}
      </p>
    </div>
  );
}

function SaveConfirmation({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="dashboard-surface motion-card motion-card-delay-2 mb-2 rounded-[1.35rem] p-2.5"
    >
      <div className="dashboard-surface-glow" aria-hidden="true" />

      <div className="liquid-content flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c7ad75]/25 bg-[#11100d]/25 text-sm font-bold text-[#c7ad75]">
            ✓
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#f5f0e8]">
              Bills updated
            </p>
            <p className="mt-0.5 text-xs leading-5 text-stone-400">
              Your latest changes are reflected here.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="dashboard-pill-button pressable shrink-0 !px-2.5 !py-0.5"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function LaterBillRow({
  bill,
  occurrenceDate,
}: {
  bill: ManualBill;
  occurrenceDate: Date;
}) {
  return (
    <div className="bills-later-row">
      <BillIcon name={bill.name || ""} />

      <div className="dashboard-bill-copy">
        <p className="bills-later-name">
          {bill.name || "Untitled Bill"}
        </p>

        <p className="bills-later-meta">
          <span>Due {formatBillDate(occurrenceDate)}</span>

          {bill.paymentMethod ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="bills-later-source">
                {bill.paymentMethod}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="bills-later-trailing">
        <p className="bills-later-amount">
          {formatMoney(parseMoney(bill.amount))}
        </p>
      </div>
    </div>
  );
}

function LaterBillsEmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="bills-later-empty">
      <span className="bills-later-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="5.5"
            width="16"
            height="14"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 3.8v3.4M16 3.8v3.4M4 9.3h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="m8.4 14.3 2.1 2.1 5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="min-w-0">
        <p className="bills-later-empty-title">{title}</p>
        <p className="bills-later-empty-text">{text}</p>
      </div>
    </div>
  );
}

function NextPayPeriodBillRow({
  bill,
  occurrenceDate,
  onPay,
}: {
  bill: ManualBill;
  occurrenceDate: Date;
  onPay?: () => void;
}) {
  return (
    <div className="bills-next-row">
      <BillIcon name={bill.name || ""} />

      <div className="dashboard-bill-copy">
        <p className="bills-next-name">
          {bill.name || "Untitled Bill"}
        </p>

        <p className="bills-next-meta">
          <span>Due {formatBillDate(occurrenceDate)}</span>

          {bill.paymentMethod ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="bills-next-source">
                {bill.paymentMethod}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="bills-next-trailing">
        <p className="bills-next-amount">
          {formatMoney(parseMoney(bill.amount))}
        </p>

        {onPay ? (
          <button
            type="button"
            onClick={onPay}
            aria-label={`Mark ${bill.name || "bill"} paid`}
            className="bills-next-pay pressable"
          >
            Pay
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CurrentBillRow({
  bill,
  occurrenceDate,
  onPay,
}: {
  bill: ManualBill;
  occurrenceDate: Date;
  onPay: () => void;
}) {
  return (
    <div className="dashboard-bill-list-row bills-current-row">
      <BillIcon name={bill.name || ""} />

      <div className="dashboard-bill-copy">
        <p className="dashboard-bill-name">
          {bill.name || "Untitled Bill"}
        </p>

        <p className="dashboard-bill-due">
          <span className="dashboard-bill-due-date">
            Due {formatBillDate(occurrenceDate)}
          </span>

          {bill.paymentMethod ? (
            <>
              <span
                className="dashboard-bill-meta-divider"
                aria-hidden="true"
              >
                ·
              </span>

              <span className="dashboard-bill-payment-source">
                {bill.paymentMethod}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="dashboard-bill-trailing">
        <p className="dashboard-bill-amount">
          {formatMoney(parseMoney(bill.amount))}
        </p>

        <button
          type="button"
          onClick={onPay}
          aria-label={`Mark ${bill.name || "bill"} paid`}
          className="dashboard-pill-button dashboard-pay-button pressable"
        >
          <span className="text-xs">Pay</span>
        </button>
      </div>
    </div>
  );
}

function BillIcon({ name }: { name: string }) {
  const normalizedName = name.toLowerCase();
  const iconType = normalizedName.includes("spotify")
    ? "spotify"
    : normalizedName.includes("chatgpt") ||
        normalizedName.includes("openai")
      ? "ai"
      : normalizedName.includes("phone")
        ? "phone"
        : normalizedName.includes("car") ||
            normalizedName.includes("auto")
          ? "car"
          : "bill";

  return (
    <span
      className={`dashboard-bill-icon dashboard-bill-icon-${iconType}`}
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
      ) : iconType === "car" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5.1 10.2 6.6 6.8A2.2 2.2 0 0 1 8.6 5.5h6.8a2.2 2.2 0 0 1 2 1.3l1.5 3.4"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 10.2h15v6.3a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-6.3Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 13.5h.01M16.5 13.5h.01M7 18v1M17 18v1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
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

function BillRow({
  bill,
  occurrenceDate,
  muted = false,
  overdue = false,
  onPay,
}: {
  bill: ManualBill;
  occurrenceDate: Date;
  muted?: boolean;
  overdue?: boolean;
  onPay?: () => void;
}) {
  return (
    <div
      className={`dashboard-preview-row !px-3 !py-2 ${
        muted ? "dashboard-preview-row-muted" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`truncate text-base font-semibold ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {bill.name || "Untitled Bill"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`dashboard-date-pill ${
                overdue
                  ? "!border-[#d79b83]/25 !bg-[#d79b83]/10 !text-[#e2aa93]"
                  : ""
              }`}
            >
              {overdue
                ? `Overdue · ${formatBillDate(occurrenceDate)}`
                : `Due ${formatBillDate(occurrenceDate)}`}
            </span>

            {bill.paymentMethod ? (
              <span className="dashboard-secondary-pill hidden sm:inline-flex">
                {bill.paymentMethod}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-lg font-bold tracking-tight ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {formatMoney(parseMoney(bill.amount))}
          </p>

          {onPay ? (
            <button
              type="button"
              onClick={onPay}
              aria-label={`Mark ${bill.name || "bill"} paid`}
              className="dashboard-pill-button pressable mt-1 !px-2.5 !py-1"
            >
              <span className="text-xs">Pay</span>
            </button>
          ) : (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/65">
              Monthly
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPreview({ title, text }: { title: string; text: string }) {
  return (
    <div className="dashboard-empty-preview !p-2.5">
      <p className="font-semibold text-[#f5f0e8]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}