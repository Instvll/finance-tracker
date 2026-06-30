import TopNav from "@/components/TopNav";
import { Card, PageHeader, PageShell, Pill } from "@/components/Layout";
import { goals } from "../../data/bandData";

const totalTarget = goals.reduce((total, goal) => total + goal.target, 0);
const totalSaved = goals.reduce((total, goal) => total + goal.saved, 0);
const overallProgress =
  totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function GoalsPage() {
  return (
    <PageShell>
      <TopNav />

      <PageHeader
        eyebrow="Goals"
        title="Savings & Debt Goals"
        description="Track progress toward emergency savings, debt payoff, and other money goals."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Goal Amount" value={formatMoney(totalTarget)} />
        <SummaryCard label="Saved So Far" value={formatMoney(totalSaved)} />
        <SummaryCard label="Overall Progress" value={`${overallProgress}%`} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const progress =
            goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;

          const remaining = Math.max(goal.target - goal.saved, 0);

          return (
            <Card key={goal.name}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Pill>{progress}%</Pill>

                    <span className="rounded-full bg-stone-300/10 px-3 py-1 text-xs text-stone-300">
                      {formatMoney(remaining)} left
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold text-stone-100">
                    {goal.name}
                  </h2>
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
                  <span>{formatMoney(goal.saved)} saved</span>
                  <span>{formatMoney(goal.target)} target</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-amber-100/60"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <p className="border-t border-stone-300/10 pt-4 text-sm leading-6 text-stone-300">
                {goal.note}
              </p>
            </Card>
          );
        })}
      </section>
    </PageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-300/10 bg-[#12110f] p-5 shadow-xl shadow-black/15">
      <p className="text-sm text-stone-400">{label}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-stone-100">
        {value}
      </p>
    </div>
  );
}