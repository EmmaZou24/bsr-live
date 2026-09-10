import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'

type ScrollbarMetrics = {
  trackHeight: number
  thumbHeight: number
  thumbTop: number
  insetTop: number
  insetBottom: number
  canScroll: boolean
}

type DragState = {
  pointerId: number
  startY: number
  startScrollTop: number
}

type TrackGeometry = {
  trackHeight: number
  thumbHeight: number
  insetTop: number
  insetBottom: number
  thumbTravel: number
}

const THUMB_HEIGHT_FALLBACK = 30

function readCssLength(scrollElement: HTMLElement, variable: string): number {
  const probe = document.createElement('div')
  probe.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'pointer-events:none',
    'height:0',
    'width:0',
    'overflow:hidden',
    `padding-top:var(${variable})`,
  ].join(';')
  scrollElement.appendChild(probe)
  const length = parseFloat(getComputedStyle(probe).paddingTop) || 0
  probe.remove()
  return length
}

function getThumbHeight(scrollElement: HTMLElement): number {
  const thumb = scrollElement.querySelector<HTMLElement>('.article-detail__divider-handle')
  return thumb?.offsetHeight || THUMB_HEIGHT_FALLBACK
}

function getTrackInsets(scrollElement: HTMLElement): { insetTop: number; insetBottom: number } {
  return {
    insetTop: readCssLength(scrollElement, '--bsr-article-detail-scrollbar-inset-top'),
    insetBottom: readCssLength(scrollElement, '--bsr-article-detail-scrollbar-inset-bottom'),
  }
}

function getTrackHeight(scrollElement: HTMLElement): number {
  const divider = scrollElement.querySelector<HTMLElement>('.article-detail__divider')
  const footer = scrollElement.querySelector<HTMLElement>('.site-footer')
  if (!divider || !footer) return scrollElement.clientHeight

  const previousHeight = divider.style.height
  divider.style.height = '0px'

  const scrollRect = scrollElement.getBoundingClientRect()
  const footerBottom = footer.getBoundingClientRect().bottom
  const footerBottomInContent = footerBottom - scrollRect.top + scrollElement.scrollTop

  divider.style.height = previousHeight
  return Math.max(scrollElement.clientHeight, footerBottomInContent)
}

function getTrackGeometry(scrollElement: HTMLElement): TrackGeometry {
  const trackHeight = getTrackHeight(scrollElement)
  const thumbHeight = getThumbHeight(scrollElement)
  const { insetTop, insetBottom } = getTrackInsets(scrollElement)
  const thumbTravel = Math.max(trackHeight - thumbHeight - insetTop - insetBottom, 0)

  return { trackHeight, thumbHeight, insetTop, insetBottom, thumbTravel }
}

function getMetrics(scrollElement: HTMLElement): ScrollbarMetrics {
  const { scrollTop, scrollHeight, clientHeight } = scrollElement
  const { trackHeight, thumbHeight, insetTop, insetBottom, thumbTravel } =
    getTrackGeometry(scrollElement)
  const maxScroll = Math.max(scrollHeight - clientHeight, 0)

  if (maxScroll <= 0) {
    return {
      trackHeight,
      thumbHeight,
      thumbTop: insetTop,
      insetTop,
      insetBottom,
      canScroll: false,
    }
  }

  const thumbTop = insetTop + (thumbTravel === 0 ? 0 : (scrollTop / maxScroll) * thumbTravel)

  return { trackHeight, thumbHeight, thumbTop, insetTop, insetBottom, canScroll: true }
}

export function useArticleDetailScrollbar(contentReady: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<ScrollbarMetrics>({
    trackHeight: 0,
    thumbHeight: 0,
    thumbTop: 0,
    insetTop: 0,
    insetBottom: 0,
    canScroll: false,
  })
  const dragState = useRef<DragState | null>(null)

  const syncMetrics = useCallback(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return
    setMetrics(getMetrics(scrollElement))
  }, [])

  const scrollToThumbTop = useCallback((thumbTop: number) => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const { scrollHeight, clientHeight } = scrollElement
    const maxScroll = Math.max(scrollHeight - clientHeight, 0)
    const { insetTop, insetBottom, thumbTravel } = getTrackGeometry(scrollElement)
    const minThumbTop = insetTop
    const maxThumbTop = scrollElement.clientHeight - getThumbHeight(scrollElement) - insetBottom
    const clampedThumbTop = Math.min(Math.max(thumbTop, minThumbTop), maxThumbTop)
    const relativeThumbTop = clampedThumbTop - insetTop
    const nextScrollTop = thumbTravel === 0 ? 0 : (relativeThumbTop / thumbTravel) * maxScroll

    scrollElement.scrollTop = nextScrollTop
    setMetrics(getMetrics(scrollElement))
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement || !contentReady) return

    syncMetrics()
    requestAnimationFrame(syncMetrics)

    const handleScroll = () => syncMetrics()
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', syncMetrics)

    const resizeObserver = new ResizeObserver(syncMetrics)
    resizeObserver.observe(scrollElement)
    if (scrollElement.firstElementChild) {
      resizeObserver.observe(scrollElement.firstElementChild)
    }

    const divider = scrollElement.querySelector('.article-detail__divider')
    if (divider) resizeObserver.observe(divider)

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', syncMetrics)
      resizeObserver.disconnect()
    }
  }, [contentReady, syncMetrics])

  const handleThumbPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const scrollElement = scrollRef.current
      if (!scrollElement || !metrics.canScroll) return

      event.preventDefault()
      event.stopPropagation()

      dragState.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startScrollTop: scrollElement.scrollTop,
      }

      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [metrics.canScroll],
  )

  const handleThumbPointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const scrollElement = scrollRef.current
    const drag = dragState.current
    if (!scrollElement || !drag || drag.pointerId !== event.pointerId) return

    const { scrollHeight, clientHeight } = scrollElement
    const maxScroll = Math.max(scrollHeight - clientHeight, 0)
    const { thumbTravel } = getTrackGeometry(scrollElement)
    const scrollPerPixel = thumbTravel === 0 ? 0 : maxScroll / thumbTravel
    const deltaY = event.clientY - drag.startY

    scrollElement.scrollTop = drag.startScrollTop + deltaY * scrollPerPixel
  }, [])

  const handleThumbPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragState.current
      if (!drag || drag.pointerId !== event.pointerId) return

      dragState.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      syncMetrics()
    },
    [syncMetrics],
  )

  const handleTrackPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const scrollElement = scrollRef.current
      if (!scrollElement || !metrics.canScroll) return
      if (event.target !== event.currentTarget) return

      const rect = event.currentTarget.getBoundingClientRect()
      const clickY = event.clientY - rect.top
      const minThumbTop = metrics.insetTop
      const maxThumbTop = metrics.trackHeight - metrics.thumbHeight - metrics.insetBottom
      const thumbTop = Math.min(
        Math.max(clickY - metrics.thumbHeight / 2, minThumbTop),
        maxThumbTop,
      )

      scrollToThumbTop(thumbTop)
    },
    [
      metrics.canScroll,
      metrics.insetBottom,
      metrics.insetTop,
      metrics.thumbHeight,
      metrics.trackHeight,
      scrollToThumbTop,
    ],
  )

  const handleTrackWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    scrollElement.scrollTop += event.deltaY
    event.preventDefault()
  }, [])

  return {
    scrollRef,
    metrics,
    handleThumbPointerDown,
    handleThumbPointerMove,
    handleThumbPointerUp,
    handleTrackPointerDown,
    handleTrackWheel,
  }
}
