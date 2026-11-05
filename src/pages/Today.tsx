import { useState, type FormEvent } from "react"
import AdviceBlocks from "../components/AdviceBlocks"
import BottomNav from "../components/BottomNav"
import ConsultCard from "../components/ConsultCard"
import CycleBar from "../components/CycleBar"
import DialogBox from "../components/DialogBox"
import Loading from "../components/Loading"
import QuickLog from "../components/QuickLog"
import SkyPanel from "../components/SkyPanel"
import { CONTRACEPTION_NOTICE, DISCLAIMER, PHASE_CONTENT, pickVariant } from "../content/phases"
import { useCycleData } from "../hooks/useCycleData"
import { useSession } from "../hooks/useSession"
import {
  addDays,
  diffDays,
  getCycleState,
  PHASES,
  todayInTimeZone,
  type CycleState,
  type Phase,
} from "../lib/cycle"
import { daySeed, formatDay, formatInDays } from "../lib/format"
import { personalize } from "../lib/personalize"
import { addPeriod } from "../services/data"

type KnownState = Exclude<CycleState, { status: "no_data" }>

function nextLine(state: KnownState) {
  if (!state.nextPhase) return null
  const next = PHASE_CONTENT[state.nextPhase.phase]
  return `${next.season} (fase ${next.name.toLowerCase()}) llega ${formatInDays(state.nextPhase.inDays)}, el ${formatDay(state.nextPhase.date)}.`
}

function Notices({ state }: { state: KnownState }) {
  return (
    <>
      {state.status === "late" && (
        <p className="notice">
          Tu regla lleva {state.daysLate} {state.daysLate === 1 ? "día" : "días"} de retraso según tu media. Es algo
          frecuente: el estrés, los viajes o los cambios de rutina pueden moverla. Cuando te venga, actualiza la fecha abajo.
        </p>
      )}
      {state.status === "stale" && (
        <p className="notice">
          Hace mucho que no registras una regla y esta estimación ya no es fiable. Actualiza la fecha abajo. Si llevas
          tres meses o más sin regla, consúltalo con un profesional.
        </p>
      )}
      {state.estimate.irregular && (
        <p className="notice">
          Tus últimos ciclos varían bastante, así que las fechas son menos fiables de lo normal.
        </p>
      )}
    </>
  )
}

function PeriodForm({ today, onSaved }: { today: string; onSaved: () => Promise<void> }) {
  const session = useSession()
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function save(e: FormEvent) {
    e.preventDefault()
    if (session.status !== "in") return
    setBusy(true)
    setError("")
    try {
      await addPeriod(session.user.id, date)
      await onSaved()
    } catch (err) {
      console.error(err)
      setError("No se ha podido guardar. Vuelve a intentarlo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="period-form">
      <summary>¿Te ha venido la regla? Actualiza la fecha</summary>
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
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </details>
  )
}

/** Solo en desarrollo: salta a cualquier fase para ver las 4 estaciones */
function DevPhaseBar({ state, onJump }: { state: KnownState; onJump: (offset: number) => void }) {
  const jumpTo = (phase: Phase) => {
    const range = state.ranges.find((r) => r.phase === phase)
    if (range) onJump(Math.floor((range.startDay + range.endDay) / 2) - 1)
  }
  return (
    <div className="dev-bar">
      {PHASES.map((p) => (
        <button key={p} type="button" onClick={() => jumpTo(p)}>
          {PHASE_CONTENT[p].season}
        </button>
      ))}
      <button type="button" onClick={() => onJump(state.estimate.cycleLength + 4)}>
        Retraso
      </button>
    </div>
  )
}

export default function Today() {
  const { profile, periods, logs, reload } = useCycleData()
  const [devDay, setDevDay] = useState<number | null>(null)

  if (!profile) return <Loading />

  const realToday = todayInTimeZone(profile.timezone)
  const settings = { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length }
  const realState = getCycleState(periods, settings, realToday)

  // Se guardó la bienvenida pero no hay reglas: no debería pasar, pero no hay que romper
  if (realState.status === "no_data") {
    return (
      <>
        <main className="today">
          <DialogBox speaker="Mochi">Aún no tengo ninguna regla tuya. Registra la última para empezar.</DialogBox>
          <PeriodForm today={realToday} onSaved={reload} />
        </main>
        <BottomNav />
      </>
    )
  }

  const today =
    import.meta.env.DEV && devDay !== null ? addDays(realState.cycleStart, devDay) : realToday
  const state = getCycleState(periods, settings, today) as KnownState
  const content = PHASE_CONTENT[state.phase]
  const seed = daySeed(today)
  const { tips, alarm } = personalize({ phase: state.phase, today, logs, periods, settings, seed })
  const loggedDays = new Set(
    logs.filter((l) => l.date >= state.cycleStart).map((l) => diffDays(state.cycleStart, l.date) + 1)
  )

  return (
    <>
      <main className="today" data-phase={state.phase}>
        <div className="today-scene">
          <header className="today-head">
            <h1 className="page-title">Día {state.cycleDay}</h1>
            <p className="phase-chip">
              Fase {content.name.toLowerCase()} · {content.season}
            </p>
          </header>

          <SkyPanel phase={state.phase} />

          <DialogBox speaker="Mochi">
            <p>{pickVariant(content.greetings, seed)}</p>
            {nextLine(state) && <p>{nextLine(state)}</p>}
          </DialogBox>
        </div>

        <div className="today-info">
          {import.meta.env.DEV && <DevPhaseBar state={realState} onJump={setDevDay} />}

          {alarm && (
            <p className="notice notice-alert" role="alert">
              Has registrado un dolor o un sangrado muy fuertes. Te recomendamos consultarlo con un profesional
              sanitario. Abajo tienes cuándo hacerlo.
            </p>
          )}
          <Notices state={state} />

          <p className="cycle-caption">{content.summary}</p>

          <AdviceBlocks key={state.phase} phase={state.phase} seed={seed} tips={tips} />

          <CycleBar
            ranges={state.ranges}
            cycleDay={state.cycleDay}
            cycleLength={state.estimate.cycleLength}
            loggedDays={loggedDays}
          />

          <details className="period-form">
            <summary>Cuéntame cómo estás para afinar tus consejos</summary>
            <QuickLog
              key={realToday}
              date={realToday}
              log={logs.find((l) => l.date === realToday)}
              onSaved={reload}
            />
          </details>

          <PeriodForm today={realToday} onSaved={reload} />
          <ConsultCard open={alarm} />

          <footer className="legal-note">
            <p>{DISCLAIMER}</p>
            <p>{CONTRACEPTION_NOTICE}</p>
          </footer>
        </div>
      </main>
      <BottomNav />
    </>
  )
}
