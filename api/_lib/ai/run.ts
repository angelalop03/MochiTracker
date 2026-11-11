// El recorrido de cada consulta, sin saber nada de Supabase ni del proveedor concreto:
// consentimiento → cupo de la usuaria → cupo global → IA → validación.
// Si el proveedor falla, se devuelve el cupo. Si avisa de límite, se pausa la IA para todas.

import { addDays, todayInTimeZone, type CycleSettings, type PeriodRecord } from "../../../src/lib/cycle.js"
import type { AiAdvice } from "../../../src/lib/ai/advice.js"
import type { LogEntry } from "../../../src/lib/personalize.js"
import { buildContext } from "./context.js"
import {
  adviceJson,
  adviceMessages,
  CHAT_MAX_MESSAGE,
  chatMessages,
  checkChatReply,
  CRISIS_REPLY,
  isCrisis,
  parseAdvice,
  type ChatTurn,
} from "./prompts.js"
import { ProviderLimitError, type AiProvider } from "./provider.js"

export type AiKind = "chat" | "advice"

export interface AiLimits {
  chat: number
  advice: number
  /** Topes diarios propios, por debajo de los del plan gratuito del proveedor */
  globalRequests: number
  globalTokens: number
}

export function limitsFromEnv(env: Record<string, string | undefined> = process.env): AiLimits {
  const num = (name: string, fallback: number) => {
    const value = Number(env[name])
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback
  }
  return {
    chat: num("AI_CHAT_DAILY", 5),
    advice: num("AI_ADVICE_DAILY", 1),
    globalRequests: num("AI_GLOBAL_REQUESTS_DAILY", 900),
    globalTokens: num("AI_GLOBAL_TOKENS_DAILY", 180_000),
  }
}

export interface AiUser {
  id: string
  timezone: string
  consent: boolean
  settings: CycleSettings
}

export interface AiStore {
  /** Cuántas lleva hoy de cada tipo */
  used(userId: string, day: string): Promise<Record<AiKind, number>>
  /** Reserva una. Devuelve cuántas lleva tras reservar, o null si no queda cupo */
  take(userId: string, day: string, kind: AiKind, limit: number): Promise<number | null>
  release(userId: string, day: string, kind: AiKind): Promise<void>
  globalTake(day: string, limits: AiLimits): Promise<boolean>
  globalTokens(day: string, tokens: number): Promise<void>
  globalPause(day: string, until: Date): Promise<void>
  pausedUntil(day: string): Promise<Date | null>
  /** Sus datos, leídos con su propia sesión: RLS sigue aplicando */
  history(): Promise<{ periods: PeriodRecord[]; logs: LogEntry[] }>
}

export interface Quota {
  used: number
  limit: number
  remaining: number
}

export interface AiStatus {
  available: boolean
  consent: boolean
  chat: Quota
  advice: Quota
  /** Día en que se renuevan los cupos de la usuaria (a medianoche en su zona horaria) */
  resetsOn: string
  /** Si el proveedor pidió parar, hasta cuándo */
  pausedUntil: string | null
}

export type AiFailure =
  | { ok: false; reason: "unavailable" | "consent" | "no_data" | "invalid" | "failed"; status: AiStatus }
  | { ok: false; reason: "user_limit" | "global_limit" | "paused"; status: AiStatus }

const quota = (used: number, limit: number): Quota => ({ used, limit, remaining: Math.max(0, limit - used) })

interface Deps {
  user: AiUser
  store: AiStore
  provider: AiProvider | null
  limits: AiLimits
  now: Date
}

const dayFor = (user: AiUser, now: Date) => todayInTimeZone(user.timezone, now)
const globalDay = (now: Date) => now.toISOString().slice(0, 10)

export async function aiStatus({ user, store, provider, limits, now }: Deps): Promise<AiStatus> {
  const day = dayFor(user, now)
  const [used, paused] = await Promise.all([store.used(user.id, day), store.pausedUntil(globalDay(now))])
  return {
    available: provider !== null,
    consent: user.consent,
    chat: quota(used.chat, limits.chat),
    advice: quota(used.advice, limits.advice),
    resetsOn: addDays(day, 1),
    pausedUntil: paused && paused > now ? paused.toISOString() : null,
  }
}

