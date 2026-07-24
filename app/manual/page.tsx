"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell } from "../../components/Layout";
import { bills, creditCards, financeSummary } from "../../data/bandData";
import {
  applyManualCardBalanceRevisions,
  createPersistentId,
  getPaymentMethodLabel,
  getPaymentSourceLabel,
  migrateBillOccurrenceState,
  normalizeManualBills,
  normalizeManualCards,
  parseMoney,
  resolveBillPaymentSource,
  type ManualBill,
  type ManualCreditCard,
  type PaymentSource,
} from "../../lib/financeData";
import {
  loadBillOccurrenceStorageState,
  loadFinanceStorageState,
  saveBillOccurrenceStorageState,
  saveFinanceBills,
  saveFinanceCards,
  saveFinanceSummary,
  saveLastSavedTime,
} from "../../lib/financeStorage";
import {
  getBillIdentity,
  sortIndexedBillsByDueDay,
} from "../../lib/billStatus";

type EditorTab = "overview" | "bills" | "cards";
type GuidedSetupStage = "intro" | "balances" | "optional";
type GuidedSetupDestination = "dashboard" | "bills" | "cards";

type GuidedBalanceTouched = {
  checkingBalance: boolean;
  savingsBalance: boolean;
};

type NewlyAddedItem = {
  type: "bill" | "card";
  index: number;
};

type PersistEditorChangesOptions = {
  updateUi?: boolean;
};

const editorAutosaveDelay = 900;
const guidedSetupStorageKey =
  "leftovr-finance-onboarding-active";
const guidedSetupCompleteStorageKey =
  "leftovr-finance-onboarding-complete";

type ManualFinanceData = {
  checkingBalance: string;
  monthlyIncome: string;
  savingsBalance: string;
  nextPayday: string;
};

type EditableManualBillField = Exclude<
  keyof ManualBill,
  "paymentMethod" | "paymentSource"
>;

function normalizeMonthlyDueDay(value: string) {
  const match = value
    .trim()
    .match(/\b([1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\b/i);

  return match ? String(Number(match[1])) : "";
}

function sanitizeMonthlyDueDayInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 2);

  if (!digits) {
    return "";
  }

  const day = Number(digits);

  return day >= 1 && day <= 31 ? String(day) : null;
}

function formatOrdinalDay(value: string) {
  const day = Number(normalizeMonthlyDueDay(value));

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return "Not set";
  }

  const remainder100 = day % 100;
  const remainder10 = day % 10;
  const suffix =
    remainder100 >= 11 && remainder100 <= 13
      ? "th"
      : remainder10 === 1
        ? "st"
        : remainder10 === 2
          ? "nd"
          : remainder10 === 3
            ? "rd"
            : "th";

  return `${day}${suffix}`;
}

const defaultManualData: ManualFinanceData = {
  checkingBalance: String(financeSummary.checkingBalance),
  monthlyIncome: String(financeSummary.monthlyIncome),
  savingsBalance: String(financeSummary.savingsBalance),
  nextPayday: financeSummary.nextPayday,
};

