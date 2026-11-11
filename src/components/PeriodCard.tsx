import { CalendarDays, Check, ChevronDown, Droplet } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useSession } from "../hooks/useSession"
import { formatDay, formatInDays } from "../lib/format"
import { addPeriod } from "../services/data"

interface Props {
  today: string
  onSaved: () => Promise<void>
  /** Inicio de la última regla registrada */
  lastStart?: string
  nextPeriodDate?: string | null
  /** Días hasta la próxima regla estimada */
  inDays?: number | null
  daysLate?: number
  /** Fuera de la fase lútea: plegada y discreta, por si hay que corregir algo */
  quiet?: boolean
}

function subtitle({ lastStart, nextPeriodDate, inDays, daysLate }: Omit<Props, "today" | "onSaved">) {
  if (!lastStart) return "Registra la última para que Mochi sepa en qué estación estás."
  if (daysLate && daysLate > 0) {
    return `Lleva ${daysLate} ${daysLate === 1 ? "día" : "días"} de retraso según tu media. Última: ${formatDay(lastStart)}.`
  }
  if (nextPeriodDate && inDays !== null && inDays !== undefined) {
    return `La próxima se espera ${formatInDays(inDays)}, el ${formatDay(nextPeriodDate)}. Última: ${formatDay(lastStart)}.`
  }
  return `Última: ${formatDay(lastStart)}.`
}

/** Apuntar el inicio de la regla en un toque. Siempre con los colores del invierno */
export default function PeriodCard({ today, onSaved, quiet = false, ...info }: Props) {
  const session = useSession()
  const [otherDay, setOtherDay] = useState(false)
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function save(day: string) {
    if (session.status !== "in") return
    setStatus("saving")
    try {
      await addPeriod(session.user.id, day)
      await onSaved()
      setStatus("saved")
      setOtherDay(false)
    } catch (err) {
      console.error(err)
      setStatus("error")
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void save(date)
  }

  const busy = status === "saving"

  const actions = otherDay ? (
    <form className="period-other" onSubmit={submit}>
      <label className="field">
        <span>¿Qué día empezó?</span>
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <div className="card-actions">
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="button button-quiet" onClick={() => setOtherDay(false)}>
          Cancelar
        </button>
      </div>
    </form>
  ) : (
    <div className="card-actions">
      <button type="button" className="button" disabled={busy} onClick={() => void save(today)}>
        <Check size={18} aria-hidden="true" />
        {busy ? "Guardando…" : "Me ha venido hoy"}
      </button>
      <button
        type="button"
        className="button button-quiet"
        onClick={() => {
          setStatus("idle")
          setOtherDay(true)
        }}
      >
        <CalendarDays size={18} aria-hidden="true" />
        Fue otro día
      </button>
    </div>
  )

  const messages = (
    <>
      {status === "saved" && (
        <p className="form-ok" role="status">
          Apuntado. Llega el invierno a tu isla.
        </p>
      )}
      {status === "error" && (
        <p className="form-error" role="alert">
          No se ha podido guardar. Vuelve a intentarlo.
        </p>
      )}
    </>
  )

  if (quiet) {
    return (
      <details className="period-quiet" data-phase="menstrual">
        <summary>
          <span className="card-icon">
            <Droplet size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="card-head-text">
            <strong>Apuntar o corregir la regla</strong>
            <span>
              {info.lastStart ? `Última: ${formatDay(info.lastStart)}. ` : ""}Por si se ha adelantado o hay que cambiar
              la fecha.
            </span>
          </span>
          <ChevronDown className="consult-chevron" size={20} aria-hidden="true" />
        </summary>
        <div className="period-quiet-body">
          {actions}
          {messages}
        </div>
      </details>
    )
  }

  return (
    <section className="period-card" data-phase="menstrual" aria-labelledby="period-card-title">
      <div className="card-head">
        <span className="card-icon">
          <Droplet size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="card-head-text">
          <h3 id="period-card-title">¿Te ha venido la regla?</h3>
          <p>{subtitle(info)}</p>
        </div>
      </div>
      {actions}
      {messages}
    </section>
  )
}
