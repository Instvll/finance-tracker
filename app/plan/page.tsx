"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { Card, PageHeader, PageShell, Panel, Pill } from "../../components/Layout";

type PaycheckPlan = {
  name: string;
  payday: string;
  paycheckAmount: string;
  bills: string;
  gasFood: string;
  savings: string;
  debtPayment: string;
  extraSpending: string;
  notes: string;
};

const planStorageKey = "finance-tracker-paycheck-plan";
const planLastSavedStorageKey = "finance-tracker-paycheck-plan-last-saved";

const defaultPlan: PaycheckPlan = {
  name: "Next Paycheck",
  payday: "TBD",
  paycheckAmount: "0",
  bills: "0",
  gasFood: "0",
  savings: "0",
  debtPayment: "0",
  extraSpending: "0",
  notes: "",
};

function parseMoney(value: string) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
}

function formatMoney(value: string | number) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function formatSavedTime(value: string) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PaycheckPlan>(defaultPlan);
  const [savedMessage, setSavedMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    const savedPlan = window.localStorage.getItem(planStorageKey);
    const savedTime = window.localStorage.getItem(planLastSavedStorageKey);

    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    }

    if (savedTime) {
      setLastSaved(savedTime);
    }
  }, []);

  function updateField(field: keyof PaycheckPlan, value: string) {
    setPlan((current) => ({
      ...current,
      [field]: value,
    }));

    setSavedMessage("");
  }

  function savePlan() {
    const savedAt = new Date().toISOString();

    window.localStorage.setItem(planStorageKey, JSON.stringify(plan));
    window.localStorage.setItem(planLastSavedStorageKey, savedAt);

    setLastSaved(savedAt);
    setSavedMessage("Plan saved.");
  }

  function resetPlan() {
    const confirmed = window.confirm("Reset this paycheck plan?");

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(planStorageKey);
    window.localStorage.removeItem(planLastSavedStorageKey);

    setPlan(defaultPlan);
    setLastSaved("");
    setSavedMessage("Plan reset.");
  }

  const paycheckAmount = parseMoney(plan.paycheckAmount);
  const bills = parseMoney(plan.bills);
  const gasFood = parseMoney(plan.gasFood);
  const savings = parseMoney(plan.savings);
  const debtPayment = parseMoney(plan.debtPayment);
  const extraSpending = parseMoney(plan.extraSpending);

  const plannedTotal = bills + gasFood + savings + debtPayment + extraSpending;
  const safeLeftover = paycheckAmount - plannedTotal;

  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Paycheck Plan"
        title="Plan Ahead"
        description="Map out your next paycheck before it hits so every dollar already has a job."
      />

      <section className="mb-6 overflow-hidden rounded-[2rem] border border-stone-300/20 bg-[#23211d] shadow-xl shadow-black/10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-stone-300/15 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
                Safe Leftover
              </p>
            </div>

            <p className="break-words text-6xl font-bold tracking-tight text-[#f5f0e8] md:text-7xl">
              {formatMoney(safeLeftover)}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300">
              This is what is left after your planned bills, gas/food, savings,
              debt payment, and extra spending.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={savePlan}
                className="rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
              >
                Save Plan
              </button>

              <button
                type="button"
                onClick={resetPlan}
                className="rounded-full border border-stone-300/20 px-5 py-3 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
              >
                Reset
              </button>
            </div>

            <p className="mt-4 text-sm text-stone-400">
              {savedMessage || `Last saved: ${formatSavedTime(lastSaved)}`}
            </p>
          </div>

          <div className="grid grid-cols-2">
            <OverviewStat label="Paycheck" value={formatMoney(paycheckAmount)} />
            <OverviewStat label="Planned" value={formatMoney(plannedTotal)} />
            <OverviewStat label="Bills" value={formatMoney(bills)} />
            <OverviewStat label="Payday" value={plan.payday || "TBD"} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Panel title="Paycheck Details">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Plan Name"
              value={plan.name}
              type="text"
              onChange={(value) => updateField("name", value)}
            />

            <InputField
              label="Payday"
              value={plan.payday}
              type="text"
              onChange={(value) => updateField("payday", value)}
            />

            <InputField
              label="Paycheck Amount"
              value={plan.paycheckAmount}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("paycheckAmount", value)}
            />

            <InputField
              label="Bills Before Next Paycheck"
              value={plan.bills}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("bills", value)}
            />

            <InputField
              label="Gas / Food Cushion"
              value={plan.gasFood}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("gasFood", value)}
            />

            <InputField
              label="Savings"
              value={plan.savings}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("savings", value)}
            />

            <InputField
              label="Debt Payment"
              value={plan.debtPayment}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("debtPayment", value)}
            />

            <InputField
              label="Extra Spending"
              value={plan.extraSpending}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("extraSpending", value)}
            />
          </div>

          <div className="mt-4">
            <TextAreaField
              label="Notes"
              value={plan.notes}
              onChange={(value) => updateField("notes", value)}
            />
          </div>
        </Panel>

        <Panel title="Breakdown">
          <div className="space-y-3">
            <BreakdownRow label="Paycheck Amount" value={paycheckAmount} positive />
            <BreakdownRow label="Bills" value={bills} />
            <BreakdownRow label="Gas / Food" value={gasFood} />
            <BreakdownRow label="Savings" value={savings} />
            <BreakdownRow label="Debt Payment" value={debtPayment} />
            <BreakdownRow label="Extra Spending" value={extraSpending} />

            <div className="border-t border-stone-300/15 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Safe Leftover
                </span>

                <span className="text-2xl font-bold text-[#f5f0e8]">
                  {formatMoney(safeLeftover)}
                </span>
              </div>
            </div>
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm text-stone-400">Plan</p>
              <Pill>{plan.name || "Untitled"}</Pill>
            </div>

            <p className="text-sm leading-6 text-stone-300">
              {plan.notes || "No notes added yet."}
            </p>
          </Card>
        </Panel>
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

function BreakdownRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-stone-300/15 bg-[#2b2925] px-4 py-3">
      <span className="text-sm text-stone-400">{label}</span>
      <span className="font-semibold text-[#f5f0e8]">
        {positive ? "+" : "-"}
        {formatMoney(value)}
      </span>
    </div>
  );
}

function InputField({
  label,
  value,
  type,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  type: "text" | "number";
  inputMode?: "decimal" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-300">
        {label}
      </span>

      <textarea
        value={value}
        rows={5}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-stone-300/20 bg-[#171614] px-4 py-4 text-lg leading-7 text-[#f5f0e8] outline-none transition placeholder:text-stone-600 focus:border-stone-100/35 focus:bg-[#1d1b18]"
      />
    </label>
  );
}