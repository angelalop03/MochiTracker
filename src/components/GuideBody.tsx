import { CircleAlert } from "lucide-react"
import type { BlockGuide } from "../content/guides"

/** Por qué pasa, qué hacer y cuándo prestar atención. Se usa en Hoy y en la Guía */
export default function GuideBody({ guide }: { guide: BlockGuide }) {
  return (
    <>
      <div className="advice-why">
        <span className="advice-label">Por qué pasa</span>
        <p>{guide.why}</p>
      </div>

      <div>
        <span className="advice-label">Qué puedes hacer</span>
        <ol className="advice-tips">
          {guide.tips.map((tip) => (
            <li key={tip.title}>
              <strong>{tip.title}</strong>
              <span>{tip.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {guide.watch && (
        <p className="advice-watch">
          <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
          <span>{guide.watch}</span>
        </p>
      )}
    </>
  )
}
