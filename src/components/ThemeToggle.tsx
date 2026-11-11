import { Moon, Sun } from "lucide-react"
import { useTheme } from "../lib/theme"

/** Cambia entre día y noche en la isla */
export default function ThemeToggle() {
  const { theme, setPref } = useTheme()
  const dark = theme === "dark"
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={dark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      onClick={() => setPref(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  )
}
