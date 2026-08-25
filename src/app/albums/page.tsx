"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Search,
} from "lucide-react";

type Album = {
    id: string;
    name: string;
    artist: string;
    artistId?: string;
    coverArt?: string;
    year?: number;
    songCount?: number;
};

export default function AlbumsPage() {
    const router = useRouter();

    const [albums, setAlbums] = useState<Album[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAlbums() {
            try {
                const response = await fetch(
                    "/api/navidrome/albums",
                    {
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load albums"
                    );
                }

                const data = await response.json();

                const albumList =
                    data[
                        "subsonic-response"
                    ]?.albumList2?.album ?? [];

                setAlbums(albumList);
            } catch (error) {
                console.error(
                    "Failed to load albums:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        loadAlbums();
    }, []);

    const filteredAlbums = albums.filter(
        (album) => {
            const query =
                search.toLowerCase().trim();

            if (!query) {
                return true;
            }

            return (
                album.name
                    ?.toLowerCase()
                    .includes(query) ||
                album.artist
                    ?.toLowerCase()
                    .includes(query)
            );
        }
    );

    return (
        <main className="min-h-screen bg-black pb-32 text-white">

            {/* Header */}

            <header className="sticky top-0 z-10 border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur">
                <div className="mx-auto max-w-7xl">

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-5 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
                    >
                        <ArrowLeft size={17} />
                        Back
                    </button>

                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                        <div>
                            <h1 className="text-3xl font-bold">
                                Albums
                            </h1>

                            <p className="mt-1 text-sm text-zinc-500">
                                {filteredAlbums.length} albums
                            </p>
                        </div>

                        <div className="relative w-full md:w-96">

                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search albums..."
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
                            />

                        </div>

                    </div>
                </div>
            </header>

            {/* Albums */}

            <section className="mx-auto max-w-7xl p-6">

                {loading ? (

                    <div className="py-20 text-center text-zinc-500">
                        Loading albums...
                    </div>

                ) : filteredAlbums.length === 0 ? (

                    <div className="py-20 text-center text-zinc-500">
                        No albums found.
                    </div>

                ) : (

                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

                        {filteredAlbums.map((album) => (

                            <div
                                key={album.id}
                                className="group min-w-0"
                            >

                                {/* Cover */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/album/${album.id}`
                                        )
                                    }
                                    className="block aspect-square w-full overflow-hidden rounded-xl bg-zinc-900"
                                >

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

                                        <div className="flex h-full items-center justify-center text-6xl text-zinc-700">
                                            ♪
                                        </div>

                                    )}

                                </button>

                                {/* Album name */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/album/${album.id}`
                                        )
                                    }
                                    className="mt-3 block w-full truncate text-left font-medium hover:underline"
                                >
                                    {album.name}
                                </button>

                                {/* Artist */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (album.artistId) {
                                            router.push(
                                                `/artist/${album.artistId}`
                                            );
                                        }
                                    }}
                                    className="block max-w-full truncate text-left text-sm text-zinc-500 hover:text-white"
                                >
                                    {album.artist}
                                </button>

                                {album.year && (
                                    <p className="text-xs text-zinc-600">
                                        {album.year}
                                    </p>
                                )}

                            </div>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}