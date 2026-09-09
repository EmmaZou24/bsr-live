// Use a same-origin stream proxy so Web Audio can read the stream without the
// browser hitting the upstream host directly. Override with VITE_STREAM_URL if
// the deployment proxy is configured elsewhere.
export const BSR_STREAM_URL = import.meta.env.VITE_STREAM_URL ?? '/api/stream'
