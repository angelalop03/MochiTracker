// Prompt y validación de la IA. Módulo puro: no carga el modelo.
//
// Se eligió tras probar 5 modelos reales en español. Los que caben en un móvil daban
// consejos incoherentes o peligrosos, así que el modelo no inventa: adapta un consejo ya
// revisado, bloque a bloque, y todo lo que escribe se valida antes de mostrarlo.

import { PHASE_CONTENT, pickVariant, type BlockId } from "../../content/phases.js"
import { MOODS, symptomLabel } from "../../content/symptoms.js"
import type { Phase } from "../cycle.js"

export const MODEL_ID = "Qwen3-4B-q4f16_1-MLC"
export const MODEL_DOWNLOAD_LABEL = "2,3 GB"

export type AiAdvice = Partial<Record<BlockId, string>>

export interface AiDay {
  date: string
  symptoms: string[]
  mood: string | null
  energy: number | null
}

export interface AiInput {
  phase: Phase
  cycleDay: number
  seed: number
  /** Solo síntomas, ánimo y energía. Las notas personales nunca se usan */
  days: AiDay[]
  /** true si las reglas han detectado señales de alarma */
  alarm: boolean
}

const SYSTEM_PROMPT = `Eres Mochi, una amiga cercana y cálida. Escribes en español de España, en femenino y tuteando.
Adaptas un consejo a cómo está ella hoy, en una sola frase de menos de 25 palabras.
Usa solo lo que dice el consejo y lo que ella ha registrado. No añadas ideas, no saludes y no repitas números.
Es contenido orientativo: nunca diagnostiques ni nombres enfermedades o medicamentos.
Si aparecen señales de alarma, recomienda consultar con un profesional sanitario.

Ejemplo 1
Cómo está: cansancio; energía: 2 de 5
Consejo: Encajan el pilates, el yoga, caminar o la fuerza con cargas moderadas.
Respuesta: Con el cansancio que llevas, hoy te puede sentar bien algo suave, como caminar o hacer yoga.

Ejemplo 2
Cómo está: ánimo: genial
Consejo: Puedes sentirte con más seguridad. Buen momento para conversaciones importantes.
Respuesta: Con ese ánimo tan bueno, aprovecha hoy para esa conversación que tenías pendiente.`

/** Resume lo registrado en una línea. Vacío si no hay nada que adaptar */
export function describeSituation(days: AiDay[]) {
  const symptoms = [...new Set(days.flatMap((d) => d.symptoms))].map((s) => symptomLabel(s).toLowerCase())
  const mood = days.map((d) => d.mood).filter(Boolean).at(-1)
  const energy = days.map((d) => d.energy).filter(Boolean).at(-1)
  return [
    symptoms.length ? `síntomas: ${symptoms.join(", ")}` : null,
    mood ? `ánimo: ${MOODS.find((m) => m.id === mood)?.label.toLowerCase() ?? mood}` : null,
    energy ? `energía: ${energy} de 5` : null,
  ]
    .filter(Boolean)
    .join("; ")
}

/** Sin datos no hay nada que personalizar, y las señales de alarma las gestionan las reglas */
export function shouldUseAi(input: AiInput) {
  return !input.alarm && describeSituation(input.days) !== ""
}

export function buildMessages(input: AiInput, block: BlockId) {
  // Adapta otra variante, para no repetir el consejo base que ya se ve en pantalla
  const tip = pickVariant(PHASE_CONTENT[input.phase].blocks[block], input.seed + 1)
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Cómo está: ${describeSituation(input.days)}\nConsejo: ${tip}\nRespuesta:`,
    },
  ]
}

/** Quita lo que el modelo añade alrededor del consejo */
export function cleanReply(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^\s*(respuesta|consejo)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["«“]|["»”]$/g, "")
    .trim()
}

const MIN_LENGTH = 20
const MAX_LENGTH = 240

// Lo que no debe decir nunca, aunque se lo hayamos pedido en el prompt
const FORBIDDEN =
  /\d\s?mg\b|ibuprofeno|paracetamol|aspirina|antidepres|ansiol[ií]tic|f[aá]rmaco|medicamento|medicaci[oó]n|p[ií]ldora|hormonas? sint|diagn[oó]stic|padeces|endometriosis|ovario poliqu|\bsop\b|c[aá]ncer|tumor|depresi[oó]n cl[ií]nica|embaraz|anticoncep|adelgaz|calor[ií]as|ayuno|dieta estricta|no comas|deja de comer|tienes que acudir a urgencias|se (te )?(ir[aá]n?|pasar[aá]n?)\b|no es nada|stress/i

// Alfabetos que no son latinos, o palabras muy comunes en inglés
const NOT_SPANISH = /[Ѐ-ӿ؀-ۿ぀-鿿가-힯]|\b(the|you|your|and|with|should)\b/i

export function isSafeAdvice(text: string) {
  const clean = text.trim()
  return (
    clean.length >= MIN_LENGTH &&
    clean.length <= MAX_LENGTH &&
    !FORBIDDEN.test(clean) &&
    !NOT_SPANISH.test(clean)
  )
}

const INTENSE = /intens|con ganas|a tope|al m[aá]ximo|con todo|sube (la )?carga|entrena fuerte/i

/** El error más grave de las pruebas: animar a entrenar fuerte a quien lleva días sin energía */
export function fitsSituation(text: string, days: AiDay[]) {
  const tired = days.some(
    (d) => d.symptoms.includes("cansancio") || (d.energy !== null && d.energy <= 2) || d.symptoms.includes("calambres")
  )
  return !(tired && INTENSE.test(text))
}

/** El texto limpio si se puede mostrar, o null para seguir con las reglas */
export function validateReply(text: string, days: AiDay[]) {
  const clean = cleanReply(text)
  return isSafeAdvice(clean) && fitsSituation(clean, days) ? clean : null
}
