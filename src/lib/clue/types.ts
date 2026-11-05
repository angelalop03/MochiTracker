import { formatMonth } from "../format"

/** Lo único que se guarda de Clue: fechas de regla y, si existen, síntomas por día */
export interface ImportResult {
  periods: { start_date: string; end_date: string | null }[]
  logs: { date: string; symptoms: string[] }[]
}

export type ClueErrorCode = "password_needed" | "wrong_password" | "not_clue" | "empty" | "too_big"

export class ClueImportError extends Error {
  code: ClueErrorCode
  constructor(code: ClueErrorCode) {
    super(code)
    this.name = "ClueImportError"
    this.code = code
  }
}

export const CLUE_ERROR_MESSAGES: Record<ClueErrorCode, string> = {
  password_needed: "Este archivo tiene contraseña. Escribe la que te mostró Clue al pedir tus datos.",
  wrong_password: "La contraseña no es correcta. Revísala: es la que apareció en Clue al pedir tus datos.",
  not_clue: "Este archivo no parece una exportación de Clue. Sube el ZIP que te enviaron o el JSON que contiene.",
  empty: "El archivo está vacío: no hemos encontrado ninguna regla.",
  too_big: "El archivo es demasiado grande. Comprueba que es el de Clue.",
}

export interface ImportSummary {
  cycles: number
  since: string
  symptomDays: number
  text: string
}

export function summarizeImport(result: ImportResult): ImportSummary {
  if (result.periods.length === 0) throw new ClueImportError("empty")
  const since = result.periods.map((p) => p.start_date).sort()[0]!
  const cycles = result.periods.length
  const symptomDays = result.logs.filter((l) => l.symptoms.length > 0).length

  let text = `Hemos encontrado ${cycles} ${cycles === 1 ? "ciclo" : "ciclos"} desde ${formatMonth(since)}`
  if (symptomDays > 0) text += ` y ${symptomDays} ${symptomDays === 1 ? "día" : "días"} con síntomas`
  return { cycles, since, symptomDays, text: `${text}.` }
}
