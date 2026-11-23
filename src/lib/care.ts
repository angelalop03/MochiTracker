// «Cuida a Mochi» como un tamagochi: sus necesidades bajan con el tiempo, según su estación,
// y suben con tus cuidados. Es un juego: vive en el dispositivo.

import { useEffect, useState, useSyncExternalStore } from "react"
import {
  CARE_ITEMS,
  LEVELS,
  MOOD_LINES,
  PHASE_CARE,
  POKE_LINES,
  STATS,
  type CareId,
  type Mood,
  type Stat,
  type Temperament,
} from "../content/care"
import type { Phase } from "./cycle"

export type Stats = Record<Stat, number>

export interface CareState {
  /** La estación con la que se calcularon sus necesidades */
  phase: Phase
  stats: Stats
  /** Momento del último cálculo, en milisegundos */
  updatedAt: number
  /** Puntos de cariño */
  xp: number
  /** Días en que la has cuidado (los últimos 60) */
  days: string[]
  /** Lo que lleva puesto y hasta cuándo */
  wearing: Partial<Record<CareId, number>>
  /** Duerme hasta este momento */
  sleepUntil: number
}

const HOUR = 3_600_000
/** Como mucho se tienen en cuenta dos días sin abrir la app */
const MAX_HOURS = 48
const WEAR_MS = 3 * HOUR
export const NAP_MS = 20_000
const MIN_STAT = 5

const clamp = (n: number, max = 100) => Math.max(0, Math.min(max, Math.round(n)))

/** Empieza como está lo habitual en su fase */
export function newCare(now: number, phase: Phase): CareState {
  return { phase, stats: { ...PHASE_CARE[phase].start }, updatedAt: now, xp: 0, days: [], wearing: {}, sleepUntil: 0 }
}

/**
 * Las necesidades bajan con el tiempo, a distinto ritmo según la estación, y nunca pasan del
 * techo de la fase. Al cambiar de estación se acercan a lo habitual en la nueva. Nunca llegan a 0.
 */
export function decay(state: CareState, phase: Phase, now: number): CareState {
  const care = PHASE_CARE[phase]
  let stats = { ...state.stats }
  if (state.phase !== phase) {
    for (const { id } of STATS) stats[id] = Math.round((stats[id] + care.start[id]) / 2)
  }
  const hours = Math.min(MAX_HOURS, Math.max(0, (now - state.updatedAt) / HOUR))
  const next = { ...stats }
  for (const { id } of STATS) {
    const dropped = clamp(stats[id] - care.decay[id] * hours, care.cap[id])
    next[id] = Math.max(Math.min(stats[id], MIN_STAT), dropped)
  }
  stats = next
  return { ...state, phase, stats, updatedAt: Math.max(now, state.updatedAt) }
}

export type CareResult =
  | { kind: "ok"; line: string; favorite: boolean }
  | { kind: "refused"; line: string }
  | { kind: "full"; line: string }
  | { kind: "asleep"; line: string }

/** Le das algo: sube lo que toque (el doble si es su favorito) o lo rechaza */
export function applyCare(state: CareState, phase: Phase, id: CareId, today: string, now: number): { state: CareState; result: CareResult } {
  const care = PHASE_CARE[phase]
  const item = CARE_ITEMS[id]
  const current = decay(state, phase, now)

  if (current.sleepUntil > now && id !== "dormir") return { state: current, result: { kind: "asleep", line: "Shh… está durmiendo." } }

  const refusal = care.refuses[id]
  if (refusal) {
    const stats = { ...current.stats, animo: clamp(current.stats.animo - 5) }
    return { state: { ...current, stats }, result: { kind: "refused", line: refusal } }
  }

  const gains = Object.entries(item.effect).filter(([, v]) => (v ?? 0) > 0) as [Stat, number][]
  if (gains.length > 0 && gains.every(([stat]) => current.stats[stat] >= care.cap[stat] - 5)) {
    return { state: current, result: { kind: "full", line: "Ahora mismo no me hace falta, gracias." } }
  }

  const favorite = care.favorites.includes(id)
  const stats = { ...current.stats }
  for (const [stat, value] of Object.entries(item.effect) as [Stat, number][]) {
    stats[stat] = clamp(stats[stat] + (value > 0 && favorite ? value * 1.5 : value), care.cap[stat])
  }
  const days = current.days.includes(today) ? current.days : [...current.days, today].slice(-60)
  const wearing = { ...current.wearing }
  if (item.show === "wear") wearing[id] = now + WEAR_MS
  const next: CareState = {
    ...current,
    stats,
    xp: current.xp + (favorite ? 2 : 1),
    days,
    wearing,
    sleepUntil: id === "dormir" ? now + NAP_MS : current.sleepUntil,
  }
  const line = item.say
  return { state: next, result: { kind: "ok", line, favorite } }
}

