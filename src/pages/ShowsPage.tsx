import { useState } from 'react'
import { PageSearch, type PageSearchFilterCategory, type PageSearchSelection } from '../components/web'
import { NavPage } from './NavPage'
import './nav-page.css'

const showFilterCategories: PageSearchFilterCategory[] = [
  {
    id: 'genre',
    multiSelect: true,
    filters: [
      { id: 'soul', label: 'SOUL' },
      { id: 'reggae', label: 'REGGAE' },
      { id: 'indie', label: 'INDIE' },
      { id: 'talk', label: 'TALK' },
      { id: 'hip-hop', label: 'HIP HOP' },
      { id: 'comedy', label: 'COMEDY' },
      { id: 'rave', label: 'RAVE' },
      { id: 'electronic', label: 'ELECTRONIC' },
    ],
  },
]

export function ShowsPage() {
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>({})
  const [, setSearchQuery] = useState('')

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    setSelectedFilters((current) => ({ ...current, [categoryId]: selectedIds }))
  }

  return (
    <NavPage
      title="shows"
      className="nav-page--shows"
      search={
        <PageSearch
          filterCategories={showFilterCategories}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onSearchChange={setSearchQuery}
        />
      }
    >
      {/* Shows content */}
    </NavPage>
  )
}
