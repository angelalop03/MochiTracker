import { useState } from "react"
import type { AiStatus } from "../hooks/useAiAdvice"
import { MODEL_DOWNLOAD_LABEL } from "../lib/ai/advice"

interface Props {
  status: AiStatus
  progress: number
  onActivate: () => void
}

/** Aviso antes de descargar: se reutiliza en Hoy */
export function AiDownloadNotice() {
  return (
    <>
      <p>
        Se descargará un modelo de IA de unos <strong>{MODEL_DOWNLOAD_LABEL}</strong> solo la primera vez. Te recomendamos
        hacerlo con wifi y puede tardar varios minutos.
      </p>
      <p>
        Funciona dentro de tu dispositivo: lo que registras no se envía a ningún servicio de IA. Sus consejos son
        orientativos y pueden equivocarse.
      </p>
    </>
  )
}

export default function AiPanel({ status, progress, onActivate }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (status === "checking" || status === "unsupported" || status === "skipped") return null

  if (status === "waiting") {
    return <p className="form-hint">Cuéntale a Mochi cómo estás y te escribirá consejos a tu medida con IA.</p>
  }

  if (status === "off") {
    return (
      <section className="paper-box ai-panel" aria-label="Consejos con IA">
        {confirming ? (
          <>
            <AiDownloadNotice />
            <div className="hero-actions">
              <button type="button" className="button" onClick={onActivate}>
                Descargar y activar
              </button>
              <button type="button" className="button button-quiet" onClick={() => setConfirming(false)}>
                Ahora no
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Mochi puede escribirte consejos a tu medida, sin que tus datos salgan de tu dispositivo.</p>
            <button type="button" className="button" onClick={() => setConfirming(true)}>
              Activar consejos con IA
            </button>
          </>
        )}
      </section>
    )
  }

  if (status === "loading") {
    const percent = Math.round(progress * 100)
    return (
      <section className="paper-box ai-panel" aria-label="Consejos con IA">
        <p>Preparando a Mochi… {percent}%</p>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Preparando la IA"
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="form-hint">La primera vez tarda un rato. Después ya queda guardado.</p>
      </section>
    )
  }

  if (status === "thinking") {
    return (
      <p className="notice" role="status">
        Mochi está escribiendo tus consejos… Puede tardar un par de minutos.
      </p>
    )
  }

  if (status === "failed") {
    return <p className="form-hint">Hoy Mochi no ha podido escribirte con IA. Tienes tus consejos de siempre.</p>
  }

  return <p className="form-hint">Los consejos «Para ti» los escribe una IA en tu dispositivo. Son orientativos.</p>
}
