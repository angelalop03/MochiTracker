import { SendHorizontal } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import type { AiStatus } from "../hooks/useAiAdvice"
import { AiCloudNotice } from "./AiPanel"
import { AiRequestError, sendChat, type AiStatus as AiQuota, type ChatTurn } from "../lib/ai/cloud"
import { loadChat, saveChat } from "../lib/ai/storage"
import MochiFace from "./MochiFace"

const SUGGESTIONS = ["¿Por qué estoy tan cansada?", "¿Qué me apetece cenar hoy?", "¿Qué ejercicio me va bien ahora?"]
const MAX_LENGTH = 500

interface Props {
  status: AiStatus
  quota: AiQuota | null
  onQuota: (quota: AiQuota) => void
  onActivate: () => void
}

const ERRORS: Partial<Record<AiRequestError["reason"], string>> = {
  user_limit: "Ya has hecho tus preguntas de hoy. Mochi vuelve a responder mañana.",
  global_limit: "Mochi está descansando: hoy se ha usado mucho la IA. Vuelve a probar más tarde.",
  paused: "Mochi está descansando un rato. Vuelve a probar más tarde.",
  network: "No hay conexión. Revisa tu internet y vuelve a probar.",
  consent: "Activa la IA para poder preguntar a Mochi.",
}

/** «Pregúntale a Mochi»: chat con IA. La conversación se guarda solo en este dispositivo */
export default function MochiChat({ status, quota, onQuota, onActivate }: Props) {
  const [turns, setTurns] = useState<ChatTurn[]>(loadChat)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [confirming, setConfirming] = useState(false)
  const log = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveChat(turns)
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" })
  }, [turns, busy])

  if (status === "checking" || status === "unavailable") return null

  const off = status === "off" || quota?.consent === false
  const remaining = quota?.chat.remaining ?? null
  const canAsk = !off && remaining !== 0 && !busy

  async function ask(message: string) {
    const clean = message.trim().slice(0, MAX_LENGTH)
    if (!clean || !canAsk) return
    setError("")
    setBusy(true)
    const history = turns
    setTurns([...history, { role: "user", content: clean }])
    setText("")
    try {
      const { reply, status: next } = await sendChat(clean, history)
      setTurns((t) => [...t, { role: "assistant", content: reply }])
      onQuota(next)
    } catch (e) {
      // El mensaje no ha llegado: se quita y se devuelve al cuadro de texto
      setTurns(history)
      setText(clean)
      const reason = e instanceof AiRequestError ? e.reason : "failed"
      if (e instanceof AiRequestError && e.status) onQuota(e.status)
      setError(ERRORS[reason] ?? "Mochi no ha podido responder. Vuelve a probar en un momento.")
    } finally {
      setBusy(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void ask(text)
  }

  return (
    <section className="mochi-chat" aria-labelledby="chat-title">
      <div className="section-head">
        <h2 id="chat-title" className="eyebrow">
          Pregúntale a Mochi
        </h2>
        {remaining !== null && !off && (
          <span className="section-note">
            {remaining} de {quota?.chat.limit} hoy
          </span>
        )}
      </div>

      <div className="chat-card">
        <div className="chat-log" ref={log} role="log" aria-live="polite" aria-label="Conversación con Mochi">
          <div className="chat-row is-mochi">
            <MochiFace mood="bien" size={32} />
            <p className="chat-bubble">
              ¿Qué quieres saber? Puedo contarte por qué te sientes así estos días o darte ideas para hoy.
            </p>
          </div>
          {turns.map((turn, i) =>
            turn.role === "assistant" ? (
              <div key={i} className="chat-row is-mochi">
                <MochiFace mood="bien" size={32} />
                <p className="chat-bubble">{turn.content}</p>
              </div>
            ) : (
              <div key={i} className="chat-row is-me">
                <p className="chat-bubble">{turn.content}</p>
              </div>
            )
          )}
          {busy && (
            <div className="chat-row is-mochi" aria-label="Mochi está escribiendo">
              <MochiFace mood="normal" size={32} />
              <p className="chat-bubble chat-typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </p>
            </div>
          )}
        </div>

        {off ? (
          <div className="chat-off">
            {confirming ? (
              <>
                <AiCloudNotice />
                <div className="hero-actions">
                  <button type="button" className="button button-small" onClick={onActivate}>
                    Acepto, activar
                  </button>
                  <button type="button" className="button button-quiet button-small" onClick={() => setConfirming(false)}>
                    Ahora no
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Para preguntar a Mochi, activa la IA. Antes te explicamos qué se envía.</p>
                <button type="button" className="button button-small" onClick={() => setConfirming(true)}>
                  Activar la IA
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {turns.length === 0 && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chat-suggestion" disabled={!canAsk} onClick={() => void ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {error && (
              <p className="chat-error" role="alert">
                {error}
              </p>
            )}
            <form className="chat-form" onSubmit={submit}>
              <label className="sr-only" htmlFor="chat-input">
                Tu pregunta
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={text}
                maxLength={MAX_LENGTH}
                placeholder={remaining === 0 ? "Mañana podrás preguntar más" : "Escribe tu pregunta"}
                disabled={remaining === 0}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void ask(text)
                  }
                }}
              />
              <button type="submit" className="chat-send" disabled={!canAsk || !text.trim()} aria-label="Enviar">
                <SendHorizontal size={20} aria-hidden="true" />
              </button>
            </form>
          </>
        )}

        <div className="chat-foot">
          <span>Orientativo: no sustituye a un profesional sanitario.</span>
          {turns.length > 0 && (
            <button type="button" className="button-link" onClick={() => setTurns([])}>
              Borrar conversación
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
