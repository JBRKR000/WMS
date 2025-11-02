import { type FC, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import Header from '../components/HeaderComponents/Header'
import Sidebar, { type SidebarSection } from '../components/MainComponents/Sidebar'
import Footer from '../components/FooterComponents/Footer'
import {
    Activity, BarChart3, Boxes, Clock, Download, FileSpreadsheet, Layers,
    List, Package, Plus, QrCode, Upload, Users
} from 'lucide-react'

type LayoutProps = {
    children: ReactNode
}



// Nowe sekcje zgodnie z wymaganiami użytkownika
const dashboardSections: SidebarSection[] = [
    {
        label: "Dashboard",
        items: [
            { to: "/main/summary", icon: Activity, label: "Podsumowanie magazynu" },
            { to: "/main/last-operations", icon: Clock, label: "Ostatnie przyjęcia/wydań" },
            { to: "/main/categories-preview", icon: Boxes, label: "Kategorie i słowa kluczowe" },
        ],
    },
];

const componentsSections: SidebarSection[] = [
    {
        label: "Komponenty i Produkty",
        items: [
            { to: "/components", icon: Package, label: "Lista komponentów" },
            { to: "/components/products", icon: Layers, label: "Lista produktów gotowych" },
            { to: "/components/add", icon: Plus, label: "Dodaj komponent/produkt" },
            { to: "/components/search", icon: BarChart3, label: "Wielokryterialne wyszukiwanie" },
        ],
    },
];

const issuesSections: SidebarSection[] = [
    {
        label: "Wydania",
        items: [
            { to: "/issues/register", icon: Upload, label: "Rejestracja wydania" },
            { to: "/issues/history", icon: List, label: "Historia wydań" },
        ],
    },
];

const ordersSections: SidebarSection[] = [
    {
        label: "Zamówienia",
        items: [
            { to: "/orders/create", icon: Plus, label: "Tworzenie zamówień" },
            { to: "/orders/history", icon: List, label: "Historia zamówień" },
            { to: "/orders/status", icon: Clock, label: "Statusy zamówień" },
        ],
    },
];

const raportsSections: SidebarSection[] = [
    {
        label: "Raporty",
        items: [
            { to: "/raports/inventory", icon: BarChart3, label: "Stany magazynowe" },
            { to: "/raports/inbound-summary", icon: Download, label: "Zestawienia przyjęć" },
            { to: "/raports/outbound-summary", icon: Upload, label: "Zestawienia wydań" },
            { to: "/raports/export", icon: FileSpreadsheet, label: "Raporty" },
        ],
    },
];

const settingsSections: SidebarSection[] = [
    {
        label: "Ustawienia",
        items: [
            { to: "/settings/users", icon: Users, label: "Zarządzanie użytkownikami" },
            { to: "/settings/qr", icon: QrCode, label: "Ustawienia Systemu" },
        ],
    },
];

const Layout: FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    // get admin status from AuthContext
    const { isAdmin } = useAuth()


    const getSectionsForPath = (pathname: string): SidebarSection[] => {
        if (pathname.startsWith('/settings')) {
            // only admin can access settings
            return isAdmin ? settingsSections : [];
        }
        if (pathname.startsWith('/components') || pathname.startsWith('/products')) {
            return componentsSections;
        } else if (pathname.startsWith('/main')) {
            return dashboardSections;
        } else if (pathname.startsWith('/issues')) {
            return issuesSections;
        } else if (pathname.startsWith('/orders')) {
            return ordersSections;
        } else if (pathname.startsWith('/raports')) {
            return raportsSections;
        }
        return dashboardSections;
        //TODO: dodać sekcję domyślną lub obsługę błędów
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