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
    const songId = request.nextUrl.searchParams.get("id");
    const quality = request.nextUrl.searchParams.get("quality") || "balanced";

    if (!songId) {
      return new Response("Missing song ID", {
        status: 400,
      });
    }

    const { baseUrl, username, password } = await getNavidromeConfig();

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

    const bitrateByQuality: Record<string, string> = {
      "data-saver": "96",
      balanced: "160",
      high: "320",
    };
    const maxBitRate = bitrateByQuality[quality];

    if (maxBitRate) {
      params.set("maxBitRate", maxBitRate);
      params.set("format", "mp3");
    }

    const range = request.headers.get("range") || "bytes=0-";
    const fetchStream = () => {
      const headers: HeadersInit = params.has("maxBitRate")
        ? {}
        : { Range: range };

      return fetch(
        `${baseUrl}/rest/stream.view?${params.toString()}`,
        { headers, cache: "no-store" }
      );
    };

    let upstream = await fetchStream();
    const firstContentType = upstream.headers.get("content-type") || "";
    const transcodeFailed = !upstream.ok && upstream.status !== 206;
    const returnedErrorDocument = firstContentType.includes("xml") || firstContentType.includes("json");

    if (maxBitRate && (transcodeFailed || returnedErrorDocument)) {
      await upstream.arrayBuffer();
      params.delete("maxBitRate");
      params.delete("format");
      upstream = await fetchStream();
    }

    const finalContentType = upstream.headers.get("content-type") || "";

    if ((!upstream.ok && upstream.status !== 206) || finalContentType.includes("xml") || finalContentType.includes("json")) {
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

    if (params.has("maxBitRate")) {
      headers.delete("Content-Range");
      headers.delete("Content-Length");
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