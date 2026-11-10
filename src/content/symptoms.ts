// Opciones del registro diario. Sin dependencias: lo usan la web y las reglas de personalización.

export const SYMPTOMS = [
  { id: "cansancio", label: "Cansancio" },
  { id: "calambres", label: "Calambres" },
  { id: "dolor_lumbar", label: "Dolor lumbar" },
  { id: "dolor_cabeza", label: "Dolor de cabeza" },
  { id: "hinchazon", label: "Hinchazón" },
  { id: "pecho_sensible", label: "Pecho sensible" },
  { id: "granitos", label: "Granitos" },
  { id: "piel_grasa", label: "Piel grasa" },
  { id: "antojos", label: "Antojos" },
  { id: "insomnio", label: "Dormir mal" },
  { id: "nauseas", label: "Náuseas" },
  { id: "dolor_fuerte", label: "Dolor muy fuerte" },
  { id: "sangrado_abundante", label: "Sangrado muy abundante" },
] as const

export type SymptomId = (typeof SYMPTOMS)[number]["id"]

/** Registrar uno de estos muestra el aviso de consultar con un profesional */
export const ALARM_SYMPTOMS: readonly string[] = ["dolor_fuerte", "sangrado_abundante"]

// Tienen que coincidir con el check de daily_logs.mood en la base de datos
export const MOODS = [
  { id: "genial", label: "Genial" },
  { id: "bien", label: "Bien" },
  { id: "normal", label: "Normal" },
  { id: "sensible", label: "Sensible" },
  { id: "triste", label: "Triste" },
  { id: "irritable", label: "Irritable" },
  { id: "ansiosa", label: "Ansiosa" },
] as const

export type MoodId = (typeof MOODS)[number]["id"]

export const LOW_MOODS: readonly string[] = ["sensible", "triste", "irritable", "ansiosa"]

export const ENERGY_LEVELS = [
  { value: 1, label: "Muy baja" },
  { value: 2, label: "Baja" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Alta" },
  { value: 5, label: "Muy alta" },
] as const

export function symptomLabel(id: string) {
  return SYMPTOMS.find((s) => s.id === id)?.label ?? id
}
