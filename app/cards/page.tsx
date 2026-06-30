"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Card, PageHeader, PageShell, Pill } from "../../components/Layout";
import { creditCards } from "../../data/bandData";

type ManualCreditCard = {
  name: string;
  balance: string;
  limit: string;
  minimumPayment: string;
  dueDate: string;
  status: "Good" | "Watch" | "Pay Down";
};

const cardsStorageKey = "finance-tracker-manual-cards";

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

export default function CardsPage() {
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);

  useEffect(() => {
    const savedCards = window.localStorage.getItem(cardsStorageKey);

    if (savedCards) {
      setManualCards(JSON.parse(savedCards));
    }
  }, []);

  const totalBalance = manualCards.reduce(
    (total, card) => total + parseMoney(card.balance),
    0
  );

  const totalLimit = manualCards.reduce(
    (total, card) => total + parseMoney(card.limit),
    0
  );

  const totalMinimumPayment = manualCards.reduce(
    (total, card) => total + parseMoney(card.minimumPayment),
    0
  );

  const totalUtilization =
    totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Credit"
        title="Credit Cards"
        description="Track card balances, limits, due dates, minimum payments, and utilization."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Balance" value={formatMoney(totalBalance)} />
        <SummaryCard label="Total Limit" value={formatMoney(totalLimit)} />
        <SummaryCard label="Utilization" value={`${totalUtilization}%`} />
        <SummaryCard
          label="Minimum Payments"
          value={formatMoney(totalMinimumPayment)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {manualCards.map((card, index) => {
          const balance = parseMoney(card.balance);
          const limit = parseMoney(card.limit);
          const utilization =
            limit > 0 ? Math.round((balance / limit) * 100) : 0;

          return (
            <Card key={`${card.name}-${index}`}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Pill>{card.status}</Pill>

                    <span className="rounded-full bg-stone-300/10 px-3 py-1 text-xs text-stone-300">
                      Due: {card.dueDate}
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold text-stone-100">
                    {card.name}
                  </h2>
                </div>

                <p className="text-2xl font-bold text-stone-100">
                  {formatMoney(balance)}
                </p>
              </div>

              <div className="grid gap-3 border-t border-stone-300/10 pt-4 text-sm">
                <MetaRow label="Credit Limit" value={formatMoney(limit)} />
                <MetaRow
                  label="Minimum Payment"
                  value={formatMoney(parseMoney(card.minimumPayment))}
                />
                <MetaRow label="Utilization" value={`${utilization}%`} />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
                  <span>Balance Used</span>
                  <span>{utilization}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-amber-100/60"
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </PageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-300/10 bg-[#12110f] p-5 shadow-xl shadow-black/15">
      <p className="text-sm text-stone-400">{label}</p>

      <p className="mt-2 break-words text-3xl font-bold tracking-tight text-stone-100">
        {value}
      </p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-200">{value}</span>
    </div>
  );
}