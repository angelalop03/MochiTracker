import { DEMO, supabase } from "./supabase"
import { readDemo, writeDemo } from "./demo"
import type { ImportResult } from "../lib/clue/types"

export interface Profile {
  id: string
  name: string | null
  avg_cycle_length: number
  avg_period_length: number
  notify_email: boolean
  notify_push: boolean
  notify_frequency: "daily" | "phase_change"
  timezone: string
  health_consent_at: string | null
  privacy_version: string | null
  onboarded_at: string | null
  /** Uno de los Mochis predeterminados, o null para usar la inicial */
  avatar?: string | null
}

export interface PeriodRow {
  start_date: string
  end_date: string | null
  /** De dónde viene: apuntada en la app o importada de Clue */
  source?: "manual" | "clue"
}

export interface DailyLog {
  date: string
  symptoms: string[]
  mood: string | null
  energy: number | null
  notes: string | null
}

export type ProfilePatch = Partial<Omit<Profile, "id">>

export function emptyProfile(id: string): Profile {
  return {
    id,
    name: null,
    avg_cycle_length: 28,
    avg_period_length: 5,
    notify_email: false,
    notify_push: false,
    notify_frequency: "phase_change",
    timezone: "Europe/Madrid",
    health_consent_at: null,
    privacy_version: null,
    onboarded_at: null,
    avatar: null,
  }
}

function db() {
  if (!supabase) throw new Error("Supabase no está configurado")
  return supabase
}

export async function fetchProfile(userId: string): Promise<Profile> {
  if (DEMO) return readDemo().profile
  const { data, error } = await db().from("profiles").select("*").eq("id", userId).single()
  if (error) throw error
  return data as Profile
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<void> {
  if (DEMO) {
    writeDemo({ profile: { ...readDemo().profile, ...patch } })
    return
  }
  const { error } = await db().from("profiles").update(patch).eq("id", userId)
  if (error) throw error
}

export async function fetchPeriods(): Promise<PeriodRow[]> {
  if (DEMO) return readDemo().periods
  // RLS ya limita la consulta a las filas de la usuaria
  const { data, error } = await db()
    .from("periods")
    .select("start_date, end_date, source")
    .order("start_date", { ascending: true })
  if (error) throw error
  return data as PeriodRow[]
}

/** Registra el inicio de una regla. Si ese día ya existe, no hace nada */
export async function addPeriod(userId: string, startDate: string): Promise<void> {
  if (DEMO) {
    const { periods } = readDemo()
    if (!periods.some((p) => p.start_date === startDate)) {
      writeDemo({ periods: [...periods, { start_date: startDate, end_date: null }] })
    }
    return
  }
  const { error } = await db()
    .from("periods")
    .upsert(
      { user_id: userId, start_date: startDate },
      { onConflict: "user_id,start_date", ignoreDuplicates: true }
    )
  if (error) throw error
}

export async function setPeriodEnd(startDate: string, endDate: string | null): Promise<void> {
  if (DEMO) {
    writeDemo({
      periods: readDemo().periods.map((p) =>
        p.start_date === startDate ? { ...p, end_date: endDate } : p
      ),
    })
    return
  }
  const { error } = await db().from("periods").update({ end_date: endDate }).eq("start_date", startDate)
  if (error) throw error
}

export async function deletePeriod(startDate: string): Promise<void> {
  if (DEMO) {
    writeDemo({ periods: readDemo().periods.filter((p) => p.start_date !== startDate) })
    return
  }
  const { error } = await db().from("periods").delete().eq("start_date", startDate)
  if (error) throw error
}

export async function fetchLogs(since: string): Promise<DailyLog[]> {
  if (DEMO) return readDemo().logs.filter((log) => log.date >= since)
  const { data, error } = await db()
    .from("daily_logs")
    .select("date, symptoms, mood, energy, notes")
    .gte("date", since)
    .order("date", { ascending: true })
  if (error) throw error
  return data as DailyLog[]
}

/** Guarda el registro de un día. Si ya existe, lo sustituye */
/** Guarda lo importado sin pisar nada de lo que la usuaria ya tenía */
export async function saveImport(userId: string, result: ImportResult): Promise<void> {
  if (DEMO) {
    const state = readDemo()
    const starts = new Set(state.periods.map((p) => p.start_date))
    const days = new Set(state.logs.map((l) => l.date))
    writeDemo({
      periods: [...state.periods, ...result.periods.filter((p) => !starts.has(p.start_date))],
      logs: [
        ...state.logs,
        ...result.logs
          .filter((l) => !days.has(l.date))
          .map((l) => ({ ...l, mood: null, energy: null, notes: null })),
      ],
    })
    return
  }
  const periods = await db()
    .from("periods")
    .upsert(
      result.periods.map((p) => ({ ...p, user_id: userId, source: "clue" })),
      { onConflict: "user_id,start_date", ignoreDuplicates: true }
    )
  if (periods.error) throw periods.error
  if (result.logs.length === 0) return
  const logs = await db()
    .from("daily_logs")
    .upsert(
      result.logs.map((l) => ({ ...l, user_id: userId, source: "clue" })),
      { onConflict: "user_id,date", ignoreDuplicates: true }
    )
  if (logs.error) throw logs.error
}
