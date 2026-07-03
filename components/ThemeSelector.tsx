"use client";

import { useEffect, useState } from "react";

type ThemeId =
  | "classic"
  | "forest"
  | "slate"
  | "classic-light"
  | "forest-light"
  | "slate-light";

const themeStorageKey = "leftovr-theme";

const themes: {
  id: ThemeId;
  name: string;
  mode: "Dark" | "Light";
  description: string;
  dots: string[];
}[] = [
  {
    id: "classic",
    name: "leftovr Classic",
    mode: "Dark",
    description: "Dark charcoal, muted gold, and warm cream.",
    dots: ["#11100d", "#c7ad75", "#f5f0e8"],
  },
  {
    id: "forest",
    name: "Forest",
    mode: "Dark",
    description: "Deep green, sage, and soft natural tones.",
    dots: ["#0f1712", "#8fae86", "#f2efe6"],
  },
  {
    id: "slate",
    name: "Slate",
    mode: "Dark",
    description: "Dark navy, cool gray, and soft blue accents.",
    dots: ["#0f141c", "#8ea7c8", "#eef3f8"],
  },
  {
    id: "classic-light",
    name: "Classic Light",
    mode: "Light",
    description: "Warm cream, soft parchment, and muted gold.",
    dots: ["#f7f2e9", "#9f7a32", "#261f15"],
  },
  {
    id: "forest-light",
    name: "Forest Light",
    mode: "Light",
    description: "Soft sage, natural cream, and deep green text.",
    dots: ["#eff5ec", "#5f7f55", "#172316"],
  },
  {
    id: "slate-light",
    name: "Slate Light",
    mode: "Light",
    description: "Cool white, pale blue-gray, and slate accents.",
    dots: ["#edf3f8", "#55749c", "#121a24"],
  },
];

export default function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("classic");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme =
      (window.localStorage.getItem(themeStorageKey) as ThemeId | null) ||
      "classic";

    setSelectedTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  function chooseTheme(themeId: ThemeId) {
    setSelectedTheme(themeId);
    window.localStorage.setItem(themeStorageKey, themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  }

  const activeTheme =
    themes.find((theme) => theme.id === selectedTheme) || themes[0];

  const darkThemes = themes.filter((theme) => theme.mode === "Dark");
  const lightThemes = themes.filter((theme) => theme.mode === "Light");

  return (
    <section className="liquid-glass motion-card motion-card-delay-2 rounded-[1.65rem] p-5">
      <div className="liquid-content">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#c7ad75]/25 bg-[#c7ad75]/12 text-[#c7ad75]">
              <AppearanceIcon />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-semibold text-[#f5f0e8]">
                Appearance
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-400">
                Choose the visual theme for this device.
              </p>

              <p className="mt-2 truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#c7ad75]/70">
                {activeTheme.name}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-[#c7ad75]/30 bg-[#c7ad75]/8 px-3 py-1 text-xs font-semibold text-[#f5f0e8] transition hover:bg-[#c7ad75]/14">
            {isOpen ? "Hide" : "View"}
          </span>
        </button>

        {isOpen && (
          <div className="mt-5 border-t border-[#f5f0e8]/10 pt-5">
            <ThemeGroup
              title="Dark Themes"
              themes={darkThemes}
              selectedTheme={selectedTheme}
              onChooseTheme={chooseTheme}
            />

            <div className="mt-5">
              <ThemeGroup
                title="Light Themes"
                themes={lightThemes}
                selectedTheme={selectedTheme}
                onChooseTheme={chooseTheme}
              />
            </div>
          </div>
        )}
      </div>
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
  themes: {
    id: ThemeId;
    name: string;
    mode: "Dark" | "Light";
    description: string;
    dots: string[];
  }[];
  selectedTheme: ThemeId;
  onChooseTheme: (themeId: ThemeId) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#c7ad75]/75">
        {title}
      </p>

      <div className="grid gap-3">
        {themes.map((theme) => {
          const active = selectedTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChooseTheme(theme.id)}
              className={`rounded-[1.25rem] border p-4 text-left transition ${
                active
                  ? "border-[#c7ad75]/35 bg-[#c7ad75]/14"
                  : "border-[#f5f0e8]/10 bg-[#11100d]/35 hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-[#f5f0e8]">{theme.name}</p>

                  <p className="mt-1 text-sm leading-6 text-stone-400">
                    {theme.description}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  {theme.dots.map((dot) => (
                    <span
                      key={dot}
                      className="h-4 w-4 rounded-full border border-white/15"
                      style={{ backgroundColor: dot }}
                    />
                  ))}
                </div>
              </div>

              {active && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c7ad75]/80">
                  Active
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppearanceIcon() {
  return (
    <svg
      className="h-5 w-5"
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