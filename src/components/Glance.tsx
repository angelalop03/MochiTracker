import { CloudSun, Droplet } from "lucide-react"
import { PHASE_GLANCE } from "../content/glance"
import type { Phase } from "../lib/cycle"

/** Tres indicadores para entender el día en un momento */
export default function Glance({ phase }: { phase: Phase }) {
  const g = PHASE_GLANCE[phase]
  return (
    <section className="glance" aria-labelledby="glance-title">
      <div className="section-head">
        <h2 id="glance-title" className="eyebrow">
          Hoy, de un vistazo
        </h2>
        <span className="section-note">Lo habitual en esta fase</span>
      </div>
      <div className="glance-grid">
        <div className="glance-tile">
          <span className="glance-label">Energía</span>
          <span className="energy-meter" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={n <= g.energyLevel ? "is-on" : undefined} />
            ))}
          </span>
          <strong>
            <span className="sr-only">Energía: </span>
            {g.energy}
          </strong>
        </div>
        <div className="glance-tile">
          <span className="glance-label">Piel</span>
          <Droplet size={18} strokeWidth={1.75} aria-hidden="true" />
          <strong>
            <span className="sr-only">Piel: </span>
            {g.skin}
          </strong>
        </div>
        <div className="glance-tile">
          <span className="glance-label">Ánimo</span>
          <CloudSun size={18} strokeWidth={1.75} aria-hidden="true" />
          <strong>
            <span className="sr-only">Ánimo: </span>
            {g.mood}
          </strong>
        </div>
      </div>
    </section>
  )
}
