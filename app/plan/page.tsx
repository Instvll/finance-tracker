"use client";

import { useEffect, useState } from "react";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

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

  const needsTotal = bills + gasFood;
  const futureTotal = savings + debtPayment;
  const flexibleTotal = extraSpending;
  const plannedTotal = needsTotal + futureTotal + flexibleTotal;
  const safeLeftover = paycheckAmount - plannedTotal;

  return (
    <PageShell>
      <TopNav />

      <header className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
          Paycheck Planner
        </p>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
              Plan Ahead
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
              Plan your next paycheck before it hits so your money already has
              a job.
            </p>
          </div>

          <button
            type="button"
            onClick={savePlan}
            className="hidden rounded-full border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15 sm:block"
          >
            Save
          </button>
        </div>
      </header>

      <section className="mb-5 overflow-hidden rounded-[2rem] border border-stone-300/20 bg-[#23211d] shadow-xl shadow-black/10">
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)]" />

              <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
                Safe Leftover
              </p>
            </div>

            <Pill>{savedMessage || formatSavedTime(lastSaved)}</Pill>
          </div>

          <p className="break-words text-6xl font-bold tracking-tight text-[#f5f0e8] sm:text-7xl">
            {formatMoney(safeLeftover)}
          </p>

          <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300">
            Paycheck amount minus bills, gas/food, savings, debt payment, and
            extra spending.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniStat label="Paycheck" value={formatMoney(paycheckAmount)} />
            <MiniStat label="Planned" value={formatMoney(plannedTotal)} />
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-stone-300/10">
          <SummaryStat label="Needs" value={formatMoney(needsTotal)} />
          <SummaryStat label="Future" value={formatMoney(futureTotal)} />
          <SummaryStat label="Flexible" value={formatMoney(flexibleTotal)} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-5">
          <PlannerGroup
            title="Paycheck"
            description="Start with what is coming in and when."
          >
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
          </PlannerGroup>

          <PlannerGroup
            title="Must Cover"
            description="Bills and basics that need handled before anything extra."
          >
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
          </PlannerGroup>

          <PlannerGroup
            title="Move Forward"
            description="Money going toward savings or knocking down debt."
          >
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
          </PlannerGroup>

          <PlannerGroup
            title="Flexible"
            description="Anything you want to leave room for without wrecking the plan."
          >
            <InputField
              label="Extra Spending"
              value={plan.extraSpending}
              type="number"
              inputMode="decimal"
              onChange={(value) => updateField("extraSpending", value)}
            />

            <TextAreaField
              label="Notes"
              value={plan.notes}
              onChange={(value) => updateField("notes", value)}
            />
          </PlannerGroup>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
            <div className="mb-4 border-b border-stone-300/15 pb-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-stone-100/60" />

                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-100">
                  Breakdown
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-stone-400">
                Quick check of where this paycheck is going.
              </p>
            </div>

            <div className="space-y-3">
              <BreakdownRow
                label="Paycheck Amount"
                value={paycheckAmount}
                positive
              />
              <BreakdownRow label="Bills" value={bills} />
              <BreakdownRow label="Gas / Food" value={gasFood} />
              <BreakdownRow label="Savings" value={savings} />
              <BreakdownRow label="Debt Payment" value={debtPayment} />
              <BreakdownRow label="Extra Spending" value={extraSpending} />

              <div className="border-t border-stone-300/15 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-400">
                    Leftover
                  </span>

                  <span className="text-2xl font-bold text-[#f5f0e8]">
                    {formatMoney(safeLeftover)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-stone-300/20 bg-[#23211d] p-5 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Current Plan
                </p>

                <h2 className="mt-2 text-xl font-bold text-[#f5f0e8]">
                  {plan.name || "Untitled"}
                </h2>
              </div>

              <Pill>{plan.payday || "TBD"}</Pill>
            </div>

            <p className="text-sm leading-6 text-stone-300">
              {plan.notes || "No notes added yet."}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={savePlan}
                className="flex-1 rounded-2xl border border-stone-100/20 bg-stone-100/10 px-4 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:bg-stone-100/15"
              >
                Save
              </button>

              <button
                type="button"
                onClick={resetPlan}
                className="rounded-2xl border border-stone-300/20 px-4 py-3 text-sm text-stone-300 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100"
              >
                Reset
              </button>
            </div>
          </section>
        </aside>
      </section>

      <div className="sticky bottom-4 z-20 mt-6 rounded-[1.5rem] border border-stone-300/20 bg-[#1f1e1b]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs uppercase tracking-[0.2em] text-stone-500">
              Safe Leftover
            </p>

            <p className="truncate text-xl font-bold text-[#f5f0e8]">
              {formatMoney(safeLeftover)}
            </p>
          </div>

          <button
            type="button"
            onClick={savePlan}
            className="rounded-2xl border border-stone-100/20 bg-stone-100/10 px-5 py-3 text-sm font-semibold text-[#f5f0e8]"
          >
            Save
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-stone-300/10 p-4 last:border-r-0">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-300/15 bg-[#2b2925] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-bold text-[#f5f0e8]">
        {value}
      </p>
    </div>
  );
}

function PlannerGroup({
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

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
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
    <label className="block md:col-span-2">
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