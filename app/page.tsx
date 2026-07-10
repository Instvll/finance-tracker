"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../components/TopNav";
import { PageShell, Pill } from "../components/Layout";
import { financeSummary, bills, creditCards } from "../data/bandData";
import { getAutoBillStatus, sortBillsByDueDay } from "../lib/billStatus";

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

  const upcomingBills = sortBillsByDueDay(
    manualBills.filter(
      (bill) => getAutoBillStatus(bill.dueDate) === "Upcoming"
    )
  );

  const otherBills = sortBillsByDueDay(
    manualBills.filter((bill) => getAutoBillStatus(bill.dueDate) === "Paid")
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

      <header className="-mt-1 mb-3 motion-card sm:-mt-2">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Finance Tracker
          </p>

          <Pill>v1.2.2 Beta</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Dashboard
        </h1>
      </header>

      <section className="liquid-glass-accent hero-glass-card motion-card motion-card-delay-1 mb-3 rounded-[2rem]">
        <div className="liquid-content relative p-3.5 sm:p-5">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#c7ad75]/10 blur-3xl" />
          <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

          <div className="relative mb-2.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />

              <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                Available Balance After Upcoming Bills
              </p>
            </div>

            <Pill>{formatSavedTime(lastSaved)}</Pill>
          </div>

          <p className="relative break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
            {formatMoney(moneyLeftAfterBills)}
          </p>

          <div className="relative mt-3 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-1.5">
            <div className="grid gap-1 sm:grid-cols-2 sm:gap-0">
              <HeroStat label="Checking" value={formatMoney(checkingBalance)} />
              <HeroStat label="Savings" value={formatMoney(savingsBalance)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.7rem] p-3.5">
          <div className="liquid-content">
            <div className="mb-3 flex items-center justify-between gap-4">
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
              <div className="grid gap-2">
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
              <div className="mt-4 border-t border-[#f5f0e8]/10 pt-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/80">
                      Other Bills
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      Outside the current 7-day window.
                    </p>
                  </div>

                  <Link
                    href="/bills"
                    className="pressable rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                  >
                    Open Bills
                  </Link>
                </div>

                {otherBills.length > 0 ? (
                  <div className="grid gap-2">
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

        <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.7rem] p-3.5">
          <div className="liquid-content">
            <button
              type="button"
              onClick={() => setShowCards((current) => !current)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <SectionTitle title="Credit Cards" />

                <p className="mt-1.5 text-sm text-stone-400">
                  {manualCards.length} card
                  {manualCards.length === 1 ? "" : "s"} tracked •{" "}
                  {cardUtilization}% used
                </p>
              </div>

              <span className="pressable rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                {showCards ? "Hide" : "View"}
              </span>
            </button>

            <div className="mt-3 rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-1.5">
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
              <div className="mt-3 grid gap-2 pt-1">
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
                  className="pressable mt-1 rounded-full border border-[#f5f0e8]/10 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
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
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

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
    <div className="rounded-[0.95rem] px-3 py-1.5 sm:border-r sm:border-[#f5f0e8]/10 sm:last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1 truncate text-base font-bold text-[#f5f0e8]">
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
    <div
      className={`group rounded-[1.1rem] border px-3.5 py-3 transition hover:bg-[#f5f0e8]/6 ${
        muted
          ? "border-[#f5f0e8]/10 bg-[#11100d]/20"
          : "border-[#c7ad75]/18 bg-[#11100d]/25"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`truncate text-base font-semibold ${
                muted ? "text-stone-300" : "text-[#f5f0e8]"
              }`}
            >
              {bill.name || "Untitled Bill"}
            </p>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
              Due {bill.dueDate || "TBD"}
            </span>

            {bill.paymentMethod ? (
              <span className="hidden rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 px-2.5 py-0.5 text-xs font-semibold text-stone-500 sm:inline-flex">
                {bill.paymentMethod}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-lg font-bold tracking-tight ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {formatMoney(parseMoney(bill.amount))}
          </p>

          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/65">
            Monthly
          </p>
        </div>
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
    <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/22 p-3 transition hover:bg-[#f5f0e8]/6">
      <div className="mb-2.5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {name || "Untitled Card"}
          </p>

          <p className="mt-0.5 text-sm text-stone-400">
            {utilization}% of limit used
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tracking-tight text-[#f5f0e8]">
            {formatMoney(balance)}
          </p>

          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/65">
            Balance
          </p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
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
    <div className="rounded-[0.95rem] px-3 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
        {label}
      </p>

      <p className="mt-1 truncate text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function EmptyPreview({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.15rem] border border-dashed border-[#f5f0e8]/12 bg-[#11100d]/20 p-3.5">
      <p className="font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-1.5 text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}