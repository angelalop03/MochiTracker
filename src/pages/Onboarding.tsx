import { useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import ConsentFields from "../components/ConsentFields"
import DialogBox from "../components/DialogBox"
import Loading from "../components/Loading"
import { CONTRACEPTION_NOTICE } from "../content/phases"
import { PRIVACY_VERSION } from "../content/legal"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import { todayInTimeZone } from "../lib/cycle"
import { deviceTimeZone } from "../lib/format"
import { addPeriod, updateProfile } from "../services/data"

export default function Onboarding() {
  const session = useSession()
  const { profile, loading, reload } = useCycleData()
  const [lastPeriod, setLastPeriod] = useState("")
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [healthConsent, setHealthConsent] = useState(false)
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (session.status === "loading") return <Loading />
  if (session.status === "out") return <Navigate to="/entrar" replace />
  if (loading || !profile) return <Loading />
  if (profile.health_consent_at && profile.onboarded_at) return <Navigate to="/hoy" replace />

  const userId = session.user.id
  const timezone = deviceTimeZone()
  const today = todayInTimeZone(timezone)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await action()
      await reload()
    } catch (e) {
      console.error(e)
      setError("No se ha podido guardar. Revisa tu conexión y vuelve a intentarlo.")
    } finally {
      setBusy(false)
    }
  }

  // Cuenta creada sin pasar por el registro: nada de datos de salud hasta tener el consentimiento
  if (!profile.health_consent_at) {
    return (
      <main className="narrow-page">
        <h1 className="page-title">Antes de empezar</h1>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            void run(() =>
              updateProfile(userId, {
                health_consent_at: new Date().toISOString(),
                privacy_version: PRIVACY_VERSION,
              })
            )
          }}
        >
          <ConsentFields health={healthConsent} terms={terms} onHealth={setHealthConsent} onTerms={setTerms} />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            Continuar
          </button>
        </form>
      </main>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void run(async () => {
      await addPeriod(userId, lastPeriod)
      await updateProfile(userId, {
        avg_cycle_length: cycleLength,
        avg_period_length: periodLength,
        timezone,
        onboarded_at: new Date().toISOString(),
      })
    })
  }

  return (
    <main className="narrow-page">
      <h1 className="page-title">{profile.name ? `Hola, ${profile.name}` : "Hola"}</h1>
      <DialogBox speaker="Mochi">
        Soy Mochi. Con tres datos ya puedo saber qué estación hay hoy en tu isla. Si no sabes alguno, deja el valor
        que viene puesto y lo iré ajustando.
      </DialogBox>

      <p>
        ¿Usas Clue? <Link to="/importar">Importa tus datos</Link> y te ahorras este paso.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>¿Cuándo empezó tu última regla?</span>
          <input
            type="date"
            value={lastPeriod}
            max={today}
            onChange={(e) => setLastPeriod(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>¿Cuántos días suele durar tu ciclo?</span>
          <input
            type="number"
            inputMode="numeric"
            min={15}
            max={90}
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value))}
            required
          />
          <small>De un primer día de regla al siguiente. Lo más habitual está entre 21 y 35.</small>
        </label>
        <label className="field">
          <span>¿Cuántos días suele durar tu regla?</span>
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

        <p className="notice">{CONTRACEPTION_NOTICE}</p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : "Ver mi isla"}
        </button>
      </form>
    </main>
  )
}
