// Convierte measurements.json de Clue en lo poco que guardamos: fechas de regla y síntomas.
// El formato no está documentado. Sale de una exportación real de noviembre de 2026:
//   [{ "id": "…", "date": "2026-01-31", "type": "period", "value": { "option": "medium" } },
//    { "id": "…", "date": "2026-01-31", "type": "pain", "value": [{ "option": "headache" }] }]
// Solo se leen los tipos de SYMPTOM_MAP. Lo demás (vida sexual, medicación, peso, notas…)
// se descarta aquí y nunca llega a guardarse.

import type { SymptomId } from "../../content/symptoms"
import { diffDays } from "../cycle"
import { ClueImportError, type ImportResult } from "./types"

/** Días sin marcar que puede haber dentro de una misma regla */
const MAX_GAP_IN_PERIOD = 2
/** Una regla importada a menos de estos días de una ya guardada se considera la misma */
const SAME_PERIOD_DAYS = 10

const SYMPTOM_MAP: Record<string, Record<string, SymptomId>> = {
  pain: {
    period_cramps: "calambres",
    headache: "dolor_cabeza",
    migraine: "dolor_cabeza",
    lower_back: "dolor_lumbar",
    breast_tenderness: "pecho_sensible",
  },
  energy: { tired: "cansancio", exhausted: "cansancio" },
  craving: { carbs: "antojos", salty: "antojos", sweet: "antojos", greasy: "antojos" },
  digestion: { bloated: "hinchazon", nauseous: "nauseas" },
  skin: { acne: "granitos" },
  period: { very_heavy: "sangrado_abundante" },
}

interface Measurement {
  date: string
  type: string
  value: unknown
}

function isMeasurement(item: unknown): item is Measurement {
  if (typeof item !== "object" || item === null) return false
  const m = item as Record<string, unknown>
  return typeof m.date === "string" && typeof m.type === "string" && "value" in m
}

/** value es un objeto en unos tipos y una lista en otros */
function optionsOf(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [value]
  return list.flatMap((v) => {
    const option = (v as { option?: unknown } | null)?.option
    return typeof option === "string" ? [option] : []
  })
}

function toDay(date: string): string | null {
  const day = date.slice(0, 10)
  try {
    diffDays(day, day)
    return day
  } catch {
    return null
  }
}

function groupPeriods(days: string[]): ImportResult["periods"] {
  const periods: ImportResult["periods"] = []
  let start: string | null = null
  let end: string | null = null

  for (const day of [...new Set(days)].sort()) {
    if (start && end && diffDays(end, day) <= MAX_GAP_IN_PERIOD + 1) {
      end = day
      continue
    }
    if (start) periods.push({ start_date: start, end_date: end })
    start = end = day
  }
  if (start) periods.push({ start_date: start, end_date: end })
  return periods
}

export function parseClueExport(data: unknown): ImportResult {
  if (!Array.isArray(data)) throw new ClueImportError("not_clue")
  if (data.length === 0) throw new ClueImportError("empty")
  const measurements = data.filter(isMeasurement)
  if (measurements.length === 0) throw new ClueImportError("not_clue")

  const periodDays: string[] = []
  const symptoms = new Map<string, Set<SymptomId>>()

  for (const m of measurements) {
    const day = toDay(m.date)
    if (!day) continue
    if (m.type === "period") periodDays.push(day)

    const map = SYMPTOM_MAP[m.type]
    if (!map) continue
    for (const option of optionsOf(m.value)) {
      const symptom = map[option]
      if (!symptom) continue
      const set = symptoms.get(day) ?? new Set()
      set.add(symptom)
      symptoms.set(day, set)
    }
  }

  if (periodDays.length === 0) throw new ClueImportError("empty")

  return {
    periods: groupPeriods(periodDays),
    logs: [...symptoms]
      .map(([date, set]) => ({ date, symptoms: [...set] }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/**
 * Quita las reglas que ya están registradas, aunque sea con otra fecha cercana.
 * Si no, una regla apuntada a mano el día 3 y en Clue el día 2 crearía un ciclo de 1 día.
 */
export function withoutKnownPeriods(result: ImportResult, existing: { start_date: string }[]): ImportResult {
  return {
    ...result,
    periods: result.periods.filter((p) =>
      existing.every((e) => Math.abs(diffDays(e.start_date, p.start_date)) >= SAME_PERIOD_DAYS)
    ),
  }
}
