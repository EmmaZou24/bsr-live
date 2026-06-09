import { useEffect, useRef, useState } from 'react'
import { initBsrTypography } from './initBsrTypography.js'
import './interactive-icon.css'

export function InteractiveIcon() {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    const audioElement = audioRef.current
    if (!container || !audioElement) return

    const cleanup = initBsrTypography({
      container,
      audioElement,
      onReady: () => setLoading(false),
    })

    return cleanup
  }, [])

  return (
    <div className="interactive-icon">
      {loading && <div className="interactive-icon__loading">Loading...</div>}
      <audio
        ref={audioRef}
        src="https://listen.bsrlive.com/bsrmp3"
        crossOrigin="anonymous"
      />
      <div ref={containerRef} className="interactive-icon__canvas" />
    </div>
  )
}
