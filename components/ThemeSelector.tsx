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
    description: "Charcoal, gold, and warm cream.",
    dots: ["#11100d", "#c7ad75", "#f5f0e8"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "Dark",
    description: "Deep green and soft natural tones.",
    dots: ["#0f1712", "#8fae86", "#f2efe6"],
  },
  {
    id: "slate",
    name: "Slate",
    category: "Dark",
    description: "Dark navy with cool blue accents.",
    dots: ["#0f141c", "#8ea7c8", "#eef3f8"],
  },
  {
    id: "classic-light",
    name: "Classic Light",
    category: "Light",
    description: "Warm cream with muted gold.",
    dots: ["#f7f2e9", "#9f7a32", "#261f15"],
  },
  {
    id: "forest-light",
    name: "Forest Light",
    category: "Light",
    description: "Soft sage with deep green detail.",
    dots: ["#eff5ec", "#5f7f55", "#172316"],
  },
  {
    id: "slate-light",
    name: "Slate Light",
    category: "Light",
    description: "Cool white with slate accents.",
    dots: ["#edf3f8", "#55749c", "#121a24"],
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
  const specialThemes = themes.filter(
    (theme) => theme.category === "Special"
  );

  return (
    <section className="grid gap-4">
      <section className="liquid-glass motion-card motion-card-delay-1 rounded-[1.85rem] p-4">
        <div className="liquid-content">
          <div className="mb-4 flex items-center justify-between gap-4">
            <SectionTitle title="Active Theme" />

            <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/12 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">
              Active
            </span>
          </div>

          <div className="rounded-[1.35rem] border border-[#c7ad75]/22 bg-[#c7ad75]/10 p-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[#f5f0e8]">
                  {activeTheme.name}
                </p>

                <p className="mt-1 text-sm text-stone-400">
                  {activeTheme.description}
                </p>
              </div>

              <ThemePreview dots={activeTheme.dots} />
            </div>
          </div>
        </div>
      </section>

      <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.85rem] p-4">
        <div className="liquid-content grid gap-6">
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
  title: string;
  themes: ThemeOption[];
  selectedTheme: ThemeId;
  onChooseTheme: (themeId: ThemeId) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c7ad75]/80">
          {title}
        </p>

        <span className="text-xs font-semibold text-stone-500">
          {themes.length}
        </span>
      </div>

      <div className="grid gap-2">
        {themes.map((theme) => {
          const active = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChooseTheme(theme.id)}
              className={`pressable group rounded-[1.35rem] border p-3.5 text-left transition ${
                active
                  ? "border-[#c7ad75]/34 bg-[#c7ad75]/12 shadow-[inset_0_1px_0_rgba(245,240,232,0.08)]"
                  : "border-[#f5f0e8]/10 bg-[#11100d]/22 hover:border-[#c7ad75]/24 hover:bg-[#f5f0e8]/6"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                      active
                        ? "border-[#c7ad75]/38 bg-[#c7ad75]/14 text-[#c7ad75]"
                        : "border-[#f5f0e8]/10 bg-[#11100d]/25 text-stone-500 group-hover:text-[#c7ad75]"
                    }`}
                  >
                    {active ? <CheckIcon /> : <ThemeIcon />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-base font-semibold text-[#f5f0e8]">
                        {theme.name}
                      </p>

                      {active ? (
                        <span className="shrink-0 rounded-full border border-[#c7ad75]/25 bg-[#c7ad75]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7ad75]">
                          On
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 truncate text-sm text-stone-400">
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
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-2.5 rounded-full bg-[#c7ad75] shadow-[0_0_14px_rgba(199,173,117,0.25)]" />

      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
        {title}
      </h2>
    </div>
  );
}

function ThemePreview({ dots }: { dots: string[] }) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-full border border-[#f5f0e8]/10 bg-[#11100d]/25 p-1">
      {dots.map((dot) => (
        <span
          key={dot}
          className="-ml-1 first:ml-0 h-5 w-5 rounded-full border border-white/20 shadow-sm"
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