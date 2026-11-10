// Resumen de cada fase para entenderla de un vistazo. Es lo habitual, no una medida:
// cada cuerpo va a su ritmo.

import type { Phase } from "../lib/cycle.js"

export interface Glance {
  /** Energía habitual, de 1 a 4 */
  energyLevel: 1 | 2 | 3 | 4
  energy: string
  skin: string
  mood: string
}

export const PHASE_GLANCE: Record<Phase, Glance> = {
  menstrual: { energyLevel: 1, energy: "Baja", skin: "Más seca", mood: "Introspectiva" },
  folicular: { energyLevel: 3, energy: "Subiendo", skin: "Luminosa", mood: "Optimista" },
  ovulatoria: { energyLevel: 4, energy: "En su punto", skin: "Radiante", mood: "Sociable" },
  lutea: { energyLevel: 2, energy: "Bajando", skin: "Más grasa", mood: "Sensible" },
}
