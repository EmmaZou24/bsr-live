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

function buildLineConfig(
  textWidth: number,
  containerWidth: number,
  syncContentMax: number,
  loopGap: number,
): LineScrollConfig {
  const shouldScroll = textWidth > containerWidth + 1
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
  lineRef,
}: {
  text: string
  config: LineScrollConfig
  className: string
  lineClassName: string
  lineRef?: React.RefObject<HTMLDivElement | null>
}) {
  const trackStyle = { '--scroll-duration': `${config.duration}s` } as CSSProperties

  return (
    <div ref={lineRef} className={lineClassName}>
      <div className="scrolling-show-lines__track" style={trackStyle}>
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
  lineRef,
}: {
  text: string
  className: string
  lineClassName: string
  lineRef?: React.RefObject<HTMLDivElement | null>
}): ReactNode {
  return (
    <div ref={lineRef} className={lineClassName}>
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
  const lineRef = useRef<HTMLDivElement>(null)
  const titleMeasureRef = useRef<HTMLSpanElement>(null)
  const subtitleMeasureRef = useRef<HTMLSpanElement>(null)
  const [layout, setLayout] = useState<ScrollLayout>({
    title: emptyLineConfig,
    subtitle: emptyLineConfig,
  })

  useLayoutEffect(() => {
    const container = lineRef.current
    const titleMeasure = titleMeasureRef.current
    if (!container || !titleMeasure) return

    const update = () => {
      const titleWidth = titleMeasure.offsetWidth
      const subtitleWidth = subtitle ? (subtitleMeasureRef.current?.offsetWidth ?? 0) : 0
      const containerWidth = container.clientWidth
      const loopGap = Math.max(containerWidth * 0.12, 24)

      const titleOverflows = titleWidth > containerWidth + 1
      const subtitleOverflows = subtitleWidth > containerWidth + 1
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

    return () => observer.disconnect()
  }, [title, subtitle])

  const renderLine = (
    text: string,
    config: LineScrollConfig,
    className: string,
    lineClassName: string,
    ref?: React.RefObject<HTMLDivElement | null>,
  ) =>
    config.shouldScroll ? (
      <MarqueeLine
        text={text}
        config={config}
        className={className}
        lineClassName={lineClassName}
        lineRef={ref}
      />
    ) : (
      <StaticLine text={text} className={className} lineClassName={lineClassName} lineRef={ref} />
    )

  const titleLineClass = 'scrolling-show-lines__line scrolling-show-lines__line--title'
  const subtitleLineClass = 'scrolling-show-lines__line scrolling-show-lines__line--subtitle'

  return (
    <div className="scrolling-show-lines">
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

      {renderLine(title, layout.title, titleClassName, titleLineClass, lineRef)}
      {subtitle ? renderLine(subtitle, layout.subtitle, subtitleClassName, subtitleLineClass) : null}
    </div>
  )
}
