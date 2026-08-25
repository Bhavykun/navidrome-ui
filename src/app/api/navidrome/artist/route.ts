import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing artist ID" },
        { status: 400 }
      );
    }

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
      id,
      u: username,
      p: password,
      v: "1.16.1",
      c: "navidrome-ui",
      f: "json",
    });

    const response = await fetch(
      `${baseUrl}/rest/getArtist.view?${params.toString()}`,
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
    console.error("Artist API error:", error);

    return NextResponse.json(
      { error: "Failed to load artist" },
      { status: 500 }
    );
  }
}