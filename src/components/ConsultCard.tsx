import { ChevronDown, Siren, Stethoscope } from "lucide-react"
import { WHEN_TO_CONSULT } from "../content/phases"

/** Cuándo pedir cita. Se abre sola si se ha registrado una señal de alarma */
export default function ConsultCard({ open = false }: { open?: boolean }) {
  return (
    <details className={`consult-card${open ? " is-alert" : ""}`} open={open}>
      <summary>
        <span className="card-icon">
          <Stethoscope size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="card-head-text">
          <strong>{WHEN_TO_CONSULT.title}</strong>
          <span>{WHEN_TO_CONSULT.items.length} señales para pedir cita</span>
        </span>
        <ChevronDown className="consult-chevron" size={20} aria-hidden="true" />
      </summary>
      <div className="consult-body">
        <p>{WHEN_TO_CONSULT.intro}</p>
        <ul>
          {WHEN_TO_CONSULT.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="consult-urgent">
          <Siren size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{WHEN_TO_CONSULT.urgent}</span>
        </p>
      </div>
    </details>
  )
}
