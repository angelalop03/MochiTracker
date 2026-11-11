import { useCallback, useEffect, useRef, useState } from "react"
import type { AiAdvice, AiInput } from "../lib/ai/advice"
import { AiRequestError, fetchAiStatus, requestAdvice, setAiConsent, type AiStatus as AiQuotaStatus } from "../lib/ai/cloud"
import { cacheAdvice, cachedAdvice } from "../lib/ai/storage"
import { useSession } from "./useSession"

export type AiStatus =
  | "checking"
  | "unavailable" // el servidor no tiene IA configurada: la app funciona igual con las reglas
  | "off" // sin consentimiento
  | "waiting" // aún no hay datos de ciclo que personalizar
  | "skipped" // señal de alarma: mandan las reglas
  | "thinking"
  | "ready"
  | "limit" // ya usó los consejos con IA de hoy
  | "paused" // el servicio de IA ha llegado a su límite gratuito por hoy
  | "failed"

const FROM_REASON: Partial<Record<AiRequestError["reason"], AiStatus>> = {
  unavailable: "unavailable",
  consent: "off",
  no_data: "waiting",
  user_limit: "limit",
  global_limit: "paused",
  paused: "paused",
}

/** Consejos con IA para un día. Si algo falla, advice es null y se usan las reglas */
export function useAiAdvice(input: AiInput, key: string) {
  const session = useSession()
  const [status, setStatus] = useState<AiStatus>("checking")
  const [advice, setAdvice] = useState<AiAdvice | null>(null)
  const [quota, setQuota] = useState<AiQuotaStatus | null>(null)
  const running = useRef<string | null>(null)
  const alarm = input.alarm

  const run = useCallback(async () => {
    if (running.current === key) return
    running.current = key
    setStatus("thinking")
    try {
      const result = await requestAdvice()
      cacheAdvice(key, result.advice)
      setAdvice(result.advice)
      setQuota(result.status)
      setStatus("ready")
    } catch (error) {
      const reason = error instanceof AiRequestError ? error.reason : "failed"
      if (error instanceof AiRequestError && error.status) setQuota(error.status)
      setStatus(FROM_REASON[reason] ?? "failed")
    } finally {
      if (running.current === key) running.current = null
    }
  }, [key])

  useEffect(() => {
    let cancelled = false
    if (alarm) {
      // Con señales de alarma los consejos son por reglas, pero el chat sigue disponible
      setAdvice(null)
      setStatus("skipped")
      void fetchAiStatus()
        .then((s) => !cancelled && setQuota(s))
        .catch(() => {})
      return () => {
        cancelled = true
      }
    }
    const saved = cachedAdvice(key)
    void fetchAiStatus()
      .then((s) => {
        if (cancelled) return
        setQuota(s)
        if (!s.available) setStatus("unavailable")
        else if (!s.consent) setStatus("off")
        else if (saved) {
          setAdvice(saved)
          setStatus("ready")
        } else if (s.pausedUntil) setStatus("paused")
        else if (s.advice.remaining > 0) void run()
        else setStatus("limit")
      })
      .catch(() => {
        if (cancelled) return
        // Sin conexión con la IA se siguen viendo los consejos de siempre (y los ya guardados)
        if (saved) {
          setAdvice(saved)
          setStatus("ready")
        } else setStatus("unavailable")
      })
    return () => {
      cancelled = true
    }
  }, [key, alarm, run])

  const activate = useCallback(async () => {
    if (session.status !== "in") return
    try {
      await setAiConsent(session.user.id, true)
      void run()
    } catch (error) {
      console.error(error)
      setStatus("failed")
    }
  }, [session, run])

  return { status, advice, quota, setQuota, activate }
}
