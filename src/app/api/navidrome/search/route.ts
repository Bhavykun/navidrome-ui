import { NextRequest, NextResponse } from "next/server";
import { getNavidromeConfig } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({
      "subsonic-response": {
        status: "ok",
        searchResult3: { song: [], album: [], artist: [] },
      },
    });
  }

  try {
    const { baseUrl, username, password } = await getNavidromeConfig();
    const params = new URLSearchParams({
      u: username,
      p: password,
      v: "1.16.1",
      c: "northstar",
      f: "json",
      query,
      songCount: "30",
      albumCount: "12",
      artistCount: "12",
    });

    const response = await fetch(
      `${baseUrl}/rest/search3.view?${params.toString()}`,
      { cache: "no-store" }
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Navidrome search failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search Navidrome" },
      { status: 500 }
    );
  }
}
