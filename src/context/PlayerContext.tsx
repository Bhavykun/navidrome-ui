"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Song = {
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

export type LoopMode =
  | "off"
  | "all"
  | "one";

type PlayerContextType = {
  currentSong: Song | null;

  queue: Song[];
  currentIndex: number;

  isPlaying: boolean;

  progress: number;
  duration: number;

  volume: number;

  shuffle: boolean;
  loop: LoopMode;

  playSong: (
    song: Song,
    songs?: Song[]
  ) => void;

  playQueueSong: (
    index: number
  ) => void;

  addToQueue: (
    songs: Song | Song[]
  ) => void;

  playNext: (
    song: Song
  ) => void;

  removeFromQueue: (
    index: number
  ) => void;

  clearQueue: () => void;

  togglePlay: () => void;

  nextSong: () => void;

  previousSong: () => void;

  seek: (
    value: number
  ) => void;

  setVolume: (
    value: number
  ) => void;

  toggleShuffle: () => void;

  toggleLoop: () => void;
};

const PlayerContext =
  createContext<PlayerContextType | null>(
    null
  );

/*
 * Fisher-Yates shuffle.
 */
function shuffleArray<T>(
  items: T[]
): T[] {
  const result = [...items];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

export function PlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  /*
   * Actual playback queue.
   */
  const queueRef =
    useRef<Song[]>([]);

  /*
   * Original queue before shuffle.
   */
  const originalQueueRef =
    useRef<Song[]>([]);

  const currentIndexRef =
    useRef(0);

  const shuffleRef =
    useRef(false);

  const loopRef =
    useRef<LoopMode>("off");

  const [currentSong, setCurrentSong] =
    useState<Song | null>(null);

  const [queue, setQueue] =
    useState<Song[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolumeState] =
    useState(1);

  const [shuffle, setShuffle] =
    useState(false);

  const [loop, setLoop] =
    useState<LoopMode>("off");

  /*
   * Keep refs synchronized.
   */

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current =
      currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    shuffleRef.current =
      shuffle;
  }, [shuffle]);

  useEffect(() => {
    loopRef.current =
      loop;
  }, [loop]);

  /*
   * Load and play a song.
   *
   * This is the ONLY place where
   * audio.src is changed.
   */
  function loadAndPlaySong(
    song: Song
  ) {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentSong(song);

    setProgress(0);

    setDuration(
      song.duration || 0
    );

    audio.src =
      `/api/navidrome/stream?id=${encodeURIComponent(
        song.id
      )}`;

    audio.currentTime = 0;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error(
          "Playback failed:",
          error
        );

        setIsPlaying(false);
      });
  }

  /*
   * Create audio element ONCE.
   *
   * Because PlayerProvider is inside
   * RootLayout, this survives navigation.
   */
  useEffect(() => {
    const audio =
      new Audio();

    audioRef.current =
      audio;

    audio.volume = 1;

    const handleTimeUpdate =
      () => {
        setProgress(
          audio.currentTime
        );
      };

    const handleLoadedMetadata =
      () => {
        if (
          Number.isFinite(
            audio.duration
          )
        ) {
          setDuration(
            audio.duration
          );
        }
      };

    const handlePlay =
      () => {
        setIsPlaying(true);
      };

    const handlePause =
      () => {
        setIsPlaying(false);
      };

    /*
     * Automatically play next song.
     */
    const handleEnded =
      () => {
        const songs =
          queueRef.current;

        const index =
          currentIndexRef.current;

        if (
          songs.length === 0
        ) {
          setIsPlaying(false);
          return;
        }

        /*
         * Repeat current song.
         */
        if (
          loopRef.current ===
          "one"
        ) {
          audio.currentTime = 0;

          audio
            .play()
            .catch((error) => {
              console.error(
                "Loop playback failed:",
                error
              );
            });

          return;
        }

        let nextIndex =
          index + 1;

        /*
         * End of queue.
         */
        if (
          nextIndex >=
          songs.length
        ) {
          /*
           * Repeat all.
           */
          if (
            loopRef.current ===
            "all"
          ) {
            nextIndex = 0;
          } else {
            setIsPlaying(false);
            setProgress(0);
            return;
          }
        }

        const nextSong =
          songs[nextIndex];

        currentIndexRef.current =
          nextIndex;

        setCurrentIndex(
          nextIndex
        );

        loadAndPlaySong(
          nextSong
        );
      };

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "play",
      handlePlay
    );

    audio.addEventListener(
      "pause",
      handlePause
    );

    audio.addEventListener(
      "ended",
      handleEnded
    );

    return () => {
      audio.pause();

      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "play",
        handlePlay
      );

      audio.removeEventListener(
        "pause",
        handlePause
      );

      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, []);

  /*
   * PLAY SONG
   */
  function playSong(
    song: Song,
    songs?: Song[]
  ) {
    const baseQueue =
      songs &&
      songs.length > 0
        ? [...songs]
        : [song];

    /*
     * Save normal order.
     */
    originalQueueRef.current =
      [...baseQueue];

    let newQueue =
      baseQueue;

    /*
     * If shuffle is enabled,
     * current song stays first.
     */
    if (shuffleRef.current) {
      const remaining =
        baseQueue.filter(
          (item) =>
            item.id !== song.id
        );

      newQueue = [
        song,
        ...shuffleArray(
          remaining
        ),
      ];
    }

    const index =
      newQueue.findIndex(
        (item) =>
          item.id === song.id
      );

    const newIndex =
      index >= 0
        ? index
        : 0;

    queueRef.current =
      newQueue;

    currentIndexRef.current =
      newIndex;

    setQueue(newQueue);

    setCurrentIndex(
      newIndex
    );

    loadAndPlaySong(
      song
    );
  }

  /*
   * PLAY SPECIFIC QUEUE ITEM
   */
  function playQueueSong(
    index: number
  ) {
    const songs =
      queueRef.current;

    if (
      index < 0 ||
      index >= songs.length
    ) {
      return;
    }

    const song =
      songs[index];

    currentIndexRef.current =
      index;

    setCurrentIndex(index);

    loadAndPlaySong(
      song
    );
  }

  /*
   * ADD TO QUEUE
   *
   * Does NOT touch audio.
   */
  function addToQueue(
    songs: Song | Song[]
  ) {
    const songsToAdd =
      Array.isArray(songs)
        ? songs
        : [songs];

    if (
      songsToAdd.length === 0
    ) {
      return;
    }

    originalQueueRef.current =
      [
        ...originalQueueRef.current,
        ...songsToAdd,
      ];

    setQueue(
      (currentQueue) => {
        const newQueue = [
          ...currentQueue,
          ...(shuffleRef.current
            ? shuffleArray(
                songsToAdd
              )
            : songsToAdd),
        ];

        queueRef.current =
          newQueue;

        return newQueue;
      }
    );
  }

  /*
   * PLAY NEXT
   */
  function playNext(
    song: Song
  ) {
    setQueue(
      (currentQueue) => {
        const newQueue = [
          ...currentQueue,
        ];

        const insertIndex =
          currentIndexRef.current +
          1;

        /*
         * Already next.
         */
        if (
          newQueue[
            insertIndex
          ]?.id === song.id
        ) {
          return newQueue;
        }

        newQueue.splice(
          insertIndex,
          0,
          song
        );

        queueRef.current =
          newQueue;

        /*
         * Keep original queue too.
         */
        if (
          !originalQueueRef.current.some(
            (item) =>
              item.id === song.id
          )
        ) {
          originalQueueRef.current =
            [
              ...originalQueueRef.current,
              song,
            ];
        }

        return newQueue;
      }
    );
  }

  /*
   * REMOVE ONE SONG FROM QUEUE.
   *
   * Important:
   * Removing a queued song does NOT
   * change the currently playing audio.
   */
  function removeFromQueue(
    index: number
  ) {
    const currentQueue =
      queueRef.current;

    if (
      index < 0 ||
      index >= currentQueue.length
    ) {
      return;
    }

    const removedSong =
      currentQueue[index];

    /*
     * If this is the current song,
     * don't kill playback.
     *
     * We remove it from the queue
     * but keep the audio running.
     */
    const removingCurrent =
      index ===
      currentIndexRef.current;

    const newQueue =
      currentQueue.filter(
        (_, i) =>
          i !== index
      );

    /*
     * Nothing left.
     */
    if (
      newQueue.length === 0
    ) {
      clearQueue();
      return;
    }

    let newCurrentIndex =
      currentIndexRef.current;

    /*
     * Removing something before
     * current song shifts its index.
     */
    if (
      index <
      currentIndexRef.current
    ) {
      newCurrentIndex--;
    }

    /*
     * If removing current song,
     * keep the index pointing at
     * a valid queue item.
     *
     * We DO NOT start that song.
     */
    if (
      removingCurrent
    ) {
      if (
        newCurrentIndex >=
        newQueue.length
      ) {
        newCurrentIndex =
          newQueue.length - 1;
      }
    }

    /*
     * Update refs first.
     */
    queueRef.current =
      newQueue;

    currentIndexRef.current =
      newCurrentIndex;

    /*
     * Update React state.
     */
    setQueue(newQueue);

    setCurrentIndex(
      newCurrentIndex
    );

    /*
     * Remove from original queue
     * as well.
     *
     * Only remove one matching entry.
     */
    const original =
      [...originalQueueRef.current];

    const originalIndex =
      original.findIndex(
        (song) =>
          song.id ===
          removedSong.id
      );

    if (
      originalIndex !== -1
    ) {
      original.splice(
        originalIndex,
        1
      );
    }

    originalQueueRef.current =
      original;
  }

  /*
   * CLEAR EVERYTHING.
   */
  function clearQueue() {
    const audio =
      audioRef.current;

    if (audio) {
      audio.pause();

      audio.removeAttribute(
        "src"
      );

      audio.load();
    }

    queueRef.current = [];

    originalQueueRef.current =
      [];

    currentIndexRef.current =
      0;

    setQueue([]);

    setCurrentIndex(0);

    setCurrentSong(null);

    setIsPlaying(false);

    setProgress(0);

    setDuration(0);
  }

  /*
   * PLAY / PAUSE
   */
  function togglePlay() {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !currentSong
    ) {
      return;
    }

    if (audio.paused) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error(
            "Playback failed:",
            error
          );
        });
    } else {
      audio.pause();

      setIsPlaying(false);
    }
  }

  /*
   * NEXT
   */
  function nextSong() {
    const songs =
      queueRef.current;

    const index =
      currentIndexRef.current;

    if (
      songs.length === 0
    ) {
      return;
    }

    let nextIndex =
      index + 1;

    if (
      nextIndex >=
      songs.length
    ) {
      if (
        loopRef.current ===
        "all"
      ) {
        nextIndex = 0;
      } else {
        return;
      }
    }

    const song =
      songs[nextIndex];

    currentIndexRef.current =
      nextIndex;

    setCurrentIndex(
      nextIndex
    );

    loadAndPlaySong(
      song
    );
  }

  /*
   * PREVIOUS
   */
  function previousSong() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    /*
     * More than 3 seconds:
     * restart current song.
     */
    if (
      audio.currentTime > 3
    ) {
      audio.currentTime = 0;

      setProgress(0);

      return;
    }

    const songs =
      queueRef.current;

    const index =
      currentIndexRef.current;

    if (
      index > 0
    ) {
      const previousIndex =
        index - 1;

      const song =
        songs[
          previousIndex
        ];

      currentIndexRef.current =
        previousIndex;

      setCurrentIndex(
        previousIndex
      );

      loadAndPlaySong(
        song
      );

      return;
    }

    /*
     * Loop all.
     */
    if (
      loopRef.current ===
        "all" &&
      songs.length > 0
    ) {
      const previousIndex =
        songs.length - 1;

      const song =
        songs[
          previousIndex
        ];

      currentIndexRef.current =
        previousIndex;

      setCurrentIndex(
        previousIndex
      );

      loadAndPlaySong(
        song
      );

      return;
    }

    audio.currentTime = 0;

    setProgress(0);
  }

  /*
   * SEEK
   */
  function seek(
    value: number
  ) {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime =
      value;

    setProgress(value);
  }

  /*
   * VOLUME
   */
  function setVolume(
    value: number
  ) {
    const safeValue =
      Math.min(
        1,
        Math.max(0, value)
      );

    const audio =
      audioRef.current;

    if (audio) {
      audio.volume =
        safeValue;
    }

    setVolumeState(
      safeValue
    );
  }

  /*
   * SHUFFLE
   */
  function toggleShuffle() {
    const newShuffle =
      !shuffleRef.current;

    shuffleRef.current =
      newShuffle;

    setShuffle(
      newShuffle
    );

    const current =
      currentSong;

    if (!current) {
      return;
    }

    /*
     * SHUFFLE ON
     *
     * Keep current song playing.
     * Shuffle everything after it.
     */
    if (newShuffle) {
      const currentQueue =
        queueRef.current;

      const remaining =
        currentQueue.filter(
          (song) =>
            song.id !==
            current.id
        );

      const newQueue = [
        current,
        ...shuffleArray(
          remaining
        ),
      ];

      queueRef.current =
        newQueue;

      currentIndexRef.current =
        0;

      setQueue(newQueue);

      setCurrentIndex(0);

      /*
       * DO NOT reload audio.
       */
      return;
    }

    /*
     * SHUFFLE OFF
     *
     * Restore original order.
     */
    const original =
      originalQueueRef.current;

    if (
      original.length === 0
    ) {
      return;
    }

    const restored =
      [...original];

    const restoredIndex =
      restored.findIndex(
        (song) =>
          song.id ===
          current.id
      );

    if (
      restoredIndex === -1
    ) {
      return;
    }

    queueRef.current =
      restored;

    currentIndexRef.current =
      restoredIndex;

    setQueue(restored);

    setCurrentIndex(
      restoredIndex
    );

    /*
     * DO NOT reload audio.
     */
  }

  /*
   * LOOP
   *
   * off → all → one → off
   */
  function toggleLoop() {
    const newLoop =
      loopRef.current ===
      "off"
        ? "all"
        : loopRef.current ===
          "all"
        ? "one"
        : "off";

    loopRef.current =
      newLoop;

    setLoop(newLoop);
  }

  return (
    <PlayerContext.Provider
      value={{
        currentSong,

        queue,
        currentIndex,

        isPlaying,

        progress,
        duration,

        volume,

        shuffle,
        loop,

        playSong,
        playQueueSong,

        addToQueue,
        playNext,
        removeFromQueue,

        clearQueue,

        togglePlay,

        nextSong,
        previousSong,

        seek,
        setVolume,

        toggleShuffle,
        toggleLoop,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context =
    useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer must be used inside PlayerProvider"
    );
  }

  return context;
}