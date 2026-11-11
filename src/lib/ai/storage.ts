// Los últimos consejos y la conversación con Mochi se quedan en este dispositivo.
// El servidor no guarda ninguna conversación.

import type { AiAdvice } from "./advice"
import type { ChatTurn } from "./cloud"

const CACHE = "isla-mochi-ia-consejos"
const CHAT = "isla-mochi-chat"
/** Mensajes que se guardan en el dispositivo */
const CHAT_KEEP = 40

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

/** Borra los consejos guardados y la conversación (al cerrar sesión o desactivar la IA) */
export function clearAiAdvice() {
  write(CACHE, null)
  write(CHAT, null)
}

export function loadChat(): ChatTurn[] {
  try {
    const saved = JSON.parse(read(CHAT) ?? "[]") as ChatTurn[]
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function saveChat(turns: ChatTurn[]) {
  write(CHAT, turns.length ? JSON.stringify(turns.slice(-CHAT_KEEP)) : null)
}
