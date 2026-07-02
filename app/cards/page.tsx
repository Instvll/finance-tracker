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

function readCardsStorage() {
  const savedCards = window.localStorage.getItem(cardsStorageKey);

  if (!savedCards) {
    return defaultManualCards;
  }

  try {
    return JSON.parse(savedCards) as ManualCreditCard[];
  } catch {
    return defaultManualCards;
  }
}

export default function CardsPage() {
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);
  const [showCardList, setShowCardList] = useState(true);

  useEffect(() => {
    setManualCards(readCardsStorage());
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

  const hasCards = manualCards.length > 0;

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Card Tracker
          </p>

          <Pill>v1.0 Beta</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Credit Cards
        </h1>
      </header>

      <section className="mb-5 overflow-hidden rounded-[2.25rem] border border-[#c7ad75]/20 bg-[#1d1b17] shadow-2xl shadow-black/25">
        <div className="relative p-5 sm:p-7">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c7ad75]/10 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

          <div className="relative mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />

                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f5f0e8]">
                  Card Balance
                </p>
              </div>

              <p className="text-sm text-stone-400">
                Total balance across tracked cards.
              </p>
            </div>

            <Pill>{utilization}% used</Pill>
          </div>

          <p className="relative break-words text-6xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
            {formatMoney(totalBalance)}
          </p>

          <div className="relative mt-7 h-2 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-[#c7ad75]"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>

          <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Credit Left" value={formatMoney(availableCredit)} />
            <MiniStat label="Total Limit" value={formatMoney(totalLimit)} />
            <MiniStat label="Cards" value={String(manualCards.length)} />
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        <section className="rounded-[1.65rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
          <button
            type="button"
            onClick={() => setShowCardList((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75]" />

                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                  Card List
                </h2>
              </div>

              <p className="text-sm text-stone-400">
                {hasCards
                  ? `${manualCards.length} card${
                      manualCards.length === 1 ? "" : "s"
                    } tracked.`
                  : "No cards added yet."}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
              {showCardList ? "Hide" : "View"}
            </span>
          </button>

          {showCardList && (
            <div className="mt-4 border-t border-[#f5f0e8]/10 pt-4">
              {manualCards.length > 0 ? (
                <div className="grid gap-3">
                  {manualCards.map((card, index) => (
                    <CreditCardRow key={`card-${index}`} card={card} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No credit cards yet"
                  text="Add your first card in the Editor to start tracking balances, limits, and utilization."
                  actionLabel="Add Card"
                  actionHref="/manual?tab=cards"
                />
              )}

              {manualCards.length > 0 && (
                <Link
                  href="/manual?tab=cards"
                  className="mt-4 flex rounded-2xl border border-[#f5f0e8]/10 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                >
                  <span className="w-full">Edit Credit Cards</span>
                </Link>
              )}
            </div>
          )}
        </section>
      </section>
    </PageShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/75 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-bold text-[#f5f0e8]">{value}</p>
    </div>
  );
}

function CreditCardRow({ card }: { card: ManualCreditCard }) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const available = limit - balance;
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <div className="rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-[#f5f0e8]">
            {card.name || "Untitled Card"}
          </p>

          <p className="mt-1 text-sm text-stone-400">{utilization}% used</p>
        </div>

        <p className="shrink-0 text-xl font-bold text-[#f5f0e8]">
          {formatMoney(balance)}
        </p>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-[#c7ad75]"
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoBox label="Limit" value={formatMoney(limit)} />
        <InfoBox label="Credit Left" value={formatMoney(available)} />
        <InfoBox label="Status" value={card.status || "Good"} />
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/75 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-2 truncate text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  text,
  actionLabel,
  actionHref,
}: {
  title: string;
  text: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-[#f5f0e8]/12 bg-[#25231e] p-5">
      <p className="text-lg font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>

      <Link
        href={actionHref}
        className="mt-4 flex rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
      >
        <span className="w-full">{actionLabel}</span>
      </Link>
    </div>
  );
}