const defaultManualBills: ManualBill[] = bills.map((bill) => ({
  name: bill.name,
  amount: String(bill.amount),
  dueDate: normalizeMonthlyDueDay(bill.dueDate),
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

function cloneBill(bill: ManualBill) {
  return { ...bill };
}

function reconcileBillOccurrenceStorage(
  originalBills: Array<ManualBill | null>,
  removedBills: ManualBill[],
  nextBills: ManualBill[],
) {
  const storedOccurrenceState = loadBillOccurrenceStorageState();
  const savedActiveOccurrences = storedOccurrenceState.activeOccurrenceDates;
  const savedPaidOccurrences = storedOccurrenceState.paidOccurrences;
  const savedRecentPaidActions = storedOccurrenceState.paidActions;

  const migratedState = migrateBillOccurrenceState(
    nextBills,
    savedActiveOccurrences,
    savedPaidOccurrences,
    savedRecentPaidActions,
  );
  const nextActiveOccurrences = {
    ...migratedState.activeOccurrenceDates,
  };
  const nextPaidOccurrences = {
    ...migratedState.paidOccurrences,
  };
  let nextRecentPaidActions = [...migratedState.paidActions];

  nextBills.forEach((nextBill, index) => {
    const originalBill = originalBills[index];

    if (!originalBill || !nextBill.id) {
      return;
    }

    const dueDateChanged =
      originalBill.dueDate.trim().toLowerCase() !==
      nextBill.dueDate.trim().toLowerCase();

    if (dueDateChanged) {
      delete nextActiveOccurrences[nextBill.id];
    }

    nextRecentPaidActions = nextRecentPaidActions.map((action) =>
      action.billId === nextBill.id
        ? {
            ...action,
            billIdentity: nextBill.id as string,
            billId: nextBill.id,
            billName: nextBill.name || "Bill",
          }
        : action,
    );
  });

  const removedBillIds = new Set(
    removedBills
      .map((bill) => bill.id)
      .filter((id): id is string => Boolean(id)),
  );

  for (const removedBillId of removedBillIds) {
    delete nextActiveOccurrences[removedBillId];

    for (const occurrenceKey of Object.keys(nextPaidOccurrences)) {
      if (occurrenceKey.startsWith(`${removedBillId}|`)) {
        delete nextPaidOccurrences[occurrenceKey];
      }
    }
  }

  nextRecentPaidActions = nextRecentPaidActions.filter(
    (action) => !(action.billId && removedBillIds.has(action.billId)),
  );

  const validBillIds = new Set(
    nextBills.map((bill) => bill.id).filter((id): id is string => Boolean(id)),
  );

  for (const identity of Object.keys(nextActiveOccurrences)) {
    if (!validBillIds.has(identity)) {
      delete nextActiveOccurrences[identity];
    }
  }

  for (const occurrenceKey of Object.keys(nextPaidOccurrences)) {
    const belongsToCurrentBill = [...validBillIds].some((billId) =>
      occurrenceKey.startsWith(`${billId}|`),
    );

    if (!belongsToCurrentBill) {
      delete nextPaidOccurrences[occurrenceKey];
    }
  }

  const seenOccurrenceKeys = new Set<string>();

  nextRecentPaidActions = nextRecentPaidActions
    .filter((action) => {
      const hasValidBill =
        Boolean(action.billId) && validBillIds.has(action.billId as string);

      if (
        !hasValidBill ||
        !nextPaidOccurrences[action.occurrenceKey] ||
        seenOccurrenceKeys.has(action.occurrenceKey)
      ) {
        return false;
      }

      seenOccurrenceKeys.add(action.occurrenceKey);
      return true;
    })
    .sort(
      (firstAction, secondAction) =>
        new Date(secondAction.paidAt).getTime() -
        new Date(firstAction.paidAt).getTime(),
    )
    .slice(0, 8);

  saveBillOccurrenceStorageState({
    activeOccurrenceDates: nextActiveOccurrences,
    paidOccurrences: nextPaidOccurrences,
    paidActions: nextRecentPaidActions,
  });
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatMoney(value: string) {
  return formatCurrency(parseMoney(value));
}

function clearZeroOnFocus(
  value: string,
  updateValue: (nextValue: string) => void,
) {
  if (value === "0") {
    updateValue("");
  }
}

function scrollEditorItemIntoView(type: "bill" | "card", index: number) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const item = document.querySelector<HTMLElement>(
        `[data-editor-item="${type}-${index}"]`,
      );

      if (!item) {
        return;
      }

      const rect = item.getBoundingClientRect();
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

      item.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });
}

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<EditorTab>("overview");
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);
  const [lastSaved, setLastSaved] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [isGuidedSetup, setIsGuidedSetup] = useState(false);
  const [guidedSetupStage, setGuidedSetupStage] =
    useState<GuidedSetupStage>("intro");
  const [guidedBalanceTouched, setGuidedBalanceTouched] =
    useState<GuidedBalanceTouched>({
      checkingBalance: false,
      savingsBalance: false,
    });
  const [editingBills, setEditingBills] = useState<number[]>([]);
  const [editingCards, setEditingCards] = useState<number[]>([]);
  const [editingBalanceField, setEditingBalanceField] = useState<
    "checkingBalance" | "savingsBalance" | "monthlyIncome" | null
  >(null);
  const [newlyAddedItem, setNewlyAddedItem] = useState<NewlyAddedItem | null>(
    null,
  );

  const savedConfirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingIndicatorTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasLoadedStoredStateRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const isPersistingChangesRef = useRef(false);
  const manualDataRef = useRef<ManualFinanceData>(defaultManualData);
  const manualBillsRef = useRef<ManualBill[]>(defaultManualBills);
  const manualCardsRef = useRef<ManualCreditCard[]>(defaultManualCards);
  const newItemHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const originalBillsRef = useRef<Array<ManualBill | null>>([]);
  const originalCardsRef = useRef<ManualCreditCard[]>([]);
  const removedBillsRef = useRef<ManualBill[]>([]);

  useEffect(() => {
    if (hasLoadedStoredStateRef.current) {
      return;
    }

    const storedState = loadFinanceStorageState(
      {
        summary: defaultManualData,
        bills: defaultManualBills,
        cards: defaultManualCards,
      },
      {
        syncLegacyPaymentMethod: true,
      },
    );
    const savedCards = storedState.cards;
    const savedBills = storedState.bills.map((bill) => ({
      ...bill,
      dueDate: normalizeMonthlyDueDay(bill.dueDate),
    }));

    setManualData(storedState.summary);
    setManualBills(savedBills);
    setManualCards(savedCards);

    manualDataRef.current = storedState.summary;
    manualBillsRef.current = savedBills;
    manualCardsRef.current = savedCards;

    saveFinanceCards(savedCards);
    saveFinanceBills(savedBills);

    const migratedOccurrenceState = migrateBillOccurrenceState(
      savedBills,
      storedState.activeOccurrenceDates,
      storedState.paidOccurrences,
      storedState.paidActions,
    );

    saveBillOccurrenceStorageState({
      activeOccurrenceDates: migratedOccurrenceState.activeOccurrenceDates,
      paidOccurrences: migratedOccurrenceState.paidOccurrences,
      paidActions: migratedOccurrenceState.paidActions,
    });

    originalBillsRef.current = savedBills.map((bill) => cloneBill(bill));
    originalCardsRef.current = savedCards.map((card) => ({
      ...card,
    }));
    removedBillsRef.current = [];

    if (storedState.lastSaved) {
      setLastSaved(storedState.lastSaved);
    }

    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    const setupRequested = searchParams.get("setup") === "1";
    const setupAlreadyActive =
      window.localStorage.getItem(guidedSetupStorageKey) === "true";

    if (tab === "bills" || tab === "cards" || tab === "overview") {
      setActiveTab(tab);
    }

    if (setupRequested || setupAlreadyActive) {
      window.localStorage.setItem(guidedSetupStorageKey, "true");
      setIsGuidedSetup(true);
    }

    hasLoadedStoredStateRef.current = true;
  }, []);

  useEffect(() => {
    if (!isGuidedSetup) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.documentElement.setAttribute("data-guided-setup", "true");
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-guided-setup");
      document.body.style.overflow = previousOverflow;
    };
  }, [isGuidedSetup]);

  useEffect(() => {
    if (!newlyAddedItem) {
      return;
    }

    if (newItemHighlightTimeout.current) {
      clearTimeout(newItemHighlightTimeout.current);
    }

    newItemHighlightTimeout.current = setTimeout(() => {
      setNewlyAddedItem(null);
    }, 1400);

    return () => {
      if (newItemHighlightTimeout.current) {
        clearTimeout(newItemHighlightTimeout.current);
        newItemHighlightTimeout.current = null;
      }
    };
  }, [newlyAddedItem]);

  const persistChanges = useCallback(
    (options: PersistEditorChangesOptions = {}) => {
      const updateUi = options.updateUi ?? true;

      if (
        !hasLoadedStoredStateRef.current ||
        !hasUnsavedChangesRef.current ||
        isPersistingChangesRef.current
      ) {
        return false;
      }

      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
        autosaveTimeout.current = null;
      }

      isPersistingChangesRef.current = true;

      if (updateUi) {
        setIsAutoSaving(true);
      }

      try {
        const savedTime = new Date().toISOString();
        const normalizedCards = normalizeManualCards(manualCardsRef.current);
        const revisedCards = applyManualCardBalanceRevisions(
          normalizedCards,
          originalCardsRef.current,
        );
        const normalizedBills = normalizeManualBills(
          manualBillsRef.current,
          revisedCards,
          true,
        );

        reconcileBillOccurrenceStorage(
          originalBillsRef.current,
          removedBillsRef.current,
          normalizedBills,
        );

        saveFinanceSummary(manualDataRef.current);
        saveFinanceBills(normalizedBills);
        saveFinanceCards(revisedCards);
        saveLastSavedTime(savedTime);

        manualBillsRef.current = normalizedBills;
        manualCardsRef.current = revisedCards;
        originalBillsRef.current = normalizedBills.map((bill) =>
          cloneBill(bill),
        );
        originalCardsRef.current = revisedCards.map((card) => ({
          ...card,
        }));
        removedBillsRef.current = [];
        hasUnsavedChangesRef.current = false;

        if (updateUi) {
          setManualBills(normalizedBills);
          setManualCards(revisedCards);
          setLastSaved(savedTime);
          setHasUnsavedChanges(false);

          if (savingIndicatorTimeout.current) {
            clearTimeout(savingIndicatorTimeout.current);
          }

          savingIndicatorTimeout.current = setTimeout(() => {
            setIsAutoSaving(false);
            setShowSavedConfirmation(true);

            if (savedConfirmationTimeout.current) {
              clearTimeout(savedConfirmationTimeout.current);
            }

            savedConfirmationTimeout.current = setTimeout(() => {
              setShowSavedConfirmation(false);
            }, 1800);
          }, 180);
        }

        return true;
      } finally {
        isPersistingChangesRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    manualDataRef.current = manualData;
  }, [manualData]);

  useEffect(() => {
    manualBillsRef.current = manualBills;
  }, [manualBills]);

  useEffect(() => {
    manualCardsRef.current = manualCards;
  }, [manualCards]);

  useEffect(() => {
    if (!hasLoadedStoredStateRef.current || !hasUnsavedChanges) {
      return;
    }

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(() => {
      autosaveTimeout.current = null;
      persistChanges();
    }, editorAutosaveDelay);

    return () => {
      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
        autosaveTimeout.current = null;
      }
    };
  }, [hasUnsavedChanges, manualData, manualBills, manualCards, persistChanges]);

  useEffect(() => {
    const savePendingChanges = () => {
      persistChanges();
    };

    const savePendingChangesBeforeExit = () => {
      persistChanges({ updateUi: false });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        savePendingChanges();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", savePendingChangesBeforeExit);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", savePendingChangesBeforeExit);

      savePendingChangesBeforeExit();

      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
      }

      if (savingIndicatorTimeout.current) {
        clearTimeout(savingIndicatorTimeout.current);
      }

      if (savedConfirmationTimeout.current) {
        clearTimeout(savedConfirmationTimeout.current);
      }

      if (newItemHighlightTimeout.current) {
        clearTimeout(newItemHighlightTimeout.current);
      }
    };
  }, [persistChanges]);

  function markUnsaved() {
    if (savingIndicatorTimeout.current) {
      clearTimeout(savingIndicatorTimeout.current);
      savingIndicatorTimeout.current = null;
    }

    if (savedConfirmationTimeout.current) {
      clearTimeout(savedConfirmationTimeout.current);
      savedConfirmationTimeout.current = null;
    }

    hasUnsavedChangesRef.current = true;
    setIsAutoSaving(false);
    setShowSavedConfirmation(false);
    setHasUnsavedChanges(true);
  }

  function chooseTab(tab: EditorTab) {
    setEditingBalanceField(null);
    setEditingBills([]);
    setEditingCards([]);
    setActiveTab(tab);

    const nextUrl =
      tab === "overview"
        ? isGuidedSetup
          ? "/manual?setup=1"
          : "/manual"
        : isGuidedSetup
          ? `/manual?tab=${tab}&setup=1`
          : `/manual?tab=${tab}`;

    window.history.replaceState(null, "", nextUrl);
  }

  function finishGuidedSetup(
    destination: GuidedSetupDestination = "dashboard",
  ) {
    persistChanges({
      updateUi: destination !== "dashboard",
    });

    window.localStorage.removeItem(guidedSetupStorageKey);
    window.localStorage.setItem(
      guidedSetupCompleteStorageKey,
      "true",
    );

    setIsGuidedSetup(false);
    setGuidedSetupStage("intro");
    setGuidedBalanceTouched({
      checkingBalance: false,
      savingsBalance: false,
    });

    if (destination === "dashboard") {
      window.location.assign("/");
      return;
    }

    const nextTab: EditorTab =
      destination === "bills" ? "bills" : "cards";

    setEditingBalanceField(null);
    setEditingBills([]);
    setEditingCards([]);
    setActiveTab(nextTab);
    window.history.replaceState(null, "", `/manual?tab=${nextTab}`);
  }

  function updateManualData(field: keyof ManualFinanceData, value: string) {
    const nextData = {
      ...manualDataRef.current,
      [field]: value,
    };

    manualDataRef.current = nextData;
    setManualData(nextData);
    markUnsaved();
  }

  function updateBill(
    index: number,
    field: EditableManualBillField,
    value: string,
  ) {
    const nextBills = manualBillsRef.current.map((bill, billIndex) =>
      billIndex === index
        ? {
            ...bill,
            [field]: value,
          }
        : bill,
    );

    manualBillsRef.current = nextBills;
    setManualBills(nextBills);
    markUnsaved();
  }

  function updateBillPaymentSource(
    index: number,
    paymentSource: PaymentSource,
  ) {
    const nextBills = manualBillsRef.current.map((bill, billIndex) =>
      billIndex === index
        ? {
            ...bill,
            paymentMethod: getPaymentMethodLabel(
              paymentSource,
              manualCardsRef.current,
            ),
            paymentSource,
          }
        : bill,
    );

    manualBillsRef.current = nextBills;
    setManualBills(nextBills);
    markUnsaved();
  }

  function updateCard(
    index: number,
    field: keyof ManualCreditCard,
    value: string,
  ) {
    const nextCards = manualCardsRef.current.map((card, cardIndex) =>
      cardIndex === index ? { ...card, [field]: value } : card,
    );

    manualCardsRef.current = nextCards;
    setManualCards(nextCards);
    markUnsaved();
  }

  function addBill() {
    const nextIndex = manualBillsRef.current.length;
    const nextBills = [
      ...manualBillsRef.current,
      {
        id: createPersistentId("bill"),
        name: "",
        amount: "",
        dueDate: "",
        status: "Paid" as const,
        paymentMethod: "Checking",
        paymentSource: { type: "checking" as const },
      },
    ];

    manualBillsRef.current = nextBills;
    setManualBills(nextBills);

    originalBillsRef.current = [...originalBillsRef.current, null];

    setEditingBalanceField(null);
    setEditingCards([]);
    setEditingBills([nextIndex]);
    setNewlyAddedItem({ type: "bill", index: nextIndex });
    setActiveTab("bills");
    window.history.replaceState(null, "", "/manual?tab=bills");
    markUnsaved();
  }

  function removeBill(index: number) {
    const originalBill = originalBillsRef.current[index];

    if (originalBill) {
      removedBillsRef.current = [
        ...removedBillsRef.current,
        cloneBill(originalBill),
      ];
    }

    originalBillsRef.current = originalBillsRef.current.filter(
      (_, billIndex) => billIndex !== index,
    );

    const nextBills = manualBillsRef.current.filter(
      (_, billIndex) => billIndex !== index,
    );

    manualBillsRef.current = nextBills;
    setManualBills(nextBills);

    setEditingBills((current) =>
      current
        .filter((billIndex) => billIndex !== index)
        .map((billIndex) => (billIndex > index ? billIndex - 1 : billIndex)),
    );

    setNewlyAddedItem((current) => {
      if (!current || current.type !== "bill") {
        return current;
      }

      if (current.index === index) {
        return null;
      }

      return current.index > index
        ? { ...current, index: current.index - 1 }
        : current;
    });

    markUnsaved();
  }

  function toggleBillEditing(index: number) {
    setEditingCards([]);
    setEditingBills((current) =>
      current.includes(index) ? [] : [index],
    );
  }

  function addCard() {
    const nextIndex = manualCardsRef.current.length;
    const nextCards = [
      ...manualCardsRef.current,
      {
        id: createPersistentId("card"),
        name: "",
        balance: "",
        balanceRevision: 0,
        limit: "",
        minimumPayment: "0",
        dueDate: "TBD",
        status: "Good" as const,
      },
    ];

    manualCardsRef.current = nextCards;
    setManualCards(nextCards);

    setEditingBalanceField(null);
    setEditingBills([]);
    setEditingCards([nextIndex]);
    setNewlyAddedItem({ type: "card", index: nextIndex });
    setActiveTab("cards");
    window.history.replaceState(null, "", "/manual?tab=cards");
    markUnsaved();
  }

  function removeCard(index: number) {
    const nextCards = manualCardsRef.current.filter(
      (_, cardIndex) => cardIndex !== index,
    );

    manualCardsRef.current = nextCards;
    setManualCards(nextCards);

    setEditingCards((current) =>
      current
        .filter((cardIndex) => cardIndex !== index)
        .map((cardIndex) => (cardIndex > index ? cardIndex - 1 : cardIndex)),
    );

    setNewlyAddedItem((current) => {
      if (!current || current.type !== "card") {
        return current;
      }

      if (current.index === index) {
        return null;
      }

      return current.index > index
        ? { ...current, index: current.index - 1 }
        : current;
    });

    markUnsaved();
  }

  function toggleCardEditing(index: number) {
    setEditingBills([]);
    setEditingCards((current) =>
      current.includes(index) ? [] : [index],
    );
  }

  const sortedManualBills = sortIndexedBillsByDueDay(
    manualBills.map((bill, index) => ({ bill, index })),
  );

  const sortedManualCards = manualCards
    .map((card, index) => ({ card, index }))
    .sort(
      (firstCard, secondCard) =>
        parseMoney(secondCard.card.balance) -
        parseMoney(firstCard.card.balance),
    );

  const cardBalanceTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.balance),
    0,
  );

  const cardLimitTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.limit),
    0,
  );

  const cardUtilization =
    cardLimitTotal > 0
      ? Math.round((cardBalanceTotal / cardLimitTotal) * 100)
      : 0;

  const activeBillIndex =
    editingBills.length > 0
      ? editingBills[editingBills.length - 1]
      : null;

  const activeBill =
    activeBillIndex !== null
      ? manualBills[activeBillIndex] ?? null
      : null;

  const activeCardIndex =
    editingCards.length > 0
      ? editingCards[editingCards.length - 1]
      : null;

  const activeCard =
    activeCardIndex !== null
      ? manualCards[activeCardIndex] ?? null
      : null;

  const activeBalanceEditor =
    editingBalanceField === "checkingBalance"
      ? {
          label: "Checking",
          detail: "Available spending balance",
          value: manualData.checkingBalance,
          icon: <WalletIcon />,
          onChange: (value: string) =>
            updateManualData("checkingBalance", value),
        }
      : editingBalanceField === "savingsBalance"
        ? {
            label: "Savings",
            detail: "Money set aside",
            value: manualData.savingsBalance,
            icon: <SavingsIcon />,
            onChange: (value: string) =>
              updateManualData("savingsBalance", value),
          }
        : editingBalanceField === "monthlyIncome"
          ? {
              label: "Monthly Income",
              detail: "Expected income each month",
              value: manualData.monthlyIncome,
              icon: <IncomeIcon />,
              onChange: (value: string) =>
                updateManualData("monthlyIncome", value),
            }
          : null;

  const saveStatusLabel = isAutoSaving
    ? "Saving"
    : hasUnsavedChanges
      ? "Saving soon"
      : "Saved";

  const saveStatusDetail = isAutoSaving
    ? "Keeping this device current."
    : hasUnsavedChanges
      ? lastSaved
        ? `Changes save after a brief pause • Last saved ${formatSavedTime(lastSaved)}`
        : "Changes save after a brief pause."
      : lastSaved
        ? `Last saved ${formatSavedTime(lastSaved)}`
        : "Everything is current.";

  const hasOpenEditorSheet =
    activeBillIndex !== null ||
    activeCardIndex !== null ||
    Boolean(activeBalanceEditor);

  return (
    <>
      <style>{`
        /* Dark-theme finishing pass: quieter status, clearer secondary text,
           softer tabs, and more breathing room in card rows. */
        html[data-theme]:not([data-theme$="-light"])
          .editor-save-status[data-state="saved"] {
          border-color:
            color-mix(in srgb, var(--theme-text) 7%, transparent);
          background:
            color-mix(
              in srgb,
              var(--theme-row-surface) 34%,
              transparent
            );
          color:
            color-mix(
              in srgb,
              var(--theme-text-secondary) 78%,
              transparent
            );
          box-shadow: none;
          opacity: 0.8;
        }

        html[data-theme]:not([data-theme$="-light"])
          .editor-save-status[data-state="saved"]
          .editor-save-status-dot {
          background:
            color-mix(
              in srgb,
              var(--theme-accent) 58%,
              var(--theme-text-secondary)
            );
          box-shadow: none;
        }

        html[data-theme]:not([data-theme$="-light"])
          .editor-page-header
          p,
        html[data-theme]:not([data-theme$="-light"])
          .editor-browse-summary,
        html[data-theme]:not([data-theme$="-light"])
          .editor-balance-detail,
        html[data-theme]:not([data-theme$="-light"])
          .editor-bill-meta,
        html[data-theme]:not([data-theme$="-light"])
          .editor-card-meta,
        html[data-theme]:not([data-theme$="-light"])
          .editor-pay-schedule-copy
          small,
        html[data-theme]:not([data-theme$="-light"])
          .editor-sheet-context,
        html[data-theme]:not([data-theme$="-light"])
          .editor-sheet-save-note {
          color:
            color-mix(
              in srgb,
              var(--theme-text-secondary) 84%,
              var(--theme-text) 16%
            );
        }

        html[data-theme]:not([data-theme$="-light"])
          .editor-sheet-field-label {
          color:
            color-mix(
              in srgb,
              var(--theme-text-secondary) 86%,
              var(--theme-text) 14%
            );
        }

        html[data-theme]:not([data-theme$="-light"])
          .editor-tab-button {
          color:
            color-mix(
              in srgb,
              var(--theme-muted) 88%,
              var(--theme-text) 12%
            );
        }

        html[data-theme]:not([data-theme$="-light"])
          .editor-tab-button-active {
          border-color:
            color-mix(
              in srgb,
              var(--theme-accent) 14%,
              var(--theme-border-default)
            );
          background:
            linear-gradient(
              145deg,
              color-mix(
                in srgb,
                var(--theme-highlight) 18%,
                transparent
              ),
              transparent 62%
            ),
            color-mix(
              in srgb,
              var(--theme-accent) 4%,
              var(--theme-surface-control)
            );
          box-shadow:
            0 3px 10px
              color-mix(
                in srgb,
                var(--theme-shadow) 10%,
                transparent
              ),
            inset 0 1px 0
              color-mix(
                in srgb,
                var(--theme-highlight) 64%,
                transparent
              );
        }

        .editor-card-trailing {
          display: flex;
          min-width: 4.9rem;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 0.48rem;
        }

        .editor-card-trailing .editor-card-balance {
          line-height: 1.05;
        }

        .editor-card-trailing .editor-card-action {
          min-width: 3.05rem;
        }

        @media (max-width: 370px) {
          .editor-card-trailing {
            min-width: 4.45rem;
            gap: 0.42rem;
          }

          .editor-card-trailing .editor-card-action {
            min-width: 2.82rem;
          }
        }
      `}</style>

      {isGuidedSetup || hasOpenEditorSheet ? (
        <style>{`
          .bottom-tab-shell,
          .bottom-tab-spacer {
            display: none !important;
          }

          .editor-bill-sheet-panel {
            min-height: auto;
            max-height: min(88dvh, 42rem);
            padding-bottom:
              calc(0.9rem + env(safe-area-inset-bottom));
          }

          .editor-bill-sheet-panel .editor-sheet-field {
            min-height: 3.05rem;
            padding-top: 0.68rem;
            padding-bottom: 0.68rem;
          }

          .editor-sheet-compact-value {
            width: min(100%, 10rem);
            justify-self: end;
          }

          .editor-sheet-editable-control {
            border: 1px solid
              color-mix(in srgb, var(--theme-text) 9%, transparent);
            border-radius: 0.72rem;
            background:
              color-mix(
                in srgb,
                var(--theme-surface-control) 72%,
                transparent
              );
            transition:
              border-color 160ms ease,
              background 160ms ease,
              box-shadow 160ms ease,
              transform 160ms ease;
          }

          .editor-sheet-field:focus-within
            .editor-sheet-editable-control {
            border-color:
              color-mix(
                in srgb,
                var(--theme-accent) 48%,
                var(--theme-border-default)
              );
            background:
              color-mix(
                in srgb,
                var(--theme-accent) 8%,
                var(--theme-surface-control)
              );
            box-shadow:
              0 0 0 3px
                color-mix(
                  in srgb,
                  var(--theme-accent) 10%,
                  transparent
                );
          }

          .editor-sheet-field-input.editor-sheet-editable-control {
            min-height: 2.48rem;
            padding: 0.46rem 0.58rem 0.54rem;
            line-height: 1.28;
          }

          .editor-sheet-text-control {
            display: flex;
            min-width: 0;
            min-height: 2.86rem;
            align-items: center;
            justify-content: flex-end;
            padding: 0.3rem 0.58rem 0.48rem;
            overflow: visible;
          }

          .editor-sheet-text-control
            .editor-sheet-field-input {
            width: 100%;
            height: auto;
            min-height: 2.08rem;
            padding: 0 0 0.32rem;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            font-family: inherit;
            line-height: 1.5;
            overflow: visible;
            -webkit-appearance: none;
            appearance: none;
          }

          .editor-sheet-money-control.editor-sheet-editable-control,
          .editor-sheet-select-control.editor-sheet-editable-control {
            min-height: 2.35rem;
            padding: 0.34rem 0.52rem;
          }

          .editor-sheet-money-control.editor-sheet-editable-control
            .editor-sheet-field-input {
            min-height: 0;
            padding: 0;
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
          }

          .editor-sheet-field-input,
          .editor-sheet-select {
            outline: none;
          }

          @media (prefers-reduced-motion: reduce) {
            .editor-sheet-editable-control {
              transition: none;
            }
          }
        `}</style>
      ) : null}

      <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="dashboard-intro editor-page-header motion-card mb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[2.15rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-4xl">
                Editor
              </h1>

              <p className="mt-1 max-w-[28rem] text-sm leading-6 text-stone-400">
                Update balances, bills, and cards.
              </p>
            </div>

            <EditorSaveStatus
              label={saveStatusLabel}
              detail={saveStatusDetail}
              isSaving={isAutoSaving}
              hasPendingChanges={hasUnsavedChanges}
              wasJustSaved={showSavedConfirmation}
            />
          </div>
        </header>

        <section
          className="editor-tab-shell motion-card motion-card-delay-1 mb-2"
          style={{
            borderRadius: "1.2rem",
            padding: "0.28rem",
          }}
        >
          <div
            className="editor-tab-control"
            role="tablist"
            aria-label="Financial setup sections"
          >
            <EditorTabButton
              label="Balances"
              icon={<BalanceIcon />}
              active={activeTab === "overview"}
              onClick={() => chooseTab("overview")}
            />

            <EditorTabButton
              label="Bills"
              icon={<BillsEditorIcon />}
              active={activeTab === "bills"}
              onClick={() => chooseTab("bills")}
            />

            <EditorTabButton
              label="Cards"
              icon={<CardsEditorIcon />}
              active={activeTab === "cards"}
              onClick={() => chooseTab("cards")}
            />
          </div>
        </section>

        {activeTab === "overview" && (
          <section
            className="editor-browse-section editor-balances-section motion-card motion-card-delay-3"
            style={{ borderRadius: "1.2rem" }}
          >
            <div className="editor-browse-header">
              <div className="min-w-0">
                <SectionHeading title="Balances" icon="balances" />

                <p className="editor-browse-summary">
                  The numbers behind your money plan.
                </p>
              </div>

              <span
                className="shrink-0 text-xs font-semibold"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                3 values
              </span>
            </div>

            <div className="editor-balances-list">
              <BalanceEditorCard
                label="Checking"
                detail="Available spending balance"
                value={manualData.checkingBalance}
                icon={<WalletIcon />}
                isEditing={editingBalanceField === "checkingBalance"}
                onEdit={() =>
                  setEditingBalanceField(
                    editingBalanceField === "checkingBalance"
                      ? null
                      : "checkingBalance",
                  )
                }
              />

              <BalanceEditorCard
                label="Savings"
                detail="Money set aside"
                value={manualData.savingsBalance}
                icon={<SavingsIcon />}
                isEditing={editingBalanceField === "savingsBalance"}
                onEdit={() =>
                  setEditingBalanceField(
                    editingBalanceField === "savingsBalance"
                      ? null
                      : "savingsBalance",
                  )
                }
              />

              <BalanceEditorCard
                label="Monthly income"
                detail="Expected income each month"
                value={manualData.monthlyIncome}
                icon={<IncomeIcon />}
                isEditing={editingBalanceField === "monthlyIncome"}
                onEdit={() =>
                  setEditingBalanceField(
                    editingBalanceField === "monthlyIncome"
                      ? null
                      : "monthlyIncome",
                  )
                }
              />

              <Link
                href="/account/preferences"
                className="editor-pay-schedule-row pressable"
              >
                <span className="editor-balance-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>

                <span className="editor-pay-schedule-copy">
                  <strong>Pay schedule</strong>
                  <small>Next payday and pay frequency.</small>
                </span>

                <span className="editor-pay-schedule-action">Edit</span>
              </Link>
            </div>
          </section>
        )}

        {activeTab === "bills" && (
          <section
            className="editor-browse-section editor-bills-section motion-card motion-card-delay-3"
            style={{ borderRadius: "1.2rem" }}
          >
            <div className="editor-browse-header">
              <div className="min-w-0">
                <SectionHeading title="Bills" icon="bills" />

                <p className="editor-browse-summary">
                  {manualBills.length} recurring bill
                  {manualBills.length === 1 ? "" : "s"} · Sorted by due day
                </p>
              </div>

              <button
                type="button"
                onClick={addBill}
                className="editor-add-button pressable"
              >
                <span aria-hidden="true">+</span>
                Add bill
              </button>
            </div>

            <div className="editor-bills-list">
              {manualBills.length > 0 ? (
                sortedManualBills.map(({ bill, index }) => (
                  <BillEditorRow
                    key={`bill-${index}`}
                    itemIndex={index}
                    bill={bill}
                    cards={manualCards}
                    isEditing={editingBills.includes(index)}
                    isDimmed={
                      editingBills.length > 0 && !editingBills.includes(index)
                    }
                    isNewlyAdded={
                      newlyAddedItem?.type === "bill" &&
                      newlyAddedItem.index === index
                    }
                    onToggleEditing={() => toggleBillEditing(index)}
                    onRemove={() => removeBill(index)}
                    onChange={(field, value) =>
                      updateBill(index, field, value)
                    }
                    onPaymentSourceChange={(paymentSource) =>
                      updateBillPaymentSource(index, paymentSource)
                    }
                  />
                ))
              ) : (
                <EmptyState
                  title="No bills yet"
                  text="Add your first bill to start building your monthly view."
                />
              )}
            </div>
          </section>
        )}

        {activeTab === "cards" && (
          <section
            className="editor-browse-section editor-cards-section motion-card motion-card-delay-3"
            style={{ borderRadius: "1.2rem" }}
          >
            <div className="editor-browse-header">
              <div className="min-w-0">
                <SectionHeading title="Credit cards" icon="cards" />

                <p className="editor-browse-summary">
                  {manualCards.length} card
                  {manualCards.length === 1 ? "" : "s"} · {cardUtilization}%
                  utilization
                </p>
              </div>

              <button
                type="button"
                onClick={addCard}
                className="editor-add-button pressable"
              >
                <span aria-hidden="true">+</span>
                Add card
              </button>
            </div>

            <div className="editor-cards-list">
              {manualCards.length > 0 ? (
                sortedManualCards.map(({ card, index }) => (
                  <CardEditorRow
                    key={`card-${index}`}
                    itemIndex={index}
                    card={card}
                    isEditing={editingCards.includes(index)}
                    isDimmed={
                      editingCards.length > 0 && !editingCards.includes(index)
                    }
                    isNewlyAdded={
                      newlyAddedItem?.type === "card" &&
                      newlyAddedItem.index === index
                    }
                    onToggleEditing={() => toggleCardEditing(index)}
                    onRemove={() => removeCard(index)}
                    onChange={(field, value) =>
                      updateCard(index, field, value)
                    }
                  />
                ))
              ) : (
                <EmptyState
                  title="No credit cards yet"
                  text="Add a card to start tracking balances, limits, and utilization."
                />
              )}
            </div>
          </section>
        )}
      </div>
      </PageShell>

      {isGuidedSetup ? (
        <GuidedSetupOverlay
          stage={guidedSetupStage}
          manualData={manualData}
          touched={guidedBalanceTouched}
          onStageChange={setGuidedSetupStage}
          onCheckingChange={(value) => {
            setGuidedBalanceTouched((current) => ({
              ...current,
              checkingBalance: true,
            }));
            updateManualData("checkingBalance", value);
          }}
          onSavingsChange={(value) => {
            setGuidedBalanceTouched((current) => ({
              ...current,
              savingsBalance: true,
            }));
            updateManualData("savingsBalance", value);
          }}
          onFinish={finishGuidedSetup}
        />
      ) : null}

      {activeBillIndex !== null && activeBill ? (
        <BillEditorSheet
          key={`bill-editor-sheet-${activeBill.id ?? activeBillIndex}`}
          bill={activeBill}
          cards={manualCards}
          onClose={() => setEditingBills([])}
          onRemove={() => removeBill(activeBillIndex)}
          onChange={(field, value) =>
            updateBill(activeBillIndex, field, value)
          }
          onPaymentSourceChange={(paymentSource) =>
            updateBillPaymentSource(activeBillIndex, paymentSource)
          }
        />
      ) : null}

      {activeCardIndex !== null && activeCard ? (
        <CardEditorSheet
          key={`card-editor-sheet-${activeCard.id ?? activeCardIndex}`}
          card={activeCard}
          onClose={() => setEditingCards([])}
          onRemove={() => removeCard(activeCardIndex)}
          onChange={(field, value) =>
            updateCard(activeCardIndex, field, value)
          }
        />
      ) : null}

      {activeBalanceEditor ? (
        <BalanceEditorSheet
          key={`balance-editor-sheet-${editingBalanceField}`}
          label={activeBalanceEditor.label}
          detail={activeBalanceEditor.detail}
          value={activeBalanceEditor.value}
          icon={activeBalanceEditor.icon}
          onClose={() => setEditingBalanceField(null)}
          onChange={activeBalanceEditor.onChange}
        />
      ) : null}
    </>
  );
}

