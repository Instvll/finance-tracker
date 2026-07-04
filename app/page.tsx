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
  const [showCards, setShowCards] = useState(false);
  const [showAllBills, setShowAllBills] = useState(false);

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

  const otherBills = manualBills.filter(
    (bill) => getAutoBillStatus(bill.dueDate) === "Paid"
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

const availableCredit = cardLimitTotal - cardBalanceTotal;

const cardUtilization =
  cardLimitTotal > 0
    ? Math.round((cardBalanceTotal / cardLimitTotal) * 100)
    : 0;

const sortedManualCards = [...manualCards].sort(
  (firstCard, secondCard) =>
    parseMoney(secondCard.balance) - parseMoney(firstCard.balance)
);

const moneyLeftAfterBills = checkingBalance - upcomingBillTotal;

  return (
    <PageShell>
      <TopNav />

      <header className="-mt-1 mb-4 motion-card sm:-mt-2">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Finance Tracker
          </p>

          <Pill>v1.1 Beta</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Dashboard
        </h1>
      </header>

      <section className="liquid-glass-accent motion-card motion-card-delay-1 mb-4 rounded-[2.15rem]">
        <div className="liquid-content relative p-4 sm:p-5">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c7ad75]/10 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

          <div className="relative mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />

                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f5f0e8]">
                  Available After Bills
                </p>
              </div>

              <p className="text-sm text-stone-400">
                What&apos;s left after upcoming bills.
              </p>
            </div>

            <Pill>{formatSavedTime(lastSaved)}</Pill>
          </div>

          <p className="relative break-words text-6xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
            {formatMoney(moneyLeftAfterBills)}
          </p>

          <div className="relative mt-5 rounded-[1.45rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-2">
            <div className="grid gap-1 sm:grid-cols-3 sm:gap-0">
              <HeroStat label="Checking" value={formatMoney(checkingBalance)} />
              <HeroStat label="Savings" value={formatMoney(savingsBalance)} />
              <HeroStat
                label="Bills Due Soon"
                value={String(upcomingBills.length)}
                subtext="Within 7 days"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
          <div className="liquid-content">
            <div className="mb-4 flex items-center justify-between gap-4">
              <SectionTitle title="Next Bills" />

              <button
                type="button"
                onClick={() => setShowAllBills((current) => !current)}
                className="pressable rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
              >
                {showAllBills ? "Hide" : "See all"}
              </button>
            </div>

            {upcomingBills.length > 0 ? (
              <div className="grid">
                {upcomingBills.map((bill, index) => (
                  <BillPreviewRow
                    key={`dashboard-upcoming-bill-${index}`}
                    bill={bill}
                  />
                ))}
              </div>
            ) : (
              <EmptyPreview
                title="No bills due soon"
                text="You have nothing due within the next 7 days."
              />
            )}

            {showAllBills && (
              <div className="mt-4 pt-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
                    Other Bills
                  </p>

                  <Link
                    href="/bills"
                    className="text-xs font-semibold text-stone-400 transition hover:text-[#c7ad75]"
                  >
                    Open Bills
                  </Link>
                </div>

                {otherBills.length > 0 ? (
                  <div className="grid">
                    {otherBills.map((bill, index) => (
                      <BillPreviewRow
                        key={`dashboard-other-bill-${index}`}
                        bill={bill}
                        muted
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">
                    No other bills to show yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.85rem] p-4">
          <div className="liquid-content">
            <button
              type="button"
              onClick={() => setShowCards((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <SectionTitle title="Credit Cards" />

                <p className="mt-2 text-sm text-stone-400">
                  {manualCards.length} card
                  {manualCards.length === 1 ? "" : "s"} tracked •{" "}
                  {cardUtilization}% used
                </p>
              </div>

              <span className="pressable rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                {showCards ? "Hide" : "View"}
              </span>
            </button>

            <div className="mt-4 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-2">
              <div className="grid grid-cols-2 gap-1">
                <CompactStat
                  label="Balance"
                  value={formatMoney(cardBalanceTotal)}
                />

                <CompactStat
                  label="Credit Left"
                  value={formatMoney(availableCredit)}
                />
              </div>
            </div>

            {showCards && (
              <div className="mt-4 grid gap-2 pt-1">
                {manualCards.length > 0 ? (
                  sortedManualCards.map((card, index) => {
                    const balance = parseMoney(card.balance);
                    const limit = parseMoney(card.limit);
                    const utilization =
                      limit > 0 ? Math.round((balance / limit) * 100) : 0;

                    return (
                      <CardPreviewRow
                        key={`dashboard-card-${index}`}
                        name={card.name}
                        balance={balance}
                        utilization={utilization}
                      />
                    );
                  })
                ) : (
                  <EmptyPreview
                    title="No credit cards yet"
                    text="Add a card in the Editor to track utilization."
                  />
                )}

                <Link
                  href="/cards"
                  className="pressable mt-2 rounded-full border border-[#f5f0e8]/10 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                >
                  Open Credit Cards
                </Link>
              </div>
            )}
          </div>
        </section>
      </section>
    </PageShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function HeroStat({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-[1rem] px-3 py-2 sm:border-r sm:border-[#f5f0e8]/10 sm:last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1.5 truncate text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>

      {subtext ? (
        <p className="mt-1 text-sm text-stone-400">{subtext}</p>
      ) : null}
    </div>
  );
}

function BillPreviewRow({
  bill,
  muted = false,
}: {
  bill: ManualBill;
  muted?: boolean;
}) {
  return (
    <div className="group border-t border-[#f5f0e8]/10 px-3 py-4 transition last:border-b hover:bg-[#f5f0e8]/4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`truncate text-base font-semibold ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {bill.name || "Untitled Bill"}
          </p>

          <p className="mt-1 text-sm text-stone-400">
            Due {bill.dueDate || "TBD"}
          </p>
        </div>

        <p
          className={`shrink-0 text-lg font-bold ${
            muted ? "text-stone-300" : "text-[#f5f0e8]"
          }`}
        >
          {formatMoney(parseMoney(bill.amount))}
        </p>
      </div>
    </div>
  );
}

function CardPreviewRow({
  name,
  balance,
  utilization,
}: {
  name: string;
  balance: number;
  utilization: number;
}) {
  return (
    <div className="border-t border-[#f5f0e8]/10 px-3 py-4 transition last:border-b hover:bg-[#f5f0e8]/4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {name || "Untitled Card"}
          </p>

          <p className="mt-1 text-sm text-stone-400">{utilization}% used</p>
        </div>

        <p className="shrink-0 text-lg font-bold text-[#f5f0e8]">
          {formatMoney(balance)}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="liquid-progress h-full rounded-full bg-[#c7ad75]"
          style={{
            width: `${Math.min(utilization, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
        {label}
      </p>

      <p className="mt-1.5 truncate text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function EmptyPreview({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-[#f5f0e8]/12 bg-[#11100d]/20 p-4">
      <p className="font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}