"use client";

import { useEffect, useRef, useState } from "react";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { bills, creditCards, financeSummary } from "../../data/bandData";
import { sortIndexedBillsByDueDay } from "../../lib/billStatus";

type EditorTab = "overview" | "bills" | "cards";

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

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";

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

function parseMoney(value: string) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
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
  updateValue: (nextValue: string) => void
) {
  if (value === "0") {
    updateValue("");
  }
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
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [editingBills, setEditingBills] = useState<number[]>([]);
  const [editingCards, setEditingCards] = useState<number[]>([]);

  const savedConfirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    setManualData(readJsonStorage(summaryStorageKey, defaultManualData));
    setManualBills(readJsonStorage(billsStorageKey, defaultManualBills));
    setManualCards(readJsonStorage(cardsStorageKey, defaultManualCards));

    const savedTime = window.localStorage.getItem(lastSavedStorageKey);

    if (savedTime) {
      setLastSaved(savedTime);
    }

    const tab = new URLSearchParams(window.location.search).get("tab");

    if (tab === "bills" || tab === "cards" || tab === "overview") {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (savedConfirmationTimeout.current) {
        clearTimeout(savedConfirmationTimeout.current);
      }
    };
  }, []);

  function markUnsaved() {
    setShowSavedConfirmation(false);
    setHasUnsavedChanges(true);
  }

  function chooseTab(tab: EditorTab) {
    setActiveTab(tab);

    const nextUrl = tab === "overview" ? "/manual" : `/manual?tab=${tab}`;
    window.history.replaceState(null, "", nextUrl);
  }

  function updateManualData(field: keyof ManualFinanceData, value: string) {
    setManualData((current) => ({
      ...current,
      [field]: value,
    }));

    markUnsaved();
  }

  function updateBill(index: number, field: keyof ManualBill, value: string) {
    setManualBills((currentBills) =>
      currentBills.map((bill, billIndex) =>
        billIndex === index ? { ...bill, [field]: value } : bill
      )
    );

    markUnsaved();
  }

  function updateCard(
    index: number,
    field: keyof ManualCreditCard,
    value: string
  ) {
    setManualCards((currentCards) =>
      currentCards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card
      )
    );

    markUnsaved();
  }

  function addBill() {
    const nextIndex = manualBills.length;

    setManualBills((currentBills) => [
      ...currentBills,
      {
        name: "",
        amount: "",
        dueDate: "",
        status: "Paid",
        paymentMethod: "",
      },
    ]);

    setEditingBills((current) => [...current, nextIndex]);
    markUnsaved();
    chooseTab("bills");
  }

  function removeBill(index: number) {
    setManualBills((currentBills) =>
      currentBills.filter((_, billIndex) => billIndex !== index)
    );

    setEditingBills((current) =>
      current
        .filter((billIndex) => billIndex !== index)
        .map((billIndex) => (billIndex > index ? billIndex - 1 : billIndex))
    );

    markUnsaved();
  }

  function toggleBillEditing(index: number) {
    setEditingBills((current) =>
      current.includes(index)
        ? current.filter((billIndex) => billIndex !== index)
        : [...current, index]
    );
  }

  function addCard() {
    const nextIndex = manualCards.length;

    setManualCards((currentCards) => [
      ...currentCards,
      {
        name: "",
        balance: "",
        limit: "",
        minimumPayment: "0",
        dueDate: "TBD",
        status: "Good",
      },
    ]);

    setEditingCards((current) => [...current, nextIndex]);
    markUnsaved();
    chooseTab("cards");
  }

  function removeCard(index: number) {
    setManualCards((currentCards) =>
      currentCards.filter((_, cardIndex) => cardIndex !== index)
    );

    setEditingCards((current) =>
      current
        .filter((cardIndex) => cardIndex !== index)
        .map((cardIndex) => (cardIndex > index ? cardIndex - 1 : cardIndex))
    );

    markUnsaved();
  }

  function toggleCardEditing(index: number) {
    setEditingCards((current) =>
      current.includes(index)
        ? current.filter((cardIndex) => cardIndex !== index)
        : [...current, index]
    );
  }

  function saveChanges() {
    const savedTime = new Date().toISOString();

    window.localStorage.setItem(summaryStorageKey, JSON.stringify(manualData));
    window.localStorage.setItem(billsStorageKey, JSON.stringify(manualBills));
    window.localStorage.setItem(cardsStorageKey, JSON.stringify(manualCards));
    window.localStorage.setItem(lastSavedStorageKey, savedTime);

    setLastSaved(savedTime);
    setHasUnsavedChanges(false);
    setShowSavedConfirmation(true);
    setEditingBills([]);
    setEditingCards([]);

    if (savedConfirmationTimeout.current) {
      clearTimeout(savedConfirmationTimeout.current);
    }

    savedConfirmationTimeout.current = setTimeout(() => {
      setShowSavedConfirmation(false);
    }, 2400);
  }

  const sortedManualBills = sortIndexedBillsByDueDay(
    manualBills.map((bill, index) => ({ bill, index }))
  );

  const sortedManualCards = manualCards
    .map((card, index) => ({ card, index }))
    .sort(
      (firstCard, secondCard) =>
        parseMoney(secondCard.card.balance) - parseMoney(firstCard.card.balance)
    );

  const billsTotal = manualBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const cardBalanceTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.balance),
    0
  );

  const cardLimitTotal = manualCards.reduce(
    (total, card) => total + parseMoney(card.limit),
    0
  );

  const cardUtilization =
    cardLimitTotal > 0
      ? Math.round((cardBalanceTotal / cardLimitTotal) * 100)
      : 0;

  const saveStatusTitle = hasUnsavedChanges
    ? "Changes ready"
    : showSavedConfirmation
      ? "Saved"
      : "Up to date";

  const saveStatusDetail = hasUnsavedChanges
    ? lastSaved
      ? `Last saved ${formatSavedTime(lastSaved)}`
      : "Save when ready."
    : showSavedConfirmation
      ? "Everything is current."
      : lastSaved
        ? `Last saved ${formatSavedTime(lastSaved)}`
        : "Everything is current.";

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-3 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Data Editor
            </p>

            <Pill>{hasUnsavedChanges ? "Ready" : "Saved"}</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Editor
          </h1>
        </header>

        <section className="motion-card motion-card-delay-1 mb-3 grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <div
            aria-live="polite"
            className={`liquid-glass-soft rounded-[1.35rem] p-2.5 transition-all duration-300 ${
              hasUnsavedChanges
                ? "shadow-[inset_0_0_0_1px_rgba(199,173,117,0.18),0_12px_28px_rgba(0,0,0,0.1)]"
                : showSavedConfirmation
                  ? "shadow-[inset_0_0_0_1px_rgba(245,240,232,0.1),0_12px_28px_rgba(0,0,0,0.08)]"
                  : "shadow-[inset_0_0_0_1px_rgba(245,240,232,0.04)]"
            }`}
          >
            <div className="liquid-content flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-300 ${
                    hasUnsavedChanges
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
            </div>
          </div>

          <button
            type="button"
            onClick={saveChanges}
            disabled={!hasUnsavedChanges}
            className={`pressable rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 sm:min-w-36 ${
              hasUnsavedChanges
                ? "border-[#c7ad75]/42 bg-[#c7ad75]/18 text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(245,240,232,0.1),0_14px_28px_rgba(0,0,0,0.16)] hover:bg-[#c7ad75]/24"
                : showSavedConfirmation
                  ? "border-[#f5f0e8]/12 bg-[#f5f0e8]/8 text-[#f5f0e8]/75 shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]"
                  : "border-[#f5f0e8]/10 bg-[#f5f0e8]/5 text-stone-500"
            }`}
          >
            {hasUnsavedChanges ? "Save" : "Saved"}
          </button>
        </section>

        <section className="motion-card motion-card-delay-2 mb-3">
          <div className="liquid-glass rounded-full p-1.5 sm:hidden">
            <div className="liquid-content grid grid-cols-3 gap-1">
              <EditorSegmentButton
                label="Numbers"
                active={activeTab === "overview"}
                onClick={() => chooseTab("overview")}
              />

              <EditorSegmentButton
                label="Bills"
                active={activeTab === "bills"}
                onClick={() => chooseTab("bills")}
              />

              <EditorSegmentButton
                label="Cards"
                active={activeTab === "cards"}
                onClick={() => chooseTab("cards")}
              />
            </div>
          </div>

          <div className="hidden gap-2.5 sm:grid sm:grid-cols-3">
            <EditorSectionButton
              title="Main Numbers"
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
          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.7rem] p-3.5">
            <div className="liquid-content">
              <SectionHeading title="Main Numbers" />

              <div className="mt-3 grid gap-2.5">
                <MoneyInput
                  label="Checking Balance"
                  value={manualData.checkingBalance}
                  onChange={(value) =>
                    updateManualData("checkingBalance", value)
                  }
                />

                <MoneyInput
                  label="Savings Balance"
                  value={manualData.savingsBalance}
                  onChange={(value) =>
                    updateManualData("savingsBalance", value)
                  }
                />

                <MoneyInput
                  label="Monthly Income"
                  value={manualData.monthlyIncome}
                  onChange={(value) => updateManualData("monthlyIncome", value)}
                />

                <TextInput
                  label="Next Payday"
                  value={manualData.nextPayday}
                  placeholder="Example: July 12"
                  onChange={(value) => updateManualData("nextPayday", value)}
                />
              </div>
            </div>
          </section>
        )}

        {activeTab === "bills" && (
          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.7rem] p-3.5">
            <div className="liquid-content">
              <div className="mb-3 flex items-center justify-between gap-4">
                <SectionHeading title="Bills" />

                <button
                  type="button"
                  onClick={addBill}
                  className="pressable shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-2 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22"
                >
                  Add
                </button>
              </div>

              <div className="grid gap-2">
                {manualBills.length > 0 ? (
                  sortedManualBills.map(({ bill, index }) => (
                    <BillEditorRow
                      key={`bill-${index}`}
                      bill={bill}
                      isEditing={editingBills.includes(index)}
                      onToggleEditing={() => toggleBillEditing(index)}
                      onRemove={() => removeBill(index)}
                      onChange={(field, value) =>
                        updateBill(index, field, value)
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
          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.7rem] p-3.5">
            <div className="liquid-content">
              <div className="mb-3 flex items-center justify-between gap-4">
                <SectionHeading title="Credit Cards" />

                <button
                  type="button"
                  onClick={addCard}
                  className="pressable shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-2 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22"
                >
                  Add
                </button>
              </div>

              <div className="grid gap-2">
                {manualCards.length > 0 ? (
                  sortedManualCards.map(({ card, index }) => (
                    <CardEditorRow
                      key={`card-${index}`}
                      card={card}
                      isEditing={editingCards.includes(index)}
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

      {showSavedConfirmation && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
          <div
            role="status"
            aria-live="polite"
            className="liquid-glass-soft w-full max-w-[22rem] rounded-[1.35rem] border border-[#f5f0e8]/10 p-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
          >
            <div className="liquid-content flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#f5f0e8]/85 shadow-[0_0_18px_rgba(245,240,232,0.22)]" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#f5f0e8]">Saved</p>

                <p className="mt-0.5 text-xs text-stone-500">
                  Everything is current.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function EditorSegmentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`pressable rounded-full px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#c7ad75]/20 text-[#f5f0e8] shadow-[inset_0_0_0_1px_rgba(199,173,117,0.26),inset_0_1px_0_rgba(245,240,232,0.08)]"
          : "text-stone-400 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
      }`}
    >
      {label}
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
      className={`pressable rounded-[1.25rem] border p-3 text-left transition ${
        active
          ? "border-[#c7ad75]/38 bg-[#c7ad75]/13 shadow-[inset_0_1px_0_rgba(245,240,232,0.09),0_16px_28px_rgba(0,0,0,0.13)]"
          : "border-[#f5f0e8]/10 bg-[#11100d]/22 hover:border-[#c7ad75]/24 hover:bg-[#f5f0e8]/5"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
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
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function BillEditorRow({
  bill,
  isEditing,
  onToggleEditing,
  onRemove,
  onChange,
}: {
  bill: ManualBill;
  isEditing: boolean;
  onToggleEditing: () => void;
  onRemove: () => void;
  onChange: (field: keyof ManualBill, value: string) => void;
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
      className={`rounded-[1.15rem] border p-3 transition hover:bg-[#f5f0e8]/5 ${
        isEditing
          ? "border-[#c7ad75]/30 bg-[#c7ad75]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]"
          : "border-[#f5f0e8]/10 bg-[#11100d]/22"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {bill.name || "Untitled Bill"}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
              {formatMoney(bill.amount)}
            </span>

            <span className="rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
              Due {bill.dueDate || "TBD"}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={isEditing}
          aria-label={`${isEditing ? "Close editor for" : "Edit"} ${
            bill.name || "bill"
          }`}
          onClick={onToggleEditing}
          className={`pressable shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            isEditing
              ? "border-[#c7ad75]/30 bg-[#c7ad75]/12 text-[#f5f0e8]"
              : "border-[#f5f0e8]/10 text-stone-300 hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          }`}
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {isEditing && (
        <div className="mt-3 rounded-[1.05rem] border border-[#f5f0e8]/10 bg-[#11100d]/30 p-2.5 shadow-[inset_0_1px_0_rgba(245,240,232,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
              Editing Bill
            </p>

            <p className="text-xs font-medium text-stone-500">
              Save when ready
            </p>
          </div>

          <div className="grid gap-2.5">
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

            <TextInput
              label="Payment Method"
              value={bill.paymentMethod}
              placeholder="Example: Checking"
              onChange={(value) => onChange("paymentMethod", value)}
            />
          </div>

          {showRemoveConfirm ? (
            <div className="mt-2.5 rounded-[1rem] border border-[#dc2626]/28 bg-[#dc2626]/8 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Remove this bill?
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                This change will be saved when you tap Save.
              </p>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
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
              className="pressable mt-2.5 w-full rounded-full border border-[#dc2626]/38 bg-[#dc2626]/10 px-4 py-2.5 text-sm font-bold text-[#ef4444] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(127,29,29,0.08)] transition hover:border-[#dc2626]/58 hover:bg-[#dc2626]/15"
            >
              Remove Bill
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function CardEditorRow({
  card,
  isEditing,
  onToggleEditing,
  onRemove,
  onChange,
}: {
  card: ManualCreditCard;
  isEditing: boolean;
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
      className={`rounded-[1.15rem] border p-3 transition hover:bg-[#f5f0e8]/5 ${
        isEditing
          ? "border-[#c7ad75]/30 bg-[#c7ad75]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]"
          : "border-[#f5f0e8]/10 bg-[#11100d]/22"
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {card.name || "Untitled Card"}
          </p>

          <p className="mt-0.5 text-sm text-stone-400">
            {utilization}% used • {formatMoney(card.balance)}
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isEditing}
          aria-label={`${isEditing ? "Close editor for" : "Edit"} ${
            card.name || "card"
          }`}
          onClick={onToggleEditing}
          className={`pressable shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            isEditing
              ? "border-[#c7ad75]/30 bg-[#c7ad75]/12 text-[#f5f0e8]"
              : "border-[#f5f0e8]/10 text-stone-300 hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          }`}
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
        <div
          className="liquid-progress h-full rounded-full bg-[#c7ad75]"
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      {isEditing && (
        <div className="mt-3 rounded-[1.05rem] border border-[#f5f0e8]/10 bg-[#11100d]/30 p-2.5 shadow-[inset_0_1px_0_rgba(245,240,232,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
              Editing Card
            </p>

            <p className="text-xs font-medium text-stone-500">
              Save when ready
            </p>
          </div>

          <div className="grid gap-2.5">
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

            <SelectInput
              label="Status"
              value={card.status}
              options={["Good", "Watch", "Pay Down"]}
              onChange={(value) =>
                onChange("status", value as ManualCreditCard["status"])
              }
            />
          </div>

          {showRemoveConfirm ? (
            <div className="mt-2.5 rounded-[1rem] border border-[#dc2626]/28 bg-[#dc2626]/8 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <p className="text-sm font-semibold text-[#f5f0e8]">
                Remove this card?
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                This change will be saved when you tap Save.
              </p>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
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
              className="pressable mt-2.5 w-full rounded-full border border-[#dc2626]/38 bg-[#dc2626]/10 px-4 py-2.5 text-sm font-bold text-[#ef4444] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(127,29,29,0.08)] transition hover:border-[#dc2626]/58 hover:bg-[#dc2626]/15"
            >
              Remove Card
            </button>
          )}
        </div>
      )}
    </article>
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
    <label className="grid gap-1.5 rounded-[1.05rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 p-2.5 transition-within:border-[#c7ad75]/24">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
        {label}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={value}
        onFocus={() => clearZeroOnFocus(value, onChange)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-2.5 text-base font-semibold text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
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
    <label className="grid gap-1.5 rounded-[1.05rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 p-2.5">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
        {label}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-2.5 text-base font-semibold text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 rounded-[1.05rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 p-2.5">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/75">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-2.5 text-base font-semibold text-[#f5f0e8] outline-none transition focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.15rem] border border-dashed border-[#f5f0e8]/12 bg-[#11100d]/20 p-3.5">
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