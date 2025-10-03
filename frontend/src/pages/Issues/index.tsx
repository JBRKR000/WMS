import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'
import Sidebar from '../../components/MainComponents/Sidebar'
import type { SidebarSection } from '../../components/MainComponents/Sidebar'
import {
  List,
  Plus,
  FileText,
  Download,
} from 'lucide-react'

const issuesSections: SidebarSection[] = [
  {
    label: "Wydania",
    items: [
      { to: "/issues", icon: List, label: "Lista wydań" },
      { to: "/issues/new", icon: Plus, label: "Nowe wydanie" },
    ],
  },
  {
    label: "Eksport",
    items: [
      { to: "/issues/export-pdf", icon: FileText, label: "PDF listy wydań" },
      { to: "/issues/downloads", icon: Download, label: "Pobierz raporty" },
    ],
  },
];

const IssuesPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar sections={issuesSections} className="h-full" />
        </div>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-main">Wydania</h2>
          <div className="bg-surface p-6 rounded-lg shadow border border-main">
            <h3 className="text-lg font-medium mb-4 text-main">Zarządzanie wydaniami</h3>
            <p className="text-secondary">
              Tutaj możesz zarządzać wydaniami materiałów i komponentów z magazynu oraz eksportować raporty.
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

export default IssuesPage