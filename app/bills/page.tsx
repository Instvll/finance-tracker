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

export default function BillsPage() {
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);

  useEffect(() => {
    const savedBills = window.localStorage.getItem(billsStorageKey);

    if (savedBills) {
      setManualBills(JSON.parse(savedBills));
    }
  }, []);

  const upcomingBills = manualBills.filter(
    (bill) => getAutoBillStatus(bill.dueDate) === "Upcoming"
  );

  const paidBills = manualBills.filter(
    (bill) => getAutoBillStatus(bill.dueDate) === "Paid"
  );

  const upcomingTotal = upcomingBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const paidTotal = paidBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const hasBills = manualBills.length > 0;

  return (
    <PageShell>
      <TopNav />

      <header className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-lg font-semibold uppercase tracking-[0.24em] text-stone-300">
            Bill Tracker
          </p>

          <Pill>v1.0 Beta</Pill>
        </div>

        <p className="max-w-xl text-sm leading-6 text-stone-300">
          Bills automatically become upcoming when they are due within 7 days.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f5f0e8]">
                Upcoming Bills
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              {hasBills
                ? "Bills due within the next 7 days"
                : "Add bills to start tracking what is coming up"}
            </p>
          </div>

          <Pill>{hasBills ? `${upcomingBills.length} upcoming` : "empty"}</Pill>
        </div>

        <p className="break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
          {formatMoney(upcomingTotal)}
        </p>

        {!hasBills && (
          <div className="mt-5 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d] p-4">
            <p className="text-sm font-semibold text-[#f5f0e8]">
              No bills added yet.
            </p>

            <p className="mt-2 text-sm leading-6 text-stone-400">
              Once you add your monthly bills, this page will show what is due
              within the next 7 days.
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/manual?tab=bills"
            className="rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
          >
            Open Editor
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-[#f5f0e8]/12 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <section className="mb-5 grid gap-3">
        <MobileStat
          label="Upcoming"
          value={formatMoney(upcomingTotal)}
          detail={`${upcomingBills.length} bill${
            upcomingBills.length === 1 ? "" : "s"
          } due within 7 days`}
        />

        <MobileStat
          label="Paid"
          value={formatMoney(paidTotal)}
          detail={`${paidBills.length} bill${
            paidBills.length === 1 ? "" : "s"
          } outside the pay window`}
        />

        <MobileStat
          label="Tracked"
          value={String(manualBills.length)}
          detail="Total bills saved"
        />
      </section>

      <section className="grid gap-5">
        <BillSection
          title="Upcoming"
          description="These bills are due within the next 7 days."
        >
          {upcomingBills.length > 0 ? (
            <div className="divide-y divide-[#f5f0e8]/10">
              {upcomingBills.map((bill, index) => (
                <BillRow key={`upcoming-${index}`} bill={bill} />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="Nothing due"
              title="No upcoming bills"
              text={
                hasBills
                  ? "None of your bills are due within the next 7 days."
                  : "Add your first bill in the Editor to start tracking upcoming expenses."
              }
              actionLabel="Add Bill"
              actionHref="/manual?tab=bills"
            />
          )}
        </BillSection>

        <BillSection
          title="Paid"
          description="These bills are outside the current 7-day pay window."
        >
          {paidBills.length > 0 ? (
            <div className="divide-y divide-[#f5f0e8]/10">
              {paidBills.map((bill, index) => (
                <BillRow key={`paid-${index}`} bill={bill} muted />
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="No paid bills"
              title="Nothing outside the pay window"
              text={
                hasBills
                  ? "Bills will show here when they are not due within the next 7 days."
                  : "After you add bills, anything outside the 7-day pay window will show here."
              }
              actionLabel="Open Editor"
              actionHref="/manual?tab=bills"
            />
          )}
        </BillSection>
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
    <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-4 shadow-xl shadow-black/15">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-stone-300">{detail}</p>
      </div>

      <p className="shrink-0 text-xl font-bold text-[#f5f0e8]">{value}</p>
    </div>
  );
}

function BillSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
      <div className="mb-4 border-b border-[#f5f0e8]/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
            {title}
          </h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
      </div>

      {children}
    </section>
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
  const autoStatus = getAutoBillStatus(bill.dueDate);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Pill>{autoStatus}</Pill>

            <span className="rounded-full border border-[#f5f0e8]/10 bg-[#11100d] px-3 py-1 text-xs font-semibold text-stone-200/85">
              Due {bill.dueDate || "TBD"}
            </span>
          </div>

          <p
            className={`truncate text-lg font-semibold ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {bill.name || "Untitled Bill"}
          </p>
        </div>

        <p
          className={`shrink-0 text-xl font-bold ${
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
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c7ad75]/20 bg-[#c7ad75]/10">
        <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />
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