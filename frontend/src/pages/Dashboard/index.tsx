import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'
import Sidebar from '../../components/MainComponents/Sidebar'
import type { SidebarSection } from '../../components/MainComponents/Sidebar'
import {
  Activity,
  AlertTriangle,
  Clock,
  Boxes,
  Package,
  Layers,
  QrCode,
  MapPin,
  Download,
  Upload,
  Shuffle,
  Users2,
} from 'lucide-react'

const dashboardSections: SidebarSection[] = [
  {
    label: "Dashboard",
    items: [
      { to: "/main", icon: Activity, label: "Przegląd" },
      { to: "/main/exceptions", icon: AlertTriangle, label: "Wyjątki" },
      { to: "/main/activity", icon: Clock, label: "Ostatnia aktywność" },
    ],
  },
  {
    label: "Magazyn",
    items: [
      { to: "/main/categories", icon: Boxes, label: "Kategorie" },
      { to: "/main/items", icon: Package, label: "Komponenty" },
      { to: "/main/materials", icon: Layers, label: "Materiały" },
      { to: "/main/qrcodes", icon: QrCode, label: "Skany QR" },
      { to: "/main/locations", icon: MapPin, label: "Lokalizacje" },
    ],
  },
  {
    label: "Operacje",
    items: [
      { to: "/main/inbound", icon: Download, label: "Przyjęcia" },
      { to: "/main/outbound", icon: Upload, label: "Wydania" },
      { to: "/main/moves", icon: Shuffle, label: "Ruchy" },
    ],
  },
  {
    label: "Użytkownicy",
    items: [
      { to: "/main/roles", icon: Users2, label: "Role i dostępy" },
    ],
  },
];

const DashboardPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar sections={dashboardSections} className="h-full" />
        </div>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-main">Dashboard</h2>
          {/* Tu wstawisz zawartość dashboardu */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface p-4 rounded shadow border border-main">Card 1</div>
              <div className="bg-surface p-4 rounded shadow border border-main">Card 2</div>
              <div className="bg-surface p-4 rounded shadow border border-main">Card 3</div>
            </div>
          </section>
          {/* Outlet pozwala na zagnieżdżone trasy, jeśli potrzebne */}
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardPage