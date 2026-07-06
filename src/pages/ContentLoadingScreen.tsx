import { useContext } from 'react'
import { ContentLoadingContext } from './ContentLoadingContext'
import './content-loading.css'

type ContentLoadingScreenProps = {
  isLoading?: boolean
  className?: string
}

export function ContentLoadingScreen({ isLoading: isLoadingProp, className = '' }: ContentLoadingScreenProps = {}) {
  const context = useContext(ContentLoadingContext)
  const isLoading = isLoadingProp ?? context?.isLoading ?? false

  if (!isLoading) return null

  return (
    <div
      className={`content-loading ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="content-loading__inner">
        <span className="content-loading__throbber" aria-hidden="true" />
        <p className="content-loading__label">Loading…</p>
      </div>
    </div>
  )
}
