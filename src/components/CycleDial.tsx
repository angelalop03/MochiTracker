import { PHASE_CONTENT } from "../content/phases"
import type { PhaseRange } from "../lib/cycle"

interface Props {
  ranges: PhaseRange[]
  cycleDay: number
  cycleLength: number
  size?: number
}

const C = 80
const R = 62
const GAP = 3 // grados entre estaciones

function point(angle: number, radius = R) {
  const rad = ((angle - 90) * Math.PI) / 180
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)] as const
}

function arc(from: number, to: number) {
  const [x1, y1] = point(from)
  const [x2, y2] = point(to)
  return `M ${x1} ${y1} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`
}

/** El ciclo como una rueda de cuatro estaciones, con el día de hoy marcado */
export default function CycleDial({ ranges, cycleDay, cycleLength, size = 156 }: Props) {
  const deg = 360 / cycleLength
  const today = Math.min(cycleDay, cycleLength)
  const [mx, my] = point((today - 0.5) * deg)
  const summary = ranges.map((r) => `${PHASE_CONTENT[r.phase].season}: días ${r.startDay} a ${r.endDay}`).join(". ")

  return (
    <svg
      className="cycle-dial"
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={`Día ${cycleDay} de ${cycleLength}. ${summary}.`}
    >
      <circle cx={C} cy={C} r={R} className="dial-track" />
      {ranges.map((r) => (
        <path
          key={r.phase}
          d={arc((r.startDay - 1) * deg + GAP / 2, r.endDay * deg - GAP / 2)}
          className="dial-arc"
          data-segment={r.phase}
        />
      ))}
      <circle cx={mx} cy={my} r={9} className="dial-marker" />
      <text x={C} y={C - 16} className="dial-small">
        Día
      </text>
      <text x={C} y={C + 18} className="dial-day">
        {cycleDay}
      </text>
      <text x={C} y={C + 36} className="dial-small">
        de {cycleLength}
      </text>
    </svg>
  )
}
