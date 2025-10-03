import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export type SidebarSection = {
  label: string;
  items: Array<{
    to: string;
    icon: LucideIcon;
    label: string;
  }>;
};

type SidebarProps = {
  sections: SidebarSection[];
  className?: string;
};

const Sidebar = ({ sections, className = "" }: SidebarProps) => (
  <aside className={`w-64 min-h-screen px-3 py-6 bg-[var(--color-surface)] border-r border-gray-200 dark:border-gray-800 flex flex-col ${className}`}>
    <nav className="flex flex-col gap-2">
      {sections.map((section, idx) => (
        <div key={section.label} className="mb-2">
          <div className="px-2 pb-1 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider select-none">
            {section.label}
          </div>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-[var(--color-text)] transition-colors duration-200 ${
                      isActive
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }
                  end
                >
                  <item.icon size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {idx < sections.length - 1 && (
            <hr className="my-3 border-t border-gray-200 dark:border-gray-800" />
          )}
        </div>
      ))}
    </nav>
  </aside>
);

export default Sidebar;