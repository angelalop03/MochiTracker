import { PHASE_CONTENT } from "../content/phases"
import type { PhaseRange } from "../lib/cycle"

interface Props {
  ranges: PhaseRange[]
  cycleDay: number
  cycleLength: number
}

/** Barra del ciclo por casillas: cada día es un píxel y el de hoy va marcado */
export default function CycleBar({ ranges, cycleDay, cycleLength }: Props) {
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
              className={day === today ? "cycle-cell is-today" : "cycle-cell"}
              data-cell-phase={range.phase}
            />
          )
        })
      )}
    </div>
  )
}
