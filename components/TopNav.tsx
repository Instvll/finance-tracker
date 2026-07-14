"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoMark from "./LogoMark";
import { supabase } from "../lib/supabase/client";

const drawerCloseDelay = 290;
const drawerNavigationDelay = 95;

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
  const [accountEmail, setAccountEmail] = useState("");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

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
    setShowSignOutConfirm(false);
    setSignOutError("");
    setIsDrawerMounted(true);

    window.requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  }, [clearCloseTimer, clearNavigationTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setShowSignOutConfirm(false);
    setSignOutError("");
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
    const routes = [...mainNavItems, ...utilityNavItems]
      .map((item) => item.href)
      .filter((href) => href !== pathname);

    routes.forEach((href) => {
      router.prefetch(href);
    });
  }, [pathname, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      const { data } = await supabase.auth.getUser();

      if (isMounted) {
        setAccountEmail(data.user?.email ?? "");
      }
    }

    loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setAccountEmail(session?.user?.email ?? "");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      setSignOutError("Couldn’t sign out. Please try again.");
      return;
    }

    window.location.href = "/login";
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
      if (event.key !== "Escape") {
        return;
      }

      if (showSignOutConfirm) {
        setShowSignOutConfirm(false);
        setSignOutError("");
        return;
      }

      closeMenu();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isDrawerMounted, showSignOutConfirm]);

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
              className="liquid-glass drawer-panel-right relative ml-auto flex h-dvh w-[88vw] max-w-[390px] rounded-l-[2rem] border-y-0 border-r-0 px-4 pb-4 pt-[1.15rem] shadow-2xl shadow-black/40 sm:px-5 sm:pb-5 sm:pt-5"
              aria-label="Navigation menu"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="liquid-content flex min-h-0 w-full flex-col">
                <div
                  className="drawer-menu-item mb-5 flex items-center justify-between gap-4"
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
                  <div className="drawer-menu-scroll min-h-0 overflow-y-auto pr-1">
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

                  <div className="mt-auto pt-5">
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
                      className="drawer-menu-item mt-4 border-t border-[#f5f0e8]/8 pt-3.5"
                      style={
                        {
                          "--menu-item-index":
                            mainNavItems.length + utilityNavItems.length + 1,
                        } as CSSProperties
                      }
                    >
                      <div className="drawer-account-card">
                        <div className="liquid-content relative flex min-w-0 items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="drawer-account-status-dot" />

                              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/70">
                                Signed in
                              </p>
                            </div>

                            <p className="mt-1 truncate text-[13px] font-semibold leading-5 text-[#f5f0e8]">
                              {accountEmail || "Account connected"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSignOutError("");
                              setShowSignOutConfirm(true);
                            }}
                            className="drawer-account-signout pressable"
                            aria-label="Sign out"
                            title="Sign out"
                          >
                            <PowerIcon />
                          </button>
                        </div>

                        <div className="liquid-content relative mt-2 flex min-w-0 items-center gap-1.5">
                          <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c7ad75]/60">
                            v1.3 Beta
                          </p>

                          <span className="text-[9px] text-stone-600" aria-hidden="true">
                            •
                          </span>

                          <p className="truncate text-[9px] font-medium text-stone-500">
                            Clearer by Payday
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {showSignOutConfirm ? (
                <div
                  className="absolute inset-0 z-20 flex items-end bg-black/25 p-4"
                  onClick={() => {
                    if (!isSigningOut) {
                      setShowSignOutConfirm(false);
                      setSignOutError("");
                    }
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="sign-out-title"
                    className="liquid-glass-soft w-full rounded-[1.5rem] border border-[#f5f0e8]/12 p-4 shadow-[0_24px_56px_rgba(0,0,0,0.34)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="liquid-content">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c7ad75]/24 bg-[#c7ad75]/10 text-[#c7ad75]">
                          <PowerIcon />
                        </span>

                        <div className="min-w-0">
                          <h2
                            id="sign-out-title"
                            className="text-base font-semibold text-[#f5f0e8]"
                          >
                            Sign out of leftovr?
                          </h2>

                          <p className="mt-1 text-sm leading-6 text-stone-400">
                            You’ll need to sign in again to access your account.
                            Financial data stored on this device will remain here.
                          </p>
                        </div>
                      </div>

                      {signOutError ? (
                        <p
                          role="alert"
                          className="mt-3 rounded-[0.95rem] border border-[#dc2626]/24 bg-[#dc2626]/8 px-3 py-2 text-sm text-[#ef4444]"
                        >
                          {signOutError}
                        </p>
                      ) : null}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSignOutConfirm(false);
                            setSignOutError("");
                          }}
                          disabled={isSigningOut}
                          className="pressable rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/5 px-4 py-2.5 text-sm font-semibold text-stone-300 transition hover:border-[#f5f0e8]/16 hover:bg-[#f5f0e8]/8 hover:text-[#f5f0e8] disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={signOut}
                          disabled={isSigningOut}
                          className="pressable rounded-full border border-[#c7ad75]/34 bg-[#c7ad75]/14 px-4 py-2.5 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#c7ad75]/46 hover:bg-[#c7ad75]/20 disabled:opacity-60"
                        >
                          {isSigningOut ? "Signing Out…" : "Sign Out"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
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
      <p className="drawer-section-label">{label}</p>

      <div className="grid gap-1.5">{children}</div>
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
      aria-current={active ? "page" : undefined}
      style={{ "--menu-item-index": index } as CSSProperties}
      className={`drawer-menu-item drawer-nav-link pressable ${
        active ? "drawer-nav-link-active" : ""
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`drawer-nav-icon ${
            active ? "drawer-nav-icon-active" : ""
          }`}
        >
          {icon}
        </span>

        <span className="drawer-nav-label truncate">{label}</span>
      </span>

      <span
        className={`drawer-nav-dot ${
          active ? "drawer-nav-dot-active" : ""
        }`}
        aria-hidden="true"
      />
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

function AccountIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3v9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M6.7 6.8a8 8 0 1 0 10.6 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
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