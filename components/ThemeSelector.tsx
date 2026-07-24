"use client";

import { useEffect, useMemo, useState } from "react";

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
  paletteLabel: string;
  dots: [string, string, string];
};

const themeStorageKey = "leftovr-theme";

const themes: ThemeOption[] = [
  {
    id: "classic",
    name: "leftovr Dark",
    category: "Dark",
    description: "Deep slate, muted sage, and warm cream.",
    paletteLabel: "Slate · sage · cream",
    dots: ["#11161b", "#a7b89d", "#f4f1e8"],
  },
  {
    id: "mocha",
    name: "Mocha",
    category: "Dark",
    description: "Espresso, brushed gold, and warm cream.",
    paletteLabel: "Espresso · gold · cream",
    dots: ["#100e0b", "#d0b171", "#f7f1e7"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "Dark",
    description: "Deep pine, softened olive, and natural ivory.",
    paletteLabel: "Pine · olive · ivory",
    dots: ["#0b100a", "#a9bd73", "#f2f2e7"],
  },
  {
    id: "slate",
    name: "Slate",
    category: "Dark",
    description: "Midnight slate, cool steel, and crisp white.",
    paletteLabel: "Midnight · steel · white",
    dots: ["#090e16", "#9fb8dc", "#f1f5fb"],
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    category: "Dark",
    description: "Blackened rose, soft champagne, and warm ivory.",
    paletteLabel: "Rose · champagne · ivory",
    dots: ["#100c0e", "#d9a5a2", "#faf1ef"],
  },
  {
    id: "classic-light",
    name: "leftovr Light",
    category: "Light",
    description: "Warm cream, grounded slate, and muted sage.",
    paletteLabel: "Cream · slate · sage",
    dots: ["#f4f1e8", "#3e4652", "#a7b89d"],
  },
  {
    id: "mocha-light",
    name: "Mocha Light",
    category: "Light",
    description: "Warm porcelain, honey gold, and espresso.",
    paletteLabel: "Porcelain · gold · espresso",
    dots: ["#f6f1e8", "#956e27", "#2a2116"],
  },
  {
    id: "forest-light",
    name: "Forest Light",
    category: "Light",
    description: "Soft parchment, quiet olive, and deep moss.",
    paletteLabel: "Parchment · olive · moss",
    dots: ["#f2f2e9", "#687b3d", "#20271b"],
  },
  {
    id: "slate-light",
    name: "Slate Light",
    category: "Light",
    description: "Cloud white, cool blue-gray, and graphite.",
    paletteLabel: "Cloud · blue-gray · graphite",
    dots: ["#f1f4f8", "#526c91", "#151d28"],
  },
  {
    id: "rose-gold-light",
    name: "Rose Gold Light",
    category: "Light",
    description: "Warm pearl, focused blush, and rose bronze.",
    paletteLabel: "Pearl · blush · bronze",
    dots: ["#f7f3f1", "#a56561", "#2d2021"],
  },
  {
    id: "july-fourth",
    name: "Fourth of July",
    category: "Special",
    description: "Deep navy, warm white, and restrained firework red.",
    paletteLabel: "Navy · white · red",
    dots: ["#061226", "#f8f5ef", "#ef6670"],
  },
];

const themeCategories: ThemeCategory[] = ["Dark", "Light", "Special"];

function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}

