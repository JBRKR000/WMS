import { type FC } from 'react'
import { LayoutGrid, Box, ShoppingCart, ArchiveX, Settings, User } from 'lucide-react'
import HeaderButton from './HeaderButton'

const Header: FC = () => {
  return (
    <header className="shadow bg-[var(--color-surface)]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[var(--color-text)]">WMS</h1>
          <nav className="hidden sm:flex items-center gap-2">
            <HeaderButton to="/main">
              <LayoutGrid size={16} />
              <span>Dashboard</span>
            </HeaderButton>
            <HeaderButton to="/main/items">
              <ShoppingCart size={16} />
              <span>Items</span>
            </HeaderButton>
            <HeaderButton to="/main/categories">
              <ArchiveX size={16} />
              <span>Categories</span>
            </HeaderButton>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HeaderButton to="/main/orders"> 
              <Box size={16} />
              <span>Orders</span>
            </HeaderButton>

            <HeaderButton to="/main/reports">
              <Settings size={16} />
              <span>Reports</span>
            </HeaderButton>

            <HeaderButton>
              <User size={16} />
              <span>Ustawienia</span>
            </HeaderButton>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header