"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell } from "../../../components/Layout";

export default function AboutSettingsPage() {
  return (
    <PageShell>
      <TopNav />

      <main className="min-h-[70vh] pb-3">
        <BackLink />

        <header className="motion-card mb-3 px-0.5">
          <h1
            className="text-[2.2rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[2.5rem]"
            style={{ color: "var(--theme-text)" }}
          >
            About leftovr
          </h1>
        </header>

        <section className="grid gap-3">
          <section
            className="motion-card motion-card-delay-1 overflow-hidden rounded-[1.55rem] border p-5"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent), 0 16px 34px color-mix(in srgb, var(--theme-shadow) 16%, transparent)",
            }}
          >
            <div className="flex items-start gap-4">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.05rem] border"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--theme-accent) 28%, var(--theme-border-default))",
                  background:
                    "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
                  color: "var(--theme-accent)",
                }}
              >
                <PurposeIcon />
              </span>

              <div className="min-w-0">
                <p
                  className="text-[1.05rem] font-semibold"
                  style={{ color: "var(--theme-text)" }}
                >
                  Money planning that stays connected
                </p>

                <p
                  className="mt-1.5 text-sm leading-6"
                  style={{ color: "var(--theme-text-secondary)" }}
                >
                  leftovr brings balances, bills, credit cards, and payday
                  planning into one calm view, then saves your changes
                  automatically so your account stays easier to trust across
                  devices.
                </p>
              </div>
            </div>
          </section>

          <section className="motion-card motion-card-delay-2">
            <h2
              className="mb-2 px-1 text-[0.95rem] font-semibold"
              style={{ color: "var(--theme-text)" }}
            >
              Why leftovr
            </h2>

            <div
              className="overflow-hidden rounded-[1.55rem] border"
              style={{
                borderColor: "var(--theme-border-default)",
                background: "var(--theme-surface-sheet)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent)",
              }}
            >
              <AboutRow
                icon={<PaydayIcon />}
                title="Built around payday"
                text="See what needs covered before your next paycheck instead of sorting through disconnected numbers."
              />

              <AboutRow
                icon={<ClarityIcon />}
                title="Simple on purpose"
                text="leftovr is not trying to replace your bank. It makes the money information you already track easier to understand and act on."
                divided
              />

              <AboutRow
                icon={<ConnectedIcon />}
                title="Saved with confidence"
                text="Changes save automatically, while guarded updates, recovery checks, and conflict review help protect newer account data across devices."
                divided
              />
            </div>
          </section>

          <section
            className="motion-card motion-card-delay-3 rounded-[1.35rem] border px-4 py-3.5"
            style={{
              borderColor: "var(--theme-border-default)",
              background:
                "color-mix(in srgb, var(--theme-surface-control) 74%, transparent)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem]"
                style={{
                  background:
                    "color-mix(in srgb, var(--theme-accent) 9%, transparent)",
                  color: "var(--theme-accent)",
                }}
              >
                <SafetyIcon />
              </span>

              <div className="min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--theme-text)" }}
                >
                  A quick safety note
                </p>

                <p
                  className="mt-1 text-xs leading-5"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  Do not enter full card numbers, passwords, Social Security
                  numbers, bank account numbers, or other sensitive account
                  details.
                </p>
              </div>
            </div>
          </section>

          <section
            className="motion-card motion-card-delay-3 overflow-hidden rounded-[1.55rem] border"
            style={{
              borderColor: "var(--theme-border-default)",
              background: "var(--theme-surface-sheet)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 62%, transparent)",
            }}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p
                  className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "var(--theme-accent)" }}
                >
                  Current release
                </p>

                <p
                  className="mt-1 text-lg font-semibold"
                  style={{ color: "var(--theme-text)" }}
                >
                  v2.0 Beta
                </p>

                <p
                  className="mt-0.5 text-sm"
                  style={{ color: "var(--theme-text-secondary)" }}
                >
                  Connected by Design
                </p>
              </div>

              <span
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-default))",
                  background:
                    "color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface-control))",
                  color: "var(--theme-text-secondary)",
                }}
              >
                Private Beta
              </span>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold transition"
      style={{ color: "var(--theme-text-tertiary)" }}
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
  );
}

function AboutRow({
  icon,
  title,
  text,
  divided = false,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  divided?: boolean;
}) {
  return (
    <div
      className="px-4 py-4"
      style={{
        borderTop: divided
          ? "1px solid var(--theme-divider)"
          : "1px solid transparent",
      }}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] border"
          style={{
            borderColor:
              "color-mix(in srgb, var(--theme-accent) 24%, var(--theme-border-default))",
            background:
              "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
            color: "var(--theme-accent)",
          }}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="text-[0.96rem] font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            {title}
          </p>

          <p
            className="mt-1 text-xs leading-5 sm:text-sm"
            style={{ color: "var(--theme-text-tertiary)" }}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function PurposeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 18V9M10 18V5M16 18v-7M22 18H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaydayIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 3.5v4M16 3.5v4M4 9.5h16M8 14h3M14 14h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClarityIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M7 12h10M9 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConnectedIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 8.5 12 5l3.5 3.5M12 5v9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M6.5 12.5A4.5 4.5 0 0 0 7 21h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.5 12.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg
      className="h-[17px] w-[17px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 19 6v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}