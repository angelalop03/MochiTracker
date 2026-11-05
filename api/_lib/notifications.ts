// Decide qué aviso toca a cada usuaria y escribe los textos. Sin red ni IA:
// contenido base más las reglas de personalización.
// Los títulos se ven en la pantalla de bloqueo, así que nunca mencionan el ciclo.

import { BLOCKS, PHASE_CONTENT, pickVariant } from "../../src/content/phases.js"
import { addDays, getCycleState, todayInTimeZone, type PeriodRecord, type Phase } from "../../src/lib/cycle.js"
import { personalize, type LogEntry } from "../../src/lib/personalize.js"

export interface Recipient {
  id: string
  name: string | null
  avg_cycle_length: number
  avg_period_length: number
  notify_email: boolean
  notify_push: boolean
  notify_frequency: "daily" | "phase_change"
  timezone: string
}

export type Kind = "daily" | "phase_change"

export interface Notice {
  date: string
  kind: Kind
  phase: Phase
  /** Asunto del email y título del push. Se ven sin desbloquear */
  title: string
  /** Texto del push. También se ve sin desbloquear */
  pushBody: string
  greeting: string
  summary: string
  blockTitle: string
  tip: string
  /** true si hay que recomendar consultar con un profesional */
  alarm: boolean
}

const ARRIVAL: Record<Phase, string> = {
  menstrual: "Ha llegado el invierno a tu isla",
  folicular: "Ha llegado la primavera a tu isla",
  ovulatoria: "Ha llegado el verano a tu isla",
  lutea: "Ha llegado el otoño a tu isla",
}

const DAILY_TITLE = "Mochi te ha dejado un consejo"
const PUSH_BODY = "Abre tu isla para verlo."

function daySeed(date: string) {
  return Math.floor(Date.parse(`${date}T12:00:00Z`) / 86_400_000)
}

interface Input {
  user: Recipient
  periods: PeriodRecord[]
  logs: LogEntry[]
  /** Última fase avisada. null si nunca se le ha enviado nada */
  lastPhase: Phase | null
  now: Date
}

/** El aviso de hoy, o null si no toca */
export function planNotice({ user, periods, logs, lastPhase, now }: Input): Notice | null {
  const settings = { avgCycleLength: user.avg_cycle_length, avgPeriodLength: user.avg_period_length }
  const date = todayInTimeZone(user.timezone, now)
  const state = getCycleState(periods, settings, date)

  // Sin datos fiables es mejor no decir nada
  if (state.status === "no_data" || state.status === "stale") return null

  const yesterday = getCycleState(periods, settings, addDays(date, -1))
  const before = lastPhase ?? (yesterday.status === "no_data" ? null : yesterday.phase)
  const changed = before !== null && before !== state.phase
  if (!changed && user.notify_frequency === "phase_change") return null

  const seed = daySeed(date)
  const content = PHASE_CONTENT[state.phase]
  const { tips, alarm } = personalize({ phase: state.phase, today: date, logs, periods, settings, seed })

  // Si hay un consejo para ella va primero. Si no, los bloques van rotando cada día
  const personal = tips[0]
  const block = BLOCKS.find((b) => b.id === personal?.block) ?? BLOCKS[seed % BLOCKS.length]!

  return {
    date,
    kind: changed ? "phase_change" : "daily",
    phase: state.phase,
    title: changed ? ARRIVAL[state.phase] : DAILY_TITLE,
    pushBody: PUSH_BODY,
    greeting: pickVariant(content.greetings, seed),
    summary: content.summary,
    blockTitle: block.title,
    tip: personal?.text ?? pickVariant(content.blocks[block.id], seed),
    alarm,
  }
}
