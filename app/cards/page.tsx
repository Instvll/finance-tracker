"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Pill } from "@/components/Layout";
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

function parseMoney(value: string) {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
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

  const overallUtilization =
    totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Credit"
        title="Credit Cards"
        description="Track card balances, limits, due dates, minimum payments, and utilization."
      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total Balance"
          value={formatMoney(totalBalance)}
        />
        <SummaryCard label="Total Limit" value={formatMoney(totalLimit)} />
        <SummaryCard
          label="Utilization"
          value={`${overallUtilization}%`}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {manualCards.map((card) => {
          const balance = parseMoney(card.balance);
          const limit = parseMoney(card.limit);
          const minimumPayment = parseMoney(card.minimumPayment);

          const utilization =
            limit > 0 ? Math.round((balance / limit) * 100) : 0;

          return (
            <Card key={card.name}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <Pill>{`Due: ${card.dueDate || "TBD"}`}</Pill>
                </div>

                <p className="text-3xl font-bold tracking-tight text-stone-100">
                  {formatMoney(balance)}
                </p>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-100">
                {card.name}
              </h2>

              <div className="mt-6 space-y-4 border-t border-stone-300/10 pt-5">
                <InfoRow
                  label="Credit Limit"
                  value={formatMoney(limit)}
                />
                <InfoRow
                  label="Minimum Payment"
                  value={formatMoney(minimumPayment)}
                />
                <InfoRow
                  label="Utilization"
                  value={`${utilization}%`}
                />
                <InfoRow
                  label="Balance Used"
                  value={`${utilization}%`}
                />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-500">
                  <span>Balance Used</span>
                  <span>{utilization}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-stone-300/70"
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-300/15 bg-[#161412] p-5 shadow-lg shadow-black/10">
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-stone-100">
        {value}
      </p>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-base text-stone-400">{label}</span>
      <span className="text-base font-semibold text-stone-100">{value}</span>
    </div>
  );
}