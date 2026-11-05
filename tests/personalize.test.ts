import { describe, expect, it } from "vitest"
import { addDays } from "../src/lib/cycle"
import { findPattern, personalize, type LogEntry } from "../src/lib/personalize"

const settings = { avgCycleLength: 28, avgPeriodLength: 5 }
const TODAY = "2026-10-22" // día 22 de un ciclo empezado el 1: fase lútea
const periods = [{ start_date: "2026-10-01" }]

const log = (date: string, patch: Partial<LogEntry> = {}): LogEntry => ({
  date,
  symptoms: [],
  mood: null,
  energy: null,
  ...patch,
})

const run = (logs: LogEntry[], phase: "lutea" | "menstrual" = "lutea") =>
  personalize({ phase, today: TODAY, logs, periods, settings, seed: 0 })

describe("reglas", () => {
  it("sin registros no hay consejos ni aviso", () => {
    expect(run([])).toEqual({ tips: [], alarm: false })
  })

  it("cansancio varios días en lútea muestra los consejos de energía de esa fase", () => {
    const { tips } = run([
      log("2026-10-20", { symptoms: ["cansancio"] }),
      log("2026-10-22", { symptoms: ["cansancio"] }),
    ])
    const movement = tips.find((t) => t.block === "movimiento")
    expect(movement?.source).toBe("energia_movimiento")
    expect(movement?.text).toMatch(/en esta fase es muy habitual/)
    expect(tips.find((t) => t.block === "comida")?.source).toBe("energia_comida")
  })

  it("un solo día no basta", () => {
    expect(run([log("2026-10-22", { symptoms: ["cansancio"] })]).tips).toEqual([])
  })

  it("los días antiguos no cuentan", () => {
    const { tips } = run([
      log("2026-10-10", { symptoms: ["cansancio"] }),
      log("2026-10-17", { symptoms: ["cansancio"] }),
      log("2026-10-22", { symptoms: ["cansancio"] }),
    ])
    expect(tips).toEqual([])
  })

  it("la energía baja cuenta igual que el cansancio", () => {
    const { tips } = run([log("2026-10-21", { energy: 2 }), log("2026-10-22", { energy: 1 })])
    expect(tips.map((t) => t.source)).toContain("energia_movimiento")
  })

  it("el ánimo bajo activa el bloque de emociones con el texto de la fase", () => {
    const { tips } = run([log("2026-10-21", { mood: "triste" }), log("2026-10-22", { mood: "irritable" })])
    expect(tips[0]).toMatchObject({ block: "emociones", source: "animo_bajo" })
    expect(tips[0]?.text).toMatch(/en esta fase es frecuente/)
  })

  it("un ánimo bueno no activa nada", () => {
    expect(run([log("2026-10-21", { mood: "bien" }), log("2026-10-22", { mood: "genial" })]).tips).toEqual([])
  })

  it("usa el texto general si la fase no tiene uno propio", () => {
    const { tips } = run([
      log("2026-10-21", { symptoms: ["calambres"] }),
      log("2026-10-22", { symptoms: ["dolor_lumbar"] }),
    ])
    expect(tips[0]?.text).toMatch(/calor local/)
  })

  it("da como mucho un consejo por bloque", () => {
    const symptoms = ["hinchazon", "antojos", "cansancio"]
    const { tips } = run([log("2026-10-21", { symptoms }), log("2026-10-22", { symptoms })])
    expect(tips.filter((t) => t.block === "comida")).toHaveLength(1)
  })
})

describe("aviso de consultar", () => {
  it("salta con un solo día de síntoma de alarma", () => {
    expect(run([log("2026-10-22", { symptoms: ["dolor_fuerte"] })]).alarm).toBe(true)
    expect(run([log("2026-10-21", { symptoms: ["sangrado_abundante"] })]).alarm).toBe(true)
  })

  it("deja de mostrarse pasados unos días", () => {
    expect(run([log("2026-10-19", { symptoms: ["dolor_fuerte"] })]).alarm).toBe(false)
  })
})

describe("patrones de ciclos anteriores", () => {
  const history = [{ start_date: "2026-08-01" }, { start_date: "2026-08-29" }, { start_date: "2026-09-26" }]
  const today = "2026-10-18" // día 23 del ciclo actual: lútea
  // Día 23 de cada ciclo anterior
  const inLuteal = (start: string, symptoms: string[]) => log(addDays(start, 22), { symptoms })

  it("detecta un síntoma que se repite en la misma fase de 2 ciclos", () => {
    const logs = [inLuteal("2026-08-01", ["granitos"]), inLuteal("2026-08-29", ["granitos"])]
    expect(findPattern("lutea", today, logs, history, settings)).toBe("granitos")
  })

  it("no cuenta dos días del mismo ciclo como dos ciclos", () => {
    const logs = [inLuteal("2026-08-01", ["granitos"]), log("2026-08-25", { symptoms: ["granitos"] })]
    expect(findPattern("lutea", today, logs, history, settings)).toBeNull()
  })

  it("no mezcla fases distintas", () => {
    const logs = [log("2026-08-02", { symptoms: ["granitos"] }), log("2026-08-30", { symptoms: ["granitos"] })]
    expect(findPattern("lutea", today, logs, history, settings)).toBeNull()
    expect(findPattern("menstrual", today, logs, history, settings)).toBe("granitos")
  })

  it("ignora el ciclo actual", () => {
    const logs = [inLuteal("2026-08-01", ["granitos"]), log("2026-10-17", { symptoms: ["granitos"] })]
    expect(findPattern("lutea", today, logs, history, settings)).toBeNull()
  })

  it("aparece como consejo en el bloque Cuerpo", () => {
    const logs = [inLuteal("2026-08-01", ["granitos"]), inLuteal("2026-08-29", ["granitos"])]
    const { tips } = personalize({ phase: "lutea", today, logs, periods: history, settings, seed: 0 })
    expect(tips).toHaveLength(1)
    expect(tips[0]).toMatchObject({ block: "cuerpo", source: "patron" })
    expect(tips[0]?.text).toContain("granitos")
  })
})
