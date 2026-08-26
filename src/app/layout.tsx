import type { Metadata } from "next";

import "./globals.css";

import { PlayerProvider } from "@/context/PlayerContext";
import Player from "@/components/Player";
import Sidebar from "@/components/Sidebar";

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
          <Sidebar />
          {children}

          <Player />

        </PlayerProvider>
      </body>
    </html>
  );
}