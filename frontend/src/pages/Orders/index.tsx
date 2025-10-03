import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'
import Sidebar from '../../components/MainComponents/Sidebar'
import type { SidebarSection } from '../../components/MainComponents/Sidebar'
import {
  List,
  Plus,
  Calendar,
  TrendingUp,
  Package,
  Users,
  Clock,
} from 'lucide-react'

const ordersSections: SidebarSection[] = [
  {
    label: "Zamówienia",
    items: [
      { to: "/orders", icon: List, label: "Lista zamówień" },
      { to: "/orders/new", icon: Plus, label: "Nowe zamówienie" },
      { to: "/orders/pending", icon: Clock, label: "Oczekujące" },
    ],
  },
  {
    label: "Planowanie",
    items: [
      { to: "/orders/schedule", icon: Calendar, label: "Harmonogram dostaw" },
      { to: "/orders/forecast", icon: TrendingUp, label: "Prognoza zapotrzebowania" },
    ],
  },
  {
    label: "Dostawcy",
    items: [
      { to: "/orders/suppliers", icon: Users, label: "Lista dostawców" },
      { to: "/orders/catalog", icon: Package, label: "Katalog produktów" },
    ],
  },
];

const OrdersPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar sections={ordersSections} className="h-full" />
        </div>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-main">Zamówienia</h2>
          <div className="bg-surface p-6 rounded-lg shadow border border-main">
            <h3 className="text-lg font-medium mb-4 text-main">Zarządzanie zamówieniami</h3>
            <p className="text-secondary">
              Tutaj możesz zarządzać zamówieniami, planować dostawy, monitorować dostawców i prognozować zapotrzebowanie.
            </p>
          </div>
          {/* Outlet pozwala na zagnieżdżone trasy, jeśli potrzebne */}
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default OrdersPage