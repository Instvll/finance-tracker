"use client";

import { ReactNode, useEffect, useState } from "react";
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
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    setManualCards(readCardsStorage());

    const animationDelay = window.setTimeout(() => {
      setBarsReady(true);
    }, 160);

    return () => window.clearTimeout(animationDelay);
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
        <header className="-mt-1 mb-3 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Card Tracker
            </p>

            <Pill>v1.2.2 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Credit Cards
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
                  Card Balance
                </p>
              </div>

              <Pill>{utilization}% used</Pill>
            </div>

            <p className="relative break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
              {formatMoney(totalBalance)}
            </p>

            <UtilizationBar
              utilization={utilization}
              isReady={barsReady}
              className="relative mt-3 bg-black/30"
            />

            <div className="relative mt-3 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-1.5">
              <div className="grid gap-1 sm:grid-cols-2 sm:gap-0">
                <HeroStat
                  label="Credit Left"
                  value={formatMoney(availableCredit)}
                />

                <HeroStat label="Total Limit" value={formatMoney(totalLimit)} />
              </div>
            </div>
          </div>
        </section>

        <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.7rem] p-3.5">
          <div className="liquid-content">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SectionTitle title="Cards" />

                <p className="mt-1.5 text-sm text-stone-400">
                  {hasCards
                    ? `${manualCards.length} card${
                        manualCards.length === 1 ? "" : "s"
                      } tracked • ${utilization}% used`
                    : "No cards added yet"}
                </p>
              </div>

              <Link
                href="/manual?tab=cards"
                className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
              >
                Manage
              </Link>
            </div>

            {hasCards ? (
              <div className="grid gap-2">
                {sortedManualCards.map((card, index) => (
                  <CreditCardRow
                    key={`card-${index}`}
                    card={card}
                    barsReady={barsReady}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No credit cards yet"
                text="Add your first card in the Editor."
                actionLabel="Open Editor"
                actionHref="/manual?tab=cards"
              />
            )}
          </div>
        </section>
      </div>
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.95rem] px-3 py-1.5 sm:border-r sm:border-[#f5f0e8]/10 sm:last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1 truncate text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function UtilizationBar({
  utilization,
  isReady,
  className = "",
}: {
  utilization: number;
  isReady: boolean;
  className?: string;
}) {
  const safeUtilization = Math.min(Math.max(utilization, 0), 100);
  const scale = safeUtilization / 100;

  return (
    <div className={`h-1.5 overflow-hidden rounded-full ${className}`}>
      <div
        className="liquid-progress h-full origin-left rounded-full bg-[#c7ad75]"
        style={{
          transform: `scaleX(${isReady ? scale : 0})`,
          transition: "transform 1150ms cubic-bezier(0.22, 1.08, 0.34, 1)",
          willChange: "transform",
        }}
      />
    </div>
  );
}

function CreditCardRow({
  card,
  barsReady,
}: {
  card: ManualCreditCard;
  barsReady: boolean;
}) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const minimumPayment = parseMoney(card.minimumPayment);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;

  return (
    <div className="rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 p-3 transition hover:border-[#c7ad75]/18 hover:bg-[#f5f0e8]/6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f5f0e8]">
            {card.name || "Untitled Card"}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <InfoChip>{utilization}% used</InfoChip>

            {card.dueDate ? <InfoChip>Due {card.dueDate}</InfoChip> : null}

            {minimumPayment > 0 ? (
              <InfoChip>Min {formatMoney(minimumPayment)}</InfoChip>
            ) : null}

            {card.status !== "Good" ? (
              <StatusChip status={card.status} />
            ) : null}
          </div>
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

      <UtilizationBar
        utilization={utilization}
        isReady={barsReady}
        className="mt-3 bg-black/25"
      />

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-stone-400">
        <span className="truncate">Limit {formatMoney(limit)}</span>
        <span className="shrink-0">
          Credit left {formatMoney(Math.max(limit - balance, 0))}
        </span>
      </div>
    </div>
  );
}

function InfoChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 px-2.5 py-1 text-xs font-medium text-stone-400">
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: ManualCreditCard["status"] }) {
  const tone =
    status === "Pay Down"
      ? "border-[#c7ad75]/25 bg-[#c7ad75]/12 text-[#f5f0e8]"
      : status === "Watch"
      ? "border-[#c7ad75]/20 bg-[#c7ad75]/10 text-[#f5f0e8]"
      : "border-[#f5f0e8]/10 bg-[#11100d]/25 text-stone-400";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {status}
    </span>
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
    <div className="rounded-[1.15rem] border border-dashed border-[#f5f0e8]/12 bg-[#11100d]/20 p-3.5">
      <p className="text-base font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-1.5 text-sm leading-6 text-stone-400">{text}</p>

      <Link
        href={actionHref}
        className="pressable mt-3 flex rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-2.5 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
      >
        <span className="w-full">{actionLabel}</span>
      </Link>
    </div>
  );
}