function GuidedSetupOverlay({
  stage,
  manualData,
  touched,
  onStageChange,
  onCheckingChange,
  onSavingsChange,
  onFinish,
}: {
  stage: GuidedSetupStage;
  manualData: ManualFinanceData;
  touched: GuidedBalanceTouched;
  onStageChange: (stage: GuidedSetupStage) => void;
  onCheckingChange: (value: string) => void;
  onSavingsChange: (value: string) => void;
  onFinish: (destination?: GuidedSetupDestination) => void;
}) {
  const stepNumber =
    stage === "intro" ? 1 : stage === "balances" ? 2 : 3;

  const checkingIsValid =
    touched.checkingBalance &&
    manualData.checkingBalance.trim() !== "" &&
    Number.isFinite(Number(manualData.checkingBalance));

  const savingsIsValid =
    touched.savingsBalance &&
    manualData.savingsBalance.trim() !== "" &&
    Number.isFinite(Number(manualData.savingsBalance));

  const balancesAreReady = checkingIsValid && savingsIsValid;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/52 px-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-[max(0.65rem,env(safe-area-inset-top))] backdrop-blur-[12px] backdrop-saturate-110 sm:items-center sm:p-6"
      aria-hidden="false"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-setup-title"
        aria-describedby="guided-setup-description"
        className="relative flex max-h-[calc(100dvh-1.3rem)] w-full max-w-[34rem] flex-col overflow-hidden rounded-[1.85rem] border text-[color:var(--theme-text)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2rem]"
        style={{
          borderColor:
            "color-mix(in srgb, var(--theme-border-strong) 72%, var(--theme-border-default))",
          background:
            "radial-gradient(circle at 10% 0%, color-mix(in srgb, var(--theme-accent) 11%, transparent), transparent 34%), linear-gradient(145deg, color-mix(in srgb, var(--theme-highlight) 48%, transparent), transparent 52%), var(--theme-surface-sheet)",
          boxShadow:
            "0 30px 90px color-mix(in srgb, var(--theme-shadow) 72%, transparent), inset 0 1px 0 var(--theme-highlight)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
          style={{
            background:
              "color-mix(in srgb, var(--theme-accent) 15%, transparent)",
          }}
          aria-hidden="true"
        />

        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3.5 sm:px-5 sm:pt-5">
          <div
            className="mx-auto mb-3 h-1 w-10 rounded-full sm:hidden"
            style={{
              background:
                "color-mix(in srgb, var(--theme-muted) 34%, transparent)",
            }}
            aria-hidden="true"
          />

          <header className="flex items-start justify-between gap-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: "var(--theme-accent)",
                    boxShadow:
                      "0 0 0 5px color-mix(in srgb, var(--theme-accent) 10%, transparent), 0 0 18px color-mix(in srgb, var(--theme-accent) 28%, transparent)",
                  }}
                  aria-hidden="true"
                />

                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                  style={{
                    color:
                      "color-mix(in srgb, var(--theme-accent) 82%, var(--theme-text))",
                  }}
                >
                  Guided setup
                </p>
              </div>

              <h1
                id="guided-setup-title"
                className="mt-2 text-[1.62rem] font-bold leading-[1.04] tracking-[-0.04em] sm:text-[2rem]"
              >
                {stage === "intro"
                  ? "Let’s build your starting point."
                  : stage === "balances"
                    ? "What do you have right now?"
                    : "Your starting point is ready."}
              </h1>

              <p
                id="guided-setup-description"
                className="mt-2 max-w-[29rem] text-[0.8rem] leading-5 sm:text-sm sm:leading-6"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                {stage === "intro"
                  ? "Start with two real numbers. Everything else can be added when you feel ready."
                  : stage === "balances"
                    ? "Enter your current checking and savings balances. Both can be $0."
                    : "Your balances are saved. Add more now, or head straight to your Dashboard."}
              </p>
            </div>

            <span
              className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                borderColor: "var(--theme-border-default)",
                background: "var(--theme-surface-control)",
                color: "var(--theme-text-secondary)",
              }}
            >
              {stepNumber} of 3
            </span>
          </header>

          <div
            className="mt-3.5 h-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-label="Guided setup progress"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={stepNumber}
            style={{
              background:
                "color-mix(in srgb, var(--theme-text) 8%, transparent)",
            }}
          >
            <span
              className="block h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.round((stepNumber / 3) * 100)}%`,
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--theme-accent) 72%, var(--theme-text) 4%), var(--theme-accent))",
              }}
            />
          </div>

          {stage === "intro" ? (
            <div className="mt-3.5 grid gap-2">
              <SetupOverviewCard
                icon={<WalletIcon />}
                title="Balances"
                badge="Required"
                detail="Enter checking and savings so leftovr starts with your real money."
                emphasized
              />

              <SetupOverviewCard
                icon={<BillsEditorIcon />}
                title="Bills"
                badge="Optional"
                detail="Add recurring payments now or return after you explore the app."
              />

              <SetupOverviewCard
                icon={<CardsEditorIcon />}
                title="Credit Cards"
                badge="Optional"
                detail="Track balances, limits, and utilization whenever you’re ready."
              />
            </div>
          ) : null}

          {stage === "balances" ? (
            <div className="mt-3.5 grid gap-2.5">
              <GuidedMoneyField
                label="Checking balance"
                detail="What is currently available to spend?"
                value={manualData.checkingBalance}
                touched={touched.checkingBalance}
                valid={checkingIsValid}
                icon={<WalletIcon />}
                onChange={onCheckingChange}
              />

              <GuidedMoneyField
                label="Savings balance"
                detail="What is currently set aside?"
                value={manualData.savingsBalance}
                touched={touched.savingsBalance}
                valid={savingsIsValid}
                icon={<SavingsIcon />}
                onChange={onSavingsChange}
              />

              <div
                className="flex items-start gap-2.5 rounded-[1rem] border px-3 py-2.5"
                style={{
                  borderColor: "var(--theme-border-subtle)",
                  background: "var(--theme-surface-inset)",
                }}
              >
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{
                    background:
                      "color-mix(in srgb, var(--theme-accent) 12%, transparent)",
                    color: "var(--theme-accent)",
                  }}
                  aria-hidden="true"
                >
                  ✓
                </span>

                <p
                  className="text-xs leading-5"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  These numbers save automatically and can be changed anytime.
                </p>
              </div>
            </div>
          ) : null}

          {stage === "optional" ? (
            <div className="mt-3.5 grid gap-2.5">
              <SetupChoiceCard
                icon={<BillsEditorIcon />}
                title="Add Bills"
                detail="Organize recurring payments and due dates."
                action="Add now"
                onClick={() => onFinish("bills")}
              />

              <SetupChoiceCard
                icon={<CardsEditorIcon />}
                title="Add Credit Cards"
                detail="Track balances, limits, and utilization."
                action="Add now"
                onClick={() => onFinish("cards")}
              />

              <p
                className="px-1 pb-2 text-center text-[11px] leading-5"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                Bills and credit cards are completely optional. You can add them
                later from the Editor.
              </p>
            </div>
          ) : null}
        </div>

        <footer
          className="relative z-10 flex shrink-0 items-center gap-2 border-t px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-5"
          style={{
            borderColor: "var(--theme-divider)",
            background:
              "color-mix(in srgb, var(--theme-surface-sheet) 96%, transparent)",
            boxShadow:
              "0 -12px 30px color-mix(in srgb, var(--theme-shadow) 18%, transparent)",
          }}
        >
          {stage !== "intro" ? (
            <button
              type="button"
              onClick={() =>
                onStageChange(stage === "optional" ? "balances" : "intro")
              }
              className="pressable rounded-full border px-4 py-2.5 text-sm font-semibold"
              style={{
                borderColor: "var(--theme-border-default)",
                background: "var(--theme-surface-control)",
                color: "var(--theme-text-secondary)",
              }}
            >
              Back
            </button>
          ) : null}

          {stage === "intro" ? (
            <button
              type="button"
              onClick={() => onStageChange("balances")}
              className="pressable ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold sm:flex-none sm:min-w-[12rem]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--theme-accent) 36%, var(--theme-border-default))",
                background:
                  "color-mix(in srgb, var(--theme-accent) 14%, var(--theme-surface-control))",
                color: "var(--theme-text)",
              }}
            >
              Start with balances
              <ChevronRightIcon />
            </button>
          ) : stage === "balances" ? (
            <button
              type="button"
              disabled={!balancesAreReady}
              onClick={() => onStageChange("optional")}
              className="pressable ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:min-w-[12rem]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--theme-accent) 36%, var(--theme-border-default))",
                background:
                  "color-mix(in srgb, var(--theme-accent) 14%, var(--theme-surface-control))",
                color: "var(--theme-text)",
              }}
            >
              Save starting point
              <ChevronRightIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onFinish("dashboard")}
              className="pressable ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold sm:flex-none sm:min-w-[12rem]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--theme-accent) 36%, var(--theme-border-default))",
                background:
                  "color-mix(in srgb, var(--theme-accent) 14%, var(--theme-surface-control))",
                color: "var(--theme-text)",
              }}
            >
              Open Dashboard
              <ChevronRightIcon />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function SetupOverviewCard({
  icon,
  title,
  badge,
  detail,
  emphasized = false,
}: {
  icon: ReactNode;
  title: string;
  badge: string;
  detail: string;
  emphasized?: boolean;
}) {
  return (
    <article
      className="flex items-center gap-3 rounded-[1.15rem] border p-3"
      style={{
        borderColor: emphasized
          ? "color-mix(in srgb, var(--theme-accent) 30%, var(--theme-border-default))"
          : "var(--theme-border-default)",
        background: emphasized
          ? "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-row))"
          : "var(--theme-surface-row)",
        boxShadow:
          "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 72%, transparent)",
      }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] border"
        style={{
          borderColor:
            "color-mix(in srgb, var(--theme-accent) 22%, var(--theme-border-default))",
          background:
            "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
          color: "var(--theme-accent)",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{title}</h2>

          <span
            className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{
              borderColor: emphasized
                ? "color-mix(in srgb, var(--theme-accent) 28%, var(--theme-border-default))"
                : "var(--theme-border-subtle)",
              color: emphasized
                ? "color-mix(in srgb, var(--theme-accent) 82%, var(--theme-text))"
                : "var(--theme-text-tertiary)",
            }}
          >
            {badge}
          </span>
        </div>

        <p
          className="mt-1 text-xs leading-5"
          style={{ color: "var(--theme-text-secondary)" }}
        >
          {detail}
        </p>
      </div>
    </article>
  );
}

function GuidedMoneyField({
  label,
  detail,
  value,
  touched,
  valid,
  icon,
  onChange,
}: {
  label: string;
  detail: string;
  value: string;
  touched: boolean;
  valid: boolean;
  icon: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className="grid gap-3 rounded-[1.2rem] border p-3.5"
      style={{
        borderColor: valid
          ? "color-mix(in srgb, var(--theme-accent) 32%, var(--theme-border-default))"
          : "var(--theme-border-default)",
        background: "var(--theme-surface-row)",
        boxShadow:
          "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 72%, transparent)",
      }}
    >
      <span className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] border"
          style={{
            borderColor:
              "color-mix(in srgb, var(--theme-accent) 22%, var(--theme-border-default))",
            background:
              "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
            color: "var(--theme-accent)",
          }}
          aria-hidden="true"
        >
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <strong className="text-sm font-semibold">{label}</strong>

            {touched ? (
              <span
                className="text-[10px] font-semibold"
                style={{
                  color: valid
                    ? "var(--theme-accent)"
                    : "var(--theme-text-tertiary)",
                }}
              >
                {valid ? "Ready" : "Enter a value"}
              </span>
            ) : (
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--theme-text-tertiary)" }}
              >
                Required
              </span>
            )}
          </span>

          <span
            className="mt-1 block text-xs leading-5"
            style={{ color: "var(--theme-text-secondary)" }}
          >
            {detail}
          </span>
        </span>
      </span>

      <span
        className="flex items-center rounded-[1rem] border px-3 py-2.5 focus-within:ring-2"
        style={{
          borderColor: "var(--theme-border-default)",
          background: "var(--theme-surface-inset)",
          color: "var(--theme-text)",
          boxShadow:
            "inset 0 1px 2px color-mix(in srgb, var(--theme-shadow) 16%, transparent)",
        }}
      >
        <span
          className="mr-2 text-lg font-semibold"
          style={{ color: "var(--theme-accent)" }}
          aria-hidden="true"
        >
          $
        </span>

        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder="0.00"
          aria-label={label}
          onFocus={(event) => {
            if (value === "0" || value === "0.00") {
              event.currentTarget.select();
            }
          }}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-right text-[1.35rem] font-semibold tracking-[-0.03em] outline-none placeholder:opacity-35"
          style={{ color: "var(--theme-text)" }}
        />
      </span>
    </label>
  );
}

