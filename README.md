# bsr-live

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and fill in values as needed:

```bash
cp .env.example .env
```

Restart the dev server after changing `.env`.

## Spinitron (sidebar now-playing)

The sidebar play button and track/show info use the [Spinitron v2 API](https://spinitron.github.io/v2api/). Spinitron does not host the audio stream — it only provides playlist/schedule metadata.

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

## Live stream

Playback uses the BSR Icecast mount (`https://listen.bsrlive.com/bsrmp3` by default in production).

| Variable | Purpose |
|----------|---------|
| `VITE_STREAM_URL` | Override the stream URL used by the player and audioreactive icon |

## Same-origin stream proxy (audioreactive icon)

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
