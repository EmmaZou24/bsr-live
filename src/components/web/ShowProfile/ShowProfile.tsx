import { Link } from 'react-router-dom'
import defaultCover from '../../../assets/web/dj-cover.jpg'
import { Tag } from '../shared/Tag'
import './show-profile.css'

export type ShowProfileProps = {
  showTitle?: string
  hosts?: string
  schedule?: string
  imageSrc?: string
  imageAlt?: string
  tags?: string[]
  href?: string
  className?: string
}

export function ShowProfile({
  showTitle = "There's Something In Your Ear",
  hosts = 'by Xandi Pink & Allie Heffner',
  schedule = 'Tuesdays @ 7pm',
  imageSrc = defaultCover,
  imageAlt = '',
  tags = ['ELECTRONIC', 'SOUL'],
  href,
  className = '',
}: ShowProfileProps) {
  const content = (
    <>
      <div className="show-profile__image-wrap">
        <img src={imageSrc} alt={imageAlt} className="show-profile__image" />
      </div>

      <div className="show-profile__schedule">{schedule}</div>

      <div className="show-profile__body">
        <div className="show-profile__text">
          <h2 className="show-profile__title">{showTitle}</h2>
          <p className="show-profile__hosts">{hosts}</p>
        </div>

        <div className="show-profile__tags">
          {tags.map((tag) => (
            <Tag key={tag} label={tag} variant="filled" tone="white" />
          ))}
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link to={href} className={`show-profile show-profile--link ${className}`.trim()}>
        {content}
      </Link>
    )
  }

  return <article className={`show-profile ${className}`.trim()}>{content}</article>
}
