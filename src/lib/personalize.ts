// Personalización por reglas: módulo puro que no necesita IA ni red.
// Es el camino normal de la app y lo reutilizará el cron de avisos.

import type { BlockId } from "../content/phases.js"
import { pickVariant } from "../content/phases.js"
import { PERSONAL_TIPS, type RuleId } from "../content/personalTips.js"
import { ALARM_SYMPTOMS, LOW_MOODS, symptomLabel } from "../content/symptoms.js"
import {
  addDays,
  diffDays,
  estimateCycle,
  phaseForDay,
  phaseRanges,
  type CycleSettings,
  type PeriodRecord,
  type Phase,
} from "./cycle.js"

export interface LogEntry {
  date: string
  symptoms: string[]
  mood: string | null
  energy: number | null
}

export interface PersonalTip {
  block: BlockId
  text: string
  /** De qué regla sale. "patron" si viene de ciclos anteriores */
  source: RuleId | "patron"
}

export interface Personalization {
  /** Como mucho un consejo por bloque */
  tips: PersonalTip[]
  /** true si hay que recomendar consultar con un profesional */
  alarm: boolean
}

/** Días que se miran hacia atrás, incluido hoy */
export const RECENT_DAYS = 5
/** Días con la señal para que se active una regla */
export const MIN_DAYS = 2
/** Días durante los que sigue el aviso tras registrar un síntoma de alarma */
export const ALARM_DAYS = 3
/** Ciclos anteriores con el síntoma en la misma fase para considerarlo un patrón */
export const MIN_CYCLES_FOR_PATTERN = 2

type Signal = (log: LogEntry) => boolean

const has = (...ids: string[]): Signal => (log) => ids.some((id) => log.symptoms.includes(id))
const lowEnergy: Signal = (log) => has("cansancio")(log) || (log.energy !== null && log.energy <= 2)

const RULES: { id: RuleId; signal: Signal }[] = [
  { id: "energia_movimiento", signal: lowEnergy },
  { id: "energia_comida", signal: lowEnergy },
  { id: "animo_bajo", signal: (log) => log.mood !== null && LOW_MOODS.includes(log.mood) },
  { id: "dolor_tripa", signal: has("calambres", "dolor_lumbar") },
  { id: "dolor_cabeza", signal: has("dolor_cabeza") },
  { id: "hinchazon", signal: has("hinchazon") },
  { id: "insomnio", signal: has("insomnio") },
  { id: "antojos", signal: has("antojos") },
]

function logsBetween(logs: LogEntry[], from: string, to: string) {
  return logs.filter((log) => log.date >= from && log.date <= to)
}

/** Síntoma más repetido en la misma fase de ciclos anteriores */
export function findPattern(
  phase: Phase,
  today: string,
  logs: LogEntry[],
  periods: PeriodRecord[],
  settings: CycleSettings
): string | null {
  const starts = [...new Set(periods.map((p) => p.start_date))].filter((s) => s <= today).sort()
  const currentStart = starts[starts.length - 1]
  if (!currentStart) return null

  const estimate = estimateCycle(periods, settings)
  const ranges = phaseRanges(estimate.cycleLength, estimate.periodLength)
  const cyclesBySymptom = new Map<string, Set<string>>()

  for (const log of logs) {
    if (log.date >= currentStart) continue
    const start = starts.filter((s) => s <= log.date).pop()
    if (!start) continue
    if (phaseForDay(diffDays(start, log.date) + 1, ranges) !== phase) continue
    for (const symptom of log.symptoms) {
      if (ALARM_SYMPTOMS.includes(symptom)) continue
      const cycles = cyclesBySymptom.get(symptom) ?? new Set()
      cycles.add(start)
      cyclesBySymptom.set(symptom, cycles)
    }
  }

  let best: string | null = null
  let bestCount = MIN_CYCLES_FOR_PATTERN - 1
  for (const [symptom, cycles] of cyclesBySymptom) {
    if (cycles.size > bestCount) {
      best = symptom
      bestCount = cycles.size
    }
  }
  return best
}

interface Input {
  phase: Phase
  today: string
  logs: LogEntry[]
  periods: PeriodRecord[]
  settings: CycleSettings
  seed: number
}

export function personalize({ phase, today, logs, periods, settings, seed }: Input): Personalization {
  const recent = logsBetween(logs, addDays(today, -(RECENT_DAYS - 1)), today)
  const tips: PersonalTip[] = []

  for (const rule of RULES) {
    if (recent.filter(rule.signal).length < MIN_DAYS) continue
    const set = PERSONAL_TIPS[rule.id]
    if (tips.some((tip) => tip.block === set.block)) continue
    tips.push({ block: set.block, text: pickVariant(set.byPhase?.[phase] ?? set.all, seed), source: rule.id })
  }

  const pattern = findPattern(phase, today, logs, periods, settings)
  if (pattern && !tips.some((tip) => tip.block === "cuerpo")) {
    tips.push({
      block: "cuerpo",
      text: `En tus últimos ciclos sueles registrar «${symptomLabel(pattern).toLowerCase()}» en esta fase. Tenlo en cuenta para organizarte estos días.`,
      source: "patron",
    })
  }

  const alarm = logsBetween(logs, addDays(today, -(ALARM_DAYS - 1)), today).some((log) =>
    log.symptoms.some((s) => ALARM_SYMPTOMS.includes(s))
  )

  return { tips, alarm }
}
