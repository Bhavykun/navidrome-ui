"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Check,
  Clock3,
  ListPlus,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";

import { usePlayer } from "@/context/PlayerContext";

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt?: string;
  albumId?: string;
  artistId?: string;
  track?: number;
};

type Playlist = {
  id: string;
  name: string;
  songCount?: number;
  duration?: number;
  coverArt?: string;
  readonly?: boolean;
};

function formatDuration(seconds: number) {
  if (!seconds) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${secs}`;
}

export default function SongsPage() {
  const router = useRouter();

  const { playSong } = usePlayer();

  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [playlistLoading, setPlaylistLoading] =
    useState(false);

  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  const [showCreatePlaylist, setShowCreatePlaylist] =
    useState(false);

  const [newPlaylistName, setNewPlaylistName] =
    useState("");

  const [selectedSong, setSelectedSong] =
    useState<Song | null>(null);

  const [message, setMessage] =
    useState("");

  /*
   * Load songs
   */
  useEffect(() => {
    async function loadSongs() {
      try {
        const response = await fetch(
          "/api/navidrome/songs",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load songs"
          );
        }

        const data =
          await response.json();

        const songList =
          data[
            "subsonic-response"
          ]?.searchResult3?.song ?? [];

        setSongs(songList);
      } catch (error) {
        console.error(
          "Songs loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSongs();
  }, []);

  /*
   * Load playlists
   */
  useEffect(() => {
    async function loadPlaylists() {
      try {
        const response =
          await fetch(
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
      }
    }

    loadPlaylists();
  }, []);

  /*
   * Search
   */
  const filteredSongs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return songs;
    }

    return songs.filter((song) => {
      return (
        song.title
          ?.toLowerCase()
          .includes(query) ||
        song.artist
          ?.toLowerCase()
          .includes(query) ||
        song.album
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [songs, search]);

  /*
   * Add song to playlist
   */
  async function addToPlaylist(
    playlistId: string,
    song: Song
  ) {
    try {
      setPlaylistLoading(true);

      const response =
        await fetch(
          "/api/navidrome/playlist",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              playlistId,
              songIds: [song.id],
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success ||
        data.added !== 1
      ) {
        throw new Error(
          data.error ||
            "Failed to add song"
        );
      }

      const playlist =
        playlists.find(
          (item) =>
            item.id === playlistId
        );

      setMessage(
        `"${song.title}" added to ${
          playlist?.name ??
          "playlist"
        }`
      );

      setOpenMenu(null);

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Add to playlist error:",
        error
      );

      setMessage(
        "Failed to add song to playlist"
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } finally {
      setPlaylistLoading(false);
    }
  }

  /*
   * Create playlist and immediately
   * add the selected song.
   */
  async function createPlaylist() {
    const name =
      newPlaylistName.trim();

    if (!name || !selectedSong) {
      return;
    }

    try {
      setPlaylistLoading(true);

      /*
       * Create playlist
       */
      const createResponse =
        await fetch(
          "/api/navidrome/playlists",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
            }),
          }
        );

      const createData =
        await createResponse.json();

      if (
        !createResponse.ok ||
        !createData.success
      ) {
        throw new Error(
          createData.error ||
            "Failed to create playlist"
        );
      }

      const newPlaylist =
        createData.playlist;

      /*
       * Add selected song
       */
      const addResponse =
        await fetch(
          "/api/navidrome/playlist",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              playlistId:
                newPlaylist.id,
              songIds: [
                selectedSong.id,
              ],
            }),
          }
        );

      const addData =
        await addResponse.json();

      if (
        !addResponse.ok ||
        !addData.success
      ) {
        throw new Error(
          addData.error ||
            "Playlist created but song could not be added"
        );
      }

      setPlaylists((current) => [
        ...current,
        newPlaylist,
      ]);

      setMessage(
        `Created "${name}" and added "${selectedSong.title}"`
      );

      setShowCreatePlaylist(false);
      setNewPlaylistName("");
      setSelectedSong(null);
      setOpenMenu(null);

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Create playlist error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create playlist"
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } finally {
      setPlaylistLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black pb-32 text-white">
      {/* Header */}

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto max-w-7xl">
          <button
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
                Songs
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                {filteredSongs.length}{" "}
                {filteredSongs.length === 1
                  ? "song"
                  : "songs"}
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
                placeholder="Search songs, artists, albums..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/10"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}

      {message && (
        <div className="fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm shadow-2xl">
          <Check
            size={17}
            className="text-green-400"
          />

          {message}
        </div>
      )}

      {/* Content */}

      <section className="mx-auto max-w-7xl px-6 py-6">
        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            Loading songs...
          </div>
        ) : filteredSongs.length ===
          0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-zinc-400">
              No songs found
            </p>

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="mt-3 text-sm text-zinc-500 hover:text-white"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Table header */}

            <div className="mb-2 hidden grid-cols-[40px_1fr_1fr_1fr_80px_40px] items-center gap-4 border-b border-white/10 px-4 pb-3 text-xs uppercase tracking-wider text-zinc-600 md:grid">
              <span>#</span>
              <span>Title</span>
              <span>Artist</span>
              <span>Album</span>

              <span className="flex justify-end">
                <Clock3 size={15} />
              </span>

              <span />
            </div>

            {/* Songs */}

            <div className="divide-y divide-white/5">
              {filteredSongs.map(
                (song, index) => (
                  <div
                    key={song.id}
                    className="group relative grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg px-4 py-3 transition hover:bg-white/5 md:grid-cols-[40px_1fr_1fr_1fr_80px_40px]"
                  >
                    {/* Number / Play */}

                    <div className="flex items-center justify-center">
                      <span className="text-sm text-zinc-600 group-hover:hidden">
                        {index + 1}
                      </span>

                      <button
                        onClick={() =>
                          playSong(
                            song,
                            filteredSongs
                          )
                        }
                        className="hidden text-white group-hover:block"
                        title="Play"
                      >
                        <Play
                          size={17}
                          fill="currentColor"
                        />
                      </button>
                    </div>

                    {/* Title */}

                    <button
                      onClick={() =>
                        playSong(
                          song,
                          filteredSongs
                        )
                      }
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-900 sm:block">
                        {song.coverArt ? (
                          <img
                            src={`/api/navidrome/cover?id=${encodeURIComponent(
                              song.coverArt
                            )}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-600">
                            ♪
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {song.title}
                        </p>

                        <p className="truncate text-sm text-zinc-500 md:hidden">
                          {song.artist}
                        </p>
                      </div>
                    </button>

                    {/* Artist */}

                    <p className="hidden truncate text-sm text-zinc-400 md:block">
                      {song.artist}
                    </p>

                    {/* Album */}

                    <p className="hidden truncate text-sm text-zinc-500 md:block">
                      {song.album}
                    </p>

                    {/* Duration */}

                    <span className="text-right text-sm text-zinc-500">
                      {formatDuration(
                        song.duration
                      )}
                    </span>

                    {/* Menu */}

                    <div className="relative flex justify-end">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();

                          setOpenMenu(
                            openMenu ===
                              song.id
                              ? null
                              : song.id
                          );
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
                        title="More"
                      >
                        <span className="text-lg leading-none">
                          ⋮
                        </span>
                      </button>

                      {openMenu ===
                        song.id && (
                        <div
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl"
                        >
                          {/* Play */}

                          <button
                            onClick={() => {
                              playSong(
                                song,
                                filteredSongs
                              );

                              setOpenMenu(
                                null
                              );
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/10"
                          >
                            <Play
                              size={16}
                              fill="currentColor"
                            />

                            Play
                          </button>

                          {/* Add to playlist */}

                          <div className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
                            Add to playlist
                          </div>

                          {playlists
                            .filter(
                              (playlist) =>
                                !playlist.readonly
                            )
                            .map(
                              (playlist) => (
                                <button
                                  key={
                                    playlist.id
                                  }
                                  disabled={
                                    playlistLoading
                                  }
                                  onClick={() =>
                                    addToPlaylist(
                                      playlist.id,
                                      song
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/10 disabled:opacity-50"
                                >
                                  <ListPlus
                                    size={16}
                                  />

                                  <span className="truncate">
                                    {
                                      playlist.name
                                    }
                                  </span>
                                </button>
                              )
                            )}

                          {/* New playlist */}

                          <div className="my-1 border-t border-white/10" />

                          <button
                            onClick={() => {
                              setSelectedSong(
                                song
                              );

                              setNewPlaylistName(
                                ""
                              );

                              setShowCreatePlaylist(
                                true
                              );

                              setOpenMenu(
                                null
                              );
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/10"
                          >
                            <Plus
                              size={16}
                            />

                            New playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>

      {/* Create playlist modal */}

      {showCreatePlaylist && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() =>
            setShowCreatePlaylist(false)
          }
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                New Playlist
              </h2>

              <button
                onClick={() =>
                  setShowCreatePlaylist(
                    false
                  )
                }
                className="rounded-full p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm text-zinc-500">
              Create a playlist and add:
              {" "}
              <span className="text-zinc-300">
                {selectedSong?.title}
              </span>
            </p>

            <input
              autoFocus
              value={newPlaylistName}
              onChange={(event) =>
                setNewPlaylistName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  createPlaylist();
                }
              }}
              placeholder="Playlist name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white/20"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() =>
                  setShowCreatePlaylist(
                    false
                  )
                }
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                disabled={
                  !newPlaylistName.trim() ||
                  playlistLoading
                }
                onClick={
                  createPlaylist
                }
                className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {playlistLoading
                  ? "Creating..."
                  : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}