/** Cómo se siente: manda la necesidad más baja; si todas van bien, está feliz */
export function moodOf(state: CareState, now: number): Mood {
  if (state.sleepUntil > now) return "dormida"
  const s = state.stats
  const lowest = STATS.map(({ id }) => id).sort((a, b) => s[a] - s[b])[0]!
  if (s[lowest] < 25) {
    return lowest === "barriga" ? "hambrienta" : lowest === "energia" ? "cansada" : lowest === "animo" ? "triste" : "incomoda"
  }
  const average = (s.barriga + s.energia + s.animo + s.confort) / 4
  return average >= 75 ? "feliz" : average >= 45 ? "bien" : "regular"
}

/** Cómo reacciona al tocarla, según su estación y cómo se siente */
export function temperamentOf(phase: Phase, mood: Mood): Temperament {
  if (mood === "dormida" || mood === "cansada") return "sleepy"
  if (mood === "hambrienta" || mood === "triste") return "grumpy"
  const base = PHASE_CARE[phase].temperament
  if (mood === "feliz") {
    // Feliz aguanta más: en otoño primero sonríe, y en invierno se anima
    if (base === "grumpy") return "soft"
    if (base === "sleepy") return "happy"
  }
  return base
}

/** Lo que dice al tocarla la vez número step (0, 1 o 2) */
export function pokeLine(temperament: Temperament, step: number, mood: Mood): string {
  const lines = POKE_LINES[temperament]
  // La primera vez, si algo le pasa, te lo cuenta
  if (step === 0 && MOOD_LINES[mood] && mood !== "dormida") return `${lines[0]} ${MOOD_LINES[mood]}`
  return lines[Math.min(2, step)]!
}

/** Lo que dice al entrar */
export function greeting(phase: Phase, mood: Mood): string {
  const care = PHASE_CARE[phase]
  if (mood === "feliz") return care.happy
  if (mood === "incomoda") return care.feels === "frio" ? "Tengo frío… ¿me abrigas?" : "¡Uf, qué calor! ¿Algo fresquito?"
  return MOOD_LINES[mood] ?? care.hello
}

export function levelOf(xp: number) {
  const level = Math.min(LEVELS.length, Math.floor(xp / 12) + 1)
  const base = (level - 1) * 12
  return { level, title: LEVELS[level - 1]!, progress: level === LEVELS.length ? 1 : (xp - base) / 12 }
}

/** Lo que lleva puesto ahora */
export function wornItems(state: CareState, now: number): CareId[] {
  return (Object.entries(state.wearing) as [CareId, number][]).filter(([, until]) => until > now).map(([id]) => id)
}

// ------------------------------------------------------------ almacenamiento
const KEY = "isla-mochi-tamagochi"
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

function load(now: number, phase: Phase): CareState {
  const raw = read(KEY)
  if (raw !== cache.raw) {
    try {
      cache = { raw, state: raw ? (JSON.parse(raw) as CareState) : null }
    } catch {
      cache = { raw, state: null }
    }
  }
  const saved = cache.state
  // Las versiones antiguas del juego no guardaban la estación
  return saved && saved.phase ? saved : newCare(now, phase)
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}

/** El tamagochi, compartido entre pantallas. now se pasa para poder refrescarlo */
export function useCare(phase: Phase, today: string, now: number) {
  useSyncExternalStore(subscribe, () => read(KEY))
  const state = decay(load(now, phase), phase, now)
  const mood = moodOf(state, now)
  return {
    state,
    mood,
    temperament: temperamentOf(phase, mood),
    worn: wornItems(state, now),
    give(id: CareId): CareResult {
      const { state: next, result } = applyCare(load(Date.now(), phase), phase, id, today, Date.now())
      write(KEY, JSON.stringify(next))
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

/** La hora actual, refrescada cada cierto tiempo: así las necesidades van bajando en pantalla */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
