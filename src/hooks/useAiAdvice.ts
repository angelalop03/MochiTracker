import { useCallback, useEffect, useRef, useState } from "react"
import { shouldUseAi, type AiAdvice, type AiInput } from "../lib/ai/advice"
import { setAiBusy } from "../lib/ai/busy"
import { checkSupport, generateAdvice, loadEngine } from "../lib/ai/engine"
import { cacheAdvice, cachedAdvice, isAiEnabled, setAiEnabled } from "../lib/ai/storage"

export type AiStatus =
  | "checking"
  | "unsupported" // sin capacidad suficiente: la app funciona igual con las reglas
  | "off"
  | "waiting" // activada, pero aún no hay nada que personalizar
  | "skipped" // señal de alarma: mandan las reglas
  | "loading"
  | "thinking"
  | "ready"
  | "failed"

/** Consejos con IA para un día. Si algo falla, advice es null y se usan las reglas */
export function useAiAdvice(input: AiInput, key: string) {
  const [status, setStatus] = useState<AiStatus>("checking")
  const [progress, setProgress] = useState(0)
  const [advice, setAdvice] = useState<AiAdvice | null>(null)
  const inputRef = useRef(input)
  inputRef.current = input
  const running = useRef<string | null>(null)

  const run = useCallback(async () => {
    const current = inputRef.current
    if (running.current === key) return

    if (!shouldUseAi(current)) {
      setAdvice(null)
      setStatus(current.alarm ? "skipped" : "waiting")
      return
    }

    const saved = cachedAdvice(key)
    if (saved) {
      setAdvice(saved)
      setStatus("ready")
      return
    }

    running.current = key
    setAdvice(null)
    setStatus("loading")
    try {
      const engine = await loadEngine((report) => setProgress(report.progress))
      setStatus("thinking")
      setAiBusy(true)
      const result = await generateAdvice(engine, current)
      if (running.current !== key) return
      if (result) {
        cacheAdvice(key, result)
        setAdvice(result)
        setStatus("ready")
      } else {
        setStatus("failed")
      }
    } catch (error) {
      console.error("La IA no ha podido generar consejos:", (error as Error).message)
      setStatus("failed")
    } finally {
      setAiBusy(false)
      if (running.current === key) running.current = null
    }
  }, [key])

  useEffect(() => {
    let cancelled = false
    void checkSupport().then((support) => {
      if (cancelled) return
      if (support === "unsupported") setStatus("unsupported")
      else if (!isAiEnabled()) setStatus("off")
      else void run()
    })
    return () => {
      cancelled = true
    }
  }, [run])

  const activate = useCallback(() => {
    setAiEnabled(true)
    void run()
  }, [run])

  return { status, progress, advice, activate }
}
