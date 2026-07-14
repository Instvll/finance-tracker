"use client";

import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell } from "../../../components/Layout";

export default function AboutSettingsPage() {
  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <BackLink />

        <header className="mb-1.5 motion-card">
          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            About leftovr
          </h1>
        </header>

        <section className="grid gap-2">
          <section className="motion-card motion-card-delay-1">
            <div className="mb-1.5 px-1">
              <SectionTitle title="What leftovr is" />
            </div>

            <div className="dashboard-surface relative overflow-hidden rounded-[1.55rem] border border-[#f5f0e8]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.05),0_16px_34px_rgba(0,0,0,0.08)]">
              <div className="dashboard-surface-glow" aria-hidden="true" />

              <div className="liquid-content relative">
                <AboutRow
                  icon={<PurposeIcon />}
                  title="A clearer money view"
                  text="leftovr brings balances, bills, credit cards, and payday context into one calm place."
                />

                <AboutRow
                  icon={<PaydayIcon />}
                  title="Built around payday"
                  text="It helps you understand what is due before your next paycheck and what remains after those bills are covered."
                  divided
                />

                <AboutRow
                  icon={<ClarityIcon />}
                  title="Simple by design"
                  text="The goal is not to replace your bank. It is to make the numbers you already track easier to understand and act on."
                  divided
                />
              </div>
            </div>
          </section>

          <section className="motion-card motion-card-delay-2">
            <div className="mb-1.5 px-1">
              <SectionTitle title="Why it exists" />
            </div>

            <div className="dashboard-surface relative overflow-hidden rounded-[1.55rem] border border-[#f5f0e8]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.05),0_16px_34px_rgba(0,0,0,0.08)]">
              <div className="dashboard-surface-glow" aria-hidden="true" />

              <div className="liquid-content relative">
                <AboutRow
                  icon={<FocusIcon />}
                  title="Less financial guesswork"
                  text="leftovr was created to reduce the mental work of remembering what is due and calculating what is actually available."
                />

                <AboutRow
                  icon={<RefineIcon />}
                  title="Focused refinement"
                  text="The current priority is making the core experience cleaner, faster, and more consistent before larger features are added."
                  divided
                />

                <AboutRow
                  icon={<SafetyIcon />}
                  title="Privacy & safety"
                  text="Avoid entering full card numbers, passwords, Social Security numbers, bank account numbers, or other sensitive account details."
                  divided
                />
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.55rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="grid gap-1 sm:grid-cols-3">
                <ReleaseStat label="Version" value="v1.3 Beta" />
                <ReleaseStat label="Release" value="Clearer by Payday" />
                <ReleaseStat label="Build" value="Private Beta" />
              </div>
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}

function BackLink() {
  return (
    <Link
      href="/account"
      className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
    >
      <span aria-hidden="true">←</span>
      Settings
    </Link>
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

function AboutRow({
  icon,
  title,
  text,
  divided = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`px-3.5 py-2.5 sm:px-4 sm:py-3 ${
        divided ? "border-t border-[#f5f0e8]/8" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-semibold text-[#f5f0e8]">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-stone-500 sm:text-sm">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReleaseStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[1rem] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-0.5 truncate text-sm font-semibold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function PurposeIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
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

function FocusIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="7"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RefineIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h7M15 17h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="13" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
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