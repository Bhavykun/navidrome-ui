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
     * Check the Subsonic response
     * status explicitly.
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
     * Navidrome may return an empty
     * playlist object for createPlaylist.
     *
     * So fetch playlists again and
     * find the newly-created one.
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

    const playlists =
      verifyData?.[
        "subsonic-response"
      ]?.playlists?.playlist ??
      [];

    const createdPlaylist =
      playlists.find(
        (playlist: {
          name?: string;
        }) =>
          playlist.name ===
          name
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