"use client";

import { useEffect, useState } from "react";

type ThemeId =
  | "classic"
  | "forest"
  | "slate"
  | "classic-light"
  | "forest-light"
  | "slate-light"
  | "july-fourth";

type ThemeCategory = "Dark" | "Light" | "Special";

const themeStorageKey = "leftovr-theme";

const themes: {
  id: ThemeId;
  name: string;
  category: ThemeCategory;
  description: string;
  dots: string[];
}[] = [
  {
    id: "classic",
    name: "leftovr Classic",
    category: "Dark",
    description: "Dark charcoal, muted gold, and warm cream.",
    dots: ["#11100d", "#c7ad75", "#f5f0e8"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "Dark",
    description: "Deep green, sage, and soft natural tones.",
    dots: ["#0f1712", "#8fae86", "#f2efe6"],
  },
  {
    id: "slate",
    name: "Slate",
    category: "Dark",
    description: "Dark navy, cool gray, and soft blue accents.",
    dots: ["#0f141c", "#8ea7c8", "#eef3f8"],
  },
  {
    id: "classic-light",
    name: "Classic Light",
    category: "Light",
    description: "Warm cream, soft parchment, and muted gold.",
    dots: ["#f7f2e9", "#9f7a32", "#261f15"],
  },
  {
    id: "forest-light",
    name: "Forest Light",
    category: "Light",
    description: "Soft sage, natural cream, and deep green text.",
    dots: ["#eff5ec", "#5f7f55", "#172316"],
  },
  {
    id: "slate-light",
    name: "Slate Light",
    category: "Light",
    description: "Cool white, pale blue-gray, and slate accents.",
    dots: ["#edf3f8", "#55749c", "#121a24"],
  },
  {
    id: "july-fourth",
    name: "Fourth of July",
    category: "Special",
    description: "Deep navy, soft white, and muted firework red.",
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
  const specialThemes = themes.filter(
    (theme) => theme.category === "Special"
  );

  return (
    <section className="grid gap-4">
      <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
        <div className="liquid-content">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
                  Current Theme
                </p>
              </div>

              <p className="text-sm leading-6 text-stone-400">
                This is the theme currently active on this device.
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/10 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">
              Active
            </span>
          </div>

          <div className="rounded-[1.35rem] border border-[#f5f0e8]/10 bg-[#11100d]/20 px-3 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#f5f0e8]">
                  {activeTheme.name}
                </p>

                <p className="mt-1 text-sm leading-5 text-stone-400">
                  {activeTheme.description}
                </p>
              </div>

              <ThemeDots dots={activeTheme.dots} />
            </div>
          </div>
        </div>
      </section>

      <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
        <div className="liquid-content grid gap-5">
          <ThemeGroup
            title="Dark Themes"
            description="Richer app-style themes for low-light use."
            themes={darkThemes}
            selectedTheme={selectedTheme}
            onChooseTheme={chooseTheme}
          />

          <ThemeGroup
            title="Light Themes"
            description="Cleaner brighter themes for daytime use."
            themes={lightThemes}
            selectedTheme={selectedTheme}
            onChooseTheme={chooseTheme}
          />

          <ThemeGroup
            title="Special Themes"
            description="Limited and seasonal themes for a little extra personality."
            themes={specialThemes}
            selectedTheme={selectedTheme}
            onChooseTheme={chooseTheme}
          />
        </div>
      </section>
    </section>
  );
}

function ThemeGroup({
  title,
  description,
  themes,
  selectedTheme,
  onChooseTheme,
}: {
  title: string;
  description: string;
  themes: {
    id: ThemeId;
    name: string;
    category: ThemeCategory;
    description: string;
    dots: string[];
  }[];
  selectedTheme: ThemeId;
  onChooseTheme: (themeId: ThemeId) => void;
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-stone-400">{description}</p>
      </div>

      <div className="grid gap-1">
        {themes.map((theme) => {
          const active = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChooseTheme(theme.id)}
              className={`group flex items-center justify-between gap-4 rounded-[1.35rem] border px-3 py-3 text-left transition ${
                active
                  ? "border-[#c7ad75]/30 bg-[#c7ad75]/12"
                  : "border-transparent hover:border-[#c7ad75]/20 hover:bg-[#c7ad75]/8"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
                    active
                      ? "border-[#c7ad75]/35 bg-[#c7ad75]/12 text-[#c7ad75]"
                      : "border-[#f5f0e8]/10 bg-[#11100d]/20 text-stone-500 group-hover:text-[#c7ad75]"
                  }`}
                >
                  {active ? <CheckIcon /> : <ThemeIcon />}
                </div>

                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#f5f0e8]">
                    {theme.name}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-stone-400">
                    {theme.description}
                  </p>
                </div>
              </div>

              <ThemeDots dots={theme.dots} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemeDots({ dots }: { dots: string[] }) {
  return (
    <div className="flex shrink-0 gap-1.5">
      {dots.map((dot) => (
        <span
          key={dot}
          className="h-4 w-4 rounded-full border border-white/15 shadow-sm"
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
        d="M12 4a8 8 0 1 0 8 8 4 4 0 0 1-4-4 4 4 0 0 1-4-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}