import { PHASE_CONTENT } from "../content/phases"
import type { Phase, PhaseRange } from "../lib/cycle"
import { formatInDays } from "../lib/format"

interface Props {
  ranges: PhaseRange[]
  cycleDay: number
  cycleLength: number
  next: { phase: Phase; inDays: number } | null
}

/** El ciclo como una línea continua, con cada fase a su tamaño real y el día de hoy marcado */
export default function CycleTimeline({ ranges, cycleDay, cycleLength, next }: Props) {
  const today = Math.min(cycleDay, cycleLength)
  const position = ((today - 0.5) / cycleLength) * 100
  const summary = ranges.map((r) => `${PHASE_CONTENT[r.phase].name}: días ${r.startDay} a ${r.endDay}`).join(". ")
  const nextText = next ? `${PHASE_CONTENT[next.phase].season} ${formatInDays(next.inDays)}` : "Pendiente de tu regla"

  return (
    <figure className="timeline" aria-label={`Día ${cycleDay} de ${cycleLength}. ${summary}.`} role="img">
      <div className="timeline-track">
        {ranges.map((r) => (
          <span key={r.phase} data-segment={r.phase} style={{ flexGrow: r.endDay - r.startDay + 1 }} />
        ))}
        <span className="timeline-today" style={{ left: `${position}%` }} />
      </div>
      <figcaption className="timeline-labels" aria-hidden="true">
        <span>Día 1</span>
        <span className="timeline-now">Hoy · día {cycleDay}</span>
        <span>{nextText}</span>
      </figcaption>
    </figure>
  )
}
