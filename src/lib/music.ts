export type SearchableSong = {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
};

export type PlaylistAccess = {
  readonly?: boolean | string;
};

export function formatDuration(seconds = 0) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function filterSongs<T extends SearchableSong>(songs: T[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return songs;

  return songs.filter((song) =>
    [song.title, song.artist, song.album].some((value) =>
      value?.toLowerCase().includes(normalized)
    )
  );
}

export function sortSongs<T extends SearchableSong>(songs: T[], sort: "title" | "artist" | "album" | "duration") {
  return [...songs].sort((first, second) => {
    if (sort === "duration") return (second.duration ?? 0) - (first.duration ?? 0);
    const firstValue = first[sort] ?? "";
    const secondValue = second[sort] ?? "";
    return String(firstValue).localeCompare(String(secondValue));
  });
}

export function isEditablePlaylist(playlist: PlaylistAccess) {
  return playlist.readonly !== true && playlist.readonly !== "true";
}

export function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter((id) => id.trim().length > 0))];
}

export function queueAfterClear<T>(currentSong: T | null) {
  return currentSong ? [currentSong] : [];
}

export function nextQueueIndex(currentIndex: number, queueLength: number, repeatAll: boolean) {
  if (queueLength === 0) return -1;
  const nextIndex = currentIndex + 1;
  if (nextIndex < queueLength) return nextIndex;
  return repeatAll ? 0 : -1;
}
