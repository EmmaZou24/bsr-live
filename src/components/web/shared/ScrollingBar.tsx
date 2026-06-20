import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { TICKER_SEPARATOR } from '../../../lib/spinitron/ticker'
import './scrolling-bar.css'

type ScrollingBarProps = {
  text: string
  variant?: 'dark' | 'light'
  className?: string
}

const SCROLL_SPEED_PX_PER_SECOND = 48
const TICKER_DOT = TICKER_SEPARATOR.trim()

function renderScrollingContent(text: string) {
  const parts = text.split(TICKER_DOT)

  return parts.flatMap((part, index) => {
    const nodes = [<span key={`part-${index}`}>{part}</span>]

    if (index < parts.length - 1) {
      nodes.push(<span key={`dot-${index}`} className="scrolling-bar__dot" aria-hidden="true" />)
    }

    return nodes
  })
}

export function ScrollingBar({ text, variant = 'dark', className = '' }: ScrollingBarProps) {
  const segmentRef = useRef<HTMLParagraphElement>(null)
  const [duration, setDuration] = useState(24)

  useLayoutEffect(() => {
    const segment = segmentRef.current
    if (!segment) return

    const updateDuration = () => {
      const width = segment.offsetWidth
      if (width <= 0) return
      setDuration(width / SCROLL_SPEED_PX_PER_SECOND)
    }

    updateDuration()

    const observer = new ResizeObserver(updateDuration)
    observer.observe(segment)

    return () => observer.disconnect()
  }, [text])

  return (
    <div className={`scrolling-bar scrolling-bar--${variant} ${className}`.trim()}>
      <div
        className="scrolling-bar__track"
        style={{ '--scroll-duration': `${duration}s` } as CSSProperties}
      >
        <p ref={segmentRef} className="scrolling-bar__text">
          {renderScrollingContent(text)}
        </p>
        <p className="scrolling-bar__text" aria-hidden="true">
          {renderScrollingContent(text)}
        </p>
      </div>
    </div>
  )
}
