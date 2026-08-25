import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function md5(value: string) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing album ID" },
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

    const salt = crypto.randomBytes(8).toString("hex");
    const token = md5(password + salt);

    const params = new URLSearchParams({
      id,
      u: username,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "navidrome-ui",
      f: "json",
    });

    const response = await fetch(
      `${baseUrl}/rest/getAlbum.view?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Album API error:", error);

    return NextResponse.json(
      { error: "Failed to load album" },
      { status: 500 }
    );
  }
}