import { Bell, Mail, Repeat, Smartphone } from "lucide-react"
import { useState } from "react"
import { disablePush, enablePush, pushSupport } from "../services/push"
import { updateProfile, type Profile, type ProfilePatch } from "../services/data"
import { Segmented, SettingsGroup, SettingsRow, Switch } from "./settings"

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
    <SettingsGroup
      title="Avisos"
      footer={
        error ? (
          <span className="form-error" role="alert">
            {error}
          </span>
        ) : (
          "Llegan por la mañana. Los títulos no mencionan tu ciclo, por si se ven en la pantalla de bloqueo."
        )
      }
    >
      <SettingsRow
        icon={Mail}
        label="Por email"
        control={
          <Switch
            label="Avisos por email"
            checked={profile.notify_email}
            disabled={busy}
            onChange={(on) => void patch({ notify_email: on })}
          />
        }
      />

      {support === "ready" && (
        <SettingsRow
          icon={Bell}
          label="Notificaciones"
          hint="En este dispositivo"
          control={
            <Switch label="Notificaciones en este dispositivo" checked={profile.notify_push} disabled={busy} onChange={togglePush} />
          }
        />
      )}
      {support === "needs_install" && (
        <SettingsRow icon={Bell} label="Notificaciones" hint="En iPhone necesitas instalar la app" to="/instalar" />
      )}
      {support === "unsupported" && <SettingsRow icon={Bell} label="Notificaciones" value="No disponible" />}

      <div className="settings-row settings-row-stack">
        <span className="settings-icon">
          <Repeat size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="settings-label">
          <span>Frecuencia</span>
          <Segmented
            label="Frecuencia de los avisos"
            value={profile.notify_frequency}
            disabled={busy}
            onChange={(value) => void patch({ notify_frequency: value })}
            options={[
              { value: "phase_change", label: "Cambio de estación" },
              { value: "daily", label: "Cada día" },
            ]}
          />
        </span>
      </div>

      <SettingsRow icon={Smartphone} label="Instalar en el móvil" to="/instalar" />
    </SettingsGroup>
  )
}
