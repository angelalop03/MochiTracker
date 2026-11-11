import { RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { markClueDone, setClueEvery, useClueReminder } from "../lib/clueReminder"

/** Cada pocos meses, y solo si importó de Clue: sugiere traer lo nuevo. Siempre se puede decir que no */
export default function ClueReminder({ today, usesClue }: { today: string; usesClue: boolean }) {
  const { due } = useClueReminder(today, usesClue)
  if (!due) return null

  return (
    <section className="clue-card" aria-labelledby="clue-card-title">
      <div className="card-head">
        <span className="card-icon">
          <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="card-head-text">
          <h3 id="clue-card-title">¿Traemos lo nuevo de Clue?</h3>
          <p>
            Hace unos meses que no actualizas. Si importas otra vez, Mochi tendrá tus fechas y síntomas al día. Es
            opcional.
          </p>
        </div>
      </div>
      <div className="card-actions">
        <Link to="/importar" className="button">
          Importar
        </Link>
        <button type="button" className="button button-quiet" onClick={() => markClueDone(today)}>
          Ahora no
        </button>
      </div>
      <button type="button" className="button-link clue-never" onClick={() => setClueEvery("off")}>
        No volver a preguntar
      </button>
    </section>
  )
}
