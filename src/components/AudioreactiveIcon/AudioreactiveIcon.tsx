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
    // Bind only after the stream graph exists (first play). While paused, keep
    // the analyser bound so frequency data can decay — but do not create the
    // graph on idle load, or silent bins force s → 0 and hide the shuffle.
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
