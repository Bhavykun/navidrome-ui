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
  MoreHorizontal,
  Play,
  Plus,
  X,
} from "lucide-react";

import {
  Song,
  usePlayer,
} from "@/context/PlayerContext";
import Artwork from "@/components/Artwork";

type Album = {
  id: string;
  name: string;
  artist: string;
  year?: number;
  coverArt?: string;
  songCount: number;
  song: Song[];
};

type Playlist = {
  id: string;
  name: string;
  readonly?: boolean | string;
};

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();

  const {
    playSong,
    addToQueue,
    playNext,
  } = usePlayer();

  const [album, setAlbum] =
    useState<Album | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [openPlaylistMenu, setOpenPlaylistMenu] =
    useState<string | null>(null);

  const [playlistLoading, setPlaylistLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [showCreatePlaylist, setShowCreatePlaylist] =
    useState(false);

  const [selectedSong, setSelectedSong] =
    useState<Song | null>(null);

  const [newPlaylistName, setNewPlaylistName] =
    useState("");

  useEffect(() => {
    async function loadAlbum() {
      try {
        const response =
          await fetch(
            `/api/navidrome/album?id=${encodeURIComponent(
              String(params.id)
            )}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load album"
          );
        }

        const data =
          await response.json();

        const result =
          data[
            "subsonic-response"
          ]?.album;

        setAlbum(result);
      } catch (error) {
        console.error(
          "Album loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadAlbum();
    }
  }, [params.id]);

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

  async function addSongToPlaylist(song: Song, playlist: Playlist) {
    try {
      setPlaylistLoading(true);
      const response = await fetch("/api/navidrome/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: playlist.id,
          songIds: [song.id],
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add song");
      }

      setMessage(data.added === 0
        ? `"${song.title}" is already in ${playlist.name}`
        : `Added "${song.title}" to ${playlist.name}`);
      setOpenPlaylistMenu(null);
      window.setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add song");
      window.setTimeout(() => setMessage(""), 3000);
    } finally {
      setPlaylistLoading(false);
    }
  }

  async function createPlaylistForSong() {
    if (!selectedSong || !newPlaylistName.trim()) {
      return;
    }

    try {
      setPlaylistLoading(true);
      const response = await fetch("/api/navidrome/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.playlist?.id) {
        throw new Error(data.error || "Failed to create playlist");
      }

      setShowCreatePlaylist(false);
      setNewPlaylistName("");
      await addSongToPlaylist(selectedSong, data.playlist as Playlist);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create playlist");
      setPlaylistLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-400">
          Loading album...
        </p>
      </main>
    );
  }

  if (!album) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">

          <p className="text-xl">
            Album not found
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
    album.song ?? [];

  const firstSong =
    songs[0];

  return (
    <main className="min-h-screen bg-black pb-32 text-white md:ml-64">

      {/* Header */}

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="flex items-center gap-2 text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />

          Back
        </button>

      </header>

      {/* Album hero */}

      <section className="flex flex-col gap-8 p-6 md:flex-row md:items-end md:p-10">

        {/* Artwork */}

        <div className="h-56 w-56 shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-2xl">

          <Artwork
            alt={album.name}
            coverArt={album.coverArt}
            className="h-full w-full"
            priority
          />

        </div>

        {/* Details */}

        <div>

          <p className="mb-2 text-sm uppercase tracking-widest text-zinc-500">
            Album
          </p>

          <h1 className="text-4xl font-bold md:text-6xl">
            {album.name}
          </h1>

          <p className="mt-4 text-lg text-zinc-400">
            {album.artist}
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            {album.year ?? ""}

            {album.year
              ? " · "
              : ""}

            {songs.length}{" "}
            {songs.length === 1
              ? "song"
              : "songs"}
          </p>

        </div>

      </section>

      {/* Controls */}

      <section className="px-6 md:px-10">

        {message && (
          <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm shadow-2xl">
            {message}
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">

          {/* Play album */}

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
            title="Play album"
          >
            <Play
              size={20}
              fill="currentColor"
            />
          </button>

          {/* Add album */}

          <button
            type="button"
            disabled={
              songs.length === 0
            }
            onClick={() =>
              addToQueue(songs)
            }
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <ListPlus size={17} />

            Add album to queue
          </button>

        </div>

        {/* Songs */}

        <div className="divide-y divide-white/5">

          {songs.map(
            (song, index) => (

              <div
                key={song.id}
                className="group flex items-center gap-4 rounded-lg px-4 py-3 transition hover:bg-white/5"
              >

                {/* Track */}

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
                    title="Play"
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

                <div className="relative ml-auto shrink-0 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setOpenPlaylistMenu(openPlaylistMenu === song.id ? null : song.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-white"
                    title="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openPlaylistMenu === song.id && (
                    <div className="absolute right-0 top-11 z-50 w-60 rounded-lg border border-white/10 bg-zinc-950 p-1 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          playSong(song, songs);
                          setOpenPlaylistMenu(null);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-white/10"
                      >
                        <Play size={16} fill="currentColor" />
                        Play
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playNext(song);
                          setOpenPlaylistMenu(null);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-white/10"
                      >
                        <ListPlus size={16} />
                        Play next
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addToQueue(song);
                          setOpenPlaylistMenu(null);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-white/10"
                      >
                        <Plus size={16} />
                        Add to queue
                      </button>
                      <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-widest text-zinc-600">Add to playlist</p>
                      {playlists.filter((playlist) => playlist.readonly !== true && playlist.readonly !== "true").map((playlist) => (
                        <button
                          key={playlist.id}
                          type="button"
                          disabled={playlistLoading}
                          onClick={() => addSongToPlaylist(song, playlist)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-50"
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
                          setSelectedSong(song);
                          setNewPlaylistName("");
                          setShowCreatePlaylist(true);
                          setOpenPlaylistMenu(null);
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/10"
                      >
                        <Plus size={16} />
                        New playlist
                      </button>
                    </div>
                  )}

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

      {showCreatePlaylist && selectedSong && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createPlaylistForSong();
            }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">New Playlist</h2>
              <button type="button" onClick={() => setShowCreatePlaylist(false)} className="rounded-full p-2 text-zinc-500 hover:bg-white/10 hover:text-white" title="Close">
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-zinc-500">Create a playlist with <span className="text-zinc-300">{selectedSong.title}</span></p>
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

    </main>
  );
}