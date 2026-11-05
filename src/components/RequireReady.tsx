import { Navigate, Outlet } from "react-router-dom"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import Loading from "./Loading"

/** Rutas privadas: exige sesión, consentimiento y haber terminado la bienvenida */
export default function RequireReady() {
  const session = useSession()
  const { profile, loading, failed, reload } = useCycleData()

  if (session.status === "loading") return <Loading />
  if (session.status === "out") return <Navigate to="/entrar" replace />

  if (failed) {
    return (
      <div className="center-screen">
        <p>No hemos podido cargar tus datos.</p>
        <button type="button" className="button" onClick={() => void reload()}>
          Reintentar
        </button>
      </div>
    )
  }
  if (loading || !profile) return <Loading />
  if (!profile.health_consent_at || !profile.onboarded_at) return <Navigate to="/bienvenida" replace />

  return <Outlet />
}
