# bsr-live

## TODO

### Overall
- Accessibility

### Main Page
- Setup navigation from subpages to main page
- Overflow scrolling of song info on top of sidebar
- Chat

### Schedule
- Spinitron spinitron spinitron
- Header component

### Articles
- Header component
- Articles card component
- Figure out CMS; how does it interact with the subpage system?

### Shows
- Header component
- Articles card component
- Figure out if CMS is appropriate here; is it possible to just drop a CSV into the codebase instead?

## Setup / Config

```bash
npm install
npm run dev
```

### Environment

Copy `.env.example` to `.env` and fill in values as needed:

```bash
cp .env.example .env #Copies the file
```

Restart the dev server after changing `.env`.

### Spinitron (sidebar now-playing & ticker)

The sidebar header and bottom ticker use the [Spinitron v2 API](https://spinitron.github.io/v2api/). Spinitron does not host the audio stream — it only provides playlist/schedule metadata.

The ticker scrolls: `101.1fm brown student and community radio ⬤ on air: … ⬤ up next: …`

1. Log in to Spinitron → **Admin → Automation & API**
2. Copy your API key into `.env`:

   ```
   VITE_SPINITRON_API_TOKEN=your_key_here
   ```

**Local dev:** Vite proxies `/api/spinitron` → `https://spinitron.com/api` and attaches the Bearer token server-side (browsers cannot call Spinitron directly).

**Production:** You need a server-side proxy that forwards requests to `https://spinitron.com/api` with `Authorization: Bearer <token>`. Then set:

```
VITE_SPINITRON_API_BASE=https://your-domain.com/api/spinitron
```

Without a token, playback still works; the sidebar shows fallback text instead of live track info.

### Live stream

Playback uses the BSR Icecast mount (`https://listen.bsrlive.com/bsrmp3` by default in production).

| Variable | Purpose |
|----------|---------|
| `VITE_STREAM_URL` | Override the stream URL used by the player and audioreactive icon |

### Same-origin stream proxy (audioreactive icon)

The home-page audioreactive icon reads audio via the Web Audio API. Browsers block frequency analysis on cross-origin streams, so the stream must be served from the **same origin** as the site for the icon to react to music.

**Local dev:** Handled automatically. `BSR_STREAM_URL` defaults to `/api/stream`, and Vite proxies that to `https://listen.bsrlive.com/bsrmp3`.

**Production:** Configure your host (e.g. nginx) to proxy `/api/stream` to the Icecast mount, then set:

```
VITE_STREAM_URL=/api/stream
```

Example nginx location:

```nginx
location /api/stream {
  proxy_pass https://listen.bsrlive.com/bsrmp3;
  proxy_http_version 1.1;
  proxy_set_header Host listen.bsrlive.com;
  proxy_buffering off;
}
```

Without a same-origin proxy, audio playback works but the audioreactive icon will not respond to the stream.
