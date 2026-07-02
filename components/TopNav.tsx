"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoMark from "./LogoMark";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Bills", href: "/bills" },
  { label: "Credit Cards", href: "/cards" },
  { label: "Editor", href: "/manual" },
  { label: "Account", href: "/account" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <nav className="mb-8 rounded-[1.65rem] border border-stone-300/15 bg-[#1c1b18]/90 p-2 shadow-2xl shadow-black/15 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-[1.25rem] px-2 py-2 transition hover:bg-stone-100/5"
          onClick={() => setIsOpen(false)}
        >
          <LogoMark small />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
              leftovr
            </p>

            <p className="hidden text-[0.65rem] uppercase tracking-[0.22em] text-stone-500 sm:block">
              Personal finance
            </p>
          </div>
        </Link>

        <div className="hidden items-center rounded-[1.2rem] border border-stone-300/10 bg-black/15 p-1 md:flex">
          {navItems.map((item) => {
            const active = isActiveRoute(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-[0.95rem] px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-stone-100/12 text-[#f5f0e8] shadow-sm shadow-black/10"
                    : "text-stone-400 hover:bg-stone-100/7 hover:text-stone-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="rounded-[1.15rem] border border-stone-300/15 bg-stone-100/5 px-4 py-3 text-sm font-semibold text-stone-200 transition hover:border-stone-100/25 hover:bg-stone-100/10 hover:text-stone-100 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2 rounded-[1.25rem] border border-stone-300/10 bg-[#151411] p-2 md:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-stone-100/12 text-[#f5f0e8]"
                      : "text-stone-400 hover:bg-stone-100/8 hover:text-stone-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}