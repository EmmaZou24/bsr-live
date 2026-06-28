import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { TICKER_SEPARATOR } from '../../../lib/spinitron/ticker'
import './scrolling-bar.css'

type ScrollingBarProps = {
  text: string
  variant?: 'dark' | 'light'
  className?: string
}

type ScrollLayout = {
  repeats: number
  segmentWidth: number
  duration: number
  ready: boolean
}

const SCROLL_SPEED_PX_PER_SECOND = 48
const TICKER_DOT = TICKER_SEPARATOR.trim()

const defaultLayout: ScrollLayout = {
  repeats: 1,
  segmentWidth: 0,
  duration: 24,
  ready: false,
}

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

function renderSegmentCopies(text: string, repeats: number, keyPrefix: string): ReactNode {
  return Array.from({ length: repeats }, (_, index) => (
    <span key={`${keyPrefix}-${index}`} className="scrolling-bar__copy">
      {renderScrollingContent(text)}
    </span>
  ))
}

export function ScrollingBar({ text, variant = 'dark', className = '' }: ScrollingBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [layout, setLayout] = useState<ScrollLayout>(defaultLayout)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const update = () => {
      const containerWidth = container.clientWidth
      const textWidth = Math.ceil(measure.getBoundingClientRect().width)
      if (containerWidth <= 0 || textWidth <= 0) return

      const repeats = Math.max(1, Math.ceil(containerWidth / textWidth))
      const segmentWidth = textWidth * repeats

      setLayout({
        repeats,
        segmentWidth,
        duration: segmentWidth / SCROLL_SPEED_PX_PER_SECOND,
        ready: true,
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(measure)

    document.fonts?.ready.then(update).catch(() => {})

    return () => observer.disconnect()
  }, [text])

  const trackStyle = {
    '--scroll-duration': `${layout.duration}s`,
    '--segment-width': `${layout.segmentWidth}px`,
  } as CSSProperties

  return (
    <div
      ref={containerRef}
      className={`scrolling-bar scrolling-bar--${variant} ${className}`.trim()}
    >
      <span
        ref={measureRef}
        className="scrolling-bar__measure scrolling-bar__text"
        aria-hidden="true"
      >
        {renderScrollingContent(text)}
      </span>

      <div
        className={`scrolling-bar__track ${layout.ready ? 'scrolling-bar__track--ready' : ''}`.trim()}
        style={trackStyle}
      >
        <div className="scrolling-bar__segment">{renderSegmentCopies(text, layout.repeats, 'a')}</div>
        <div className="scrolling-bar__segment" aria-hidden="true">
          {renderSegmentCopies(text, layout.repeats, 'b')}
        </div>
      </div>
    </div>
  )
}
