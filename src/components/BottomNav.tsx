import { NavLink } from "react-router-dom"

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      <NavLink to="/hoy">Hoy</NavLink>
      <NavLink to="/guia">Guía</NavLink>
      <NavLink to="/ajustes">Ajustes</NavLink>
    </nav>
  )
}
