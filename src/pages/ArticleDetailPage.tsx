import { PortableText } from '@portabletext/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Tag } from '../components/web'
import { fetchArticleBySlug } from '../lib/sanity/articles'
import type { ArticleDetail } from '../lib/sanity/types'
import { NavPage } from './NavPage'
import { ROUTES } from './routes'
import './article-detail.css'
import './nav-page.css'

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Article not found.')
      setIsLoading(false)
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetchArticleBySlug(slug)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setError('Article not found.')
          return
        }
        setArticle(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load article')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <NavPage title="articles" className="nav-page--article-detail">
      <div className="article-detail">
        <Link to={ROUTES.articles} className="article-detail__back">
          ← all articles
        </Link>

        {isLoading ? <p className="article-detail__status">Loading article…</p> : null}
        {error ? <p className="article-detail__status article-detail__status--error">{error}</p> : null}

        {article ? (
          <article className="article-detail__content">
            <div className="article-detail__hero">
              <img
                src={article.imageSrc}
                alt={article.imageAlt}
                className="article-detail__image"
              />
            </div>

            <div className="article-detail__meta">
              <time className="article-detail__date">{article.date}</time>
              <div className="article-detail__tags">
                <Tag label={article.coarseTag} variant="filled" tone="pink" />
                {article.granularTag ? (
                  <Tag label={article.granularTag} variant="filled" tone="pink" />
                ) : null}
              </div>
            </div>

            <h1 className="article-detail__title">{article.title}</h1>
            <p className="article-detail__author">by {article.author}</p>

            {article.body.length > 0 ? (
              <div className="article-detail__body">
                <PortableText value={article.body} />
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </NavPage>
  )
}
