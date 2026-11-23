// Estado del minijuego «Cuida a Mochi». Es un juego: vive en el dispositivo y se renueva cada día.

import { useSyncExternalStore } from "react"
import { PHASE_CARE, type CareId, type PokeMood } from "../content/care"
import type { Phase } from "./cycle"

export interface CareState {
  day: string
  phase: Phase
  given: CareId[]
}

export type GiveResult = "gift" | "nope" | "repeat" | "done"

export function freshCare(day: string, phase: Phase): CareState {
  return { day, phase, given: [] }
}

/** true si ya le has dado todo lo que necesitaba hoy */
export function isCared(state: CareState) {
  return PHASE_CARE[state.phase].wants.every((id) => state.given.includes(id))
}

/** Lo que pasa al darle algo. Lo que no le apetece no se queda */
export function giveItem(state: CareState, id: CareId): { state: CareState; result: GiveResult } {
  const care = PHASE_CARE[state.phase]
  if (id === care.nope) return { state, result: "nope" }
  if (state.given.includes(id) || !care.wants.includes(id)) return { state, result: "repeat" }
  const next = { ...state, given: [...state.given, id] }
  return { state: next, result: isCared(next) ? "done" : "gift" }
}

/** Cómo reacciona al tocarlo: si ya le has cuidado, se le pasa el enfado o el sueño */
export function pokeMood(phase: Phase, cared: boolean): PokeMood {
  const mood = PHASE_CARE[phase].poke
  return cared && (mood === "grumpy" || mood === "sleepy") ? "happy" : mood
}

/** Los cuatro objetos del día, en un orden que cambia cada día pero no al recargar */
export function trayFor(phase: Phase, day: string): CareId[] {
  const care = PHASE_CARE[phase]
  const items = [...care.wants, care.nope]
  const seed = [...day].reduce((n, c) => n + c.charCodeAt(0), 0)
  return items.map((id, i) => ({ id, k: (seed * (i + 3)) % 7 })).sort((a, b) => a.k - b.k).map((x) => x.id)
}

// ------------------------------------------------------------ almacenamiento
const KEY = "isla-mochi-cuidados"
const ENABLED = "isla-mochi-juego"
const EVENT = "isla-mochi-cuidados"

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento, el juego dura lo que dure la página
  }
  window.dispatchEvent(new Event(EVENT))
}

let cache: { raw: string | null; state: CareState | null } = { raw: null, state: null }

/** Sin fase, devuelve lo de hoy sea cual sea su estación (para Hoy, antes de saberla) */
function loadCare(day: string, phase?: Phase): CareState {
  const raw = read(KEY)
  if (raw !== cache.raw) {
    try {
      cache = { raw, state: raw ? (JSON.parse(raw) as CareState) : null }
    } catch {
      cache = { raw, state: null }
    }
  }
  const saved = cache.state
  // Cada día, o si cambia de estación, se empieza de nuevo
  if (saved && saved.day === day && (phase === undefined || saved.phase === phase)) return saved
  return freshCare(day, phase ?? "folicular")
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}

/** Lo que ya le has dado hoy a Mochi, compartido entre pantallas */
export function useCare(day: string, phase?: Phase) {
  const raw = useSyncExternalStore(subscribe, () => read(KEY))
  void raw
  const state = loadCare(day, phase)
  return {
    state,
    cared: isCared(state),
    give(id: CareId): GiveResult {
      const { state: next, result } = giveItem(state, id)
      if (next !== state) write(KEY, JSON.stringify(next))
      return result
    },
  }
}

/** El minijuego es opcional: se puede ocultar en Ajustes */
export const isCareGameOn = () => read(ENABLED) !== "off"

export function setCareGameOn(on: boolean) {
  write(ENABLED, on ? null : "off")
}

export function useCareGameOn() {
  return useSyncExternalStore(subscribe, isCareGameOn)
}
