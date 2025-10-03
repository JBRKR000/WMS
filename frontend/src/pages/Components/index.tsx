import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'
import Sidebar from '../../components/MainComponents/Sidebar'
import type { SidebarSection } from '../../components/MainComponents/Sidebar'
import {
  Package,
  Boxes,
  QrCode,
  Plus,
  Upload,
} from 'lucide-react'

const componentsSections: SidebarSection[] = [
  {
    label: "Komponenty",
    items: [
      { to: "/components", icon: Package, label: "Lista komponentów" },
      { to: "/components/categories", icon: Boxes, label: "Kategorie" },
      { to: "/components/qrcodes", icon: QrCode, label: "Kody QR" },
    ],
  },
  {
    label: "Operacje",
    items: [
      { to: "/components/add-receipt", icon: Plus, label: "Dodaj przyjęcie" },
      { to: "/components/issue-production", icon: Upload, label: "Wydaj na produkcję" },
    ],
  },
];

const ComponentsPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar sections={componentsSections} className="h-full" />
        </div>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-main">Komponenty</h2>
          <div className="bg-surface p-6 rounded-lg shadow border border-main">
            <h3 className="text-lg font-medium mb-4 text-main">Zarządzanie komponentami</h3>
            <p className="text-secondary">
              Tutaj możesz zarządzać komponentami, kategoriami i kodami QR w systemie magazynowym.
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

export default ComponentsPage