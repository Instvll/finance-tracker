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
import { PageShell, Pill } from "../../components/Layout";
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

type NewlyAddedItem = {
  type: "bill" | "card";
  index: number;
};

type PersistEditorChangesOptions = {
  updateUi?: boolean;
};

const editorAutosaveDelay = 900;

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
  const [editingBills, setEditingBills] = useState<number[]>([]);
  const [editingCards, setEditingCards] = useState<number[]>([]);
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
  const newItemFocusTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const newItemHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const originalBillsRef = useRef<Array<ManualBill | null>>([]);
  const originalCardsRef = useRef<ManualCreditCard[]>([]);
  const removedBillsRef = useRef<ManualBill[]>([]);

  useEffect(() => {
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
    const savedBills = storedState.bills;

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

    const tab = new URLSearchParams(window.location.search).get("tab");

    if (tab === "bills" || tab === "cards" || tab === "overview") {
      setActiveTab(tab);
    }

    hasLoadedStoredStateRef.current = true;
  }, []);

  useEffect(() => {
    if (!newlyAddedItem) {
      return;
    }

    const targetTab = newlyAddedItem.type === "bill" ? "bills" : "cards";

    if (activeTab !== targetTab) {
      return;
    }

    let secondAnimationFrame = 0;

    const firstAnimationFrame = window.requestAnimationFrame(() => {
      secondAnimationFrame = window.requestAnimationFrame(() => {
        const item = document.querySelector<HTMLElement>(
          `[data-editor-item="${newlyAddedItem.type}-${newlyAddedItem.index}"]`,
        );

        if (!item) {
          return;
        }

        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        item.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });

        if (newItemFocusTimeout.current) {
          clearTimeout(newItemFocusTimeout.current);
        }

        newItemFocusTimeout.current = setTimeout(
          () => {
            const firstField = item.querySelector<
              HTMLInputElement | HTMLSelectElement
            >("input, select");

            firstField?.focus({ preventScroll: true });
          },
          prefersReducedMotion ? 0 : 450,
        );

        if (newItemHighlightTimeout.current) {
          clearTimeout(newItemHighlightTimeout.current);
        }

        newItemHighlightTimeout.current = setTimeout(() => {
          setNewlyAddedItem(null);
        }, 1400);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstAnimationFrame);

      if (secondAnimationFrame) {
        window.cancelAnimationFrame(secondAnimationFrame);
      }
    };
  }, [activeTab, manualBills.length, manualCards.length, newlyAddedItem]);

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

      if (newItemFocusTimeout.current) {
        clearTimeout(newItemFocusTimeout.current);
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
    setActiveTab(tab);

    const nextUrl = tab === "overview" ? "/manual" : `/manual?tab=${tab}`;
    window.history.replaceState(null, "", nextUrl);
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

    setEditingBills((current) => [...current, nextIndex]);
    setNewlyAddedItem({ type: "bill", index: nextIndex });
    markUnsaved();
    chooseTab("bills");
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
    const isOpening = !editingBills.includes(index);

    setEditingBills((current) =>
      current.includes(index)
        ? current.filter((billIndex) => billIndex !== index)
        : [...current, index],
    );

    if (isOpening) {
      scrollEditorItemIntoView("bill", index);
    }
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

    setEditingCards((current) => [...current, nextIndex]);
    setNewlyAddedItem({ type: "card", index: nextIndex });
    markUnsaved();
    chooseTab("cards");
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
    const isOpening = !editingCards.includes(index);

    setEditingCards((current) =>
      current.includes(index)
        ? current.filter((cardIndex) => cardIndex !== index)
        : [...current, index],
    );

    if (isOpening) {
      scrollEditorItemIntoView("card", index);
    }
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

  const billsTotal = manualBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0,
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

  const saveStatusLabel = isAutoSaving
    ? "Saving"
    : hasUnsavedChanges
      ? "Auto Save"
      : "Saved";

  const saveStatusTitle = isAutoSaving
    ? "Saving changes"
    : hasUnsavedChanges
      ? "Saving automatically"
      : showSavedConfirmation
        ? "Saved automatically"
        : "Everything is current";

  const saveStatusDetail = isAutoSaving
    ? "Keeping this device current."
    : hasUnsavedChanges
      ? lastSaved
        ? `Changes save after a brief pause • Last saved ${formatSavedTime(lastSaved)}`
        : "Changes save after a brief pause."
      : lastSaved
        ? `Last saved ${formatSavedTime(lastSaved)}`
        : "Everything is current.";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-1.5 motion-card sm:-mt-2">
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Financial Setup
            </p>

            <Pill>{saveStatusLabel}</Pill>
          </div>

          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Editor
          </h1>
        </header>

        <section className="motion-card motion-card-delay-1 mb-2">
          <div
            aria-live="polite"
            className={`dashboard-surface relative overflow-hidden rounded-[1.35rem] p-2 transition-all duration-300 ${
              isAutoSaving
                ? "shadow-[inset_0_0_0_1px_rgba(157,189,180,0.18),0_12px_28px_rgba(0,0,0,0.1)]"
                : hasUnsavedChanges
                  ? "shadow-[inset_0_0_0_1px_rgba(199,173,117,0.18),0_12px_28px_rgba(0,0,0,0.1)]"
                  : showSavedConfirmation
                    ? "shadow-[inset_0_0_0_1px_rgba(245,240,232,0.1),0_12px_28px_rgba(0,0,0,0.08)]"
                    : "shadow-[inset_0_0_0_1px_rgba(245,240,232,0.04)]"
            }`}
          >
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-300 ${
                    isAutoSaving
                      ? "scale-100 animate-pulse bg-[#9dbdb4] shadow-[0_0_16px_rgba(157,189,180,0.28)]"
                      : hasUnsavedChanges
                        ? "scale-100 bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.34)]"
                        : showSavedConfirmation
                          ? "scale-110 bg-[#f5f0e8]/85 shadow-[0_0_18px_rgba(245,240,232,0.22)]"
                          : "scale-90 bg-[#f5f0e8]/24"
                  }`}
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#f5f0e8] transition-colors duration-300">
                    {saveStatusTitle}
                  </p>

                  <p className="mt-0.5 text-xs text-stone-500 transition-colors duration-300">
                    {saveStatusDetail}
                  </p>
                </div>
              </div>

              <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-600 sm:block">
                Auto Save On
              </span>
            </div>
          </div>
        </section>

        <section className="motion-card motion-card-delay-2 mb-2">
          <div className="dashboard-compact-panel rounded-full p-1 sm:hidden">
            <div className="liquid-content grid grid-cols-3 gap-1">
              <EditorSegmentButton
                label="Balances"
                icon={<BalanceIcon />}
                active={activeTab === "overview"}
                onClick={() => chooseTab("overview")}
              />

              <EditorSegmentButton
                label="Bills"
                icon={<BillsEditorIcon />}
                active={activeTab === "bills"}
                onClick={() => chooseTab("bills")}
              />

              <EditorSegmentButton
                label="Cards"
                icon={<CardsEditorIcon />}
                active={activeTab === "cards"}
                onClick={() => chooseTab("cards")}
              />
            </div>
          </div>

          <div className="hidden gap-2 sm:grid sm:grid-cols-3">
            <EditorSectionButton
              title="Balances"
              value={formatMoney(manualData.checkingBalance)}
              detail="Checking"
              active={activeTab === "overview"}
              onClick={() => chooseTab("overview")}
            />

            <EditorSectionButton
              title="Bills"
              value={String(manualBills.length)}
              detail={`${formatCurrency(billsTotal)} monthly`}
              active={activeTab === "bills"}
              onClick={() => chooseTab("bills")}
            />

            <EditorSectionButton
              title="Credit Cards"
              value={String(manualCards.length)}
              detail={`${cardUtilization}% used`}
              active={activeTab === "cards"}
              onClick={() => chooseTab("cards")}
            />
          </div>
        </section>

        {activeTab === "overview" && (
          <section className="dashboard-surface motion-card motion-card-delay-3 relative overflow-hidden rounded-[1.7rem] p-3">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SectionHeading title="Balances" />

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    The core numbers that power your Dashboard.
                  </p>
                </div>

                <span className="dashboard-pill-button shrink-0 !px-2.5 !py-0.5">
                  3 values
                </span>
              </div>

              <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                <BalanceEditorCard
                  label="Checking"
                  detail="Available spending balance"
                  value={manualData.checkingBalance}
                  icon={<WalletIcon />}
                  onChange={(value) =>
                    updateManualData("checkingBalance", value)
                  }
                />

                <BalanceEditorCard
                  label="Savings"
                  detail="Money set aside"
                  value={manualData.savingsBalance}
                  icon={<SavingsIcon />}
                  onChange={(value) =>
                    updateManualData("savingsBalance", value)
                  }
                />

                <BalanceEditorCard
                  label="Monthly Income"
                  detail="Expected income each month"
                  value={manualData.monthlyIncome}
                  icon={<IncomeIcon />}
                  onChange={(value) => updateManualData("monthlyIncome", value)}
                  wide
                />
              </div>

              <Link
                href="/account/preferences"
                className="dashboard-preview-row pressable mt-2 block !px-3 !py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.95rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.07)]">
                      <CalendarIcon />
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#f5f0e8]">
                        Pay Schedule
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-stone-500">
                        Payday and frequency are managed in Preferences.
                      </p>
                    </div>
                  </div>

                  <span className="dashboard-pill-button shrink-0 !px-2.5 !py-0.5">
                    Open
                  </span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {activeTab === "bills" && (
          <section className="dashboard-surface motion-card motion-card-delay-3 relative overflow-hidden rounded-[1.7rem] p-3">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SectionHeading title="Bills" />

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {manualBills.length} recurring bill
                    {manualBills.length === 1 ? "" : "s"} • Organized by due
                    date
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addBill}
                  className="dashboard-pill-button pressable shrink-0"
                >
                  + Add Bill
                </button>
              </div>

              <div className="grid gap-1.5">
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
            </div>
          </section>
        )}

        {activeTab === "cards" && (
          <section className="dashboard-surface motion-card motion-card-delay-3 relative overflow-hidden rounded-[1.7rem] p-3">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SectionHeading title="Credit Cards" />

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {manualCards.length} card
                    {manualCards.length === 1 ? "" : "s"} • {cardUtilization}%
                    overall utilization
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addCard}
                  className="dashboard-pill-button pressable shrink-0"
                >
                  + Add Card
                </button>
              </div>

              <div className="grid gap-1.5">
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
                    text="Add a card when you want leftovr to track utilization and payoff pressure."
                  />
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function EditorSegmentButton({
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
      aria-pressed={active}
      onClick={onClick}
      className={`pressable rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-[#c7ad75]/20 text-[#f5f0e8] shadow-[inset_0_0_0_1px_rgba(199,173,117,0.26),inset_0_1px_0_rgba(245,240,232,0.08)]"
          : "text-stone-400 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
      }`}
    >
      <span className="flex items-center justify-center gap-1.5">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}

function EditorSectionButton({
  title,
  value,
  detail,
  active,
  onClick,
}: {
  title: string;
  value: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`dashboard-compact-panel pressable rounded-[1.25rem] p-2.5 text-left transition-all duration-300 ${
        active
          ? "border-[#c7ad75]/38 bg-[#c7ad75]/13 shadow-[inset_0_1px_0_rgba(245,240,232,0.09),0_16px_28px_rgba(0,0,0,0.13)]"
          : "hover:border-[#c7ad75]/24 hover:bg-[#f5f0e8]/5"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
          {title}
        </p>

        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${
            active
              ? "bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.28)]"
              : "bg-[#f5f0e8]/18"
          }`}
        />
      </div>

      <p className="truncate text-xl font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>

      <p className="mt-0.5 text-sm text-stone-400">{detail}</p>
    </button>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
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
  onRemove,
  onChange,
  onPaymentSourceChange,
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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setShowRemoveConfirm(false);
    }
  }, [isEditing]);

  function confirmRemove() {
    setShowRemoveConfirm(false);
    onRemove();
  }

  return (
    <article
      data-editor-item={`bill-${itemIndex}`}
      className={`dashboard-preview-row scroll-mt-28 overflow-hidden rounded-[1.2rem] border transition-all duration-300 ${
        isNewlyAdded
          ? "border-[#c7ad75]/48 shadow-[0_0_0_1px_rgba(199,173,117,0.12),0_12px_30px_rgba(0,0,0,0.08),0_0_22px_rgba(199,173,117,0.08)]"
          : isEditing
            ? "border-[#c7ad75]/28 shadow-[0_14px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(245,240,232,0.06)]"
            : "border-[#f5f0e8]/10 hover:border-[#c7ad75]/20"
      } ${isDimmed ? "opacity-70" : "opacity-100"}`}
    >
      {isEditing ? (
        <div className="relative px-3.5 py-2.5">
          <span
            className="absolute inset-y-3 left-0 w-[2px] rounded-r-full bg-[#c7ad75]"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] border border-[#f5f0e8]/12 bg-[#f5f0e8]/5 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.07)]">
                <EditPencilIcon />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
                  Editing Bill
                </p>

                <p className="mt-0.5 truncate text-base font-semibold text-[#f5f0e8]">
                  {bill.name || "New Bill"}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={isEditing}
              aria-label={`Close editor for ${bill.name || "bill"}`}
              onClick={onToggleEditing}
              className="dashboard-pill-button pressable inline-flex shrink-0 items-center gap-1.5 !px-3 !py-1.5 text-xs font-semibold text-[#f5f0e8]"
            >
              <CheckIcon />
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4 p-2.5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] border border-[#f5f0e8]/10 bg-[#f5f0e8]/5 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.06)]">
              <BillsEditorIcon />
            </span>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#f5f0e8]">
                {bill.name || "Untitled Bill"}
              </p>

              <p className="mt-0.5 text-xs text-stone-500">
                Paid from {getPaymentSourceLabel(bill.paymentSource, cards)}
              </p>

              <p className="mt-1 text-sm font-medium text-stone-300">
                {formatMoney(bill.amount)}
                <span className="mx-1.5 text-stone-600">•</span>
                Due {bill.dueDate || "TBD"}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={isEditing}
            aria-label={`Edit ${bill.name || "bill"}`}
            onClick={onToggleEditing}
            className="dashboard-pill-button pressable shrink-0 !px-3 !py-1 text-xs font-semibold"
          >
            Edit
          </button>
        </div>
      )}

      {isEditing && (
        <div className="border-t border-[#f5f0e8]/10 px-3.5 pb-3 pt-2.5">
          <div className="dashboard-compact-panel !overflow-hidden !rounded-[1rem] !p-0">
            <TextInput
              label="Bill Name"
              value={bill.name}
              placeholder="Example: Car Payment"
              onChange={(value) => onChange("name", value)}
            />

            <MoneyInput
              label="Amount"
              value={bill.amount}
              onChange={(value) => onChange("amount", value)}
            />

            <TextInput
              label="Due Date"
              value={bill.dueDate}
              placeholder="Example: 15th"
              onChange={(value) => onChange("dueDate", value)}
            />

            <PaymentSourceSelect
              value={bill.paymentSource ?? { type: "checking" }}
              cards={cards}
              onChange={onPaymentSourceChange}
            />
          </div>

          {showRemoveConfirm ? (
            <div className="mt-2 rounded-[1rem] border border-[#dc2626]/22 bg-[#dc2626]/6 p-2.5">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Remove this bill?
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                This change saves automatically.
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="pressable rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/5 px-4 py-2 text-sm font-semibold text-stone-300 transition hover:border-[#f5f0e8]/16 hover:bg-[#f5f0e8]/8 hover:text-[#f5f0e8]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmRemove}
                  className="pressable rounded-full border border-[#dc2626]/42 bg-[#dc2626]/14 px-4 py-2 text-sm font-bold text-[#ef4444] transition hover:border-[#dc2626]/58 hover:bg-[#dc2626]/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(true)}
              className="pressable mt-2.5 inline-flex items-center gap-1.5 border-0 bg-transparent px-1 py-1 text-xs font-semibold text-[#dc2626]/85 transition hover:text-[#dc2626]"
            >
              <TrashIcon />
              Remove Bill
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function CardEditorRow({
  itemIndex,
  card,
  isEditing,
  isDimmed,
  isNewlyAdded,
  onToggleEditing,
  onRemove,
  onChange,
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
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setShowRemoveConfirm(false);
    }
  }, [isEditing]);

  function confirmRemove() {
    setShowRemoveConfirm(false);
    onRemove();
  }

  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <article
      data-editor-item={`card-${itemIndex}`}
      className={`dashboard-preview-row scroll-mt-28 overflow-hidden rounded-[1.2rem] border transition-all duration-300 ${
        isNewlyAdded
          ? "border-[#c7ad75]/48 shadow-[0_0_0_1px_rgba(199,173,117,0.12),0_12px_30px_rgba(0,0,0,0.08),0_0_22px_rgba(199,173,117,0.08)]"
          : isEditing
            ? "border-[#c7ad75]/28 shadow-[0_14px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(245,240,232,0.06)]"
            : "border-[#f5f0e8]/10 hover:border-[#c7ad75]/20"
      } ${isDimmed ? "opacity-70" : "opacity-100"}`}
    >
      {isEditing ? (
        <div className="relative px-3.5 py-2.5">
          <span
            className="absolute inset-y-3 left-0 w-[2px] rounded-r-full bg-[#c7ad75]"
            aria-hidden="true"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] border border-[#f5f0e8]/12 bg-[#f5f0e8]/5 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.07)]">
                <EditPencilIcon />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
                  Editing Card
                </p>

                <p className="mt-0.5 truncate text-base font-semibold text-[#f5f0e8]">
                  {card.name || "New Card"}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={isEditing}
              aria-label={`Close editor for ${card.name || "card"}`}
              onClick={onToggleEditing}
              className="dashboard-pill-button pressable inline-flex shrink-0 items-center gap-1.5 !px-3 !py-1.5 text-xs font-semibold text-[#f5f0e8]"
            >
              <CheckIcon />
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4 p-2.5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] border border-[#f5f0e8]/10 bg-[#f5f0e8]/5 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.06)]">
              <CardsEditorIcon />
            </span>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#f5f0e8]">
                {card.name || "Untitled Card"}
              </p>

              <p className="mt-0.5 text-xs text-stone-500">Revolving account</p>

              <p className="mt-1 text-sm font-medium text-stone-300">
                {formatMoney(card.balance)}
                <span className="mx-1.5 text-stone-600">•</span>
                {utilization}% used
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={isEditing}
            aria-label={`Edit ${card.name || "card"}`}
            onClick={onToggleEditing}
            className="dashboard-pill-button pressable shrink-0 !px-3 !py-1 text-xs font-semibold"
          >
            Edit
          </button>
        </div>
      )}

      {!isEditing ? (
        <div className="mx-3 mb-2.5 dashboard-progress-track h-1.5 overflow-hidden rounded-full bg-black/30">
          <div
            className="liquid-progress dashboard-progress-fill h-full rounded-full bg-[#c7ad75]"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      ) : null}

      {isEditing && (
        <div className="border-t border-[#f5f0e8]/10 px-3.5 pb-3 pt-2.5">
          <div className="dashboard-compact-panel !overflow-hidden !rounded-[1rem] !p-0">
            <TextInput
              label="Card Name"
              value={card.name}
              placeholder="Example: Amex"
              onChange={(value) => onChange("name", value)}
            />

            <MoneyInput
              label="Balance"
              value={card.balance}
              onChange={(value) => onChange("balance", value)}
            />

            <MoneyInput
              label="Credit Limit"
              value={card.limit}
              onChange={(value) => onChange("limit", value)}
            />

            <MoneyInput
              label="Minimum Payment"
              value={card.minimumPayment}
              onChange={(value) => onChange("minimumPayment", value)}
            />

            <TextInput
              label="Due Date"
              value={card.dueDate}
              placeholder="Example: 2nd"
              onChange={(value) => onChange("dueDate", value)}
            />
          </div>

          {showRemoveConfirm ? (
            <div className="mt-2 rounded-[1rem] border border-[#dc2626]/22 bg-[#dc2626]/6 p-2.5">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Remove this card?
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                This change saves automatically.
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="pressable rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/5 px-4 py-2 text-sm font-semibold text-stone-300 transition hover:border-[#f5f0e8]/16 hover:bg-[#f5f0e8]/8 hover:text-[#f5f0e8]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmRemove}
                  className="pressable rounded-full border border-[#dc2626]/42 bg-[#dc2626]/14 px-4 py-2 text-sm font-bold text-[#ef4444] transition hover:border-[#dc2626]/58 hover:bg-[#dc2626]/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(true)}
              className="pressable mt-2.5 inline-flex items-center gap-1.5 border-0 bg-transparent px-1 py-1 text-xs font-semibold text-[#dc2626]/85 transition hover:text-[#dc2626]"
            >
              <TrashIcon />
              Remove Card
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function BalanceEditorCard({
  label,
  detail,
  value,
  icon,
  onChange,
  wide = false,
}: {
  label: string;
  detail: string;
  value: string;
  icon: ReactNode;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label
      className={`dashboard-preview-row group block cursor-text !px-3 !py-2.5 transition focus-within:border-[#c7ad75]/34 focus-within:bg-[#c7ad75]/[0.055] ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.95rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.07)]">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f5f0e8]">{label}</p>

              <p className="mt-0.5 text-xs leading-5 text-stone-500">
                {detail}
              </p>
            </div>

            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c7ad75]/65">
              Edit
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5 border-t border-[#f5f0e8]/8 pt-1.5">
            <span className="text-lg font-semibold text-stone-500">$</span>

            <input
              type="number"
              inputMode="decimal"
              value={value}
              onFocus={() => clearZeroOnFocus(value, onChange)}
              onChange={(event) => onChange(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-tight text-[#f5f0e8] outline-none placeholder:text-stone-600"
            />
          </div>
        </div>
      </div>
    </label>
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