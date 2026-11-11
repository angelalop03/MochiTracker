// El minitutorial se enseña una vez a quien acaba de empezar. Se recuerda en el dispositivo.

const KEY = "isla-mochi-tutorial"
/** Solo se muestra solo durante las primeras semanas: a quien ya usaba la app no le salta */
const NEW_USER_DAYS = 14

export function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === "visto"
  } catch {
    return true
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(KEY, "visto")
  } catch {
    // Sin almacenamiento, puede volver a salir la próxima vez
  }
}

export function shouldShowTutorial(onboardedAt: string | null, now = Date.now()): boolean {
  if (!onboardedAt || tutorialSeen()) return false
  return now - Date.parse(onboardedAt) < NEW_USER_DAYS * 86_400_000
}
