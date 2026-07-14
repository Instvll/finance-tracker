"use client";

import { useEffect, useState } from "react";

type ThemeId =
  | "classic"
  | "mocha"
  | "forest"
  | "slate"
  | "rose-gold"
  | "classic-light"
  | "mocha-light"
  | "forest-light"
  | "slate-light"
  | "rose-gold-light"
  | "july-fourth";

type ThemeCategory = "Dark" | "Light" | "Special";

type ThemeOption = {
  id: ThemeId;
  name: string;
  category: ThemeCategory;
  description: string;
  dots: string[];
};

const themeStorageKey = "leftovr-theme";

const themes: ThemeOption[] = [
  {
    id: "classic",
    name: "leftovr Classic",
    category: "Dark",
    description: "Obsidian, mint, and soft white.",
    dots: ["#080d0f", "#8fd8b8", "#f4f8f5"],
  },
  {
    id: "mocha",
    name: "Mocha",
    category: "Dark",
    description: "Warm charcoal, muted gold, and cream.",
    dots: ["#11100d", "#c7ad75", "#f5f0e8"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "Dark",
    description: "Deep pine, olive, and warm cream.",
    dots: ["#0f130d", "#a6b36f", "#f2efe2"],
  },
  {
    id: "slate",
    name: "Slate",
    category: "Dark",
    description: "Cool steel, blue-gray, and crisp white.",
    dots: ["#0c1018", "#9fb3d1", "#eef4fb"],
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    category: "Dark",
    description: "Charcoal rose, champagne, and warm ivory.",
    dots: ["#130f11", "#d5a39d", "#f7efed"],
  },
  {
    id: "classic-light",
    name: "leftovr Light",
    category: "Light",
    description: "Soft stone, clean white, and refined mint.",
    dots: ["#f6f7f4", "#3f8f78", "#101816"],
  },
  {
    id: "mocha-light",
    name: "Mocha Light",
    category: "Light",
    description: "Warm cream with muted gold.",
    dots: ["#f7f2e9", "#9f7a32", "#261f15"],
  },
  {
    id: "forest-light",
    name: "Forest Light",
    category: "Light",
    description: "Warm parchment, olive, and earthy beige.",
    dots: ["#f4f0e4", "#6f7f38", "#1f2418"],
  },
  {
    id: "slate-light",
    name: "Slate Light",
    category: "Light",
    description: "Clean steel white with cool slate detail.",
    dots: ["#f1f4f8", "#5d7291", "#111820"],
  },
  {
    id: "rose-gold-light",
    name: "Rose Gold Light",
    category: "Light",
    description: "Warm pearl, soft blush, and rose bronze.",
    dots: ["#f8f1ef", "#a86f69", "#2b1d1e"],
  },
  {
    id: "july-fourth",
    name: "Fourth of July",
    category: "Special",
    description: "Deep navy with muted firework red.",
    dots: ["#07152d", "#f7f4ee", "#d94b4b"],
  },
];

function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}

export default function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("classic");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    const safeTheme = isThemeId(savedTheme) ? savedTheme : "classic";

    setSelectedTheme(safeTheme);
    document.documentElement.setAttribute("data-theme", safeTheme);
  }, []);

  function chooseTheme(themeId: ThemeId) {
    setSelectedTheme(themeId);
    window.localStorage.setItem(themeStorageKey, themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  }

  const activeTheme =
    themes.find((theme) => theme.id === selectedTheme) || themes[0];

  const darkThemes = themes.filter((theme) => theme.category === "Dark");
  const lightThemes = themes.filter((theme) => theme.category === "Light");
  const specialThemes = themes.filter((theme) => theme.category === "Special");

  return (
    <section className="grid gap-2.5 overflow-hidden">
      <section className="liquid-glass-accent hero-glass-card dashboard-hero motion-card motion-card-delay-1 rounded-[2rem]">
        <div className="liquid-content dashboard-hero-content relative p-3.5 sm:p-4">
          <div
            className="dashboard-hero-glow dashboard-hero-glow-accent"
            aria-hidden="true"
          />

          <div
            className="dashboard-hero-glow dashboard-hero-glow-soft"
            aria-hidden="true"
          />

          <div className="dashboard-hero-reflection" aria-hidden="true" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5 pr-1">
              <span className="dashboard-hero-status-dot mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c7ad75]" />

              <p className="min-w-0 text-xs font-semibold uppercase leading-5 tracking-[0.22em] text-[#f5f0e8]">
                Current Theme
              </p>
            </div>

            <span className="dashboard-pill-button !px-2.5 !py-0.5">
              Active
            </span>
          </div>

          <div className="relative mt-3 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[2rem] font-bold leading-tight tracking-[-0.035em] text-[#f5f0e8] sm:text-4xl">
                {activeTheme.name}
              </p>

              <p className="mt-1 text-sm leading-5 text-stone-300/80">
                {activeTheme.description}
              </p>
            </div>

            <ThemePreview dots={activeTheme.dots} large />
          </div>

          <div className="relative mt-3 overflow-hidden rounded-[1.3rem] border border-[#f5f0e8]/10 bg-[#11100d]/18 shadow-[inset_0_1px_0_rgba(245,240,232,0.045)]">
            <div className="flex items-center justify-between gap-4 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/75">
                Style
              </p>

              <p className="text-base font-bold tracking-tight text-[#f5f0e8]">
                {activeTheme.category}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-surface motion-card motion-card-delay-2 rounded-[1.7rem] p-3">
        <div className="dashboard-surface-glow" aria-hidden="true" />

        <div className="liquid-content">
          <div className="mb-3 flex items-center justify-between gap-4">
            <SectionTitle title="Choose Theme" />

            <span className="text-xs font-semibold text-stone-500">
              {themes.length} themes
            </span>
          </div>

          <div className="grid gap-3">
            <ThemeGroup
              title="Dark"
              themes={darkThemes}
              selectedTheme={selectedTheme}
              onChooseTheme={chooseTheme}
            />

            <ThemeGroup
              title="Light"
              themes={lightThemes}
              selectedTheme={selectedTheme}
              onChooseTheme={chooseTheme}
            />

            <ThemeGroup
              title="Special"
              themes={specialThemes}
              selectedTheme={selectedTheme}
              onChooseTheme={chooseTheme}
            />
          </div>
        </div>
      </section>
    </section>
  );
}

