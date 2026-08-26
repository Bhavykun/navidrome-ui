import { NextResponse } from "next/server";
import crypto from "crypto";
import { getNavidromeConfig } from "@/lib/auth";

function md5(value: string) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

export async function GET() {
  try {
    const { baseUrl: url, username, password } = await getNavidromeConfig();

    const salt = crypto.randomBytes(8).toString("hex");
    const token = md5(password + salt);

    const params = new URLSearchParams({
      u: username,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "navidrome-ui",
      f: "json",
    });

    const response = await fetch(
      `${url}/rest/getArtists.view?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Navidrome returned HTTP ${response.status}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Navidrome error:", error);

    return NextResponse.json(
      {
        error: "Failed to connect to Navidrome",
      },
      { status: 500 }
    );
  }
}