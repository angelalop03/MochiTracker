// La preferencia y el último resultado se quedan en este dispositivo: nunca van a la nube.

import type { AiAdvice } from "./advice"

const ENABLED = "isla-mochi-ia"
const CACHE = "isla-mochi-ia-consejos"

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
    // Sin almacenamiento, la IA sigue funcionando pero no recuerda nada
  }
}

export const isAiEnabled = () => read(ENABLED) === "1"

export function setAiEnabled(on: boolean) {
  write(ENABLED, on ? "1" : null)
  if (!on) clearAiAdvice()
}

/** Consejos ya generados para esta misma situación: evita cargar el modelo otra vez */
export function cachedAdvice(key: string): AiAdvice | null {
  try {
    const saved = JSON.parse(read(CACHE) ?? "null") as { key: string; advice: AiAdvice } | null
    return saved?.key === key ? saved.advice : null
  } catch {
    return null
  }
}

export function cacheAdvice(key: string, advice: AiAdvice) {
  write(CACHE, JSON.stringify({ key, advice }))
}

export function clearAiAdvice() {
  write(CACHE, null)
}
