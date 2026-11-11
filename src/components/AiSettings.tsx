import { Gauge, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchAiStatus, setAiConsent, type AiStatus } from "../lib/ai/cloud"
import { clearAiAdvice } from "../lib/ai/storage"
import type { Profile } from "../services/data"
import { SettingsGroup, SettingsRow, Switch } from "./settings"

interface Props {
  profile: Profile
  onSaved: () => Promise<void>
}

/** Activar o retirar el permiso para la IA en la nube, y cuántas consultas quedan hoy */
export default function AiSettings({ profile, onSaved }: Props) {
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const consent = Boolean(profile.ai_consent_at)

  useEffect(() => {
    let cancelled = false
    void fetchAiStatus()
      .then((s) => !cancelled && setStatus(s))
      .catch(() => !cancelled && setStatus(null))
    return () => {
      cancelled = true
    }
  }, [consent])

  async function toggle(on: boolean) {
    setBusy(true)
    setMessage("")
    try {
      await setAiConsent(profile.id, on)
      // Al retirarlo, se borran también los consejos y la conversación guardados aquí
      if (!on) clearAiAdvice()
      await onSaved()
      setMessage(on ? "IA activada." : "IA desactivada. Hemos borrado los consejos y la conversación de este dispositivo.")
    } catch (error) {
      console.error(error)
      setMessage("No se ha podido guardar. Vuelve a intentarlo.")
    } finally {
      setBusy(false)
    }
  }

  const available = status?.available ?? false
  const footer =
    message ||
    (status && !available
      ? "La IA no está disponible ahora mismo. Tus consejos se personalizan con reglas."
      : "Usa un servicio de IA en la nube (Groq), gratis y con un límite diario. Solo le enviamos tu fase, el día del ciclo y lo registrado estos días, nunca tu nombre, tu email ni tus notas. Las conversaciones se guardan solo en este dispositivo.")

  return (
    <SettingsGroup title="Consejos y chat con IA" footer={footer}>
      <SettingsRow
        icon={Sparkles}
        label="Usar la IA"
        hint={consent ? "Has dado tu permiso" : "Necesita tu permiso para enviar tus datos"}
        control={
          <Switch
            label="Usar la IA"
            checked={consent}
            disabled={busy || (!available && !consent)}
            onChange={(on) => void toggle(on)}
          />
        }
      />
      {consent && status && available && (
        <SettingsRow
          icon={Gauge}
          label="Te quedan hoy"
          hint={`${status.chat.remaining} de ${status.chat.limit} preguntas y ${status.advice.remaining} de ${status.advice.limit} tandas de consejos. Se renuevan a medianoche.`}
        />
      )}
    </SettingsGroup>
  )
}
