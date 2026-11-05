// Lógica del ciclo: módulo puro, sin dependencias de interfaz ni de red.
// Lo usan la web y, en la Fase 3, el cron de avisos.
// Las fechas son siempre cadenas YYYY-MM-DD: nada de horas, para que un cambio de
// zona horaria o de horario de verano no mueva un día de ciclo.

export type Phase = "menstrual" | "folicular" | "ovulatoria" | "lutea"
export const PHASES: readonly Phase[] = ["menstrual", "folicular", "ovulatoria", "lutea"]

export type CycleStatus =
  | "ok" // dentro del ciclo previsto
  | "late" // ha pasado la fecha prevista: regla con retraso
  | "stale" // demasiado tiempo sin datos: la estimación ya no sirve
  | "no_data" // aún no hay ninguna regla registrada

export interface PeriodRecord {
  start_date: string
  end_date?: string | null
}

export interface CycleSettings {
  avgCycleLength: number
  avgPeriodLength: number
}

export interface PhaseRange {
  phase: Phase
  /** Primer día de ciclo de la fase, empezando en 1 */
  startDay: number
  /** Último día de ciclo de la fase, incluido */
  endDay: number
}

export interface CycleEstimate {
  /** Duración usada: la calculada del historial o la que indicó la usuaria */
  cycleLength: number
  periodLength: number
  /** De dónde sale cycleLength */
  lengthSource: "history" | "user"
  /** Ciclos completos en el historial */
  completedCycles: number
  /** true si los ciclos varían demasiado: hay que avisar de que es menos fiable */
  irregular: boolean
}

export type CycleState =
  | { status: "no_data"; estimate: CycleEstimate }
  | {
      status: Exclude<CycleStatus, "no_data">
      estimate: CycleEstimate
      /** Inicio de la última regla */
      cycleStart: string
      /** Días desde el inicio de la última regla + 1 */
      cycleDay: number
      phase: Phase
      ranges: PhaseRange[]
      /** null si hay retraso: no se inventa una fecha */
      nextPhase: { phase: Phase; date: string; inDays: number } | null
      /** null si hay retraso */
      nextPeriodDate: string | null
      /** Días de retraso respecto a la fecha prevista (0 si no hay) */
      daysLate: number
    }

export const MIN_CYCLES_FOR_AVERAGE = 3
export const CYCLES_IN_AVERAGE = 6
/** Variación entre el ciclo más corto y el más largo a partir de la cual se avisa */
export const IRREGULAR_VARIATION_DAYS = 7
/** Días de retraso a partir de los cuales se pide actualizar los datos */
export const STALE_AFTER_LATE_DAYS = 30
/** Un hueco mayor entre reglas suele ser una regla sin registrar, no un ciclo real */
export const MAX_PLAUSIBLE_CYCLE = 90

const MS_PER_DAY = 86_400_000