/** Reserva cupo, llama al proveedor y devuelve el cupo si algo falla */
async function withQuota<T>(
  deps: Deps,
  kind: AiKind,
  call: (provider: AiProvider) => Promise<{ value: T | null; tokens: number }>
): Promise<{ ok: true; value: T; status: AiStatus } | AiFailure> {
  const { user, store, provider, limits, now } = deps
  const fail = async (reason: AiFailure["reason"]) => ({ ok: false, reason, status: await aiStatus(deps) }) as AiFailure
  if (!provider) return fail("unavailable")
  if (!user.consent) return fail("consent")

  const day = dayFor(user, now)
  const gday = globalDay(now)
  const limit = kind === "chat" ? limits.chat : limits.advice
  if ((await store.take(user.id, day, kind, limit)) === null) return fail("user_limit")

  const paused = await store.pausedUntil(gday)
  if (paused && paused > now) {
    await store.release(user.id, day, kind)
    return fail("paused")
  }
  if (!(await store.globalTake(gday, limits))) {
    await store.release(user.id, day, kind)
    return fail("global_limit")
  }

  try {
    const { value, tokens } = await call(provider)
    await store.globalTokens(gday, tokens)
    if (value === null) {
      await store.release(user.id, day, kind)
      return fail("invalid")
    }
    return { ok: true, value, status: await aiStatus(deps) }
  } catch (error) {
    await store.release(user.id, day, kind)
    if (error instanceof ProviderLimitError) {
      await store.globalPause(gday, new Date(now.getTime() + error.retryAfterSeconds * 1000))
      return fail("paused")
    }
    console.error("La IA ha fallado:", (error as Error).message)
    return fail("failed")
  }
}

export async function runAdvice(deps: Deps): Promise<{ ok: true; value: AiAdvice; status: AiStatus } | AiFailure> {
  const { periods, logs } = await deps.store.history()
  const ctx = buildContext({ periods, logs, settings: deps.user.settings, today: dayFor(deps.user, deps.now) })
  // Sin datos no hay nada que personalizar, y con señales de alarma mandan las reglas
  if (!ctx || ctx.alarm) return { ok: false, reason: "no_data", status: await aiStatus(deps) }

  return withQuota(deps, "advice", async (provider) => {
    const reply = await provider.complete({ messages: adviceMessages(ctx), maxTokens: 1500, temperature: 0.4, json: adviceJson })
    return { value: parseAdvice(reply.text, ctx), tokens: reply.tokens }
  })
}

export function cleanHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (t): t is ChatTurn =>
        !!t && typeof t === "object" && (t.role === "user" || t.role === "assistant") && typeof t.content === "string"
    )
    .map((t) => ({ role: t.role, content: t.content.trim() }))
    .filter((t) => t.content)
}

export async function runChat(
  deps: Deps,
  message: string,
  history: ChatTurn[]
): Promise<{ ok: true; value: string; status: AiStatus } | AiFailure> {
  const text = message.trim().slice(0, CHAT_MAX_MESSAGE)
  if (!text) return { ok: false, reason: "invalid", status: await aiStatus(deps) }
  // Ayuda inmediata, sin pasar por la IA ni gastar cupo
  if (isCrisis(text)) return { ok: true, value: CRISIS_REPLY, status: await aiStatus(deps) }

  const { periods, logs } = await deps.store.history()
  const ctx = buildContext({ periods, logs, settings: deps.user.settings, today: dayFor(deps.user, deps.now) })

  return withQuota(deps, "chat", async (provider) => {
    const reply = await provider.complete({ messages: chatMessages(ctx, history, text), maxTokens: 900, temperature: 0.6 })
    return { value: checkChatReply(reply.text), tokens: reply.tokens }
  })
}
