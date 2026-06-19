import defaultCover from '../../../assets/web/blog-cover.jpg'
import { Tag } from '../shared/Tag'
import './blog-post.css'

export type BlogPostProps = {
  title?: string
  author?: string
  date?: string
  imageSrc?: string
  imageAlt?: string
  tags?: string[]
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
  tags = ['BLOG', 'COMMUNITY'],
  href,
  onAuthorClick,
  className = '',
}: BlogPostProps) {
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
          {tags.map((tag) => (
            <Tag key={tag} label={tag} variant="filled" tone="pink" />
          ))}
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className={`blog-post blog-post--link ${className}`.trim()}>
        {content}
      </a>
    )
  }

  return <article className={`blog-post ${className}`.trim()}>{content}</article>
}
