// In dev, Vite proxies /api/stream to the Icecast mount so Web Audio can read
// frequency data (cross-origin streams are silent to the analyser). Override for
// production with VITE_STREAM_URL once a same-origin proxy is configured there.
export const BSR_STREAM_URL =
  import.meta.env.VITE_STREAM_URL ??
  (import.meta.env.DEV ? '/api/stream' : 'https://listen.bsrlive.com/bsrmp3')
