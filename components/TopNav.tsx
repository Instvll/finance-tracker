"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoMark from "./LogoMark";

const mainNavItems = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Bills", href: "/bills", icon: BillsIcon },
  { label: "Credit Cards", href: "/cards", icon: CardsIcon },
  { label: "Editor", href: "/manual", icon: EditorIcon },
];

const utilityNavItems = [
  { label: "Settings", href: "/account", icon: SettingsIcon },
  { label: "What’s New", href: "/whats-new", icon: SparkIcon },
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

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <nav className="sticky top-4 z-40 mb-5">
        <div className="liquid-glass-soft rounded-[1.75rem] px-4 py-3">
          <div className="liquid-content flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 transition hover:opacity-85"
              onClick={closeMenu}
            >
              <LogoMark small />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                  leftovr
                </p>

                <p className="hidden text-[0.58rem] uppercase tracking-[0.24em] text-[#c7ad75]/70 sm:block">
                  Personal Finance
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-3 px-1 py-2 text-sm font-semibold text-[#f5f0e8] transition hover:text-[#c7ad75]"
              aria-label="Open navigation menu"
            >
              <span className="hidden sm:inline">Menu</span>

              <span className="grid gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="drawer-backdrop absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          />

          <aside className="liquid-glass drawer-panel-right relative ml-auto flex h-full w-[88vw] max-w-[390px] rounded-l-[2rem] border-y-0 border-r-0 p-4 shadow-2xl shadow-black/40 sm:p-5">
            <div className="liquid-content flex min-h-0 w-full flex-col">
              <div className="mb-6 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex min-w-0 items-center gap-3 transition hover:opacity-85"
                >
                  <LogoMark />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold lowercase tracking-[0.22em] text-[#f5f0e8]">
                      leftovr
                    </p>

                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[#c7ad75]/75">
                      Personal Finance
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={closeMenu}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#f5f0e8]/12 bg-[#f5f0e8]/6 text-stone-300 transition hover:border-[#c7ad75]/35 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
                  aria-label="Close navigation menu"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 overflow-y-auto pr-1">
                  <MenuSection label="Main">
                    {mainNavItems.map((item) => {
                      const active = isActiveRoute(item.href);
                      const Icon = item.icon;

                      return (
                        <MenuLink
                          key={item.label}
                          href={item.href}
                          active={active}
                          onClick={closeMenu}
                          icon={<Icon />}
                          label={item.label}
                        />
                      );
                    })}
                  </MenuSection>
                </div>

                <div className="mt-auto pt-6">
                  <MenuSection label="App">
                    {utilityNavItems.map((item) => {
                      const active = isActiveRoute(item.href);
                      const Icon = item.icon;

                      return (
                        <MenuLink
                          key={item.label}
                          href={item.href}
                          active={active}
                          onClick={closeMenu}
                          icon={<Icon />}
                          label={item.label}
                        />
                      );
                    })}
                  </MenuSection>

                  <div className="mt-6 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/35 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
                      v1.1.1 Beta
                    </p>

                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      Liquid glass redesign. Private testing build.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/75">
        {label}
      </p>

      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function MenuLink({
  href,
  active,
  onClick,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`pressable flex items-center justify-between gap-4 rounded-[1.25rem] border px-4 py-3.5 transition ${
        active
          ? "border-[#c7ad75]/38 bg-[#c7ad75]/15 text-[#f5f0e8]"
          : "border-[#f5f0e8]/10 bg-[#11100d]/28 text-stone-300 hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#f5f0e8]/10 bg-[#f5f0e8]/5">
          {icon}
        </span>

        <span className="truncate text-sm font-semibold">{label}</span>
      </span>

      {active && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />
      )}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BillsIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3h10a1 1 0 0 1 1 1v17l-3-1.8-3 1.8-3-1.8L6 21V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M4 9h16M8 15h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditorIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 19h4l10-10a2.1 2.1 0 0 0-3-3L6 16l-1 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m14.5 7.5 2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.7 8.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 2.6 1.5l.4 3h4l.4-3a8.7 8.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}