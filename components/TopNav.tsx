"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LeftovrLogo from "./LeftovrLogo";
import { supabase } from "../lib/supabase/client";

const drawerCloseDelay = 270;
const drawerNavigationDelay = 70;

const utilityNavItems = [
  {
    label: "Settings",
    href: "/account",
    icon: SettingsIcon,
  },
  {
    label: "Account & Sync",
    href: "/account/profile",
    icon: AccountIcon,
  },
  {
    label: "What’s New",
    href: "/whats-new",
    icon: SparkIcon,
  },
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
    [clearNavigationTimer, closeMenu, pathname, router],
  );

  function isActiveRoute(href: string) {
    if (href === "/account") {
      return (
        pathname === "/account" ||
        (pathname.startsWith("/account/") &&
          !pathname.startsWith("/account/profile"))
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    const routes = utilityNavItems
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

    document.documentElement.classList.add("leftovr-drawer-open");
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
      document.documentElement.classList.remove("leftovr-drawer-open");
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isDrawerMounted, showSignOutConfirm]);

  return (
    <>
      <nav
        className={`top-nav-shell top-nav-modern relative z-40 mb-5 transition duration-300 ${
          isDrawerMounted ? "top-nav-drawer-open" : ""
        }`}
      >
        <div className="top-app-bar top-app-bar-modern">
          <div className="top-app-bar-content">
            <Link
              href="/"
              aria-label="Go to the leftovr dashboard"
              className="top-app-brand pressable"
              onClick={closeMenu}
            >
              <LeftovrLogo variant="lockup" size="nav" />
            </Link>

            <button
              type="button"
              onClick={isDrawerOpen ? closeMenu : openMenu}
              className="app-menu-button top-app-menu-button top-app-menu-button-modern pressable"
              aria-label={
                isDrawerOpen
                  ? "Close account and app menu"
                  : "Open account and app menu"
              }
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
              className="liquid-glass drawer-panel-right drawer-utility-panel"
              aria-label="Navigation menu"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="liquid-content drawer-utility-content">
                <header className="drawer-utility-header">
                  <div className="drawer-utility-brand">
                    <LeftovrLogo variant="lockup" size="menu" subtitle="Menu" />
                  </div>

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
                </header>

                <section
                  className="drawer-identity-card"
                  aria-label="Signed-in account"
                >
                  <div className="min-w-0 flex-1">
                    <div className="drawer-identity-status">
                      <span className="drawer-account-status-dot" />
                      <span>Signed in</span>
                    </div>

                    <p className="drawer-identity-email">
                      {accountEmail || "Account connected"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSignOutError("");
                      setShowSignOutConfirm(true);
                    }}
                    className="drawer-signout-action pressable"
                    aria-label="Sign out of leftovr"
                  >
                    <PowerIcon />
                    <span>Sign out</span>
                  </button>
                </section>

                <div className="drawer-menu-scroll">
                  <div className="drawer-utility-list">
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
                          index={index + 1}
                        />
                      );
                    })}
                  </div>
                </div>

                <footer className="drawer-utility-footer">
                  <span>v2.0 Beta</span>
                  <span aria-hidden="true">•</span>
                  <span>Connected by Design</span>
                </footer>
              </div>

              {showSignOutConfirm ? (
                <div
                  className="drawer-signout-confirm-layer"
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
                    aria-describedby="sign-out-description"
                    className="drawer-signout-confirm-dialog"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="drawer-signout-confirm-heading">
                      <span className="drawer-signout-confirm-icon">
                        <PowerIcon />
                      </span>

                      <div className="min-w-0">
                        <h2
                          id="sign-out-title"
                          className="drawer-signout-confirm-title"
                        >
                          Sign out of leftovr?
                        </h2>

                        <p
                          id="sign-out-description"
                          className="drawer-signout-confirm-copy"
                        >
                          You’ll need to sign in again to access your account.
                          Financial data stored on this device will remain here.
                        </p>
                      </div>
                    </div>

                    {signOutError ? (
                      <p role="alert" className="drawer-signout-confirm-error">
                        {signOutError}
                      </p>
                    ) : null}

                    <div className="drawer-signout-confirm-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSignOutConfirm(false);
                          setSignOutError("");
                        }}
                        disabled={isSigningOut}
                        className="drawer-signout-confirm-button drawer-signout-confirm-cancel pressable"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={signOut}
                        disabled={isSigningOut}
                        className="drawer-signout-confirm-button drawer-signout-confirm-primary pressable"
                      >
                        {isSigningOut ? "Signing Out…" : "Sign Out"}
                      </button>
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

        <span className="drawer-nav-label">{label}</span>
      </span>

      <span className="drawer-nav-trailing" aria-hidden="true">
        <ChevronRightIcon />
      </span>
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

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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