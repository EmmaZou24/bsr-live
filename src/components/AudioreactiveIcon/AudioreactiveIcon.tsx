import { useEffect, useRef, useState } from 'react'
import { useLiveStream } from '../../context/LiveStreamContext'
import type { BsrTypographyInstance } from './initBsrTypography.js'
import './audioreactive-icon.css'

export function AudioreactiveIcon() {
  const containerRef = useRef<HTMLDivElement>(null)
  const connectAudioRef = useRef<(() => void) | null>(null)
  const resetShuffleRef = useRef<(() => void) | null>(null)
  const { isPlaying, audioRef } = useLiveStream()
  const wasPausedOnMountRef = useRef(!isPlaying)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    const audioElement = audioRef.current
    if (!container || !audioElement) return

    let disposed = false
    let instance: BsrTypographyInstance | null = null

    void import('./initBsrTypography.js')
      .then(({ initBsrTypography }) => {
        if (disposed) return

        instance = initBsrTypography({
          container,
          audioElement,
          onReady: () => {
            if (!disposed) setLoading(false)
          },
        })

        if (disposed) {
          instance.dispose()
          instance = null
          return
        }

        connectAudioRef.current = instance.connectAudio
        resetShuffleRef.current = instance.resetShuffle
      })
      .catch((error: unknown) => {
        if (disposed) return
        console.error('Failed to load the audio-reactive visualizer', error)
        setLoading(false)
      })

    return () => {
      disposed = true
      connectAudioRef.current = null
      resetShuffleRef.current = null
      instance?.dispose()
    }
  }, [audioRef])

  useEffect(() => {
    if (loading) return
    // Bind only after the stream graph exists (first play). While paused, keep
    // the analyser bound so frequency data can decay — but do not create the
    // graph on idle load, or silent bins force s → 0 and hide the shuffle.
    connectAudioRef.current?.()
  }, [isPlaying, loading])

  useEffect(() => {
    if (loading) return

    if (wasPausedOnMountRef.current && !isPlaying) resetShuffleRef.current?.()
    wasPausedOnMountRef.current = false
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
