import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type NewsAudioPlayerProps = {
  src: string
}

function formatPlayerTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'

  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const playPauseIconProps = {
  'aria-hidden': true as const,
  fill: 'currentColor',
  stroke: 'none',
}

const volumeIconProps = {
  'aria-hidden': true as const,
  fill: 'currentColor',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  absoluteStrokeWidth: true,
}

export function NewsAudioPlayer({ src }: NewsAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [src])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }, [])

  const seekToRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current
      if (!audio || !Number.isFinite(duration) || duration <= 0) return

      const clamped = Math.min(Math.max(ratio, 0), 1)
      audio.currentTime = clamped * duration
      setCurrentTime(audio.currentTime)
    },
    [duration],
  )

  const handleTrackPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const track = trackRef.current
      if (!track) return

      const updateFromPointer = (clientX: number) => {
        const rect = track.getBoundingClientRect()
        seekToRatio((clientX - rect.left) / rect.width)
      }

      updateFromPointer(event.clientX)
      track.setPointerCapture(event.pointerId)

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        if (moveEvent.pointerId !== event.pointerId) return
        updateFromPointer(moveEvent.clientX)
      }

      const handlePointerUp = (upEvent: globalThis.PointerEvent) => {
        if (upEvent.pointerId !== event.pointerId) return
        track.releasePointerCapture(event.pointerId)
        track.removeEventListener('pointermove', handlePointerMove)
        track.removeEventListener('pointerup', handlePointerUp)
        track.removeEventListener('pointercancel', handlePointerUp)
      }

      track.addEventListener('pointermove', handlePointerMove)
      track.addEventListener('pointerup', handlePointerUp)
      track.addEventListener('pointercancel', handlePointerUp)
    },
    [seekToRatio],
  )

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="article-detail__player">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        className="article-detail__player-play"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? (
          <Pause {...playPauseIconProps} className="article-detail__player-play-icon" />
        ) : (
          <Play {...playPauseIconProps} className="article-detail__player-play-icon" />
        )}
      </button>

      <div
        ref={trackRef}
        className="article-detail__player-track-wrap"
        onPointerDown={handleTrackPointerDown}
      >
        <div className="article-detail__player-track">
          <span
            className="article-detail__player-thumb"
            style={{ left: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <span className="article-detail__player-time" aria-live="polite">
        <span>{formatPlayerTime(currentTime)}</span>
        <span aria-hidden="true">/</span>
        <span>{formatPlayerTime(duration)}</span>
      </span>

      <button
        type="button"
        className="article-detail__player-volume"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <VolumeX {...volumeIconProps} className="article-detail__player-volume-icon" />
        ) : (
          <Volume2 {...volumeIconProps} className="article-detail__player-volume-icon" />
        )}
      </button>
    </div>
  )
}
