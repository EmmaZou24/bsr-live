import { useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_TICKER_TEXT } from '../../../lib/spinitron/ticker'
import dogIllustration from '../../../assets/web/side-panel-dog.png'
import { ScrollingBar } from '../shared/ScrollingBar'
import { ScrollingShowLines } from '../shared/ScrollingShowLines'
import './side-panel.css'

export type SidePanelTab = 'about' | 'chat' | 'show-details'

export type SidePanelNavAvailability = 'available' | 'unavailable'

export type SidePanelNavItem = {
  id: string
  label: string
  href?: string
  availability?: SidePanelNavAvailability
}

export type SidePanelProps = {
  expanded?: boolean
  showTitle?: string
  showAuthor?: string
  isPlaying?: boolean
  isStreamLoading?: boolean
  isLoadingNowPlaying?: boolean
  activeTab?: SidePanelTab
  aboutText?: string
  tickerText?: string
  navItems?: SidePanelNavItem[]
  onPlayClick?: () => void
  onMenuClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  onTabChange?: (tab: SidePanelTab) => void
  onNavClick?: (id: string) => void
  className?: string
}

const defaultNavItems: SidePanelNavItem[] = [
  { id: 'schedule', label: 'schedule', availability: 'available' },
  { id: 'articles', label: 'articles', availability: 'available' },
  { id: 'shows', label: 'shows', availability: 'available' },
  { id: 'events', label: 'events', availability: 'unavailable' },
  { id: 'archive', label: 'archive', availability: 'unavailable' },
  { id: 'support', label: 'support', availability: 'unavailable' },
]

const defaultAboutText =
  'Welcome to Brown Student and Community Radio, radio for the curious listener. Our programming is 100% freeform, led by Brown students and Providence community members.'

const defaultTickerText = DEFAULT_TICKER_TEXT

function PlayIcon() {
  return (
    <span className="side-panel__transport-icon-wrap" aria-hidden="true">
      <svg viewBox="0 0 29.3308 23.1568" className="side-panel__play-icon" fill="none">
        <path d="M13.8253 0.457475C14.2193 -0.152491 15.1115 -0.152492 15.5054 0.457474L29.1692 21.6142C29.5989 22.2796 29.1212 23.1568 28.3291 23.1568H1.00164C0.209528 23.1568 -0.26814 22.2796 0.161602 21.6142L13.8253 0.457475Z" fill="currentColor" />
      </svg>
    </span>
  )
}

function PauseIcon() {
  return (
    <span className="side-panel__transport-icon-wrap" aria-hidden="true">
      <svg viewBox="0 0 31 24" className="side-panel__pause-icon" fill="none">
        <rect x="7.5" y="3" width="5" height="18" fill="currentColor" />
        <rect x="18.5" y="3" width="5" height="18" fill="currentColor" />
      </svg>
    </span>
  )
}

function PlayThrobber() {
  return (
    <span className="side-panel__transport-icon-wrap" aria-hidden="true">
      <span className="side-panel__play-throbber" />
    </span>
  )
}

function MenuIcon({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`side-panel__menu-icon ${vertical ? 'side-panel__menu-icon--vertical' : ''}`.trim()}
    >
      <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 32 16" aria-hidden="true" className="side-panel__arrow-icon">
      <line x1="2" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="2" />
      <polyline
        points="18,3 26,8 18,13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UnavailableNavItem({ label }: { label: string }) {
  const [badgeVisible, setBadgeVisible] = useState(false)
  const [badgePos, setBadgePos] = useState({ x: 0, y: 0 })

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    setBadgePos({
      x: event.clientX,
      y: event.clientY,
    })
    setBadgeVisible(true)
  }

  const handlePointerLeave = () => {
    setBadgeVisible(false)
  }

  return (
    <div
      className="side-panel__nav-item-wrap side-panel__nav-item-wrap--unavailable"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <button
        type="button"
        className="side-panel__nav-item side-panel__nav-item--unavailable"
        aria-disabled={true}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="side-panel__nav-item-label">{label}</span>
      </button>
      {badgeVisible
        ? createPortal(
            <span
              className="side-panel__nav-badge side-panel__nav-badge--visible side-panel__nav-badge--portaled"
              style={{
                left: badgePos.x,
                top: badgePos.y,
              }}
              aria-hidden={false}
            >
              UNDER CONSTRUCTION...
            </span>,
            document.body,
          )
        : null}
    </div>
  )
}

