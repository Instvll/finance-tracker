"use client";

import { useState } from "react";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

const releaseNotes = [
  {
    title: "Protected account access",
    description:
      "The tracker requires sign-in so your dashboard, editor, and account tools feel more like a real app experience.",
  },
  {
    title: "Manual backup and restore",
    description:
      "Save this device’s tracker data to your account and restore it on another device when needed.",
  },
  {
    title: "Automatic bill timing",
    description:
      "Bills automatically become upcoming when they are due within 7 days, then move out of the way when they are not in the pay window.",
  },
  {
    title: "Mobile app setup",
    description:
      "leftovr can be added to an iPhone/Android home screen so it opens more like an app than a regular website.",
  },
  {
    title: "Clean beta design",
    description:
      "The dashboard, bills, cards, editor, login, and account screens have been polished with a consistent premium style.",
  },
];

const testerNotes = [
  "Help determine the right theme for the app.",
  "Check whether the Dashboard feels clear and useful.",
  "Try backing up your data, signing out, signing back in, and restoring it.",
  "Try adding bills with due dates like July 5th, or simply just 5.",
  "Do not enter full card numbers, passwords, Social Security numbers, or bank account numbers.",
];

export default function WhatsNewPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[68vh]">
        <header className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-lg font-semibold uppercase tracking-[0.24em] text-stone-300">
              What&apos;s New
            </p>

            <Pill>v1.0 Beta</Pill>
          </div>

          <p className="max-w-xl text-sm leading-6 text-stone-300">
            Version notes for the private testing build.
          </p>
        </header>

        <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/80">
                  Private Testing Build
                </p>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#f5f0e8] sm:text-3xl">
                v1.0 Beta
              </h1>

              <p className="mt-2 text-sm leading-6 text-stone-400">
                Core tracking, account access, backup tools, app icon support,
                and a polished beta design.
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/14 px-4 py-2 text-sm font-semibold text-[#f5f0e8]">
              {isOpen ? "Hide" : "View"}
            </span>
          </button>

          {isOpen && (
            <div className="mt-6 border-t border-[#f5f0e8]/10 pt-5">
              <div className="grid gap-3">
                {releaseNotes.map((note, index) => (
                  <div
                    key={note.title}
                    className="rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/14 text-xs font-bold text-[#f5f0e8]">
                        {index + 1}
                      </span>

                      <h2 className="text-base font-bold text-[#f5f0e8]">
                        {note.title}
                      </h2>
                    </div>

                    <p className="text-sm leading-6 text-stone-400">
                      {note.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-[#f5f0e8]/10 bg-[#25231e] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />

                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                    Tester Notes
                  </h2>
                </div>

                <div className="grid gap-3">
                  {testerNotes.map((note) => (
                    <div
                      key={note}
                      className="rounded-2xl border border-[#f5f0e8]/10 bg-[#11100d] p-4"
                    >
                      <p className="text-sm leading-6 text-stone-300">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}