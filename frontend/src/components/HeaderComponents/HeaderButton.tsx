import { Link, useLocation } from 'react-router-dom'
import { type FC, type ReactNode, Children } from 'react'

type Props = {
  to?: string
  onClick?: () => void
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const HeaderButton: FC<Props> = ({ to, onClick, icon, children, className = '' }) => {
  const location = useLocation()
  
  const isActive = to ? (
    to === '/main' 
      ? location.pathname === '/main' || location.pathname === '/'
      : location.pathname.startsWith(to)
  ) : false

  const baseClasses = `inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-2xl text-sm sm:text-base font-medium transition-colors duration-400 ${className}`
  const stateClasses = isActive 
    ? 'bg-success-bg text-success-text' 
    : 'bg-transparent hover:bg-surface-hover text-main hover:text-primary'
  
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
    <span className={`${baseClasses} ${stateClasses}`}>
      {iconElement ? (
        <span 
          className="flex items-center text-primary"
          aria-hidden
        >
          {iconElement}
        </span>
      ) : null}
      <span>{textContent}</span>
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
