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

type PaycheckPlan = {
  name: string;
  payday: string;
  paycheckAmount: string;
  bills: string;
  gasFood: string;
  savings: string;
  debtPayment: string;
  extraSpending: string;
  notes: string;
};

const summaryStorageKey = "finance-tracker-manual-data";
const billsStorageKey = "finance-tracker-manual-bills";
const cardsStorageKey = "finance-tracker-manual-cards";
const lastSavedStorageKey = "finance-tracker-last-saved";
const planStorageKey = "finance-tracker-paycheck-plan";

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

const defaultPlan: PaycheckPlan = {
  name: "Next Paycheck",
  payday: "TBD",
  paycheckAmount: "0",
  bills: "0",
  gasFood: "0",
  savings: "0",
  debtPayment: "0",
  extraSpending: "0",
  notes: "",
};

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

function getPlanLeftover(plan: PaycheckPlan) {
  const paycheckAmount = parseMoney(plan.paycheckAmount);
  const plannedTotal =
    parseMoney(plan.bills) +
    parseMoney(plan.gasFood) +
    parseMoney(plan.savings) +
    parseMoney(plan.debtPayment) +
    parseMoney(plan.extraSpending);

  return paycheckAmount - plannedTotal;
}

export default function Home() {
  const [manualData, setManualData] =
    useState<ManualFinanceData>(defaultManualData);

  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);

  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);

  const [paycheckPlan, setPaycheckPlan] = useState<PaycheckPlan>(defaultPlan);
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    const savedData = window.localStorage.getItem(summaryStorageKey);
    const savedBills = window.localStorage.getItem(billsStorageKey);
    const savedCards = window.localStorage.getItem(cardsStorageKey);
    const savedTime = window.localStorage.getItem(lastSavedStorageKey);
    const savedPlan = window.localStorage.getItem(planStorageKey);

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

    if (savedPlan) {
      setPaycheckPlan(JSON.parse(savedPlan));
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
  const planLeftover = getPlanLeftover(paycheckPlan);

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
            Finance Tracker
          </p>

          <Pill>Beta</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Dashboard
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          A quick view of what you have, what is still due, and what is safe to
          use.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Safe After Bills
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              Checking minus unpaid bills
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
            className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
          >
            Update Money
          </Link>

          <Link
            href="/plan"
            className="rounded-2xl border border-stone-300/20 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            Plan Paycheck
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
          detail={`${unpaidBills.length} bill${unpaidBills.length === 1 ? "" : "s"} remaining`}
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

      <section className="mb-5 rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-stone-300/15 pb-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/60" />

              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
                Paycheck Planner
              </h2>
            </div>

            <p className="text-sm text-stone-400">
              {paycheckPlan.name || "Next Paycheck"} •{" "}
              {paycheckPlan.payday || "TBD"}
            </p>
          </div>

          <Link
            href="/plan"
            className="shrink-0 text-sm text-stone-400 transition hover:text-stone-100"
          >
            Open
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MiniStat
            label="Paycheck"
            value={formatMoney(parseMoney(paycheckPlan.paycheckAmount))}
          />

          <MiniStat label="Leftover" value={formatMoney(planLeftover)} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DashboardSection title="Next Bills" actionLabel="See all" href="/bills">
          <div className="divide-y divide-stone-300/10">
            {nextBills.length > 0 ? (
              nextBills.map((bill, index) => (
                <CompactRow
                  key={`bill-${index}`}
                  title={bill.name}
                  subtitle={`Due ${bill.dueDate || "TBD"} • ${bill.paymentMethod || "TBD"}`}
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
                  subtitle={`${utilization}% utilization • Due ${card.dueDate || "TBD"}`}
                  value={formatMoney(balance)}
                  tag={card.status}
                />
              );
            })}
          </div>
        </DashboardSection>
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
        <div className="flex items-start gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-stone-100/60" />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
              Testing Note
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-400">
              This is a beta version. Use the Editor to test balances, bills,
              and cards. Avoid entering full card numbers, passwords, or other
              sensitive details.
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
    <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-stone-300/20 bg-[#23211d] p-4 shadow-xl shadow-black/10">
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

function MiniStat({ label, value }: { label: string; value: string }) {
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