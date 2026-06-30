import { useEffect, useState } from 'react'
import './title-search.css'

export type PageTitleProps = {
  title?: string
  illustration?: string
  className?: string
}

export function PageTitle({
  title = 'articles',
  illustration,
  className = '',
}: PageTitleProps) {
  const [illustrationError, setIllustrationError] = useState(false)

  useEffect(() => {
    setIllustrationError(false)
  }, [illustration])

  const showIllustration = Boolean(illustration) && !illustrationError

  return (
    <header className={`page-title ${className}`.trim()}>
      <h1 className="page-title__heading">{title}</h1>
      {showIllustration && (
        <img
          src={illustration}
          alt=""
          className="page-title__illustration"
          onError={() => setIllustrationError(true)}
        />
      )}
    </header>
  )
}
