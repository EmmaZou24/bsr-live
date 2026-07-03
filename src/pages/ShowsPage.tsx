import { useMemo, useState } from 'react'
import {
  ShowProfile,
  PageSearch,
  type PageSearchFilterCategory,
  type PageSearchSelection,
} from '../components/web'
import djCover from '../assets/web/dj-cover.jpg'
import { NavPage } from './NavPage'
import './nav-page.css'

type MockShow = {
  id: string
  showTitle: string
  hosts: string
  schedule: string
  tags: string[]
  imageAlt: string
}

const mockShows: MockShow[] = [
  {
    id: 'something-in-your-ear',
    showTitle: "There's Something In Your Ear",
    hosts: 'by Xandi Pink & Allie Heffner',
    schedule: 'Tuesdays @ 7pm',
    tags: ['ELECTRONIC', 'SOUL'],
    imageAlt: 'DJ portrait in the studio',
  },
  {
    id: 'hauntology-phlegm',
    showTitle: 'Hauntology of the Phlegm',
    hosts: 'by seigbhlem',
    schedule: 'Wednesdays @ 9pm',
    tags: ['TALK', 'ELECTRONIC'],
    imageAlt: 'Host at the mic',
  },
  {
    id: 'kosher-music',
    showTitle: 'Kosher Music',
    hosts: 'by kosher music',
    schedule: 'Thursdays @ 6pm',
    tags: ['INDIE', 'SOUL'],
    imageAlt: 'Vinyl records and headphones',
  },
  {
    id: 'late-night-rave',
    showTitle: 'Basement Frequency',
    hosts: 'by DJ Lumen',
    schedule: 'Fridays @ 11pm',
    tags: ['RAVE', 'ELECTRONIC'],
    imageAlt: 'Club lighting setup',
  },
  {
    id: 'hip-hop-hour',
    showTitle: 'Providence Cypher',
    hosts: 'by MC North & DJ Crate',
    schedule: 'Saturdays @ 4pm',
    tags: ['HIP HOP', 'SOUL'],
    imageAlt: 'Turntables and microphone',
  },
  {
    id: 'reggae-garden',
    showTitle: 'Island Time',
    hosts: 'by Ras Irie',
    schedule: 'Sundays @ 2pm',
    tags: ['REGGAE', 'INDIE'],
    imageAlt: 'Reggae show poster art',
  },
  {
    id: 'comedy-on-air',
    showTitle: 'Dead Air Society',
    hosts: 'by The Bit Brigade',
    schedule: 'Mondays @ 8pm',
    tags: ['COMEDY', 'TALK'],
    imageAlt: 'Comedy radio hosts laughing',
  },
]

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

function showMatchesFilters(show: MockShow, filterLabels: string[]): boolean {
  if (filterLabels.length === 0) return true

  const tagSet = new Set(show.tags)
  return filterLabels.every((label) => tagSet.has(label))
}

export function ShowsPage() {
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>({})
  const [, setSearchQuery] = useState('')

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    setSelectedFilters((current) => ({ ...current, [categoryId]: selectedIds }))
  }

  const visibleShows = useMemo(() => {
    const filterLabels = getSelectedFilterLabels(showFilterCategories, selectedFilters)
    return mockShows.filter((show) => showMatchesFilters(show, filterLabels))
  }, [selectedFilters])

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
      <div className="shows-page__grid">
        {visibleShows.map((show) => (
          <ShowProfile
            key={show.id}
            showTitle={show.showTitle}
            hosts={show.hosts}
            schedule={show.schedule}
            imageSrc={djCover}
            imageAlt={show.imageAlt}
            tags={show.tags}
          />
        ))}
      </div>
    </NavPage>
  )
}
