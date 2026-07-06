import { PortableText } from '@portabletext/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Tag } from '../../components/web'
import { fetchShowBySlug } from '../../lib/sanity/shows'
import type { ShowDetail } from '../../lib/sanity/types'
import { NavPage } from '../NavPage'
import { useContentLoading } from '../ContentLoadingContext'
import { ROUTES } from '../routes'
import '../nav-page.css'
import './show-detail.css'

export function ShowDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [show, setShow] = useState<ShowDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Show not found.')
      setIsLoading(false)
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetchShowBySlug(slug)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setError('Show not found.')
          return
        }
        setShow(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load show')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  useContentLoading(isLoading)

  return (
    <NavPage title="shows" className="nav-page--show-detail">
      <div className="show-detail">
        <Link to={ROUTES.shows} className="show-detail__back">
          ← all shows
        </Link>

        {error ? <p className="show-detail__status show-detail__status--error">{error}</p> : null}

        {show ? (
          <article className="show-detail__content">
            <div className="show-detail__hero">
              <img src={show.imageSrc} alt={show.imageAlt} className="show-detail__image" />
            </div>

            <div className="show-detail__meta">
              <span className="show-detail__schedule">{show.schedule}</span>
              <div className="show-detail__tags">
                {show.tags.map((tag) => (
                  <Tag key={tag} label={tag} variant="filled" tone="white" />
                ))}
              </div>
            </div>

            <h1 className="show-detail__title">{show.showTitle}</h1>
            <p className="show-detail__hosts">{show.hosts}</p>

            {show.body.length > 0 ? (
              <div className="show-detail__body">
                <PortableText value={show.body} />
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </NavPage>
  )
}
