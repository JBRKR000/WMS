import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingCart,
  TruckIcon,
  Settings,
  ChartColumnIcon,
  Factory,
  type LucideIcon,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  Boxes,
  Layers,
  Download,
  Upload,
  List,
  Plus,
  FileText,
  BarChart,
  QrCode,
  Users2,
} from "lucide-react";
import HeaderButton from "./HeaderButton";
import DarkLightSwitch from "./DarkLightSwitch";
import { useAuth } from "../../utils/AuthContext";

type SubMenuItem = {
  to: string;
  icon: LucideIcon;
  label: string;
};

type NavItem = {
  to?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  submenu?: SubMenuItem[];
};

const Header: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const { username, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const iconSize = 24;




  const navItems: NavItem[] = [
    {
      to: "/main",
      icon: LayoutGrid,
      label: "Dashboard",
      submenu: [
        { to: "/main/summary", icon: Activity, label: "Podsumowanie magazynu" },
        { to: "/main/last-operations", icon: Clock, label: "Ostatnie przyjęcia/wydań" },
        { to: "/main/categories-preview", icon: Boxes, label: "Kategorie i słowa kluczowe" },
      ],
    },
    {
      to: "/components",
      icon: ShoppingCart,
      label: "Komponenty i Produkty",
      submenu: [
        { to: "/components", icon: List, label: "Lista komponentów" },
        { to: "/components/products", icon: Layers, label: "Lista produktów gotowych" },
        { to: "/components/add", icon: Plus, label: "Dodaj komponent/produkt" },
        { to: "/components/search", icon: BarChart, label: "Wielokryterialne wyszukiwanie" },
      ],
    },
    {
      to: "/issues",
      icon: TruckIcon,
      label: "Wydania",
      submenu: [
        { to: "/issues/register", icon: Upload, label: "Rejestracja wydania" },
        { to: "/issues/history", icon: List, label: "Historia wydań" },
      ],
    },
    {
      to: "/orders",
      icon: Boxes,
      label: "Zamówienia",
      submenu: [
        { to: "/orders/create", icon: Plus, label: "Tworzenie zamówień" },
        { to: "/orders/history", icon: List, label: "Historia zamówień" },
      ],
    },
    {
      to: "/raports",
      icon: ChartColumnIcon,
      label: "Raporty",
      submenu: [
        { to: "/raports/inventory", icon: BarChart, label: "Stany magazynowe" },
        { to: "/raports/inbound-summary", icon: Download, label: "Zestawienia przyjęć" },
        { to: "/raports/outbound-summary", icon: Upload, label: "Zestawienia wydań" },
        { to: "/raports/export", icon: FileText, label: "Raporty" },
      ],
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Ustawienia",
      submenu: [
        { to: "/settings/users", icon: Users2, label: "Zarządzanie użytkownikami" },
        { to: "/settings/qr", icon: QrCode, label: "Ustawienia Systemu" },
      ],
    },
  ];
  // filter settings for non-admin
  const filteredNavItems = navItems.filter(item => item.to !== "/settings" || isAdmin);

  const toggleSubmenu = (itemLabel: string) => {
    setExpandedSubmenu(expandedSubmenu === itemLabel ? null : itemLabel);
  };

  const handleSubmenuClick = (to: string) => {
    navigate(to);
    setIsMobileMenuOpen(false);
    setExpandedSubmenu(null);
  };

  const handleLogout = () => {
  // userData no longer stored in localStorage
    logout();
    navigate('/auth');
  };

  return (
    <header className="shadow bg-surface">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo i tytuł */}
          <div className="flex items-center gap-3">
            <Factory size={32} className="text-primary" />
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main">
              WMS
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 group">
            {filteredNavItems.map((item, index) => {
              const IconComponent = item.icon;
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
              );
            })}
          </nav>

          {/* Desktop Account + Dark/Light Switch + Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Powitanie użytkownika */}
            {username && (
              <span
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-main text-primary font-semibold shadow-sm transition-all duration-200"
                title={`Zalogowano jako ${username}`}
              >
                
                Witaj, <span className="text-main">{username}!</span>
              </span>
            )}
            {/* Desktop Account Button + Dark/Light Switch */}
            <div className="hidden md:flex items-center group">
              <HeaderButton
                onClick={handleLogout}
                className="group-hover:opacity-30 hover:!opacity-100 transition-opacity duration-200"
              >
                <User size={iconSize} />
                <span className="hidden lg:inline">Wyloguj</span>
              </HeaderButton>
              {/* Dark/Light Switch (desktop only) */}
              <span className="ml-2 hidden md:inline-block">
                <DarkLightSwitch />
              </span>
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-surface-hover transition-all duration-200 hover:scale-105"
            >
              <div className="relative w-6 h-6">
                <Menu
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 text-main ${
                    isMobileMenuOpen
                      ? "rotate-90 opacity-0 scale-75"
                      : "rotate-0 opacity-100 scale-100"
                  }`}
                />
                <X
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 text-main ${
                    isMobileMenuOpen
                      ? "rotate-0 opacity-100 scale-100"
                      : "rotate-90 opacity-0 scale-75"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-4 py-4 border-t border-main max-h-[70vh] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {filteredNavItems.map((item, index) => {
                const IconComponent = item.icon;
                const isExpanded = expandedSubmenu === item.label;

                return (
                  <div
                    key={index}
                    className={`transform transition-all duration-300 ease-out ${
                      isMobileMenuOpen
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {/* Main menu item */}
                    <div className="flex items-center">
                      <HeaderButton
                        to={item.submenu ? undefined : item.to}
                        onClick={
                          item.submenu
                            ? () => toggleSubmenu(item.label)
                            : () => {
                                item.onClick?.();
                                setIsMobileMenuOpen(false);
                              }
                        }
                        className="justify-start flex-1"
                      >
                        <IconComponent size={iconSize} />
                        <span>{item.label}</span>
                        {item.submenu && (
                          <div className="ml-auto">
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-muted" />
                            ) : (
                              <ChevronRight size={16} className="text-muted" />
                            )}
                          </div>
                        )}
                      </HeaderButton>
                    </div>

                    {/* Submenu */}
                    {item.submenu && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="ml-4 mt-1 border-l-2 border-main pl-4 space-y-1">
                          {item.submenu.map((subItem, subIndex) => {
                            const SubIconComponent = subItem.icon;
                            return (
                              <div
                                key={subIndex}
                                className={`transition-all duration-300 ease-out ${
                                  isExpanded
                                    ? "translate-x-0 opacity-100"
                                    : "-translate-x-2 opacity-0"
                                }`}
                                style={{
                                  transitionDelay: `${subIndex * 30}ms`,
                                }}
                              >
                                <button
                                  onClick={() => handleSubmenuClick(subItem.to)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-surface-hover transition-colors duration-200 text-secondary hover:text-primary"
                                >
                                  <SubIconComponent size={16} />
                                  <span>{subItem.label}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Account Button */}
              <div
                className={`transform transition-all duration-300 ease-out ${
                  isMobileMenuOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-4 opacity-0"
                }`}
                style={{ transitionDelay: `${navItems.length * 50}ms` }}
              >
                <HeaderButton
                  onClick={() => {
                    console.log("Moje Konto clicked");
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start w-full md:hidden"
                >
                  <User size={iconSize} />
                  <span>Moje Konto</span>
                </HeaderButton>
              </div>

              {/* Mobile Dark/Light Switch */}
              <div
                className={`w-full flex justify-center py-3 transition-all duration-300 ease-out md:hidden ${
                  isMobileMenuOpen
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
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
  );
};

export default Header;
