import scrollbarHandle from '../../assets/web/article-scrollbar-handle.svg'
import { PortableText } from '@portabletext/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Tag } from '../../components/web'
import { fetchArticleBySlug } from '../../lib/sanity/articles'
import type { ArticleDetail } from '../../lib/sanity/types'
import { NavPage } from '../NavPage'
import { ROUTES } from '../routes'
import { useArticleDetailScrollbar } from './useArticleDetailScrollbar'
import './article-detail.css'
import '../nav-page.css'

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 26 50" aria-hidden="true" className="article-detail__back-icon">
      <line x1="60" y1="27" x2="6" y2="27" stroke="currentColor" strokeWidth="3" />
      <polyline
        points="14,16 4,27 14,38"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {
    scrollRef,
    metrics,
    handleThumbPointerDown,
    handleThumbPointerMove,
    handleThumbPointerUp,
    handleTrackPointerDown,
    handleTrackWheel,
  } = useArticleDetailScrollbar(Boolean(article))

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

  const thumbTravel =
    metrics.trackHeight - metrics.thumbHeight - metrics.insetTop - metrics.insetBottom
  const scrollPercent =
    metrics.canScroll && thumbTravel > 0
      ? Math.round(((metrics.thumbTop - metrics.insetTop) / thumbTravel) * 100)
      : 0

  return (
    <NavPage hideTitle className="nav-page--article-detail" bodyRef={scrollRef}>
      {isLoading ? <p className="article-detail__status">Loading article…</p> : null}
      {error ? <p className="article-detail__status article-detail__status--error">{error}</p> : null}

      {article ? (
        <article className="article-detail">
          <div className="article-detail__layout">
            <div className="article-detail__media">
              <div className="article-detail__media-head">
                <Link to={ROUTES.articles} className="article-detail__back" aria-label="Back to all articles">
                  <BackArrowIcon />
                </Link>
              </div>

              <div className="article-detail__collage">
                <figure className="article-detail__figure article-detail__figure--wide">
                  <img
                    src={article.imageSrc}
                    alt={article.imageAlt}
                    className="article-detail__image article-detail__image--wide"
                  />
                </figure>
                <figure className="article-detail__figure article-detail__figure--tall-right">
                  <img
                    src={article.imageSrc}
                    alt=""
                    aria-hidden="true"
                    className="article-detail__image article-detail__image--tall-right"
                  />
                </figure>
                <figure className="article-detail__figure article-detail__figure--small-left">
                  <img
                    src={article.imageSrc}
                    alt=""
                    aria-hidden="true"
                    className="article-detail__image article-detail__image--small-left"
                  />
                </figure>
              </div>
            </div>

            <div
              className="article-detail__divider"
              role="scrollbar"
              aria-orientation="vertical"
              aria-controls="article-detail-content"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scrollPercent}
              style={{ height: metrics.trackHeight || undefined }}
              onPointerDown={handleTrackPointerDown}
              onWheel={handleTrackWheel}
            >
              <button
                type="button"
                className="article-detail__divider-handle"
                aria-label="Drag to scroll article"
                aria-disabled={!metrics.canScroll}
                style={{ transform: `translate(-50%, ${metrics.thumbTop}px)` }}
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handleThumbPointerMove}
                onPointerUp={handleThumbPointerUp}
                onPointerCancel={handleThumbPointerUp}
              >
                <img
                  src={scrollbarHandle}
                  alt=""
                  aria-hidden="true"
                  className="article-detail__divider-handle-graphic"
                  draggable={false}
                />
              </button>
            </div>

            <div id="article-detail-content" className="article-detail__text">
              <header className="article-detail__header">
                <h1 className="article-detail__title">{article.title}</h1>
                <div className="article-detail__byline">
                  <p className="article-detail__author">
                    by <span className="article-detail__author-name">{article.author}</span>
                  </p>
                  <div className="article-detail__tags">
                    <Tag label={article.coarseTag} variant="filled" tone="white" />
                    {article.granularTag ? (
                      <Tag label={article.granularTag} variant="filled" tone="white" />
                    ) : null}
                  </div>
                </div>
              </header>

              {article.body.length > 0 ? (
                <div className="article-detail__body">
                  <PortableText value={article.body} />
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}
    </NavPage>
  )
}
