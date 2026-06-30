import { useEffect, useRef, useState } from 'react'
import { useLiveStream } from '../../context/LiveStreamContext'
import { initBsrTypography } from './initBsrTypography.js'
import './audioreactive-icon.css'

export function AudioreactiveIcon() {
  const containerRef = useRef<HTMLDivElement>(null)
  const connectAudioRef = useRef<(() => void) | null>(null)
  const { isPlaying, audioRef } = useLiveStream()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    const audioElement = audioRef.current
    if (!container || !audioElement) return

    const instance = initBsrTypography({
      container,
      audioElement,
      onReady: () => setLoading(false),
    })

    connectAudioRef.current = instance.connectAudio

    return () => {
      connectAudioRef.current = null
      instance.dispose()
    }
  }, [audioRef])

  useEffect(() => {
    if (loading) return
    // Bind the analyser when the stream graph exists (after first play).
    // Stay bound while paused so frequency data can decay like the demo.
    connectAudioRef.current?.()
  }, [isPlaying, loading])

  return (
    <div className="audioreactive-icon">
      {loading && <div className="audioreactive-icon__loading">Loading...</div>}
      <div className="audioreactive-icon__stage">
        <div ref={containerRef} className="audioreactive-icon__canvas" />
      </div>
    </div>
  )
}
