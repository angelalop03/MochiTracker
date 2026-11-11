import { PHASE_CONTENT } from "../content/phases"
import type { Phase, PhaseRange } from "../lib/cycle"

interface Props {
  ranges: PhaseRange[]
  cycleLength: number
  selected: Phase
  /** Día de hoy en el ciclo, si se conoce */
  today?: number | null
}

const W = 320
const TOP = 14
const BOTTOM = 112
const H = 140

const bump = (t: number, center: number, width: number, height: number) =>
  height * Math.exp(-((t - center) ** 2) / (2 * width ** 2))

/** Curvas orientativas, centradas en las fases de cada persona. No son una medida */
function curves(ranges: PhaseRange[], cycleLength: number) {
  const mid = (phase: Phase, fallback: number) => {
    const r = ranges.find((x) => x.phase === phase)
    return r ? (r.startDay + r.endDay) / 2 / cycleLength : fallback
  }
  const ovulation = mid("ovulatoria", 0.5)
  const luteal = mid("lutea", 0.78)
  const estrogen = (t: number) => 0.12 + bump(t, ovulation - 0.03, 0.07, 0.78) + bump(t, luteal, 0.1, 0.32)
  const progesterone = (t: number) => 0.06 + bump(t, luteal, 0.1, 0.74)

  const path = (f: (t: number) => number) =>
    Array.from({ length: 81 }, (_, i) => {
      const t = i / 80
      const y = BOTTOM - f(t) * (BOTTOM - TOP)
      return `${i === 0 ? "M" : "L"} ${(t * W).toFixed(1)} ${y.toFixed(1)}`
    }).join(" ")

  return { estrogen: path(estrogen), progesterone: path(progesterone) }
}

/** Cómo suben y bajan las hormonas, con la fase elegida resaltada */
export default function HormoneChart({ ranges, cycleLength, selected, today }: Props) {
  const { estrogen, progesterone } = curves(ranges, cycleLength)
  const x = (day: number) => ((day - 1) / cycleLength) * W

  return (
    <figure className="hormone-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Esquema de cómo suben y bajan los estrógenos y la progesterona a lo largo del ciclo">
        {ranges.map((r) => (
          <g key={r.phase} className="hc-band" data-segment={r.phase} data-selected={r.phase === selected || undefined}>
            <rect x={x(r.startDay)} y={TOP - 8} width={x(r.endDay + 1) - x(r.startDay)} height={BOTTOM - TOP + 8} rx={6} />
            <text x={(x(r.startDay) + x(r.endDay + 1)) / 2} y={H - 10}>
              {PHASE_CONTENT[r.phase].season}
            </text>
          </g>
        ))}
        <path d={estrogen} className="hc-line hc-estrogen" />
        <path d={progesterone} className="hc-line hc-progesterone" />
        {today && today <= cycleLength && (
          <g className="hc-today">
            <line x1={x(today) + W / cycleLength / 2} x2={x(today) + W / cycleLength / 2} y1={TOP - 8} y2={BOTTOM} />
            <text x={x(today) + W / cycleLength / 2} y={TOP - 10}>
              hoy
            </text>
          </g>
        )}
      </svg>
      <figcaption>
        <span className="hc-key hc-key-estrogen">Estrógenos</span>
        <span className="hc-key hc-key-progesterone">Progesterona</span>
        <span className="hc-note">Esquema orientativo</span>
      </figcaption>
    </figure>
  )
}
