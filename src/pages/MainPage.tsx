import { useState, type MouseEvent } from 'react'
import { InteractiveIcon } from '../components/InteractiveIcon'
import { SidePanel } from '../components/web'
import { ArticlesPage } from './ArticlesPage'
import { SchedulePage } from './SchedulePage'
import { ShowsPage } from './ShowsPage'
import type { NavPage } from './nav-page'
import './main-page.css'

const availableNavPages = new Set<NavPage>(['schedule', 'articles', 'shows'])

export function MainPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [page, setPage] = useState<NavPage>('home')

  const handleSidebarClick = () => {
    if (!sidebarExpanded) setSidebarExpanded(true)
  }

  const handleMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setSidebarExpanded((open) => !open)
  }

  const handleNavClick = (id: string) => {
    if (availableNavPages.has(id as NavPage)) {
      setPage(id as NavPage)
    }
  }

  return (
    <div className={`main-page ${sidebarExpanded ? 'main-page--expanded' : ''}`}>
      <div
        className="main-page__sidebar"
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
          onMenuClick={handleMenuClick}
          onNavClick={handleNavClick}
        />
      </div>

      <main className="main-page__content" aria-label="Main content">
        {page === 'home' && <InteractiveIcon />}
        {page === 'schedule' && <SchedulePage />}
        {page === 'articles' && <ArticlesPage />}
        {page === 'shows' && <ShowsPage />}
      </main>
    </div>
  )
}
