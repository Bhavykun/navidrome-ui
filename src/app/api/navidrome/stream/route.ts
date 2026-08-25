import { NextRequest } from "next/server";
import crypto from "crypto";

function md5(value: string) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const songId = request.nextUrl.searchParams.get("id");

    if (!songId) {
      return new Response("Missing song ID", {
        status: 400,
      });
    }

    const baseUrl = process.env.NAVIDROME_URL;
    const username = process.env.NAVIDROME_USER;
    const password = process.env.NAVIDROME_PASSWORD;

    if (!baseUrl || !username || !password) {
      return new Response(
        "Missing Navidrome configuration",
        { status: 500 }
      );
    }

    const salt = crypto.randomBytes(8).toString("hex");
    const token = md5(password + salt);

    const params = new URLSearchParams({
      id: songId,
      u: username,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "navidrome-ui",
    });

    const upstream = await fetch(
      `${baseUrl}/rest/stream.view?${params.toString()}`,
      {
        headers: {
          Range:
            request.headers.get("range") || "bytes=0-",
        },
        cache: "no-store",
      }
    );

    if (!upstream.ok && upstream.status !== 206) {
      const text = await upstream.text();

      console.error(
        "Navidrome stream error:",
        upstream.status,
        text
      );

      return new Response(
        "Navidrome stream failed",
        {
          status: upstream.status,
        }
      );
    }

    const headers = new Headers();

    const contentType =
      upstream.headers.get("content-type");

    const contentLength =
      upstream.headers.get("content-length");

    const contentRange =
      upstream.headers.get("content-range");

    if (contentType) {
      headers.set(
        "Content-Type",
        contentType
      );
    }

    if (contentLength) {
      headers.set(
        "Content-Length",
        contentLength
      );
    }

    if (contentRange) {
      headers.set(
        "Content-Range",
        contentRange
      );
    }

    headers.set(
      "Accept-Ranges",
      "bytes"
    );

    return new Response(
      upstream.body,
      {
        status: upstream.status,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "Stream proxy error:",
      error
    );

    return new Response(
      "Streaming failed",
      {
        status: 500,
      }
    );
  }
}