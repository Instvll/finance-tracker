import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./themes.css";
import AuthGate from "@/components/AuthGate";
import BottomTabBar from "@/components/BottomTabBar";
import FinanceUpdateChecker from "@/components/FinanceUpdateChecker";
import UpdateAnnouncements from "@/components/UpdateAnnouncements";
import WelcomeScreen from "@/components/WelcomeScreen";

export const metadata: Metadata = {
  title: "leftovr",
  description: "A simple personal finance tracker.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const themeScript = `
(function () {
  try {
    var themeStorageKey = "leftovr-theme";
    var allowedThemes = [
      "classic",
      "mocha",
      "forest",
      "slate",
      "rose-gold",
      "classic-light",
      "mocha-light",
      "forest-light",
      "slate-light",
      "rose-gold-light",
      "july-fourth"
    ];

    var savedTheme = window.localStorage.getItem(themeStorageKey);

    if (!savedTheme || allowedThemes.indexOf(savedTheme) === -1) {
      savedTheme = "classic";
      window.localStorage.setItem(themeStorageKey, savedTheme);
    }

    document.documentElement.setAttribute("data-theme", savedTheme);
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "classic");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body>
        <AuthGate>
          <FinanceUpdateChecker />
          {children}
          <BottomTabBar />
          <WelcomeScreen />
          <UpdateAnnouncements />
        </AuthGate>
      </body>
    </html>
  );
}