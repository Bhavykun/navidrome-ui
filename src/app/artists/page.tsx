"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Search,
} from "lucide-react";

type Artist = {
    id: string;
    name: string;
    artistImageUrl?: string;
    albumCount?: number;
};

export default function ArtistsPage() {
    const router = useRouter();

    const [artists, setArtists] = useState<Artist[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadArtists() {
            try {
                const response = await fetch(
                    "/api/navidrome/artists",
                    {
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load artists"
                    );
                }

                const data = await response.json();

                const groups =
                    data[
                        "subsonic-response"
                    ]?.artists?.index ?? [];

                const allArtists: Artist[] =
                    groups.flatMap(
                        (group: {
                            artist?: Artist[];
                        }) => group.artist ?? []
                    );

                setArtists(allArtists);
            } catch (error) {
                console.error(
                    "Failed to load artists:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        loadArtists();
    }, []);

    const filteredArtists = artists.filter(
        (artist) =>
            artist.name
                .toLowerCase()
                .includes(search.toLowerCase().trim())
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
                                Artists
                            </h1>

                            <p className="mt-1 text-sm text-zinc-500">
                                {filteredArtists.length} artists
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
                                placeholder="Search artists..."
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
                            />

                        </div>

                    </div>
                </div>
            </header>

            {/* Artists */}

            <section className="mx-auto max-w-7xl p-6">

                {loading ? (

                    <div className="py-20 text-center text-zinc-500">
                        Loading artists...
                    </div>

                ) : filteredArtists.length === 0 ? (

                    <div className="py-20 text-center text-zinc-500">
                        No artists found.
                    </div>

                ) : (

                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

                        {filteredArtists.map((artist) => (

                            <div
                                key={artist.id}
                                className="group min-w-0 rounded-xl p-3 transition hover:bg-white/5"
                            >

                                {/* Artist image */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/artist/${artist.id}`
                                        )
                                    }
                                    className="block aspect-square w-full overflow-hidden rounded-full bg-zinc-900"
                                >

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

                                        <div className="flex h-full items-center justify-center text-6xl text-zinc-700">
                                            ♪
                                        </div>

                                    )}

                                </button>

                                {/* Artist name */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/artist/${artist.id}`
                                        )
                                    }
                                    className="mt-3 block w-full truncate text-center font-medium hover:underline"
                                >
                                    {artist.name}
                                </button>

                                <p className="text-center text-sm text-zinc-500">
                                    {artist.albumCount ?? 0}{" "}
                                    {(artist.albumCount ?? 0) === 1
                                        ? "album"
                                        : "albums"}
                                </p>

                            </div>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}