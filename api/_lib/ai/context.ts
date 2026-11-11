// Lo que la IA sabe de cada usuaria. Se calcula en el servidor a partir de sus datos y se
// resume en texto: solo lo necesario, sin nombre, email, identificadores, fechas exactas ni notas.

import { PHASE_CONTENT } from "../../../src/content/phases.js"
import { MOODS, symptomLabel } from "../../../src/content/symptoms.js"
import type { AiDay } from "../../../src/lib/ai/advice.js"
import {
  addDays,
  diffDays,
  estimateCycle,
  getCycleState,
  phaseForDay,
  phaseRanges,
  type CycleSettings,
  type PeriodRecord,
  type Phase,
} from "../../../src/lib/cycle.js"
import { personalize, type LogEntry } from "../../../src/lib/personalize.js"

/** Días recientes que se tienen en cuenta */
export const RECENT_DAYS = 7

export interface AiContext {
  phase: Phase
  cycleDay: number
  cycleLength: number
  periodLength: number
  next: { phase: Phase; inDays: number } | null
  daysLate: number
  irregular: boolean
  /** Últimos días con algo registrado: días atrás, síntomas, ánimo y energía */
  recent: (AiDay & { daysAgo: number })[]
  /** Lo que suele registrar en esta misma fase en ciclos anteriores */
  usualInPhase: string[]
  /** true si hay señales de alarma: la IA no da consejos, mandan las reglas */
  alarm: boolean
}

interface Input {
  periods: PeriodRecord[]
  /** Las notas nunca llegan aquí: solo síntomas, ánimo y energía */
  logs: LogEntry[]
  settings: CycleSettings
  today: string
}

/** null si aún no hay datos de ciclo */
export function buildContext({ periods, logs, settings, today }: Input): AiContext | null {
  const state = getCycleState(periods, settings, today)
  if (state.status === "no_data") return null

  const recent = logs
    .filter((l) => l.date <= today && l.date > addDays(today, -RECENT_DAYS))
    .filter((l) => l.symptoms.length > 0 || l.mood || l.energy)
    .map((l) => ({ ...l, daysAgo: diffDays(l.date, today) }))
    .sort((a, b) => a.daysAgo - b.daysAgo)

  // Frecuencia de cada síntoma en esta misma fase, en ciclos anteriores
  const estimate = estimateCycle(periods, settings)
  const ranges = phaseRanges(estimate.cycleLength, estimate.periodLength)
  const starts = [...new Set(periods.map((p) => p.start_date))].filter((s) => s <= today).sort()
  const counts = new Map<string, number>()
  for (const log of logs) {
    if (log.date >= state.cycleStart) continue
    const start = starts.filter((s) => s <= log.date).pop()
    if (!start || phaseForDay(diffDays(start, log.date) + 1, ranges) !== state.phase) continue
    for (const s of log.symptoms) counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  const usualInPhase = [...counts]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => symptomLabel(s).toLowerCase())

  const { alarm } = personalize({ phase: state.phase, today, logs, periods, settings, seed: 0 })

  return {
    phase: state.phase,
    cycleDay: state.cycleDay,
    cycleLength: estimate.cycleLength,
    periodLength: estimate.periodLength,
    next: state.nextPhase ? { phase: state.nextPhase.phase, inDays: state.nextPhase.inDays } : null,
    daysLate: state.daysLate,
    irregular: estimate.irregular,
    recent,
    usualInPhase,
    alarm,
  }
}

const when = (daysAgo: number) => (daysAgo === 0 ? "hoy" : daysAgo === 1 ? "ayer" : `hace ${daysAgo} días`)

/** El contexto en frases sencillas, para el prompt */
export function describeContext(ctx: AiContext): string {
  const content = PHASE_CONTENT[ctx.phase]
  const lines = [
    `Fase: ${content.name.toLowerCase()} (${content.season.toLowerCase()} en la isla), día ${ctx.cycleDay} de un ciclo de unos ${ctx.cycleLength} días. La regla le suele durar unos ${ctx.periodLength} días.`,
    `Qué suele pasar en esta fase: ${content.summary}`,
  ]
  if (ctx.next) {
    const next = PHASE_CONTENT[ctx.next.phase]
    lines.push(`La siguiente fase (${next.name.toLowerCase()}) empieza en unos ${ctx.next.inDays} días.`)
  }
  if (ctx.daysLate > 0) lines.push(`Según su media, la regla lleva ${ctx.daysLate} días de retraso.`)
  if (ctx.irregular) lines.push("Sus ciclos varían bastante, así que las fechas son menos fiables.")

  if (ctx.recent.length > 0) {
    const days = ctx.recent.map((d) => {
      const parts = [
        d.symptoms.length ? d.symptoms.map((s) => symptomLabel(s).toLowerCase()).join(", ") : null,
        d.mood ? `ánimo ${MOODS.find((m) => m.id === d.mood)?.label.toLowerCase() ?? d.mood}` : null,
        d.energy ? `energía ${d.energy} de 5` : null,
      ].filter(Boolean)
      return `${when(d.daysAgo)}: ${parts.join("; ")}`
    })
    lines.push(`Lo que ha registrado estos días: ${days.join(". ")}.`)
  } else {
    lines.push("No ha registrado nada estos últimos días.")
  }
  if (ctx.usualInPhase.length > 0) {
    lines.push(`En esta fase de ciclos anteriores suele registrar: ${ctx.usualInPhase.join(", ")}.`)
  }
  return lines.join("\n")
}
