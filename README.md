This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Northstar

A modern web frontend for [Navidrome](https://www.navidrome.org/), built with Next.js. Browse your music library, play songs, manage queues, and organize playlists from a responsive desktop and mobile interface.

## Features

- Browse songs, albums, artists, and playlists
- Search across the complete music library
- Play albums, playlists, artists, or individual songs
- Persistent audio player across route changes
- Queue management with play next, remove, clear, shuffle, and repeat
- Seek and volume controls
- Playback quality modes for lower-bandwidth connections
- Create, rename, and delete playlists
- Add individual songs or complete albums to playlists
- Remove playlist songs without changing the player queue
- Responsive desktop sidebar and mobile navigation
- Lazy-loaded artwork with fallbacks
- Navidrome credentials kept server-side
- Login with encrypted HTTP-only sessions
- Logout from the shared navigation

## Requirements

- Node.js 20 or newer
- npm
- A running Navidrome server
- A Navidrome user with access to the music library
- A long random `AUTH_SECRET` for session encryption

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd navidrome-ui
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Navidrome

Create `.env.local` in the project root:

```env
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USER=your-navidrome-username
NAVIDROME_PASSWORD=your-navidrome-password
AUTH_SECRET=replace-with-a-long-random-secret
```

`NAVIDROME_URL` should be the Navidrome origin without a trailing API path. For example:

```env
NAVIDROME_URL=https://music.example.com
```

Never commit `.env.local` or expose these values in client-side code.
`AUTH_SECRET` is used to encrypt the login session cookie. Generate a strong random value for it and keep it private.
The login form accepts the public Navidrome or Tailscale Funnel URL directly. Do not expose usernames or passwords through `NEXT_PUBLIC_*` variables.

### 4. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port `3000` is busy, Next.js reports the alternate port it selects.

## Production

```bash
npm run build
npm run start
```

The production server requires the three Navidrome variables and `AUTH_SECRET`.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with webpack |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Testing

Unit tests use [Vitest](https://vitest.dev/) with a jsdom environment. The suite covers shared music rules that are easy to regress: duration formatting, song search and sorting, playlist editability, duplicate song IDs, queue clearing, and repeat behavior. It also covers the login workflow, invalid credentials, and password visibility.

Run the tests with:

```bash
npm test
```

## Application Routes

| Route | Purpose |
| --- | --- |
| `/` | Home dashboard |
| `/songs` | Searchable song library and queue actions |
| `/albums` | Album library and album playlist actions |
| `/album/[id]` | Album details and song actions |
| `/artists` | Artist library |
| `/artist/[id]` | Artist details and albums |
| `/playlists` | Playlist library |
| `/playlists/[id]` | Playlist details and management |
| `/search` | Global library search |
| `/login` | Navidrome account login |

## Architecture

The project uses the Next.js App Router with React client components for interactive library and playback features.

- `src/app/`: Pages and server-side API proxy routes
- `src/components/`: Shared navigation, artwork, and player UI
- `src/context/PlayerContext.tsx`: Persistent audio session and queue state
- `src/app/api/navidrome/`: Server-side Subsonic/Navidrome proxy endpoints
- `public/`: Static assets

The browser communicates with local `/api/navidrome/*` routes. Those routes call Navidrome using `.env.local`, so the password is not sent to the browser.

## Playback Notes

The audio element is created once by `PlayerProvider` and survives client-side navigation. Adding, removing, shuffling, or clearing queue entries does not replace the active audio source. Only an explicit play action changes the stream URL.

The stream proxy forwards HTTP range requests so seeking works with supported Navidrome media formats.

Playback quality can be selected from the Profile page. Data Saver uses 96 kbps, Balanced uses 160 kbps, High uses 320 kbps, and Original disables the bitrate limit. The selected mode applies when the next song starts and does not interrupt the current track.

## Troubleshooting

### Missing Navidrome configuration

Confirm that `.env.local` exists in the project root and contains all three variables. Restart the development server after changing environment variables.

### Cannot connect to Navidrome

Check that Navidrome is running and reachable from the machine running Next.js. Verify the URL, username, password, and reverse-proxy or firewall rules.

### Browser tab still shows the old icon

Browsers cache favicons aggressively. Hard refresh the page or close and reopen the tab after restarting the development server.

## Security

- Keep Navidrome credentials in server-only environment variables.
- Do not commit `.env.local`.
- Use HTTPS when exposing the application outside a trusted local network.
- Put authentication in front of the application before deploying it publicly.

## License

No license has been specified for this repository yet. Add a license before distributing the project publicly.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
