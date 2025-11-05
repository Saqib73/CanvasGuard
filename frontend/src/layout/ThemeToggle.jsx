import { useStore } from "../store";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useStore();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="p-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-center"
    >
      <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
};
