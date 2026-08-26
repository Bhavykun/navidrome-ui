import {
  NextRequest,
  NextResponse,
} from "next/server";

function getConfig() {
  const baseUrl =
    process.env.NAVIDROME_URL;

  const username =
    process.env.NAVIDROME_USER;

  const password =
    process.env.NAVIDROME_PASSWORD;

  if (
    !baseUrl ||
    !username ||
    !password
  ) {
    throw new Error(
      "Missing Navidrome configuration"
    );
  }

  return {
    baseUrl,
    username,
    password,
  };
}

function getBaseParams() {
  const {
    username,
    password,
  } = getConfig();

  return {
    u: username,
    p: password,
    v: "1.16.1",
    c: "navidrome-ui",
    f: "json",
  };
}

/* =========================================================
   GET - Get one playlist
   /api/navidrome/playlist?id=PLAYLIST_ID
   ========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const id =
      request.nextUrl.searchParams.get(
        "id"
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Missing playlist ID",
        },
        {
          status: 400,
        }
      );
    }

    const { baseUrl } =
      getConfig();

    const params =
      new URLSearchParams({
        ...getBaseParams(),
        id,
      });

    const response =
      await fetch(
        `${baseUrl}/rest/getPlaylist.view?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Navidrome request failed",
          details: data,
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      data
    );
  } catch (error) {
    console.error(
      "Playlist GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load playlist",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST - Add songs to playlist
   Prevent duplicate songs
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const playlistId =
      typeof body?.playlistId ===
      "string"
        ? body.playlistId.trim()
        : "";

    /*
     * Only accept valid string IDs.
     */
    const songIds: string[] =
      Array.isArray(
        body?.songIds
      )
        ? body.songIds.filter(
            (
              id: unknown
            ): id is string =>
              typeof id ===
                "string" &&
              id.trim().length > 0
          )
        : [];

    /*
     * Remove duplicate IDs from
     * the same request.
     */
    const uniqueSongIds: string[] = [
      ...new Set(songIds),
    ];

    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Playlist ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      uniqueSongIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "At least one song ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const { baseUrl } =
      getConfig();

    /*
     * Get the current playlist
     * before adding anything.
     */
    const getParams =
      new URLSearchParams({
        ...getBaseParams(),
        id: playlistId,
      });

    const playlistResponse =
      await fetch(
        `${baseUrl}/rest/getPlaylist.view?${getParams.toString()}`,
        {
          cache: "no-store",
        }
      );

    const playlistData =
      await playlistResponse.json();

    if (!playlistResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to read playlist",
          details:
            playlistData,
        },
        {
          status:
            playlistResponse.status,
        }
      );
    }

    /*
     * Safely extract playlist songs.
     */
    const currentSongs: Array<{
      id?: string;
    }> =
      Array.isArray(
        playlistData?.[
          "subsonic-response"
        ]?.playlist?.entry
      )
        ? playlistData[
            "subsonic-response"
          ].playlist.entry
        : [];

    /*
     * Build a set of IDs that
     * already exist.
     */
    const existingIds =
      new Set<string>();

    for (const song of currentSongs) {
      if (
        song &&
        typeof song.id ===
          "string" &&
        song.id.length > 0
      ) {
        existingIds.add(
          song.id
        );
      }
    }

    /*
     * Only add songs that don't
     * already exist.
     */
    const songsToAdd =
      uniqueSongIds.filter(
        (id) =>
          !existingIds.has(id)
      );

    /*
     * These songs were already
     * present.
     */
    const alreadyExists =
      uniqueSongIds.filter(
        (id) =>
          existingIds.has(id)
      );

    /*
     * Everything already exists.
     *
     * Do not call Navidrome.
     */
    if (songsToAdd.length === 0) {
      return NextResponse.json({
        success: true,
        added: 0,
        requested:
          uniqueSongIds.length,
        alreadyExists: true,
        addedSongIds: [],
        existingSongIds:
          alreadyExists,
        playlist:
          playlistData?.[
            "subsonic-response"
          ]?.playlist,
      });
    }

    /*
     * Add only new songs.
     *
     * Navidrome parameter:
     * songIdToAdd
     */
    const params =
      new URLSearchParams(
        getBaseParams()
      );

    params.set(
      "playlistId",
      playlistId
    );

    for (const songId of songsToAdd) {
      params.append(
        "songIdToAdd",
        songId
      );
    }

    console.log(
      "Adding songs to playlist:",
      {
        playlistId,
        songsToAdd,
        alreadyExists,
      }
    );

    const response =
      await fetch(
        `${baseUrl}/rest/updatePlaylist.view?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    console.log(
      "Navidrome updatePlaylist response:",
      JSON.stringify(
        data,
        null,
        2
      )
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Navidrome request failed",
          details: data,
        },
        {
          status:
            response.status,
        }
      );
    }

    /*
     * Verify the playlist after
     * adding the songs.
     */
    const verifyParams =
      new URLSearchParams({
        ...getBaseParams(),
        id: playlistId,
      });

    const verifyResponse =
      await fetch(
        `${baseUrl}/rest/getPlaylist.view?${verifyParams.toString()}`,
        {
          cache: "no-store",
        }
      );

    const verifyData =
      await verifyResponse.json();

    /*
     * If verification fails,
     * return the Navidrome update
     * result rather than reporting
     * a false failure.
     */
    if (!verifyResponse.ok) {
      return NextResponse.json({
        success: true,
        added:
          songsToAdd.length,
        requested:
          uniqueSongIds.length,
        alreadyExists:
          alreadyExists.length >
          0,
        addedSongIds:
          songsToAdd,
        existingSongIds:
          alreadyExists,
        response: data,
      });
    }

    const playlist =
      verifyData?.[
        "subsonic-response"
      ]?.playlist;

    const entries =
      Array.isArray(
        playlist?.entry
      )
        ? playlist.entry
        : [];

    /*
     * Verify which requested
     * songs actually exist.
     */
    const actuallyAdded =
      songsToAdd.filter(
        (id) =>
          entries.some(
            (song: {
              id?: string;
            }) =>
              song.id === id
          )
      );

    return NextResponse.json({
      success: true,

      added:
        actuallyAdded.length,

      requested:
        uniqueSongIds.length,

      alreadyExists:
        alreadyExists.length >
        0,

      addedSongIds:
        actuallyAdded,

      existingSongIds:
        alreadyExists,

      playlist,

      response: data,
    });
  } catch (error) {
    console.error(
      "Add songs to playlist error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to add songs to playlist",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT - Rename playlist
   ========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const playlistId =
      typeof body?.playlistId ===
      "string"
        ? body.playlistId.trim()
        : "";

    const name =
      typeof body?.name ===
      "string"
        ? body.name.trim()
        : "";

    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Playlist ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Playlist name is required",
        },
        {
          status: 400,
        }
      );
    }

    const { baseUrl } =
      getConfig();

    const params =
      new URLSearchParams({
        ...getBaseParams(),
        playlistId,
        name,
      });

    const response =
      await fetch(
        `${baseUrl}/rest/updatePlaylist.view?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Navidrome request failed",
          details: data,
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      response: data,
    });
  } catch (error) {
    console.error(
      "Rename playlist error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to rename playlist",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE - Remove songs from playlist
   ========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const playlistId =
      typeof body?.playlistId ===
      "string"
        ? body.playlistId.trim()
        : "";

    const rawSongIndexes: unknown[] =
      Array.isArray(
        body?.songIndexes
      )
        ? body.songIndexes
        : [];

    const songIndexes: number[] =
      rawSongIndexes.filter(
        (
          index
        ): index is number =>
          typeof index ===
            "number" &&
          Number.isInteger(index) &&
          index >= 0
      );

    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Playlist ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      songIndexes.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "At least one song index is required",
        },
        {
          status: 400,
        }
      );
    }

    const { baseUrl } =
      getConfig();

    const params =
      new URLSearchParams({
        ...getBaseParams(),
        playlistId,
      });

    /*
     * Remove songs using their
     * playlist indexes.
     */
    for (
      const index of songIndexes
    ) {
      params.append(
        "songIndexToRemove",
        String(index)
      );
    }

    const response =
      await fetch(
        `${baseUrl}/rest/updatePlaylist.view?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Navidrome request failed",
          details: data,
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json({
      success: true,
      removed:
        songIndexes.length,
      response: data,
    });
  } catch (error) {
    console.error(
      "Remove songs from playlist error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove songs from playlist",
      },
      {
        status: 500,
      }
    );
  }
}