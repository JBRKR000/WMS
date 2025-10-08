import { type FC } from 'react'
import { Outlet } from 'react-router-dom'

const OrdersPage: FC = () => {
  return (
     <div>
      <nav className="mb-4">
      </nav>
      <Outlet />
    </div>
  )
}

export default OrdersPage