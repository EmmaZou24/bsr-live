import { Link } from 'react-router-dom'
import defaultCover from '../../../assets/web/blog-cover.jpg'
import { Tag } from '../shared/Tag'
import './blog-post.css'

export type BlogPostAccent = 'pink' | 'yellow' | 'blue'

function accentFromCoarseTag(coarseTag: string): BlogPostAccent {
  switch (coarseTag.toUpperCase()) {
    case 'NEWS':
      return 'yellow'
    case 'INTERVIEW':
    case 'INTERVIEWS':
      return 'blue'
    case 'BLOG':
    default:
      return 'pink'
  }
}

export type BlogPostProps = {
  title?: string
  author?: string
  date?: string
  imageSrc?: string
  imageAlt?: string
  coarseTag?: string
  granularTag?: string
  href?: string
  onAuthorClick?: () => void
  className?: string
}

export function BlogPost({
  title = 'Where Did The Rhode Island Music Scene Go?',
  author = 'millie cheng',
  date = 'July 12th, 2026',
  imageSrc = defaultCover,
  imageAlt = '',
  coarseTag = 'BLOG',
  granularTag = 'COMMUNITY',
  href,
  onAuthorClick,
  className = '',
}: BlogPostProps) {
  const accent = accentFromCoarseTag(coarseTag)
  const rootClassName = `blog-post blog-post--accent-${accent}${href ? ' blog-post--link' : ''} ${className}`.trim()

  const content = (
    <>
      <div className="blog-post__image-wrap">
        <img src={imageSrc} alt={imageAlt} className="blog-post__image" />
      </div>

      <div className="blog-post__date">{date}</div>

      <div className="blog-post__body">
        <div className="blog-post__text">
          <h2 className="blog-post__title">{title}</h2>
          <p className="blog-post__author">
            by{' '}
            <button
              type="button"
              className="blog-post__author-link"
              onClick={onAuthorClick}
            >
              {author}
            </button>
          </p>
        </div>

        <div className="blog-post__tags">
          {coarseTag ? <Tag label={coarseTag} variant="filled" tone="pink" /> : null}
          {granularTag ? <Tag label={granularTag} variant="filled" tone="pink" /> : null}
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link to={href} className={rootClassName}>
        {content}
      </Link>
    )
  }

  return <article className={rootClassName}>{content}</article>
}
