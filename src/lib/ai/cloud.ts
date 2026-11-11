// La IA en la nube, vista desde el navegador. Solo envía la sesión (y el chat): el contexto lo
// calcula el servidor con los datos de la usuaria. La clave del proveedor nunca llega aquí.
// En el modo demo de desarrollo no hay servidor, así que se simula.

import { readDemo, writeDemo } from "../../services/demo"
import { updateProfile } from "../../services/data"
import { DEMO, supabase } from "../../services/supabase"
import type { AiAdvice } from "./advice"

export interface Quota {
  used: number
  limit: number
  remaining: number
}

export interface AiStatus {
  available: boolean
  consent: boolean
  chat: Quota
  advice: Quota
  /** Día en que se renuevan los cupos */
  resetsOn: string
  pausedUntil: string | null
}

export type AiFailureReason =
  | "unavailable"
  | "consent"
  | "no_data"
  | "invalid"
  | "failed"
  | "user_limit"
  | "global_limit"
  | "paused"
  | "network"

export class AiRequestError extends Error {
  constructor(
    public reason: AiFailureReason,
    public status: AiStatus | null
  ) {
    super(`IA: ${reason}`)
  }
}

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  if (!supabase) throw new AiRequestError("unavailable", null)
  const { data } = await supabase.auth.getSession()
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}`, "Content-Type": "application/json" },
    })
  } catch {
    throw new AiRequestError("network", null)
  }
  const body = (await response.json().catch(() => null)) as (T & { reason?: AiFailureReason; status?: AiStatus }) | null
  if (!response.ok || !body) throw new AiRequestError(body?.reason ?? "failed", body?.status ?? null)
  return body
}

// --------------------------------------------------------- modo demo
const DEMO_KEY = "isla-mochi-demo-ia"
const demoDay = () => new Date().toISOString().slice(0, 10)

function demoUsage() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DEMO_KEY) ?? "null") as { day: string; chat: number; advice: number } | null
    return saved?.day === demoDay() ? saved : { day: demoDay(), chat: 0, advice: 0 }
  } catch {
    return { day: demoDay(), chat: 0, advice: 0 }
  }
}

function demoStatus(): AiStatus {
  const used = demoUsage()
  const q = (n: number, limit: number) => ({ used: n, limit, remaining: Math.max(0, limit - n) })
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  return {
    available: true,
    consent: Boolean(readDemo().profile.ai_consent_at),
    chat: q(used.chat, 5),
    advice: q(used.advice, 1),
    resetsOn: tomorrow,
    pausedUntil: null,
  }
}

async function demoSpend(kind: "chat" | "advice") {
  const status = demoStatus()
  if (!status.consent) throw new AiRequestError("consent", status)
  if (status[kind].remaining <= 0) throw new AiRequestError("user_limit", status)
  const used = demoUsage()
  used[kind]++
  sessionStorage.setItem(DEMO_KEY, JSON.stringify(used))
  await new Promise((r) => setTimeout(r, 900))
  return demoStatus()
}

const DEMO_ADVICE: AiAdvice = {
  emociones: "Estos días puede que estés más sensible; date permiso para ir más despacio y pedir espacio si lo necesitas.",
  energia: "Con el cansancio que llevas, deja lo más exigente para la mañana y guarda un rato para descansar por la tarde.",
  cuerpo: "Si notas la tripa hinchada, un paseo corto después de comer y algo menos de sal pueden aliviarte.",
  piel: "Limpia la piel con suavidad mañana y noche y no toques los granitos de la barbilla: así no dejan marca.",
  comida: "Una cena templada con legumbres, verdura y un puñado de frutos secos te dejará saciada y con magnesio.",
  movimiento: "Hoy encaja mejor un paseo tranquilo o unos estiramientos suaves que un entreno intenso.",
}

// ------------------------------------------------------------------ API

export async function fetchAiStatus(): Promise<AiStatus> {
  if (DEMO) return demoStatus()
  return call<AiStatus>("/api/ai/status", { method: "GET" })
}

export async function requestAdvice(): Promise<{ advice: AiAdvice; status: AiStatus }> {
  if (DEMO) return { advice: DEMO_ADVICE, status: await demoSpend("advice") }
  return call("/api/ai/advice", { method: "POST", body: "{}" })
}

export async function sendChat(message: string, history: ChatTurn[]): Promise<{ reply: string; status: AiStatus }> {
  if (DEMO) {
    const status = await demoSpend("chat")
    return {
      status,
      reply:
        "En la fase lútea es muy habitual notar más cansancio. Prueba a acostarte un poco antes y a cenar algo templado con legumbres o huevo. Si el cansancio es muy fuerte o no mejora, coméntalo con un profesional.",
    }
  }
  return call("/api/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) })
}

/** Consentimiento explícito para enviar sus datos al proveedor de IA. Se guarda en su perfil */
export async function setAiConsent(userId: string, on: boolean) {
  const ai_consent_at = on ? new Date().toISOString() : null
  if (DEMO) {
    writeDemo({ profile: { ...readDemo().profile, ai_consent_at } })
    return
  }
  await updateProfile(userId, { ai_consent_at })
}
