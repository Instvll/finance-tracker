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
  { label: "Settings", href: "/account" },
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
    <nav className="mb-8 rounded-[1.75rem] border border-[#f5f0e8]/12 bg-[#181713]/90 px-3 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-[1.25rem] px-2 py-1.5 transition hover:bg-[#f5f0e8]/5"
          onClick={() => setIsOpen(false)}
        >
          <LogoMark small />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold lowercase tracking-[0.22em] text-[#f5f0e8]">
              leftovr
            </p>

            <p className="hidden text-[0.62rem] uppercase tracking-[0.24em] text-[#c7ad75]/75 sm:block">
              Personal Finance
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-[1.25rem] border border-[#f5f0e8]/10 bg-black/20 p-1 md:flex">
          {navItems.map((item) => {
            const active = isActiveRoute(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-[1rem] px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "border border-[#c7ad75]/25 bg-[#c7ad75]/14 text-[#f5f0e8] shadow-sm shadow-black/10"
                    : "text-stone-400 hover:bg-[#f5f0e8]/7 hover:text-[#f5f0e8]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="rounded-[1.1rem] border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 px-4 py-2.5 text-sm font-semibold text-stone-200 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8] md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d] p-2 md:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border border-[#c7ad75]/25 bg-[#c7ad75]/14 text-[#f5f0e8]"
                      : "text-stone-400 hover:bg-[#f5f0e8]/8 hover:text-[#f5f0e8]"
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