import defaultCover from '../../../assets/web/dj-cover.jpg'
import { Tag } from '../shared/Tag'
import './dj-profile.css'

export type DjProfileProps = {
  showTitle?: string
  hosts?: string
  schedule?: string
  imageSrc?: string
  imageAlt?: string
  tags?: string[]
  href?: string
  className?: string
}

export function DjProfile({
  showTitle = "There's Something In Your Ear",
  hosts = 'by Xandi Pink & Allie Heffner',
  schedule = 'Tuesdays @ 7pm',
  imageSrc = defaultCover,
  imageAlt = '',
  tags = ['ELECTRONIC', 'SOUL'],
  href,
  className = '',
}: DjProfileProps) {
  const content = (
    <>
      <div className="dj-profile__image-wrap">
        <img src={imageSrc} alt={imageAlt} className="dj-profile__image" />
      </div>

      <div className="dj-profile__schedule">{schedule}</div>

      <div className="dj-profile__body">
        <div className="dj-profile__text">
          <h2 className="dj-profile__title">{showTitle}</h2>
          <p className="dj-profile__hosts">{hosts}</p>
        </div>

        <div className="dj-profile__tags">
          {tags.map((tag) => (
            <Tag key={tag} label={tag} variant="filled" tone="white" />
          ))}
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className={`dj-profile dj-profile--link ${className}`.trim()}>
        {content}
      </a>
    )
  }

  return <article className={`dj-profile ${className}`.trim()}>{content}</article>
}
