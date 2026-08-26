"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
} from "lucide-react";

import { usePlayer } from "@/context/PlayerContext";

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt?: string;
};

type Album = {
  id: string;
  name: string;
  artist: string;
  year?: number;
  coverArt?: string;
  songCount?: number;
};

type Artist = {
  id: string;
  name: string;
  coverArt?: string;
  artistImageUrl?: string;
  albumCount?: number;
  album?: Album[];
};

function formatDuration(seconds: number) {
  if (!seconds) {
    return "0:00";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  const secs = Math.floor(
    seconds % 60
  )
    .toString()
    .padStart(2, "0");

  return `${minutes}:${secs}`;
}

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();

  const { playSong } = usePlayer();

  const [artist, setArtist] =
    useState<Artist | null>(null);

  const [songs, setSongs] =
    useState<Song[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadArtist() {
      try {
        const response = await fetch(
          `/api/navidrome/artist?id=${params.id}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load artist"
          );
        }

        const data =
          await response.json();

        const result =
          data[
            "subsonic-response"
          ]?.artist;

        setArtist(result);

        /*
         * Navidrome's getArtist response
         * can contain albums, but not
         * necessarily all songs.
         *
         * We'll load songs from the
         * albums separately through
         * the existing album API.
         */
        const albums =
          result?.album ?? [];

        const songResults: Song[] = [];

        for (const album of albums) {
          try {
            const albumResponse =
              await fetch(
                `/api/navidrome/album?id=${album.id}`,
                {
                  cache: "no-store",
                }
              );

            if (!albumResponse.ok) {
              continue;
            }

            const albumData =
              await albumResponse.json();

            const albumSongs =
              albumData[
                "subsonic-response"
              ]?.album?.song ?? [];

            songResults.push(
              ...albumSongs
            );
          } catch {
            // Ignore an individual
            // album failure.
          }
        }

        setSongs(songResults);
      } catch (error) {
        console.error(
          "Artist loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadArtist();
    }
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-500">
          Loading artist...
        </p>
      </main>
    );
  }

  if (!artist) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl">
            Artist not found
          </p>

          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-black"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const albums =
    artist.album ?? [];

  return (
    <main className="min-h-screen bg-black pb-32 text-white md:ml-64">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>
      </header>

      {/* Artist hero */}
      <section className="flex flex-col items-center gap-8 px-6 py-10 md:flex-row md:items-end md:px-10">
        <div className="h-56 w-56 shrink-0 overflow-hidden rounded-full bg-zinc-900 shadow-2xl">
          {artist.artistImageUrl ? (
            <img
              src={artist.artistImageUrl}
              alt={artist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl text-zinc-700">
              ♪
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm uppercase tracking-widest text-zinc-500">
            Artist
          </p>

          <h1 className="text-4xl font-bold md:text-6xl">
            {artist.name}
          </h1>

          <p className="mt-4 text-sm text-zinc-500">
            {albums.length}{" "}
            {albums.length === 1
              ? "album"
              : "albums"}
            {" · "}
            {songs.length} songs
          </p>

          {songs.length > 0 && (
            <button
              onClick={() =>
                playSong(
                  songs[0],
                  songs
                )
              }
              className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
            >
              <Play
                size={20}
                fill="currentColor"
              />
            </button>
          )}
        </div>
      </section>

      {/* Albums */}
      <section className="px-6 md:px-10">
        <h2 className="mb-5 text-2xl font-semibold">
          Albums
        </h2>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() =>
                router.push(
                  `/album/${album.id}`
                )
              }
              className="group min-w-0 text-left"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
                {album.coverArt ? (
                  <img
                    src={`/api/navidrome/cover?id=${encodeURIComponent(
                      album.coverArt
                    )}`}
                    alt={album.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl text-zinc-700">
                    ♪
                  </div>
                )}
              </div>

              <p className="mt-3 truncate font-medium">
                {album.name}
              </p>

              <p className="text-sm text-zinc-500">
                {album.year ?? ""}
                {album.songCount
                  ? ` · ${album.songCount} songs`
                  : ""}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Songs */}
      <section className="mt-12 px-6 md:px-10">
        <h2 className="mb-5 text-2xl font-semibold">
          Songs
        </h2>

        <div className="divide-y divide-white/5">
          {songs.map(
            (song, index) => (
              <button
                key={song.id}
                onClick={() =>
                  playSong(
                    song,
                    songs
                  )
                }
                className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition hover:bg-white/5"
              >
                <span className="w-8 text-center text-sm text-zinc-600 group-hover:text-white">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {song.title}
                  </p>

                  <p className="truncate text-sm text-zinc-500">
                    {song.album}
                  </p>
                </div>

                <span className="text-sm text-zinc-500">
                  {formatDuration(
                    song.duration
                  )}
                </span>
              </button>
            )
          )}
        </div>
      </section>
    </main>
  );
}