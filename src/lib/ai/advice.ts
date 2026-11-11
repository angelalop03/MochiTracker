// Tipos y validación de lo que escribe la IA. Lo usa el servidor antes de devolver nada:
// todo consejo se comprueba antes de mostrarse, y si no pasa se quedan los de las reglas.

import type { BlockId } from "../../content/phases.js"
import type { Phase } from "../cycle.js"

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
