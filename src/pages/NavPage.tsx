import { type ReactNode, type Ref } from 'react'
import { PageTitle } from '../components/web'
import './nav-page.css'

type NavPageProps = {
  title?: string
  hideTitle?: boolean
  search?: ReactNode
  className?: string
  bodyRef?: Ref<HTMLDivElement>
  children?: ReactNode
}

export function NavPage({
  title,
  hideTitle = false,
  search,
  className = '',
  bodyRef,
  children,
}: NavPageProps) {
  return (
    <div className={`nav-page ${className}`.trim()}>
      {!hideTitle && title ? <PageTitle title={title} /> : null}
      {search}
      <div ref={bodyRef} className="nav-page__body">
        {children}
      </div>
    </div>
  )
}
