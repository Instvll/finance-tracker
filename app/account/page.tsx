"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import { PageShell, Pill } from "../../components/Layout";

type SettingsItem = {
  title: string;
  description: string;
  status: string;
  href: string;
  icon: ReactNode;
};

type SettingsSection = {
  label: string;
  items: SettingsItem[];
};

const settingsSections: SettingsSection[] = [
  {
    label: "Your leftovr",
    items: [
      {
        title: "Account",
        description: "Account details and sign-in status.",
        status: "Account",
        href: "/account/profile",
        icon: <ProfileIcon />,
      },
      {
        title: "Preferences",
        description: "Pay cycle and planning behavior.",
        status: "Planning",
        href: "/account/preferences",
        icon: <PreferencesIcon />,
      },
      {
        title: "Appearance",
        description: "Themes and visual preferences.",
        status: "Themes",
        href: "/account/appearance",
        icon: <AppearanceIcon />,
      },
    ],
  },
  {
    label: "App & Data",
    items: [
      {
        title: "Data",
        description: "Back up, restore, and manage local data.",
        status: "Local",
        href: "/account/backup",
        icon: <BackupIcon />,
      },
      {
        title: "About leftovr",
        description: "Version, safety, and app information.",
        status: "v1.2.2",
        href: "/account/about",
        icon: <InfoIcon />,
      },
    ],
  },
];

export default function AccountPage() {
  return (
    <PageShell>
      <TopNav />

      <div className="min-h-[70vh]">
        <header className="-mt-1 mb-3 motion-card sm:-mt-2">
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c7ad75]/80">
              App Settings
            </p>

            <Pill>v1.3 Beta</Pill>
          </div>

          <h1 className="text-[2.15rem] font-bold leading-tight tracking-tight text-[#f5f0e8] sm:text-4xl">
            Settings
          </h1>
        </header>

        <section className="grid gap-4">
          {settingsSections.map((section, index) => (
            <SettingsGroup
              key={section.label}
              section={section}
              delayClass={
                index === 0
                  ? "motion-card-delay-1"
                  : "motion-card-delay-2"
              }
            />
          ))}
        </section>
      </div>
    </PageShell>
  );
}

function SettingsGroup({
  section,
  delayClass,
}: {
  section: SettingsSection;
  delayClass: string;
}) {
  return (
    <section className={`motion-card ${delayClass}`}>
      <div className="mb-2 px-1">
        <SectionTitle title={section.label} />
      </div>

      <div className="dashboard-surface relative overflow-hidden rounded-[1.55rem] border border-[#f5f0e8]/10 shadow-[inset_0_1px_0_rgba(245,240,232,0.05),0_16px_34px_rgba(0,0,0,0.08)]">
        <div className="dashboard-surface-glow" aria-hidden="true" />

        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f5f0e8]/25 to-transparent"
          aria-hidden="true"
        />

        <div className="liquid-content relative">
          {section.items.map((item, index) => (
            <SettingsLinkRow
              key={item.href}
              title={item.title}
              description={item.description}
              status={item.status}
              href={item.href}
              icon={item.icon}
              divided={index > 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsLinkRow({
  title,
  description,
  status,
  href,
  icon,
  divided,
}: {
  title: string;
  description: string;
  status: string;
  href: string;
  icon: ReactNode;
  divided: boolean;
}) {
  return (
    <Link
      href={href}
      className={`pressable group relative block px-3.5 py-3 transition duration-200 hover:bg-[#f5f0e8]/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c7ad75]/35 sm:px-4 sm:py-3.5 ${
        divided ? "border-t border-[#f5f0e8]/8" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] border border-[#c7ad75]/22 bg-[#c7ad75]/9 text-[#c7ad75] shadow-[inset_0_1px_0_rgba(245,240,232,0.08)] transition duration-200 group-hover:border-[#c7ad75]/32 group-hover:bg-[#c7ad75]/12">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold text-[#f5f0e8]">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-stone-500 sm:text-sm">
            {description}
          </p>
        </div>

        <div className="ml-1 flex shrink-0 items-center gap-2">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
            {status}
          </span>

          <ArrowIcon />
        </div>
      </div>
    </Link>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="dashboard-section-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-stone-600 transition duration-200 group-hover:translate-x-0.5 group-hover:text-[#c7ad75]"
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
    <svg
      className="h-[18px] w-[18px]"
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
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PreferencesIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M8 12h11M11 17h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="7"
        cy="7"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17"
        cy="12"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="9"
        cy="17"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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