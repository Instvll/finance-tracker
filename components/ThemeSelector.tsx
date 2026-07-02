"use client";

import { useEffect, useState } from "react";

type ThemeId = "classic" | "forest" | "slate";

const themeStorageKey = "leftovr-theme";

const themes: {
  id: ThemeId;
  name: string;
  description: string;
  dots: string[];
}[] = [
  {
    id: "classic",
    name: "leftovr Classic",
    description: "Dark charcoal, muted gold, and warm cream.",
    dots: ["#11100d", "#c7ad75", "#f5f0e8"],
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green, sage, and soft natural tones.",
    dots: ["#0f1712", "#8fae86", "#f2efe6"],
  },
  {
    id: "slate",
    name: "Slate",
    description: "Dark navy, cool gray, and soft blue accents.",
    dots: ["#0f141c", "#8ea7c8", "#eef3f8"],
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

  return (
    <section className="rounded-[1.5rem] border border-[#f5f0e8]/12 bg-[#1d1b17] p-5 shadow-xl shadow-black/15">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#c7ad75]" />

            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f5f0e8]">
              Appearance
            </h2>
          </div>

          <p className="text-sm leading-6 text-stone-400">
            Current theme:{" "}
            <span className="font-semibold text-[#f5f0e8]">
              {activeTheme.name}
            </span>
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[#f5f0e8]/10 px-3 py-1 text-xs font-semibold text-stone-300 transition hover:border-[#c7ad75]/30 hover:bg-[#c7ad75]/10 hover:text-[#f5f0e8]">
          {isOpen ? "Hide" : "View"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-5 border-t border-[#f5f0e8]/10 pt-5">
          <p className="mb-4 text-sm leading-6 text-stone-400">
            Choose how leftovr looks on this device.
          </p>

          <div className="grid gap-3">
            {themes.map((theme) => {
              const active = selectedTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => chooseTheme(theme.id)}
                  className={`rounded-[1.25rem] border p-4 text-left transition ${
                    active
                      ? "border-[#c7ad75]/35 bg-[#c7ad75]/14"
                      : "border-[#f5f0e8]/10 bg-[#25231e] hover:border-[#c7ad75]/25 hover:bg-[#c7ad75]/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#f5f0e8]">
                        {theme.name}
                      </p>

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
      )}
    </section>
  );
}