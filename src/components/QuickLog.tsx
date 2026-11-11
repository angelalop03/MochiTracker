import {
  Balloon,
  BatteryLow,
  Bone,
  Brain,
  Check,
  ChevronDown,
  CircleAlert,
  Cookie,
  Droplets,
  Heart,
  Lock,
  MoonStar,
  NotebookPen,
  Sparkle,
  Stethoscope,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { ALARM_SYMPTOMS, ENERGY_LEVELS, MOODS, SYMPTOMS, symptomLabel, type SymptomId } from "../content/symptoms"
import { useSession } from "../hooks/useSession"
import { saveLog, type DailyLog } from "../services/data"
import MochiFace from "./MochiFace"

interface Props {
  date: string
  log: DailyLog | undefined
  onSaved: () => Promise<void>
}

const NOTE_MAX = 1000

const SYMPTOM_ICONS: Record<SymptomId, LucideIcon> = {
  cansancio: BatteryLow,
  calambres: Zap,
  dolor_lumbar: Bone,
  dolor_cabeza: Brain,
  hinchazon: Balloon,
  pecho_sensible: Heart,
  granitos: Sparkle,
  piel_grasa: Droplets,
  antojos: Cookie,
  insomnio: MoonStar,
  nauseas: Waves,
  dolor_fuerte: CircleAlert,
  sangrado_abundante: CircleAlert,
}

const SYMPTOM_GROUPS: { title: string; ids: SymptomId[] }[] = [
  { title: "Dolor y molestias", ids: ["calambres", "dolor_lumbar", "dolor_cabeza", "pecho_sensible"] },
  { title: "Digestión y apetito", ids: ["hinchazon", "nauseas", "antojos"] },
  { title: "Descanso", ids: ["cansancio", "insomnio"] },
  { title: "Piel", ids: ["granitos", "piel_grasa"] },
  { title: "Importante", ids: ["dolor_fuerte", "sangrado_abundante"] },
]

function listSummary(ids: string[]) {
  if (ids.length === 0) return "Nada marcado"
  const names = ids.map((id) => symptomLabel(id).toLowerCase())
  const text = names.slice(0, 3).join(", ")
  const more = names.length > 3 ? ` y ${names.length - 3} más` : ""
  return text.charAt(0).toUpperCase() + text.slice(1) + more
}

/** «Tu día»: un check-in visual. Todo es opcional y se puede cambiar cuando quieras */
export default function QuickLog({ date, log, onSaved }: Props) {
  const session = useSession()
  const [energy, setEnergy] = useState<number | null>(log?.energy ?? null)
  const [mood, setMood] = useState<string | null>(log?.mood ?? null)
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? [])
  const [notes, setNotes] = useState(log?.notes ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const touch = () => setStatus("idle")

  function toggleSymptom(id: string) {
    touch()
    setSymptoms((list) => (list.includes(id) ? list.filter((s) => s !== id) : [...list, id]))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (session.status !== "in") return
    setStatus("saving")
    try {
      await saveLog(session.user.id, { date, symptoms, mood, energy, notes: notes.trim() || null })
      await onSaved()
      setStatus("saved")
    } catch (error) {
      console.error(error)
      setStatus("error")
    }
  }

  const energyLabel = ENERGY_LEVELS.find((l) => l.value === energy)?.label
  const ordered = SYMPTOMS.map((s) => s.id).filter((id) => symptoms.includes(id))
  const hasAlarm = symptoms.some((s) => ALARM_SYMPTOMS.includes(s))
  const note = notes.trim()

  return (
    <form className="checkin" onSubmit={(e) => void save(e)} aria-labelledby="checkin-title">
      <div className="checkin-head">
        <h3 id="checkin-title">¿Cómo estás hoy?</h3>
        <p>Mochi lo usa para afinar tus consejos. Todo es opcional.</p>
      </div>

      <fieldset className="checkin-block">
        <legend>Ánimo</legend>
        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="mood-option"
              aria-pressed={mood === m.id}
              onClick={() => {
                touch()
                setMood(mood === m.id ? null : m.id)
              }}
            >
              <MochiFace mood={m.id} size={40} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="checkin-block">
        <legend>
          Energía {energyLabel && <span className="checkin-value">· {energyLabel}</span>}
        </legend>
        <div className="battery" role="group" aria-label="Nivel de energía">
          {ENERGY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              aria-pressed={energy === level.value}
              aria-label={`Energía ${level.label.toLowerCase()}`}
              className={energy !== null && level.value <= energy ? "is-filled" : undefined}
              onClick={() => {
                touch()
                setEnergy(energy === level.value ? null : level.value)
              }}
            />
          ))}
          <span className="battery-tip" aria-hidden="true" />
        </div>
        <div className="battery-scale" aria-hidden="true">
          <span>Muy baja</span>
          <span>Muy alta</span>
        </div>
      </fieldset>

      <details className="checkin-more">
        <summary>
          <span className="more-icon">
            <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="more-text">
            <strong>
              Síntomas
              {symptoms.length > 0 && <span className="count">{symptoms.length}</span>}
            </strong>
            <span>{listSummary(ordered)}</span>
          </span>
          <ChevronDown className="more-chevron" size={18} aria-hidden="true" />
        </summary>
        <div className="symptom-groups">
          {SYMPTOM_GROUPS.map((group) => (
            <div key={group.title} className="symptom-group" data-important={group.title === "Importante" || undefined}>
              <span className="symptom-group-title">{group.title}</span>
              <div className="symptom-chips">
                {group.ids.map((id) => {
                  const Icon = symptoms.includes(id) ? Check : SYMPTOM_ICONS[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      className="symptom-chip"
                      aria-pressed={symptoms.includes(id)}
                      onClick={() => toggleSymptom(id)}
                    >
                      <Icon size={16} strokeWidth={2} aria-hidden="true" />
                      {symptomLabel(id)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {hasAlarm && (
            <p className="symptom-alert" role="status">
              Al guardar, Mochi te mostrará cuándo conviene consultarlo con un profesional.
            </p>
          )}
        </div>
      </details>

      <details className="checkin-more">
        <summary>
          <span className="more-icon">
            <NotebookPen size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="more-text">
            <strong>
              Una nota para ti
              {note && <span className="count">1</span>}
            </strong>
            <span>{note ? note : "Lo que quieras recordar de hoy"}</span>
          </span>
          <ChevronDown className="more-chevron" size={18} aria-hidden="true" />
        </summary>
        <label className="note-paper">
          <span className="sr-only">Nota</span>
          <textarea
            value={notes}
            maxLength={NOTE_MAX}
            rows={5}
            placeholder="Cómo te has sentido, qué te ha ayudado, algo que no quieras olvidar…"
            onChange={(e) => {
              touch()
              setNotes(e.target.value)
            }}
          />
        </label>
        <div className="note-foot">
          <span>
            <Lock size={14} strokeWidth={2} aria-hidden="true" />
            Solo para ti. Nunca aparece en los avisos ni la usa la IA.
          </span>
          <span aria-hidden="true">
            {notes.length}/{NOTE_MAX}
          </span>
        </div>
      </details>

      {status === "error" && (
        <p className="form-error" role="alert">
          No se ha podido guardar. Vuelve a intentarlo.
        </p>
      )}
      <div className="checkin-actions">
        <button className="button" disabled={status === "saving"}>
          {status === "saving" ? "Guardando…" : log ? "Actualizar" : "Guardar"}
        </button>
        {status === "saved" && (
          <span className="form-ok" role="status">
            Guardado. Mochi lo tendrá en cuenta.
          </span>
        )}
      </div>
    </form>
  )
}