function ThemeGroup({
  title,
  themes,
  selectedTheme,
  onChooseTheme,
}: {
  title: ThemeCategory;
  themes: ThemeOption[];
  selectedTheme: ThemeId;
  onChooseTheme: (themeId: ThemeId) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-4 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/80">
          {title}
        </p>

        <span className="text-xs font-semibold text-stone-500">
          {themes.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/16 shadow-[inset_0_1px_0_rgba(245,240,232,0.04)]">
        {themes.map((theme, index) => {
          const active = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChooseTheme(theme.id)}
              aria-pressed={active}
              className={`pressable group relative block w-full px-3.5 py-3 text-left transition ${
                index > 0 ? "border-t border-[#f5f0e8]/8" : ""
              } ${
                active
                  ? "bg-[#c7ad75]/10"
                  : "hover:bg-[#f5f0e8]/[0.035]"
              }`}
            >
              {active ? (
                <span
                  className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#c7ad75]"
                  aria-hidden="true"
                />
              ) : null}

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-[0.95rem] border transition ${
                      active
                        ? "border-[#c7ad75]/34 bg-[#c7ad75]/12 text-[#c7ad75]"
                        : "border-[#f5f0e8]/10 bg-[#f5f0e8]/5 text-stone-500 group-hover:border-[#c7ad75]/24 group-hover:text-[#c7ad75]"
                    }`}
                  >
                    {active ? <CheckIcon /> : <ThemeIcon />}
                  </span>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#f5f0e8] sm:text-base">
                        {theme.name}
                      </p>

                      {active ? (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-[#c7ad75]">
                          Active
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-0.5 overflow-hidden text-xs leading-5 text-stone-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-sm">
                      {theme.description}
                    </p>
                  </div>
                </div>

                <ThemePreview dots={theme.dots} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
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

function ThemePreview({
  dots,
  large = false,
}: {
  dots: string[];
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 overflow-hidden rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 p-0.5 ${
        large ? "max-w-[78px]" : "max-w-[64px]"
      }`}
    >
      {dots.map((dot) => (
        <span
          key={dot}
          className={`-ml-1 shrink-0 rounded-full border border-white/20 shadow-sm first:ml-0 ${
            large ? "h-5 w-5" : "h-4 w-4"
          }`}
          style={{ backgroundColor: dot }}
        />
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4.25a7.75 7.75 0 1 0 0 15.5h1.1a1.9 1.9 0 0 0 1.36-3.23 1.55 1.55 0 0 1 1.1-2.64H17a3.75 3.75 0 0 0 3.75-3.75C20.75 6.88 17.35 4.25 12 4.25Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle cx="8.3" cy="10.1" r="0.9" fill="currentColor" />
      <circle cx="10.4" cy="7.35" r="0.9" fill="currentColor" />
      <circle cx="14" cy="7.35" r="0.9" fill="currentColor" />
      <circle cx="16.15" cy="10.2" r="0.9" fill="currentColor" />
    </svg>
  );
}