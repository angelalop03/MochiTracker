// Valida el «Sí, hoy» que llega desde la notificación. Sin red: se puede probar.

import { addDays } from "../../src/lib/cycle.js"
import { periodToken, sameSecret } from "./server.js"

const DATE = /^\d{4}-\d{2}-\d{2}$/
/** Días que vale el botón después de enviar el aviso */
export const CHECK_VALID_DAYS = 3

export type PeriodRequest = { ok: true; userId: string; day: string } | { ok: false; status: number; error: string }

/**
 * u: usuaria, d: día del aviso, t: firma, day: el día de hoy en el móvil de quien pulsa.
 * Solo se acepta un día entre el del aviso y unos pocos días después, y nunca en el futuro.
 */
export function parsePeriodRequest(body: unknown, secret: string, now: Date): PeriodRequest {
  const { u, d, t, day } = (body ?? {}) as Record<string, unknown>
  if (typeof u !== "string" || typeof d !== "string" || typeof t !== "string" || typeof day !== "string") {
    return { ok: false, status: 400, error: "Faltan datos" }
  }
  if (!DATE.test(d) || !DATE.test(day)) return { ok: false, status: 400, error: "Fecha no válida" }
  if (!sameSecret(t, periodToken(u, d, secret))) return { ok: false, status: 401, error: "No autorizado" }

  // Margen de un día por las zonas horarias
  const tomorrow = addDays(now.toISOString().slice(0, 10), 1)
  if (day < d || day > addDays(d, CHECK_VALID_DAYS) || day > tomorrow) {
    return { ok: false, status: 410, error: "El aviso ha caducado" }
  }
  return { ok: true, userId: u, day }
}
