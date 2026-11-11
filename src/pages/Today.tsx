import { Undo2 } from "lucide-react"
import { useState } from "react"
import AdviceList, { FeaturedTip } from "../components/AdviceList"
import AiPanel from "../components/AiPanel"
import BottomNav from "../components/BottomNav"
import ClueReminder from "../components/ClueReminder"
import ConsultCard from "../components/ConsultCard"
import CycleDial from "../components/CycleDial"
import DialogBox from "../components/DialogBox"
import Glance from "../components/Glance"
import MochiFace from "../components/MochiFace"
import Loading from "../components/Loading"
import PeriodCard from "../components/PeriodCard"
import SkyPanel from "../components/SkyPanel"
import ThemeToggle from "../components/ThemeToggle"
import { CONTRACEPTION_NOTICE, DISCLAIMER, PHASE_CONTENT, pickVariant } from "../content/phases"
import { useAiAdvice } from "../hooks/useAiAdvice"
import { useCycleData } from "../hooks/useCycleData"
import {
  addDays,
  diffDays,
  getCycleState,
  PHASES,
  todayInTimeZone,
  type CycleState,
  type Phase,
} from "../lib/cycle"
import { daySeed, formatDay, formatInDays, formatLongDate } from "../lib/format"
import type { AiInput } from "../lib/ai/advice"
import { personalize, type PersonalTip } from "../lib/personalize"

type KnownState = Exclude<CycleState, { status: "no_data" }>

/** La cara de Mochi que acompaña a cada estación */
const MOCHI_MOOD: Record<Phase, string> = {
  menstrual: "sensible",
  folicular: "bien",
  ovulatoria: "genial",
  lutea: "normal",
}

function nextChip(state: KnownState) {
  if (!state.nextPhase) return null
  return `${PHASE_CONTENT[state.nextPhase.phase].season} ${formatInDays(state.nextPhase.inDays)}`
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

/** Solo en desarrollo, plegado: salta a cualquier fase para ver las 4 estaciones */
function DevPhaseBar({ state, onJump }: { state: KnownState; onJump: (offset: number) => void }) {
  const jumpTo = (phase: Phase) => {
    const range = state.ranges.find((r) => r.phase === phase)
    if (range) onJump(Math.floor((range.startDay + range.endDay) / 2) - 1)
  }
  return (
    <details className="dev-tools">
      <summary>Solo en desarrollo: ver otras estaciones</summary>
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
    </details>
  )
}

/** Aviso cuando se está viendo otro día que no es el de hoy */
function SimulationBanner({ day, season, onReset }: { day: number; season: string; onReset: () => void }) {
  return (
    <div className="sim-banner" role="status">
      <span>
        Estás viendo el día {day} ({season.toLowerCase()}), no el de hoy.
      </span>
      <button type="button" className="button button-small" onClick={onReset}>
        <Undo2 size={16} aria-hidden="true" />
        Volver a hoy
      </button>
    </div>
  )
}

function PersonalAdvice({
  input,
  aiKey,
  seed,
  tips,
}: {
  input: AiInput
  aiKey: string
  seed: number
  tips: PersonalTip[]
}) {
  const { status, progress, advice, activate } = useAiAdvice(input, aiKey)
  return (
    <>
      <FeaturedTip phase={input.phase} seed={seed} tips={tips} aiAdvice={advice} />
      <AiPanel status={status} progress={progress} onActivate={activate} />
      <AdviceList key={input.phase} phase={input.phase} seed={seed} tips={tips} aiAdvice={advice} />
    </>
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
          <PeriodCard today={realToday} onSaved={reload} />
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
  // Solo síntomas, ánimo y energía de los últimos días. Las notas no se usan
  const recentLogs = logs
    .filter((l) => l.date >= addDays(today, -6) && l.date <= today)
    .map(({ date, symptoms, mood, energy }) => ({ date, symptoms, mood, energy }))
  const aiInput: AiInput = { phase: state.phase, cycleDay: state.cycleDay, seed, days: recentLogs, alarm }
  const aiKey = JSON.stringify([today, aiInput])

  const next = state.nextPhase ? PHASE_CONTENT[state.nextPhase.phase] : null

  return (
    <>
      <main className="today" data-phase={state.phase}>
        <section className="today-hero" aria-label="Tu isla hoy">
          <div className="hero-bar">
            <span className="wordmark">Isla Mochi</span>
            <ThemeToggle />
          </div>
          <SkyPanel phase={state.phase}>
            {nextChip(state) && <span className="sky-chip">{nextChip(state)}</span>}
          </SkyPanel>
        </section>

        <div className="today-sheet">
          {import.meta.env.DEV && devDay !== null && (
            <SimulationBanner day={state.cycleDay} season={content.season} onReset={() => setDevDay(null)} />
          )}

          <header className="today-head">
            <p className="eyebrow">{formatLongDate(today)}</p>
            <h1 className="season-title">
              {content.season} <span>en tu isla</span>
            </h1>
          </header>

          {alarm && (
            <p className="notice notice-alert" role="alert">
              Has registrado un dolor o un sangrado muy fuertes. Te recomendamos consultarlo con un profesional
              sanitario. Abajo tienes cuándo hacerlo.
            </p>
          )}
          <Notices state={state} />

          <section className="dial-card" aria-label="Tu ciclo hoy">
            <CycleDial ranges={state.ranges} cycleDay={state.cycleDay} cycleLength={state.estimate.cycleLength} />
            <div className="dial-text">
              <span className="phase-pill">Fase {content.name.toLowerCase()}</span>
              {next && state.nextPhase ? (
                <p className="dial-next">
                  <strong>
                    {next.season} {formatInDays(state.nextPhase.inDays)}
                  </strong>
                  <span>
                    Fase {next.name.toLowerCase()}, el {formatDay(state.nextPhase.date)}
                  </span>
                </p>
              ) : (
                <p className="dial-next">
                  <strong>Pendiente de tu regla</strong>
                </p>
              )}
              <p className="dial-summary">{content.summary}</p>
            </div>
          </section>

          <figure className="mochi-quote">
            <MochiFace mood={MOCHI_MOOD[state.phase]} size={48} />
            <blockquote>
              <p>{pickVariant(content.greetings, seed)}</p>
              <figcaption>Mochi</figcaption>
            </blockquote>
          </figure>

          <Glance phase={state.phase} />

          <PersonalAdvice input={aiInput} aiKey={aiKey} seed={seed} tips={tips} />

          <section className="your-day" aria-labelledby="your-day-title">
            <h2 id="your-day-title" className="eyebrow">
              Tu isla al día
            </h2>
            <PeriodCard
              today={realToday}
              onSaved={reload}
              lastStart={realState.cycleStart}
              nextPeriodDate={realState.nextPeriodDate}
              inDays={realState.nextPeriodDate ? diffDays(realToday, realState.nextPeriodDate) : null}
              daysLate={realState.daysLate}
            />
            <ClueReminder today={realToday} usesClue={periods.some((p) => p.source === "clue")} />
            <ConsultCard open={alarm} />
          </section>

          {import.meta.env.DEV && <DevPhaseBar state={realState} onJump={setDevDay} />}

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
