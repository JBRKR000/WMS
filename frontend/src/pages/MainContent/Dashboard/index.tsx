import { type FC } from 'react'
import { Outlet } from 'react-router-dom'

const DashboardPage: FC = () => {
  return (
    <div>
      <nav className="mb-4">
        {/* dodaj tu inne podstrony ustawień */}
      </nav>
      <Outlet />
    </div>
  )
}


export default DashboardPage
