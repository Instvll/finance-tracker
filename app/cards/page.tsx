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
  const [showCardList, setShowCardList] = useState(false);

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

const sortedManualCards = [...manualCards].sort(
  (firstCard, secondCard) =>
    parseMoney(secondCard.balance) - parseMoney(firstCard.balance)
);

const hasCards = manualCards.length > 0;

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-4 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Card Tracker
            </p>

            <Pill>v1.1.1 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Credit Cards
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

            <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="liquid-progress h-full rounded-full bg-[#c7ad75]"
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>

            <div className="relative mt-5 rounded-[1.45rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-2">
              <div className="grid gap-1 sm:grid-cols-3 sm:gap-0">
                <HeroStat
                  label="Credit Left"
                  value={formatMoney(availableCredit)}
                />

                <HeroStat label="Total Limit" value={formatMoney(totalLimit)} />

                <HeroStat label="Cards" value={String(manualCards.length)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
            <div className="liquid-content">
              <button
                type="button"
                onClick={() => setShowCardList((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <SectionTitle title="Card List" />

                  <p className="mt-2 text-sm text-stone-400">
                    {hasCards
                      ? `${manualCards.length} card${
                          manualCards.length === 1 ? "" : "s"
                        } tracked.`
                      : "No cards added yet."}
                  </p>
                </div>

                <span className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                  {showCardList ? "Hide" : "View"}
                </span>
              </button>

              {showCardList && (
                <div className="mt-4 grid pt-1">
                  {manualCards.length > 0 ? (
                    sortedManualCards.map((card, index) => (
  <CreditCardRow key={`card-${index}`} card={card} />
))
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
                      className="pressable mt-2 rounded-full border border-[#f5f0e8]/10 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                    >
                      Edit Credit Cards
                    </Link>
                  )}
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] px-3 py-2 sm:border-r sm:border-[#f5f0e8]/10 sm:last:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1.5 truncate text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
        {label}
      </p>

      <p className="mt-1.5 truncate text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function CreditCardRow({ card }: { card: ManualCreditCard }) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const available = limit - balance;
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <div className="group border-t border-[#f5f0e8]/10 px-3 py-4 transition last:border-b hover:bg-[#f5f0e8]/4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {card.name || "Untitled Card"}
          </p>

          <p className="mt-1 text-sm text-stone-400">{utilization}% used</p>
        </div>

        <p className="shrink-0 text-lg font-bold text-[#f5f0e8]">
          {formatMoney(balance)}
        </p>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="liquid-progress h-full rounded-full bg-[#c7ad75]"
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <CompactStat label="Limit" value={formatMoney(limit)} />
        <CompactStat label="Credit Left" value={formatMoney(available)} />
        <CompactStat label="Status" value={card.status || "Good"} />
      </div>
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
    <div className="rounded-[1.25rem] border border-dashed border-[#f5f0e8]/12 bg-[#11100d]/20 p-4">
      <p className="text-lg font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>

      <Link
        href={actionHref}
        className="pressable mt-4 flex rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
      >
        <span className="w-full">{actionLabel}</span>
      </Link>
    </div>
  );
}