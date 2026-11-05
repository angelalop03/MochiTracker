import { NavLink } from "react-router-dom"

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      <NavLink to="/hoy">Hoy</NavLink>
      <NavLink to="/mi-ciclo">Mi ciclo</NavLink>
      <NavLink to="/ajustes">Ajustes</NavLink>
    </nav>
  )
}
