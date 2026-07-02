"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
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

  const availableCredit = totalLimit - totalBalance;

  const utilization =
    totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  const watchCards = manualCards.filter(
    (card) => card.status === "Watch" || card.status === "Pay Down"
  );

  const hasCards = manualCards.length > 0;

  return (
    <PageShell>
      <TopNav />

      <header className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-lg font-semibold uppercase tracking-[0.24em] text-stone-300">
  Card Tracker
</p>

          <Pill>v1.0 Beta</Pill>
        </div>

        <p className="max-w-xl text-sm leading-6 text-stone-300">
          Track balances, limits, utilization, and upcoming payments.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Total Card Balance
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              {hasCards
                ? "Combined balance across tracked cards"
                : "Add a card to start tracking balances and utilization"}
            </p>
          </div>

          <Pill>{hasCards ? `${utilization}% used` : "empty"}</Pill>
        </div>

        <p className="break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
          {formatMoney(totalBalance)}
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full bg-[#c7ad75]"
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>

        {!hasCards && (
          <div className="mt-5 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d] p-4">
            <p className="text-sm font-semibold text-[#f5f0e8]">
              No credit cards added yet.
            </p>

            <p className="mt-2 text-sm leading-6 text-stone-400">
              Add a card when you want to track balances, limits, utilization,
              and upcoming payments.
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/manual"
            className="rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
          >
            Open Editor
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-[#f5f0e8]/12 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/14 hover:text-stone-100"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <section className="mb-5 grid gap-3">
        <MobileStat
          label="Available Credit"
          value={formatMoney(availableCredit)}
          detail="Limit minus current balance"
        />

        <MobileStat
          label="Total Limit"
          value={formatMoney(totalLimit)}
          detail={`${manualCards.length} card${
            manualCards.length === 1 ? "" : "s"
          } tracked`}
        />

        <MobileStat
          label="Watch"
          value={String(watchCards.length)}
          detail="Cards marked watch or pay down"
        />
      </section>

      <section className="grid gap-5">
        <CardSection
          title="Credit Cards"
          description="These cards are included in your dashboard balance and utilization."
        >
          {manualCards.length > 0 ? (
            <div className="space-y-4">
              {manualCards.map((card, index) => (
                <CreditCardRow key={`card-${index}`} card={card} />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="No cards yet"
              title="No credit cards added"
              text="Add your first card in the Editor to start tracking balances, limits, and utilization."
              actionLabel="Add Card"
              actionHref="/manual"
            />
          )}
        </CardSection>
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

function CardSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 border-b border-[#f5f0e8]/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#c7ad75]/80" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
            {title}
          </h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
      </div>

      {children}
    </section>
  );
}

function CreditCardRow({ card }: { card: ManualCreditCard }) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const minimumPayment = parseMoney(card.minimumPayment);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <div className="rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Pill>{utilization}% used</Pill>

            <span className="rounded-full border border-stone-100/10 bg-stone-100/5 px-3 py-1 text-xs font-semibold text-stone-200/85">
              Due {card.dueDate || "TBD"}
            </span>
          </div>

          <p className="truncate text-lg font-semibold text-[#f5f0e8]">
            {card.name || "Untitled Card"}
          </p>

          <p className="mt-1 truncate text-sm text-stone-400">
            {card.status}
          </p>
        </div>

        <p className="shrink-0 text-xl font-bold text-[#f5f0e8]">
          {formatMoney(balance)}
        </p>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/25">
        <div
          className="h-full rounded-full bg-[#c7ad75]"
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoBox label="Limit" value={formatMoney(limit)} />
        <InfoBox label="Minimum" value={formatMoney(minimumPayment)} />
        <InfoBox label="Available" value={formatMoney(limit - balance)} />
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f5f0e8]/10 bg-[#11100d] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  eyebrow,
  title,
  text,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  text: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[#f5f0e8]/12 bg-[#25231e] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c7ad75]/20 bg-stone-100/8">
        <span className="h-2 w-2 rounded-full bg-[#c7ad75]/80" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
        {eyebrow}
      </p>

      <p className="mt-2 text-lg font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>

      <Link
        href={actionHref}
        className="mt-4 inline-flex rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
