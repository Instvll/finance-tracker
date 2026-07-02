"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import { PageShell, Pill } from "../components/Layout";
import { financeSummary, bills, creditCards } from "../data/bandData";
import { getAutoBillStatus } from "../lib/billStatus";

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

export default function DashboardPage() {
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);
  const [lastSaved, setLastSaved] = useState("");

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

  const upcomingBills = manualBills.filter(
    (bill) => getAutoBillStatus(bill.dueDate) === "Upcoming"
  );

  const upcomingBillTotal = upcomingBills.reduce(
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

  const moneyLeftAfterBills = checkingBalance - upcomingBillTotal;

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Finance Tracker
          </p>

          <Pill>v1.0 Beta</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Dashboard
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Your quick snapshot of available money, upcoming bills, credit cards,
          and savings.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f5f0e8]">
                Available After Bills
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              Checking balance minus bills due within 7 days
            </p>
          </div>

          <Pill>{formatSavedTime(lastSaved)}</Pill>
        </div>

        <p className="break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
          {formatMoney(moneyLeftAfterBills)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/manual"
            className="rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
          >
            Open Editor
          </Link>

          <Link
            href="/bills"
            className="rounded-2xl border border-[#f5f0e8]/12 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          >
            Review Bills
          </Link>
        </div>
      </section>

      <section className="mb-5 grid gap-3">
        <MobileStat
          label="Checking"
          detail="Current saved balance"
          value={formatMoney(checkingBalance)}
        />

        <MobileStat
          label="Upcoming Bills"
          detail={`${upcomingBills.length} bill${
            upcomingBills.length === 1 ? "" : "s"
          } due within 7 days`}
          value={formatMoney(upcomingBillTotal)}
        />

        <MobileStat
          label="Credit Cards"
          detail={`${cardUtilization}% utilization`}
          value={formatMoney(cardBalanceTotal)}
        />

        <MobileStat
          label="Savings"
          detail="Current saved balance"
          value={formatMoney(savingsBalance)}
        />
      </section>

      <section className="grid gap-5">
        <DashboardPanel title="Next Bills" href="/bills">
          {upcomingBills.length > 0 ? (
            <div className="divide-y divide-[#f5f0e8]/10">
              {upcomingBills.slice(0, 3).map((bill, index) => (
                <div
                  key={`dashboard-bill-${index}`}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#f5f0e8]">
                      {bill.name || "Untitled Bill"}
                    </p>

                    <p className="mt-1 text-sm text-stone-400">
                      Due {bill.dueDate || "TBD"}
                    </p>
                  </div>

                  <p className="shrink-0 font-bold text-[#f5f0e8]">
                    {formatMoney(parseMoney(bill.amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-400">
              No bills due within the next 7 days.
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel title="Credit Cards" href="/cards">
          {manualCards.length > 0 ? (
            <div className="divide-y divide-[#f5f0e8]/10">
              {manualCards.slice(0, 3).map((card, index) => {
                const balance = parseMoney(card.balance);
                const limit = parseMoney(card.limit);
                const utilization =
                  limit > 0 ? Math.round((balance / limit) * 100) : 0;

                return (
                  <div
                    key={`dashboard-card-${index}`}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#f5f0e8]">
                          {card.name || "Untitled Card"}
                        </p>

                        <p className="mt-1 text-sm text-stone-400">
                          {utilization}% utilization
                        </p>
                      </div>

                      <p className="shrink-0 font-bold text-[#f5f0e8]">
                        {formatMoney(balance)}
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-[#c7ad75]"
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-400">
              No credit cards added yet.
            </p>
          )}
        </DashboardPanel>

        <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />

            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
              Beta Reminder
            </h2>
          </div>

          <p className="text-sm leading-6 text-stone-300">
            This version is built for testing the tracking experience. Use
            bills, balances, and due dates only. Avoid entering full card
            numbers, passwords, or sensitive account details.
          </p>
        </section>
      </section>
    </PageShell>
  );
}

function MobileStat({
  label,
  detail,
  value,
}: {
  label: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-4 shadow-xl shadow-black/15">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-stone-300">{detail}</p>
      </div>

      <p className="shrink-0 text-xl font-bold text-[#f5f0e8]">{value}</p>
    </div>
  );
}

function DashboardPanel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#f5f0e8]/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="text-sm text-stone-300 transition hover:text-[#f5f0e8]"
        >
          See all
        </Link>
      </div>

      {children}
    </section>
  );
}