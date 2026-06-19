import './scrolling-bar.css'

type ScrollingBarProps = {
  text: string
  variant?: 'dark' | 'light'
  className?: string
}

export function ScrollingBar({ text, variant = 'dark', className = '' }: ScrollingBarProps) {
  return (
    <div className={`scrolling-bar scrolling-bar--${variant} ${className}`.trim()}>
      <p className="scrolling-bar__text">{text}</p>
    </div>
  )
}
