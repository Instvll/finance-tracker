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

function scrollExpandedSectionIntoView(sectionId: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const section = document.getElementById(sectionId);

      if (!section) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      section.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  });
}

export default function CardsPage() {
  const [manualCards, setManualCards] =
    useState<ManualCreditCard[]>(defaultManualCards);
  const [barsReady, setBarsReady] = useState(false);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    setManualCards(readCardsStorage());

    const animationDelay = window.setTimeout(() => {
      setBarsReady(true);
    }, 160);

    return () => window.clearTimeout(animationDelay);
  }, []);

  function toggleCard(index: number) {
    const isOpening = expandedCardIndex !== index;

    setExpandedCardIndex(isOpening ? index : null);

    if (isOpening) {
      scrollExpandedSectionIntoView(`credit-card-${index}`);
    }
  }

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
        <header className="-mt-1 mb-1.5 motion-card sm:-mt-2">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
            Card Tracker
          </p>

          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Credit Cards
          </h1>
        </header>

        <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 mb-2 rounded-[2rem]">
          <div className="liquid-content dashboard-hero-content relative p-3 sm:p-3.5">
            <div
              className="dashboard-hero-glow dashboard-hero-glow-accent"
              aria-hidden="true"
            />

            <div
              className="dashboard-hero-glow dashboard-hero-glow-soft"
              aria-hidden="true"
            />

            <div className="dashboard-hero-reflection" aria-hidden="true" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5 pr-1">
                <span className="dashboard-hero-status-dot mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                  Total Card Balance
                </p>
              </div>

              <div className="shrink-0">
                <Pill>{utilization}% used</Pill>
              </div>
            </div>

            <div className="relative mt-2.5">
              <p className="dashboard-hero-balance break-words text-[3rem] font-bold leading-none tracking-[-0.045em] text-[#f5f0e8] sm:text-6xl">
                {formatMoney(totalBalance)}
              </p>
            </div>

            <UtilizationBar
              utilization={utilization}
              isReady={barsReady}
              className="dashboard-progress-track relative mt-2.5"
            />

            <div className="relative mt-2.5 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
              <HeroMetricRow
                label="Available Credit"
                value={formatMoney(Math.max(availableCredit, 0))}
              />

              <HeroMetricRow
                label="Total Limit"
                value={formatMoney(totalLimit)}
              />

              <HeroMetricRow
                label="Minimum Due"
                value={formatMoney(totalMinimumPayment)}
                last
              />
            </div>
          </div>
        </section>

        <section className="dashboard-surface dashboard-cards-surface motion-card motion-card-delay-2 rounded-[1.7rem] border border-[#f5f0e8]/10 bg-[#f5f0e8]/[0.035] p-2.5 shadow-[inset_0_1px_0_rgba(245,240,232,0.07),0_18px_36px_rgba(0,0,0,0.10)]">
          <div className="dashboard-surface-glow" aria-hidden="true" />

          <div className="liquid-content">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SectionTitle title="Your Cards" />

                <p className="mt-1 text-sm text-stone-300/70">
                  {hasCards
                    ? `${manualCards.length} card${
                        manualCards.length === 1 ? "" : "s"
                      } • ${utilization}% overall utilization`
                    : "No cards added yet"}
                </p>
              </div>

              <Link
                href="/manual?tab=cards"
                className="dashboard-pill-button pressable shrink-0 !px-2.5 !py-0.5"
              >
                Manage
              </Link>
            </div>

            {hasCards ? (
              <div className="grid gap-1">
                {sortedManualCards.map((card, index) => (
                  <CreditCardRow
                    key={`card-${index}`}
                    card={card}
                    barsReady={barsReady}
                    isExpanded={expandedCardIndex === index}
                    cardId={`credit-card-${index}`}
                    detailsId={`card-details-${index}`}
                    onToggle={() => toggleCard(index)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No credit cards yet"
                text="Add a card in the Editor to start tracking it here."
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
    <div className="flex items-center gap-2.5">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function HeroMetricRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="shrink-0 text-base font-bold tracking-tight text-[#f5f0e8]">
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
        className="liquid-progress dashboard-progress-fill h-full origin-left rounded-full"
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
  isExpanded,
  cardId,
  detailsId,
  onToggle,
}: {
  card: ManualCreditCard;
  barsReady: boolean;
  isExpanded: boolean;
  cardId: string;
  detailsId: string;
  onToggle: () => void;
}) {
  const balance = parseMoney(card.balance);
  const limit = parseMoney(card.limit);
  const minimumPayment = parseMoney(card.minimumPayment);
  const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;
  const creditLeft = Math.max(limit - balance, 0);

  return (
    <article
      id={cardId}
      className={`scroll-mt-28 relative overflow-hidden rounded-[1.2rem] border transition duration-200 ${
        isExpanded
          ? "border-[#c7ad75]/28 bg-[#f5f0e8]/[0.075] shadow-[inset_0_1px_0_rgba(245,240,232,0.10),0_14px_28px_rgba(0,0,0,0.10)]"
          : "border-[#f5f0e8]/11 bg-[#f5f0e8]/[0.045] shadow-[inset_0_1px_0_rgba(245,240,232,0.07),0_8px_20px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#f5f0e8]/26 to-transparent"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        className="pressable relative block w-full px-3.5 py-2.5 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#f5f0e8]">
              {card.name || "Untitled Card"}
            </p>

            <p className="mt-0.5 text-xs font-medium text-stone-300/70">
              {utilization}% used
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-2.5">
            <p className="text-right text-xl font-bold tracking-tight text-[#f5f0e8]">
              {formatMoney(balance)}
            </p>

            <ChevronIcon isExpanded={isExpanded} />
          </div>
        </div>

        <UtilizationBar
          utilization={utilization}
          isReady={barsReady}
          className="dashboard-progress-track mt-2"
        />

        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-stone-200">
            {formatMoney(creditLeft)}
          </p>

          <p className="shrink-0 text-xs text-stone-300/60">
            Available credit
          </p>
        </div>
      </button>

      <div
        id={detailsId}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-3.5 border-t border-[#f5f0e8]/12 pb-2.5 pt-2">
            <CardDetailRow
              label="Credit Limit"
              value={formatMoney(limit)}
            />

            <CardDetailRow
              label="Minimum Due"
              value={formatMoney(minimumPayment)}
            />

            <CardDetailRow
              label="Due Date"
              value={formatCardDueDate(card.dueDate)}
              last
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function CardDetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-1.5 ${
        last ? "" : "border-b border-[#f5f0e8]/10"
      }`}
    >
      <p className="text-xs font-medium text-stone-300/60">
        {label}
      </p>

      <p className="shrink-0 text-sm font-semibold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#f5f0e8]/14 bg-[#f5f0e8]/8 text-stone-300/75 shadow-[inset_0_1px_0_rgba(245,240,232,0.06)]">
      <svg
        className={`h-3.5 w-3.5 transition-transform duration-200 ${
          isExpanded ? "rotate-180" : ""
        }`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function formatCardDueDate(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (
    !normalizedValue ||
    ["tbd", "not set", "none", "-", "—"].includes(normalizedValue)
  ) {
    return "Not set";
  }

  return value;
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
    <div className="dashboard-empty-preview !p-2.5">
      <p className="font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-1 text-sm leading-6 text-stone-400">{text}</p>

      <Link
        href={actionHref}
        className="dashboard-wide-button pressable mt-2 !py-2.5"
      >
        {actionLabel}
      </Link>
    </div>
  );
}