function SetupChoiceCard({
  icon,
  title,
  detail,
  action,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex w-full items-center gap-3 rounded-[1.15rem] border p-3 text-left"
      style={{
        borderColor: "var(--theme-border-default)",
        background: "var(--theme-surface-row)",
        color: "var(--theme-text)",
        boxShadow:
          "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 72%, transparent)",
      }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] border"
        style={{
          borderColor:
            "color-mix(in srgb, var(--theme-accent) 22%, var(--theme-border-default))",
          background:
            "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
          color: "var(--theme-accent)",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold">{title}</strong>

        <span
          className="mt-1 block text-xs leading-5"
          style={{ color: "var(--theme-text-secondary)" }}
        >
          {detail}
        </span>
      </span>

      <span
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold"
        style={{ color: "var(--theme-accent)" }}
      >
        {action}
        <ChevronRightIcon />
      </span>
    </button>
  );
}

function EditorSaveStatus({
  label,
  detail,
  isSaving,
  hasPendingChanges,
  wasJustSaved,
}: {
  label: string;
  detail: string;
  isSaving: boolean;
  hasPendingChanges: boolean;
  wasJustSaved: boolean;
}) {
  const state = isSaving
    ? "saving"
    : hasPendingChanges
      ? "pending"
      : wasJustSaved
        ? "confirmed"
        : "saved";

  return (
    <div
      className="editor-save-status"
      data-state={state}
      aria-live="polite"
      title={detail}
      style={{
        minHeight: "2rem",
        padding: "0.42rem 0.7rem",
        borderRadius: "999px",
      }}
    >
      <span className="editor-save-status-dot" aria-hidden="true" />

      <span className="editor-save-status-label">{label}</span>
    </div>
  );
}

function EditorTabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`editor-tab-button pressable ${
        active ? "editor-tab-button-active" : ""
      }`}
      style={{
        minHeight: "2.8rem",
        padding: "0.58rem 0.5rem",
        borderRadius: "0.92rem",
      }}
    >
      <span className="editor-tab-icon" aria-hidden="true">
        {icon}
      </span>

      <span className="editor-tab-label">{label}</span>
    </button>
  );
}

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: "balances" | "bills" | "cards";
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.68rem] border"
        style={{
          borderColor: "var(--theme-border-default)",
          background:
            "color-mix(in srgb, var(--theme-accent) 6%, var(--theme-surface-control))",
          color: "var(--theme-accent)",
        }}
        aria-hidden="true"
      >
        {icon === "balances" ? (
          <BalanceIcon />
        ) : icon === "bills" ? (
          <BillsEditorIcon />
        ) : (
          <CardsEditorIcon />
        )}
      </span>

      <h2
        style={{
          color: "var(--theme-text)",
          fontSize: "1.02rem",
          fontWeight: 650,
          letterSpacing: "-0.012em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function BillEditorRow({
  itemIndex,
  bill,
  cards,
  isEditing,
  isDimmed,
  isNewlyAdded,
  onToggleEditing,
  onRemove: _onRemove,
  onChange: _onChange,
  onPaymentSourceChange: _onPaymentSourceChange,
}: {
  itemIndex: number;
  bill: ManualBill;
  cards: ManualCreditCard[];
  isEditing: boolean;
  isDimmed: boolean;
  isNewlyAdded: boolean;
  onToggleEditing: () => void;
  onRemove: () => void;
  onChange: (field: EditableManualBillField, value: string) => void;
  onPaymentSourceChange: (paymentSource: PaymentSource) => void;
}) {
  return (
    <article
      data-editor-item={`bill-${itemIndex}`}
      className={`editor-bill-card scroll-mt-28 ${
        isEditing ? "editor-bill-card-open" : ""
      } ${isNewlyAdded ? "editor-bill-card-new" : ""} ${
        isDimmed ? "editor-bill-card-dimmed" : ""
      }`}
    >
      <div className="editor-bill-summary">
        <span className="editor-bill-icon" aria-hidden="true">
          <BillsEditorIcon />
        </span>

        <div className="editor-bill-copy">
          <div className="editor-bill-heading">
            <p className="editor-bill-name">
              {bill.name || "Untitled Bill"}
            </p>

            <p className="editor-bill-amount">
              {formatMoney(bill.amount)}
            </p>
          </div>

          <p className="editor-bill-meta">
            <span>
              {bill.dueDate
                ? `Due ${formatOrdinalDay(bill.dueDate)}`
                : "Due day not set"}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {getPaymentSourceLabel(bill.paymentSource, cards)}
            </span>
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isEditing}
          aria-label={`Edit ${bill.name || "bill"}`}
          onClick={onToggleEditing}
          className="editor-bill-action pressable"
        >
          Edit
        </button>
      </div>
    </article>
  );
}

