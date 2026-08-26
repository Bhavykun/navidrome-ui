"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ListPlus,
    MoreHorizontal,
    Plus,
    Search,
    X,
} from "lucide-react";

import Artwork from "@/components/Artwork";

type Album = {
    id: string;
    name: string;
    artist: string;
    artistId?: string;
    coverArt?: string;
    year?: number;
    songCount?: number;
};

type Playlist = {
    id: string;
    name: string;
    readonly?: boolean | string;
};

export default function AlbumsPage() {
    const router = useRouter();

    const [albums, setAlbums] = useState<Album[]>([]);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("recent");
    const [loading, setLoading] = useState(true);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    function showMessage(nextMessage: string) {
        setMessage(nextMessage);
        window.setTimeout(() => setMessage(""), 3000);
    }

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

    useEffect(() => {
        async function loadPlaylists() {
            try {
                const response = await fetch(
                    "/api/navidrome/playlists",
                    { cache: "no-store" }
                );

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                setPlaylists(
                    data["subsonic-response"]?.playlists?.playlist ?? []
                );
            } catch (error) {
                console.error("Failed to load playlists:", error);
            }
        }

        loadPlaylists();
    }, []);

    async function addAlbumToPlaylist(album: Album, playlist: Playlist) {
        try {
            setPlaylistLoading(true);
            const albumResponse = await fetch(
                `/api/navidrome/album?id=${encodeURIComponent(album.id)}`,
                { cache: "no-store" }
            );

            if (!albumResponse.ok) {
                throw new Error("Failed to load album songs");
            }

            const albumData = await albumResponse.json();
            const songs = albumData["subsonic-response"]?.album?.song ?? [];
            const songIds = songs
                .map((song: { id?: string }) => song.id)
                .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

            if (songIds.length === 0) {
                throw new Error("This album has no songs to add");
            }

            const response = await fetch("/api/navidrome/playlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playlistId: playlist.id, songIds }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to add album");
            }

            if (data.added === 0) {
                showMessage(`All songs from "${album.name}" are already in ${playlist.name}`);
            } else {
                showMessage(`Added ${data.added} songs from "${album.name}" to ${playlist.name}`);
            }
            setOpenMenu(null);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Failed to add album");
        } finally {
            setPlaylistLoading(false);
        }
    }

    async function createPlaylistForAlbum() {
        if (!selectedAlbum || !newPlaylistName.trim()) {
            return;
        }

        try {
            setPlaylistLoading(true);
            const createResponse = await fetch("/api/navidrome/playlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newPlaylistName.trim() }),
            });
            const createData = await createResponse.json();

            if (!createResponse.ok || !createData.success || !createData.playlist?.id) {
                throw new Error(createData.error || "Failed to create playlist");
            }

            const targetPlaylist = createData.playlist as Playlist;
            setShowCreatePlaylist(false);
            setNewPlaylistName("");
            await addAlbumToPlaylist(selectedAlbum, targetPlaylist);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : "Failed to create playlist");
            setPlaylistLoading(false);
        }
    }

    const filteredAlbums = albums
        .filter(
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
        )
        .sort((first, second) => {
            if (sort === "title") {
                return first.name.localeCompare(second.name);
            }

            if (sort === "artist") {
                return first.artist.localeCompare(second.artist);
            }

            if (sort === "year") {
                return (second.year ?? 0) - (first.year ?? 0);
            }

            return 0;
        });

    return (
        <main className="min-h-screen bg-black pb-32 text-white md:ml-64">

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

                        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">

                            <select
                                value={sort}
                                onChange={(event) => setSort(event.target.value)}
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-300 outline-none focus:border-[#c7f36b]"
                                aria-label="Sort albums"
                            >
                                <option value="recent" className="bg-zinc-900">Recently added</option>
                                <option value="title" className="bg-zinc-900">Title</option>
                                <option value="artist" className="bg-zinc-900">Artist</option>
                                <option value="year" className="bg-zinc-900">Release year</option>
                            </select>

                            <div className="relative w-full md:w-80">

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
                </div>
            </header>

            {/* Albums */}

            <section className="mx-auto max-w-7xl p-6">

                {message && (
                    <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm shadow-2xl">
                        {message}
                    </div>
                )}

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

                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.push(`/album/${album.id}`)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            router.push(`/album/${album.id}`);
                                        }
                                    }}
                                    className="relative block aspect-square w-full overflow-hidden rounded-xl bg-zinc-900"
                                >

                                    <Artwork
                                        alt={album.name}
                                        coverArt={album.coverArt}
                                        className="h-full w-full transition duration-300 group-hover:scale-105"
                                    />

                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setOpenMenu(openMenu === album.id ? null : album.id);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                setOpenMenu(openMenu === album.id ? null : album.id);
                                            }
                                        }}
                                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                                        aria-label={`Actions for ${album.name}`}
                                    >
                                        <MoreHorizontal size={18} />
                                    </span>

                                    {openMenu === album.id && (
                                        <div
                                            onClick={(event) => event.stopPropagation()}
                                            className="absolute right-2 top-12 z-20 w-56 rounded-lg border border-white/10 bg-zinc-950 p-1 text-left shadow-2xl"
                                        >
                                            <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-zinc-600">Add album to playlist</p>
                                            {playlists.filter((playlist) => playlist.readonly !== true && playlist.readonly !== "true").map((playlist) => (
                                                <button
                                                    key={playlist.id}
                                                    type="button"
                                                    disabled={playlistLoading}
                                                    onClick={() => addAlbumToPlaylist(album, playlist)}
                                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-50"
                                                >
                                                    <ListPlus size={16} />
                                                    <span className="truncate">{playlist.name}</span>
                                                </button>
                                            ))}
                                            {playlists.filter((playlist) => playlist.readonly !== true && playlist.readonly !== "true").length === 0 && (
                                                <p className="px-3 py-2 text-xs text-zinc-600">No editable playlists</p>
                                            )}
                                            <div className="my-1 border-t border-white/10" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAlbum(album);
                                                    setNewPlaylistName("");
                                                    setShowCreatePlaylist(true);
                                                    setOpenMenu(null);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
                                            >
                                                <Plus size={16} />
                                                New playlist
                                            </button>
                                        </div>
                                    )}

                                </div>

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

                {showCreatePlaylist && selectedAlbum && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                createPlaylistForAlbum();
                            }}
                            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-xl font-semibold">New Playlist</h2>
                                <button type="button" onClick={() => setShowCreatePlaylist(false)} className="rounded-full p-2 text-zinc-500 hover:bg-white/10 hover:text-white" title="Close">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="mb-4 text-sm text-zinc-500">Create a playlist with <span className="text-zinc-300">{selectedAlbum.name}</span></p>
                            <input
                                autoFocus
                                value={newPlaylistName}
                                onChange={(event) => setNewPlaylistName(event.target.value)}
                                placeholder="Playlist name"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#c7f36b]"
                            />
                            <div className="mt-5 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCreatePlaylist(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/10 hover:text-white">Cancel</button>
                                <button type="submit" disabled={!newPlaylistName.trim() || playlistLoading} className="rounded-lg bg-[#c7f36b] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">Create</button>
                            </div>
                        </form>
                    </div>
                )}

            </section>

        </main>
    );
}