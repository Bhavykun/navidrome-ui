"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Disc3, ListMusic, Music2, Play, Search as SearchIcon, Users } from "lucide-react";

import Artwork from "@/components/Artwork";
import { Song, usePlayer } from "@/context/PlayerContext";

type Album = { id: string; name: string; artist?: string; coverArt?: string };
type Artist = { id: string; name: string; artistImageUrl?: string; albumCount?: number };
type Playlist = { id: string; name: string; songCount?: number; duration?: number; coverArt?: string };

export default function SearchPage() {
  const router = useRouter();
  const { playSong } = usePlayer();
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchQuery = query.trim();

    if (!searchQuery) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        const [songsResponse, albumsResponse, artistsResponse, playlistsResponse] = await Promise.all([
          fetch("/api/navidrome/songs", { cache: "no-store", signal: controller.signal }),
          fetch("/api/navidrome/albums", { cache: "no-store", signal: controller.signal }),
          fetch("/api/navidrome/artists", { cache: "no-store", signal: controller.signal }),
          fetch("/api/navidrome/playlists", { cache: "no-store", signal: controller.signal }),
        ]);
        const [songsData, albumsData, artistsData, playlistsData] = await Promise.all([
          songsResponse.json(),
          albumsResponse.json(),
          artistsResponse.json(),
          playlistsResponse.json(),
        ]);

        setSongs(songsData["subsonic-response"]?.searchResult3?.song ?? []);
        setAlbums(albumsData["subsonic-response"]?.albumList2?.album ?? []);
        setArtists((artistsData["subsonic-response"]?.artists?.index ?? []).flatMap((group: { artist?: Artist[] }) => group.artist ?? []));
        setPlaylists(playlistsData["subsonic-response"]?.playlists?.playlist ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Search loading error:", error);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) {
      return { songs: [], albums: [], artists: [], playlists: [] };
    }

    return {
      songs: songs.filter((song) => [song.title, song.artist, song.album].some((value) => value?.toLowerCase().includes(normalizedQuery))).slice(0, 12),
      albums: albums.filter((album) => [album.name, album.artist].some((value) => value?.toLowerCase().includes(normalizedQuery))).slice(0, 8),
      artists: artists.filter((artist) => artist.name?.toLowerCase().includes(normalizedQuery)).slice(0, 8),
      playlists: playlists.filter((playlist) => playlist.name?.toLowerCase().includes(normalizedQuery)).slice(0, 8),
    };
  }, [albums, artists, normalizedQuery, playlists, songs]);

  const hasResults = Object.values(results).some((items) => items.length > 0);

  return (
    <main className="min-h-screen bg-black pb-32 text-white md:ml-64">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/90 px-6 py-5 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <button type="button" onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white">
            <ArrowLeft size={17} /> Back
          </button>
          <h1 className="text-3xl font-bold">Search</h1>
          <div className="relative mt-5 max-w-2xl">
            <SearchIcon size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What do you want to listen to?" className="w-full rounded-full border border-white/10 bg-white/10 py-4 pl-12 pr-5 text-white outline-none placeholder:text-zinc-500 focus:border-[#c7f36b]" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        {loading ? <p className="py-16 text-center text-zinc-500">Loading your library...</p> : !normalizedQuery ? (
          <div className="py-20 text-center">
            <SearchIcon size={42} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-400">Search your music library</p>
            <p className="mt-2 text-sm text-zinc-600">Find songs, albums, artists, and playlists.</p>
          </div>
        ) : !hasResults ? <p className="py-16 text-center text-zinc-500">No results for “{query}”</p> : (
          <>
            {results.songs.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Music2 size={20} /> Songs</h2><div className="divide-y divide-white/5 rounded-lg border border-white/10">{results.songs.map((song) => <button key={song.id} type="button" onClick={() => playSong(song, results.songs)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"><Artwork alt="" coverArt={song.coverArt} className="h-10 w-10 shrink-0" /><span className="min-w-0 flex-1"><strong className="block truncate font-medium">{song.title}</strong><small className="block truncate text-zinc-500">{song.artist} · {song.album}</small></span><Play size={16} /></button>)}</div></section>}

            {results.albums.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Disc3 size={20} /> Albums</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{results.albums.map((album) => <button key={album.id} type="button" onClick={() => router.push(`/album/${album.id}`)} className="min-w-0 text-left"><Artwork alt={album.name} coverArt={album.coverArt} className="aspect-square w-full" /><strong className="mt-2 block truncate">{album.name}</strong><small className="block truncate text-zinc-500">{album.artist}</small></button>)}</div></section>}

            {results.artists.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Users size={20} /> Artists</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{results.artists.map((artist) => <button key={artist.id} type="button" onClick={() => router.push(`/artist/${artist.id}`)} className="min-w-0 text-left"><Artwork alt={artist.name} coverArt={artist.artistImageUrl} artist shape="circle" className="mx-auto aspect-square w-full max-w-40" /><strong className="mt-2 block truncate text-center">{artist.name}</strong></button>)}</div></section>}

            {results.playlists.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><ListMusic size={20} /> Playlists</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{results.playlists.map((playlist) => <button key={playlist.id} type="button" onClick={() => router.push(`/playlists/${playlist.id}`)} className="min-w-0 text-left"><Artwork alt={playlist.name} coverArt={playlist.coverArt} className="aspect-square w-full" /><strong className="mt-2 block truncate">{playlist.name}</strong><small className="text-zinc-500">{playlist.songCount ?? 0} songs</small></button>)}</div></section>}
          </>
        )}
      </section>
    </main>
  );
}
