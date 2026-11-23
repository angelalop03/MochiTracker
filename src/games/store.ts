// Récords de los minijuegos; las monedas van al monedero de Mochi. Se guardan en el dispositivo.

import { useSyncExternalStore } from "react"
import { earnCoins } from "../lib/shop"

export type GameId = "isla" | "nubes"

interface Saved {
  best: Partial<Record<GameId, number>>
}

const KEY = "isla-mochi-juegos"
const EVENT = "isla-mochi-juegos"

function read(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    const saved = raw ? (JSON.parse(raw) as Saved) : null
    return { best: saved?.best ?? {} }
  } catch {
    return { best: {} }
  }
}

let cache: { raw: string | null; value: Saved } = { raw: null, value: { best: {} } }

function currentRaw() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function snapshot(): Saved {
  const raw = currentRaw()
  if (raw !== cache.raw) cache = { raw, value: read() }
  return cache.value
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/** Apunta una partida y guarda sus monedas. Devuelve si es récord */
export function recordGame(game: GameId, score: number, coins: number): boolean {
  // Antes de reescribir los récords: las estrellas antiguas pasan al monedero
  earnCoins(coins)
  const saved = read()
  const record = score > (saved.best[game] ?? 0)
  const next: Saved = { best: { ...saved.best, [game]: Math.max(score, saved.best[game] ?? 0) } }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Sin almacenamiento no se guardan los récords
  }
  window.dispatchEvent(new Event(EVENT))
  return record
}

export function useGames() {
  return useSyncExternalStore(subscribe, snapshot)
}
