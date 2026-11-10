// Decide qué aviso toca a cada usuaria y escribe los textos. Sin red ni IA:
// contenido base más las reglas de personalización.
// Los títulos se ven en la pantalla de bloqueo, así que nunca mencionan el ciclo.

import { BLOCKS, PHASE_CONTENT, pickVariant, type BlockId } from "../../src/content/phases.js"
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

export interface NoticeBlock {
  id: BlockId
  title: string
  text: string
  /** true si sale del registro de la usuaria */
  forYou: boolean
}

export interface Notice {
  date: string
  kind: Kind
  phase: Phase
  /** Asunto del email y título del push. Se ven sin desbloquear */
  title: string
  /** Texto del push. También se ve sin desbloquear */
  pushBody: string
  cycleDay: number
  greeting: string
  summary: string
  /** El consejo destacado del día */
  blockTitle: string
  tip: string
  tipForYou: boolean
  /** Un consejo por cada bloque */
  blocks: NoticeBlock[]
  /** La siguiente fase. null si hay retraso: no se inventan fechas */
  next: { phase: Phase; date: string; inDays: number } | null
  daysLate: number
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
  /** Para pruebas: envía aunque hoy no le tocara */
  force?: boolean
}

/** El aviso de hoy, o null si no toca */
export function planNotice({ user, periods, logs, lastPhase, now, force = false }: Input): Notice | null {
  const settings = { avgCycleLength: user.avg_cycle_length, avgPeriodLength: user.avg_period_length }
  const date = todayInTimeZone(user.timezone, now)
  const state = getCycleState(periods, settings, date)

  // Sin datos fiables es mejor no decir nada
  if (state.status === "no_data" || state.status === "stale") return null

  const yesterday = getCycleState(periods, settings, addDays(date, -1))
  const before = lastPhase ?? (yesterday.status === "no_data" ? null : yesterday.phase)
  const changed = before !== null && before !== state.phase
  if (!force && !changed && user.notify_frequency === "phase_change") return null

  const seed = daySeed(date)
  const content = PHASE_CONTENT[state.phase]
  const { tips, alarm } = personalize({ phase: state.phase, today: date, logs, periods, settings, seed })

  const blocks: NoticeBlock[] = BLOCKS.map((b) => {
    const personal = tips.find((t) => t.block === b.id)
    return {
      id: b.id,
      title: b.title,
      text: personal?.text ?? pickVariant(content.blocks[b.id], seed),
      forYou: Boolean(personal),
    }
  })

  // Si hay un consejo para ella va primero. Si no, el destacado va rotando cada día
  const featured = blocks.find((b) => b.forYou) ?? blocks[seed % blocks.length]!

  return {
    date,
    kind: changed ? "phase_change" : "daily",
    phase: state.phase,
    title: changed ? ARRIVAL[state.phase] : DAILY_TITLE,
    pushBody: PUSH_BODY,
    cycleDay: state.cycleDay,
    greeting: pickVariant(content.greetings, seed),
    summary: content.summary,
    blockTitle: featured.title,
    tip: featured.text,
    tipForYou: featured.forYou,
    blocks: blocks.filter((b) => b.id !== featured.id),
    next: state.nextPhase,
    daysLate: state.daysLate,
    alarm,
  }
}
