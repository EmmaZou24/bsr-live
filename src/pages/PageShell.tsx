import { useState, type MouseEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ScrollingBar, SidePanel } from '../components/web'
import { useLiveStream } from '../context/LiveStreamContext'
import { ContentLoadingProvider } from './ContentLoadingContext'
import { ContentLoadingScreen } from './ContentLoadingScreen'
import { navIdToPath, ROUTES } from './routes'
import './page-shell.css'

type PageShellProps = {
  mode: 'push' | 'overlay'
  children: ReactNode
}

export function PageShell({ mode, children }: PageShellProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { nowPlaying, tickerText, isPlaying, isStreamLoading, isLoadingNowPlaying, togglePlay } =
    useLiveStream()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const handleSidebarClick = () => {
    if (!sidebarExpanded) setSidebarExpanded(true)
  }

  const handleHomeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (sidebarExpanded) setSidebarExpanded(false)
    if (pathname !== ROUTES.home) navigate(ROUTES.home)
  }

  const handleContentClick = () => {
    if (sidebarExpanded) setSidebarExpanded(false)
  }

  const handleNavClick = (id: string) => {
    const path = navIdToPath[id]
    if (!path) return

    if (path === pathname) {
      if (sidebarExpanded) setSidebarExpanded(false)
      return
    }

    if (sidebarExpanded) setSidebarExpanded(false)
    navigate(path)
  }

  return (
    <div
      className={`page-shell page-shell--${mode} ${sidebarExpanded ? 'page-shell--expanded' : ''}`.trim()}
    >
      <div
        className="page-shell__sidebar"
        onClick={handleSidebarClick}
        onKeyDown={(event) => {
          if (!sidebarExpanded && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            setSidebarExpanded(true)
          }
        }}
        role="button"
        tabIndex={sidebarExpanded ? -1 : 0}
        aria-label={sidebarExpanded ? undefined : 'Expand sidebar'}
      >
        <SidePanel
          expanded={sidebarExpanded}
          showTitle={nowPlaying.title}
          showAuthor={nowPlaying.subtitle}
          isPlaying={isPlaying}
          isStreamLoading={isStreamLoading}
          isLoadingNowPlaying={isLoadingNowPlaying}
          tickerText={tickerText}
          onPlayClick={() => {
            void togglePlay()
          }}
          onHomeClick={handleHomeClick}
          onNavClick={handleNavClick}
        />
      </div>

      <main
        className="page-shell__content"
        aria-label="Main content"
        onClick={handleContentClick}
      >
        <ContentLoadingProvider>
          {mode === 'overlay' && (
            <ScrollingBar text={tickerText} variant="light" className="page-shell__ticker" />
          )}
          {children}
          <ContentLoadingScreen />
        </ContentLoadingProvider>
      </main>
    </div>
  )
}
