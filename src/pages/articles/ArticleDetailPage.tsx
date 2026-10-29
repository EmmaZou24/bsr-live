import scrollbarHandle from '../../assets/web/article-scrollbar-handle.svg'
import { PortableText, type PortableTextBlockComponent } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Tag } from '../../components/web'
import { fetchArticleBySlug } from '../../lib/sanity/articles'
import type { ArticleDetail } from '../../lib/sanity/types'
import { NavPage } from '../NavPage'
import { useContentLoading } from '../ContentLoadingContext'
import { ROUTES } from '../routes'
import { useArticleDetailScrollbar } from './useArticleDetailScrollbar'
import { NewsAudioPlayer } from './NewsAudioPlayer'
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

const collageSlots = [
  {
    figureClass: 'article-detail__figure--wide',
    imageClass: 'article-detail__image--wide',
    decorative: false,
  },
  {
    figureClass: 'article-detail__figure--tall-right',
    imageClass: 'article-detail__image--tall-right',
    decorative: true,
  },
  {
    figureClass: 'article-detail__figure--small-left',
    imageClass: 'article-detail__image--small-left',
    decorative: true,
  },
] as const

function collageImageAt(images: ArticleDetail['articleImages'], index: number) {
  return images[index] ?? images[0]
}

function InterviewWatchLink({ href }: { href: string }) {
  return (
    <>
      {' '}
      <a className="article-detail__interview-link" href={href} target="_blank" rel="noreferrer">
        Watch the interview here.
      </a>
    </>
  )
}

function blockRenderer(
  Tag: 'p' | 'h2' | 'h3' | 'blockquote',
  interviewLink: string | undefined,
  lastBlockKey: string | undefined,
): PortableTextBlockComponent {
  return function Block({ children, value }) {
    const showLink = Boolean(interviewLink && value._key === lastBlockKey)

    if (Tag === 'p') {
      return (
        <p>
          {children}
          {showLink && interviewLink ? <InterviewWatchLink href={interviewLink} /> : null}
        </p>
      )
    }

    if (Tag === 'blockquote') {
      return (
        <blockquote>
          {children}
          {showLink && interviewLink ? <InterviewWatchLink href={interviewLink} /> : null}
        </blockquote>
      )
    }

    return (
      <Tag>
        {children}
        {showLink && interviewLink ? <InterviewWatchLink href={interviewLink} /> : null}
      </Tag>
    )
  }
}

function InterviewDescription({
  description,
  interviewLink,
}: {
  description: PortableTextBlock[]
  interviewLink?: string
}) {
  const lastBlockKey = description.at(-1)?._key

  if (description.length === 0) {
    if (!interviewLink) return null

    return (
      <div className="article-detail__body">
        <p>
          <a
            className="article-detail__interview-link"
            href={interviewLink}
            target="_blank"
            rel="noreferrer"
          >
            Watch the interview here.
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="article-detail__body">
      <PortableText
        value={description}
        components={{
          block: {
            normal: blockRenderer('p', interviewLink, lastBlockKey),
            h2: blockRenderer('h2', interviewLink, lastBlockKey),
            h3: blockRenderer('h3', interviewLink, lastBlockKey),
            blockquote: blockRenderer('blockquote', interviewLink, lastBlockKey),
          },
        }}
      />
    </div>
  )
}

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
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

  useContentLoading(isLoading)

  const thumbTravel =
    metrics.trackHeight - metrics.thumbHeight - metrics.insetTop - metrics.insetBottom
  const scrollPercent =
    metrics.canScroll && thumbTravel > 0
      ? Math.round(((metrics.thumbTop - metrics.insetTop) / thumbTravel) * 100)
      : 0
  const fromPage = Number(searchParams.get('fromPage'))
  const articlesPath = Number.isInteger(fromPage) && fromPage > 1
    ? `${ROUTES.articles}?page=${fromPage}`
    : ROUTES.articles

  return (
    <NavPage hideTitle className="nav-page--article-detail" bodyRef={scrollRef}>
      {error ? <p className="article-detail__status article-detail__status--error">{error}</p> : null}

      {article ? (
        <article className="article-detail">
          <div className="article-detail__layout">
            <div className="article-detail__media">
              <div className="article-detail__media-head">
                <Link to={articlesPath} className="article-detail__back" aria-label="Back to all articles">
                  <BackArrowIcon />
                </Link>
              </div>

              {article.articleImages.length > 0 ? (
                <div className="article-detail__collage">
                  {collageSlots.map((slot, index) => {
                    const image = collageImageAt(article.articleImages, index)

                    return (
                      <figure
                        key={slot.figureClass}
                        className={`article-detail__figure ${slot.figureClass}`}
                      >
                        <img
                          src={image.src}
                          alt={slot.decorative ? '' : image.alt}
                          aria-hidden={slot.decorative}
                          className={`article-detail__image ${slot.imageClass}`}
                        />
                      </figure>
                    )
                  })}
                </div>
              ) : null}
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

              {article.kind === 'news' && article.audioFileUrl ? (
                <NewsAudioPlayer src={article.audioFileUrl} />
              ) : null}

              {article.kind === 'blog' && article.body.length > 0 ? (
                <div className="article-detail__body">
                  <PortableText value={article.body} />
                </div>
              ) : null}

              {article.kind === 'news' && article.description.length > 0 ? (
                <div className="article-detail__body">
                  <PortableText value={article.description} />
                </div>
              ) : null}

              {article.kind === 'interview' &&
              (article.description.length > 0 || article.interviewLink) ? (
                <InterviewDescription
                  description={article.description}
                  interviewLink={article.interviewLink}
                />
              ) : null}

              {article.kind !== 'blog' && article.transcript.length > 0 ? (
                <div className="article-detail__body">
                  <PortableText value={article.transcript} />
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}
    </NavPage>
  )
}
