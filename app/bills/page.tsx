"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";
import { bills } from "../../data/bandData";
import { getAutoBillStatus, sortBillsByDueDay } from "../../lib/billStatus";

type ManualBill = {
  name: string;
  amount: string;
  dueDate: string;
  status: "Paid" | "Upcoming" | "Due Soon" | "Overdue";
  paymentMethod: string;
};

const billsStorageKey = "finance-tracker-manual-bills";
const billsEditSnapshotKey = "finance-tracker-bills-edit-snapshot";

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

function getBillsSnapshot(bills: ManualBill[]) {
  return JSON.stringify(bills);
}

export default function BillsPage() {
  const [manualBills, setManualBills] =
    useState<ManualBill[]>(defaultManualBills);
  const [showOtherBills, setShowOtherBills] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    const savedBills = readBillsStorage();

    setManualBills(savedBills);

    const previousBillsSnapshot = window.sessionStorage.getItem(
      billsEditSnapshotKey
    );

    if (
      previousBillsSnapshot &&
      previousBillsSnapshot !== getBillsSnapshot(savedBills)
    ) {
      setShowSaveConfirmation(true);
    }

    window.sessionStorage.removeItem(billsEditSnapshotKey);
  }, []);

  useEffect(() => {
    if (!showSaveConfirmation) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 3800);

    return () => window.clearTimeout(timeout);
  }, [showSaveConfirmation]);

  function rememberBillsEditSnapshot() {
    window.sessionStorage.setItem(
      billsEditSnapshotKey,
      getBillsSnapshot(readBillsStorage())
    );
  }

  const upcomingBills = sortBillsByDueDay(
    manualBills.filter(
      (bill) => getAutoBillStatus(bill.dueDate) === "Upcoming"
    )
  );

  const otherBills = sortBillsByDueDay(
    manualBills.filter((bill) => getAutoBillStatus(bill.dueDate) === "Paid")
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
        <header className="-mt-1 mb-3 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Bill Tracker
            </p>

            <Pill>v1.2.2 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Bills
          </h1>
        </header>

        <section className="liquid-glass-accent hero-glass-card motion-card motion-card-delay-1 mb-3 rounded-[2rem]">
          <div className="liquid-content relative p-3.5 sm:p-5">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#c7ad75]/10 blur-3xl" />
            <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-[#f5f0e8]/5 blur-3xl" />

            <div className="relative mb-2.5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />

                <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                  Due Soon
                </p>
              </div>

              <Pill>{upcomingBills.length} upcoming</Pill>
            </div>

            <p className="relative break-words text-5xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
              {formatMoney(upcomingTotal)}
            </p>

            <div className="relative mt-3 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/25 p-1.5">
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

        {showSaveConfirmation ? (
          <SaveConfirmation onDismiss={() => setShowSaveConfirmation(false)} />
        ) : null}

        <section className="grid gap-3">
          <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.7rem] p-3.5">
            <div className="liquid-content">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <SectionTitle title="Upcoming Bills" />

                  <p className="mt-1.5 text-sm text-stone-400">
                    {upcomingBills.length} due within 7 days •{" "}
                    {formatMoney(upcomingTotal)}
                  </p>
                </div>

                <Link
                  href="/manual?tab=bills"
                  onClick={rememberBillsEditSnapshot}
                  className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                >
                  Edit
                </Link>
              </div>

              {upcomingBills.length > 0 ? (
                <div className="grid gap-2">
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
                      : "Add your first bill in the Editor."
                  }
                  actionLabel="Add Bill"
                  actionHref="/manual?tab=bills"
                  onAction={rememberBillsEditSnapshot}
                />
              )}
            </div>
          </section>

          <section className="liquid-glass motion-card motion-card-delay-3 rounded-[1.7rem] p-3.5">
            <div className="liquid-content">
              <button
                type="button"
                onClick={() => setShowOtherBills((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <SectionTitle title="Other Bills" />

                  <p className="mt-1.5 text-sm text-stone-400">
                    {otherBills.length} bill
                    {otherBills.length === 1 ? "" : "s"} •{" "}
                    {formatMoney(otherTotal)}
                  </p>
                </div>

                <span className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
                  {showOtherBills ? "Hide" : "View"}
                </span>
              </button>

              {showOtherBills && (
                <div className="mt-3 grid gap-2 pt-1">
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
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.95rem] px-3 py-1.5 sm:border-r sm:border-[#f5f0e8]/10 sm:last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
        {label}
      </p>

      <p className="mt-1 truncate text-base font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function SaveConfirmation({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-card motion-card-delay-2 mb-3 rounded-[1.35rem] border border-[#c7ad75]/20 bg-[#c7ad75]/10 px-3.5 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c7ad75]/25 bg-[#11100d]/25 text-sm font-bold text-[#c7ad75]">
            ✓
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#f5f0e8]">
              Bills updated
            </p>

            <p className="mt-0.5 text-xs leading-5 text-stone-400">
              Your latest changes are reflected here.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="pressable shrink-0 rounded-full border border-[#f5f0e8]/10 px-2.5 py-1 text-xs font-semibold text-stone-400 transition hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
        >
          Done
        </button>
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
    <div
      className={`rounded-[1.1rem] border px-3.5 py-3 transition hover:bg-[#f5f0e8]/6 ${
        muted
          ? "border-[#f5f0e8]/10 bg-[#11100d]/20"
          : "border-[#c7ad75]/18 bg-[#11100d]/25"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`truncate text-base font-semibold ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {bill.name || "Untitled Bill"}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
              Due {bill.dueDate || "TBD"}
            </span>

            {bill.paymentMethod ? (
              <span className="rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 px-2.5 py-0.5 text-xs font-semibold text-stone-500">
                {bill.paymentMethod}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-lg font-bold tracking-tight ${
              muted ? "text-stone-300" : "text-[#f5f0e8]"
            }`}
          >
            {formatMoney(amount)}
          </p>

          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/65">
            Monthly
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
  onAction,
}: {
  title: string;
  text: string;
  actionLabel: string;
  actionHref: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.15rem] border border-dashed border-[#f5f0e8]/12 bg-[#11100d]/20 p-3.5">
      <p className="text-base font-semibold text-[#f5f0e8]">{title}</p>

      <p className="mt-1.5 text-sm leading-6 text-stone-400">{text}</p>

      <Link
        href={actionHref}
        onClick={onAction}
        className="pressable mt-3 flex rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-2.5 text-center text-sm font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/20"
      >
        <span className="w-full">{actionLabel}</span>
      </Link>
    </div>
  );
}