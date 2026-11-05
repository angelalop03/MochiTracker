import { useState } from "react"
import { Link } from "react-router-dom"
import { disablePush, enablePush, pushSupport } from "../services/push"
import { updateProfile, type Profile, type ProfilePatch } from "../services/data"

interface Props {
  profile: Profile
  onSaved: () => Promise<void>
}

export default function NotificationSettings({ profile, onSaved }: Props) {
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const support = pushSupport()

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await action()
      await onSaved()
    } catch (e) {
      console.error(e)
      setError("No se ha podido guardar. Vuelve a intentarlo.")
    } finally {
      setBusy(false)
    }
  }

  const patch = (changes: ProfilePatch) => run(() => updateProfile(profile.id, changes))

  function togglePush(on: boolean) {
    void run(async () => {
      if (on) {
        if (!(await enablePush(profile.id))) {
          setError("Tu navegador no ha dado permiso. Puedes activarlo en los ajustes del móvil.")
          return
        }
      } else {
        await disablePush()
      }
      await updateProfile(profile.id, { notify_push: on })
    })
  }

  return (
    <div className="form">
      <label className="check">
        <input
          type="checkbox"
          checked={profile.notify_email}
          disabled={busy}
          onChange={(e) => void patch({ notify_email: e.target.checked })}
        />
        <span>Avisos por email</span>
      </label>

      {support === "ready" && (
        <label className="check">
          <input
            type="checkbox"
            checked={profile.notify_push}
            disabled={busy}
            onChange={(e) => togglePush(e.target.checked)}
          />
          <span>Notificaciones en este dispositivo</span>
        </label>
      )}
      {support === "needs_install" && (
        <p className="notice">
          En iPhone las notificaciones solo funcionan con la app instalada.{" "}
          <Link to="/instalar">Mira cómo instalarla</Link>.
        </p>
      )}
      {support === "unsupported" && <p className="form-hint">Este navegador no admite notificaciones.</p>}

      <fieldset className="consent">
        <legend>¿Cada cuánto?</legend>
        <label className="check">
          <input
            type="radio"
            name="frequency"
            checked={profile.notify_frequency === "phase_change"}
            disabled={busy}
            onChange={() => void patch({ notify_frequency: "phase_change" })}
          />
          <span>Solo cuando cambie de estación</span>
        </label>
        <label className="check">
          <input
            type="radio"
            name="frequency"
            checked={profile.notify_frequency === "daily"}
            disabled={busy}
            onChange={() => void patch({ notify_frequency: "daily" })}
          />
          <span>Un consejo cada día</span>
        </label>
      </fieldset>

      <p className="form-hint">
        Se envían por la mañana. Los títulos no mencionan tu ciclo, por si se ven en la pantalla de bloqueo.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
