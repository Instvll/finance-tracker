"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { financeSummary, bills, creditCards } from "../../data/bandData";

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

type EditorTab = "overview" | "bills" | "cards";

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

function parseMoney(value: string) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
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

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<EditorTab>("overview");
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);
  const [lastSaved, setLastSaved] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setManualData(readJsonStorage(summaryStorageKey, defaultManualData));
    setManualBills(readJsonStorage(billsStorageKey, defaultManualBills));
    setManualCards(readJsonStorage(cardsStorageKey, defaultManualCards));

    const savedTime = window.localStorage.getItem(lastSavedStorageKey);

    if (savedTime) {
      setLastSaved(savedTime);
    }
  }, []);

  const checkingBalance = parseMoney(manualData.checkingBalance);
  const savingsBalance = parseMoney(manualData.savingsBalance);

  const unpaidBillTotal = manualBills
    .filter((bill) => bill.status !== "Paid")
    .reduce((total, bill) => total + parseMoney(bill.amount), 0);

  const paidBillTotal = manualBills
    .filter((bill) => bill.status === "Paid")
    .reduce((total, bill) => total + parseMoney(bill.amount), 0);

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

  const moneyLeftAfterBills = checkingBalance - unpaidBillTotal;

  function updateManualData(field: keyof ManualFinanceData, value: string) {
    setManualData((current) => ({
      ...current,
      [field]: value,
    }));

    setSaveMessage("");
  }

  function updateBill(
    index: number,
    field: keyof ManualBill,
    value: ManualBill[keyof ManualBill]
  ) {
    setManualBills((current) =>
      current.map((bill, billIndex) =>
        billIndex === index
          ? {
              ...bill,
              [field]: value,
            }
          : bill
      )
    );

    setSaveMessage("");
  }

  function updateCard(
    index: number,
    field: keyof ManualCreditCard,
    value: ManualCreditCard[keyof ManualCreditCard]
  ) {
    setManualCards((current) =>
      current.map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              [field]: value,
            }
          : card
      )
    );

    setSaveMessage("");
  }

  function addBill() {
    setManualBills((current) => [
      ...current,
      {
        name: "New Bill",
        amount: "0",
        dueDate: "TBD",
        status: "Upcoming",
        paymentMethod: "TBD",
      },
    ]);

    setActiveTab("bills");
    setSaveMessage("");
  }

  function removeBill(index: number) {
    const confirmed = window.confirm("Remove this bill?");

    if (!confirmed) {
      return;
    }

    setManualBills((current) =>
      current.filter((_, billIndex) => billIndex !== index)
    );

    setSaveMessage("");
  }

  function addCard() {
    setManualCards((current) => [
      ...current,
      {
        name: "New Card",
        balance: "0",
        limit: "0",
        minimumPayment: "0",
        dueDate: "TBD",
        status: "Good",
      },
    ]);

    setActiveTab("cards");
    setSaveMessage("");
  }

  function removeCard(index: number) {
    const confirmed = window.confirm("Remove this credit card?");

    if (!confirmed) {
      return;
    }

    setManualCards((current) =>
      current.filter((_, cardIndex) => cardIndex !== index)
    );

    setSaveMessage("");
  }

  function saveAll() {
    const savedAt = new Date().toISOString();

    window.localStorage.setItem(summaryStorageKey, JSON.stringify(manualData));
    window.localStorage.setItem(billsStorageKey, JSON.stringify(manualBills));
    window.localStorage.setItem(cardsStorageKey, JSON.stringify(manualCards));
    window.localStorage.setItem(lastSavedStorageKey, savedAt);

    setLastSaved(savedAt);
    setSaveMessage("Saved.");
  }

  function resetEditor() {
    const confirmed = window.confirm(
      "Reset the editor back to the default starter data?"
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(summaryStorageKey);
    window.localStorage.removeItem(billsStorageKey);
    window.localStorage.removeItem(cardsStorageKey);
    window.localStorage.removeItem(lastSavedStorageKey);

    setManualData(defaultManualData);
    setManualBills(defaultManualBills);
    setManualCards(defaultManualCards);
    setLastSaved("");
    setSaveMessage("Reset complete.");
  }

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
          Editor
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Update Your Money
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Edit your balances, bills, and credit cards. Save once and the whole
          dashboard updates.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Live Preview
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              Money left after unpaid bills
            </p>
          </div>

          <Pill>{saveMessage || formatSavedTime(lastSaved)}</Pill>
        </div>

        <p className="break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
          {formatMoney(moneyLeftAfterBills)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <PreviewStat label="Checking" value={formatMoney(checkingBalance)} />
          <PreviewStat label="Bills" value={formatMoney(unpaidBillTotal)} />
          <PreviewStat label="Credit" value={formatMoney(cardBalanceTotal)} />
          <PreviewStat label="Savings" value={formatMoney(savingsBalance)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={saveAll}
            className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-4 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
          >
            Save Everything
          </button>

          <button
            type="button"
            onClick={resetEditor}
            className="rounded-2xl border border-stone-300/20 px-4 py-3 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="sticky top-3 z-20 mb-5 rounded-[1.5rem] border border-stone-300/20 bg-[#1f1e1b]/95 p-2 shadow-xl shadow-black/20 backdrop-blur">
        <div className="grid grid-cols-3 gap-2">
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
        <section className="grid gap-5">
          <EditorPanel
            title="Main Numbers"
            description="These numbers feed the dashboard summary."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Checking Balance"
                value={manualData.checkingBalance}
                type="number"
                inputMode="decimal"
                onChange={(value) => updateManualData("checkingBalance", value)}
              />

              <InputField
                label="Savings Balance"
                value={manualData.savingsBalance}
                type="number"
                inputMode="decimal"
                onChange={(value) => updateManualData("savingsBalance", value)}
              />

              <InputField
                label="Monthly Income"
                value={manualData.monthlyIncome}
                type="number"
                inputMode="decimal"
                onChange={(value) => updateManualData("monthlyIncome", value)}
              />

              <InputField
                label="Next Payday"
                value={manualData.nextPayday}
                type="text"
                onChange={(value) => updateManualData("nextPayday", value)}
              />
            </div>
          </EditorPanel>

          <EditorPanel
            title="Quick Actions"
            description="Jump straight into adding something new."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={addBill}
                className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-4 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
              >
                Add Bill
              </button>

              <button
                type="button"
                onClick={addCard}
                className="rounded-2xl border border-stone-300/20 px-5 py-4 text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
              >
                Add Credit Card
              </button>
            </div>
          </EditorPanel>
        </section>
      )}

      {activeTab === "bills" && (
        <section className="grid gap-5">
          <EditorPanel
            title="Bills"
            description="Paid bills do not subtract from your money-left number."
            action={
              <button
                type="button"
                onClick={addBill}
                className="rounded-full border border-stone-100/20 bg-stone-100/10 px-4 py-2 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
              >
                Add
              </button>
            }
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <PreviewStat label="Unpaid" value={formatMoney(unpaidBillTotal)} />
              <PreviewStat label="Paid" value={formatMoney(paidBillTotal)} />
            </div>

            <div className="space-y-4">
              {manualBills.map((bill, index) => (
                <BillEditor
                  key={`${bill.name}-${index}`}
                  bill={bill}
                  index={index}
                  onChange={updateBill}
                  onRemove={removeBill}
                />
              ))}
            </div>
          </EditorPanel>
        </section>
      )}

      {activeTab === "cards" && (
        <section className="grid gap-5">
          <EditorPanel
            title="Credit Cards"
            description="Balances and limits feed your utilization preview."
            action={
              <button
                type="button"
                onClick={addCard}
                className="rounded-full border border-stone-100/20 bg-stone-100/10 px-4 py-2 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
              >
                Add
              </button>
            }
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <PreviewStat
                label="Balance"
                value={formatMoney(cardBalanceTotal)}
              />
              <PreviewStat label="Used" value={`${cardUtilization}%`} />
            </div>

            <div className="space-y-4">
              {manualCards.map((card, index) => (
                <CardEditor
                  key={`${card.name}-${index}`}
                  card={card}
                  index={index}
                  onChange={updateCard}
                  onRemove={removeCard}
                />
              ))}
            </div>
          </EditorPanel>
        </section>
      )}

      <div className="sticky bottom-4 z-30 mt-6 rounded-[1.5rem] border border-stone-300/20 bg-[#1f1e1b]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs uppercase tracking-[0.2em] text-stone-500">
              Money Left
            </p>

            <p className="truncate text-xl font-bold text-[#f5f0e8]">
              {formatMoney(moneyLeftAfterBills)}
            </p>
          </div>

          <button
            type="button"
            onClick={saveAll}
            className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-semibold text-[#f5f0e8]"
          >
            Save
          </button>
        </div>
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
      className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
        active
          ? "bg-stone-100/12 text-[#f5f0e8]"
          : "text-stone-400 hover:bg-stone-100/8 hover:text-stone-100"
      }`}
    >
      {label}
    </button>
  );
}

function EditorPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-stone-300/15 pb-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-stone-100/60" />

            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
              {title}
            </h2>
          </div>

          <p className="text-sm leading-6 text-stone-400">{description}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-300/15 bg-[#2b2925] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function BillEditor({
  bill,
  index,
  onChange,
  onRemove,
}: {
  bill: ManualBill;
  index: number;
  onChange: (
    index: number,
    field: keyof ManualBill,
    value: ManualBill[keyof ManualBill]
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-stone-300/15 bg-[#2b2925] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Pill>{bill.status}</Pill>

          <h3 className="mt-3 truncate text-xl font-bold text-[#f5f0e8]">
            {bill.name || "Untitled Bill"}
          </h3>

          <p className="mt-1 text-sm text-stone-400">
            {formatMoney(parseMoney(bill.amount))} • Due {bill.dueDate || "TBD"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-full border border-stone-300/20 px-3 py-1 text-xs text-stone-400 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Name"
          value={bill.name}
          type="text"
          onChange={(value) => onChange(index, "name", value)}
        />

        <InputField
          label="Amount"
          value={bill.amount}
          type="number"
          inputMode="decimal"
          onChange={(value) => onChange(index, "amount", value)}
        />

        <InputField
          label="Due Date"
          value={bill.dueDate}
          type="text"
          onChange={(value) => onChange(index, "dueDate", value)}
        />

        <InputField
          label="Payment Method"
          value={bill.paymentMethod}
          type="text"
          onChange={(value) => onChange(index, "paymentMethod", value)}
        />

        <SelectField
          label="Status"
          value={bill.status}
          options={["Paid", "Upcoming", "Due Soon", "Overdue"]}
          onChange={(value) =>
            onChange(index, "status", value as ManualBill["status"])
          }
        />
      </div>
    </div>
  );
}

function CardEditor({
  card,
  index,
  onChange,
  onRemove,
}: {
  card: ManualCreditCard;
  index: number;
  onChange: (
    index: number,
    field: keyof ManualCreditCard,
    value: ManualCreditCard[keyof ManualCreditCard]
  ) => void;
  onRemove: (index: number) => void;
}) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <div className="rounded-[1.35rem] border border-stone-300/15 bg-[#2b2925] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Pill>{utilization}% used</Pill>

          <h3 className="mt-3 truncate text-xl font-bold text-[#f5f0e8]">
            {card.name || "Untitled Card"}
          </h3>

          <p className="mt-1 text-sm text-stone-400">
            {formatMoney(balance)} of {formatMoney(limit)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-full border border-stone-300/20 px-3 py-1 text-xs text-stone-400 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
        >
          Remove
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/25">
        <div
          className="h-full rounded-full bg-stone-100/55"
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Name"
          value={card.name}
          type="text"
          onChange={(value) => onChange(index, "name", value)}
        />

        <InputField
          label="Balance"
          value={card.balance}
          type="number"
          inputMode="decimal"
          onChange={(value) => onChange(index, "balance", value)}
        />

        <InputField
          label="Limit"
          value={card.limit}
          type="number"
          inputMode="decimal"
          onChange={(value) => onChange(index, "limit", value)}
        />

        <InputField
          label="Minimum Payment"
          value={card.minimumPayment}
          type="number"
          inputMode="decimal"
          onChange={(value) => onChange(index, "minimumPayment", value)}
        />

        <InputField
          label="Due Date"
          value={card.dueDate}
          type="text"
          onChange={(value) => onChange(index, "dueDate", value)}
        />

        <SelectField
          label="Status"
          value={card.status}
          options={["Good", "Watch", "Pay Down"]}
          onChange={(value) =>
            onChange(index, "status", value as ManualCreditCard["status"])
          }
        />
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  type,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  type: "text" | "number";
  inputMode?: "decimal" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
      />
    </label>
  );
}

function SelectField({
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
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition focus:border-stone-100/35 focus:bg-[#1d1b18]"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#171614]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}