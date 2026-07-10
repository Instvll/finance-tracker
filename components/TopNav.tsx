"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoMark from "./LogoMark";

const drawerCloseDelay = 340;
const drawerNavigationDelay = 360;

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
  const router = useRouter();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const clearNavigationTimer = useCallback(() => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    clearNavigationTimer();
    setIsDrawerMounted(true);

    window.requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  }, [clearCloseTimer, clearNavigationTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setIsDrawerOpen(false);

    closeTimerRef.current = setTimeout(() => {
      setIsDrawerMounted(false);
      closeTimerRef.current = null;
    }, drawerCloseDelay);
  }, [clearCloseTimer]);

  const navigateFromDrawer = useCallback(
    (href: string) => {
      clearNavigationTimer();

      if (href === pathname) {
        closeMenu();
        return;
      }

      closeMenu();

      navigationTimerRef.current = setTimeout(() => {
        router.push(href);
        navigationTimerRef.current = null;
      }, drawerNavigationDelay);
    },
    [clearNavigationTimer, closeMenu, pathname, router]
  );

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  useEffect(() => {
    return () => {
      clearCloseTimer();
      clearNavigationTimer();
    };
  }, [clearCloseTimer, clearNavigationTimer]);

  useEffect(() => {
    if (!isDrawerMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isDrawerMounted]);

  return (
    <>
      <nav
        className={`sticky top-4 z-40 mb-5 transition duration-300 ${
          isDrawerMounted ? "top-nav-drawer-open" : ""
        }`}
      >
        <div className="liquid-glass-soft top-app-bar rounded-[1.85rem] px-3.5 py-3">
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
              onClick={openMenu}
              className="app-menu-button pressable"
              aria-label="Open navigation menu"
              aria-expanded={isDrawerOpen}
              aria-controls="main-navigation-drawer"
            >
              <span className="app-menu-icon" aria-hidden="true">
                <span className="app-menu-line app-menu-line-top" />
                <span className="app-menu-line app-menu-line-middle" />
                <span className="app-menu-line app-menu-line-bottom" />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {isDrawerMounted && (
        <>
          <div
            className="fixed inset-0 z-[85] h-dvh cursor-default"
            aria-hidden="true"
            onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => event.preventDefault()}
          />

          <div
            id="main-navigation-drawer"
            className="drawer-layer fixed inset-0 z-[90] h-dvh overflow-hidden"
            data-drawer-state={isDrawerOpen ? "open" : "closed"}
            aria-hidden={!isDrawerOpen}
          >
            <button
              type="button"
              className="drawer-backdrop absolute inset-0 appearance-none border-0 p-0"
              onClick={closeMenu}
              aria-label="Close navigation menu"
            />

            <aside
              className="liquid-glass drawer-panel-right relative ml-auto flex h-dvh w-[88vw] max-w-[390px] rounded-l-[2rem] border-y-0 border-r-0 px-4 pb-4 pt-5 shadow-2xl shadow-black/40 sm:px-5 sm:pb-5 sm:pt-6"
              aria-label="Navigation menu"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="liquid-content flex min-h-0 w-full flex-col">
                <div
                  className="drawer-menu-item mb-6 flex items-center justify-between gap-4"
                  style={{ "--menu-item-index": 0 } as CSSProperties}
                >
                  <DrawerLogoLink href="/" onNavigate={navigateFromDrawer} />

                  <button
                    type="button"
                    onClick={closeMenu}
                    className="drawer-close-button pressable"
                    aria-label="Close navigation menu"
                  >
                    <span className="drawer-close-icon" aria-hidden="true">
                      <span />
                      <span />
                    </span>
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 overflow-y-auto pr-1">
                    <MenuSection label="Main">
                      {mainNavItems.map((item, index) => {
                        const active = isActiveRoute(item.href);
                        const Icon = item.icon;

                        return (
                          <MenuLink
                            key={item.label}
                            href={item.href}
                            active={active}
                            onNavigate={navigateFromDrawer}
                            icon={<Icon />}
                            label={item.label}
                            index={index + 1}
                          />
                        );
                      })}
                    </MenuSection>
                  </div>

                  <div className="mt-auto pt-6">
                    <MenuSection label="App">
                      {utilityNavItems.map((item, index) => {
                        const active = isActiveRoute(item.href);
                        const Icon = item.icon;

                        return (
                          <MenuLink
                            key={item.label}
                            href={item.href}
                            active={active}
                            onNavigate={navigateFromDrawer}
                            icon={<Icon />}
                            label={item.label}
                            index={mainNavItems.length + index + 1}
                          />
                        );
                      })}
                    </MenuSection>

                    <div
                      className="drawer-menu-item mt-6 rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/35 p-4"
                      style={
                        {
                          "--menu-item-index":
                            mainNavItems.length + utilityNavItems.length + 1,
                        } as CSSProperties
                      }
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
                        v1.2.2 Beta
                      </p>

                      <p className="mt-2 text-sm leading-6 text-stone-400">
                        Refined experience. Theme identity and mobile polish.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

function DrawerLogoLink({
  href,
  onNavigate,
}: {
  href: string;
  onNavigate: (href: string) => void;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (shouldUseDefaultLinkBehavior(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onNavigate(href);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
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
  );
}

function MenuSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
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
  onNavigate,
  icon,
  label,
  index,
}: {
  href: string;
  active: boolean;
  onNavigate: (href: string) => void;
  icon: ReactNode;
  label: string;
  index: number;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (shouldUseDefaultLinkBehavior(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onNavigate(href);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      style={{ "--menu-item-index": index } as CSSProperties}
      className={`drawer-menu-item pressable flex items-center justify-between gap-4 rounded-[1.25rem] border px-4 py-3.5 transition ${
        active
          ? "border-[#c7ad75]/38 bg-[#c7ad75]/15 text-[#f5f0e8] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]"
          : "border-[#f5f0e8]/10 bg-[#11100d]/28 text-stone-300 hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition ${
            active
              ? "border-[#c7ad75]/28 bg-[#c7ad75]/12 text-[#c7ad75]"
              : "border-[#f5f0e8]/10 bg-[#f5f0e8]/5 text-stone-400"
          }`}
        >
          {icon}
        </span>

        <span className="truncate text-sm font-semibold">{label}</span>
      </span>

      {active ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#c7ad75] shadow-[0_0_16px_rgba(199,173,117,0.35)]" />
      ) : (
        <span className="h-2 w-2 shrink-0 rounded-full bg-transparent" />
      )}
    </Link>
  );
}

function shouldUseDefaultLinkBehavior(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0 ||
    event.currentTarget.target === "_blank"
  );
}

function DashboardIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function BillsIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-1.8-3 1.8-3-1.8L6 21V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 9h16M8 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EditorIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19h4l10-10a2.1 2.1 0 0 0-3-3L6 16l-1 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m14.5 7.5 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.7 8.7 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 2.6 1.5l.4 3h4l.4-3a8.7 8.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}