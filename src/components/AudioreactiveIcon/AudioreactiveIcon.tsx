import { useEffect, useRef, useState } from 'react'
import { BSR_STREAM_URL } from '../../config/stream'
import { useLiveStream } from '../../context/LiveStreamContext'
import { initBsrTypography } from './initBsrTypography.js'
import './audioreactive-icon.css'

export function AudioreactiveIcon() {
  const containerRef = useRef<HTMLDivElement>(null)
  const analyzerRef = useRef<HTMLAudioElement>(null)
  const connectAudioRef = useRef<(() => void) | null>(null)
  const disconnectAudioRef = useRef<(() => void) | null>(null)
  const { isPlaying } = useLiveStream()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    const analyzerElement = analyzerRef.current
    if (!container || !analyzerElement) return

    const instance = initBsrTypography({
      container,
      audioElement: analyzerElement,
      onReady: () => setLoading(false),
    })

    connectAudioRef.current = instance.connectAudio
    disconnectAudioRef.current = instance.disconnectAudio

    return () => {
      connectAudioRef.current = null
      disconnectAudioRef.current = null
      analyzerElement.pause()
      instance.dispose()
    }
  }, [])

  useEffect(() => {
    const analyzer = analyzerRef.current
    if (!analyzer) return

    if (!isPlaying) {
      analyzer.pause()
      disconnectAudioRef.current?.()
      return
    }

    if (analyzer.error) {
      analyzer.load()
    }

    void analyzer
      .play()
      .then(() => {
        connectAudioRef.current?.()
      })
      .catch((error) => {
        console.error('Failed to start audioreactive analyzer stream', error)
      })
  }, [isPlaying])

  return (
    <div className="audioreactive-icon">
      <audio
        ref={analyzerRef}
        src={BSR_STREAM_URL}
        muted
        preload="none"
        className="live-stream__audio"
        aria-hidden="true"
      />
      {loading && <div className="audioreactive-icon__loading">Loading...</div>}
      <div className="audioreactive-icon__stage">
        <div ref={containerRef} className="audioreactive-icon__canvas" />
      </div>
    </div>
  )
}
