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

const sections: { id: ManualSection; label: string; description: string }[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Update your main balances and payday info.",
  },
  {
    id: "bills",
    label: "Bills",
    description: "Add, remove, or edit monthly bills.",
  },
  {
    id: "cards",
    label: "Credit Cards",
    description: "Update card balances, limits, and due dates.",
  },
  {
    id: "preview",
    label: "Preview",
    description: "Check the numbers before saving.",
  },
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

export default function ManualPage() {
  const [activeSection, setActiveSection] =
    useState<ManualSection>("overview");

  const [formData, setFormData] = useState<ManualFinanceData>(defaultData);
  const [manualBills, setManualBills] = useState<ManualBill[]>(defaultBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultCards);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedData = window.localStorage.getItem(summaryStorageKey);
    const savedBills = window.localStorage.getItem(billsStorageKey);
    const savedCards = window.localStorage.getItem(cardsStorageKey);

    if (savedData) {
      setFormData(JSON.parse(savedData));
    }

    if (savedBills) {
      setManualBills(JSON.parse(savedBills));
    }

    if (savedCards) {
      setManualCards(JSON.parse(savedCards));
    }
  }, []);

  function updateField(field: keyof ManualFinanceData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setSavedMessage("");
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

    setSavedMessage("");
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

    setSavedMessage("");
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

    setSavedMessage("");
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

    setSavedMessage("");
  }

  function removeBill(index: number) {
    setManualBills((currentBills) =>
      currentBills.filter((_, billIndex) => billIndex !== index)
    );

    setSavedMessage("");
  }

  function removeCard(index: number) {
    setManualCards((currentCards) =>
      currentCards.filter((_, cardIndex) => cardIndex !== index)
    );

    setSavedMessage("");
  }

  function saveData() {
    window.localStorage.setItem(summaryStorageKey, JSON.stringify(formData));
    window.localStorage.setItem(billsStorageKey, JSON.stringify(manualBills));
    window.localStorage.setItem(cardsStorageKey, JSON.stringify(manualCards));
    setSavedMessage("Saved on this device.");
  }

  function resetData() {
    window.localStorage.removeItem(summaryStorageKey);
    window.localStorage.removeItem(billsStorageKey);
    window.localStorage.removeItem(cardsStorageKey);
    setFormData(defaultData);
    setManualBills(defaultBills);
    setManualCards(defaultCards);
    setSavedMessage("Reset to default data.");
  }

  const unpaidBillTotal = getUnpaidBillTotal(manualBills);
  const checkingBalance = parseMoney(formData.checkingBalance);
  const moneyLeftAfterBills = checkingBalance - unpaidBillTotal;
  const totalCardBalance = getTotalCardBalance(manualCards);
  const totalCardLimit = getTotalCardLimit(manualCards);
  const totalCardUtilization =
    totalCardLimit > 0 ? Math.round((totalCardBalance / totalCardLimit) * 100) : 0;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Manual Entry"
        title="Update Values"
        description="Edit one section at a time so the tracker stays clean, simple, and easy to manage."
      />

      <section className="mb-6 rounded-[1.75rem] border border-stone-300/20 bg-[#23211d] p-3 shadow-xl shadow-black/10">
        <div className="grid gap-2 md:grid-cols-4">
          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-stone-100/30 bg-stone-100/12 text-stone-100"
                    : "border-transparent bg-transparent text-stone-400 hover:border-stone-300/20 hover:bg-stone-100/6 hover:text-stone-200"
                }`}
              >
                <p className="font-semibold">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-stone-400">
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.45fr]">
        <div className="space-y-6">
          {activeSection === "overview" && (
            <Panel title="Overview">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Checking Balance"
                  value={formData.checkingBalance}
                  type="number"
                  onChange={(value) => updateField("checkingBalance", value)}
                />

                <InputField
                  label="Monthly Income"
                  value={formData.monthlyIncome}
                  type="number"
                  onChange={(value) => updateField("monthlyIncome", value)}
                />

                <InputField
                  label="Savings Balance"
                  value={formData.savingsBalance}
                  type="number"
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-stone-400">
                  Edit bills that should subtract from your money-left-after-bills number.
                </p>

                <button
                  type="button"
                  onClick={addBill}
                  className="w-fit rounded-full border border-stone-300/20 px-5 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
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

                        <h3 className="mt-2 text-lg font-semibold text-stone-100">
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-stone-400">
                  Update credit card balances, limits, due dates, and minimum payments.
                </p>

                <button
                  type="button"
                  onClick={addCard}
                  className="w-fit rounded-full border border-stone-300/20 px-5 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
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

                          <h3 className="mt-2 text-lg font-semibold text-stone-100">
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
                          onChange={(value) =>
                            updateCard(index, "balance", value)
                          }
                        />

                        <InputField
                          label="Credit Limit"
                          value={card.limit}
                          type="number"
                          onChange={(value) => updateCard(index, "limit", value)}
                        />

                        <InputField
                          label="Minimum Payment"
                          value={card.minimumPayment}
                          type="number"
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveData}
              className="rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-2 text-sm font-medium text-stone-100 transition hover:bg-stone-100/15"
            >
              Save Values
            </button>

            <button
              type="button"
              onClick={resetData}
              className="rounded-full border border-stone-300/20 px-5 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
            >
              Reset
            </button>
          </div>

          {savedMessage && (
            <p className="text-sm text-stone-300">{savedMessage}</p>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <p className="text-sm text-stone-400">Money Left After Bills</p>
            <p className="mt-2 break-words text-3xl font-bold text-[#f5f0e8]">
              {formatMoney(moneyLeftAfterBills)}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-stone-400">Unpaid Bills</p>
            <p className="mt-2 text-2xl font-bold text-[#f5f0e8]">
              {formatMoney(unpaidBillTotal)}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-stone-400">Credit Cards</p>
            <p className="mt-2 text-2xl font-bold text-[#f5f0e8]">
              {formatMoney(totalCardBalance)}
            </p>
            <p className="mt-1 text-sm text-stone-400">
              {totalCardUtilization}% utilization
            </p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm text-stone-400">Saved Items</p>
              <Pill>{manualBills.length + manualCards.length}</Pill>
            </div>

            <div className="space-y-2 text-sm text-stone-300">
              <p>{manualBills.length} bills tracked</p>
              <p>{manualCards.length} cards tracked</p>
            </div>
          </Card>
        </aside>
      </section>
    </PageShell>
  );
}

function InputField({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string;
  type: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-3 text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
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
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-3 text-[#f5f0e8] outline-none transition focus:border-stone-100/35 focus:bg-[#1d1b18]"
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