"use client";

import { useEffect, useRef } from "react";
import { checkForFinanceUpdates } from "../lib/financeUpdateCheck";

const automaticFinanceUpdateCheckCooldown = 1500;
const initialFinanceUpdateCheckDelay = 350;

export default function FinanceUpdateChecker() {
  const lastCheckStartedAtRef = useRef(0);
  const initialCheckTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const runUpdateCheck = () => {
      if (isDisposed) {
        return;
      }

      const now = Date.now();

      if (
        now - lastCheckStartedAtRef.current <
        automaticFinanceUpdateCheckCooldown
      ) {
        return;
      }

      lastCheckStartedAtRef.current = now;
      void checkForFinanceUpdates();
    };

    const handleWindowFocus = () => {
      runUpdateCheck();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runUpdateCheck();
      }
    };

    const handleOnline = () => {
      runUpdateCheck();
    };

    initialCheckTimerRef.current = window.setTimeout(() => {
      initialCheckTimerRef.current = null;
      runUpdateCheck();
    }, initialFinanceUpdateCheckDelay);

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      isDisposed = true;

      if (initialCheckTimerRef.current !== null) {
        window.clearTimeout(initialCheckTimerRef.current);
        initialCheckTimerRef.current = null;
      }

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );
      window.removeEventListener(
        "online",
        handleOnline,
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  return null;
}