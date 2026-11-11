import { useState, type FormEvent } from "react"
import { ENERGY_LEVELS, MOODS, SYMPTOMS } from "../content/symptoms"
import { useSession } from "../hooks/useSession"
import { saveLog, type DailyLog } from "../services/data"
import MochiFace from "./MochiFace"

interface Props {
  date: string
  log: DailyLog | undefined
  onSaved: () => Promise<void>
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
          Síntomas
          {symptoms.length > 0 && <span className="count">{symptoms.length}</span>}
        </summary>
        <div className="chips">
          {SYMPTOMS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip"
              aria-pressed={symptoms.includes(s.id)}
              onClick={() => toggleSymptom(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </details>

      <details className="checkin-more">
        <summary>Una nota para ti{notes.trim() && <span className="count">1</span>}</summary>
        <label className="field">
          <span className="sr-only">Nota</span>
          <textarea
            value={notes}
            maxLength={1000}
            placeholder="Lo que quieras recordar de hoy"
            onChange={(e) => {
              touch()
              setNotes(e.target.value)
            }}
          />
          <small>Solo para ti. Nunca aparece en los avisos ni la usa la IA.</small>
        </label>
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
