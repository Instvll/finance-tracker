"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { bills, creditCards, financeSummary } from "../../data/bandData";

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

function formatMoney(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseMoney(value));
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
  const [editingBills, setEditingBills] = useState<number[]>([]);
  const [editingCards, setEditingCards] = useState<number[]>([]);

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

  function updateManualData(field: keyof ManualFinanceData, value: string) {
    setManualData((current) => ({
      ...current,
      [field]: value,
    }));

    setHasUnsavedChanges(true);
  }

  function updateBill(index: number, field: keyof ManualBill, value: string) {
    setManualBills((currentBills) =>
      currentBills.map((bill, billIndex) =>
        billIndex === index ? { ...bill, [field]: value } : bill
      )
    );

    setHasUnsavedChanges(true);
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

    setHasUnsavedChanges(true);
  }

  function addBill() {
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

    setEditingBills((current) => [...current, manualBills.length]);
    setHasUnsavedChanges(true);
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

    setHasUnsavedChanges(true);
  }

  function toggleBillEditing(index: number) {
    setEditingBills((current) =>
      current.includes(index)
        ? current.filter((billIndex) => billIndex !== index)
        : [...current, index]
    );
  }

  function addCard() {
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

    setEditingCards((current) => [...current, manualCards.length]);
    setHasUnsavedChanges(true);
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

    setHasUnsavedChanges(true);
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
    setEditingBills([]);
    setEditingCards([]);
  }

  const overviewCards = [
    {
      label: "Checking",
      value: formatMoney(manualData.checkingBalance),
    },
    {
      label: "Savings",
      value: formatMoney(manualData.savingsBalance),
    },
    {
      label: "Monthly Income",
      value: formatMoney(manualData.monthlyIncome),
    },
  ];

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="mb-5 motion-card">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Data Editor
            </p>

            <Pill>{hasUnsavedChanges ? "Unsaved" : "Saved"}</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Editor
          </h1>
        </header>

        <section className="liquid-glass-accent motion-card motion-card-delay-1 mb-5 rounded-[2.25rem]">
          <div className="liquid-content relative p-5 sm:p-7">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c7ad75]/10 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

            <div className="relative mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />

                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f5f0e8]">
                    Manual Control
                  </p>
                </div>

                <p className="max-w-xl text-sm leading-6 text-stone-400">
                  Update your balances, bills, and credit cards. Save when
                  everything looks right.
                </p>
              </div>

              <Pill>{formatSavedTime(lastSaved)}</Pill>
            </div>

            <div className="relative grid gap-3 sm:grid-cols-3">
              {overviewCards.map((card) => (
                <MiniStat
                  key={card.label}
                  label={card.label}
                  value={card.value}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={saveChanges}
              className={`pressable relative mt-5 flex w-full rounded-2xl border px-5 py-4 text-center text-sm font-semibold transition ${
                hasUnsavedChanges
                  ? "border-[#c7ad75]/35 bg-[#c7ad75]/18 text-[#f5f0e8] hover:bg-[#c7ad75]/24"
                  : "border-[#f5f0e8]/10 bg-[#f5f0e8]/6 text-stone-300 hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
              }`}
            >
              <span className="w-full">
                {hasUnsavedChanges ? "Save Changes" : "All Changes Saved"}
              </span>
            </button>
          </div>
        </section>

        <section className="liquid-glass motion-card motion-card-delay-2 mb-5 rounded-[1.65rem] p-3">
          <div className="liquid-content grid grid-cols-3 gap-2">
            <TabButton
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />

            <TabButton
              label="Bills"
              active={activeTab === "bills"}
              onClick={() => setActiveTab("bills")}
            />

            <TabButton
              label="Cards"
              active={activeTab === "cards"}
              onClick={() => setActiveTab("cards")}
            />
          </div>
        </section>

        {activeTab === "overview" && (
          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.65rem] p-5">
            <div className="liquid-content">
              <SectionHeading
                title="Overview"
                description="Edit the main numbers used on your Dashboard."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyInput
                  label="Checking Balance"
                  value={manualData.checkingBalance}
                  onChange={(value) => updateManualData("checkingBalance", value)}
                />

                <MoneyInput
                  label="Savings Balance"
                  value={manualData.savingsBalance}
                  onChange={(value) => updateManualData("savingsBalance", value)}
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
          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.65rem] p-5">
            <div className="liquid-content">
              <div className="mb-5 flex items-center justify-between gap-4">
                <SectionHeading
                  title="Bills"
                  description={`${manualBills.length} bill${
                    manualBills.length === 1 ? "" : "s"
                  } tracked.`}
                />

                <button
                  type="button"
                  onClick={addBill}
                  className="pressable shrink-0 rounded-2xl border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22"
                >
                  Add
                </button>
              </div>

              <div className="grid gap-3">
                {manualBills.length > 0 ? (
                  manualBills.map((bill, index) => (
                    <BillEditorCard
                      key={`bill-${index}`}
                      bill={bill}
                      index={index}
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
                    text="Add your first bill to start tracking upcoming expenses."
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "cards" && (
          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.65rem] p-5">
            <div className="liquid-content">
              <div className="mb-5 flex items-center justify-between gap-4">
                <SectionHeading
                  title="Credit Cards"
                  description={`${manualCards.length} card${
                    manualCards.length === 1 ? "" : "s"
                  } tracked.`}
                />

                <button
                  type="button"
                  onClick={addCard}
                  className="pressable shrink-0 rounded-2xl border border-[#c7ad75]/30 bg-[#c7ad75]/14 px-4 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/22"
                >
                  Add
                </button>
              </div>

              <div className="grid gap-3">
                {manualCards.length > 0 ? (
                  manualCards.map((card, index) => (
                    <CardEditorCard
                      key={`card-${index}`}
                      card={card}
                      index={index}
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
                    text="Add your first card to start tracking balances and utilization."
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

function TabButton({
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
      onClick={onClick}
      className={`pressable rounded-[1.25rem] border px-3 py-3 text-sm font-semibold transition ${
        active
          ? "border-[#c7ad75]/35 bg-[#c7ad75]/16 text-[#f5f0e8]"
          : "border-[#f5f0e8]/10 bg-[#25231e]/60 text-stone-400 hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
      }`}
    >
      {label}
    </button>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75]" />

        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
          {title}
        </h2>
      </div>

      <p className="text-sm leading-6 text-stone-400">{description}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass-soft rounded-[1.35rem] p-4">
      <div className="liquid-content">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
          {label}
        </p>

        <p className="mt-2 truncate text-lg font-bold text-[#f5f0e8]">
          {value}
        </p>
      </div>
    </div>
  );
}

function BillEditorCard({
  bill,
  isEditing,
  onToggleEditing,
  onRemove,
  onChange,
}: {
  bill: ManualBill;
  index: number;
  isEditing: boolean;
  onToggleEditing: () => void;
  onRemove: () => void;
  onChange: (field: keyof ManualBill, value: string) => void;
}) {
  return (
    <div className="liquid-glass-soft rounded-[1.35rem] p-4">
      <div className="liquid-content">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[#f5f0e8]">
              {bill.name || "Untitled Bill"}
            </p>

            <p className="mt-1 text-sm text-stone-400">
              {formatMoney(bill.amount)} • Due {bill.dueDate || "TBD"}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onToggleEditing}
              className="pressable rounded-xl border border-[#f5f0e8]/10 px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
            >
              {isEditing ? "Done" : "Edit"}
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="pressable rounded-xl border border-[#f5f0e8]/10 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-200"
            >
              Remove
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 grid gap-4 border-t border-[#f5f0e8]/10 pt-4 sm:grid-cols-2">
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
        )}
      </div>
    </div>
  );
}

function CardEditorCard({
  card,
  isEditing,
  onToggleEditing,
  onRemove,
  onChange,
}: {
  card: ManualCreditCard;
  index: number;
  isEditing: boolean;
  onToggleEditing: () => void;
  onRemove: () => void;
  onChange: (field: keyof ManualCreditCard, value: string) => void;
}) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <div className="liquid-glass-soft rounded-[1.35rem] p-4">
      <div className="liquid-content">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[#f5f0e8]">
              {card.name || "Untitled Card"}
            </p>

            <p className="mt-1 text-sm text-stone-400">
              {utilization}% used • {formatMoney(card.balance)}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onToggleEditing}
              className="pressable rounded-xl border border-[#f5f0e8]/10 px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
            >
              {isEditing ? "Done" : "Edit"}
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="pressable rounded-xl border border-[#f5f0e8]/10 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-200"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="liquid-progress h-full rounded-full bg-[#c7ad75]"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>

        {isEditing && (
          <div className="mt-4 grid gap-4 border-t border-[#f5f0e8]/10 pt-4 sm:grid-cols-2">
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
              label="Limit"
              value={card.limit}
              onChange={(value) => onChange("limit", value)}
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
        )}
      </div>
    </div>
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
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={value}
        onFocus={() => clearZeroOnFocus(value, onChange)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-3 text-base font-semibold text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
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
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-3 text-base font-semibold text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
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
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#f5f0e8]/12 bg-[#11100d]/55 px-4 py-3 text-base font-semibold text-[#f5f0e8] outline-none transition focus:border-[#c7ad75]/45 focus:bg-[#11100d]/75"
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
    <div className="liquid-glass-soft rounded-[1.35rem] border-dashed p-5">
      <div className="liquid-content">
        <p className="text-lg font-semibold text-[#f5f0e8]">{title}</p>

        <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>
      </div>
    </div>
  );
}