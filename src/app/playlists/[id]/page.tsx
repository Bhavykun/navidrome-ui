"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ListPlus,
  Play,
  Plus,
} from "lucide-react";

import {
  Song,
  usePlayer,
} from "@/context/PlayerContext";

type Playlist = {
  id: string;
  name: string;
  songCount?: number;
  duration?: number;
  coverArt?: string;
  owner?: string;
  entry?: Song[];
};

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();

  const {
    playSong,
    addToQueue,
    playNext,
  } = usePlayer();

  const [playlist, setPlaylist] =
    useState<Playlist | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadPlaylist() {
      try {
        const response =
          await fetch(
            `/api/navidrome/playlist?id=${encodeURIComponent(
              String(params.id)
            )}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load playlist"
          );
        }

        const data =
          await response.json();

        const result =
          data[
            "subsonic-response"
          ]?.playlist;

        setPlaylist(
          result ?? null
        );
      } catch (error) {
        console.error(
          "Playlist loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadPlaylist();
    }
  }, [params.id]);

  function formatDuration(
    seconds: number
  ) {
    if (!seconds) {
      return "0:00";
    }

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${secs}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-500">
          Loading playlist...
        </p>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">

          <p className="text-xl">
            Playlist not found
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-4 rounded-lg bg-white px-4 py-2 text-black"
          >
            Go Back
          </button>

        </div>
      </main>
    );
  }

  const songs =
    playlist.entry ?? [];

  const firstSong =
    songs[0];

  return (
    <main className="min-h-screen bg-black pb-32 text-white">

      {/* Header */}

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="flex items-center gap-2 text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>

      </header>

      {/* Hero */}

      <section className="flex flex-col gap-8 p-6 md:flex-row md:items-end md:p-10">

        {/* Artwork */}

        <div className="h-56 w-56 shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-2xl">

          <img
            src={
              playlist.coverArt
                ? `/api/navidrome/cover?id=${encodeURIComponent(
                    playlist.coverArt
                  )}`
                : "/album-placeholder.jpg"
            }
            onError={(event) => {
              event.currentTarget.src =
                "/album-placeholder.jpg";
            }}
            alt={playlist.name}
            className="h-full w-full object-cover"
          />

        </div>

        <div>

          <p className="mb-2 text-sm uppercase tracking-widest text-zinc-500">
            Playlist
          </p>

          <h1 className="text-4xl font-bold md:text-6xl">
            {playlist.name}
          </h1>

          <p className="mt-4 text-sm text-zinc-500">
            {songs.length}{" "}
            {songs.length === 1
              ? "song"
              : "songs"}
          </p>

        </div>

      </section>

      {/* Controls */}

      <section className="px-6 md:px-10">

        <div className="mb-6 flex items-center gap-3">

          {/* Play */}

          <button
            type="button"
            disabled={!firstSong}
            onClick={() => {
              if (firstSong) {
                playSong(
                  firstSong,
                  songs
                );
              }
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-40"
            title="Play playlist"
          >
            <Play
              size={20}
              fill="currentColor"
            />
          </button>

          {/* Add playlist */}

          <button
            type="button"
            disabled={
              songs.length === 0
            }
            onClick={() =>
              addToQueue(songs)
            }
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <ListPlus size={17} />

            Add playlist to queue
          </button>

        </div>

        {/* Songs */}

        <div className="divide-y divide-white/5">

          {songs.map(
            (song, index) => (

              <div
                key={`${song.id}-${index}`}
                className="group flex items-center gap-4 rounded-lg px-4 py-3 transition hover:bg-white/5"
              >

                {/* Number */}

                <div className="w-8 text-center">

                  <span className="text-sm text-zinc-600 group-hover:hidden">
                    {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      playSong(
                        song,
                        songs
                      )
                    }
                    className="hidden group-hover:inline-flex"
                  >
                    <Play
                      size={16}
                      fill="currentColor"
                    />
                  </button>

                </div>

                {/* Song */}

                <button
                  type="button"
                  onClick={() =>
                    playSong(
                      song,
                      songs
                    )
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-medium">
                    {song.title}
                  </p>

                  <p className="truncate text-sm text-zinc-500">
                    {song.artist}
                  </p>
                </button>

                {/* Actions */}

                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">

                  <button
                    type="button"
                    onClick={() =>
                      playNext(song)
                    }
                    className="rounded-full p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
                    title="Play next"
                  >
                    <ListPlus
                      size={17}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      addToQueue(song)
                    }
                    className="rounded-full p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
                    title="Add to queue"
                  >
                    <Plus
                      size={18}
                    />
                  </button>

                </div>

                {/* Duration */}

                <span className="w-10 text-right text-sm text-zinc-500">
                  {formatDuration(
                    song.duration
                  )}
                </span>

              </div>
            )
          )}

        </div>

      </section>

    </main>
  );
}