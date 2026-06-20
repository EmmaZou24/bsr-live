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
import { fetchNowPlaying, isSpinitronConfigured } from '../lib/spinitron/client'
import type { NowPlaying } from '../lib/spinitron/types'

const NOW_PLAYING_POLL_MS = 30_000

const defaultNowPlaying: NowPlaying = {
  title: 'Brown Student Radio',
  subtitle: 'Live on BSR',
}

type LiveStreamContextValue = {
  audioRef: RefObject<HTMLAudioElement | null>
  nowPlaying: NowPlaying
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isStreamLoading, setIsStreamLoading] = useState(false)
  const [isLoadingNowPlaying, setIsLoadingNowPlaying] = useState(isSpinitronConfigured())

  const refreshNowPlaying = useCallback(async () => {
    if (!isSpinitronConfigured()) {
      setIsLoadingNowPlaying(false)
      return
    }

    try {
      const next = await fetchNowPlaying()
      setNowPlaying(next)
    } catch (error) {
      console.error('Failed to load now playing from Spinitron', error)
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

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      if (audio.error) {
        audio.load()
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

    audio.pause()
  }, [])

  return (
    <LiveStreamContext.Provider
      value={{
        audioRef,
        nowPlaying,
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
        preload="none"
        className="live-stream__audio"
        onPlaying={() => {
          setIsPlaying(true)
          setIsStreamLoading(false)
        }}
        onPause={() => {
          setIsPlaying(false)
          setIsStreamLoading(false)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setIsStreamLoading(false)
        }}
        onError={() => {
          setIsPlaying(false)
          setIsStreamLoading(false)
          console.error('Live stream playback error', audioRef.current?.error)
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
