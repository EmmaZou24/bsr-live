import './title-search.css'

export type PageSearchFilter = {
  id: string
  label: string
}

export type PageSearchFilterCategory = {
  id: string
  label?: string
  multiSelect?: boolean
  filters: PageSearchFilter[]
}

export type PageSearchSelection = Record<string, string[]>

export type PageSearchSelectedTag = {
  categoryId: string
  filterId: string
  label: string
}

export type PageSearchProps = {
  searchPlaceholder?: string
  filterCategories?: PageSearchFilterCategory[]
  selectedFilters?: PageSearchSelection
  onSearchChange?: (value: string) => void
  onFilterChange?: (categoryId: string, selectedIds: string[]) => void
  className?: string
}

function toggleFilterSelection(
  category: PageSearchFilterCategory,
  filterId: string,
  selectedIds: string[],
): string[] {
  const isSelected = selectedIds.includes(filterId)

  if (category.multiSelect) {
    return isSelected ? selectedIds.filter((id) => id !== filterId) : [...selectedIds, filterId]
  }

  return isSelected ? [] : [filterId]
}

function getSelectedTags(
  filterCategories: PageSearchFilterCategory[],
  selectedFilters: PageSearchSelection,
): PageSearchSelectedTag[] {
  return filterCategories.flatMap((category) => {
    const selectedIds = selectedFilters[category.id] ?? []

    return selectedIds.flatMap((filterId) => {
      const filter = category.filters.find((item) => item.id === filterId)
      if (!filter) return []

      return [{ categoryId: category.id, filterId, label: filter.label }]
    })
  })
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="page-search__icon">
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TagRemoveIcon() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="page-search__tag-remove-icon">
      <line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PageSearch({
  searchPlaceholder = 'What are you looking for?',
  filterCategories = [],
  selectedFilters = {},
  onSearchChange,
  onFilterChange,
  className = '',
}: PageSearchProps) {
  const selectedTags = getSelectedTags(filterCategories, selectedFilters)
  const hasFilters = filterCategories.some((category) => category.filters.length > 0)

  return (
    <div className={`page-search ${className}`.trim()}>
      <label className="page-search__field">
        <SearchIcon />

        {selectedTags.length > 0 && (
          <div className="page-search__tags">
            {selectedTags.map((tag) => {
              const categorySelection = selectedFilters[tag.categoryId] ?? []

              return (
                <span key={`${tag.categoryId}-${tag.filterId}`} className="page-search__tag">
                  {tag.label}
                  <button
                    type="button"
                    className="page-search__tag-remove"
                    aria-label={`Remove ${tag.label} filter`}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      onFilterChange?.(
                        tag.categoryId,
                        categorySelection.filter((id) => id !== tag.filterId),
                      )
                    }}
                  >
                    <TagRemoveIcon />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        <input
          type="search"
          className="page-search__input"
          placeholder={searchPlaceholder}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </label>

      {hasFilters && (
        <div className="page-search__filters" role="toolbar" aria-label="Filters">
          {filterCategories.map((category) => {
            if (category.filters.length === 0) return null

            const categorySelection = selectedFilters[category.id] ?? []

            return (
              <div
                key={category.id}
                className="page-search__filter-group"
                role="group"
                aria-label={category.label ?? category.id}
              >
                {category.filters.map((filter) => {
                  const isActive = categorySelection.includes(filter.id)

                  return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`page-search__filter ${isActive ? 'page-search__filter--active' : ''}`}
                    aria-pressed={isActive}
                    onClick={() =>
                      onFilterChange?.(
                        category.id,
                        toggleFilterSelection(category, filter.id, categorySelection),
                      )
                    }
                  >
                    {filter.label}
                  </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
