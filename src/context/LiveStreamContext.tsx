import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { BSR_STREAM_URL } from '../config/stream'
import {
  fetchLiveBroadcast,
  getDefaultLiveBroadcast,
  isSpinitronConfigured,
} from '../lib/spinitron/client'
import { DEFAULT_TICKER_TEXT, formatTickerText } from '../lib/spinitron/ticker'
import { resumeStreamAudio } from '../lib/streamAudioGraph'
import type { NowPlaying } from '../lib/spinitron/types'

const NOW_PLAYING_POLL_MS = 30_000
const STREAM_STALL_TIMEOUT_MS = 15_000
const STREAM_RECONNECT_DELAYS_MS = [0, 1_000, 3_000, 10_000, 30_000]

const defaultLive = getDefaultLiveBroadcast()

const defaultNowPlaying: NowPlaying = defaultLive.nowPlaying

type LiveStreamContextValue = {
  audioRef: RefObject<HTMLAudioElement | null>
  nowPlaying: NowPlaying
  tickerText: string
  isPlaying: boolean
  isStreamLoading: boolean
  isLoadingNowPlaying: boolean
  isSpinitronEnabled: boolean
  togglePlay: () => Promise<void>
}

const LiveStreamContext = createContext<LiveStreamContextValue | null>(null)

export function LiveStreamProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(defaultNowPlaying)
  const [tickerText, setTickerText] = useState(DEFAULT_TICKER_TEXT)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isStreamLoading, setIsStreamLoading] = useState(false)
  const [isLoadingNowPlaying, setIsLoadingNowPlaying] = useState(isSpinitronConfigured())
  const shouldReconnectStreamRef = useRef(false)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const stallTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)

  const refreshNowPlaying = useCallback(async () => {
    if (!isSpinitronConfigured()) {
      setIsLoadingNowPlaying(false)
      return
    }

    try {
      const live = await fetchLiveBroadcast()
      setNowPlaying(live.nowPlaying)
      setTickerText(formatTickerText(live.ticker))
    } catch (error) {
      console.error('Failed to load live broadcast data from Spinitron', error)
    } finally {
      setIsLoadingNowPlaying(false)
    }
  }, [])

  useEffect(() => {
    void refreshNowPlaying()

    if (!isSpinitronConfigured()) return

    const intervalId = window.setInterval(() => {
      void refreshNowPlaying()
    }, NOW_PLAYING_POLL_MS)

    return () => window.clearInterval(intervalId)
  }, [refreshNowPlaying])

  const preloadStream = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    audio.load()
  }, [])

  const scheduleStreamPreload = useCallback(() => {
    queueMicrotask(() => {
      preloadStream()
    })
  }, [preloadStream])

  const clearStreamTimers = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (stallTimeoutRef.current !== null) {
      window.clearTimeout(stallTimeoutRef.current)
      stallTimeoutRef.current = null
    }
  }, [])

  const reconnectStream = useCallback(() => {
    if (!shouldReconnectStreamRef.current || reconnectTimeoutRef.current !== null) return

    const audio = audioRef.current
    if (!audio) return

    const attempt = reconnectAttemptRef.current
    const delay =
      STREAM_RECONNECT_DELAYS_MS[Math.min(attempt, STREAM_RECONNECT_DELAYS_MS.length - 1)]

    setIsStreamLoading(true)
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null
      if (!shouldReconnectStreamRef.current) return

      reconnectAttemptRef.current += 1
      audio.load()
      void audio.play().catch((error) => {
        if (!shouldReconnectStreamRef.current) return
        console.error('Failed to reconnect live stream', error)
        reconnectStream()
      })
    }, delay)
  }, [])

  const scheduleStreamReconnect = useCallback(() => {
    clearStreamTimers()
    reconnectStream()
  }, [clearStreamTimers, reconnectStream])

  useEffect(() => {
    if (document.readyState === 'complete') {
      preloadStream()
      return
    }

    window.addEventListener('load', preloadStream, { once: true })
    return () => window.removeEventListener('load', preloadStream)
  }, [preloadStream])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      shouldReconnectStreamRef.current = true
      reconnectAttemptRef.current = 0
      clearStreamTimers()

      if (audio.error) {
        preloadStream()
      }

      setIsStreamLoading(true)

      try {
        await audio.play()
      } catch (error) {
        setIsStreamLoading(false)
        setIsPlaying(false)
        console.error('Failed to start live stream', error)
      }
      return
    }

    shouldReconnectStreamRef.current = false
    clearStreamTimers()
    audio.pause()
  }, [clearStreamTimers, preloadStream])

  useEffect(() => {
    return () => {
      shouldReconnectStreamRef.current = false
      clearStreamTimers()
    }
  }, [clearStreamTimers])

  return (
    <LiveStreamContext.Provider
      value={{
        audioRef,
        nowPlaying,
        tickerText,
        isPlaying,
        isStreamLoading,
        isLoadingNowPlaying,
        isSpinitronEnabled: isSpinitronConfigured(),
        togglePlay,
      }}
    >
      <audio
        ref={audioRef}
        src={BSR_STREAM_URL}
        crossOrigin="anonymous"
        preload="none"
        className="live-stream__audio"
        onPlaying={() => {
          const audio = audioRef.current
          if (!audio || audio.paused) return
          clearStreamTimers()
          reconnectAttemptRef.current = 0
          resumeStreamAudio(audio)
          setIsPlaying(true)
          setIsStreamLoading(false)
        }}
        onPause={() => {
          setIsPlaying(false)
          setIsStreamLoading(false)
          if (shouldReconnectStreamRef.current) {
            scheduleStreamReconnect()
          } else {
            scheduleStreamPreload()
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          setIsStreamLoading(false)
          if (shouldReconnectStreamRef.current) scheduleStreamReconnect()
        }}
        onError={() => {
          setIsPlaying(false)
          if (shouldReconnectStreamRef.current) {
            scheduleStreamReconnect()
          } else {
            setIsStreamLoading(false)
          }
          console.error('Live stream playback error', audioRef.current?.error)
        }}
        onStalled={() => {
          if (!shouldReconnectStreamRef.current || stallTimeoutRef.current !== null) return
          stallTimeoutRef.current = window.setTimeout(() => {
            stallTimeoutRef.current = null
            if (shouldReconnectStreamRef.current) scheduleStreamReconnect()
          }, STREAM_STALL_TIMEOUT_MS)
        }}
        onWaiting={() => {
          if (!shouldReconnectStreamRef.current || stallTimeoutRef.current !== null) return
          stallTimeoutRef.current = window.setTimeout(() => {
            stallTimeoutRef.current = null
            if (shouldReconnectStreamRef.current) scheduleStreamReconnect()
          }, STREAM_STALL_TIMEOUT_MS)
        }}
      />
      {children}
    </LiveStreamContext.Provider>
  )
}

export function useLiveStream(): LiveStreamContextValue {
  const context = useContext(LiveStreamContext)
  if (!context) {
    throw new Error('useLiveStream must be used within LiveStreamProvider')
  }
  return context
}
