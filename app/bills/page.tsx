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
        <header className="mb-5 motion-card">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Bill Tracker
            </p>

            <Pill>v1.0 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Bills
          </h1>
        </header>

        <section className="liquid-glass-accent motion-card motion-card-delay-1 mb-5 rounded-[2.25rem]">
          <div className="liquid-content relative p-5 sm:p-7">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c7ad75]/10 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

            <div className="relative mb-7 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
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

            <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniStat label="Tracked" value={String(manualBills.length)} />
              <MiniStat label="Other Bills" value={formatMoney(otherTotal)} />
              <MiniStat label="Monthly Total" value={formatMoney(totalBills)} />
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.65rem] p-5">
            <div className="liquid-content">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75]" />

                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                    Upcoming Bills
                  </h2>
                </div>

                <Link
                  href="/manual?tab=bills"
                  className="pressable rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                >
                  Edit
                </Link>
              </div>

              {upcomingBills.length > 0 ? (
                <div className="grid gap-3">
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

          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.65rem] p-5">
            <div className="liquid-content">
              <button
                type="button"
                onClick={() => setShowOtherBills((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75]" />

                    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                      Other Bills
                    </h2>
                  </div>

                  <p className="text-sm text-stone-400">
                    Bills outside the current 7-day window.
                  </p>
                </div>

                <span className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                  {showOtherBills ? "Hide" : "View"}
                </span>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="Count" value={String(otherBills.length)} />
                <MiniStat label="Total" value={formatMoney(otherTotal)} />
              </div>

              {showOtherBills && (
                <div className="mt-4 border-t border-[#f5f0e8]/10 pt-4">
                  {otherBills.length > 0 ? (
                    <div className="grid gap-3">
                      {otherBills.map((bill, index) => (
                        <BillRow key={`other-${index}`} bill={bill} muted />
                      ))}
                    </div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass-soft rounded-[1.35rem] p-4">
      <div className="liquid-content">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
          {label}
        </p>

        <p className="mt-2 truncate text-lg font-bold text-[#f5f0e8]">
          {value}
        </p>
      </div>
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
    <div className="liquid-glass-soft rounded-[1.25rem] p-4">
      <div className="liquid-content">
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
    <div className="liquid-glass-soft rounded-[1.35rem] border-dashed p-5">
      <div className="liquid-content">
        <p className="text-lg font-semibold text-[#f5f0e8]">{title}</p>

        <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>

        <Link
          href={actionHref}
          className="pressable mt-4 flex rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
        >
          <span className="w-full">{actionLabel}</span>
        </Link>
      </div>
    </div>
  );
}