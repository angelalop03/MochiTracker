import { BookOpen, House, Settings } from "lucide-react"
import { NavLink } from "react-router-dom"

const LINKS = [
  { to: "/hoy", label: "Hoy", Icon: House },
  { to: "/guia", label: "Guía", Icon: BookOpen },
  { to: "/ajustes", label: "Ajustes", Icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {LINKS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to}>
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
