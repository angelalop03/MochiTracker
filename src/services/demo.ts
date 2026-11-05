// Modo demo: solo existe en desarrollo y sin claves de Supabase. Guarda en sessionStorage
// para poder recorrer el flujo completo. DEMO es false en producción, así que este
// código se elimina del build.
import { emptyProfile, type PeriodRow, type Profile } from "./data"

const KEY = "isla-mochi-demo"

interface DemoState {
  signedIn: boolean
  profile: Profile
  periods: PeriodRow[]
}

export const DEMO_USER = { id: "demo", email: "demo@islamochi.test" }

export function readDemo(): DemoState {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved) return JSON.parse(saved) as DemoState
  } catch {
    // sessionStorage bloqueado: se empieza de cero
  }
  return { signedIn: false, profile: emptyProfile(DEMO_USER.id), periods: [] }
}

export function writeDemo(patch: Partial<DemoState>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...readDemo(), ...patch }))
  } catch {
    // sin almacenamiento, la demo no guarda nada
  }
}
