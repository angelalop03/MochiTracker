import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { checkSupport, deleteModel, type AiSupport } from "../lib/ai/engine"
import { isAiEnabled, setAiEnabled } from "../lib/ai/storage"

export default function AiSettings() {
  const [support, setSupport] = useState<AiSupport | null>(null)
  const [enabled, setEnabled] = useState(isAiEnabled)
  const [message, setMessage] = useState("")

  useEffect(() => {
    void checkSupport().then(setSupport)
  }, [])

  if (support === null) return null
  if (support === "unsupported") {
    return <p className="form-hint">La IA necesita un ordenador con tarjeta gráfica. En este dispositivo tus consejos se personalizan con reglas.</p>
  }

  async function turnOff() {
    setAiEnabled(false)
    setEnabled(false)
    setMessage("")
    try {
      await deleteModel()
      setMessage("IA desactivada y modelo borrado de este dispositivo.")
    } catch (error) {
      console.error(error)
      setMessage("IA desactivada. No se ha podido borrar el modelo.")
    }
  }

  return (
    <div className="form">
      {enabled ? (
        <>
          <p>Los consejos con IA están activados en este dispositivo.</p>
          <button type="button" className="button button-quiet" onClick={() => void turnOff()}>
            Desactivar y borrar el modelo
          </button>
        </>
      ) : (
        <p>
          Están desactivados. Puedes activarlos desde <Link to="/hoy">Hoy</Link>.
        </p>
      )}
      {message && (
        <p className="form-ok" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
