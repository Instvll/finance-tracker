"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryTabs = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Bills", href: "/bills", icon: BillsIcon },
  { label: "Cards", href: "/cards", icon: CardsIcon },
  { label: "Editor", href: "/manual", icon: EditorIcon },
];

const hiddenRoutes = ["/login", "/signup"];

export default function BottomTabBar() {
  const pathname = usePathname();

  if (hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const activeIndex = primaryTabs.findIndex((item) =>
    isActiveRoute(item.href)
  );

  return (
    <>
      <div className="bottom-tab-spacer" aria-hidden="true" />

      <nav className="bottom-tab-shell" aria-label="Primary navigation">
        <div
          className="bottom-tab-bar"
          data-active-index={activeIndex >= 0 ? activeIndex : "none"}
        >
          {primaryTabs.map((item) => {
            const active = isActiveRoute(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
                className={`bottom-tab-item pressable ${
                  active ? "bottom-tab-item-active" : ""
                }`}
              >
                <span className="bottom-tab-icon" aria-hidden="true">
                  <Icon />
                </span>

                <span className="bottom-tab-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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