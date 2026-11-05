import { PHASE_CONTENT } from "../content/phases"
import type { PhaseRange } from "../lib/cycle"

interface Props {
  ranges: PhaseRange[]
  cycleDay: number
  cycleLength: number
  /** Días de ciclo con registro: se ven más intensos */
  loggedDays?: Set<number>
}

/** Barra del ciclo por casillas: cada día es un píxel y el de hoy va marcado */
export default function CycleBar({ ranges, cycleDay, cycleLength, loggedDays }: Props) {
  const today = Math.min(cycleDay, cycleLength)
  const summary = ranges
    .map((r) => `${PHASE_CONTENT[r.phase].name}: días ${r.startDay} a ${r.endDay}`)
    .join(". ")

  return (
    <div className="cycle-bar" role="img" aria-label={`Día ${cycleDay} de ${cycleLength}. ${summary}.`}>
      {ranges.map((range) =>
        Array.from({ length: range.endDay - range.startDay + 1 }, (_, i) => {
          const day = range.startDay + i
          return (
            <span
              key={day}
              className={`cycle-cell${day === today ? " is-today" : ""}${loggedDays?.has(day) ? " has-log" : ""}`}
              data-cell-phase={range.phase}
            />
          )
        })
      )}
    </div>
  )
}
