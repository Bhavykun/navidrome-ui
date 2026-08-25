"use client";

import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { useState } from "react";

import { usePlayer } from "@/context/PlayerContext";

function formatTime(
  seconds: number
) {
  if (
    !seconds ||
    !Number.isFinite(seconds)
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  const secs =
    Math.floor(
      seconds % 60
    )
      .toString()
      .padStart(2, "0");

  return `${minutes}:${secs}`;
}

export default function Player() {
  const {
    currentSong,

    queue,
    currentIndex,

    isPlaying,

    progress,
    duration,

    volume,

    shuffle,
    loop,

    togglePlay,

    nextSong,
    previousSong,

    seek,
    setVolume,

    toggleShuffle,
    toggleLoop,

    playQueueSong,

    removeFromQueue,
    clearQueue,
  } = usePlayer();

  const [showQueue, setShowQueue] =
    useState(false);

  /*
   * Nothing playing.
   */
  if (!currentSong) {
    return null;
  }

  function handleClearQueue() {
    clearQueue();

    setShowQueue(false);
  }

  return (
    <>
      {/* =================================
          QUEUE PANEL
      ================================= */}

      {showQueue && (
        <div className="fixed bottom-[92px] right-4 z-[60] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">

          {/* Header */}

          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">

            <div>
              <h2 className="font-semibold">
                Queue
              </h2>

              <p className="text-xs text-zinc-500">
                {queue.length}{" "}
                {queue.length === 1
                  ? "song"
                  : "songs"}
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* Clear queue */}

              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={
                    handleClearQueue
                  }
                  title="Clear queue"
                  className="text-zinc-500 transition hover:text-red-400"
                >
                  <Trash2
                    size={17}
                  />
                </button>
              )}

              {/* Close */}

              <button
                type="button"
                onClick={() =>
                  setShowQueue(false)
                }
                title="Close queue"
                className="text-zinc-500 transition hover:text-white"
              >
                <X size={18} />
              </button>

            </div>
          </div>

          {/* Queue songs */}

          <div className="max-h-[420px] overflow-y-auto">

            {queue.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-zinc-600">
                Queue is empty
              </div>
            ) : (
              queue.map(
                (song, index) => {
                  const isCurrent =
                    index ===
                    currentIndex;

                  return (
                    <div
                      key={`${song.id}-${index}`}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        isCurrent
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                    >

                      {/* Song */}

                      <button
                        type="button"
                        onClick={() =>
                          playQueueSong(
                            index
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >

                        {/* Artwork */}

                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-900">

                          <img
                            src={
                              song.coverArt
                                ? `/api/navidrome/cover?id=${encodeURIComponent(
                                    song.coverArt
                                  )}`
                                : "/album-placeholder.jpg"
                            }
                            onError={(
                              event
                            ) => {
                              event.currentTarget.src =
                                "/album-placeholder.jpg";
                            }}
                            alt=""
                            className="h-full w-full object-cover"
                          />

                        </div>

                        {/* Info */}

                        <div className="min-w-0 flex-1">

                          <p
                            className={`truncate text-sm ${
                              isCurrent
                                ? "font-semibold text-white"
                                : "text-zinc-300"
                            }`}
                          >
                            {song.title}
                          </p>

                          <p className="truncate text-xs text-zinc-500">
                            {song.artist}
                          </p>

                        </div>

                        {/* Current indicator */}

                        {isCurrent && (
                          <Play
                            size={14}
                            fill="currentColor"
                            className="shrink-0"
                          />
                        )}

                      </button>

                      {/* Remove */}

                      <button
                        type="button"
                        onClick={() =>
                          removeFromQueue(
                            index
                          )
                        }
                        title="Remove from queue"
                        className="shrink-0 p-1 text-zinc-600 transition hover:text-red-400"
                      >
                        <X
                          size={16}
                        />
                      </button>

                    </div>
                  );
                }
              )
            )}

          </div>
        </div>
      )}

      {/* =================================
          PLAYER
      ================================= */}

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/95 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">

        <div className="mx-auto max-w-[1600px]">

          <div className="flex items-center gap-3 sm:gap-4">

            {/* Artwork */}

            <div className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-900 sm:block">

              <img
                src={
                  currentSong.coverArt
                    ? `/api/navidrome/cover?id=${encodeURIComponent(
                        currentSong.coverArt
                      )}`
                    : "/album-placeholder.jpg"
                }
                onError={(
                  event
                ) => {
                  event.currentTarget.src =
                    "/album-placeholder.jpg";
                }}
                alt={currentSong.album}
                className="h-full w-full object-cover"
              />

            </div>

            {/* Song information */}

            <div className="min-w-0 w-32 sm:w-44 md:w-60">

              <p className="truncate text-sm font-medium">
                {currentSong.title}
              </p>

              <p className="truncate text-xs text-zinc-500">
                {currentSong.artist}
              </p>

            </div>

            {/* Main controls */}

            <div className="flex flex-1 flex-col items-center gap-1">

              <div className="flex items-center gap-3 sm:gap-5">

                {/* Shuffle */}

                <button
                  type="button"
                  onClick={
                    toggleShuffle
                  }
                  title={
                    shuffle
                      ? "Shuffle on"
                      : "Shuffle off"
                  }
                  className={`hidden transition sm:block ${
                    shuffle
                      ? "text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Shuffle
                    size={18}
                  />
                </button>

                {/* Previous */}

                <button
                  type="button"
                  onClick={
                    previousSong
                  }
                  title="Previous"
                  className="text-zinc-400 transition hover:text-white"
                >
                  <SkipBack
                    size={19}
                    fill="currentColor"
                  />
                </button>

                {/* Play / Pause */}

                <button
                  type="button"
                  onClick={
                    togglePlay
                  }
                  title={
                    isPlaying
                      ? "Pause"
                      : "Play"
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause
                      size={18}
                      fill="currentColor"
                    />
                  ) : (
                    <Play
                      size={18}
                      fill="currentColor"
                      className="ml-0.5"
                    />
                  )}
                </button>

                {/* Next */}

                <button
                  type="button"
                  onClick={
                    nextSong
                  }
                  title="Next"
                  className="text-zinc-400 transition hover:text-white"
                >
                  <SkipForward
                    size={19}
                    fill="currentColor"
                  />
                </button>

                {/* Loop */}

                <button
                  type="button"
                  onClick={
                    toggleLoop
                  }
                  title={`Loop: ${loop}`}
                  className={`hidden transition sm:block ${
                    loop !== "off"
                      ? "text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {loop === "one" ? (
                    <Repeat1
                      size={18}
                    />
                  ) : (
                    <Repeat
                      size={18}
                    />
                  )}
                </button>

              </div>

              {/* Progress */}

              <div className="hidden w-full max-w-xl items-center gap-2 sm:flex">

                <span className="w-10 text-right text-[11px] text-zinc-500">
                  {formatTime(
                    progress
                  )}
                </span>

                <input
                  type="range"
                  min="0"
                  max={
                    duration ||
                    0
                  }
                  step="0.1"
                  value={Math.min(
                    progress,
                    duration ||
                      0
                  )}
                  onChange={(
                    event
                  ) =>
                    seek(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="h-1 flex-1 cursor-pointer accent-white"
                />

                <span className="w-10 text-[11px] text-zinc-500">
                  {formatTime(
                    duration
                  )}
                </span>

              </div>

            </div>

            {/* Right controls */}

            <div className="flex items-center gap-3">

              {/* Queue */}

              <button
                type="button"
                onClick={() =>
                  setShowQueue(
                    (current) =>
                      !current
                  )
                }
                title="Queue"
                className={`transition ${
                  showQueue
                    ? "text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <ListMusic
                  size={20}
                />
              </button>

              {/* Volume */}

              <div className="hidden items-center gap-2 md:flex">

                <button
                  type="button"
                  onClick={() =>
                    setVolume(
                      volume > 0
                        ? 0
                        : 1
                    )
                  }
                  title="Mute"
                  className="text-zinc-400 hover:text-white"
                >
                  {volume === 0 ? (
                    <VolumeX
                      size={18}
                    />
                  ) : (
                    <Volume2
                      size={18}
                    />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(
                    event
                  ) =>
                    setVolume(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="w-20 cursor-pointer accent-white"
                />

              </div>

            </div>

          </div>

          {/* Mobile progress */}

          <div className="mt-2 flex items-center gap-2 sm:hidden">

            <span className="text-[10px] text-zinc-500">
              {formatTime(
                progress
              )}
            </span>

            <input
              type="range"
              min="0"
              max={
                duration || 0
              }
              step="0.1"
              value={Math.min(
                progress,
                duration || 0
              )}
              onChange={(
                event
              ) =>
                seek(
                  Number(
                    event
                      .target
                      .value
                  )
                )
              }
              className="h-1 flex-1 accent-white"
            />

            <span className="text-[10px] text-zinc-500">
              {formatTime(
                duration
              )}
            </span>

          </div>

        </div>
      </footer>
    </>
  );
}