function toUtc(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Fecha no válida: ${date}`)
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const utc = Date.UTC(y, m - 1, d)
  const check = new Date(utc)
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new Error(`Fecha no válida: ${date}`)
  }
  return utc
}

/** Días entre dos fechas: positivo si `to` es posterior */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY)
}

export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * MS_PER_DAY).toISOString().slice(0, 10)
}

/** La fecha de hoy en una zona horaria concreta, por ejemplo "Europe/Madrid" */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  // en-CA formatea directamente como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function sortedStarts(periods: PeriodRecord[]): string[] {
  return [...new Set(periods.map((p) => p.start_date))].sort()
}

/** Duración de cada ciclo completo, del más antiguo al más reciente */
export function cycleLengths(periods: PeriodRecord[]): number[] {
  const starts = sortedStarts(periods)
  const lengths: number[] = []
  for (let i = 1; i < starts.length; i++) {
    const length = diffDays(starts[i - 1]!, starts[i]!)
    if (length <= MAX_PLAUSIBLE_CYCLE) lengths.push(length)
  }
  return lengths
}

/** Calcula las duraciones a usar: del historial si hay bastantes ciclos, si no las de la usuaria */
export function estimateCycle(periods: PeriodRecord[], settings: CycleSettings): CycleEstimate {
  const lengths = cycleLengths(periods)
  const recent = lengths.slice(-CYCLES_IN_AVERAGE)
  const fromHistory = recent.length >= MIN_CYCLES_FOR_AVERAGE

  const periodLengths = periods
    .filter((p) => p.end_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .map((p) => diffDays(p.start_date, p.end_date!) + 1)
    .slice(-CYCLES_IN_AVERAGE)

  return {
    cycleLength: fromHistory ? Math.round(average(recent)) : settings.avgCycleLength,
    periodLength:
      periodLengths.length >= MIN_CYCLES_FOR_AVERAGE
        ? Math.round(average(periodLengths))
        : settings.avgPeriodLength,
    lengthSource: fromHistory ? "history" : "user",
    completedCycles: lengths.length,
    irregular:
      recent.length >= MIN_CYCLES_FOR_AVERAGE &&
      Math.max(...recent) - Math.min(...recent) > IRREGULAR_VARIATION_DAYS,
  }
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Reparte los días del ciclo entre las fases.
 * Ovulación estimada en (duración − 14) ± 1 día.
 * Con ciclos cortos y reglas largas la ventana chocaría con la regla: empieza como
 * pronto el día siguiente, y la fase folicular puede quedarse sin días.
 */
export function phaseRanges(cycleLength: number, periodLength: number): PhaseRange[] {
  const lastPeriodDay = Math.min(periodLength, cycleLength)
  const ovulationDay = cycleLength - 14

  const ovulationStart = Math.min(Math.max(ovulationDay - 1, lastPeriodDay + 1), cycleLength + 1)
  const ovulationEnd = Math.min(Math.max(ovulationDay + 1, ovulationStart), cycleLength)

  const ranges: PhaseRange[] = [
    { phase: "menstrual", startDay: 1, endDay: lastPeriodDay },
    { phase: "folicular", startDay: lastPeriodDay + 1, endDay: ovulationStart - 1 },
    { phase: "ovulatoria", startDay: ovulationStart, endDay: ovulationEnd },
    { phase: "lutea", startDay: ovulationEnd + 1, endDay: cycleLength },
  ]
  return ranges.filter((r) => r.endDay >= r.startDay)
}

export function phaseForDay(day: number, ranges: PhaseRange[]): Phase {
  const range = ranges.find((r) => day >= r.startDay && day <= r.endDay)
  // Pasado el final del ciclo se sigue en la última fase hasta que llegue la regla
  return range?.phase ?? ranges[ranges.length - 1]!.phase
}

/** El estado completo del ciclo en una fecha dada */
export function getCycleState(
  periods: PeriodRecord[],
  settings: CycleSettings,
  today: string
): CycleState {
  const estimate = estimateCycle(periods, settings)
  // Una regla con fecha futura todavía no cuenta
  const starts = sortedStarts(periods).filter((s) => s <= today)
  const cycleStart = starts[starts.length - 1]
  if (!cycleStart) return { status: "no_data", estimate }

  const { cycleLength, periodLength } = estimate
  const cycleDay = diffDays(cycleStart, today) + 1
  const ranges = phaseRanges(cycleLength, periodLength)
  const phase = phaseForDay(cycleDay, ranges)
  const daysLate = Math.max(0, cycleDay - cycleLength)

  if (daysLate > 0) {
    return {
      status: daysLate > STALE_AFTER_LATE_DAYS ? "stale" : "late",
      estimate,
      cycleStart,
      cycleDay,
      phase,
      ranges,
      nextPhase: null,
      nextPeriodDate: null,
      daysLate,
    }
  }

  const next = ranges.find((r) => r.startDay > cycleDay)
  // Tras la última fase del ciclo viene la regla siguiente
  const nextStartDay = next?.startDay ?? cycleLength + 1
  const inDays = nextStartDay - cycleDay

  return {
    status: "ok",
    estimate,
    cycleStart,
    cycleDay,
    phase,
    ranges,
    nextPhase: { phase: next?.phase ?? "menstrual", date: addDays(today, inDays), inDays },
    nextPeriodDate: addDays(cycleStart, cycleLength),
    daysLate: 0,
  }
}

export interface CycleRecord {
  start: string
  /** Último día del ciclo. null si es el ciclo en curso */
  end: string | null
  /** Duración en días. null si es el ciclo en curso */
  length: number | null
  /** Duración de la regla, si se marcó el final */
  periodLength: number | null
  /** Final de la regla marcado por la usuaria */
  periodEnd: string | null
}

/** Historial de ciclos, del más reciente al más antiguo */
export function cycleHistory(periods: PeriodRecord[]): CycleRecord[] {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date))
  return sorted
    .map((period, i) => {
      const next = sorted[i + 1]
      return {
        start: period.start_date,
        end: next ? addDays(next.start_date, -1) : null,
        length: next ? diffDays(period.start_date, next.start_date) : null,
        periodLength: period.end_date ? diffDays(period.start_date, period.end_date) + 1 : null,
        periodEnd: period.end_date ?? null,
      }
    })
    .reverse()
}
