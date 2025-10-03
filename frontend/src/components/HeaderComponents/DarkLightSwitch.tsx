import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const DarkLightSwitch = () => {
    const [dark, setDark] = useState(() => {
        if (typeof window !== "undefined") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
            document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-surface') || '#18181b';
        } else {
            document.documentElement.classList.remove("dark");
            document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-surface') || '#f8fafc';
        }
    }, [dark]);

    return (
        <button
            aria-label={dark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
            className={
                "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 focus:outline-none " +
                (dark
                    ? "bg-gray-900 hover:bg-gray-800 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700")
            }
            onClick={() => setDark((d) => !d)}
            title={dark ? "Jasny motyw" : "Ciemny motyw"}
        >
            <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
                <Sun
                    size={22}
                    className={
                        "transition-all duration-300 " +
                        (dark ? "scale-0 opacity-0" : "scale-100 opacity-100")
                    }
                />
                <Moon
                    size={22}
                    className={
                        "transition-all duration-300 absolute " +
                        (dark ? "scale-100 opacity-100" : "scale-0 opacity-0")
                    }
                />
            </span>
        </button>
    );
};

export default DarkLightSwitch;