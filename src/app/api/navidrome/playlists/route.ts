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

function baseParams() {
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
 * /api/navidrome/playlists
 */
export async function GET() {
  try {
    const { baseUrl } =
      getConfig();

    const params =
      new URLSearchParams(
        baseParams()
      );

    const response =
      await fetch(
        `${baseUrl}/rest/getPlaylists.view?${params.toString()}`,
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

    return NextResponse.json(
      data
    );
  } catch (error) {
    console.error(
      "GET playlists error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load playlists",
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
 * Create playlist.
 *
 * Body:
 *
 * {
 *   "name": "My Playlist"
 * }
 *
 * Duplicate names are prevented
 * case-insensitively.
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const name =
      typeof body?.name ===
      "string"
        ? body.name.trim()
        : "";

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

    /*
     * -------------------------------------------------------
     * STEP 1
     * Check existing playlists BEFORE creating.
     * -------------------------------------------------------
     */

    const checkParams =
      new URLSearchParams(
        baseParams()
      );

    const checkResponse =
      await fetch(
        `${baseUrl}/rest/getPlaylists.view?${checkParams.toString()}`,
        {
          cache: "no-store",
        }
      );

    const checkData =
      await checkResponse.json();

    if (!checkResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to check existing playlists",
          details:
            checkData,
        },
        {
          status:
            checkResponse.status,
        }
      );
    }

    const existingPlaylists: Array<{
      id?: string;
      name?: string;
      songCount?: number;
      duration?: number;
      coverArt?: string;
      owner?: string;
      public?: boolean;
      readonly?: boolean;
    }> =
      Array.isArray(
        checkData?.[
          "subsonic-response"
        ]?.playlists?.playlist
      )
        ? checkData[
            "subsonic-response"
          ].playlists.playlist
        : [];

    /*
     * Case-insensitive duplicate check.
     *
     * These are considered the same:
     *
     * Test Playlist
     * test playlist
     * TEST PLAYLIST
     * Test Playlist
     */

    const normalizedName =
      name.toLowerCase();

    const existingPlaylist =
      existingPlaylists.find(
        (playlist) =>
          typeof playlist.name ===
            "string" &&
          playlist.name
            .trim()
            .toLowerCase() ===
            normalizedName
      );

    /*
     * -------------------------------------------------------
     * DUPLICATE FOUND
     * -------------------------------------------------------
     */

    if (existingPlaylist) {
  return NextResponse.json({
    success: true,
    created: false,
    alreadyExists: true,
    playlist:
      existingPlaylist,
    message:
      "A playlist with this name already exists.",
  });
}

    /*
     * -------------------------------------------------------
     * STEP 2
     * Playlist doesn't exist.
     * Create it.
     * -------------------------------------------------------
     */

    const params =
      new URLSearchParams({
        ...baseParams(),
        name,
      });

    console.log(
      "Creating Navidrome playlist:",
      name
    );

    const response =
      await fetch(
        `${baseUrl}/rest/createPlaylist.view?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const data =
      await response.json();

    console.log(
      "Navidrome createPlaylist:",
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
     * Check Subsonic status.
     */

    const subsonic =
      data?.[
        "subsonic-response"
      ];

    if (
      subsonic?.status !==
      "ok"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Navidrome rejected playlist creation",
          details: data,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * STEP 3
     * Fetch playlists again to get
     * the actual created playlist.
     * -------------------------------------------------------
     */

    const verifyParams =
      new URLSearchParams(
        baseParams()
      );

    const verifyResponse =
      await fetch(
        `${baseUrl}/rest/getPlaylists.view?${verifyParams.toString()}`,
        {
          cache: "no-store",
        }
      );

    const verifyData =
      await verifyResponse.json();

    if (!verifyResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Playlist was created, but verification failed",
          details:
            verifyData,
        },
        {
          status:
            verifyResponse.status,
        }
      );
    }

    const playlists: Array<{
      id?: string;
      name?: string;
      songCount?: number;
      duration?: number;
      coverArt?: string;
      owner?: string;
      public?: boolean;
      readonly?: boolean;
    }> =
      Array.isArray(
        verifyData?.[
          "subsonic-response"
        ]?.playlists?.playlist
      )
        ? verifyData[
            "subsonic-response"
          ].playlists.playlist
        : [];

    /*
     * Find the created playlist
     * case-insensitively.
     */

    const createdPlaylist =
      playlists.find(
        (playlist) =>
          typeof playlist.name ===
            "string" &&
          playlist.name
            .trim()
            .toLowerCase() ===
            normalizedName
      );

    if (!createdPlaylist) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Navidrome reported success, but the playlist could not be found afterward.",
          name,
          navidromeResponse:
            data,
          playlistsResponse:
            verifyData,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      created: true,
      alreadyExists: false,
      playlist:
        createdPlaylist,
    });
  } catch (error) {
    console.error(
      "Create playlist error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create playlist",
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
 * Body:
 *
 * {
 *   "id": "playlist-id"
 * }
 */
export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      typeof body?.id ===
      "string"
        ? body.id.trim()
        : "";

    if (!id) {
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

    const { baseUrl } =
      getConfig();

    const params =
      new URLSearchParams({
        ...baseParams(),
        id,
      });

    const response =
      await fetch(
        `${baseUrl}/rest/deletePlaylist.view?${params.toString()}`,
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
      "Delete playlist error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete playlist",
      },
      {
        status: 500,
      }
    );
  }
}