"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import { PageShell, Pill } from "../components/Layout";
import { financeSummary, bills, creditCards } from "../data/bandData";
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
  readPayPeriodPreferences,
  type ActiveBillOccurrence,
  type PaidBillOccurrences,
  type PayPeriodPreferences,
} from "../lib/billStatus";

type ManualFinanceData = {
  checkingBalance: string;
  monthlyIncome: string;
  savingsBalance: string;
  nextPayday: string;
};

type ManualBill = {
  name: string;
  amount: string;
  dueDate: string;
  status: "Paid" | "Upcoming" | "Due Soon" | "Overdue";
  paymentMethod: string;
};

type ManualCreditCard = {
  name: string;
  balance: string;
  limit: string;
  minimumPayment: string;
  dueDate: string;
  status: "Good" | "Watch" | "Pay Down";
};

type ActiveBillOccurrenceDates = Record<string, string>;

type BillOccurrenceItem = {
  bill: ManualBill;
  occurrence: ActiveBillOccurrence;
};

type PaidBillAction = {
  occurrenceKey: string;
  occurrenceDateKey: string;
  billIdentity: string;
  billName: string;
  nextOccurrenceDateKey: string | null;
  paidAt: string;
};

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";
const paidBillsStorageKey = "leftovr-paid-bill-occurrences";
const activeBillOccurrencesStorageKey =
  "leftovr-active-bill-occurrences";
const recentPaidActionsStorageKey =
  "leftovr-recent-paid-bill-actions";
const legacyLastPaidActionStorageKey =
  "leftovr-last-paid-bill-action";
const preferencesStorageKey = "leftovr-preferences";

