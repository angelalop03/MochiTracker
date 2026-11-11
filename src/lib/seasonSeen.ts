// La última estación que vio en este dispositivo, para darle la bienvenida cuando cambia

import type { Phase } from "./cycle"

const KEY = "isla-mochi-estacion"

export function lastSeenSeason(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function markSeasonSeen(phase: Phase) {
  try {
    localStorage.setItem(KEY, phase)
  } catch {
    // Sin almacenamiento no hay bienvenida: no pasa nada
  }
}

/** true si hay que celebrar la llegada de esta estación. La primera vez solo se apunta */
export function isNewSeason(phase: Phase): boolean {
  const last = lastSeenSeason()
  if (last === null) {
    markSeasonSeen(phase)
    return false
  }
  return last !== phase
}