function BillEditorSheet({
  bill,
  cards,
  onClose,
  onRemove,
  onChange,
  onPaymentSourceChange,
}: {
  bill: ManualBill;
  cards: ManualCreditCard[];
  onClose: () => void;
  onRemove: () => void;
  onChange: (field: EditableManualBillField, value: string) => void;
  onPaymentSourceChange: (paymentSource: PaymentSource) => void;
}) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function confirmRemove() {
    setShowRemoveConfirm(false);
    onRemove();
  }

  return (
    <div className="editor-sheet-layer">
      <button
        type="button"
        aria-label="Close bill editor"
        className="editor-sheet-backdrop"
        onClick={onClose}
      />

      <section
        className="editor-sheet-panel editor-standard-sheet-panel editor-bill-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-editor-sheet-title"
      >
        <div className="editor-sheet-handle" aria-hidden="true" />

        <div className="editor-sheet-header">
          <div className="editor-sheet-title-group">
            <span className="editor-sheet-icon" aria-hidden="true">
              <BillsEditorIcon />
            </span>

            <div className="min-w-0">
              <p
                className="editor-sheet-eyebrow"
                style={{
                  letterSpacing: "0.06em",
                  textTransform: "none",
                }}
              >
                Bill details
              </p>

              <h2
                id="bill-editor-sheet-title"
                className="editor-sheet-title"
              >
                {bill.name || "New Bill"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="editor-sheet-done pressable"
          >
            <CheckIcon />
            Done
          </button>
        </div>

        <div className="editor-sheet-intro">
          <p className="editor-sheet-context">
            Monthly bill
          </p>

          <p className="editor-sheet-save-note">
            Changes save automatically.
          </p>
        </div>

        <div className="editor-sheet-form">
          <SheetTextInput
            label="Bill name"
            value={bill.name}
            placeholder="Phone, rent, insurance..."
            onChange={(value) => onChange("name", value)}
          />

          <SheetMoneyInput
            label="Amount"
            value={bill.amount}
            placeholder="0.00"
            compact
            onChange={(value) => onChange("amount", value)}
          />

          <SheetDueDayInput
            value={bill.dueDate}
            onChange={(value) => onChange("dueDate", value)}
          />

          <SheetPaymentSourceSelect
            value={bill.paymentSource ?? { type: "checking" }}
            cards={cards}
            onChange={onPaymentSourceChange}
          />
        </div>

        {showRemoveConfirm ? (
          <div className="editor-sheet-remove-confirm">
            <div>
              <p className="editor-sheet-remove-title">
                Remove this bill?
              </p>

              <p className="editor-sheet-remove-copy">
                This cannot be undone after it saves.
              </p>
            </div>

            <div className="editor-sheet-remove-actions">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="editor-sheet-remove-cancel pressable"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                className="editor-sheet-remove-confirm-button pressable"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(true)}
            className="editor-sheet-remove-link pressable"
          >
            <TrashIcon />
            Remove bill
          </button>
        )}
      </section>
    </div>
  );
}

function SheetTextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="editor-sheet-field">
      <span
        className="editor-sheet-field-label"
        style={{
          letterSpacing: "0.01em",
          textTransform: "none",
        }}
      >
        {label}
      </span>

      <span className="editor-sheet-text-control editor-sheet-editable-control">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="editor-sheet-field-input"
        />
      </span>
    </label>
  );
}

function SheetDueDayInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const normalizedValue = normalizeMonthlyDueDay(value);

  return (
    <label className="editor-sheet-field">
      <span
        className="editor-sheet-field-label"
        style={{
          letterSpacing: "0.01em",
          textTransform: "none",
        }}
      >
        Due day each month
      </span>

      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={31}
        step={1}
        value={normalizedValue}
        placeholder="16"
        aria-label="Due day each month, from 1 through 31"
        onChange={(event) => {
          const nextValue = sanitizeMonthlyDueDayInput(
            event.target.value,
          );

          if (nextValue !== null) {
            onChange(nextValue);
          }
        }}
        className="editor-sheet-field-input editor-sheet-editable-control editor-sheet-compact-value"
      />
    </label>
  );
}

function SheetMoneyInput({
  label,
  value,
  placeholder,
  compact = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  compact?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="editor-sheet-field">
      <span
        className="editor-sheet-field-label"
        style={{
          letterSpacing: "0.01em",
          textTransform: "none",
        }}
      >
        {label}
      </span>

      <span
        className={`editor-sheet-money-control editor-sheet-editable-control ${
          compact ? "editor-sheet-compact-value" : ""
        }`}
      >
        <span aria-hidden="true">$</span>

        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onFocus={() => clearZeroOnFocus(value, onChange)}
          onChange={(event) => onChange(event.target.value)}
          className="editor-sheet-field-input"
        />
      </span>
    </label>
  );
}

