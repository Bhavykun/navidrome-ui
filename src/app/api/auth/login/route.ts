import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baseUrl = typeof body?.baseUrl === "string" ? body.baseUrl.trim().replace(/\/$/, "") : "";
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!baseUrl || !username || !password) {
      return NextResponse.json({ error: "Server URL, username, and password are required" }, { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(baseUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid protocol");
    } catch {
      return NextResponse.json({ error: "Enter a valid HTTP or HTTPS Navidrome URL" }, { status: 400 });
    }

    const params = new URLSearchParams({ u: username, p: password, v: "1.16.1", c: "northstar", f: "json" });
    const response = await fetch(`${url.origin}${url.pathname.replace(/\/$/, "")}/rest/ping.view?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data?.["subsonic-response"]?.status !== "ok") {
      return NextResponse.json({ error: "Navidrome rejected these credentials" }, { status: 401 });
    }

    await setSession({ baseUrl, username, password });
    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sign in" }, { status: 500 });
  }
}
