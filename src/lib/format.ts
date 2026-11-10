import { diffDays } from "./cycle.js"

const noon = (date: string) => new Date(`${date}T12:00:00`)

/** "9 de noviembre" */
export function formatDay(date: string) {
  return noon(date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
}

/** "marzo de 2024" */
export function formatMonth(date: string) {
  return noon(date).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
}

/** "en 3 días", "mañana", "hoy" */
export function formatInDays(days: number) {
  if (days <= 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days} días`
}

/** Un número que cambia cada día: sirve para elegir la variante de un texto */
export function daySeed(date: string) {
  return diffDays("2020-01-01", date)
}

export function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid"
}