function SheetPaymentSourceSelect({
  value,
  cards,
  onChange,
}: {
  value: PaymentSource;
  cards: ManualCreditCard[];
  onChange: (paymentSource: PaymentSource) => void;
}) {
  const selectedValue =
    value.type === "credit-card"
      ? `credit-card:${value.creditCardId}`
      : "checking";

  function handleChange(nextValue: string) {
    if (nextValue === "checking") {
      onChange({ type: "checking" });
      return;
    }

    const creditCardId = nextValue.replace("credit-card:", "");

    if (creditCardId) {
      onChange({
        type: "credit-card",
        creditCardId,
      });
    }
  }

  return (
    <label className="editor-sheet-field">
      <span
        className="editor-sheet-field-label"
        style={{
          letterSpacing: "0.01em",
          textTransform: "none",
        }}
      >
        Paid from
      </span>

      <span className="editor-sheet-select-control editor-sheet-editable-control">
        <select
          value={selectedValue}
          onChange={(event) => handleChange(event.target.value)}
          className="editor-sheet-select"
          aria-label="Payment source"
        >
          <option value="checking">Checking account</option>

          {cards.map((card, index) =>
            card.id ? (
              <option key={card.id} value={`credit-card:${card.id}`}>
                {card.name.trim() || `Credit Card ${index + 1}`}
              </option>
            ) : null,
          )}
        </select>

        <ChevronDownIcon />
      </span>
    </label>
  );
}


function CardEditorRow({
  itemIndex,
  card,
  isEditing,
  isDimmed,
  isNewlyAdded,
  onToggleEditing,
  onRemove: _onRemove,
  onChange: _onChange,
}: {
  itemIndex: number;
  card: ManualCreditCard;
  isEditing: boolean;
  isDimmed: boolean;
  isNewlyAdded: boolean;
  onToggleEditing: () => void;
  onRemove: () => void;
  onChange: (field: keyof ManualCreditCard, value: string) => void;
}) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;
  const availableCredit = Math.max(limit - balance, 0);
  const isPaidOff = balance <= 0.005;

  return (
    <article
      data-editor-item={`card-${itemIndex}`}
      className={`editor-card-row scroll-mt-28 ${
        isEditing ? "editor-card-row-open" : ""
      } ${isNewlyAdded ? "editor-card-row-new" : ""} ${
        isDimmed ? "editor-card-row-dimmed" : ""
      }`}
    >
      <div className="editor-card-summary">
        <span className="editor-card-icon" aria-hidden="true">
          <CardsEditorIcon />
        </span>

        <div className="editor-card-copy">
          <p className="editor-card-name">
            {card.name || "Untitled Card"}
          </p>

          <p className="editor-card-meta">
            <span>{isPaidOff ? "Paid off" : `${utilization}% used`}</span>
            <span aria-hidden="true">·</span>
            <span>{formatCurrency(availableCredit)} available</span>
          </p>

          {!isPaidOff ? (
            <div className="editor-card-progress" aria-hidden="true">
              <span style={{ width: `${Math.min(utilization, 100)}%` }} />
            </div>
          ) : null}
        </div>

        <div className="editor-card-trailing">
          <p className="editor-card-balance">
            {formatCurrency(balance)}
          </p>

          <button
            type="button"
            aria-expanded={isEditing}
            aria-label={`Edit ${card.name || "card"}`}
            onClick={onToggleEditing}
            className="editor-card-action pressable"
          >
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}

