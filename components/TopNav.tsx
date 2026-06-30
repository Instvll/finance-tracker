"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Songs", href: "/songs" },
  { label: "Tasks", href: "/tasks" },
  { label: "Files", href: "/files" },
  { label: "Notes", href: "/notes" },
  { label: "Resources", href: "/resources" },
];

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="mb-10 rounded-2xl border border-stone-300/10 bg-[#11100e]/90 px-5 py-3 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-3 text-sm font-semibold tracking-[0.3em] text-amber-100/90 transition hover:text-amber-50"
          onClick={() => setIsOpen(false)}
        >
          <span className="h-2 w-2 rounded-full bg-amber-100/70 transition group-hover:bg-amber-50" />
          HOLLOWS
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-stone-300/10 bg-black/20 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-stone-300 transition hover:bg-stone-300/10 hover:text-amber-50"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="rounded-full border border-stone-300/15 px-4 py-2 text-sm text-stone-300 transition hover:border-amber-100/30 hover:bg-amber-100/10 hover:text-amber-50 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 grid gap-2 border-t border-stone-300/10 pt-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl px-4 py-3 text-sm text-stone-300 transition hover:bg-stone-300/10 hover:text-amber-50"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}