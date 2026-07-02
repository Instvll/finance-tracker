"use client";

import { useEffect } from "react";

const themeStorageKey = "leftovr-theme";

export default function ThemeBoot() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey) || "classic";

    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return null;
}