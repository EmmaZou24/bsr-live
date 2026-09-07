import { type ReactNode, type Ref } from 'react'
import { Footer, PageTitle } from '../components/web'
import { ContentLoadingScreen } from './ContentLoadingScreen'
import './nav-page.css'

type NavPageProps = {
  title?: string
  hideTitle?: boolean
  search?: ReactNode
  isLoading?: boolean
  className?: string
  bodyRef?: Ref<HTMLDivElement>
  children?: ReactNode
}

export function NavPage({
  title,
  hideTitle = false,
  search,
  isLoading = false,
  className = '',
  bodyRef,
  children,
}: NavPageProps) {
  return (
    <div className={`nav-page ${className}`.trim()}>
      {!hideTitle && title ? <PageTitle title={title} /> : null}
      {search}
      <div ref={bodyRef} className="nav-page__body">
        <ContentLoadingScreen isLoading={isLoading} />
        {children}
        <Footer />
      </div>
    </div>
  )
}
