"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { bills, creditCards } from "../../data/bandData";
import {
  migrateBillOccurrenceState,
  parseMoney,
  type ManualBill,
  type ManualCreditCard,
  type PaidBillAction,
} from "../../lib/financeData";
import {
  clearLegacyPaidAction,
  loadBillTrackingStorageState,
  saveActiveBillOccurrenceDates,
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

type ActiveBillOccurrenceDates = Record<string, string>;

type BillOccurrenceItem = {
  bill: ManualBill;
  occurrence: ActiveBillOccurrence;
};

const billsEditSnapshotKey =
  "finance-tracker-bills-edit-snapshot";

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

  const paidConfirmationTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
  const processingPaymentKeys =
    useRef<Set<string>>(new Set());

  useEffect(() => {
    function loadBillsData(checkEditSnapshot: boolean) {
      const storedState =
        loadBillTrackingStorageState(
          defaultManualBills,
          defaultManualCards,
        );
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

    if (result.cards !== manualCards) {
      setManualCards(result.cards);
      saveFinanceCards(result.cards);
    }

    setPaidBillOccurrences(
      result.paidOccurrences,
    );
    setActiveBillOccurrenceDates(
      result.activeOccurrenceDates,
    );
    setRecentPaidActions(result.paidActions);

    savePaidBillOccurrences(
      result.paidOccurrences,
    );
    saveActiveBillOccurrenceDates(
      result.activeOccurrenceDates,
    );
    saveRecentPaidActions(
      result.paidActions,
    );

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
      cards: manualCards,
      activeOccurrenceDates:
        activeBillOccurrenceDates,
      paidOccurrences: paidBillOccurrences,
      paidActions: recentPaidActions,
    });

    if (result.cards !== manualCards) {
      setManualCards(result.cards);
      saveFinanceCards(result.cards);
    }

    setPaidBillOccurrences(
      result.paidOccurrences,
    );
    setActiveBillOccurrenceDates(
      result.activeOccurrenceDates,
    );
    setRecentPaidActions(result.paidActions);

    savePaidBillOccurrences(
      result.paidOccurrences,
    );
    saveActiveBillOccurrenceDates(
      result.activeOccurrenceDates,
    );
    saveRecentPaidActions(
      result.paidActions,
    );

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
    ? "Due This Pay Period"
    : "Next Bills";
  const heroTitle = hasCurrentPayday
    ? "Due Before Next Payday"
    : overdueBillItems.length > 0
      ? "Bills Needing Attention"
      : "Upcoming Bills";
  const primaryEmptyTitle = hasCurrentPayday
    ? "Nothing else due before payday"
    : "No bills due soon";
  const primaryEmptyText = hasCurrentPayday
    ? `You have no additional unpaid bills due before ${formatPayday(
        preferences.nextPayday,
      )}.`
    : `You have no unpaid bills due within the next ${payPeriodDays} days.`;

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-1.5 motion-card sm:-mt-2">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Bill Tracker
          </p>

          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Bills
          </h1>
        </header>

        <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 mb-2 rounded-[2rem]">
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
                <Pill>
                  {dueBeforePaydayCount} bill
                  {dueBeforePaydayCount === 1 ? "" : "s"}
                </Pill>
              </div>
            </div>

            <div className="relative mt-2.5">
              <p className="dashboard-hero-balance break-words text-[3rem] font-bold leading-none tracking-[-0.045em] text-[#f5f0e8] sm:text-6xl">
                {formatMoney(dueBeforePaydayTotal)}
              </p>
            </div>

            <div className="relative mt-2.5 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
              <HeroMetricRow
                label="Next Payday"
                value={
                  hasCurrentPayday
                    ? formatPayday(preferences.nextPayday)
                    : "Not set"
                }
              />

              <HeroMetricRow
                label="Next Pay Period"
                value={
                  hasCurrentPayday
                    ? formatMoney(nextPayPeriodTotal)
                    : "Not available"
                }
              />

              <HeroMetricRow
                label="Monthly Bills"
                value={formatMoney(monthlyTotal)}
                last
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
              hasCurrentPayday
                ? `${beforeNextPaydayBillItems.length} unpaid • ${formatMoney(
                    beforeNextPaydayTotal,
                  )} planned through ${formatPayday(preferences.nextPayday)}`
                : `${beforeNextPaydayBillItems.length} unpaid • ${formatMoney(
                    beforeNextPaydayTotal,
                  )} planned over the next ${payPeriodDays} days`
            }
            bills={beforeNextPaydayBillItems}
            overdueBills={overdueBillItems}
            overdueTotal={overdueTotal}
            recentPaidActions={recentPaidActions}
            showRecentPayments={showRecentPayments}
            onToggleRecentPayments={() =>
              setShowRecentPayments((current) => !current)
            }
            onPayBill={markBillPaid}
            onUndoRecentPayment={undoPaidBill}
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

          {hasCurrentPayday ? (
            <BillSection
              title="Next Pay Period"
              description={`${nextPayPeriodBillItems.length} bill${
                nextPayPeriodBillItems.length === 1 ? "" : "s"
              } • ${formatMoney(nextPayPeriodTotal)} planned after payday`}
              bills={nextPayPeriodBillItems}
              onPayBill={markBillPaid}
              emptyTitle="No bills in the next pay period"
              emptyText="Nothing is currently scheduled in this pay period."
              delayClass="motion-card-delay-3"
              muted
            />
          ) : null}

          <BillSection
            title={hasCurrentPayday ? "Later Bills" : "Other Bills"}
            description={`${laterBillItems.length} bill${
              laterBillItems.length === 1 ? "" : "s"
            } • ${formatMoney(laterBillsTotal)}`}
            bills={laterBillItems}
            emptyTitle={hasCurrentPayday ? "No later bills" : "No other bills"}
            emptyText={
              hasCurrentPayday
                ? "Nothing is scheduled beyond the next two pay periods."
                : `Nothing is scheduled outside the current ${payPeriodDays}-day window.`
            }
            muted
          />
        </section>
      </div>

      {paidConfirmationAction && showPaidConfirmation ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
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
  delayClass?: string;
}) {
  return (
    <section
      className={`dashboard-surface dashboard-bills-surface motion-card ${delayClass} rounded-[1.7rem] p-2.5`}
    >
      <div className="dashboard-surface-glow" aria-hidden="true" />

      <div className="liquid-content">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionTitle title={title} />
            <p className="mt-1 text-sm text-stone-400">{description}</p>
          </div>

          {action}
        </div>

        {bills.length > 0 ? (
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
        ) : (
          <EmptyPreview title={emptyTitle} text={emptyText} />
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
  recentPaidActions,
  showRecentPayments,
  onToggleRecentPayments,
  onPayBill,
  onUndoRecentPayment,
  emptyTitle,
  emptyText,
  action,
}: {
  title: string;
  description: string;
  bills: BillOccurrenceItem[];
  overdueBills: BillOccurrenceItem[];
  overdueTotal: number;
  recentPaidActions: PaidBillAction[];
  showRecentPayments: boolean;
  onToggleRecentPayments: () => void;
  onPayBill: (item: BillOccurrenceItem) => void;
  onUndoRecentPayment: (action: PaidBillAction) => void;
  emptyTitle: string;
  emptyText: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="dashboard-surface dashboard-bills-surface motion-card motion-card-delay-2 rounded-[1.7rem] p-2.5">
      <div className="dashboard-surface-glow" aria-hidden="true" />

      <div className="liquid-content">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionTitle title={title} />
            <p className="mt-1 text-sm text-stone-400">{description}</p>
          </div>

          {action}
        </div>

        {bills.length > 0 ? (
          <div className="grid gap-1">
            {bills.map((item) => (
              <BillRow
                key={item.occurrence.occurrenceKey}
                bill={item.bill}
                occurrenceDate={item.occurrence.dueDate}
                onPay={() => onPayBill(item)}
              />
            ))}
          </div>
        ) : (
          <EmptyPreview title={emptyTitle} text={emptyText} />
        )}

        {overdueBills.length > 0 ? (
          <div className="mt-2.5 border-t border-[#f5f0e8]/8 pt-2.5">
            <div className="mb-2">
              <SectionTitle title="Needs Attention" />

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

        {recentPaidActions.length > 0 ? (
          <div className="mt-2.5 border-t border-[#f5f0e8]/8 pt-1.5">
            <button
              type="button"
              onClick={onToggleRecentPayments}
              aria-expanded={showRecentPayments}
              aria-controls="recent-payments-content"
              className="pressable flex w-full items-center justify-between gap-3 rounded-[1.1rem] px-1 py-1.5 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  Recently Paid
                </p>

                <p className="mt-0.5 text-xs text-stone-500">
                  {recentPaidActions.length} recorded
                </p>
              </div>

              <span className="dashboard-pill-button shrink-0 !px-2.5 !py-0.5">
                {showRecentPayments ? "Hide" : "View"}
              </span>
            </button>

            {showRecentPayments ? (
              <div
                id="recent-payments-content"
                className="mt-1.5 grid gap-1 border-t border-[#f5f0e8]/8 pt-2"
              >
                {recentPaidActions.map((action) => (
                  <div
                    key={action.occurrenceKey}
                    className="dashboard-preview-row flex items-center justify-between gap-3 !px-3 !py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-300">
                        {action.billName}
                      </p>

                      <p className="mt-0.5 text-xs text-stone-500">
                        Paid {formatPayday(action.occurrenceDateKey)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onUndoRecentPayment(action)}
                      className="dashboard-pill-button pressable shrink-0 !px-2.5 !py-1"
                    >
                      <span className="text-xs">Undo</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function HeroMetricRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="shrink-0 text-base font-bold tracking-tight text-[#f5f0e8]">
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