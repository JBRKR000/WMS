import { Outlet } from 'react-router-dom'
import { type FC } from 'react'
import Header from '../../components/HeaderComponents/Header'
import Footer from '../../components/FooterComponents/Footer'
import Sidebar from '../../components/MainComponents/Sidebar'
import type { SidebarSection } from '../../components/MainComponents/Sidebar'
import {
  Settings,
  Users,
  Shield,
  Database,
  Bell,
  Palette,
  Globe,
  Lock,
} from 'lucide-react'

const settingsSections: SidebarSection[] = [
  {
    label: "Ustawienia systemu",
    items: [
      { to: "/settings", icon: Settings, label: "Ogólne" },
      { to: "/settings/appearance", icon: Palette, label: "Wygląd" },
      { to: "/settings/language", icon: Globe, label: "Język i region" },
    ],
  },
  {
    label: "Bezpieczeństwo",
    items: [
      { to: "/settings/users", icon: Users, label: "Użytkownicy" },
      { to: "/settings/permissions", icon: Shield, label: "Uprawnienia" },
      { to: "/settings/security", icon: Lock, label: "Bezpieczeństwo" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings/database", icon: Database, label: "Baza danych" },
      { to: "/settings/notifications", icon: Bell, label: "Powiadomienia" },
    ],
  },
];

const SettingsPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar sections={settingsSections} className="h-full" />
        </div>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <h2 className="text-2xl font-semibold mb-4 text-main">Ustawienia</h2>
          <div className="bg-surface p-6 rounded-lg shadow border border-main">
            <h3 className="text-lg font-medium mb-4 text-main">Konfiguracja systemu</h3>
            <p className="text-secondary">
              Tutaj możesz konfigurować ustawienia systemu, zarządzać użytkownikami, uprawnieniami oraz dostosować wygląd aplikacji.
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

export default SettingsPage