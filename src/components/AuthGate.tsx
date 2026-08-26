"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (!data.authenticated) {
          router.replace("/login");
          return;
        }
        setAuthenticated(true);
        setChecked(true);
      })
      .catch(() => router.replace("/login"));

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (!checked || !authenticated) return <div className="min-h-screen bg-[#080a09]" />;
  return (
    <>
      <Sidebar />
      {children}
      <Player />
    </>
  );
}
