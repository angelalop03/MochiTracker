import { useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import ConsentFields from "../components/ConsentFields"
import DialogBox from "../components/DialogBox"
import { useSession } from "../hooks/useSession"
import { authErrorMessage, sendSignInEmail, sendSignUpEmail, verifyCode } from "../services/auth"
import { DEMO, isConfigured } from "../services/supabase"

export default function Auth({ mode }: { mode: "signin" | "signup" }) {
  const session = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [healthConsent, setHealthConsent] = useState(false)
  const [terms, setTerms] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const signup = mode === "signup"

  if (session.status === "in") return <Navigate to="/hoy" replace />

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await action()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function handleSend(e: FormEvent) {
    e.preventDefault()
    void run(async () => {
      if (signup) await sendSignUpEmail({ email: email.trim(), name: name.trim() })
      else await sendSignInEmail(email.trim())
      setSent(true)
    })
  }

  function handleVerify(e: FormEvent) {
    e.preventDefault()
    void run(() => verifyCode(email.trim(), code.trim()))
  }

  return (
    <main className="narrow-page">
      <Link to="/" className="brand">
        Isla Mochi
      </Link>

      {!isConfigured && !DEMO && (
        <p className="form-error" role="alert">
          Falta configurar Supabase en esta instalación.
        </p>
      )}
      {DEMO && <p className="dev-note">Modo demo: no se envía ningún correo y vale cualquier código.</p>}

      {sent ? (
        <>
          <h1 className="pixel-title">Mira tu correo</h1>
          <DialogBox speaker="Mochi">
            Te he enviado un enlace a <strong>{email}</strong>. Si usas la app instalada en el móvil, escribe aquí
            el código que viene en el correo.
          </DialogBox>
          <form className="form" onSubmit={handleVerify}>
            <label className="field">
              <span>Código</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                title="El código numérico del correo"
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" disabled={busy}>
              {busy ? "Comprobando…" : "Entrar"}
            </button>
            <button type="button" className="button-link" onClick={() => setSent(false)}>
              Usar otro email
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="pixel-title">{signup ? "Crea tu isla" : "Vuelve a tu isla"}</h1>
          <form className="form" onSubmit={handleSend}>
            {signup && (
              <label className="field">
                <span>¿Cómo te llamas?</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Tu email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            {signup && (
              <ConsentFields
                health={healthConsent}
                terms={terms}
                onHealth={setHealthConsent}
                onTerms={setTerms}
              />
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button" disabled={busy}>
              {busy ? "Enviando…" : "Enviarme el acceso"}
            </button>
            <p className="form-hint">Sin contraseñas: te enviamos un enlace y un código a tu correo.</p>
          </form>
          <p className="switch-auth">
            {signup ? (
              <>
                ¿Ya tienes cuenta? <Link to="/entrar">Entra</Link>
              </>
            ) : (
              <>
                ¿Aún no tienes cuenta? <Link to="/registro">Créala</Link>
              </>
            )}
          </p>
        </>
      )}
    </main>
  )
}
