import './title-search.css'

export type PageSearchFilter = {
  id: string
  label: string
}

export type PageSearchProps = {
  searchPlaceholder?: string
  filters?: PageSearchFilter[]
  activeFilterId?: string
  onSearchChange?: (value: string) => void
  onFilterChange?: (id: string) => void
  className?: string
}

const defaultFilters: PageSearchFilter[] = [
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="page-search__icon">
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PageSearch({
  searchPlaceholder = 'What are you looking for?',
  filters = defaultFilters,
  activeFilterId,
  onSearchChange,
  onFilterChange,
  className = '',
}: PageSearchProps) {
  return (
    <div className={`page-search ${className}`.trim()}>
      <label className="page-search__field">
        <SearchIcon />
        <input
          type="search"
          className="page-search__input"
          placeholder={searchPlaceholder}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </label>

      {filters.length > 0 && (
        <div className="page-search__filters" role="list" aria-label="Filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="listitem"
              className={`page-search__filter ${activeFilterId === filter.id ? 'page-search__filter--active' : ''}`}
              onClick={() => onFilterChange?.(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
