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
    const { baseUrl, username, password } = await getNavidromeConfig();

    const salt = crypto.randomBytes(8).toString("hex");
    const token = md5(password + salt);

    const params = new URLSearchParams({
      u: username,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "navidrome-ui",
      f: "json",
      type: "newest",
      size: "50",
    });

    const response = await fetch(
      `${baseUrl}/rest/getAlbumList2.view?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log(
      "NAVIDROME ALBUM RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load albums",
      },
      {
        status: 500,
      }
    );
  }
}