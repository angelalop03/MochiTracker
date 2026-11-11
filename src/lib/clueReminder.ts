// Recordatorio opcional para volver a importar desde Clue. Exportar desde el móvil es
// engorroso, así que se pregunta poco y se puede apagar. Es una preferencia del dispositivo.

import { useSyncExternalStore } from "react"
import { diffDays } from "./cycle"

export type ClueEvery = "off" | "3" | "6"

const EVERY_KEY = "isla-mochi-clue-cada"
const SINCE_KEY = "isla-mochi-clue-desde"
const EVENT = "isla-mochi-clue"
const DAYS: Record<Exclude<ClueEvery, "off">, number> = { "3": 91, "6": 182 }

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento, se vuelve a preguntar la próxima vez
  }
  window.dispatchEvent(new Event(EVENT))
}

export function getClueEvery(): ClueEvery {
  const saved = read(EVERY_KEY)
  return saved === "off" || saved === "6" ? saved : "3"
}

export function setClueEvery(every: ClueEvery) {
  write(EVERY_KEY, every)
}

/** Tras importar o al decir «Ahora no»: se vuelve a contar desde hoy */
export function markClueDone(today: string) {
  write(SINCE_KEY, today)
}

/** true si toca sugerir una nueva importación. Solo a quien ya importó de Clue */
export function isClueDue(today: string, usesClue: boolean): boolean {
  const every = getClueEvery()
  if (!usesClue || every === "off") return false
  const since = read(SINCE_KEY)
  if (!since) {
    // Primera vez en este dispositivo: empieza a contar ahora, sin molestar
    markClueDone(today)
    return false
  }
  return diffDays(since, today) >= DAYS[every]
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/** Para que la tarjeta desaparezca al momento al decir que no */
export function useClueReminder(today: string, usesClue: boolean) {
  const due = useSyncExternalStore(subscribe, () => isClueDue(today, usesClue))
  const every = useSyncExternalStore(subscribe, getClueEvery)
  return { due, every }
}
