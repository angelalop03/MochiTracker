import { DEMO, supabase } from "./supabase"
import { readDemo, writeDemo } from "./demo"

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
}

export interface PeriodRow {
  start_date: string
  end_date: string | null
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
    .select("start_date, end_date")
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
