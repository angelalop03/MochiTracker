// Conecta el recorrido de la IA con Supabase. Los datos de la usuaria se leen con SU sesión,
// así que RLS sigue aplicando. Los cupos los toca solo la service role, con funciones atómicas.

import type { VercelRequest } from "@vercel/node"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { addDays, todayInTimeZone, type PeriodRecord } from "../../../src/lib/cycle.js"
import type { LogEntry } from "../../../src/lib/personalize.js"
import { adminClient } from "../server.js"
import type { AiKind, AiLimits, AiStore, AiUser } from "./run.js"

const LOG_DAYS = 220

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable ${name}`)
  return value
}

function userClient(token: string) {
  return createClient(env("VITE_SUPABASE_URL"), env("VITE_SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function quotaStore(admin: SupabaseClient, history: AiStore["history"]): AiStore {
  return {
    async used(userId, day) {
      const { data, error } = await admin.from("ai_usage").select("kind, count").eq("user_id", userId).eq("day", day)
      if (error) throw error
      const used: Record<AiKind, number> = { chat: 0, advice: 0 }
      for (const row of data as { kind: AiKind; count: number }[]) used[row.kind] = row.count
      return used
    },
    async take(userId, day, kind, limit) {
      const { data, error } = await admin.rpc("ai_take", { p_user: userId, p_day: day, p_kind: kind, p_limit: limit })
      if (error) throw error
      return (data as number | null) ?? null
    },
    async release(userId, day, kind) {
      const { error } = await admin.rpc("ai_release", { p_user: userId, p_day: day, p_kind: kind })
      if (error) throw error
    },
    async globalTake(day, limits: AiLimits) {
      const { data, error } = await admin.rpc("ai_global_take", {
        p_day: day,
        p_max_requests: limits.globalRequests,
        p_max_tokens: limits.globalTokens,
      })
      if (error) throw error
      return data === true
    },
    async globalTokens(day, tokens) {
      const { error } = await admin.rpc("ai_global_tokens", { p_day: day, p_tokens: tokens })
      if (error) throw error
    },
    async globalPause(day, until) {
      const { error } = await admin.rpc("ai_global_pause", { p_day: day, p_until: until.toISOString() })
      if (error) throw error
    },
    async pausedUntil(day) {
      const { data, error } = await admin.from("ai_global_usage").select("paused_until").eq("day", day).maybeSingle()
      if (error) throw error
      const value = (data as { paused_until: string | null } | null)?.paused_until
      return value ? new Date(value) : null
    },
    history,
  }
}

/** La usuaria de la petición y su almacén, o null si la sesión no es válida */
export async function aiSession(req: VercelRequest, now: Date): Promise<{ user: AiUser; store: AiStore } | null> {
  const token = req.headers.authorization?.replace(/^Bearer /, "")
  if (!token) return null

  const admin = adminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null

  const db = userClient(token)
  const profile = await db
    .from("profiles")
    .select("avg_cycle_length, avg_period_length, timezone, ai_consent_at")
    .eq("id", data.user.id)
    .single()
  if (profile.error) throw profile.error
  const p = profile.data as {
    avg_cycle_length: number
    avg_period_length: number
    timezone: string
    ai_consent_at: string | null
  }

  const user: AiUser = {
    id: data.user.id,
    timezone: p.timezone,
    consent: p.ai_consent_at !== null,
    settings: { avgCycleLength: p.avg_cycle_length, avgPeriodLength: p.avg_period_length },
  }

  const history = async () => {
    const today = todayInTimeZone(p.timezone, now)
    const [periods, logs] = await Promise.all([
      db.from("periods").select("start_date, end_date"),
      // Las notas nunca se leen para la IA
      db.from("daily_logs").select("date, symptoms, mood, energy").gte("date", addDays(today, -LOG_DAYS)),
    ])
    if (periods.error) throw periods.error
    if (logs.error) throw logs.error
    return { periods: periods.data as PeriodRecord[], logs: logs.data as LogEntry[] }
  }

  return { user, store: quotaStore(admin, history) }
}
