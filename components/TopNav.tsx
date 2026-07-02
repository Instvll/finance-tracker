"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Bills", href: "/bills" },
  { label: "Credit Cards", href: "/cards" },
  { label: "Editor", href: "/manual" },
  { label: "Account", href: "/account" },
];

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="mb-8 rounded-[1.75rem] border border-stone-300/20 bg-[#1f1e1b]/90 px-4 py-3 shadow-xl shadow-black/10 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-full px-2 py-1 text-sm font-semibold tracking-[0.32em] text-stone-100 transition hover:text-[#f5f0e8]"
          onClick={() => setIsOpen(false)}
        >
          <span className="h-2 w-2 rounded-full bg-stone-100/70 shadow-[0_0_14px_rgba(245,240,232,0.2)] transition group-hover:bg-[#f5f0e8]" />
          leftover
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-stone-300/15 bg-black/10 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-stone-300 transition hover:bg-stone-100/10 hover:text-stone-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="rounded-full border border-stone-300/20 bg-stone-100/5 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-100/30 hover:bg-stone-100/10 hover:text-stone-100 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 rounded-[1.25rem] border border-stone-300/15 bg-[#171614] p-2 md:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm text-stone-300 transition hover:bg-stone-100/10 hover:text-stone-100"
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