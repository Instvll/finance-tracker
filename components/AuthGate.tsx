"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoMark from "@/components/LogoMark";
import { supabase } from "../lib/supabase/client";

const publicRoutes = ["/login", "/signup"];

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const isPublicRoute = publicRoutes.includes(pathname);
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isLocalhost) {
        if (!isMounted) {
          return;
        }

        setIsAllowed(true);
        setIsCheckingAuth(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!isMounted) {
        return;
      }

      if (!session && !isPublicRoute) {
        setIsAllowed(false);
        setIsCheckingAuth(false);
        router.replace("/login");
        return;
      }

      if (session && isPublicRoute) {
        setIsAllowed(false);
        setIsCheckingAuth(false);
        router.replace("/");
        return;
      }

      setIsAllowed(true);
      setIsCheckingAuth(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

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