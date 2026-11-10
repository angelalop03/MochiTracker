import { Sparkles, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { checkSupport, deleteModel, type AiSupport } from "../lib/ai/engine"
import { isAiEnabled, setAiEnabled } from "../lib/ai/storage"
import { SettingsGroup, SettingsRow } from "./settings"

export default function AiSettings() {
  const [support, setSupport] = useState<AiSupport | null>(null)
  const [enabled, setEnabled] = useState(isAiEnabled)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void checkSupport().then(setSupport)
  }, [])

  async function turnOff() {
    setBusy(true)
    setAiEnabled(false)
    setEnabled(false)
    setMessage("")
    try {
      await deleteModel()
      setMessage("IA desactivada y modelo borrado de este dispositivo.")
    } catch (error) {
      console.error(error)
      setMessage("IA desactivada. No se ha podido borrar el modelo.")
    } finally {
      setBusy(false)
    }
  }

  const status = support === null ? "…" : support === "unsupported" ? "No disponible" : enabled ? "Activados" : "Desactivados"
  const footer =
    message ||
    (support === "unsupported"
      ? "La IA necesita un ordenador con tarjeta gráfica. En este dispositivo tus consejos se personalizan con reglas."
      : enabled
        ? "Funciona dentro de este dispositivo: lo que registras no se envía a ningún servicio de IA."
        : "Puedes activarlos desde Hoy. Se descarga un modelo de unos 2,3 GB la primera vez.")

  return (
    <SettingsGroup title="Consejos con IA" footer={footer}>
      <SettingsRow icon={Sparkles} label="Estado" value={status} />
      {support === "ready" && enabled && (
        <SettingsRow icon={Trash2} label="Desactivar y borrar el modelo" onClick={() => void turnOff()} disabled={busy} />
      )}
    </SettingsGroup>
  )
}
