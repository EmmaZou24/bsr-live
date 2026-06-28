import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import './scrolling-show-lines.css'

type ScrollingShowLinesProps = {
  title: string
  subtitle?: string
  titleClassName?: string
  subtitleClassName?: string
}

type LineScrollConfig = {
  shouldScroll: boolean
  textWidth: number
  contentMax: number
  loopGap: number
  duration: number
}

type ScrollLayout = {
  title: LineScrollConfig
  subtitle: LineScrollConfig
}

const SCROLL_SPEED_PX_PER_SECOND = 32
const OVERFLOW_TOLERANCE_PX = 2

function measureTextWidth(element: HTMLElement | null): number {
  if (!element) return 0
  return Math.ceil(element.getBoundingClientRect().width)
}

function lineOverflows(textWidth: number, containerWidth: number): boolean {
  return containerWidth > 0 && textWidth > containerWidth + OVERFLOW_TOLERANCE_PX
}

function buildLineConfig(
  textWidth: number,
  containerWidth: number,
  syncContentMax: number,
  loopGap: number,
): LineScrollConfig {
  const shouldScroll = lineOverflows(textWidth, containerWidth)
  const contentMax = shouldScroll ? syncContentMax : textWidth
  const segmentWidth = contentMax + loopGap

  return {
    shouldScroll,
    textWidth,
    contentMax,
    loopGap,
    duration: shouldScroll ? segmentWidth / SCROLL_SPEED_PX_PER_SECOND : 12,
  }
}

function MarqueeSegment({
  text,
  textWidth,
  contentMax,
  loopGap,
  className,
}: {
  text: string
  textWidth: number
  contentMax: number
  loopGap: number
  className: string
}) {
  const alignSpacer = contentMax - textWidth

  return (
    <div className="scrolling-show-lines__segment">
      <span className={className}>{text}</span>
      {alignSpacer > 0 ? (
        <span className="scrolling-show-lines__spacer" style={{ width: alignSpacer }} aria-hidden="true" />
      ) : null}
      <span className="scrolling-show-lines__loop-gap" style={{ width: loopGap }} aria-hidden="true" />
    </div>
  )
}

function MarqueeLine({
  text,
  config,
  className,
  lineClassName,
}: {
  text: string
  config: LineScrollConfig
  className: string
  lineClassName: string
}) {
  const trackStyle = { '--scroll-duration': `${config.duration}s` } as CSSProperties

  return (
    <div className={lineClassName}>
      <div className="scrolling-show-lines__track scrolling-show-lines__track--scrolling" style={trackStyle}>
        <MarqueeSegment
          text={text}
          textWidth={config.textWidth}
          contentMax={config.contentMax}
          loopGap={config.loopGap}
          className={className}
        />
        <div aria-hidden="true">
          <MarqueeSegment
            text={text}
            textWidth={config.textWidth}
            contentMax={config.contentMax}
            loopGap={config.loopGap}
            className={className}
          />
        </div>
      </div>
    </div>
  )
}

function StaticLine({
  text,
  className,
  lineClassName,
}: {
  text: string
  className: string
  lineClassName: string
}): ReactNode {
  return (
    <div className={lineClassName}>
      <p className={className}>{text}</p>
    </div>
  )
}

const emptyLineConfig: LineScrollConfig = {
  shouldScroll: false,
  textWidth: 0,
  contentMax: 0,
  loopGap: 0,
  duration: 12,
}

export function ScrollingShowLines({
  title,
  subtitle,
  titleClassName = '',
  subtitleClassName = '',
}: ScrollingShowLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleMeasureRef = useRef<HTMLSpanElement>(null)
  const subtitleMeasureRef = useRef<HTMLSpanElement>(null)
  const [layout, setLayout] = useState<ScrollLayout>({
    title: emptyLineConfig,
    subtitle: emptyLineConfig,
  })

  useLayoutEffect(() => {
    const container = containerRef.current
    const titleMeasure = titleMeasureRef.current
    if (!container || !titleMeasure) return

    const update = () => {
      const containerWidth = Math.floor(container.getBoundingClientRect().width)
      const titleWidth = measureTextWidth(titleMeasure)
      const subtitleWidth = subtitle ? measureTextWidth(subtitleMeasureRef.current) : 0
      const loopGap = Math.max(containerWidth * 0.12, 24)

      const titleOverflows = lineOverflows(titleWidth, containerWidth)
      const subtitleOverflows = lineOverflows(subtitleWidth, containerWidth)
      const syncScroll = titleOverflows && subtitleOverflows
      const syncContentMax = syncScroll ? Math.max(titleWidth, subtitleWidth) : 0

      setLayout({
        title: buildLineConfig(
          titleWidth,
          containerWidth,
          syncScroll ? syncContentMax : titleWidth,
          loopGap,
        ),
        subtitle: buildLineConfig(
          subtitleWidth,
          containerWidth,
          syncScroll ? syncContentMax : subtitleWidth,
          loopGap,
        ),
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(container)
    observer.observe(titleMeasure)
    if (subtitleMeasureRef.current) observer.observe(subtitleMeasureRef.current)

    document.fonts?.ready.then(update).catch(() => {})

    return () => observer.disconnect()
  }, [title, subtitle])

  const renderLine = (
    text: string,
    config: LineScrollConfig,
    className: string,
    lineClassName: string,
  ) =>
    config.shouldScroll ? (
      <MarqueeLine text={text} config={config} className={className} lineClassName={lineClassName} />
    ) : (
      <StaticLine text={text} className={className} lineClassName={lineClassName} />
    )

  const titleLineClass = 'scrolling-show-lines__line scrolling-show-lines__line--title'
  const subtitleLineClass = 'scrolling-show-lines__line scrolling-show-lines__line--subtitle'

  return (
    <div ref={containerRef} className="scrolling-show-lines">
      <span
        ref={titleMeasureRef}
        className={`scrolling-show-lines__measure ${titleClassName}`.trim()}
        aria-hidden="true"
      >
        {title}
      </span>
      {subtitle ? (
        <span
          ref={subtitleMeasureRef}
          className={`scrolling-show-lines__measure ${subtitleClassName}`.trim()}
          aria-hidden="true"
        >
          {subtitle}
        </span>
      ) : null}

      {renderLine(title, layout.title, titleClassName, titleLineClass)}
      {subtitle ? renderLine(subtitle, layout.subtitle, subtitleClassName, subtitleLineClass) : null}
    </div>
  )
}
