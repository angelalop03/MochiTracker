import { describe, expect, it } from "vitest"
import {
  addDays,
  cycleLengths,
  diffDays,
  estimateCycle,
  getCycleState,
  phaseForDay,
  phaseRanges,
  todayInTimeZone,
  type CycleState,
  type PeriodRecord,
} from "../src/lib/cycle"

const settings = { avgCycleLength: 28, avgPeriodLength: 5 }
const starts = (...dates: string[]): PeriodRecord[] => dates.map((start_date) => ({ start_date }))

function known(state: CycleState) {
  if (state.status === "no_data") throw new Error("se esperaban datos")
  return state
}

describe("fechas", () => {
  it("cuenta días cruzando meses, años bisiestos y cambios de hora", () => {
    expect(diffDays("2026-01-31", "2026-03-01")).toBe(29)
    expect(diffDays("2024-02-28", "2024-03-01")).toBe(2)
    expect(diffDays("2026-03-28", "2026-03-30")).toBe(2) // cambio de hora en España
    expect(diffDays("2026-10-24", "2026-10-26")).toBe(2)
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02")
  })

  it("rechaza fechas imposibles", () => {
    expect(() => diffDays("2026-02-30", "2026-03-01")).toThrow()
    expect(() => addDays("ayer", 1)).toThrow()
  })

  it("calcula hoy según la zona horaria de la usuaria", () => {
    const now = new Date("2026-06-15T23:30:00Z")
    expect(todayInTimeZone("Europe/Madrid", now)).toBe("2026-06-16")
    expect(todayInTimeZone("America/Mexico_City", now)).toBe("2026-06-15")
  })
})

describe("phaseRanges", () => {
  it("reparte un ciclo de 28 días con regla de 5", () => {
    expect(phaseRanges(28, 5)).toEqual([
      { phase: "menstrual", startDay: 1, endDay: 5 },
      { phase: "folicular", startDay: 6, endDay: 12 },
      { phase: "ovulatoria", startDay: 13, endDay: 15 },
      { phase: "lutea", startDay: 16, endDay: 28 },
    ])
  })

  it("mueve la ovulación con ciclos largos", () => {
    expect(phaseRanges(35, 5).find((r) => r.phase === "ovulatoria")).toMatchObject({
      startDay: 20,
      endDay: 22,
    })
  })

  it("ciclo corto con regla larga: la ovulación no se solapa con la regla", () => {
    const ranges = phaseRanges(21, 7)
    expect(ranges.map((r) => r.phase)).toEqual(["menstrual", "ovulatoria", "lutea"])
    expect(ranges.find((r) => r.phase === "ovulatoria")).toMatchObject({ startDay: 8, endDay: 8 })
  })

  it.each([
    [15, 1],
    [15, 15],
    [21, 7],
    [28, 5],
    [35, 8],
    [90, 15],
  ])("cubre cada día sin huecos ni solapes (%i, %i)", (cycle, period) => {
    const ranges = phaseRanges(cycle, period)
    expect(ranges[0]?.startDay).toBe(1)
    expect(ranges[ranges.length - 1]?.endDay).toBe(cycle)
    ranges.slice(1).forEach((r, i) => expect(r.startDay).toBe(ranges[i]!.endDay + 1))
  })

  it("phaseForDay encuentra la fase y se queda en la última si se pasa", () => {
    const ranges = phaseRanges(28, 5)
    expect(phaseForDay(1, ranges)).toBe("menstrual")
    expect(phaseForDay(6, ranges)).toBe("folicular")
    expect(phaseForDay(14, ranges)).toBe("ovulatoria")
    expect(phaseForDay(28, ranges)).toBe("lutea")
    expect(phaseForDay(40, ranges)).toBe("lutea")
  })
})

