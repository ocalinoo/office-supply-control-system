"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme("default")}
        className={`p-2 rounded-lg transition-colors ${
          theme === "default"
            ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title="Default (System)"
      >
        <Monitor className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-lg transition-colors ${
          theme === "light"
            ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title="Light Mode"
      >
        <Sun className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-lg transition-colors ${
          theme === "dark"
            ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-5 h-5" />
      </button>
    </div>
  );
}
