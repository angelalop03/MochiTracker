import { useState, type FormEvent } from "react"
import { ENERGY_LEVELS, MOODS, SYMPTOMS } from "../content/symptoms"
import { useSession } from "../hooks/useSession"
import { saveLog, type DailyLog } from "../services/data"

interface Props {
  date: string
  log: DailyLog | undefined
  onSaved: () => Promise<void>
}

/** Registro rápido del día: todo es opcional y se puede cambiar cuando quieras */
export default function QuickLog({ date, log, onSaved }: Props) {
  const session = useSession()
  const [energy, setEnergy] = useState<number | null>(log?.energy ?? null)
  const [mood, setMood] = useState<string | null>(log?.mood ?? null)
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? [])
  const [notes, setNotes] = useState(log?.notes ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  function toggleSymptom(id: string) {
    setStatus("idle")
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

  return (
    <section aria-labelledby="log-title" className="paper-box">
      <form className="quick-log" onSubmit={(e) => void save(e)}>
        <h2 id="log-title" className="section-title">
          ¿Cómo estás hoy?
        </h2>

        <fieldset>
          <legend>Energía</legend>
          <div className="energy">
            {ENERGY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                className="chip"
                aria-pressed={energy === level.value}
                aria-label={`Energía ${level.label.toLowerCase()}`}
                onClick={() => {
                  setStatus("idle")
                  setEnergy(energy === level.value ? null : level.value)
                }}
              >
                {level.value}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Ánimo</legend>
          <div className="chips">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="chip"
                aria-pressed={mood === m.id}
                onClick={() => {
                  setStatus("idle")
                  setMood(mood === m.id ? null : m.id)
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Síntomas</legend>
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
        </fieldset>

        <label className="field">
          <span>Notas</span>
          <textarea
            value={notes}
            maxLength={1000}
            onChange={(e) => {
              setStatus("idle")
              setNotes(e.target.value)
            }}
          />
          <small>Solo para ti. Nunca aparecen en los avisos.</small>
        </label>

        {status === "error" && (
          <p className="form-error" role="alert">
            No se ha podido guardar. Vuelve a intentarlo.
          </p>
        )}
        {status === "saved" && (
          <p className="form-ok" role="status">
            Guardado. Mochi lo tendrá en cuenta.
          </p>
        )}
        <button className="button" disabled={status === "saving"}>
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </section>
  )
}
