import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGate from "../components/AuthGate";
import ThemeBoot from "../components/ThemeBoot";

export const metadata: Metadata = {
  title: "leftovr",
  description: "A simple personal finance tracker.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "leftovr",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#11100d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeBoot />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}