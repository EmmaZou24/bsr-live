import './pagination.css'

export type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function ArrowIcon({ direction }: { direction: 'previous' | 'next' }) {
  const points = direction === 'previous' ? '14,3 6,8 14,13' : '6,3 14,8 6,13'

  return (
    <svg viewBox="0 0 20 16" aria-hidden="true" className="pagination__arrow">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <nav className={`pagination ${className}`.trim()} aria-label="Pagination">
      <button
        type="button"
        className="pagination__button"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        <ArrowIcon direction="previous" />
      </button>
      <span className="pagination__status" aria-live="polite">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="pagination__button"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        <ArrowIcon direction="next" />
      </button>
    </nav>
  )
}