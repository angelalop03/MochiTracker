import { useState, type FormEvent } from "react"
import BottomNav from "../components/BottomNav"
import CycleBar from "../components/CycleBar"
import Loading from "../components/Loading"
import { symptomLabel } from "../content/symptoms"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import {
  addDays,
  cycleHistory,
  diffDays,
  estimateCycle,
  getCycleState,
  todayInTimeZone,
  type CycleRecord,
} from "../lib/cycle"
import { formatDay } from "../lib/format"
import { addPeriod, deletePeriod, setPeriodEnd, type DailyLog } from "../services/data"

function CycleRow({
  cycle,
  today,
  maxLength,
  onChanged,
}: {
  cycle: CycleRecord
  today: string
  maxLength: number
  onChanged: () => Promise<void>
}) {
  const [end, setEnd] = useState(cycle.periodEnd ?? "")
  const [error, setError] = useState("")
  const running = cycle.length === null
  const days = cycle.length ?? diffDays(cycle.start, today) + 1
  const lastAllowed = cycle.end ?? today

  async function run(action: () => Promise<void>) {
    setError("")
    try {
      await action()
      await onChanged()
    } catch (e) {
      console.error(e)
      setError("No se ha podido guardar. Vuelve a intentarlo.")
    }
  }

  function saveEnd(e: FormEvent) {
    e.preventDefault()
    void run(() => setPeriodEnd(cycle.start, end || null))
  }

  function remove() {
    if (!window.confirm(`¿Borrar la regla del ${formatDay(cycle.start)}?`)) return
    void run(() => deletePeriod(cycle.start))
  }

  return (
    <li className="paper-box cycle-row">
      <div className="cycle-row-head">
        <strong>
          {formatDay(cycle.start)}
          {cycle.end ? ` – ${formatDay(cycle.end)}` : ""}
        </strong>
        <span>{running ? `En curso · día ${days}` : `${days} días`}</span>
      </div>
      <div
        className="mini-bar"
        style={{ width: `${Math.min(100, (days / maxLength) * 100)}%` }}
        role="img"
        aria-label={
          cycle.periodLength
            ? `Ciclo de ${days} días con ${cycle.periodLength} de regla`
            : `Ciclo de ${days} días`
        }
      >
        {cycle.periodLength && <span style={{ width: `${(cycle.periodLength / days) * 100}%` }} />}
      </div>
      <details>
        <summary>Editar</summary>
        <form className="row-actions" onSubmit={saveEnd}>
          <label className="field">
            <span>Último día de regla</span>
            <input
              type="date"
              value={end}
              min={cycle.start}
              max={lastAllowed}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <button className="button button-quiet">Guardar</button>
          <button type="button" className="button-link" onClick={remove}>
            Borrar esta regla
          </button>
        </form>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </details>
    </li>
  )
}

function AddPeriod({ userId, today, onSaved }: { userId: string; today: string; onSaved: () => Promise<void> }) {
  const [date, setDate] = useState("")
  const [error, setError] = useState("")

  async function save(e: FormEvent) {
    e.preventDefault()
    setError("")
    try {
      await addPeriod(userId, date)
      await onSaved()
      setDate("")
    } catch (err) {
      console.error(err)
      setError("No se ha podido guardar. Vuelve a intentarlo.")
    }
  }

  return (
    <details className="period-form">
      <summary>Añadir una regla anterior</summary>
      <form className="form" onSubmit={(e) => void save(e)}>
        <label className="field">
          <span>¿Qué día empezó?</span>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button">Guardar</button>
      </form>
    </details>
  )
}

function CycleSummary({ logs }: { logs: DailyLog[] }) {
  if (logs.length === 0) {
    return <p className="cycle-caption">Aún no has registrado ningún día de este ciclo.</p>
  }
  const energies = logs.map((l) => l.energy).filter((e) => e !== null)
  const counts = new Map<string, number>()
  for (const log of logs) for (const s of log.symptoms) counts.set(s, (counts.get(s) ?? 0) + 1)
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <p className="cycle-caption">
      {logs.length} {logs.length === 1 ? "día registrado" : "días registrados"}
      {energies.length > 0 &&
        `, con energía media de ${(energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1).replace(".", ",")} sobre 5`}
      .{top.length > 0 && ` Lo más frecuente: ${top.map(([s]) => symptomLabel(s).toLowerCase()).join(", ")}.`}
    </p>
  )
}

export default function MyCycle() {
  const session = useSession()
  const { profile, periods, logs, reload } = useCycleData()
  if (!profile || session.status !== "in") return <Loading />

  const today = todayInTimeZone(profile.timezone)
  const settings = { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length }
  const estimate = estimateCycle(periods, settings)
  const state = getCycleState(periods, settings, today)
  const history = cycleHistory(periods.filter((p) => p.start_date <= today))
  const maxLength = Math.max(estimate.cycleLength, ...history.map((c) => c.length ?? 0))

  const known = state.status === "no_data" ? null : state
  const cycleLogs = known ? logs.filter((l) => l.date >= known.cycleStart) : []
  const loggedDays = known ? new Set(cycleLogs.map((l) => diffDays(known.cycleStart, l.date) + 1)) : undefined

  return (
    <>
      <main className="narrow-page with-nav">
        <h1 className="page-title">Mi ciclo</h1>

        <div className="stats">
          <div className="stat">
            <strong>{estimate.cycleLength}</strong>
            <span>días de ciclo</span>
          </div>
          <div className="stat">
            <strong>{estimate.periodLength}</strong>
            <span>días de regla</span>
          </div>
          <div className="stat">
            <strong>{estimate.completedCycles}</strong>
            <span>{estimate.completedCycles === 1 ? "ciclo completo" : "ciclos completos"}</span>
          </div>
        </div>

        <p className="cycle-caption">
          {estimate.lengthSource === "history"
            ? "Calculado con tus últimos ciclos."
            : "Son los datos que indicaste. Con 3 ciclos completos se calcularán de tu historial."}
        </p>
        {estimate.irregular && (
          <p className="notice">Tus últimos ciclos varían bastante, así que las fechas son menos fiables de lo normal.</p>
        )}

        {known && (
          <section className="quick-log" aria-labelledby="current-title">
            <h2 id="current-title" className="section-title">
              Ciclo actual
            </h2>
            <CycleBar
              ranges={known.ranges}
              cycleDay={known.cycleDay}
              cycleLength={estimate.cycleLength}
              loggedDays={loggedDays}
            />
            <p className="cycle-caption">
              Empezó el {formatDay(known.cycleStart)}.
              {known.nextPeriodDate
                ? ` Próxima regla estimada: ${formatDay(known.nextPeriodDate)}.`
                : ` Se esperaba el ${formatDay(addDays(known.cycleStart, estimate.cycleLength))}.`}
            </p>
            <CycleSummary logs={cycleLogs} />
          </section>
        )}

        <section className="quick-log" aria-labelledby="history-title">
          <h2 id="history-title" className="section-title">
            Tus ciclos
          </h2>
          <ul className="cycle-list">
            {history.map((cycle) => (
              <CycleRow key={cycle.start} cycle={cycle} today={today} maxLength={maxLength} onChanged={reload} />
            ))}
          </ul>
          <AddPeriod userId={session.user.id} today={today} onSaved={reload} />
        </section>
      </main>
      <BottomNav />
    </>
  )
}
