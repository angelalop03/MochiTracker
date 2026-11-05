// Modo demo: solo existe en desarrollo y sin claves de Supabase. Guarda en sessionStorage
// para poder recorrer el flujo completo. DEMO es false en producción, así que este
// código se elimina del build.
import { emptyProfile, type DailyLog, type PeriodRow, type Profile } from "./data"

const KEY = "isla-mochi-demo"

interface DemoState {
  signedIn: boolean
  profile: Profile
  periods: PeriodRow[]
  logs: DailyLog[]
}

export const DEMO_USER = { id: "demo", email: "demo@islamochi.test" }

export function readDemo(): DemoState {
  const empty = { signedIn: false, profile: emptyProfile(DEMO_USER.id), periods: [], logs: [] }
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved) return { ...empty, ...(JSON.parse(saved) as Partial<DemoState>) }
  } catch {
    // sessionStorage bloqueado: se empieza de cero
  }
  return empty
}

export function writeDemo(patch: Partial<DemoState>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...readDemo(), ...patch }))
  } catch {
    // sin almacenamiento, la demo no guarda nada
  }
}
