"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import { PageHeader, PageShell, Pill } from "../components/Layout";
import { financeSummary, bills, creditCards, goals } from "../data/bandData";

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

  useEffect(() => {
    const savedData = window.localStorage.getItem(summaryStorageKey);
    const savedBills = window.localStorage.getItem(billsStorageKey);
    const savedCards = window.localStorage.getItem(cardsStorageKey);

    if (savedData) {
      setManualData(JSON.parse(savedData));
    }

    if (savedBills) {
      setManualBills(JSON.parse(savedBills));
    }

    if (savedCards) {
      setManualCards(JSON.parse(savedCards));
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

      <PageHeader
        eyebrow="Finance Tracker"
        title="Money Dashboard"
        description="A clean view of what matters most: available money, upcoming bills, card balances, and savings."
      />

      <section className="mb-6 overflow-hidden rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-6 shadow-xl shadow-black/10">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.22)]" />

          <p className="text-xs uppercase tracking-[0.25em] text-stone-200/80">
            Main Number
          </p>
        </div>

        <p className="text-sm text-stone-400">Money Left After Bills</p>

        <h1 className="mt-3 break-words text-5xl font-bold tracking-tight text-[#f5f0e8] md:text-7xl">
          {formatMoney(moneyLeftAfterBills)}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
          Your saved checking balance minus unpaid bills.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/manual"
            className="rounded-full border border-stone-100/20 bg-stone-100/10 px-4 py-2 text-sm font-medium text-stone-100 transition hover:bg-stone-100/15"
          >
            Update values
          </Link>

          <Link
            href="/bills"
            className="rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            View bills
          </Link>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard
          label="Checking"
          value={formatMoney(checkingBalance)}
          detail="Current saved balance"
        />

        <SnapshotCard
          label="Upcoming Bills"
          value={formatMoney(totalUpcomingBills)}
          detail="Unpaid bill total"
        />

        <SnapshotCard
          label="Credit Cards"
          value={formatMoney(totalCardBalance)}
          detail={`${totalCardUtilization}% utilization`}
        />

        <SnapshotCard
          label="Savings"
          value={formatMoney(savingsBalance)}
          detail="Current saved balance"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionPanel title="Next Bills">
          <div className="space-y-3">
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
              <MiniCard>
                <p className="text-sm text-stone-400">
                  No unpaid bills right now.
                </p>
              </MiniCard>
            )}
          </div>

          <Link
            href="/bills"
            className="mt-4 inline-block rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            See all bills
          </Link>
        </SectionPanel>

        <SectionPanel title="Credit Cards">
          <div className="space-y-3">
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

          <Link
            href="/cards"
            className="mt-4 inline-block rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            See all cards
          </Link>
        </SectionPanel>

        <SectionPanel title="Goals">
          <div className="space-y-3">
            {goals.slice(0, 2).map((goal) => {
              const progress =
                goal.target > 0
                  ? Math.round((goal.saved / goal.target) * 100)
                  : 0;

              return (
                <MiniCard key={goal.name}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-100">
                        {goal.name}
                      </p>

                      <p className="mt-1 text-sm text-stone-400">
                        {formatMoney(goal.saved)} of {formatMoney(goal.target)}
                      </p>
                    </div>

                    <Pill>{progress}%</Pill>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-black/25">
                    <div
                      className="h-full rounded-full bg-stone-100/55"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </MiniCard>
              );
            })}
          </div>

          <Link
            href="/goals"
            className="mt-4 inline-block rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            See goals
          </Link>
        </SectionPanel>
      </section>
    </PageShell>
  );
}

function SnapshotCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-stone-100/65 shadow-[0_0_14px_rgba(245,240,232,0.18)]" />

        <p className="text-xs uppercase tracking-[0.22em] text-stone-300">
          {label}
        </p>
      </div>

      <p className="break-words text-3xl font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>

      <p className="mt-2 text-sm text-stone-400">{detail}</p>
    </div>
  );
}

function SectionPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center gap-3 border-b border-stone-300/15 pb-4">
        <span className="h-2 w-2 rounded-full bg-stone-100/65 shadow-[0_0_14px_rgba(245,240,232,0.18)]" />

        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function MiniCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.35rem] border border-stone-300/18 bg-[#2b2925] p-5 shadow-sm shadow-black/10 transition hover:border-stone-100/25 hover:bg-[#302e29]">
      {children}
    </div>
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
    <MiniCard>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2">
            <Pill>{tag}</Pill>
          </div>

          <p className="truncate font-semibold text-stone-100">{title}</p>

          <p className="mt-1 truncate text-sm text-stone-400">{subtitle}</p>
        </div>

        <p className="shrink-0 text-lg font-bold text-[#f5f0e8]">{value}</p>
      </div>
    </MiniCard>
  );
}