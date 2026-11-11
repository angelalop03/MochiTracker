import { useState } from "react"
import type { AiStatus } from "../hooks/useAiAdvice"
import type { AiStatus as AiQuota } from "../lib/ai/cloud"

interface Props {
  status: AiStatus
  quota: AiQuota | null
  onActivate: () => void
}

/** Qué se envía y a quién, antes de activar. Se reutiliza en el chat */
export function AiCloudNotice() {
  return (
    <>
      <p>
        Para escribirte, Mochi usa un servicio de IA en la nube (Groq). Le enviamos solo lo necesario:{" "}
        <strong>tu fase, el día del ciclo y lo que hayas registrado estos días</strong> (síntomas, ánimo y energía).
        Nunca tu nombre, tu email ni tus notas.
      </p>
      <p>
        Se procesa en servidores de Estados Unidos, configurado para no guardar lo que enviamos. Es gratis, con un
        límite diario. Sus respuestas son orientativas y pueden equivocarse. Puedes desactivarlo cuando quieras en
        Ajustes.
      </p>
    </>
  )
}

export default function AiPanel({ status, quota, onActivate }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (status === "checking" || status === "unavailable" || status === "skipped" || status === "waiting") return null

  if (status === "off") {
    return (
      <section className="paper-box ai-panel" aria-label="Consejos con IA">
        {confirming ? (
          <>
            <AiCloudNotice />
            <div className="hero-actions">
              <button type="button" className="button" onClick={onActivate}>
                Acepto, activar
              </button>
              <button type="button" className="button button-quiet" onClick={() => setConfirming(false)}>
                Ahora no
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Mochi puede escribirte consejos a tu medida y responder tus preguntas con IA. Sin descargar nada.</p>
            <button type="button" className="button" onClick={() => setConfirming(true)}>
              Activar consejos con IA
            </button>
          </>
        )}
      </section>
    )
  }

  if (status === "thinking") {
    return (
      <p className="notice" role="status">
        Mochi está escribiendo tus consejos…
      </p>
    )
  }

  if (status === "limit") {
    return <p className="form-hint">Hoy ya has usado tus consejos con IA. Mañana Mochi te escribe otros.</p>
  }

  if (status === "paused") {
    return (
      <p className="form-hint">
        La IA está descansando: hoy se ha usado mucho. Tienes tus consejos de siempre y vuelve en cuanto pueda.
      </p>
    )
  }

  if (status === "failed") {
    return <p className="form-hint">Hoy Mochi no ha podido escribirte con IA. Tienes tus consejos de siempre.</p>
  }

  const left = quota ? quota.chat.remaining : null
  return (
    <p className="form-hint">
      Los consejos «Para ti» los escribe una IA. Son orientativos.
      {left !== null && ` Te quedan ${left} ${left === 1 ? "pregunta" : "preguntas"} a Mochi hoy.`}
    </p>
  )
}
