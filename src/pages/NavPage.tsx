import { type ReactNode } from 'react'
import { PageTitle } from '../components/web'
import './nav-page.css'

type NavPageProps = {
  title: string
  search?: ReactNode
  className?: string
  children?: ReactNode
}

export function NavPage({ title, search, className = '', children }: NavPageProps) {
  return (
    <div className={`nav-page ${className}`.trim()}>
      <PageTitle title={title} />
      {search}
      <div className="nav-page__body">{children}</div>
    </div>
  )
}
