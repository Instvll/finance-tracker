"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { creditCards } from "../../data/bandData";
import {
  parseMoney,
  type ManualCreditCard,
} from "../../lib/financeData";
import {
  loadFinanceCards,
  saveFinanceCards,
} from "../../lib/financeStorage";

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
  const [expandedCardId, setExpandedCardId] =
    useState<string | null>(null);

  useEffect(() => {
    const savedCards = loadFinanceCards(
      defaultManualCards,
    );

    setManualCards(savedCards);
    saveFinanceCards(savedCards);

    const animationDelay = window.setTimeout(() => {
      setBarsReady(true);
    }, 160);

    return () => window.clearTimeout(animationDelay);
  }, []);

  function toggleCard(cardId: string) {
    const isOpening = expandedCardId !== cardId;

    setExpandedCardId(isOpening ? cardId : null);

    if (isOpening) {
      scrollExpandedSectionIntoView(
        `credit-card-${cardId}`,
      );
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
        <header className="dashboard-intro -mt-1 mb-2 motion-card sm:-mt-2">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-4xl">
            Credit cards
          </h1>

          <p className="mt-1 text-sm leading-6 text-stone-400">
            See balances, utilization, and available credit.
          </p>
        </header>

        <section
          className="liquid-glass-accent hero-glass-card dashboard-hero dashboard-hero-focused cards-hero motion-card motion-card-delay-1 mb-2 rounded-[1.55rem]"
          style={{
            borderRadius: "1.55rem",
            clipPath: "inset(0 round 1.55rem)",
            WebkitClipPath: "inset(0 round 1.55rem)",
          }}
        >
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
                  Total balance
                </p>
              </div>

              <div className="shrink-0">
                <Pill>
                  {manualCards.length} card
                  {manualCards.length === 1 ? "" : "s"}
                </Pill>
              </div>
            </div>

            <div className="relative mt-2.5">
              <p className="dashboard-hero-balance break-words text-[3rem] font-bold leading-none tracking-[-0.045em] text-[#f5f0e8] sm:text-6xl">
                {formatMoney(totalBalance)}
              </p>
            </div>

            <div className="cards-hero-utilization relative mt-3">
              <div className="cards-hero-utilization-heading">
                <span>Credit utilization</span>
                <strong>{utilization}% used</strong>
              </div>

              <UtilizationBar
                utilization={utilization}
                isReady={barsReady}
                className="dashboard-progress-track mt-2"
              />
            </div>

            <div className="cards-hero-metrics relative mt-3">
              <CardsHeroMetric
                label="Available Credit"
                value={formatMoney(Math.max(availableCredit, 0))}
              />

              <CardsHeroMetric
                label="Minimum payments"
                value={formatMoney(totalMinimumPayment)}
              />
            </div>
          </div>
        </section>

        <section
          className="dashboard-surface cards-page-list-section motion-card motion-card-delay-2 overflow-hidden rounded-[1.2rem]"
          style={{
            borderRadius: "1.2rem",
            padding: "0.6rem",
          }}
        >
          <div className="dashboard-surface-glow" aria-hidden="true" />

          <div className="liquid-content">
            <div className="cards-page-section-header">
              <div className="min-w-0">
                <SectionTitle title="Your cards" />

                <p className="cards-page-section-summary mt-1">
                  {hasCards
                    ? "Tap a card for more details"
                    : "No cards added yet"}
                </p>
              </div>

              <Link
                href="/manual?tab=cards"
                className="dashboard-section-link pressable shrink-0"
              >
                Edit
              </Link>
            </div>

            {hasCards ? (
              <div
                className="cards-page-list"
                style={{
                  background: "transparent",
                  borderRadius: 0,
                  overflow: "visible",
                }}
              >
                {sortedManualCards.map((card) => {
                  const cardId = card.id ?? card.name;

                  return (
                    <CreditCardRow
                      key={cardId}
                      card={card}
                      barsReady={barsReady}
                      isExpanded={expandedCardId === cardId}
                      cardId={`credit-card-${cardId}`}
                      detailsId={`card-details-${cardId}`}
                      onToggle={() => toggleCard(cardId)}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No credit cards yet"
                text="Add a card to start tracking balances, limits, and utilization."
                actionLabel="Add a Card"
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
    <div className="cards-page-section-title">
      <span
        className="cards-page-section-icon"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "0.68rem",
        }}
        aria-hidden="true"
      >
        <CreditCardOutlineIcon />
      </span>

      <h2
        style={{
          fontSize: "1.02rem",
          fontWeight: 650,
          letterSpacing: "-0.012em",
          lineHeight: 1.2,
          textTransform: "none",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function CreditCardOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 9.5h17M7.2 14h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function CardsHeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="cards-hero-metric">
      <p className="cards-hero-metric-label">{label}</p>
      <p className="cards-hero-metric-value">{value}</p>
    </div>
  );
}

function UtilizationBar({
  utilization,
  isReady,
  className = "",
  style,
}: {
  utilization: number;
  isReady: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const safeUtilization = Math.min(Math.max(utilization, 0), 100);
  const scale = safeUtilization / 100;

  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full ${className}`}
      style={style}
    >
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
  const isPaidOff = balance <= 0.005;

  return (
    <article
      id={cardId}
      className={`cards-page-row scroll-mt-28 ${
        isExpanded ? "cards-page-row-expanded" : ""
      }`}
      style={{
        background: "transparent",
        borderBottomColor:
          "color-mix(in srgb, var(--theme-text) 6%, transparent)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        className="cards-page-row-button pressable"
        style={{
          minHeight: "4.55rem",
          paddingTop: "0.62rem",
          paddingBottom: "0.62rem",
          background: "transparent",
        }}
      >
        <span
          className="cards-page-row-icon"
          style={{
            width: "2.05rem",
            height: "2.05rem",
            borderRadius: "0.68rem",
            opacity: isPaidOff ? 0.76 : 1,
          }}
          aria-hidden="true"
        >
          <CreditCardOutlineIcon />
        </span>

        <div className="cards-page-row-copy">
          <div className="cards-page-row-heading">
            <p
              className="cards-page-row-name"
              style={{
                fontSize: "0.94rem",
                fontWeight: isPaidOff ? 600 : 650,
                letterSpacing: "-0.012em",
                color: isPaidOff
                  ? "var(--theme-text-secondary)"
                  : undefined,
              }}
            >
              {card.name || "Untitled Card"}
            </p>

            <p
              className="cards-page-row-balance"
              style={{
                fontSize: "0.98rem",
                fontWeight: isPaidOff ? 650 : 700,
                letterSpacing: "-0.02em",
                color: isPaidOff
                  ? "var(--theme-text-secondary)"
                  : undefined,
                opacity: isPaidOff ? 0.86 : 1,
              }}
            >
              {formatMoney(balance)}
            </p>
          </div>

          <p
            className="cards-page-row-meta"
            style={{
              marginTop: "0.2rem",
              fontSize: "0.69rem",
              color: isPaidOff
                ? "var(--theme-text-tertiary)"
                : undefined,
            }}
          >
            <span>{isPaidOff ? "Paid off" : `${utilization}% used`}</span>
            <span aria-hidden="true">·</span>
            <span>{formatMoney(creditLeft)} available</span>
          </p>

          {!isPaidOff ? (
            <UtilizationBar
              utilization={utilization}
              isReady={barsReady}
              className="cards-page-row-track"
              style={{
                width: "100%",
                maxWidth: "none",
                height: "0.22rem",
                marginTop: "0.48rem",
              }}
            />
          ) : null}
        </div>

        <ChevronIcon isExpanded={isExpanded} />
      </button>

      <div
        id={detailsId}
        className={`cards-page-details-shell ${
          isExpanded
            ? "cards-page-details-shell-open"
            : "cards-page-details-shell-closed"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="cards-page-details"
            style={{
              background: "transparent",
              borderTopColor:
                "color-mix(in srgb, var(--theme-text) 6%, transparent)",
            }}
          >
            <CardDetailMetric
              label="Credit limit"
              value={formatMoney(limit)}
            />

            <CardDetailMetric
              label="Minimum payment"
              value={formatMoney(minimumPayment)}
            />

            <CardDetailMetric
              label="Due date"
              value={formatCardDueDate(card.dueDate)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}


function CardDetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="cards-page-detail-metric"
      style={{
        paddingTop: "0.54rem",
        paddingBottom: "0.54rem",
      }}
    >
      <p
        style={{
          fontSize: "0.64rem",
          fontWeight: 650,
          letterSpacing: "0.01em",
          lineHeight: 1.25,
          textTransform: "none",
        }}
      >
        {label}
      </p>

      <strong
        style={{
          fontSize: "0.82rem",
          fontWeight: 670,
          letterSpacing: "-0.015em",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <span className="cards-page-row-chevron" aria-hidden="true">
      <svg
        className={isExpanded ? "rotate-180" : ""}
        viewBox="0 0 24 24"
        fill="none"
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
    <div className="cards-page-empty">
      <span className="cards-page-empty-icon" aria-hidden="true">
        <CreditCardOutlineIcon />
      </span>

      <div className="min-w-0">
        <p className="cards-page-empty-title">{title}</p>
        <p className="cards-page-empty-text">{text}</p>
      </div>

      <Link
        href={actionHref}
        className="dashboard-section-link pressable shrink-0"
      >
        {actionLabel}
      </Link>
    </div>
  );
}