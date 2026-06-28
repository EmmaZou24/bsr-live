import { useState } from 'react'
import { PageSearch } from '../components/web'
import { NavPage } from './NavPage'
import './nav-page.css'

export function ArticlesPage() {
  const [activeFilterId, setActiveFilterId] = useState<string | undefined>()
  const [, setSearchQuery] = useState('')

  return (
    <NavPage
      title="articles"
      className="nav-page--articles"
      search={
        <PageSearch
          activeFilterId={activeFilterId}
          onFilterChange={setActiveFilterId}
          onSearchChange={setSearchQuery}
        />
      }
    >
      {/* Article grid content */}
    </NavPage>
  )
}
