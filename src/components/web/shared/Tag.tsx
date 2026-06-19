import './tag.css'

type TagProps = {
  label: string
  variant?: 'filled' | 'outline'
  tone?: 'pink' | 'white'
  className?: string
}

export function Tag({
  label,
  variant = 'filled',
  tone = 'pink',
  className = '',
}: TagProps) {
  return (
    <span
      className={`tag tag--${variant} tag--${tone} ${className}`.trim()}
    >
      {label}
    </span>
  )
}
