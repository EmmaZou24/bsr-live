import { useState, type MouseEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SidePanel } from '../components/web'
import { useLiveStream } from '../context/LiveStreamContext'
import { navIdToPath } from './routes'
import './page-shell.css'

type PageShellProps = {
  mode: 'push' | 'overlay'
  children: ReactNode
}

export function PageShell({ mode, children }: PageShellProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { nowPlaying, isPlaying, isStreamLoading, isLoadingNowPlaying, togglePlay } = useLiveStream()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const handleSidebarClick = () => {
    if (!sidebarExpanded) setSidebarExpanded(true)
  }

  const handleMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setSidebarExpanded((open) => !open)
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
          onPlayClick={() => {
            void togglePlay()
          }}
          onMenuClick={handleMenuClick}
          onNavClick={handleNavClick}
        />
      </div>

      <main
        className="page-shell__content"
        aria-label="Main content"
        onClick={handleContentClick}
      >
        {children}
      </main>
    </div>
  )
}
