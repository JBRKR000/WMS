import { type FC, useState } from 'react'
import { LayoutGrid, Box, ShoppingCart, TruckIcon, Settings, ChartColumnIcon, Factory, type LucideIcon, User, Menu, X } from 'lucide-react'
import HeaderButton from './HeaderButton'
import DarkLightSwitch from './DarkLightSwitch'

type NavItem = {
  to?: string
  icon: LucideIcon
  label: string
  onClick?: () => void
}

const Header: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const iconSize = 24

  const navItems: NavItem[] = [
    { to: '/main', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/main/items', icon: ShoppingCart, label: 'Komponenty' },
    { to: '/main/categories', icon: TruckIcon, label: 'Wydania' },
    { to: '/main/orders', icon: Box, label: 'Zamówienia' },
    { to: '/main/reports', icon: ChartColumnIcon, label: 'Raporty' },
    { icon: Settings, label: 'Ustawienia', onClick: () => console.log('Settings clicked') }
  ]

  return (
    <header className="shadow bg-[var(--color-surface)]">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo i tytuł */}
          <div className="flex items-center gap-3">
            <Factory size={32} className="text-[var(--color-primary)]" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-text)]">WMS</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 group">
            {navItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <HeaderButton 
                  key={index} 
                  to={item.to}
                  onClick={item.onClick}
                  className="group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200"
                >
                  <IconComponent size={iconSize} />
                  <span className="hidden xl:inline">{item.label}</span>
                </HeaderButton>
              )
            })}
          </nav>

          {/* Desktop Account + Dark/Light Switch + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Desktop Account Button + Dark/Light Switch */}
            <div className="hidden md:flex items-center group">
              <HeaderButton 
                onClick={() => console.log('Moje Konto clicked')}
                className="group-hover:opacity-30 hover:!opacity-100 transition-opacity duration-200"
              >
                <User size={iconSize} />
                <span className="hidden lg:inline">Moje Konto</span>
              </HeaderButton>
              {/* Dark/Light Switch (desktop only) */}
              <span className="ml-2 hidden md:inline-block"><DarkLightSwitch /></span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105"
            >
              <div className="relative w-6 h-6">
                <Menu 
                  size={24} 
                  className={`absolute inset-0 transition-all duration-300 text-gray-700 dark:text-white ${
                    isMobileMenuOpen 
                      ? 'rotate-90 opacity-0 scale-75' 
                      : 'rotate-0 opacity-100 scale-100'
                  }`} 
                />
                <X 
                  size={24} 
                  className={`absolute inset-0 transition-all duration-300 text-gray-700 dark:text-white ${
                    isMobileMenuOpen 
                      ? 'rotate-0 opacity-100 scale-100' 
                      : 'rotate-90 opacity-0 scale-75'
                  }`} 
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="mt-4 py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              {navItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <div
                    key={index}
                    className={`transform transition-all duration-300 ease-out ${
                      isMobileMenuOpen 
                        ? 'translate-x-0 opacity-100' 
                        : '-translate-x-4 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <HeaderButton 
                      to={item.to}
                      onClick={() => {
                        item.onClick?.()
                        setIsMobileMenuOpen(false)
                      }}
                      className="justify-start w-full"
                    >
                      <IconComponent size={iconSize} />
                      <span>{item.label}</span>
                    </HeaderButton>
                  </div>
                )
              })}
              {/* Mobile Account Button */}
              <div
                className={`transform transition-all duration-300 ease-out ${
                  isMobileMenuOpen 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${navItems.length * 50}ms` }}
              >
                <HeaderButton 
                  onClick={() => {
                    console.log('Moje Konto clicked')
                    setIsMobileMenuOpen(false)
                  }}
                  className="justify-start w-full md:hidden"
                >
                  <User size={iconSize} />
                  <span>Moje Konto</span>
                </HeaderButton>
              </div>
              <div
                className={`w-full flex justify-center py-3 transition-all duration-300 ease-out md:hidden ${
                  isMobileMenuOpen 
                    ? 'opacity-100' 
                    : 'opacity-0 pointer-events-none'
                }`}
                style={{ transitionDelay: `${(navItems.length + 1) * 50}ms` }}
              >
                <DarkLightSwitch />
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header