import type { FC } from "react"
import { Outlet, Link } from "react-router-dom"

const SettingsPage: FC = () => {
  return (
    <div>
      <nav className="mb-4">
        {/* dodaj tu inne podstrony ustawień */}
      </nav>
      <Outlet />
    </div>
  )
}

export default SettingsPage