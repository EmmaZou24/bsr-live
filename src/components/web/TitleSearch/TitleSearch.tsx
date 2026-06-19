import titleIllustration from '../../../assets/web/title-illustration.png'
import { ScrollingBar } from '../shared/ScrollingBar'
import './title-search.css'

export type TitleSearchFilter = {
  id: string
  label: string
}

export type TitleSearchProps = {
  title?: string
  tickerText?: string
  searchPlaceholder?: string
  filters?: TitleSearchFilter[]
  activeFilterId?: string
  onSearchChange?: (value: string) => void
  onFilterChange?: (id: string) => void
  className?: string
}

const defaultFilters: TitleSearchFilter[] = [
  { id: 'blog', label: 'BLOG' },
  { id: 'news', label: 'NEWS' },
  { id: 'interviews', label: 'INTERVIEWS' },
  { id: 'community', label: 'COMMUNITY' },
  { id: 'new-music', label: 'NEW MUSIC' },
  { id: 'listening-guide', label: 'LISTENING GUIDE' },
  { id: 'review', label: 'REVIEW' },
  { id: 'electronic', label: 'ELECTRONIC' },
  { id: 'indie', label: 'INDIE' },
]

const defaultTickerText =
  'brown student & community radio ⬤ on air: hauntology of the bhlem  ⬤  up next: kosher music ⬤ brown student & community radio ⬤ on air: hauntology of the bhlem  ⬤  up next: kosher music ⬤  '

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="title-search__search-icon">
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TitleSearch({
  title = 'articles',
  tickerText = defaultTickerText,
  searchPlaceholder = 'What are you looking for?',
  filters = defaultFilters,
  activeFilterId,
  onSearchChange,
  onFilterChange,
  className = '',
}: TitleSearchProps) {
  return (
    <header className={`title-search ${className}`.trim()}>
      <div className="title-search__hero">
        <ScrollingBar text={tickerText} variant="light" />

        <div className="title-search__title-row">
          <h1 className="title-search__title">{title}</h1>
          <img
            src={titleIllustration}
            alt=""
            className="title-search__illustration"
          />
        </div>
      </div>

      <div className="title-search__toolbar">
        <label className="title-search__search">
          <SearchIcon />
          <input
            type="search"
            className="title-search__search-input"
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </label>

        <div className="title-search__filters" role="list" aria-label="Article filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="listitem"
              className={`title-search__filter ${activeFilterId === filter.id ? 'title-search__filter--active' : ''}`}
              onClick={() => onFilterChange?.(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
