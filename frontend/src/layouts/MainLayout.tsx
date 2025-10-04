import { type FC, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom' // Dodaj ten import
import Header from '../components/HeaderComponents/Header'
import Sidebar, { type SidebarSection } from '../components/MainComponents/Sidebar'
import Footer from '../components/FooterComponents/Footer'
import {
    Activity, AlertTriangle, BarChart3, Boxes, Calendar, Clock, Download, FileSpreadsheet, FileText, Layers,
    List,
    MapPin, Package, PieChart, Plus, QrCode, Shuffle, TrendingUp, Upload, Users, Users2, Settings, Shield, Database, Palette, Bell
} from 'lucide-react'

type LayoutProps = {
    children: ReactNode
}


// Sekcje dla różnych stron
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
            {
                to: "/components/issue-production",
                icon: Upload,
                label: "Wydaj na produkcję",
            },
        ],
    },
];

const mainSections: SidebarSection[] = [
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
        items: [{ to: "/main/roles", icon: Users2, label: "Role i dostępy" }],
    },
];

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
            {
                to: "/orders/forecast",
                icon: TrendingUp,
                label: "Prognoza zapotrzebowania",
            },
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

const raportsSections: SidebarSection[] = [
    {
        label: "Generowanie raportów",
        items: [
            { to: "/raports/generate", icon: FileText, label: "Generuj raport" },
            {
                to: "/raports/custom",
                icon: FileSpreadsheet,
                label: "Raport niestandardowy",
            },
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

const settingsSections: SidebarSection[] = [
    {
        label: "Ustawienia systemu",
        items: [
            { to: "/settings", icon: Settings, label: "Ogólne" },
            { to: "/settings/users", icon: Users, label: "Użytkownicy" },
            { to: "/settings/permissions", icon: Shield, label: "Uprawnienia" },
            { to: "/settings/database", icon: Database, label: "Baza danych" },
        ],
    },
    {
        label: "Personalizacja",
        items: [
            { to: "/settings/appearance", icon: Palette, label: "Wygląd" },
            { to: "/settings/notifications", icon: Bell, label: "Powiadomienia" },
        ],
    },
];

const Layout: FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const getSectionsForPath = (pathname: string): SidebarSection[] => {
        if (pathname.startsWith('/components')) {
            return componentsSections;
        } else if (pathname.startsWith('/main')) {
            return mainSections;
        } else if (pathname.startsWith('/issues')) {
            return issuesSections;
        } else if (pathname.startsWith('/orders')) {
            return ordersSections;
        } else if (pathname.startsWith('/raports')) {
            return raportsSections;
        } else if (pathname.startsWith('/settings')) {
            return settingsSections;
        }
        return mainSections;
    };

    const currentSections = getSectionsForPath(location.pathname);

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
            <Header />
            
            <div className="flex flex-1">
                {/* Sidebar - ukryty na mobile, widoczny na desktop */}
                <div className="hidden lg:block">
                    <Sidebar sections={currentSections} className="h-full" />
                </div>
                
                {/* Main content area z własnym footer */}
                <div className="flex-1 flex flex-col">
                    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    )
}

export default Layout