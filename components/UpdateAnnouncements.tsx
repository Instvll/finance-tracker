"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LogoMark from "@/components/LogoMark";

const welcomeStorageKey = "leftovr-welcome-seen";
const lastSeenVersionStorageKey = "leftovr-last-seen-version";
const currentRelease = "v2.0-beta";

export default function UpdateAnnouncements() {
  const pathname = usePathname();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (isAuthPage) {
      setShowAnnouncement(false);
      return;
    }

    try {
      const hasSeenWelcome = Boolean(
        window.localStorage.getItem(welcomeStorageKey),
      );
      const lastSeenVersion = window.localStorage.getItem(
        lastSeenVersionStorageKey,
      );

      setShowAnnouncement(
        hasSeenWelcome && lastSeenVersion !== currentRelease,
      );
    } catch {
      setShowAnnouncement(false);
    }
  }, [pathname]);

  function markCurrentReleaseSeen() {
    try {
      window.localStorage.setItem(
        lastSeenVersionStorageKey,
        currentRelease,
      );
    } catch {
      // The announcement can still close if browser storage is unavailable.
    }
  }

  function handleContinue() {
    markCurrentReleaseSeen();
    setShowAnnouncement(false);
  }

  function handleSeeWhatsNew() {
    markCurrentReleaseSeen();
    setShowAnnouncement(false);
    router.push("/whats-new");
  }

  if (!hasMounted || !showAnnouncement) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[94] flex items-center justify-center overflow-y-auto px-4 py-5 sm:px-6">
      <div
        className="absolute inset-0"
        style={{
          background:
            "color-mix(in srgb, var(--theme-background) 68%, rgba(0, 0, 0, 0.46))",
          backdropFilter: "blur(16px) saturate(128%)",
          WebkitBackdropFilter: "blur(16px) saturate(128%)",
        }}
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-announcement-title"
        className="motion-card relative my-auto w-full max-w-[27rem] overflow-hidden rounded-[2rem] border"
        style={{
          maxHeight: "calc(100dvh - 2rem)",
          overflowY: "auto",
          color: "var(--theme-text)",
          borderColor: "var(--theme-border)",
          background:
            "linear-gradient(145deg, color-mix(in srgb, var(--theme-surface-strong) 96%, var(--theme-accent) 4%), var(--theme-surface))",
          boxShadow:
            "inset 0 1px 0 color-mix(in srgb, var(--theme-text) 8%, transparent), 0 28px 70px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--theme-text) 18%, transparent), transparent)",
          }}
          aria-hidden="true"
        />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark />

              <div className="min-w-0">
                <p
                  className="truncate text-[1.05rem] font-semibold tracking-[-0.025em]"
                  style={{ color: "var(--theme-text)" }}
                >
                  leftovr
                </p>

                <p
                  className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  What&apos;s new
                </p>
              </div>
            </div>

            <span
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                color: "var(--theme-text-secondary)",
                borderColor:
                  "color-mix(in srgb, var(--theme-border) 82%, var(--theme-accent) 18%)",
                background:
                  "color-mix(in srgb, var(--theme-surface) 88%, var(--theme-accent) 12%)",
              }}
            >
              v2.0 Beta
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: "var(--theme-accent)",
                  boxShadow:
                    "0 0 0 6px color-mix(in srgb, var(--theme-accent) 12%, transparent)",
                }}
                aria-hidden="true"
              />

              <p
                className="text-[0.65rem] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--theme-accent)" }}
              >
                Connected by Design
              </p>
            </div>

            <h1
              id="update-announcement-title"
              className="mt-3 max-w-[22rem] text-[2rem] font-bold leading-[1.04] tracking-[-0.045em] sm:text-[2.2rem]"
              style={{ color: "var(--theme-text)" }}
            >
              Saving, syncing, and planning now work as one.
            </h1>

            <p
              className="mt-3 max-w-[23rem] text-sm leading-6"
              style={{ color: "var(--theme-text-secondary)" }}
            >
              leftovr now saves automatically, protects changes across devices,
              and brings a more consistent experience to every part of the app.
            </p>
          </div>

          <div
            className="mt-5 overflow-hidden rounded-[1.45rem] border"
            style={{
              borderColor: "var(--theme-border)",
              background:
                "color-mix(in srgb, var(--theme-surface) 92%, var(--theme-accent) 8%)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--theme-text) 5%, transparent)",
            }}
          >
            <UpdateHighlight
              title="Automatic saving"
              description="Changes save quietly while leftovr keeps your device and account state aligned."
            />

            <UpdateHighlight
              title="Safer device updates"
              description="Guarded restores, recovery checks, and conflict review help protect newer data."
            />

            <UpdateHighlight
              title="Refined from end to end"
              description="Dashboard, Bills, Cards, Editor, settings, and account tools now feel like one product."
              last
            />
          </div>

          <div className="mt-5 grid gap-2.5">
            <button
              type="button"
              onClick={handleSeeWhatsNew}
              className="pressable w-full rounded-full border px-4 py-3 text-sm font-semibold transition"
              style={{
                color:
                  "color-mix(in srgb, var(--theme-background) 90%, var(--theme-text) 10%)",
                borderColor:
                  "color-mix(in srgb, var(--theme-accent) 78%, var(--theme-border) 22%)",
                backgroundColor: "var(--theme-accent)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in srgb, white 22%, transparent), 0 12px 28px color-mix(in srgb, var(--theme-accent) 18%, transparent)",
              }}
            >
              See what&apos;s new
            </button>

            <button
              type="button"
              onClick={handleContinue}
              className="pressable w-full rounded-full border px-4 py-3 text-sm font-semibold transition"
              style={{
                color: "var(--theme-text-secondary)",
                borderColor: "var(--theme-border)",
                background:
                  "color-mix(in srgb, var(--theme-surface) 94%, var(--theme-accent) 6%)",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function UpdateHighlight({
  title,
  description,
  last = false,
}: {
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex gap-3 px-3.5 py-3.5"
      style={{
        borderBottom: last ? "none" : "1px solid var(--theme-border)",
      }}
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: "var(--theme-accent)",
          opacity: 0.82,
        }}
        aria-hidden="true"
      />

      <div className="min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)" }}
        >
          {title}
        </p>

        <p
          className="mt-0.5 text-xs leading-5"
          style={{ color: "var(--theme-text-secondary)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}