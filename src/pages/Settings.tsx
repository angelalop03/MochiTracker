import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import Loading from "../components/Loading"
import NotificationSettings from "../components/NotificationSettings"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import { deleteAccount, exportData } from "../services/account"
import { signOut } from "../services/auth"
import { updateProfile, type Profile } from "../services/data"

function DataForm({ profile, onSaved }: { profile: Profile; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(profile.name ?? "")
  const [cycleLength, setCycleLength] = useState(profile.avg_cycle_length)
  const [periodLength, setPeriodLength] = useState(profile.avg_period_length)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function save(e: FormEvent) {
    e.preventDefault()
    setStatus("saving")
    try {
      await updateProfile(profile.id, {
        name: name.trim() || null,
        avg_cycle_length: cycleLength,
        avg_period_length: periodLength,
      })
      await onSaved()
      setStatus("saved")
    } catch (error) {
      console.error(error)
      setStatus("error")
    }
  }

  return (
    <form className="form" onSubmit={(e) => void save(e)}>
      <label className="field">
        <span>Tu nombre</span>
        <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      </label>
      <label className="field">
        <span>Duración media del ciclo (días)</span>
        <input
          type="number"
          inputMode="numeric"
          min={15}
          max={90}
          value={cycleLength}
          onChange={(e) => setCycleLength(Number(e.target.value))}
          required
        />
        <small>Cuando haya 3 ciclos completos registrados, se calculará a partir de tu historial.</small>
      </label>
      <label className="field">
        <span>Duración media de la regla (días)</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={15}
          value={periodLength}
          onChange={(e) => setPeriodLength(Number(e.target.value))}
          required
        />
      </label>
      {status === "error" && (
        <p className="form-error" role="alert">
          No se ha podido guardar. Vuelve a intentarlo.
        </p>
      )}
      {status === "saved" && <p role="status">Guardado</p>}
      <button className="button" disabled={status === "saving"}>
        {status === "saving" ? "Guardando…" : "Guardar"}
      </button>
    </form>
  )
}

function AccountActions({ userId, email }: { userId: string; email: string }) {
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true)
    setError("")
    try {
      await action()
    } catch (e) {
      console.error(e)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="button button-quiet"
        disabled={busy}
        onClick={() => void run(() => exportData(userId, email), "No se han podido exportar tus datos.")}
      >
        Exportar mis datos
      </button>
      <button type="button" className="button button-quiet" onClick={() => void signOut()}>
        Cerrar sesión
      </button>

      <details className="period-form">
        <summary>Borrar mi cuenta</summary>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            void run(deleteAccount, "No se ha podido borrar la cuenta. Vuelve a intentarlo.")
          }}
        >
          <p>Se borrarán tu cuenta y todos tus datos para siempre. No se puede deshacer.</p>
          <label className="field">
            <span>Escribe BORRAR para confirmar</span>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy || confirm.trim() !== "BORRAR"}>
            Borrar todo
          </button>
        </form>
      </details>
    </>
  )
}

export default function Settings() {
  const session = useSession()
  const { profile, reload } = useCycleData()
  if (!profile || session.status !== "in") return <Loading />

  return (
    <>
      <main className="narrow-page with-nav">
        <h1 className="page-title">Ajustes</h1>
        <h2 className="section-title">Tus datos</h2>
        <DataForm profile={profile} onSaved={reload} />

        <p>
          <Link to="/mis-fechas">Ver y corregir mis fechas</Link>
        </p>
        <p>
          <Link to="/importar">Importar desde Clue</Link>
        </p>

        <h2 className="section-title">Avisos</h2>
        <NotificationSettings profile={profile} onSaved={reload} />
        <p>
          <Link to="/instalar">Instalar en el móvil</Link>
        </p>

        <h2 className="section-title">Cuenta</h2>
        <p>
          <Link to="/privacidad">Política de privacidad</Link>
        </p>
        <AccountActions userId={session.user.id} email={session.user.email} />
      </main>
      <BottomNav />
    </>
  )
}
