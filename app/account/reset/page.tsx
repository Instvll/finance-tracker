"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "../../../components/TopNav";
import { PageShell, Pill } from "../../../components/Layout";
import { resetFinanceSetupForFreshStart } from "../../../lib/financeReset";

export default function FreshStartPage() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function startFresh() {
    setIsResetting(true);
    setErrorMessage("");

    try {
      await resetFinanceSetupForFreshStart();
      window.location.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "leftovr could not complete the fresh start.",
      );
      setIsResetting(false);
    }
  }

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <Link
          href="/account/profile"
          className="motion-card mb-2 inline-flex items-center gap-2 text-sm font-semibold text-stone-400 transition hover:text-[#c7ad75]"
        >
          <span aria-hidden="true">←</span>
          Account
        </Link>

        <header className="mb-1.5 motion-card">
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              Account Reset
            </p>

            <Pill>Fresh Start</Pill>
          </div>

          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Start Fresh
          </h1>
        </header>

        <section className="grid gap-2">
          <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 rounded-[2rem]">
            <div className="liquid-content dashboard-hero-content relative p-3.5 sm:p-4">
              <div
                className="dashboard-hero-glow dashboard-hero-glow-accent"
                aria-hidden="true"
              />

              <div
                className="dashboard-hero-glow dashboard-hero-glow-soft"
                aria-hidden="true"
              />

              <div
                className="dashboard-hero-reflection"
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="dashboard-hero-status-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                    A Clean Beginning
                  </p>
                </div>

                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Account stays
                </span>
              </div>

              <div className="relative mt-4">
                <h2 className="max-w-[22rem] text-2xl font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8]">
                  Set leftovr up again with the numbers that actually matter.
                </h2>

                <p className="mt-2 max-w-[25rem] text-sm leading-6 text-stone-400">
                  This removes the test setup and returns the finance tracker
                  to a blank first-use state.
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-2 rounded-[1.55rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SectionTitle title="What Gets Erased" />

                  <p className="mt-1 text-sm leading-5 text-stone-400">
                    Finance data is cleared from this device and your saved
                    account copy.
                  </p>
                </div>

                <div className="shrink-0">
                  <Pill>Permanent</Pill>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.15rem] border border-[#f5f0e8]/8 bg-[#11100d]/18">
                <ResetDetailRow
                  title="Balances and income"
                  detail="Checking, savings, and monthly income"
                />

                <ResetDetailRow
                  title="Bills and credit cards"
                  detail="All accounts, amounts, and payment sources"
                />

                <ResetDetailRow
                  title="Planning history"
                  detail="Pay schedule, paid items, and recovery snapshots"
                  last
                />
              </div>

              <div className="mt-2 rounded-[1.05rem] border border-[#9dbdb4]/20 bg-[#9dbdb4]/[0.06] px-3 py-2.5">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  Your sign-in and appearance stay.
                </p>

                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Run Start Fresh once on each device that still contains the
                  old test data.
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-surface motion-card motion-card-delay-3 rounded-[1.55rem] p-2.5">
            <div className="dashboard-surface-glow" aria-hidden="true" />

            <div className="liquid-content">
              {!isConfirming ? (
                <>
                  <SectionTitle title="Ready When You Are" />

                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    Nothing happens until you confirm the final step.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setIsConfirming(true);
                    }}
                    className="pressable mt-3 w-full rounded-full border border-[#dc2626]/45 bg-[#dc2626]/12 px-4 py-2.5 text-sm font-bold text-[#ef4444] transition hover:border-[#dc2626]/65 hover:bg-[#dc2626]/18"
                  >
                    Start Fresh
                  </button>
                </>
              ) : (
                <div
                  role="dialog"
                  aria-label="Confirm fresh start"
                  className="rounded-[1.15rem] border border-[#dc2626]/28 bg-[#dc2626]/[0.065] p-3"
                >
                  <p className="text-base font-bold text-[#f5f0e8]">
                    Erase all finance data and begin again?
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-stone-400">
                    This cannot be undone. Your login remains active, but the
                    tracker and saved cloud copy will be empty.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirming(false)}
                      disabled={isResetting}
                      className="pressable rounded-full border border-[#f5f0e8]/12 bg-[#f5f0e8]/[0.045] px-3 py-2.5 text-sm font-semibold text-stone-300 transition hover:bg-[#f5f0e8]/[0.075] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={startFresh}
                      disabled={isResetting}
                      className="pressable rounded-full border border-[#dc2626]/55 bg-[#dc2626]/16 px-3 py-2.5 text-sm font-bold text-[#ef4444] transition hover:border-[#dc2626]/72 hover:bg-[#dc2626]/22 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isResetting ? "Resetting…" : "Erase & Start Fresh"}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage ? (
                <div
                  role="alert"
                  className="mt-2 rounded-[1.05rem] border border-[#dc2626]/35 bg-[#dc2626]/10 px-3 py-2.5"
                >
                  <p className="text-sm leading-5 text-[#ef4444]">
                    {errorMessage}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function ResetDetailRow({
  title,
  detail,
  last = false,
}: {
  title: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-3.5 py-3 ${
        last ? "" : "border-b border-[#f5f0e8]/8"
      }`}
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c7ad75]/70" />

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#f5f0e8]">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-stone-500">
          {detail}
        </p>
      </div>
    </div>
  );
}