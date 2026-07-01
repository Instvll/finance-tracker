"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "../../components/Layout";
import { bills, creditCards, financeSummary } from "../../data/bandData";

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

type ManualSection = "overview" | "bills" | "cards" | "preview";

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";

const defaultData: ManualFinanceData = {
  checkingBalance: String(financeSummary.checkingBalance),
  monthlyIncome: String(financeSummary.monthlyIncome),
  savingsBalance: String(financeSummary.savingsBalance),
  nextPayday: financeSummary.nextPayday,
};

const defaultBills: ManualBill[] = bills.map((bill) => ({
  name: bill.name,
  amount: String(bill.amount),
  dueDate: bill.dueDate,
  status: bill.status,
  paymentMethod: bill.paymentMethod,
}));

const defaultCards: ManualCreditCard[] = creditCards.map((card) => ({
  name: card.name,
  balance: String(card.balance),
  limit: String(card.limit),
  minimumPayment: String(card.minimumPayment),
  dueDate: card.dueDate,
  status: card.status,
}));

const sections: { id: ManualSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "bills", label: "Bills" },
  { id: "cards", label: "Cards" },
  { id: "preview", label: "Preview" },
];

function formatMoney(value: string | number) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function parseMoney(value: string) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
}

function getUnpaidBillTotal(manualBills: ManualBill[]) {
  return manualBills
    .filter((bill) => bill.status !== "Paid")
    .reduce((total, bill) => total + parseMoney(bill.amount), 0);
}

function getTotalCardBalance(manualCards: ManualCreditCard[]) {
  return manualCards.reduce(
    (total, card) => total + parseMoney(card.balance),
    0
  );
}

