"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { bills } from "../../data/bandData";
import { getAutoBillStatus } from "../../lib/billStatus";

type ManualBill = {
  name: string;
  amount: string;
  dueDate: string;
  status: "Paid" | "Upcoming" | "Due Soon" | "Overdue";
  paymentMethod: string;
};

const billsStorageKey = "finance-tracker-manual-bills";

const defaultManualBills: ManualBill[] = bills.map((bill) => ({
  name: bill.name,
  amount: String(bill.amount),
  dueDate: bill.dueDate,
  status: bill.status,
  paymentMethod: bill.paymentMethod,
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

function readBillsStorage() {
  const savedBills = window.localStorage.getItem(billsStorageKey);

  if (!savedBills) {
    return defaultManualBills;
  }

  try {
    return JSON.parse(savedBills) as ManualBill[];
  } catch {
    return defaultManualBills;
  }
}

export default function BillsPage() {
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [showOtherBills, setShowOtherBills] = useState(false);

  useEffect(() => {
    setManualBills(readBillsStorage());
  }, []);

  const upcomingBills = manualBills.filter(
    (bill) => getAutoBillStatus(bill.dueDate) === "Upcoming"
  );

  const otherBills = manualBills.filter(
    (bill) => getAutoBillStatus(bill.dueDate) === "Paid"
  );

  const upcomingTotal = upcomingBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const otherTotal = otherBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const totalBills = manualBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const hasBills = manualBills.length > 0;

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-4 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Bill Tracker
            </p>

            <Pill>v1.1 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Bills
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
                    Due Soon
                  </p>
                </div>

                <p className="text-sm text-stone-400">
                  Bills due within the next 7 days.
                </p>
              </div>

              <Pill>{upcomingBills.length} upcoming</Pill>
            </div>

            <p className="relative break-words text-6xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
              {formatMoney(upcomingTotal)}
            </p>

            <div className="relative mt-5 rounded-[1.45rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-2">
              <div className="grid gap-1 sm:grid-cols-3 sm:gap-0">
                <HeroStat label="Tracked" value={String(manualBills.length)} />

                <HeroStat label="Other Bills" value={formatMoney(otherTotal)} />

                <HeroStat
                  label="Monthly Total"
                  value={formatMoney(totalBills)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
            <div className="liquid-content">
              <div className="mb-4 flex items-center justify-between gap-4">
                <SectionTitle title="Upcoming Bills" />

                <Link
                  href="/manual?tab=bills"
                  className="pressable rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                >
                  Edit
                </Link>
              </div>

              {upcomingBills.length > 0 ? (
                <div className="grid">
                  {upcomingBills.map((bill, index) => (
                    <BillRow key={`upcoming-${index}`} bill={bill} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={hasBills ? "Nothing due soon" : "No bills added yet"}
                  text={
                    hasBills
                      ? "No bills are due within the next 7 days."
                      : "Add your first bill in the Editor to start tracking upcoming expenses."
                  }
                  actionLabel="Add Bill"
                  actionHref="/manual?tab=bills"
                />
              )}
            </div>
          </section>

          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.85rem] p-4">
            <div className="liquid-content">
              <button
                type="button"
                onClick={() => setShowOtherBills((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <SectionTitle title="Other Bills" />

                  <p className="mt-2 text-sm text-stone-400">
                    Bills outside the current 7-day window.
                  </p>
                </div>

                <span className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                  {showOtherBills ? "Hide" : "View"}
                </span>
              </button>

              <div className="mt-4 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-2">
                <div className="grid grid-cols-2 gap-1">
                  <CompactStat label="Count" value={String(otherBills.length)} />

                  <CompactStat label="Total" value={formatMoney(otherTotal)} />
                </div>
              </div>

              {showOtherBills && (
                <div className="mt-4 grid pt-1">
                  {otherBills.length > 0 ? (
                    otherBills.map((bill, index) => (
                      <BillRow key={`other-${index}`} bill={bill} muted />
                    ))
                  ) : (
                    <p className="text-sm text-stone-400">
                      No other bills to show yet.
                    </p>
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

      <p className="mt-1.5 truncate text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function BillRow({
  bill,
  muted = false,
}: {
  bill: ManualBill;
  muted?: boolean;
}) {
  const amount = parseMoney(bill.amount);

  return (
    <div className="group border-t border-[#f5f0e8]/10 px-3 py-4 transition last:border-b hover:bg-[#f5f0e8]/4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`truncate text-base font-semibold ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {bill.name || "Untitled Bill"}
          </p>

          <p className="mt-1 text-sm text-stone-400">
            Due {bill.dueDate || "TBD"}
          </p>
        </div>

        <p
          className={`shrink-0 text-lg font-bold ${
            muted ? "text-stone-300" : "text-[#f5f0e8]"
          }`}
        >
          {formatMoney(amount)}
        </p>
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