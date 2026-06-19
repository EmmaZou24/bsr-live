import { useRef, useState, type MouseEvent } from 'react'
import dogIllustration from '../../../assets/web/side-panel-dog.png'
import { ScrollingBar } from '../shared/ScrollingBar'
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

const defaultTickerText =
  'brown student & community radio ⬤ on air: hauntology of the bhlem  ⬤  up next: kosher music ⬤ '

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="side-panel__play-icon">
      <polygon points="8,5 20,12 8,19" fill="currentColor" />
    </svg>
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
  const wrapRef = useRef<HTMLDivElement>(null)
  const [badgeVisible, setBadgeVisible] = useState(false)
  const [badgePos, setBadgePos] = useState({ x: 0, y: 0 })

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return

    setBadgePos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    setBadgeVisible(true)
  }

  const handlePointerLeave = () => {
    setBadgeVisible(false)
  }

  return (
    <div
      ref={wrapRef}
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
      <span
        className={`side-panel__nav-badge${badgeVisible ? ' side-panel__nav-badge--visible' : ''}`}
        style={{
          left: badgePos.x,
          top: badgePos.y,
        }}
        aria-hidden={!badgeVisible}
      >
        UNDER CONSTRUCTION...
      </span>
    </div>
  )
}

export function SidePanel({
  expanded = false,
  showTitle = 'Hauntology of the Phlegm',
  showAuthor = 'by seigbhlem',
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
          aria-label="Play stream"
          onClick={onPlayClick}
        >
          <PlayIcon />
        </button>

        <div className="side-panel__show-info">
          <p className="side-panel__show-title">{showTitle}</p>
          <p className="side-panel__show-author">{showAuthor}</p>
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
