import { useEffect, useMemo, useState } from 'react'
import {
  ShowProfile,
  PageSearch,
  type PageSearchFilterCategory,
  type PageSearchSelection,
} from '../components/web'
import { fetchShows } from '../lib/sanity/shows'
import type { ShowCard } from '../lib/sanity/types'
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

function getSelectedFilterLabels(
  categories: PageSearchFilterCategory[],
  selection: PageSearchSelection,
): string[] {
  return categories.flatMap((category) => {
    const selectedIds = selection[category.id] ?? []

    return selectedIds.flatMap((filterId) => {
      const filter = category.filters.find((item) => item.id === filterId)
      return filter ? [filter.label] : []
    })
  })
}

function showMatchesFilters(show: ShowCard, filterLabels: string[]): boolean {
  if (filterLabels.length === 0) return true

  const tagSet = new Set(show.tags)
  return filterLabels.every((label) => tagSet.has(label))
}

function showMatchesSearch(show: ShowCard, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = [show.showTitle, show.hosts, show.schedule, ...show.tags].join(' ').toLowerCase()

  return tokens.every((token) => haystack.includes(token))
}

export function ShowsPage() {
  const [shows, setShows] = useState<ShowCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetchShows()
      .then((data) => {
        if (!cancelled) setShows(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load shows')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    setSelectedFilters((current) => ({ ...current, [categoryId]: selectedIds }))
  }

  const visibleShows = useMemo(() => {
    const filterLabels = getSelectedFilterLabels(showFilterCategories, selectedFilters)

    return shows.filter(
      (show) => showMatchesFilters(show, filterLabels) && showMatchesSearch(show, searchQuery),
    )
  }, [shows, selectedFilters, searchQuery])

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
      {isLoading ? <p className="shows-page__status">Loading shows…</p> : null}
      {error ? <p className="shows-page__status shows-page__status--error">{error}</p> : null}
      {!isLoading && !error && visibleShows.length === 0 ? (
        <p className="shows-page__status">No shows found.</p>
      ) : null}
      <div className="shows-page__grid">
        {visibleShows.map((show) => (
          <ShowProfile
            key={show.id}
            showTitle={show.showTitle}
            hosts={show.hosts}
            schedule={show.schedule}
            imageSrc={show.imageSrc}
            imageAlt={show.imageAlt}
            tags={show.tags}
            href={show.href}
          />
        ))}
      </div>
    </NavPage>
  )
}
