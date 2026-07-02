"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import { PageShell, Pill } from "../components/Layout";
import { financeSummary, bills, creditCards } from "../data/bandData";

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

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function parseMoney(value: string) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
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

export default function Home() {
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);

  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);

  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);

  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    const savedData = window.localStorage.getItem(summaryStorageKey);
    const savedBills = window.localStorage.getItem(billsStorageKey);
    const savedCards = window.localStorage.getItem(cardsStorageKey);
    const savedTime = window.localStorage.getItem(lastSavedStorageKey);

    if (savedData) {
      setManualData(JSON.parse(savedData));
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

  const checkingBalance = parseMoney(manualData.checkingBalance);
  const savingsBalance = parseMoney(manualData.savingsBalance);
  const unpaidBillsTotal = getUnpaidBillTotal(manualBills);
  const moneyLeftAfterBills = checkingBalance - unpaidBillsTotal;

  const totalCardBalance = getTotalCardBalance(manualCards);
  const totalCardLimit = getTotalCardLimit(manualCards);
  const totalCardUtilization =
    totalCardLimit > 0
      ? Math.round((totalCardBalance / totalCardLimit) * 100)
      : 0;

  const unpaidBills = manualBills.filter((bill) => bill.status !== "Paid");
  const nextBills = unpaidBills.slice(0, 3);

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
            Finance Tracker
          </p>

          <Pill>v1.0 Beta</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Dashboard
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Your quick snapshot of available money, bills, credit cards, and
          savings.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Available After Bills
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              Checking balance minus unpaid bills
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
            className="rounded-2xl border border-[#f5f0e8]/12 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/14 hover:text-stone-100"
          >
            Review Bills
          </Link>
        </div>
      </section>

      <section className="mb-5 grid gap-3">
        <MobileStat
          label="Checking"
          value={formatMoney(checkingBalance)}
          detail="Current saved balance"
        />

        <MobileStat
          label="Unpaid Bills"
          value={formatMoney(unpaidBillsTotal)}
          detail={`${unpaidBills.length} bill${
            unpaidBills.length === 1 ? "" : "s"
          } remaining`}
        />

        <MobileStat
          label="Credit Cards"
          value={formatMoney(totalCardBalance)}
          detail={`${totalCardUtilization}% utilization`}
        />

        <MobileStat
          label="Savings"
          value={formatMoney(savingsBalance)}
          detail="Current saved balance"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DashboardSection title="Next Bills" actionLabel="See all" href="/bills">
          <div className="divide-y divide-stone-300/10">
            {nextBills.length > 0 ? (
              nextBills.map((bill, index) => (
                <CompactRow
                  key={`bill-${index}`}
                  title={bill.name}
                  subtitle={`Due ${bill.dueDate || "TBD"} • ${
                    bill.paymentMethod || "TBD"
                  }`}
                  value={formatMoney(parseMoney(bill.amount))}
                  tag={bill.status}
                />
              ))
            ) : (
              <p className="py-4 text-sm text-stone-400">
                No unpaid bills right now.
              </p>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Credit Cards"
          actionLabel="See all"
          href="/cards"
        >
          <div className="divide-y divide-stone-300/10">
            {manualCards.map((card, index) => {
              const balance = parseMoney(card.balance);
              const limit = parseMoney(card.limit);
              const utilization =
                limit > 0 ? Math.round((balance / limit) * 100) : 0;

              return (
                <CompactRow
                  key={`card-${index}`}
                  title={card.name}
                  subtitle={`${utilization}% utilization • Due ${
                    card.dueDate || "TBD"
                  }`}
                  value={formatMoney(balance)}
                  tag={card.status}
                />
              );
            })}
          </div>
        </DashboardSection>
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/10">
        <div className="flex items-start gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-[#c7ad75]/80" />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
              Beta Reminder
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              This version is built for testing the tracking experience. Use
              bills, balances, and due dates only. Avoid entering full card
              numbers, passwords, or sensitive account details.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function MobileStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-4 shadow-xl shadow-black/10">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-stone-400">{detail}</p>
      </div>

      <p className="shrink-0 text-xl font-bold text-[#f5f0e8]">{value}</p>
    </div>
  );
}

function DashboardSection({
  title,
  actionLabel,
  href,
  children,
}: {
  title: string;
  actionLabel: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#f5f0e8]/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#c7ad75]/80" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="shrink-0 text-sm text-stone-400 transition hover:text-stone-100"
        >
          {actionLabel}
        </Link>
      </div>

      {children}
    </section>
  );
}

function CompactRow({
  title,
  subtitle,
  value,
  tag,
}: {
  title: string;
  subtitle: string;
  value: string;
  tag: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="mb-2">
          <Pill>{tag}</Pill>
        </div>

        <p className="truncate font-semibold text-[#f5f0e8]">{title}</p>

        <p className="mt-1 truncate text-sm text-stone-400">{subtitle}</p>
      </div>

      <p className="shrink-0 text-lg font-bold text-[#f5f0e8]">{value}</p>
    </div>
  );
}