export function SidePanel({
  expanded = false,
  showTitle = 'Brown Student Radio',
  showAuthor = 'Live on BSR',
  isPlaying = false,
  isStreamLoading = false,
  isLoadingNowPlaying = false,
  activeTab: controlledTab,
  aboutText = defaultAboutText,
  tickerText = defaultTickerText,
  navItems = defaultNavItems,
  onPlayClick,
  onMenuClick,
  onTabChange,
  onNavClick,
  className = '',
}: SidePanelProps) {
  const [internalTab, setInternalTab] = useState<SidePanelTab>('about')
  const activeTab = controlledTab ?? internalTab

  const handleTabChange = (tab: SidePanelTab, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (controlledTab === undefined) setInternalTab(tab)
    onTabChange?.(tab)
  }
  const tabs: { id: SidePanelTab; label: string }[] = [
    { id: 'about', label: 'ABOUT' },
    { id: 'chat', label: 'CHAT' },
    { id: 'show-details', label: 'SHOW DETAILS' },
  ]

  return (
    <aside className={`side-panel ${expanded ? 'side-panel--expanded' : ''} ${className}`.trim()}>
      <div className="side-panel__header">
        <button
          type="button"
          className="side-panel__play"
          aria-label={
            isStreamLoading ? 'Loading stream' : isPlaying ? 'Pause stream' : 'Play stream'
          }
          aria-pressed={isPlaying}
          aria-busy={isStreamLoading}
          disabled={isStreamLoading}
          onClick={(event) => {
            event.stopPropagation()
            onPlayClick?.()
          }}
        >
          {isStreamLoading ? <PlayThrobber /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="side-panel__show-info">
          {isLoadingNowPlaying ? (
            <div className="scrolling-show-lines__line scrolling-show-lines__line--title">
              <p className="side-panel__show-title">Loading…</p>
            </div>
          ) : (
            <>
            <ScrollingShowLines
              title={showTitle}
              subtitle={showAuthor}
              titleClassName="side-panel__show-title"
              subtitleClassName="side-panel__show-author"
            />
            </>
          )}
        </div>

        <button
          type="button"
          className="side-panel__menu"
          aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
          aria-expanded={expanded}
          onClick={onMenuClick}
        >
          <MenuIcon vertical={!expanded} />
        </button>
      </div>

      <div className="side-panel__content">
        <div className="side-panel__tabs" role="tablist" aria-label="Show sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`side-panel-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`side-panel-panel-${tab.id}`}
              className={`side-panel__tab ${activeTab === tab.id ? 'side-panel__tab--active' : ''}`}
              onClick={(event) => handleTabChange(tab.id, event)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="side-panel__tab-panel"
          role="tabpanel"
          id={`side-panel-panel-${activeTab}`}
          aria-labelledby={`side-panel-tab-${activeTab}`}
        >
          {activeTab === 'about' && (
            <>
              <p className="side-panel__about-text">{aboutText}</p>
              <img
                src={dogIllustration}
                alt=""
                className="side-panel__illustration"
              />
            </>
          )}
          {activeTab === 'chat' && <p className="side-panel__about-text">chat</p>}
        </div>
      </div>

      <nav className="side-panel__nav" aria-label="Site navigation">
        {navItems.map((item) => {
          const isAvailable = item.availability !== 'unavailable'

          if (!isAvailable) {
            return <UnavailableNavItem key={item.id} label={item.label} />
          }

          return (
            <div
              key={item.id}
              className="side-panel__nav-item-wrap side-panel__nav-item-wrap--available"
            >
              <button
                type="button"
                className="side-panel__nav-item"
                onClick={(event) => {
                  event.stopPropagation()
                  onNavClick?.(item.id)
                }}
              >
                <span className="side-panel__nav-item-label">{item.label}</span>
                <ArrowIcon />
              </button>
            </div>
          )
        })}
      </nav>

      <ScrollingBar text={tickerText} variant="dark" className="side-panel__ticker" />
    </aside>
  )
}