function getTotalCardLimit(manualCards: ManualCreditCard[]) {
  return manualCards.reduce((total, card) => total + parseMoney(card.limit), 0);
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

export default function ManualPage() {
  const [activeSection, setActiveSection] =
    useState<ManualSection>("overview");

  const [formData, setFormData] = useState<ManualFinanceData>(defaultData);
  const [manualBills, setManualBills] = useState<ManualBill[]>(defaultBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultCards);

  const [savedMessage, setSavedMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    const savedData = window.localStorage.getItem(summaryStorageKey);
    const savedBills = window.localStorage.getItem(billsStorageKey);
    const savedCards = window.localStorage.getItem(cardsStorageKey);
    const savedTime = window.localStorage.getItem(lastSavedStorageKey);

    if (savedData) {
      setFormData(JSON.parse(savedData));
    }

    if (savedBills) {
      setManualBills(JSON.parse(savedBills));
    }

    if (savedCards) {
      setManualCards(JSON.parse(savedCards));
    }

    if (savedTime) {
      setLastSaved(savedTime);
    }
  }, []);

  function markUnsaved() {
    setSavedMessage("");
  }

  function updateField(field: keyof ManualFinanceData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    markUnsaved();
  }

  function updateBill(index: number, field: keyof ManualBill, value: string) {
    setManualBills((currentBills) =>
      currentBills.map((bill, billIndex) =>
        billIndex === index
          ? {
              ...bill,
              [field]: value,
            }
          : bill
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
        cardIndex === index
          ? {
              ...card,
              [field]: value,
            }
          : card
      )
    );

    markUnsaved();
  }

  function addBill() {
    setManualBills((currentBills) => [
      ...currentBills,
      {
        name: "New Bill",
        amount: "0",
        dueDate: "TBD",
        status: "Upcoming",
        paymentMethod: "Checking",
      },
    ]);

    setActiveSection("bills");
    markUnsaved();
  }

  function addCard() {
    setManualCards((currentCards) => [
      ...currentCards,
      {
        name: "New Card",
        balance: "0",
        limit: "0",
        minimumPayment: "0",
        dueDate: "TBD",
        status: "Good",
      },
    ]);

    setActiveSection("cards");
    markUnsaved();
  }

  function removeBill(index: number) {
    setManualBills((currentBills) =>
      currentBills.filter((_, billIndex) => billIndex !== index)
    );

    markUnsaved();
  }

  function removeCard(index: number) {
    setManualCards((currentCards) =>
      currentCards.filter((_, cardIndex) => cardIndex !== index)
    );

    markUnsaved();
  }

  function saveData() {
    const savedAt = new Date().toISOString();

    window.localStorage.setItem(summaryStorageKey, JSON.stringify(formData));
    window.localStorage.setItem(billsStorageKey, JSON.stringify(manualBills));
    window.localStorage.setItem(cardsStorageKey, JSON.stringify(manualCards));
    window.localStorage.setItem(lastSavedStorageKey, savedAt);

    setLastSaved(savedAt);
    setSavedMessage("Saved.");
  }

  function resetData() {
    const confirmed = window.confirm(
      "Reset all manual finance values on this device?"
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(summaryStorageKey);
    window.localStorage.removeItem(billsStorageKey);
    window.localStorage.removeItem(cardsStorageKey);
    window.localStorage.removeItem(lastSavedStorageKey);

    setFormData(defaultData);
    setManualBills(defaultBills);
    setManualCards(defaultCards);
    setLastSaved("");
    setSavedMessage("Reset to default data.");
  }

  const unpaidBillTotal = getUnpaidBillTotal(manualBills);
  const checkingBalance = parseMoney(formData.checkingBalance);
  const moneyLeftAfterBills = checkingBalance - unpaidBillTotal;
  const totalCardBalance = getTotalCardBalance(manualCards);
  const totalCardLimit = getTotalCardLimit(manualCards);
  const totalCardUtilization =
    totalCardLimit > 0
      ? Math.round((totalCardBalance / totalCardLimit) * 100)
      : 0;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Manual Entry"
        title="Update Values"
        description="Edit one section at a time. Save when you're done, then check the dashboard."
      />

      <section className="mb-6 grid gap-3 md:grid-cols-4">
        <QuickStat
          label="Left After Bills"
          value={formatMoney(moneyLeftAfterBills)}
        />

        <QuickStat label="Unpaid Bills" value={formatMoney(unpaidBillTotal)} />

        <QuickStat
          label="Card Balance"
          value={formatMoney(totalCardBalance)}
        />

        <QuickStat label="Last Saved" value={formatSavedTime(lastSaved)} small />
      </section>

      <section className="sticky top-3 z-20 mb-6 rounded-[1.5rem] border border-stone-300/20 bg-[#1f1e1b]/95 p-2 shadow-xl shadow-black/20 backdrop-blur">
        <div className="grid grid-cols-4 gap-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-[1rem] px-2 py-3 text-center text-xs font-semibold transition sm:text-sm ${
                  isActive
                    ? "bg-stone-100/12 text-[#f5f0e8]"
                    : "text-stone-400 hover:bg-stone-100/8 hover:text-stone-200"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pb-28">
        {activeSection === "overview" && (
          <Panel title="Overview">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[#f5f0e8]">
                Main Numbers
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                These numbers control the main dashboard view.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Checking Balance"
                value={formData.checkingBalance}
                type="number"
                inputMode="decimal"
                onChange={(value) => updateField("checkingBalance", value)}
              />

              <InputField
                label="Monthly Income"
                value={formData.monthlyIncome}
                type="number"
                inputMode="decimal"
                onChange={(value) => updateField("monthlyIncome", value)}
              />

              <InputField
                label="Savings Balance"
                value={formData.savingsBalance}
                type="number"
                inputMode="decimal"
                onChange={(value) => updateField("savingsBalance", value)}
              />

              <InputField
                label="Next Payday"
                value={formData.nextPayday}
                type="text"
                onChange={(value) => updateField("nextPayday", value)}
              />
            </div>
          </Panel>
        )}

        {activeSection === "bills" && (
          <Panel title="Bills">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#f5f0e8]">
                  Bills
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Bills marked paid will not subtract from your money left after bills.
                </p>
              </div>

              <button
                type="button"
                onClick={addBill}
                className="w-full rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-medium text-stone-100 transition hover:bg-stone-100/15 sm:w-fit"
              >
                Add Bill
              </button>
            </div>

            <div className="space-y-4">
              {manualBills.map((bill, index) => (
                <Card key={`${bill.name}-${index}`}>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                        Bill #{index + 1}
                      </p>

                      <h3 className="mt-2 text-xl font-semibold text-[#f5f0e8]">
                        {bill.name || "Unnamed Bill"}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBill(index)}
                      className="rounded-full border border-stone-300/20 px-3 py-1 text-xs text-stone-400 transition hover:border-red-300/30 hover:bg-red-300/10 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Bill Name"
                      value={bill.name}
                      type="text"
                      onChange={(value) => updateBill(index, "name", value)}
                    />

                    <InputField
                      label="Amount"
                      value={bill.amount}
                      type="number"
                      inputMode="decimal"
                      onChange={(value) => updateBill(index, "amount", value)}
                    />

                    <InputField
                      label="Due Date"
                      value={bill.dueDate}
                      type="text"
                      onChange={(value) => updateBill(index, "dueDate", value)}
                    />

                    <SelectField
                      label="Status"
                      value={bill.status}
                      options={["Upcoming", "Due Soon", "Paid", "Overdue"]}
                      onChange={(value) => updateBill(index, "status", value)}
                    />

                    <InputField
                      label="Payment Method"
                      value={bill.paymentMethod}
                      type="text"
                      onChange={(value) =>
                        updateBill(index, "paymentMethod", value)
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Panel>
        )}

        {activeSection === "cards" && (
          <Panel title="Credit Cards">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#f5f0e8]">
                  Credit Cards
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Update balances, limits, minimums, due dates, and status.
                </p>
              </div>

              <button
                type="button"
                onClick={addCard}
                className="w-full rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-medium text-stone-100 transition hover:bg-stone-100/15 sm:w-fit"
              >
                Add Card
              </button>
            </div>

            <div className="space-y-4">
              {manualCards.map((card, index) => {
                const balance = parseMoney(card.balance);
                const limit = parseMoney(card.limit);
                const utilization =
                  limit > 0 ? Math.round((balance / limit) * 100) : 0;

                return (
                  <Card key={`${card.name}-${index}`}>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                          Card #{index + 1}
                        </p>

                        <h3 className="mt-2 text-xl font-semibold text-[#f5f0e8]">
                          {card.name || "Unnamed Card"}
                        </h3>

                        <p className="mt-1 text-sm text-stone-400">
                          {utilization}% utilization
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCard(index)}
                        className="rounded-full border border-stone-300/20 px-3 py-1 text-xs text-stone-400 transition hover:border-red-300/30 hover:bg-red-300/10 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Card Name"
                        value={card.name}
                        type="text"
                        onChange={(value) => updateCard(index, "name", value)}
                      />

                      <InputField
                        label="Balance"
                        value={card.balance}
                        type="number"
                        inputMode="decimal"
                        onChange={(value) =>
                          updateCard(index, "balance", value)
                        }
                      />

                      <InputField
                        label="Credit Limit"
                        value={card.limit}
                        type="number"
                        inputMode="decimal"
                        onChange={(value) => updateCard(index, "limit", value)}
                      />

                      <InputField
                        label="Minimum Payment"
                        value={card.minimumPayment}
                        type="number"
                        inputMode="decimal"
                        onChange={(value) =>
                          updateCard(index, "minimumPayment", value)
                        }
                      />

                      <InputField
                        label="Due Date"
                        value={card.dueDate}
                        type="text"
                        onChange={(value) =>
                          updateCard(index, "dueDate", value)
                        }
                      />

                      <SelectField
                        label="Status"
                        value={card.status}
                        options={["Good", "Watch", "Pay Down"]}
                        onChange={(value) => updateCard(index, "status", value)}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </Panel>
        )}

        {activeSection === "preview" && (
          <Panel title="Preview">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[#f5f0e8]">
                Quick Check
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Review the numbers before saving.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PreviewCard
                label="Money Left After Bills"
                value={formatMoney(moneyLeftAfterBills)}
              />

              <PreviewCard
                label="Checking Balance"
                value={formatMoney(formData.checkingBalance)}
              />

              <PreviewCard
                label="Unpaid Bills"
                value={formatMoney(unpaidBillTotal)}
              />

              <PreviewCard
                label="Credit Card Balance"
                value={formatMoney(totalCardBalance)}
              />

              <PreviewCard
                label="Credit Limit"
                value={formatMoney(totalCardLimit)}
              />

              <PreviewCard
                label="Card Utilization"
                value={`${totalCardUtilization}%`}
              />

              <PreviewCard
                label="Savings Balance"
                value={formatMoney(formData.savingsBalance)}
              />

              <PreviewCard
                label="Next Payday"
                value={formData.nextPayday || "TBD"}
              />
            </div>
          </Panel>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300/20 bg-[#171614]/95 px-4 py-3 shadow-[0_-12px_30px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-stone-400">
              {savedMessage || `Last saved: ${formatSavedTime(lastSaved)}`}
            </p>

            <p className="truncate text-sm font-semibold text-[#f5f0e8]">
              Left after bills: {formatMoney(moneyLeftAfterBills)}
            </p>
          </div>

          <button
            type="button"
            onClick={resetData}
            className="hidden rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 sm:block"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={saveData}
            className="rounded-full border border-stone-100/20 bg-stone-100/12 px-5 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/18"
          >
            Save
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function QuickStat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>

      <p
        className={`mt-2 break-words font-bold text-[#f5f0e8] ${
          small ? "text-lg" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </Card>
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
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-[#f5f0e8]">
        {value}
      </p>
    </Card>
  );
}