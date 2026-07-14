"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/LogoMark";
import { supabase } from "../lib/supabase/client";

const publicRoutes = ["/login", "/signup"];

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let isRedirecting = false;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    function allowCurrentRoute() {
      if (!isMounted || isRedirecting) {
        return;
      }

      setIsAllowed(true);
      setIsCheckingAuth(false);
    }

    function redirectTo(path: string) {
      if (!isMounted || isRedirecting) {
        return;
      }

      isRedirecting = true;
      setIsAllowed(false);
      setIsCheckingAuth(true);

      /*
       * Auth-boundary redirects use a full location replacement instead of
       * client navigation. This is more dependable in the installed iPhone
       * web app and guarantees the newly created or cleared Supabase session
       * is picked up immediately.
       */
      window.location.replace(path);
    }

    function applySessionState(hasSession: boolean) {
      if (!isMounted || isRedirecting) {
        return;
      }

      if (!hasSession && !isPublicRoute) {
        redirectTo("/login");
        return;
      }

      if (hasSession && isPublicRoute) {
        redirectTo("/");
        return;
      }

      allowCurrentRoute();
    }

    async function checkInitialSession() {
      if (isLocalhost) {
        allowCurrentRoute();
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!isMounted || isRedirecting) {
        return;
      }

      if (error) {
        if (isPublicRoute) {
          allowCurrentRoute();
        } else {
          redirectTo("/login");
        }

        return;
      }

      applySessionState(Boolean(data.session));
    }

    checkInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isLocalhost || !isMounted || isRedirecting) {
        return;
      }

      applySessionState(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[#11100d] px-4 py-5 text-[#f5f0e8] sm:px-6 sm:py-6">
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center sm:min-h-[calc(100vh-3rem)]">
          <section className="liquid-glass-accent hero-glass-card motion-card rounded-[2rem] p-5 text-center shadow-2xl sm:p-6">
            <div className="liquid-content">
              <div className="mx-auto mb-4 flex w-fit items-center justify-center">
                <LogoMark />
              </div>

              <p className="text-sm font-semibold lowercase tracking-[0.24em] text-[#f5f0e8]">
                leftovr
              </p>

              <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/75">
                Private Beta
              </p>

              <div className="mt-5 rounded-[1.15rem] border border-[#f5f0e8]/10 bg-[#11100d]/30 px-3.5 py-3">
                <p className="text-sm font-semibold text-[#f5f0e8]">
                  Opening leftovr...
                </p>

                <p className="mt-1 text-sm leading-6 text-stone-400">
                  Checking your session.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return children;
}