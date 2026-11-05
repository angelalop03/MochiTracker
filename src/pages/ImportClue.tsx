import { useState, type FormEvent, type ReactNode } from "react"
import { Link, Navigate } from "react-router-dom"
import DialogBox from "../components/DialogBox"
import Loading from "../components/Loading"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import { parseClueExport, withoutKnownPeriods } from "../lib/clue/parser"
import { readExportFile } from "../lib/clue/read"
import {
  CLUE_ERROR_MESSAGES,
  ClueImportError,
  summarizeImport,
  type ImportResult,
  type ImportSummary,
} from "../lib/clue/types"
import { deviceTimeZone } from "../lib/format"
import { saveImport, updateProfile } from "../services/data"

const ROSE = "#F7B6C6"
const LILAC = "#E2D6F5"
const INK = "#4A2F45"

function Art({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#FBE3EA" />
      {children}
    </svg>
  )
}

const STEPS: { art: ReactNode; text: ReactNode }[] = [
  {
    art: (
      <Art>
        <rect x="20" y="24" width="24" height="4" rx="2" fill={INK} />
        <rect x="20" y="36" width="24" height="4" rx="2" fill={INK} />
      </Art>
    ),
    text: <>Abre Clue y pulsa el menú «=» arriba a la derecha de la vista del ciclo.</>,
  },
  {
    art: (
      <Art>
        <rect x="18" y="16" width="28" height="32" rx="6" fill="#fff" />
        <rect x="24" y="24" width="16" height="4" rx="2" fill={ROSE} />
        <rect x="24" y="32" width="16" height="4" rx="2" fill={LILAC} />
        <rect x="24" y="40" width="10" height="3" rx="1.5" fill={LILAC} />
      </Art>
    ),
    text: (
      <>
        Entra en Ajustes → <strong>«Download my data»</strong> → <strong>«Request data»</strong>.
      </>
    ),
  },
  {
    art: (
      <Art>
        <circle cx="26" cy="32" r="10" fill={INK} />
        <circle cx="26" cy="32" r="4" fill="#FBE3EA" />
        <rect x="34" y="30" width="16" height="4" rx="2" fill={INK} />
        <rect x="44" y="30" width="4" height="10" rx="2" fill={INK} />
      </Art>
    ),
    text: <>Apunta la contraseña que aparece en pantalla: la necesitarás para abrir el archivo.</>,
  },
  {
    art: (
      <Art>
        <rect x="14" y="20" width="36" height="26" rx="6" fill="#fff" />
        <path d="M16 24 L32 36 L48 24" fill="none" stroke={ROSE} strokeWidth="4" strokeLinecap="round" />
      </Art>
    ),
    text: <>Abre el email de Clue y descarga tus datos. El enlace caduca a las 72 horas.</>,
  },
  {
    art: (
      <Art>
        <rect x="29" y="24" width="6" height="20" rx="3" fill={INK} />
        <path d="M22 30 L32 18 L42 30" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </Art>
    ),
    text: <>Sube aquí el archivo ZIP y escribe la contraseña, o descomprímelo tú y sube el archivo JSON.</>,
  },
]

type Step =
  | { name: "pick" }
  | { name: "review"; result: ImportResult; summary: ImportSummary; skipped: number }
  | { name: "done" }

export default function ImportClue() {
  const session = useSession()
  const { profile, periods, loading, reload } = useCycleData()
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<Step>({ name: "pick" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (session.status === "loading") return <Loading />
  if (session.status === "out") return <Navigate to="/entrar" replace />
  if (loading || !profile) return <Loading />
  if (!profile.health_consent_at) return <Navigate to="/bienvenida" replace />
  const userId = session.user.id

  async function handleRead(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setError("")
    try {
      const parsed = parseClueExport(await readExportFile(file, password))
      const result = withoutKnownPeriods(parsed, periods)
      setStep({
        name: "review",
        result,
        summary: summarizeImport(parsed),
        skipped: parsed.periods.length - result.periods.length,
      })
    } catch (err) {
      if (err instanceof ClueImportError) setError(CLUE_ERROR_MESSAGES[err.code])
      else {
        console.error(err)
        setError("No hemos podido leer el archivo. Vuelve a intentarlo.")
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleSave(result: ImportResult) {
    setBusy(true)
    setError("")
    try {
      await saveImport(userId, result)
      if (!profile?.onboarded_at) {
        await updateProfile(userId, { timezone: deviceTimeZone(), onboarded_at: new Date().toISOString() })
      }
      await reload()
      setStep({ name: "done" })
    } catch (err) {
      console.error(err)
      setError("No se ha podido guardar. Vuelve a intentarlo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="narrow-page">
      <Link to={profile.onboarded_at ? "/ajustes" : "/bienvenida"} className="brand">
        Volver
      </Link>
      <h1 className="page-title">Importar desde Clue</h1>

      {step.name === "pick" && (
        <>
          <ol className="guide">
            {STEPS.map((s, i) => (
              <li key={i}>
                {s.art}
                <p>
                  <strong>{i + 1}.</strong> {s.text}
                </p>
              </li>
            ))}
          </ol>

          <p className="notice">
            El archivo se procesa en tu propio dispositivo. Solo se guardan las fechas de regla y los síntomas, no el
            archivo entero.
          </p>

          <form className="form" onSubmit={(e) => void handleRead(e)}>
            <label className="field drop-zone">
              <span>Archivo de Clue (ZIP o JSON)</span>
              <input
                type="file"
                accept=".zip,.json,application/zip,application/json"
                onChange={(e) => {
                  setError("")
                  setFile(e.target.files?.[0] ?? null)
                }}
                required
              />
            </label>
            <label className="field">
              <span>Contraseña del archivo</span>
              <input
                type="password"
                value={password}
                autoComplete="off"
                onChange={(e) => {
                  setError("")
                  setPassword(e.target.value)
                }}
              />
              <small>Solo si subes el ZIP. No se guarda ni se envía.</small>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" disabled={busy}>
              {busy ? "Abriendo…" : "Abrir archivo"}
            </button>
          </form>
        </>
      )}

      {step.name === "review" && (
        <>
          <DialogBox speaker="Mochi">{step.summary.text}</DialogBox>
          <p>¿Guardamos estos datos en tu cuenta? Lo que ya tenías registrado no se modifica.</p>
          {step.skipped > 0 && (
            <p className="form-hint">
              {step.skipped === 1 ? "1 regla ya estaba registrada" : `${step.skipped} reglas ya estaban registradas`} y no
              se duplicará.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="button" disabled={busy} onClick={() => void handleSave(step.result)}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" className="button button-quiet" onClick={() => setStep({ name: "pick" })}>
            Cancelar
          </button>
        </>
      )}

      {step.name === "done" && (
        <>
          <DialogBox speaker="Mochi">¡Listo! Ya tengo tu historial.</DialogBox>
          <Link className="button" to="/hoy">
            Ver mi isla
          </Link>
        </>
      )}
    </main>
  )
}
