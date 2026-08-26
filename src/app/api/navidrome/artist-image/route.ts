import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return new Response("Missing artist image URL", { status: 400 });
  }

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
    if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
      return new Response("Unsupported image URL", { status: 400 });
    }
  } catch {
    return new Response("Invalid artist image URL", { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      cache: "force-cache",
      next: { revalidate: 86400 },
    });

    if (!response.ok || !response.body) {
      return new Response("Artist image unavailable", { status: response.status || 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    return new Response(response.body, { headers });
  } catch (error) {
    console.error("Artist image proxy error:", error);
    return new Response("Failed to load artist image", { status: 502 });
  }
}