export default function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] =
    useState<ThemeId>("classic");
  const [activeCategory, setActiveCategory] =
    useState<ThemeCategory>("Dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    const safeTheme = isThemeId(savedTheme)
      ? savedTheme
      : "classic";
    const savedThemeOption =
      themes.find((theme) => theme.id === safeTheme) ?? themes[0];

    if (safeTheme !== savedTheme) {
      window.localStorage.setItem(themeStorageKey, safeTheme);
    }

    setSelectedTheme(safeTheme);
    setActiveCategory(savedThemeOption.category);
    document.documentElement.setAttribute("data-theme", safeTheme);
  }, []);

  function chooseTheme(themeId: ThemeId) {
    const nextTheme =
      themes.find((theme) => theme.id === themeId) ?? themes[0];

    setSelectedTheme(nextTheme.id);
    setActiveCategory(nextTheme.category);
    window.localStorage.setItem(themeStorageKey, nextTheme.id);
    document.documentElement.setAttribute("data-theme", nextTheme.id);
  }

  const visibleThemes = useMemo(
    () =>
      themes.filter((theme) => theme.category === activeCategory),
    [activeCategory],
  );

  return (
    <section className="grid gap-3.5">
      <section
        className="motion-card motion-card-delay-1 grid grid-cols-3 gap-1 rounded-[1.2rem] border p-1"
        style={{
          borderColor: "var(--theme-border-default)",
          background: "var(--theme-surface-sheet)",
          boxShadow:
            "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 64%, transparent)",
        }}
        aria-label="Theme categories"
      >
        {themeCategories.map((category) => {
          const active = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={active}
              className="pressable rounded-[0.9rem] px-2 py-2.5 text-center text-[0.76rem] font-semibold transition-[background,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2"
              style={{
                border: `1px solid ${
                  active
                    ? "color-mix(in srgb, var(--theme-accent) 18%, var(--theme-border-default))"
                    : "transparent"
                }`,
                background: active
                  ? "color-mix(in srgb, var(--theme-accent) 5%, var(--theme-surface-control))"
                  : "transparent",
                color: active
                  ? "var(--theme-text)"
                  : "var(--theme-text-tertiary)",
                boxShadow: active
                  ? "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 68%, transparent)"
                  : "none",
              }}
            >
              {category}
            </button>
          );
        })}
      </section>

      <section
        className="motion-card motion-card-delay-2 overflow-hidden rounded-[1.35rem] border"
        style={{
          borderColor: "var(--theme-border-default)",
          background: "var(--theme-surface-sheet)",
          boxShadow:
            "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 64%, transparent)",
        }}
      >
        {visibleThemes.map((theme, index) => {
          const active = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => chooseTheme(theme.id)}
              aria-pressed={active}
              className="pressable block w-full px-3.5 py-3.5 text-left transition-[background,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                borderTop:
                  index > 0
                    ? "1px solid var(--theme-divider)"
                    : undefined,
                background: active
                  ? "color-mix(in srgb, var(--theme-accent) 3.5%, transparent)"
                  : "transparent",
              }}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <ThemeSwatches dots={theme.dots} />

                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--theme-text)" }}
                  >
                    {theme.name}
                  </p>

                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    {theme.paletteLabel}
                  </p>
                </div>

                {active ? (
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full border"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--theme-accent) 30%, var(--theme-border-default))",
                      background:
                        "color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface-control))",
                      color: "var(--theme-accent)",
                    }}
                    aria-hidden="true"
                  >
                    <CheckIcon />
                  </span>
                ) : (
                  <span
                    className="h-7 w-7"
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          );
        })}
      </section>

      <p
        className="motion-card motion-card-delay-3 px-1 text-center text-[0.72rem] leading-5"
        style={{ color: "var(--theme-text-tertiary)" }}
      >
        Themes apply instantly and stay on this device.
      </p>
    </section>
  );
}

function ThemeSwatches({
  dots,
}: {
  dots: [string, string, string];
}) {
  return (
    <span
      className="flex h-10 w-14 shrink-0 overflow-hidden rounded-[0.8rem] border"
      style={{
        borderColor: "var(--theme-border-default)",
        boxShadow:
          "inset 0 1px 0 color-mix(in srgb, var(--theme-highlight) 58%, transparent)",
      }}
      aria-hidden="true"
    >
      {dots.map((dot) => (
        <span
          key={dot}
          className="h-full flex-1"
          style={{ backgroundColor: dot }}
        />
      ))}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m6 12.5 4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}