import type { Metadata } from "next";

import "./globals.css";

import { PlayerProvider } from "@/context/PlayerContext";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Northstar",
  description: "Your personal Navidrome music library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <AuthGate>{children}</AuthGate>
        </PlayerProvider>
      </body>
    </html>
  );
}