const defaultManualData: ManualFinanceData = {
  checkingBalance: String(financeSummary.checkingBalance),
  monthlyIncome: String(financeSummary.monthlyIncome),
  savingsBalance: String(financeSummary.savingsBalance),
  nextPayday: financeSummary.nextPayday,
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

function parseMoney(value: string) {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatSavedTime(value: string) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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

function formatBillDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
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

function normalizeRecentPaidActions(
  actions: PaidBillAction[],
  paidOccurrences: PaidBillOccurrences,
  preferences: PayPeriodPreferences,
  referenceDate = new Date(),
) {
  const seenOccurrenceKeys = new Set<string>();

  return actions
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
    )
    .slice(0, 8);
}

function readJsonStorage<T>(key: string, fallback: T) {
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

function scrollExpandedSectionIntoView(sectionId: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const section = document.getElementById(sectionId);

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const topClearance = 112;
      const bottomClearance = 24;
      const isComfortablyVisible =
        rect.top >= topClearance &&
        rect.bottom <= window.innerHeight - bottomClearance;

      if (isComfortablyVisible) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      section.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });
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
  const [showCards, setShowCards] = useState(false);
  const [showNextPayPeriod, setShowNextPayPeriod] = useState(false);
  const [showRecentPayments, setShowRecentPayments] = useState(false);

  const paidConfirmationTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function loadDashboardData() {
      const savedBills = readJsonStorage(
        billsStorageKey,
        defaultManualBills,
      );
      const savedPaidOccurrences =
        readJsonStorage<PaidBillOccurrences>(paidBillsStorageKey, {});
      const savedActiveOccurrenceDates =
        readJsonStorage<ActiveBillOccurrenceDates>(
          activeBillOccurrencesStorageKey,
          {},
        );

      setManualData(readJsonStorage(summaryStorageKey, defaultManualData));
      setManualBills(savedBills);
      setManualCards(readJsonStorage(cardsStorageKey, defaultManualCards));

      const savedPreferences = readPayPeriodPreferences();
      const rolloverResult =
        getCurrentPayPeriodPreferences(savedPreferences);

      if (rolloverResult.didAdvance) {
        window.localStorage.setItem(
          preferencesStorageKey,
          JSON.stringify(rolloverResult.preferences),
        );
      }

      const normalizedOccurrenceDates =
        normalizeActiveBillOccurrenceDates(
          savedBills,
          savedActiveOccurrenceDates,
          savedPaidOccurrences,
        );

      setPreferences(rolloverResult.preferences);
      setPaidBillOccurrences(savedPaidOccurrences);
      setActiveBillOccurrenceDates(normalizedOccurrenceDates);

      window.localStorage.setItem(
        activeBillOccurrencesStorageKey,
        JSON.stringify(normalizedOccurrenceDates),
      );

      const savedRecentPaidActions =
        readJsonStorage<PaidBillAction[]>(
          recentPaidActionsStorageKey,
          [],
        );
      const legacyLastPaidAction =
        readJsonStorage<Partial<PaidBillAction> | null>(
          legacyLastPaidActionStorageKey,
          null,
        );

      const migratedLegacyAction =
        legacyLastPaidAction?.occurrenceKey &&
        legacyLastPaidAction.occurrenceDateKey &&
        legacyLastPaidAction.billIdentity &&
        legacyLastPaidAction.billName &&
        savedPaidOccurrences[legacyLastPaidAction.occurrenceKey]
          ? ({
              occurrenceKey: legacyLastPaidAction.occurrenceKey,
              occurrenceDateKey:
                legacyLastPaidAction.occurrenceDateKey,
              billIdentity: legacyLastPaidAction.billIdentity,
              billName: legacyLastPaidAction.billName,
              nextOccurrenceDateKey:
                legacyLastPaidAction.nextOccurrenceDateKey ?? null,
              paidAt:
                legacyLastPaidAction.paidAt ||
                savedPaidOccurrences[
                  legacyLastPaidAction.occurrenceKey
                ],
            } satisfies PaidBillAction)
          : null;

      const normalizedRecentPaidActions =
        normalizeRecentPaidActions(
          migratedLegacyAction
            ? [migratedLegacyAction, ...savedRecentPaidActions]
            : savedRecentPaidActions,
          savedPaidOccurrences,
          rolloverResult.preferences,
        );

      setRecentPaidActions(normalizedRecentPaidActions);
      setShowRecentPayments(false);

      window.localStorage.setItem(
        recentPaidActionsStorageKey,
        JSON.stringify(normalizedRecentPaidActions),
      );
      window.localStorage.removeItem(
        legacyLastPaidActionStorageKey,
      );

      const savedTime = window.localStorage.getItem(lastSavedStorageKey);
      setLastSaved(savedTime ?? "");
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

  function updateActiveOccurrenceDate(
    billIdentity: string,
    occurrenceDateKey: string,
  ) {
    setActiveBillOccurrenceDates((current) => {
      const nextDates = {
        ...current,
        [billIdentity]: occurrenceDateKey,
      };

      window.localStorage.setItem(
        activeBillOccurrencesStorageKey,
        JSON.stringify(nextDates),
      );

      return nextDates;
    });
  }

  function markBillPaid(item: BillOccurrenceItem) {
    const { bill, occurrence } = item;
    const paidAt = new Date().toISOString();
    const followingOccurrence = getFollowingBillDueDate(
      bill.dueDate,
      occurrence.dueDate,
    );
    const nextOccurrenceDateKey = followingOccurrence
      ? formatLocalDateKey(followingOccurrence)
      : null;

    setPaidBillOccurrences((current) => {
      const nextOccurrences = {
        ...current,
        [occurrence.occurrenceKey]: paidAt,
      };

      window.localStorage.setItem(
        paidBillsStorageKey,
        JSON.stringify(nextOccurrences),
      );

      return nextOccurrences;
    });

    if (nextOccurrenceDateKey) {
      setActiveBillOccurrenceDates((current) => {
        const nextDates = {
          ...current,
          [occurrence.billIdentity]: nextOccurrenceDateKey,
        };

        window.localStorage.setItem(
          activeBillOccurrencesStorageKey,
          JSON.stringify(nextDates),
        );

        return nextDates;
      });
    }

    const nextPaidAction: PaidBillAction = {
      occurrenceKey: occurrence.occurrenceKey,
      occurrenceDateKey: occurrence.dueDateKey,
      billIdentity: occurrence.billIdentity,
      billName: bill.name || "Bill",
      nextOccurrenceDateKey,
      paidAt,
    };

    setRecentPaidActions((current) => {
      const nextActions = normalizeRecentPaidActions(
        [
          nextPaidAction,
          ...current.filter(
            (action) =>
              action.occurrenceKey !== nextPaidAction.occurrenceKey,
          ),
        ],
        {
          ...paidBillOccurrences,
          [occurrence.occurrenceKey]: paidAt,
        },
        preferences,
      );

      window.localStorage.setItem(
        recentPaidActionsStorageKey,
        JSON.stringify(nextActions),
      );

      return nextActions;
    });

    setPaidConfirmationAction(nextPaidAction);
    setShowPaidConfirmation(true);

    if (paidConfirmationTimeout.current) {
      clearTimeout(paidConfirmationTimeout.current);
    }

    paidConfirmationTimeout.current = setTimeout(() => {
      setShowPaidConfirmation(false);
      paidConfirmationTimeout.current = null;
    }, 6500);
  }

  function undoPaidBill(action: PaidBillAction) {
    setPaidBillOccurrences((current) => {
      const nextOccurrences = { ...current };
      delete nextOccurrences[action.occurrenceKey];

      window.localStorage.setItem(
        paidBillsStorageKey,
        JSON.stringify(nextOccurrences),
      );

      return nextOccurrences;
    });

    updateActiveOccurrenceDate(
      action.billIdentity,
      action.occurrenceDateKey,
    );

    setRecentPaidActions((current) => {
      const nextActions = current.filter(
        (recentAction) =>
          recentAction.occurrenceKey !== action.occurrenceKey,
      );

      window.localStorage.setItem(
        recentPaidActionsStorageKey,
        JSON.stringify(nextActions),
      );

      return nextActions;
    });

    if (
      paidConfirmationAction?.occurrenceKey === action.occurrenceKey
    ) {
      setPaidConfirmationAction(null);
      setShowPaidConfirmation(false);

      if (paidConfirmationTimeout.current) {
        clearTimeout(paidConfirmationTimeout.current);
        paidConfirmationTimeout.current = null;
      }
    }
  }

  function toggleNextPayPeriod() {
    const isOpening = !showNextPayPeriod;
    setShowNextPayPeriod(isOpening);

    if (isOpening) {
      scrollExpandedSectionIntoView("dashboard-next-pay-period");
    }
  }

  function toggleRecentPayments() {
    const isOpening = !showRecentPayments;
    setShowRecentPayments(isOpening);

    if (isOpening) {
      scrollExpandedSectionIntoView("dashboard-recent-payments");
    }
  }

  function toggleCards() {
    const isOpening = !showCards;
    setShowCards(isOpening);

    if (isOpening) {
      scrollExpandedSectionIntoView("dashboard-credit-cards");
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
  const dueBeforePaydayTotal =
    overdueTotal + beforeNextPaydayTotal;

  const cardBalanceTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.balance),
    0,
  );

  const cardLimitTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.limit),
    0,
  );

  const availableCredit = cardLimitTotal - cardBalanceTotal;

  const cardUtilization =
    cardLimitTotal > 0
      ? Math.round((cardBalanceTotal / cardLimitTotal) * 100)
      : 0;

  const sortedManualCards = [...manualCards].sort(
    (firstCard, secondCard) =>
      parseMoney(secondCard.balance) - parseMoney(firstCard.balance),
  );

  const moneyLeftAfterBills = checkingBalance - dueBeforePaydayTotal;

  const primaryBillsTitle = hasCurrentPayday
    ? "Before Next Payday"
    : "Next Bills";

  const primaryEmptyTitle = hasCurrentPayday
    ? "Nothing due before payday"
    : "No bills due soon";

  const primaryEmptyText = hasCurrentPayday
    ? `You have no additional unpaid bills due before ${formatPayday(
        preferences.nextPayday,
      )}.`
    : `You have nothing due within the next ${payPeriodDays} days.`;

  const heroLabel = hasCurrentPayday
    ? "Left After Bills"
    : "Left After Upcoming Bills";

  return (
    <PageShell>
      <TopNav />

      <header className="-mt-1 mb-1.5 motion-card sm:-mt-2">
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Finance Tracker
          </p>

          <Pill>v1.3 Beta</Pill>
        </div>

        <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
          Dashboard
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

            <div className="shrink-0">
              <Pill>
                <span className="sm:hidden">Saved</span>
                <span className="hidden sm:inline">
                  {formatSavedTime(lastSaved)}
                </span>
              </Pill>
            </div>
          </div>

          <div className="relative mt-2.5">
            <p className="dashboard-hero-balance break-words text-[3rem] font-bold leading-none tracking-[-0.045em] text-[#f5f0e8] sm:text-6xl">
              {formatMoney(moneyLeftAfterBills)}
            </p>
          </div>

          <div className="relative mt-2.5 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
            <HeroMetricRow
              label="Checking"
              value={formatMoney(checkingBalance)}
            />

            <HeroMetricRow
              label="Savings"
              value={formatMoney(savingsBalance)}
            />

            <HeroMetricRow
              label={
                hasCurrentPayday
                  ? "Due Before Payday"
                  : "Upcoming Bills"
              }
              value={formatMoney(dueBeforePaydayTotal)}
              subtext={
                hasCurrentPayday
                  ? `Through ${formatPayday(preferences.nextPayday)}`
                  : `Next ${payPeriodDays} days`
              }
              last
            />
          </div>
        </div>
      </section>

      <section className="grid gap-2">
        <section className="dashboard-surface dashboard-bills-surface motion-card motion-card-delay-2 rounded-[1.7rem] p-2.5">
          <div
            className="dashboard-surface-glow"
            aria-hidden="true"
          />

          <div className="liquid-content">
            <div className="mb-2">
              <div className="min-w-0">
                <SectionTitle title={primaryBillsTitle} />

                <p className="mt-1 text-xs text-stone-500">
                  {beforeNextPaydayBillItems.length} bill
                  {beforeNextPaydayBillItems.length === 1 ? "" : "s"} •{" "}
                  {formatMoney(beforeNextPaydayTotal)} due
                </p>
              </div>
            </div>

            {beforeNextPaydayBillItems.length > 0 ? (
              <div className="grid gap-1">
                {beforeNextPaydayBillItems.map((item) => (
                  <BillPreviewRow
                    key={item.occurrence.occurrenceKey}
                    bill={item.bill}
                    occurrenceDate={item.occurrence.dueDate}
                    onPay={() => markBillPaid(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyPreview
                title={primaryEmptyTitle}
                text={primaryEmptyText}
              />
            )}

            {overdueBillItems.length > 0 ? (
              <div className="mt-2.5 border-t border-[#f5f0e8]/8 pt-2.5">
                <div className="mb-2">
                  <SectionTitle title="Needs Attention" />

                  <p className="mt-1 text-xs text-stone-500">
                    {overdueBillItems.length} overdue •{" "}
                    {formatMoney(overdueTotal)} still unpaid
                  </p>
                </div>

                <div className="grid gap-1">
                  {overdueBillItems.map((item) => (
                    <BillPreviewRow
                      key={item.occurrence.occurrenceKey}
                      bill={item.bill}
                      occurrenceDate={item.occurrence.dueDate}
                      overdue
                      onPay={() => markBillPaid(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {recentPaidActions.length > 0 ? (
              <div
                id="dashboard-recent-payments"
                className="scroll-mt-28 mt-2.5 border-t border-[#f5f0e8]/8 pt-1.5"
              >
                <button
                  type="button"
                  onClick={toggleRecentPayments}
                  aria-expanded={showRecentPayments}
                  aria-controls="dashboard-recent-payments-content"
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
                    id="dashboard-recent-payments-content"
                    className="mt-1.5 grid gap-1 border-t border-[#f5f0e8]/8 pt-2"
                  >
                    {recentPaidActions.map((action) => (
                      <RecentPaymentRow
                        key={action.occurrenceKey}
                        action={action}
                        onUndo={() => undoPaidBill(action)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3.5 rounded-[1.45rem] border border-[#f5f0e8]/8 bg-[#11100d]/16 p-2 shadow-[inset_0_1px_0_rgba(245,240,232,0.04)]">
              <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/70">
                  Up Next
                </p>

                <Link
                  href="/bills"
                  className="text-[11px] font-semibold text-stone-500 transition hover:text-[#c7ad75]"
                >
                  View all bills
                </Link>
              </div>

              <div className="overflow-hidden rounded-[1.2rem] border border-[#f5f0e8]/8 bg-[#f5f0e8]/[0.025]">
                {hasCurrentPayday ? (
                  <div
                    id="dashboard-next-pay-period"
                    className="scroll-mt-28"
                  >
                    <button
                      type="button"
                      onClick={toggleNextPayPeriod}
                      aria-expanded={showNextPayPeriod}
                      className="pressable flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#f5f0e8]">
                          Next Pay Period
                        </p>

                        <p className="mt-0.5 text-xs text-stone-400">
                          {nextPayPeriodBillItems.length} bill
                          {nextPayPeriodBillItems.length === 1 ? "" : "s"} •{" "}
                          {formatMoney(nextPayPeriodTotal)}
                        </p>
                      </div>

                      <span className="dashboard-pill-button shrink-0 !px-2.5 !py-0.5">
                        {showNextPayPeriod ? "Hide" : "View"}
                      </span>
                    </button>

                    {showNextPayPeriod ? (
                      <div className="border-t border-[#f5f0e8]/8 px-2.5 py-2">
                        {nextPayPeriodBillItems.length > 0 ? (
                          <div className="grid gap-1.5">
                            {nextPayPeriodBillItems.map((item) => (
                              <BillPreviewRow
                                key={item.occurrence.occurrenceKey}
                                bill={item.bill}
                                occurrenceDate={item.occurrence.dueDate}
                                muted
                                onPay={() => markBillPaid(item)}
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptyPreview
                            title="Nothing due next pay period"
                            text="No bills are currently scheduled in that window."
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Link
                  href="/bills"
                  className={`pressable flex items-center justify-between gap-3 px-3 py-2.5 ${
                    hasCurrentPayday ? "border-t border-[#f5f0e8]/8" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f5f0e8]">
                      {hasCurrentPayday ? "Later" : "Other Bills"}
                    </p>

                    <p className="mt-0.5 text-xs text-stone-400">
                      {laterBillItems.length} bill
                      {laterBillItems.length === 1 ? "" : "s"} scheduled
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-stone-500">
                    Open
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="dashboard-credit-cards"
          className="dashboard-surface dashboard-cards-surface motion-card motion-card-delay-3 scroll-mt-28 rounded-[1.7rem] p-2.5"
        >
          <div
            className="dashboard-surface-glow"
            aria-hidden="true"
          />

          <div className="liquid-content">
            <button
              type="button"
              onClick={toggleCards}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <SectionTitle title="Credit Cards" />

                <p className="mt-1 text-sm text-stone-400">
                  {manualCards.length} card
                  {manualCards.length === 1 ? "" : "s"} tracked •{" "}
                  {cardUtilization}% used
                </p>
              </div>

              <span className="dashboard-pill-button pressable !px-2.5 !py-0.5">
                {showCards ? "Hide" : "View"}
              </span>
            </button>

            <div className="dashboard-compact-panel mt-2">
              <div className="grid grid-cols-2 gap-1">
                <CompactStat
                  label="Balance"
                  value={formatMoney(cardBalanceTotal)}
                />

                <CompactStat
                  label="Credit Left"
                  value={formatMoney(availableCredit)}
                />
              </div>
            </div>

            {showCards && (
              <div className="mt-2 grid gap-1 pt-0.5">
                {manualCards.length > 0 ? (
                  sortedManualCards.map((card, index) => {
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
                  })
                ) : (
                  <EmptyPreview
                    title="No credit cards yet"
                    text="Add a card in the Editor to track utilization."
                  />
                )}

                <Link
                  href="/cards"
                  className="dashboard-wide-button pressable mt-1 !py-2.5"
                >
                  Open Credit Cards
                </Link>
              </div>
            )}
          </div>
        </section>
      </section>

      {paidConfirmationAction && showPaidConfirmation ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
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
  subtext,
  last = false,
}: {
  label: string;
  value: string;
  subtext?: string;
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

      <div className="shrink-0 text-right">
        <p className="text-base font-bold tracking-tight text-[#f5f0e8]">
          {value}
        </p>

        {subtext ? (
          <p className="mt-0.5 text-xs text-stone-400">
            {subtext}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BillPreviewRow({
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

function RecentPaymentRow({
  action,
  onUndo,
}: {
  action: PaidBillAction;
  onUndo: () => void;
}) {
  return (
    <div className="dashboard-preview-row flex items-center justify-between gap-3 !px-3 !py-2">
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
        onClick={onUndo}
        className="dashboard-pill-button pressable shrink-0 !px-2.5 !py-1"
      >
        <span className="text-xs">Undo</span>
      </button>
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
    <div className="dashboard-preview-row dashboard-card-preview-row !px-3 !py-2">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {name || "Untitled Card"}
          </p>

          <p className="mt-0.5 text-sm text-stone-400">
            {utilization}% of limit used
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tracking-tight text-[#f5f0e8]">
            {formatMoney(balance)}
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/65">
            Balance
          </p>
        </div>
      </div>

      <div className="dashboard-progress-track">
        <div
          className="liquid-progress dashboard-progress-fill"
          style={{
            width: `${Math.min(utilization, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function CompactStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="dashboard-compact-stat !px-2.5 !py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
        {label}
      </p>

      <p className="mt-0.5 truncate text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
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