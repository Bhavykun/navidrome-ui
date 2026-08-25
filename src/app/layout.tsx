import type { Metadata } from "next";

import "./globals.css";

import { PlayerProvider } from "@/context/PlayerContext";
import Player from "@/components/Player";

export const metadata: Metadata = {
  title: "My Music",
  description: "My personal music library",
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
          {children}

          <Player />

        </PlayerProvider>
      </body>
    </html>
  );
}