"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase/client";

const publicRoutes = ["/login", "/signup"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const isPublicRoute = publicRoutes.includes(pathname);

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
      <main className="min-h-screen bg-[#171614] px-4 py-6 text-[#f5f0e8]">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="rounded-[2rem] border border-stone-300/20 bg-[#23211d] p-6 text-center shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">
              leftovr
            </p>

            <p className="mt-3 text-sm text-stone-300">
              Checking your session...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return children;
}