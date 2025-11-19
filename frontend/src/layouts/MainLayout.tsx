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

const getComponentsSections = (isProduction: boolean): SidebarSection[] => {
    const items = [
        { to: "/components", icon: Package, label: "Lista komponentów" },
        { to: "/components/products", icon: Layers, label: "Lista produktów gotowych" },
    ];

    // ROLE_PRODUCTION nie widzi "Dodaj komponent/produkt"
    if (!isProduction) {
        items.push({ to: "/components/add", icon: Plus, label: "Dodaj komponent/produkt" });
    }

    items.push({ to: "/components/search", icon: BarChart3, label: "Wielokryterialne wyszukiwanie" });

    return [
        {
            label: "Komponenty i Produkty",
            items,
        },
    ];
};

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
        ],
    },
];

const getRaportsSections = (isProduction: boolean): SidebarSection[] => {
    const items = [
        { to: "/raports/inventory", icon: BarChart3, label: "Stany magazynowe" },
        { to: "/raports/inbound-summary", icon: Download, label: "Zestawienia przyjęć" },
        { to: "/raports/outbound-summary", icon: Upload, label: "Zestawienia wydań" },
    ];

    // ROLE_PRODUCTION nie widzi opcji eksportu raportów
    if (!isProduction) {
        items.push({ to: "/raports/export", icon: FileSpreadsheet, label: "Raporty" });
    }

    return [
        {
            label: "Raporty",
            items,
        },
    ];
};

const settingsSections: SidebarSection[] = [
    {
        label: "Ustawienia",
        items: [
            { to: "/settings/users", icon: Users, label: "Zarządzanie użytkownikami" },
            { to: "/settings/qr", icon: QrCode, label: "Ustawienia Systemu" },
            { to: "/settings/location", icon: Layers, label: "Ustawienia Lokalizacji" },
        ],
    },
];

const Layout: FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    // Pobierz flagi ról z AuthContext
    const { isAdmin, isProduction, isWarehouse } = useAuth()

    const getSectionsForPath = (pathname: string): SidebarSection[] => {
        console.log('getSectionsForPath called with:', pathname, { isAdmin, isProduction, isWarehouse })
        
        if (pathname.startsWith('/items')) {
            console.log('Matched /items path')
            return dashboardSections;
        }
        
        if (pathname.startsWith('/settings')) {
            // Tylko ROLE_ADMIN widzi ustawienia
            return isAdmin ? settingsSections : [];
        }
        
        if (pathname.startsWith('/components') || pathname.startsWith('/products')) {
            return getComponentsSections(isProduction);
        } else if (pathname.startsWith('/main')) {
            return dashboardSections;
        } else if (pathname.startsWith('/issues')) {
            return issuesSections;
        } else if (pathname.startsWith('/orders')) {
            return ordersSections;
        } else if (pathname.startsWith('/raports')) {
            return getRaportsSections(isProduction);
        }
        return dashboardSections;
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