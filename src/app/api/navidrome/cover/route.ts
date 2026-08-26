import { NextRequest } from "next/server";
import crypto from "crypto";
import { getNavidromeConfig } from "@/lib/auth";

function md5(value: string) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const coverArt = request.nextUrl.searchParams.get("id");

    if (!coverArt) {
      return new Response("Missing cover ID", {
        status: 400,
      });
    }

    const { baseUrl, username, password } = await getNavidromeConfig();

    const salt = crypto
      .randomBytes(8)
      .toString("hex");

    const token = md5(
      password + salt
    );

    const url = new URL(
      `${baseUrl}/rest/getCoverArt.view`
    );

    url.searchParams.set(
      "id",
      coverArt
    );

    url.searchParams.set(
      "u",
      username
    );

    url.searchParams.set(
      "t",
      token
    );

    url.searchParams.set(
      "s",
      salt
    );

    url.searchParams.set(
      "v",
      "1.16.1"
    );

    url.searchParams.set(
      "c",
      "navidrome-ui"
    );

    const response = await fetch(
      url.toString(),
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return new Response(
        "Cover art unavailable",
        {
          status: response.status,
        }
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "image/jpeg";

    const buffer =
      await response.arrayBuffer();

    return new Response(
      buffer,
      {
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            "public, max-age=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      "Cover art error:",
      error
    );

    return new Response(
      "Failed to load cover art",
      {
        status: 500,
      }
    );
  }
}