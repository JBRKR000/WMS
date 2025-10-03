import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../utils/ThemeContext";

const DarkLightSwitch = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface-hover hover:bg-surface-secondary border border-main transition-all duration-200 hover:scale-105"
      aria-label={`Przełącz na motyw ${
        theme === "light" ? "ciemny" : "jasny"
      }`}
      title={`Przełącz na motyw ${
        theme === "light" ? "ciemny" : "jasny"
      }`}
    >
      {theme === "light" ? (
        <Moon
          size={20}
          className="text-main hover:text-primary transition-colors"
        />
      ) : (
        <Sun
          size={20}
          className="text-main hover:text-primary transition-colors"
        />
      )}
    </button>
  );
};

export default DarkLightSwitch;