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
  const totalUpcomingBills = getUnpaidBillTotal(manualBills);
  const moneyLeftAfterBills = checkingBalance - totalUpcomingBills;

  const totalCardBalance = getTotalCardBalance(manualCards);
  const totalCardLimit = getTotalCardLimit(manualCards);
  const totalCardUtilization =
    totalCardLimit > 0
      ? Math.round((totalCardBalance / totalCardLimit) * 100)
      : 0;

  const nextBills = manualBills
    .filter((bill) => bill.status !== "Paid")
    .slice(0, 3);

  return (
    <PageShell>
      <TopNav />

      <header className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
          Finance Tracker
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8] md:text-5xl">
              Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-300">
              A clean view of your available money, bills, cards, and savings.
            </p>

            <div className="mt-4 flex w-fit items-center gap-2 rounded-full border border-stone-300/20 bg-stone-100/5 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-stone-100/60" />

              <p className="text-sm text-stone-300">
                Last updated:{" "}
                <span className="font-semibold text-[#f5f0e8]">
                  {formatSavedTime(lastSaved)}
                </span>
              </p>
            </div>
          </div>

          <Link
            href="/manual"
            className="w-fit rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
          >
            Update values
          </Link>
        </div>
      </header>

      <section className="mb-6 overflow-hidden rounded-[2rem] border border-stone-300/20 bg-[#23211d] shadow-xl shadow-black/10">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-stone-300/15 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
                Money Left After Bills
              </p>
            </div>

            <p className="break-words text-6xl font-bold tracking-tight text-[#f5f0e8] md:text-7xl">
              {formatMoney(moneyLeftAfterBills)}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300">
              Your saved checking balance minus unpaid bills.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/bills"
                className="rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
              >
                View bills
              </Link>

              <Link
                href="/cards"
                className="rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
              >
                View credit cards
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <OverviewStat
              label="Checking"
              value={formatMoney(checkingBalance)}
            />

            <OverviewStat
              label="Bills"
              value={formatMoney(totalUpcomingBills)}
            />

            <OverviewStat
              label="Credit"
              value={formatMoney(totalCardBalance)}
              detail={`${totalCardUtilization}% used`}
            />

            <OverviewStat
              label="Savings"
              value={formatMoney(savingsBalance)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DashboardSection
          title="Next Bills"
          actionLabel="See all bills"
          href="/bills"
        >
          <div className="divide-y divide-stone-300/10">
            {nextBills.length > 0 ? (
              nextBills.map((bill, index) => (
                <CompactRow
                  key={`${bill.name}-${index}`}
                  title={bill.name}
                  subtitle={`Due: ${bill.dueDate}`}
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
          actionLabel="See all cards"
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
                  key={`${card.name}-${index}`}
                  title={card.name}
                  subtitle={`${utilization}% utilization`}
                  value={formatMoney(balance)}
                  tag={card.status}
                />
              );
            })}
          </div>
        </DashboardSection>
      </section>
    </PageShell>
  );
}

function OverviewStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-h-32 border-b border-r border-stone-300/10 p-5 even:border-r-0 lg:min-h-0">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>

      <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>

      {detail && <p className="mt-2 text-sm text-stone-400">{detail}</p>}
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
    <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-stone-300/15 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-stone-100/60" />

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