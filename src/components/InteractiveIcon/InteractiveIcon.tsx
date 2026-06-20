import { useEffect, useRef, useState } from 'react'
import { useLiveStream } from '../../context/LiveStreamContext'
import { initBsrTypography } from './initBsrTypography.js'
import './interactive-icon.css'

export function InteractiveIcon() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { audioRef } = useLiveStream()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    const audioElement = audioRef.current
    if (!container || !audioElement) return

    return initBsrTypography({
      container,
      audioElement,
      onReady: () => setLoading(false),
    })
  }, [audioRef])

  return (
    <div className="interactive-icon">
      {loading && <div className="interactive-icon__loading">Loading...</div>}
      <div className="interactive-icon__stage">
        <div ref={containerRef} className="interactive-icon__canvas" />
      </div>
    </div>
  )
}
