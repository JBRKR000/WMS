import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'
import Sidebar from '../../components/MainComponents/Sidebar'
import type { SidebarSection } from '../../components/MainComponents/Sidebar'
import {
  FileText,
  List,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Download,
  FileSpreadsheet,
} from 'lucide-react'

const raportsSections: SidebarSection[] = [
  {
    label: "Generowanie raportów",
    items: [
      { to: "/raports/generate", icon: FileText, label: "Generuj raport" },
      { to: "/raports/custom", icon: FileSpreadsheet, label: "Raport niestandardowy" },
    ],
  },
  {
    label: "Raporty",
    items: [
      { to: "/raports", icon: List, label: "Lista raportów" },
      { to: "/raports/inventory", icon: BarChart3, label: "Raport magazynowy" },
      { to: "/raports/analytics", icon: PieChart, label: "Analityka ruchu" },
      { to: "/raports/trends", icon: TrendingUp, label: "Trendy i prognozy" },
    ],
  },
  {
    label: "Harmonogramy",
    items: [
      { to: "/raports/scheduled", icon: Calendar, label: "Raporty cykliczne" },
      { to: "/raports/downloads", icon: Download, label: "Pobierz raporty" },
    ],
  },
];

const RaportsPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar sections={raportsSections} className="h-full" />
        </div>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-main">Raporty</h2>
          <div className="bg-surface p-6 rounded-lg shadow border border-main">
            <h3 className="text-lg font-medium mb-4 text-main">System raportowania</h3>
            <p className="text-secondary">
              Tutaj możesz generować różne raporty magazynowe, analizować dane oraz konfigurować automatyczne raporty cykliczne.
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

export default RaportsPage