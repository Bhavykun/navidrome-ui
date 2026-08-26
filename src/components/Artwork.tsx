"use client";

import { Disc3, Mic2 } from "lucide-react";

export type ArtworkShape = "square" | "circle";

function artworkUrl(coverArt?: string) {
  if (!coverArt) {
    return null;
  }

  return `/api/navidrome/cover?id=${encodeURIComponent(coverArt)}`;
}

export default function Artwork({
  alt,
  coverArt,
  className = "",
  shape = "square",
  artist = false,
}: {
  alt: string;
  coverArt?: string;
  className?: string;
  shape?: ArtworkShape;
  artist?: boolean;
}) {
  const source = artist && coverArt?.startsWith("http")
    ? coverArt
    : artworkUrl(coverArt);
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-md";

  return (
    <div className={`overflow-hidden bg-[#151916] ${shapeClass} ${className}`}>
      {source ? (
        <img
          src={source}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-700">
          {artist ? <Mic2 size="32%" strokeWidth={1.4} /> : <Disc3 size="32%" strokeWidth={1.4} />}
        </div>
      )}
    </div>
  );
}
