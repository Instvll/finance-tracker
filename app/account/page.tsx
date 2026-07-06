"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

const settingsItems = [
  {
    title: "Profile",
    description: "Account and sign out.",
    status: "Account",
    href: "/account/profile",
    icon: <ProfileIcon />,
  },
  {
    title: "Appearance",
    description: "Themes and visual style.",
    status: "Themes",
    href: "/account/appearance",
    icon: <AppearanceIcon />,
  },
  {
    title: "Data & Backup",
    description: "Backup and restore.",
    status: "Manual",
    href: "/account/backup",
    icon: <BackupIcon />,
  },
  {
    title: "About leftovr",
    description: "Version and app details.",
    status: "v1.2",
    href: "/account/about",
    icon: <InfoIcon />,
  },
];

export default function AccountPage() {
  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-4 motion-card sm:-mt-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              App Settings
            </p>

            <Pill>v1.2 Beta</Pill>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#f5f0e8]">
            Settings
          </h1>
        </header>

        <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
          <div className="liquid-content grid gap-2">
            {settingsItems.map((item) => (
              <SettingsLinkRow
                key={item.href}
                title={item.title}
                description={item.description}
                status={item.status}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function SettingsLinkRow({
  title,
  description,
  status,
  href,
  icon,
}: {
  title: string;
  description: string;
  status: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="pressable group rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/22 p-3.5 transition hover:border-[#c7ad75]/24 hover:bg-[#f5f0e8]/6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/10 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#f5f0e8]">
              {title}
            </p>

            <p className="mt-1 truncate text-sm text-stone-400">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full border border-[#f5f0e8]/10 bg-[#f5f0e8]/6 px-2.5 py-1 text-xs font-semibold text-stone-400 sm:inline-flex">
            {status}
          </span>

          <ArrowIcon />
        </div>
      </div>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-[#c7ad75]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a9 9 0 0 0 0 18h.6a2.2 2.2 0 0 0 1.6-3.7 1.4 1.4 0 0 1 1-2.4H16a5 5 0 0 0 5-5C21 6.1 17 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M7.6 10.2h.01M9.9 6.9h.01M14.1 6.9h.01M16.4 10.2h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackupIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 18a5 5 0 0 1-.8-9.9A6.5 6.5 0 0 1 18.8 10 4 4 0 0 1 18 18H7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M12 12v7M9.5 14.5 12 12l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 10v6M12 7.5h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}