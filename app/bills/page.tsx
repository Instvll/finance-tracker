"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
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

  const attentionBills = unpaidBills.filter(
    (bill) => bill.status === "Due Soon" || bill.status === "Overdue"
  );

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
            Bills
          </p>

          <Pill>{unpaidBills.length} unpaid</Pill>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
          Bills
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
          Track what still needs paid, what is already handled, and what needs
          attention.
        </p>
      </header>

      <section className="mb-5 rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                Still To Pay
              </p>
            </div>

            <p className="text-sm leading-6 text-stone-400">
              Unpaid bills counted against your dashboard total
            </p>
          </div>

          <Pill>{attentionBills.length} need attention</Pill>
        </div>

        <p className="break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
          {formatMoney(unpaidTotal)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/manual"
            className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-4 py-3 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
          >
            Edit Bills
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-stone-300/20 px-4 py-3 text-center text-sm font-semibold text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <section className="mb-5 grid gap-3">
        <MobileStat
          label="Paid"
          value={formatMoney(paidTotal)}
          detail={`${paidBills.length} bill${paidBills.length === 1 ? "" : "s"} marked paid`}
        />

        <MobileStat
          label="Unpaid"
          value={formatMoney(unpaidTotal)}
          detail={`${unpaidBills.length} bill${unpaidBills.length === 1 ? "" : "s"} remaining`}
        />

        <MobileStat
          label="Attention"
          value={String(attentionBills.length)}
          detail="Due soon or overdue"
        />
      </section>

      <section className="grid gap-5">
        <BillSection
          title="Still To Pay"
          description="These bills are still included in your unpaid total."
        >
          {unpaidBills.length > 0 ? (
            <div className="divide-y divide-stone-300/10">
              {unpaidBills.map((bill, index) => (
                <BillRow key={`unpaid-${index}`} bill={bill} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No unpaid bills"
              text="Everything is marked paid right now."
            />
          )}
        </BillSection>

        <BillSection
          title="Paid"
          description="These bills are marked paid and no longer subtract from your available money."
        >
          {paidBills.length > 0 ? (
            <div className="divide-y divide-stone-300/10">
              {paidBills.map((bill, index) => (
                <BillRow key={`paid-${index}`} bill={bill} muted />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No paid bills yet"
              text="Bills you mark paid in the Editor will show up here."
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
    <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-stone-300/20 bg-[#23211d] p-4 shadow-xl shadow-black/10">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm text-stone-400">{detail}</p>
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
    <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 border-b border-stone-300/15 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-stone-100/60" />

          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
            {title}
          </h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-stone-400">{description}</p>
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

          <p className="mt-1 truncate text-sm text-stone-400">
            {bill.paymentMethod || "Payment method TBD"}
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

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-300/15 bg-[#2b2925] p-5">
      <p className="font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>
    </div>
  );
}