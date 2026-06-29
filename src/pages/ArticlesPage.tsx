import { useState } from 'react'
import { PageSearch, type PageSearchFilterCategory, type PageSearchSelection } from '../components/web'
import { NavPage } from './NavPage'
import './nav-page.css'

const articleFilterCategories: PageSearchFilterCategory[] = [
  {
    id: 'coarse-types',
    multiSelect: false,
    filters: [
      { id: 'blog', label: 'BLOG' },
      { id: 'news', label: 'NEWS' },
      { id: 'interviews', label: 'INTERVIEWS' },
    ],
  },
  {
    id: 'granular-types',
    multiSelect: false,
    filters: [
      { id: 'community', label: 'COMMUNITY' },
      { id: 'new-music', label: 'NEW MUSIC' },
      { id: 'listening-guide', label: 'LISTENING GUIDE' },
      { id: 'review', label: 'REVIEW' },
      { id: 'electronic', label: 'ELECTRONIC' },
      { id: 'indie', label: 'INDIE' },
    ],
  },
]

export function ArticlesPage() {
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>({})
  const [, setSearchQuery] = useState('')

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    setSelectedFilters((current) => ({ ...current, [categoryId]: selectedIds }))
  }

  return (
    <NavPage
      title="articles"
      className="nav-page--articles"
      search={
        <PageSearch
          filterCategories={articleFilterCategories}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onSearchChange={setSearchQuery}
        />
      }
    >
      {/* Article grid content */}
    </NavPage>
  )
}
