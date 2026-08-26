import { describe, expect, it } from "vitest";
import {
  filterSongs,
  formatDuration,
  isEditablePlaylist,
  nextQueueIndex,
  queueAfterClear,
  sortSongs,
  uniqueIds,
} from "@/lib/music";

const songs = [
  { title: "Zebra", artist: "Asha", album: "Blue", duration: 240 },
  { title: "Alpha", artist: "Zed", album: "Amber", duration: 120 },
];

describe("music helpers", () => {
  it("formats durations consistently", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3661)).toBe("61:01");
  });

  it("filters songs by title, artist, or album", () => {
    expect(filterSongs(songs, " zEb ")).toEqual([songs[0]]);
    expect(filterSongs(songs, "amber")).toEqual([songs[1]]);
    expect(filterSongs(songs, "")).toEqual(songs);
  });

  it("sorts songs without mutating the original list", () => {
    expect(sortSongs(songs, "title").map((song) => song.title)).toEqual(["Alpha", "Zebra"]);
    expect(sortSongs(songs, "duration").map((song) => song.duration)).toEqual([240, 120]);
    expect(songs[0].title).toBe("Zebra");
  });

  it("recognizes Navidrome readonly values", () => {
    expect(isEditablePlaylist({ readonly: true })).toBe(false);
    expect(isEditablePlaylist({ readonly: "true" })).toBe(false);
    expect(isEditablePlaylist({ readonly: false })).toBe(true);
    expect(isEditablePlaylist({})).toBe(true);
  });

  it("removes invalid and duplicate playlist song IDs", () => {
    expect(uniqueIds(["one", "one", "", " two "])).toEqual(["one", " two "]);
  });

  it("keeps the current song when clearing the queue", () => {
    const current = { title: "Now playing" };
    expect(queueAfterClear(current)).toEqual([current]);
    expect(queueAfterClear(null)).toEqual([]);
  });

  it("calculates next queue indexes for repeat modes", () => {
    expect(nextQueueIndex(0, 3, false)).toBe(1);
    expect(nextQueueIndex(2, 3, false)).toBe(-1);
    expect(nextQueueIndex(2, 3, true)).toBe(0);
    expect(nextQueueIndex(0, 0, true)).toBe(-1);
  });
});
