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

/*
 * GET
 *
 * Get one playlist.
 *
 * /api/navidrome/playlist?id=PLAYLIST_ID
 */
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

/*
 * POST
 *
 * Add songs to playlist.
 *
 * Body:
 *
 * {
 *   "playlistId": "...",
 *   "songIds": ["...", "..."]
 * }
 */
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

    const songIds =
      Array.isArray(body?.songIds)
        ? body.songIds.filter(
            (id: unknown) =>
              typeof id === "string" &&
              id.trim().length > 0
          )
        : [];

    if (!playlistId) {
      return NextResponse.json(
        {
          error:
            "Playlist ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (songIds.length === 0) {
      return NextResponse.json(
        {
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

    const params =
      new URLSearchParams(
        getBaseParams()
      );

    params.set(
      "playlistId",
      playlistId
    );

    /*
     * Navidrome/OpenSubsonic expects
     * songId parameters.
     *
     * Add each songId separately.
     */
   for (const songId of songIds) {
  params.append(
    "songIdToAdd",
    songId
  );
}

    console.log(
      "Updating playlist:",
      playlistId
    );

    console.log(
      "Songs:",
      songIds
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
      "Navidrome response:",
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
     * Verify that the songs were
     * actually added.
     */
    const verifyParams =
      new URLSearchParams(
        getBaseParams()
      );

    verifyParams.set(
      "id",
      playlistId
    );

    const verifyResponse =
      await fetch(
        `${baseUrl}/rest/getPlaylist.view?${verifyParams.toString()}`,
        {
          cache: "no-store",
        }
      );

    const verifyData =
      await verifyResponse.json();

    const playlist =
      verifyData?.[
        "subsonic-response"
      ]?.playlist;

    const entries =
      playlist?.entry ?? [];

    const addedSongs =
      entries.filter(
        (song: {
          id?: string;
        }) =>
          song.id &&
          songIds.includes(
            song.id
          )
      );

    return NextResponse.json({
      success: true,

      added:
        addedSongs.length,

      requested:
        songIds.length,

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
            : "Failed to add songs",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * PUT
 *
 * Rename playlist.
 *
 * Body:
 *
 * {
 *   "playlistId": "...",
 *   "name": "New Name"
 * }
 */
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
          method: "GET",
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

/*
 * DELETE
 *
 * Remove songs from playlist.
 *
 * Body:
 *
 * {
 *   "playlistId": "...",
 *   "songIndexes": [0, 2]
 * }
 *
 * Navidrome/OpenSubsonic uses
 * songIndex for removing songs.
 */
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

    const songIndexes =
      Array.isArray(
        body?.songIndexes
      )
        ? body.songIndexes.filter(
            (index: unknown) =>
              Number.isInteger(index) &&
              (index as number) >= 0
          )
        : [];

    if (!playlistId) {
      return NextResponse.json(
        {
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

    for (
      const index of songIndexes
    ) {
      params.append(
        "songIndex",
        String(index)
      );
    }

    const response =
      await fetch(
        `${baseUrl}/rest/updatePlaylist.view?${params.toString()}`,
        {
          method: "GET",
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

    return NextResponse.json({
      success: true,
      response: data,
    });
  } catch (error) {
    console.error(
      "Remove songs from playlist error:",
      error
    );

    return NextResponse.json(
      {
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