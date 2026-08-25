"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Artist = {
  id: string;
  name: string;
  artistImageUrl?: string;
  albumCount: number;
};

type Album = {
  id: string;
  name: string;
  artist: string;
  coverArt?: string;
  year?: number;
  songCount?: number;
};

export default function Home() {
  const router = useRouter();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMusic() {
      try {
        const [
          artistsResponse,
          albumsResponse,
        ] = await Promise.all([
          fetch("/api/navidrome/artists"),
          fetch("/api/navidrome/albums"),
        ]);

        const artistsData =
          await artistsResponse.json();

        const albumsData =
          await albumsResponse.json();

        const artistGroups =
          artistsData[
            "subsonic-response"
          ]?.artists?.index ?? [];

        const allArtists =
          artistGroups.flatMap(
            (group: {
              artist: Artist[];
            }) => group.artist
          );

        const albumList =
          albumsData[
            "subsonic-response"
          ]?.albumList2?.album ?? [];

        setArtists(allArtists);
        setAlbums(albumList);
      } catch (error) {
        console.error(
          "Failed to load music:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadMusic();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 border-r border-white/10 bg-zinc-950 p-6 md:block">
        <h1 className="mb-10 text-2xl font-bold">
          🎵 My Music
        </h1>

        <nav className="space-y-2">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="block w-full rounded-lg px-4 py-3 text-left text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            🏠 Home
          </button>

          <button
            type="button"
            onClick={() => router.push("/songs")}
            className="block w-full rounded-lg px-4 py-3 text-left text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            🎵 Songs
          </button>

          <button
            type="button"
            onClick={() => router.push("/albums")}
            className="block w-full rounded-lg px-4 py-3 text-left text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            💿 Albums
          </button>

          <button
            type="button"
            onClick={() => router.push("/artists")}
            className="block w-full rounded-lg px-4 py-3 text-left text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            👤 Artists
          </button>

          <button
            type="button"
            onClick={() => router.push("/playlists")}
            className="block w-full rounded-lg px-4 py-3 text-left text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            📋 Playlists
          </button>

        </nav>
      </aside>

      {/* Main content */}
      <section className="pb-28 md:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Your Music
            </h2>

            <button className="rounded-full bg-white/10 px-5 py-2 text-sm text-zinc-300 transition hover:bg-white/20">
              🔍 Search
            </button>
          </div>
        </header>

        <div className="space-y-12 p-6">
          {loading ? (
            <p className="text-zinc-500">
              Loading your music...
            </p>
          ) : (
            <>
              {/* Recently Added */}
              <section>
                <h3 className="mb-5 text-xl font-semibold">
                  Recently Added
                </h3>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="group cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/album/${album.id}`
                        )
                      }
                    >
                      {/* Artwork */}
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                        {album.coverArt ? (
                          <img
                            src={
                              album.coverArt
                                ? `/api/navidrome/cover?id=${encodeURIComponent(
                                  album.coverArt
                                )}`
                                : "/album-placeholder.jpg"
                            }
                            alt={album.name}
                            onError={(e) => {
                              e.currentTarget.src =
                                "/album-placeholder.jpg";
                            }}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">
                            💿
                          </div>
                        )}

                        {/* Play button */}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();

                            router.push(
                              `/album/${album.id}`
                            );
                          }}
                          className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100"
                        >
                          ▶
                        </button>
                      </div>

                      {/* Album info */}
                      <h4 className="mt-3 truncate font-medium">
                        {album.name}
                      </h4>

                      <p className="truncate text-sm text-zinc-500">
                        {album.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Artists */}
              <section>
                <h3 className="mb-5 text-xl font-semibold">
                  Artists
                </h3>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {artists.map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() =>
                        router.push(
                          `/artist/${artist.id}`
                        )
                      }
                      className="group cursor-pointer rounded-xl p-3 text-left transition hover:bg-zinc-900"
                    >
                      <div className="aspect-square overflow-hidden rounded-full bg-zinc-900">
                        {artist.artistImageUrl ? (
                          <img
                            src={
                              artist.artistImageUrl ||
                              "/artist-placeholder.jpg"
                            }
                            alt={artist.name}
                            onError={(e) => {
                              e.currentTarget.src =
                                "/artist-placeholder.jpg";
                            }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">
                            🎤
                          </div>
                        )}
                      </div>

                      <h4 className="mt-3 truncate text-center font-medium">
                        {artist.name}
                      </h4>

                      <p className="text-center text-sm text-zinc-500">
                        {artist.albumCount}{" "}
                        {artist.albumCount === 1
                          ? "album"
                          : "albums"}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}