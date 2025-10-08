import { type FC } from 'react'
import { Outlet } from 'react-router-dom'

const ComponentsPage: FC = () => {
  return (
    <div>
      <nav className="mb-4">
      </nav>
      <Outlet />
    </div>
  )
}

export default ComponentsPage