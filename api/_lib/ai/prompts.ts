// Qué se le pide a la IA y cómo se comprueba lo que devuelve antes de enseñarlo.

import { BLOCK_GUIDES } from "../../../src/content/guides.js"
import { BLOCKS, type BlockId } from "../../../src/content/phases.js"
import { cleanReply, validateReply, type AiAdvice } from "../../../src/lib/ai/advice.js"
import type { AiContext } from "./context.js"
import { describeContext } from "./context.js"
import type { AiMessage } from "./provider.js"

const RULES = `Eres Mochi, una amiga cercana y cálida dentro de la app Isla Mochi, una guía del ciclo menstrual.
Escribes en español de España, en femenino y tuteando, con frases sencillas.
Es contenido orientativo: nunca diagnostiques, no nombres enfermedades, no recomiendes medicamentos ni dosis, no hables de dietas para adelgazar.
La app no sirve como anticonceptivo ni para buscar un embarazo: no des consejos sobre fertilidad o días seguros.
Si algo suena preocupante (dolor muy fuerte, sangrado muy abundante, mareos, fiebre, mucho tiempo sin regla), recomienda consultar con un profesional sanitario.
No inventes datos que no tienes. Usa lo que sabes de ella solo si viene al caso.`

const ADVICE_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(BLOCKS.map((b) => [b.id, { type: "string" }])),
  required: BLOCKS.map((b) => b.id),
  additionalProperties: false,
}

export function adviceMessages(ctx: AiContext): AiMessage[] {
  const guides = BLOCKS.map((b) => {
    const g = BLOCK_GUIDES[ctx.phase][b.id]
    return `- ${b.id} (${b.title}): ${g.headline}. Pautas: ${g.tips.map((t) => `${t.title}: ${t.text}`).join(" ")}`
  }).join("\n")

  return [
    { role: "system", content: RULES },
    {
      role: "user",
      content: `Esto es lo que sabes de ella:
${describeContext(ctx)}

Pautas revisadas para su fase, de las que tienes que partir:
${guides}

Escribe un consejo para cada tema (${BLOCKS.map((b) => b.id).join(", ")}), adaptado a cómo está ella.
Cada consejo: una o dos frases, entre 60 y 200 caracteres, concreto y práctico. No saludes ni repitas su día del ciclo.
Si está cansada o con poca energía, nunca le propongas esfuerzos intensos.
Responde solo con un JSON con esas seis claves.`,
    },
  ]
}

export const adviceJson = { name: "consejos", schema: ADVICE_SCHEMA }

/** Los consejos que pasan todas las comprobaciones. Los demás se quedan con las reglas */
export function parseAdvice(text: string, ctx: AiContext): AiAdvice | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || typeof data !== "object") return null
  const advice: AiAdvice = {}
  for (const { id } of BLOCKS) {
    const value = (data as Record<string, unknown>)[id]
    if (typeof value !== "string") continue
    const clean = validateReply(value, ctx.recent)
    if (clean) advice[id as BlockId] = clean
  }
  return Object.keys(advice).length > 0 ? advice : null
}

// ------------------------------------------------------------------- chat

export const CHAT_MAX_MESSAGE = 500
/** Mensajes anteriores que se envían para mantener el hilo */
export const CHAT_HISTORY = 8

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

// Ante esto no se llama a la IA: se responde con ayuda inmediata
const CRISIS = /suicid|quitarme la vida|matarme|no quiero vivir|hacerme da[ñn]o|autolesi|cortarme/i

export const CRISIS_REPLY =
  "Siento mucho que estés pasando por esto. No estás sola: si piensas en hacerte daño, llama ahora al 024 (atención a la conducta suicida, gratis y a cualquier hora) o al 112 si es urgente. Hablar con alguien de confianza también ayuda."

export function isCrisis(message: string) {
  return CRISIS.test(message)
}

export function chatMessages(ctx: AiContext | null, history: ChatTurn[], message: string): AiMessage[] {
  const about = ctx
    ? `Esto es lo que sabes de ella (úsalo solo si viene al caso):\n${describeContext(ctx)}`
    : "Aún no tiene datos de ciclo en la app."
  return [
    {
      role: "system",
      content: `${RULES}
Respondes preguntas sobre el ciclo, cómo se siente, comida, descanso, movimiento, piel y bienestar.
Si te preguntan algo que no tiene que ver, redirige con amabilidad. Respuestas breves: como mucho 120 palabras, sin listas largas.
${about}`,
    },
    ...history.slice(-CHAT_HISTORY).map((t) => ({ role: t.role, content: t.content.slice(0, 1000) })),
    { role: "user", content: message },
  ]
}

const DOSAGE = /\d+\s?(mg|ml|gr?)\b|\bcada \d+ horas\b/i
const CHAT_FALLBACK =
  "Prefiero no responder a eso sin que lo vea un profesional sanitario. Si te preocupa, consúltalo con tu médica o en tu centro de salud."

/** Limpia la respuesta del chat y la cambia por una prudente si da dosis o se va de largo */
export function checkChatReply(text: string) {
  const clean = cleanReply(text)
  if (!clean) return null
  if (DOSAGE.test(clean)) return CHAT_FALLBACK
  return clean.length > 1200 ? `${clean.slice(0, 1200).replace(/\s+\S*$/, "")}…` : clean
}
