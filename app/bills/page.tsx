"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageHeader, PageShell, Pill } from "../../components/Layout";
import { bills } from "../../data/bandData";

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

  const unpaidBills = manualBills.filter((bill) => bill.status !== "Paid");
  const paidBills = manualBills.filter((bill) => bill.status === "Paid");

  const unpaidTotal = unpaidBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const paidTotal = paidBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const allBillsTotal = manualBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const dueSoonCount = manualBills.filter(
    (bill) => bill.status === "Due Soon" || bill.status === "Overdue"
  ).length;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Bills"
        title="Bills"
        description="See what still needs paid, what is already handled, and how much is coming out."
      />

      <section className="mb-6 overflow-hidden rounded-[2rem] border border-stone-300/20 bg-[#23211d] shadow-xl shadow-black/10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-stone-300/15 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
                Unpaid Bills
              </p>
            </div>

            <p className="break-words text-6xl font-bold tracking-tight text-[#f5f0e8] md:text-7xl">
              {formatMoney(unpaidTotal)}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300">
              This is the total still subtracting from your money left after
              bills.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/manual"
                className="rounded-full border border-stone-100/20 bg-stone-100/10 px-4 py-2 text-sm font-medium text-stone-100 transition hover:bg-stone-100/15"
              >
                Update bills
              </Link>

              <Link
                href="/"
                className="rounded-full border border-stone-300/20 px-4 py-2 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <OverviewStat label="All Bills" value={formatMoney(allBillsTotal)} />
            <OverviewStat label="Paid" value={formatMoney(paidTotal)} />
            <OverviewStat label="Unpaid Count" value={String(unpaidBills.length)} />
            <OverviewStat label="Needs Attention" value={String(dueSoonCount)} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <BillSection
          title="Still To Pay"
          subtitle="These bills are still counted against your available money."
        >
          {unpaidBills.length > 0 ? (
            <div className="divide-y divide-stone-300/10">
              {unpaidBills.map((bill, index) => (
                <BillRow key={`${bill.name}-${index}`} bill={bill} />
              ))}
            </div>
          ) : (
            <EmptyState text="No unpaid bills right now." />
          )}
        </BillSection>

        <BillSection
          title="Paid Bills"
          subtitle="These are marked paid and no longer subtract from your available money."
        >
          {paidBills.length > 0 ? (
            <div className="divide-y divide-stone-300/10">
              {paidBills.map((bill, index) => (
                <BillRow key={`${bill.name}-${index}`} bill={bill} muted />
              ))}
            </div>
          ) : (
            <EmptyState text="No bills marked paid yet." />
          )}
        </BillSection>
      </section>
    </PageShell>
  );
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-32 border-b border-r border-stone-300/10 p-5 even:border-r-0 lg:min-h-0">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>

      <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function BillSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 border-b border-stone-300/15 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-stone-100/60" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
            {title}
          </h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-stone-400">{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

function BillRow({ bill, muted = false }: { bill: ManualBill; muted?: boolean }) {
  const amount = parseMoney(bill.amount);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Pill>{bill.status}</Pill>

            <span className="rounded-full border border-stone-100/10 bg-stone-100/5 px-3 py-1 text-xs font-semibold text-stone-200/85">
              Due: {bill.dueDate || "TBD"}
            </span>
          </div>

          <p
            className={`truncate text-lg font-semibold ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {bill.name}
          </p>

          <p className="mt-1 truncate text-sm text-stone-400">
            Paid with {bill.paymentMethod || "TBD"}
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-300/15 bg-[#2b2925] p-5">
      <p className="text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}