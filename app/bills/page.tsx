"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Card, PageHeader, PageShell, Pill } from "../../components/Layout";
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function parseMoney(value: string) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
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

  const totalBills = manualBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const unpaidBills = manualBills.filter((bill) => bill.status !== "Paid");

  const unpaidTotal = unpaidBills.reduce(
    (total, bill) => total + parseMoney(bill.amount),
    0
  );

  const paidBills = manualBills.filter((bill) => bill.status === "Paid");

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Bills"
        title="Bill Tracker"
        description="Track upcoming bills, due dates, payment methods, and what still needs to be paid."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Bills" value={formatMoney(totalBills)} />
        <SummaryCard label="Unpaid Bills" value={formatMoney(unpaidTotal)} />
        <SummaryCard label="Bill Count" value={String(manualBills.length)} />
        <SummaryCard label="Paid Bills" value={String(paidBills.length)} />
      </section>

      <section className="grid gap-4">
        {manualBills.map((bill, index) => (
          <Card key={`${bill.name}-${index}`}>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Pill>{bill.status}</Pill>

                  <span className="rounded-full bg-stone-300/10 px-3 py-1 text-xs text-stone-300">
                    {bill.paymentMethod}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-stone-100">
                  {bill.name}
                </h2>

                <p className="mt-2 text-sm text-stone-400">
                  Due: {bill.dueDate}
                </p>
              </div>

              <p className="text-3xl font-bold text-stone-100">
                {formatMoney(parseMoney(bill.amount))}
              </p>
            </div>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-300/10 bg-[#12110f] p-5 shadow-xl shadow-black/15">
      <p className="text-sm text-stone-400">{label}</p>

      <p className="mt-2 break-words text-3xl font-bold tracking-tight text-stone-100">
        {value}
      </p>
    </div>
  );
}