function CardEditorSheet({
  card,
  onClose,
  onRemove,
  onChange,
}: {
  card: ManualCreditCard;
  onClose: () => void;
  onRemove: () => void;
  onChange: (field: keyof ManualCreditCard, value: string) => void;
}) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function confirmRemove() {
    setShowRemoveConfirm(false);
    onRemove();
  }

  return (
    <div className="editor-sheet-layer">
      <button
        type="button"
        aria-label="Close card editor"
        className="editor-sheet-backdrop"
        onClick={onClose}
      />

      <section
        className="editor-sheet-panel editor-standard-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-editor-sheet-title"
      >
        <div className="editor-sheet-handle" aria-hidden="true" />

        <div className="editor-sheet-header">
          <div className="editor-sheet-title-group">
            <span className="editor-sheet-icon" aria-hidden="true">
              <CardsEditorIcon />
            </span>

            <div className="min-w-0">
              <p
                className="editor-sheet-eyebrow"
                style={{
                  letterSpacing: "0.06em",
                  textTransform: "none",
                }}
              >
                Card details
              </p>

              <h2
                id="card-editor-sheet-title"
                className="editor-sheet-title"
              >
                {card.name || "New Card"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="editor-sheet-done pressable"
          >
            <CheckIcon />
            Done
          </button>
        </div>

        <div className="editor-sheet-intro">
          <p className="editor-sheet-context">
            Credit card
          </p>

          <p className="editor-sheet-save-note">
            Changes save automatically.
          </p>
        </div>

        <div className="editor-sheet-form">
          <SheetTextInput
            label="Card name"
            value={card.name}
            placeholder="Freedom, Amex, CareCredit..."
            onChange={(value) => onChange("name", value)}
          />

          <SheetMoneyInput
            label="Balance"
            value={card.balance}
            placeholder="0.00"
            onChange={(value) => onChange("balance", value)}
          />

          <SheetMoneyInput
            label="Credit limit"
            value={card.limit}
            placeholder="0.00"
            onChange={(value) => onChange("limit", value)}
          />

          <SheetMoneyInput
            label="Minimum payment"
            value={card.minimumPayment}
            placeholder="0.00"
            onChange={(value) => onChange("minimumPayment", value)}
          />

          <SheetTextInput
            label="Due date"
            value={card.dueDate === "TBD" ? "" : card.dueDate}
            placeholder="Not set"
            onChange={(value) => onChange("dueDate", value)}
          />
        </div>

        {showRemoveConfirm ? (
          <div className="editor-sheet-remove-confirm">
            <div>
              <p className="editor-sheet-remove-title">
                Remove this card?
              </p>

              <p className="editor-sheet-remove-copy">
                This cannot be undone after it saves.
              </p>
            </div>

            <div className="editor-sheet-remove-actions">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="editor-sheet-remove-cancel pressable"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                className="editor-sheet-remove-confirm-button pressable"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(true)}
            className="editor-sheet-remove-link pressable"
          >
            <TrashIcon />
            Remove Card
          </button>
        )}
      </section>
    </div>
  );
}


function BalanceEditorCard({
  label,
  detail,
  value,
  icon,
  isEditing,
  onEdit,
}: {
  label: string;
  detail: string;
  value: string;
  icon: ReactNode;
  isEditing: boolean;
  onEdit: () => void;
}) {
  return (
    <article
      className={`editor-balance-row ${
        isEditing ? "editor-balance-row-open" : ""
      }`}
    >
      <span className="editor-balance-icon" aria-hidden="true">
        {icon}
      </span>

      <div className="editor-balance-copy">
        <div className="editor-balance-heading">
          <p className="editor-balance-title">{label}</p>

          <p className="editor-balance-value">{formatMoney(value)}</p>
        </div>

        <p className="editor-balance-detail">{detail}</p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-expanded={isEditing}
        className="editor-balance-action pressable"
      >
        Edit
      </button>
    </article>
  );
}


function BalanceEditorSheet({
  label,
  detail,
  value,
  icon,
  onClose,
  onChange,
}: {
  label: string;
  detail: string;
  value: string;
  icon: ReactNode;
  onClose: () => void;
  onChange: (value: string) => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="editor-sheet-layer">
      <button
        type="button"
        aria-label={`Close ${label} editor`}
        className="editor-sheet-backdrop"
        onClick={onClose}
      />

      <section
        className="editor-sheet-panel editor-compact-sheet-panel editor-balance-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="balance-editor-sheet-title"
      >
        <div className="editor-sheet-handle" aria-hidden="true" />

        <div className="editor-sheet-header">
          <div className="editor-sheet-title-group">
            <span className="editor-sheet-icon" aria-hidden="true">
              {icon}
            </span>

            <div className="min-w-0">
              <p
                className="editor-sheet-eyebrow"
                style={{
                  letterSpacing: "0.06em",
                  textTransform: "none",
                }}
              >
                Balance details
              </p>

              <h2
                id="balance-editor-sheet-title"
                className="editor-sheet-title"
              >
                {label}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="editor-sheet-done pressable"
          >
            <CheckIcon />
            Done
          </button>
        </div>

        <div className="editor-sheet-intro">
          <p className="editor-sheet-context">{detail}</p>

          <p className="editor-sheet-save-note">
            Changes save automatically.
          </p>
        </div>

        <div className="editor-sheet-form editor-balance-sheet-form">
          <SheetMoneyInput
            label={label}
            value={value}
            placeholder="0.00"
            onChange={onChange}
          />
        </div>
      </section>
    </div>
  );
}


function WalletIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 8h13M16 12h4v4h-4a2 2 0 0 1 0-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SavingsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 10.5C5 7.5 7.7 5 11 5h2c3.9 0 7 2.7 7 6v3.5c0 1.8-1.2 3.5-3 4.2V21h-3v-2h-4v2H7v-2.6c-1.2-.9-2-2.3-2-3.9v-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 8h4M20 11h1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="8.5" cy="11.5" r=".75" fill="currentColor" />
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 17 9 12l3 3 7-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4v3M18 4v3M4 9h16M6 6h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentSourceSelect({
  value,
  cards,
  onChange,
}: {
  value: PaymentSource;
  cards: ManualCreditCard[];
  onChange: (paymentSource: PaymentSource) => void;
}) {
  const selectedValue =
    value.type === "credit-card"
      ? `credit-card:${value.creditCardId}`
      : "checking";

  function handleChange(nextValue: string) {
    if (nextValue === "checking") {
      onChange({ type: "checking" });
      return;
    }

    const creditCardId = nextValue.replace("credit-card:", "");

    if (!creditCardId) {
      return;
    }

    onChange({
      type: "credit-card",
      creditCardId,
    });
  }

  return (
    <label className="flex items-center justify-between gap-4 border-b border-[#f5f0e8]/8 px-3.5 py-2 transition-colors last:border-b-0 focus-within:bg-[#c7ad75]/[0.035]">
      <span className="shrink-0 text-sm font-medium text-stone-400">
        Paid From
      </span>

      <span className="relative min-w-0 flex-1">
        <select
          value={selectedValue}
          onChange={(event) => handleChange(event.target.value)}
          className="w-full appearance-none bg-transparent py-0.5 pl-3 pr-7 text-right text-[15px] font-semibold text-[#f5f0e8] outline-none"
          aria-label="Payment source"
        >
          <option value="checking">Checking account</option>

          {cards.map((card, index) =>
            card.id ? (
              <option key={card.id} value={`credit-card:${card.id}`}>
                {card.name.trim() || `Credit Card ${index + 1}`}
              </option>
            ) : null,
          )}
        </select>

        <span
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#c7ad75]/75"
          aria-hidden="true"
        >
          <ChevronDownIcon />
        </span>
      </span>
    </label>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m7 9.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-[#f5f0e8]/8 px-3.5 py-2 transition-colors last:border-b-0 focus-within:bg-[#c7ad75]/[0.035]">
      <span className="shrink-0 text-sm font-medium text-stone-400">
        {label}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={value}
        onFocus={() => clearZeroOnFocus(value, onChange)}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-right text-[15px] font-semibold text-[#f5f0e8] outline-none placeholder:text-stone-600"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-[#f5f0e8]/8 px-3.5 py-2 transition-colors last:border-b-0 focus-within:bg-[#c7ad75]/[0.035]">
      <span className="shrink-0 text-sm font-medium text-stone-400">
        {label}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-right text-[15px] font-semibold text-[#f5f0e8] outline-none placeholder:text-stone-600"
      />
    </label>
  );
}

function BalanceIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 17 9 12l3 3 7-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BillsEditorIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10a1 1 0 0 1 1 1v17l-3-1.8-3 1.8-3-1.8L6 21V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardsEditorIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 9h16M8 15h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M9 7V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V7M8 10v7M12 10v7M16 10v7M6.5 7l.7 12.2A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8L17.5 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m6 12.5 4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditPencilIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 19h4l10-10a2.1 2.1 0 0 0-3-3L6 16l-1 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m14.5 7.5 2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="dashboard-empty-preview rounded-[1.15rem] border border-dashed border-[#f5f0e8]/12 p-3">
      <div className="flex items-start gap-3">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c7ad75]/60 shadow-[0_0_12px_rgba(199,173,117,0.18)]" />

        <div className="min-w-0">
          <p className="text-base font-semibold text-[#f5f0e8]">{title}</p>

          <p className="mt-1.5 text-sm leading-6 text-stone-400">{text}</p>
        </div>
      </div>
    </div>
  );
}