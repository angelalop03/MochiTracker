import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import Loading from "../components/Loading"
import { useCycleData } from "../hooks/useCycleData"
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

export default function Settings() {
  const { profile, reload } = useCycleData()
  if (!profile) return <Loading />

  return (
    <>
      <main className="narrow-page with-nav">
        <h1 className="page-title">Ajustes</h1>
        <h2 className="section-title">Tus datos</h2>
        <DataForm profile={profile} onSaved={reload} />

        <h2 className="section-title">Importar</h2>
        <p>
          <Link to="/importar">Importar desde Clue</Link>
        </p>

        <h2 className="section-title">Cuenta</h2>
        <p>
          <Link to="/privacidad">Política de privacidad</Link>
        </p>
        <button type="button" className="button button-quiet" onClick={() => void signOut()}>
          Cerrar sesión
        </button>
      </main>
      <BottomNav />
    </>
  )
}