describe("estimateCycle", () => {
  it("usa los datos de la usuaria con menos de 3 ciclos completos", () => {
    const estimate = estimateCycle(starts("2026-01-01", "2026-01-31", "2026-03-02"), settings)
    expect(estimate).toMatchObject({ cycleLength: 28, lengthSource: "user", completedCycles: 2 })
  })

  it("recalcula la media a partir de 3 ciclos completos", () => {
    const estimate = estimateCycle(
      starts("2026-01-01", "2026-01-31", "2026-03-02", "2026-04-01"),
      settings
    )
    expect(estimate).toMatchObject({ cycleLength: 30, lengthSource: "history", completedCycles: 3 })
  })

  it("usa solo los últimos 6 ciclos", () => {
    const dates = ["2025-01-01"]
    // 3 ciclos antiguos de 40 días y 6 recientes de 26
    for (let i = 0; i < 3; i++) dates.push(addDays(dates[dates.length - 1]!, 40))
    for (let i = 0; i < 6; i++) dates.push(addDays(dates[dates.length - 1]!, 26))
    expect(estimateCycle(starts(...dates), settings).cycleLength).toBe(26)
  })

  it("media de la regla calculada solo si hay fechas de fin suficientes", () => {
    const withEnds: PeriodRecord[] = [
      { start_date: "2026-01-01", end_date: "2026-01-04" },
      { start_date: "2026-01-29", end_date: "2026-02-01" },
      { start_date: "2026-02-26", end_date: "2026-03-01" },
    ]
    expect(estimateCycle(withEnds, settings).periodLength).toBe(4)
    expect(estimateCycle(withEnds.slice(0, 2), settings).periodLength).toBe(5)
  })

  it("ignora huecos imposibles, que suelen ser reglas sin registrar", () => {
    expect(cycleLengths(starts("2025-01-01", "2025-01-29", "2026-01-01", "2026-01-29"))).toEqual([28, 28])
  })

  it("no cuenta dos veces una regla repetida", () => {
    expect(cycleLengths(starts("2026-01-01", "2026-01-01", "2026-01-29"))).toEqual([28])
  })

  it("marca como irregular solo si la variación pasa de 7 días", () => {
    const regular = starts("2026-01-01", "2026-01-27", "2026-02-26", "2026-03-27")
    expect(estimateCycle(regular, settings).irregular).toBe(false)
    const irregular = starts("2026-01-01", "2026-01-23", "2026-03-01", "2026-03-28")
    expect(estimateCycle(irregular, settings).irregular).toBe(true)
  })
})

describe("getCycleState", () => {
  const periods = starts("2026-10-01")

  it("sin reglas devuelve no_data", () => {
    expect(getCycleState([], settings, "2026-10-10").status).toBe("no_data")
  })

  it("el primer día de regla es el día 1", () => {
    expect(known(getCycleState(periods, settings, "2026-10-01"))).toMatchObject({
      status: "ok",
      cycleDay: 1,
      phase: "menstrual",
      nextPhase: { phase: "folicular", date: "2026-10-06", inDays: 5 },
      nextPeriodDate: "2026-10-29",
    })
  })

  it("calcula cada fase y la siguiente", () => {
    const at = (date: string) => known(getCycleState(periods, settings, date))
    expect(at("2026-10-08")).toMatchObject({ cycleDay: 8, phase: "folicular" })
    expect(at("2026-10-14")).toMatchObject({ cycleDay: 14, phase: "ovulatoria" })
    expect(at("2026-10-20").phase).toBe("lutea")
  })

  it("el último día del ciclo anuncia la regla siguiente", () => {
    expect(known(getCycleState(periods, settings, "2026-10-28"))).toMatchObject({
      status: "ok",
      cycleDay: 28,
      nextPhase: { phase: "menstrual", date: "2026-10-29", inDays: 1 },
    })
  })

  it("con retraso no inventa fechas", () => {
    expect(known(getCycleState(periods, settings, "2026-11-02"))).toMatchObject({
      status: "late",
      cycleDay: 33,
      daysLate: 5,
      phase: "lutea",
      nextPhase: null,
      nextPeriodDate: null,
    })
  })

  it("con muchísimo retraso pide actualizar los datos", () => {
    expect(known(getCycleState(periods, settings, "2026-12-15")).status).toBe("stale")
  })

  it("usa la regla más reciente aunque lleguen desordenadas", () => {
    const state = known(getCycleState(starts("2026-10-01", "2026-09-03"), settings, "2026-10-02"))
    expect(state).toMatchObject({ cycleStart: "2026-10-01", cycleDay: 2 })
  })

  it("ignora una regla con fecha futura", () => {
    const state = known(getCycleState(starts("2026-09-20", "2026-10-30"), settings, "2026-10-01"))
    expect(state).toMatchObject({ cycleStart: "2026-09-20", cycleDay: 12 })
  })

  it("solo con una regla futura no hay datos", () => {
    expect(getCycleState(starts("2026-10-30"), settings, "2026-10-01").status).toBe("no_data")
  })

  it("avisa de ciclos irregulares aunque el estado sea ok", () => {
    const state = known(
      getCycleState(starts("2026-01-01", "2026-01-23", "2026-03-01", "2026-03-28"), settings, "2026-04-01")
    )
    expect(state.status).toBe("ok")
    expect(state.estimate.irregular).toBe(true)
  })
})
