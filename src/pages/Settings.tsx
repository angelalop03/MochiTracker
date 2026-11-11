import {
  BellRing,
  CalendarDays,
  Download,
  Droplets,
  FileText,
  GraduationCap,
  LogOut,
  Palette,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"
import { useRef, useState, type FormEvent } from "react"
import AiSettings from "../components/AiSettings"
import AvatarPicker from "../components/AvatarPicker"
import BottomNav from "../components/BottomNav"
import Loading from "../components/Loading"
import MochiAvatar, { isAvatarId, type AvatarId } from "../components/MochiAvatar"
import NotificationSettings from "../components/NotificationSettings"
import { Segmented, SettingsGroup, SettingsRow, Stepper } from "../components/settings"
import { DISCLAIMER } from "../content/phases"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import { setClueEvery, useClueReminder, type ClueEvery } from "../lib/clueReminder"
import { useTheme, type ThemePref } from "../lib/theme"
import { deleteAccount, exportData } from "../services/account"
import { signOut } from "../services/auth"
import { updateProfile, type Profile } from "../services/data"

type SaveState = "idle" | "saving" | "saved" | "error"

function ProfileCard({ profile, email, onSaved }: { profile: Profile; email: string; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(profile.name ?? "")
  const [state, setState] = useState<SaveState>("idle")
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const initial = (profile.name?.trim()[0] ?? email[0] ?? "?").toUpperCase()
  const avatar = isAvatarId(profile.avatar) ? profile.avatar : null

  async function chooseAvatar(next: AvatarId | null) {
    setAvatarError(false)
    try {
      await updateProfile(profile.id, { avatar: next })
      await onSaved()
    } catch (error) {
      console.error(error)
      setAvatarError(true)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setState("saving")
    try {
      await updateProfile(profile.id, { name: name.trim() || null })
      await onSaved()
      setState("saved")
      setEditing(false)
    } catch (error) {
      console.error(error)
      setState("error")
    }
  }

  return (
    <section className="profile-card" aria-label="Tu perfil">
      <button
        type="button"
        className="avatar-button"
        aria-expanded={picking}
        aria-label={picking ? "Cerrar la elección de Mochi" : "Cambiar tu foto de perfil"}
        onClick={() => setPicking(!picking)}
      >
        {avatar ? (
          <MochiAvatar avatar={avatar} size={64} />
        ) : (
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
        )}
        <span className="avatar-badge" aria-hidden="true">
          <Pencil size={12} strokeWidth={2.5} />
        </span>
      </button>
      <div className="profile-text">
        <strong>{profile.name || "Sin nombre"}</strong>
        <span>{email}</span>
      </div>
      <button
        type="button"
        className="profile-edit"
        aria-expanded={editing}
        onClick={() => {
          setState("idle")
          setName(profile.name ?? "")
          setEditing(!editing)
        }}
      >
        {editing ? "Cancelar" : "Editar"}
      </button>
      {editing && (
        <form className="profile-form" onSubmit={(e) => void save(e)}>
          <label className="field">
            <span>Tu nombre</span>
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              autoFocus
            />
          </label>
          <button className="button" disabled={state === "saving"}>
            {state === "saving" ? "Guardando…" : "Guardar"}
          </button>
          {state === "error" && (
            <span className="form-error" role="alert">
              No se ha podido guardar.
            </span>
          )}
        </form>
      )}
      {picking && (
        <div className="avatar-panel">
          <p className="avatar-panel-title">Elige tu Mochi</p>
          <AvatarPicker value={avatar} onChange={(next) => void chooseAvatar(next)} initial={initial} />
          {avatarError && (
            <p className="form-error" role="alert">
              No se ha podido guardar. Vuelve a intentarlo.
            </p>
          )}
        </div>
      )}
      {state === "saved" && !editing && (
        <span className="form-ok profile-saved" role="status">
          Nombre guardado
        </span>
      )}
    </section>
  )
}

/** Las duraciones se guardan solas, sin botón */
function CycleSettings({ profile, onSaved }: { profile: Profile; onSaved: () => Promise<void> }) {
  const [cycle, setCycle] = useState(profile.avg_cycle_length)
  const [period, setPeriod] = useState(profile.avg_period_length)
  const [state, setState] = useState<SaveState>("idle")
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)

  function schedule(next: { avg_cycle_length?: number; avg_period_length?: number }) {
    setState("saving")
    if (pending.current) clearTimeout(pending.current)
    pending.current = setTimeout(async () => {
      try {
        await updateProfile(profile.id, next)
        await onSaved()
        setState("saved")
      } catch (error) {
        console.error(error)
        setState("error")
      }
    }, 500)
  }

  const footer =
    state === "saving"
      ? "Guardando…"
      : state === "saved"
        ? "Guardado. Con 3 ciclos completos se calculan solas a partir de tu historial."
        : state === "error"
          ? "No se ha podido guardar. Vuelve a intentarlo."
          : "Con 3 ciclos completos se calculan solas a partir de tu historial."

  return (
    <SettingsGroup title="Tu ciclo" footer={footer}>
      <SettingsRow
        icon={RefreshCw}
        label="Ciclo"
        hint="Duración media"
        control={
          <Stepper
            label="Duración del ciclo"
            value={cycle}
            min={15}
            max={90}
            unit="días"
            onChange={(v) => {
              setCycle(v)
              schedule({ avg_cycle_length: v, avg_period_length: period })
            }}
          />
        }
      />
      <SettingsRow
        icon={Droplets}
        label="Regla"
        hint="Duración media"
        control={
          <Stepper
            label="Duración de la regla"
            value={period}
            min={1}
            max={15}
            unit="días"
            onChange={(v) => {
              setPeriod(v)
              schedule({ avg_cycle_length: cycle, avg_period_length: v })
            }}
          />
        }
      />
      <SettingsRow icon={CalendarDays} label="Mis fechas" hint="Ver y corregir tus reglas" to="/mis-fechas" />
    </SettingsGroup>
  )
}

function ClueSettings() {
  return (
    <SettingsGroup
      title="Clue"
      footer="Clue no deja que otras apps lean tus datos, así que se traen con su exportación. Es mucho más cómodo hacerlo desde el ordenador: pides la exportación en Clue, te llega un correo con el archivo y lo subes aquí."
    >
      <SettingsRow icon={Upload} label="Importar desde Clue" hint="Mejor desde el ordenador" to="/importar" />
      <ClueReminderSetting />
    </SettingsGroup>
  )
}

function ClueReminderSetting() {
  const { every } = useClueReminder("", false)
  return (
    <div className="settings-row settings-row-stack">
      <span className="settings-icon">
        <BellRing size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="settings-label">
        <span className="settings-title">
          <span>Recordarme actualizar desde Clue</span>
          <small>Te lo sugerimos en Hoy, solo si ya has importado</small>
        </span>
        <Segmented<ClueEvery>
          label="Cada cuánto recordarlo"
          value={every}
          onChange={setClueEvery}
          options={[
            { value: "off", label: "Nunca" },
            { value: "3", label: "3 meses" },
            { value: "6", label: "6 meses" },
          ]}
        />
      </span>
    </div>
  )
}

function Appearance() {
  const { pref, setPref } = useTheme()
  return (
    <SettingsGroup title="Apariencia" footer="En automático, la isla se hace de noche cuando tu móvil está en modo oscuro.">
      <div className="settings-row settings-row-stack">
        <span className="settings-icon">
          <Palette size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="settings-label">
          <span>Tema</span>
          <Segmented<ThemePref>
            label="Tema de la app"
            value={pref}
            onChange={setPref}
            options={[
              { value: "auto", label: "Automático" },
              { value: "light", label: "Día" },
              { value: "dark", label: "Noche" },
            ]}
          />
        </span>
      </div>
    </SettingsGroup>
  )
}

function Help() {
  return (
    <SettingsGroup title="Ayuda">
      <SettingsRow icon={GraduationCap} label="Ver el tutorial" hint="Mochi te explica la app en un minuto" to="/hoy?tutorial" />
    </SettingsGroup>
  )
}

function AccountSettings({ userId, email }: { userId: string; email: string }) {
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
    <SettingsGroup
      title="Privacidad y cuenta"
      footer={
        error && (
          <span className="form-error" role="alert">
            {error}
          </span>
        )
      }
    >
      <SettingsRow icon={FileText} label="Política de privacidad" to="/privacidad" />
      <SettingsRow
        icon={Download}
        label="Exportar mis datos"
        hint="Un archivo con todo lo que guardamos"
        disabled={busy}
        onClick={() => void run(() => exportData(userId, email), "No se han podido exportar tus datos.")}
      />
      <SettingsRow icon={LogOut} label="Cerrar sesión" onClick={() => void signOut()} />
      <details className="settings-danger">
        <summary>
          <span className="settings-icon is-danger">
            <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="is-danger">Borrar mi cuenta</span>
        </summary>
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
          <button className="button button-danger" disabled={busy || confirm.trim() !== "BORRAR"}>
            Borrar todo
          </button>
        </form>
      </details>
    </SettingsGroup>
  )
}

export default function Settings() {
  const session = useSession()
  const { profile, reload } = useCycleData()
  if (!profile || session.status !== "in") return <Loading />

  return (
    <>
      <main className="narrow-page with-nav settings-page">
        <h1 className="page-title">Ajustes</h1>
        <ProfileCard profile={profile} email={session.user.email} onSaved={reload} />
        <CycleSettings profile={profile} onSaved={reload} />
        <ClueSettings />
        <NotificationSettings profile={profile} onSaved={reload} />
        <Appearance />
        <Help />
        <AiSettings profile={profile} onSaved={reload} />
        <AccountSettings userId={session.user.id} email={session.user.email} />
        <p className="legal-note">{DISCLAIMER}</p>
      </main>
      <BottomNav />
    </>
  )
}
