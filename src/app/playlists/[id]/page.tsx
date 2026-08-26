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
  Pencil,
  Play,
  Plus,
  Trash2,
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

  const [busy, setBusy] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [playlistName, setPlaylistName] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [confirmation, setConfirmation] =
    useState<
      | { type: "deletePlaylist" }
      | { type: "removeSong"; index: number }
      | null
    >(null);

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

        setPlaylist(result ?? null);
        setPlaylistName(result?.name ?? "");
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

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2500);
  }

  async function renamePlaylist() {
    if (!playlist || !playlistName.trim()) {
      return;
    }

    try {
      setBusy(true);
      setError("");
      const response = await fetch("/api/navidrome/playlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: playlist.id,
          name: playlistName.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to rename playlist");
      }

      setPlaylist({ ...playlist, name: playlistName.trim() });
      setEditing(false);
      showMessage("Playlist renamed");
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Failed to rename playlist");
    } finally {
      setBusy(false);
    }
  }

  async function deletePlaylist() {
    if (!playlist) {
      return;
    }

    try {
      setBusy(true);
      setError("");
      const response = await fetch("/api/navidrome/playlists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: playlist.id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete playlist");
      }

      router.push("/playlists");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete playlist");
      setBusy(false);
    }
  }

  async function removeSong(songIndex: number) {
    if (!playlist) {
      return;
    }

    try {
      setBusy(true);
      setError("");
      const response = await fetch("/api/navidrome/playlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: playlist.id,
          songIndexes: [songIndex],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove song");
      }

      setPlaylist({
        ...playlist,
        entry: (playlist.entry ?? []).filter((_, index) => index !== songIndex),
      });
      showMessage("Removed from playlist");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove song");
    } finally {
      setBusy(false);
    }
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
    <main className="min-h-screen bg-black pb-32 text-white md:ml-64">

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

          {editing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                renamePlaylist();
              }}
              className="flex max-w-xl items-center gap-2"
            >
              <input
                autoFocus
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                className="min-w-0 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-3xl font-bold text-white outline-none md:text-5xl"
                aria-label="Playlist name"
              />
              <button type="submit" disabled={busy} className="rounded-md bg-[#c7f36b] px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
                Save
              </button>
            </form>
          ) : (
            <h1 className="text-4xl font-bold md:text-6xl">
              {playlist.name}
            </h1>
          )}

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

          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={busy}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-40"
            title="Rename playlist"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => setConfirmation({ type: "deletePlaylist" })}
            disabled={busy}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
            title="Delete playlist"
          >
            <Trash2 size={17} />
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

        {message && (
          <p className="mx-6 mb-4 rounded-md border border-[#c7f36b]/20 bg-[#c7f36b]/10 px-4 py-3 text-sm text-[#dafa96] md:mx-10">
            {message}
          </p>
        )}

        {error && (
          <p className="mx-6 mb-4 rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200 md:mx-10">
            {error}
          </p>
        )}

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

                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">

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
                    onClick={() => setConfirmation({ type: "removeSong", index })}
                    disabled={busy}
                    className="rounded-full p-2 text-zinc-500 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
                    title="Remove from playlist"
                  >
                    <Trash2 size={17} />
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

      {confirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#151916] p-6 shadow-2xl"
          >
            <h2 id="confirmation-title" className="text-lg font-semibold text-white">
              {confirmation.type === "deletePlaylist" ? "Delete playlist?" : "Remove song?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {confirmation.type === "deletePlaylist"
                ? `This will permanently delete "${playlist.name}".`
                : "This will remove the song from this playlist only. It will stay in your library and player queue."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const action = confirmation;
                  setConfirmation(null);
                  if (action.type === "deletePlaylist") {
                    deletePlaylist();
                  } else {
                    removeSong(action.index);
                  }
                }}
                className="rounded-md bg-red-400 px-4 py-2 text-sm font-semibold text-black hover:bg-red-300 disabled:opacity-40"
              >
                {confirmation.type === "deletePlaylist" ? "Delete" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}