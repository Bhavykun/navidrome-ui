"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ListMusic,
  Play,
  Search,
} from "lucide-react";

import { usePlayer } from "@/context/PlayerContext";

type Playlist = {
  id: string;
  name: string;
  songCount?: number;
  duration?: number;
  coverArt?: string;
  owner?: string;
  public?: boolean;
};

export default function PlaylistsPage() {
  const router = useRouter();

  const { playSong } = usePlayer();

  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const response = await fetch(
          "/api/navidrome/playlists",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load playlists"
          );
        }

        const data =
          await response.json();

        const list =
          data[
            "subsonic-response"
          ]?.playlists?.playlist ?? [];

        setPlaylists(list);
      } catch (error) {
        console.error(
          "Playlist loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlaylists();
  }, []);

  const filteredPlaylists =
    playlists.filter((playlist) =>
      playlist.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  function formatDuration(
    seconds?: number
  ) {
    if (!seconds) {
      return "0 min";
    }

    const minutes =
      Math.floor(seconds / 60);

    return `${minutes} min`;
  }

  async function playPlaylist(
    playlistId: string
  ) {
    try {
      const response = await fetch(
        `/api/navidrome/playlist?id=${encodeURIComponent(
          playlistId
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

      const songs =
        data[
          "subsonic-response"
        ]?.playlist?.entry ?? [];

      if (songs.length === 0) {
        return;
      }

      playSong(
        songs[0],
        songs
      );
    } catch (error) {
      console.error(
        "Playlist playback error:",
        error
      );
    }
  }

  return (
    <main className="min-h-screen bg-black pb-32 text-white">

      {/* Header */}

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-7xl">

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mb-5 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                Playlists
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                {filteredPlaylists.length}{" "}
                playlists
              </p>
            </div>

            <div className="relative w-full md:w-96">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search playlists..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
              />

            </div>
          </div>
        </div>
      </header>

      {/* Playlist grid */}

      <section className="mx-auto max-w-7xl p-6">

        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            Loading playlists...
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="py-20 text-center">

            <ListMusic
              size={48}
              className="mx-auto mb-4 text-zinc-700"
            />

            <p className="text-zinc-500">
              No playlists found
            </p>

          </div>
        ) : (

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

            {filteredPlaylists.map(
              (playlist) => (

                <div
                  key={playlist.id}
                  className="group min-w-0"
                >

                  {/* Artwork */}

                  <div
                    onClick={() =>
                      router.push(
                        `/playlists/${playlist.id}`
                      )
                    }
                    className="relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-zinc-900"
                  >

                    {playlist.coverArt ? (

                      <img
                        src={`/api/navidrome/cover?id=${encodeURIComponent(
                          playlist.coverArt
                        )}`}
                        alt={playlist.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center">

                        <ListMusic
                          size={70}
                          strokeWidth={1}
                          className="text-zinc-700"
                        />

                      </div>
                    )}

                    {/* Play button */}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        playPlaylist(
                          playlist.id
                        );
                      }}
                      className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105"
                      title="Play playlist"
                    >

                      <Play
                        size={18}
                        fill="currentColor"
                        className="ml-0.5"
                      />

                    </button>

                  </div>

                  {/* Playlist name */}

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/playlists/${playlist.id}`
                      )
                    }
                    className="mt-3 block w-full truncate text-left font-medium hover:underline"
                  >
                    {playlist.name}
                  </button>

                  {/* Playlist information */}

                  <p className="text-sm text-zinc-500">
                    {playlist.songCount ?? 0}{" "}
                    songs
                    {" · "}
                    {formatDuration(
                      playlist.duration
                    )}
                  </p>

                </div>
              )
            )}

          </div>
        )}

      </section>
    </main>
  );
}