import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NAVIDROME_URL;
    const username = process.env.NAVIDROME_USER;
    const password = process.env.NAVIDROME_PASSWORD;

    if (!baseUrl || !username || !password) {
      return NextResponse.json(
        { error: "Missing Navidrome configuration" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      u: username,
      p: password,
      v: "1.16.1",
      c: "navidrome-ui",
      f: "json",
      type: "music",
      size: "5000",
      offset: "0",
    });

    const response = await fetch(
      `${baseUrl}/rest/search3.view?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Navidrome request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Songs API error:", error);

    return NextResponse.json(
      { error: "Failed to load songs" },
      { status: 500 }
    );
  }
}