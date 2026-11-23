import { BookOpen, Heart, House, Settings } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useCareGameOn } from "../lib/care"

const LINKS = [
  { to: "/hoy", label: "Hoy", Icon: House },
  { to: "/guia", label: "Guía", Icon: BookOpen },
  { to: "/mochi", label: "Mochi", Icon: Heart, game: true },
  { to: "/ajustes", label: "Ajustes", Icon: Settings },
]

export default function BottomNav() {
  // «Cuida a Mochi» es opcional: se puede ocultar en Ajustes
  const game = useCareGameOn()
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {LINKS.filter((l) => game || !l.game).map(({ to, label, Icon }) => (
        <NavLink key={to} to={to}>
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
