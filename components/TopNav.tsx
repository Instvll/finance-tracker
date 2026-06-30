"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Bills", href: "/bills" },
  { label: "Cards", href: "/cards" },
  { label: "Goals", href: "/goals" },
  { label: "Manual", href: "/manual" },
  { label: "Notes", href: "/notes" },
];

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="mb-8 rounded-full border border-stone-300/10 bg-[#11100e]/85 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-full px-2 py-1 text-sm font-semibold tracking-[0.28em] text-amber-100/90 transition hover:text-amber-50"
          onClick={() => setIsOpen(false)}
        >
          <span className="h-2 w-2 rounded-full bg-amber-100/70 shadow-[0_0_18px_rgba(245,222,179,0.35)] transition group-hover:bg-amber-50" />
          FINANCE
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-stone-300/10 bg-black/25 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-stone-400 transition hover:bg-amber-100/10 hover:text-amber-50"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="rounded-full border border-stone-300/15 bg-black/20 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 overflow-hidden rounded-3xl border border-stone-300/10 bg-black/20 p-2 md:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm text-stone-300 transition hover:bg-amber-100/10 hover:text-amber-50"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}