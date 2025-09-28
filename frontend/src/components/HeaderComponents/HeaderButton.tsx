import { Link } from 'react-router-dom'
import { type FC, type ReactNode, Children } from 'react'

type Props = {
  to?: string
  onClick?: () => void
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const HeaderButton: FC<Props> = ({ to, onClick, icon, children, className = '' }) => {
  const baseClasses = `inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium ${className}`
  const ghostClass = 'bg-transparent hover:bg-[var(--color-surface)]'
  let iconElement = icon
  let textContent = children

  if (!icon) {
    const childArray = Children.toArray(children)
    if (childArray.length > 1) {
      iconElement = childArray[0]
      textContent = childArray.slice(1)
    }
  }

  const content = (
    <span className={`${baseClasses} ${ghostClass}`}>
      {iconElement ? (
        <span 
          className="flex items-center" 
          style={{ color: 'var(--color-primary)' }}
          aria-hidden
        >
          {iconElement}
        </span>
      ) : null}
      <span className="text-[var(--color-text)]">{textContent}</span>
    </span>
  )

  if (to) return <Link to={to}>{content}</Link>
  return (
    <button type="button" onClick={onClick}>
      {content}
    </button>
  )
}

export default HeaderButton
