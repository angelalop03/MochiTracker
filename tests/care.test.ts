import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CARE_ITEMS, CATEGORIES, PHASE_CARE, STATS, type CareId } from "../src/content/care"
import { applyCare, decay, greeting, levelOf, moodOf, newCare, pokeLine, temperamentOf, wornItems } from "../src/lib/care"
import { PHASES } from "../src/lib/cycle"

const NOW = Date.parse("2026-11-23T10:00:00Z")
const HOUR = 3_600_000
const TODAY = "2026-11-23"

describe("necesidades según la fase", () => {
  it("cada fase empieza como es lo habitual: poca energía en la regla, mucha en la ovulación", () => {
    expect(newCare(NOW, "menstrual").stats.energia).toBeLessThan(newCare(NOW, "folicular").stats.energia)
    expect(newCare(NOW, "ovulatoria").stats.energia).toBeGreaterThan(newCare(NOW, "folicular").stats.energia)
    expect(newCare(NOW, "lutea").stats.animo).toBeLessThan(newCare(NOW, "folicular").stats.animo)
  })

  it("en la regla la energía no pasa de su techo aunque la cuides mucho", () => {
    let state = newCare(NOW, "menstrual")
    for (let i = 0; i < 5; i++) state = applyCare(state, "menstrual", "dormir", TODAY, NOW + i * 60_000).state
    expect(state.stats.energia).toBe(PHASE_CARE.menstrual.cap.energia)
  })

  it("bajan con el tiempo, más rápido el ánimo en otoño que en primavera", () => {
    const start = { ...newCare(NOW, "folicular"), stats: { barriga: 70, energia: 70, animo: 70, confort: 70 } }
    const otono = decay({ ...start, phase: "lutea" }, "lutea", NOW + 5 * HOUR)
    const primavera = decay(start, "folicular", NOW + 5 * HOUR)
    expect(otono.stats.animo).toBeLessThan(primavera.stats.animo)
  })

  it("al cambiar de estación se acercan a lo habitual en la nueva", () => {
    const full = { ...newCare(NOW, "ovulatoria"), stats: { barriga: 90, energia: 95, animo: 90, confort: 80 } }
    const next = decay(full, "menstrual", NOW)
    expect(next.phase).toBe("menstrual")
    expect(next.stats.energia).toBeLessThan(full.stats.energia)
    expect(next.stats.energia).toBeLessThanOrEqual(PHASE_CARE.menstrual.cap.energia)
  })

  it("aunque pasen días, no llegan a cero", () => {
    const late = decay(newCare(NOW, "lutea"), "lutea", NOW + 30 * 24 * HOUR)
    for (const value of Object.values(late.stats)) expect(value).toBeGreaterThanOrEqual(5)
  })
})

describe("cuidados útiles", () => {
  it("lo que mejor sienta en la fase hace más efecto y da más cariño", () => {
    const base = { ...newCare(NOW, "lutea"), stats: { barriga: 40, energia: 40, animo: 40, confort: 40 } }
    const fav = applyCare(base, "lutea", "chocolate", TODAY, NOW)
    const normal = applyCare({ ...base, phase: "folicular" }, "folicular", "chocolate", TODAY, NOW)
    expect(fav.state.stats.animo).toBeGreaterThan(normal.state.stats.animo)
    expect(fav.state.xp).toBe(2)
    expect(normal.state.xp).toBe(1)
  })

  it("al dárselo explica para qué sirve", () => {
    const r = applyCare(newCare(NOW, "menstrual"), "menstrual", "lentejas", TODAY, NOW)
    expect(r.result).toMatchObject({ kind: "ok" })
    expect(r.result.line).toMatch(/hierro/)
  })

  it("rechaza lo que no sienta bien en su fase", () => {
    expect(applyCare(newCare(NOW, "lutea"), "lutea", "cafe", TODAY, NOW).result.line).toMatch(/nerviosa/)
    expect(applyCare(newCare(NOW, "menstrual"), "menstrual", "cardio", TODAY, NOW).result.kind).toBe("refused")
    expect(applyCare(newCare(NOW, "ovulatoria"), "ovulatoria", "manta", TODAY, NOW).result.kind).toBe("refused")
  })

  it("si ya está bien, no hace falta", () => {
    const full = { ...newCare(NOW, "folicular"), stats: { barriga: 100, energia: 100, animo: 100, confort: 100 } }
    expect(applyCare(full, "folicular", "naranja", TODAY, NOW).result.kind).toBe("full")
  })

  it("dormir la duerme un rato y mientras tanto no hace otra cosa", () => {
    const asleep = applyCare(newCare(NOW, "menstrual"), "menstrual", "dormir", TODAY, NOW).state
    expect(moodOf(asleep, NOW + 1000)).toBe("dormida")
    expect(applyCare(asleep, "menstrual", "infusion", TODAY, NOW + 1000).result.kind).toBe("asleep")
    expect(moodOf(asleep, NOW + 60_000)).not.toBe("dormida")
  })

  it("la manta se la pone un rato", () => {
    const state = applyCare(newCare(NOW, "menstrual"), "menstrual", "manta", TODAY, NOW).state
    expect(wornItems(state, NOW + HOUR)).toEqual(["manta"])
    expect(wornItems(state, NOW + 4 * HOUR)).toEqual([])
  })

  it("cada cuidado tiene categoría, efecto, para qué sirve y sprite", () => {
    const categories = new Set(CATEGORIES.map((c) => c.id))
    for (const [id, item] of Object.entries(CARE_ITEMS) as [CareId, (typeof CARE_ITEMS)[CareId]][]) {
      expect(categories.has(item.category), id).toBe(true)
      expect(Object.keys(item.effect).length, id).toBeGreaterThan(0)
      expect(item.say.length, id).toBeGreaterThan(15)
      expect(item.sprite.every((row) => row.length === 12), id).toBe(true)
      expect(item.sprite.length, id).toBeLessThanOrEqual(12)
    }
  })

  it("todos los cuidados se ven en el Mochi 3D", () => {
    const source = readFileSync("src/three/CareItems.tsx", "utf8")
    for (const id of Object.keys(CARE_ITEMS)) expect(source, id).toContain(`"${id}"`)
  })

  it("lo que mejor sienta y lo que rechaza existen y no se contradicen", () => {
    for (const phase of PHASES) {
      const care = PHASE_CARE[phase]
      for (const id of care.favorites) expect(CARE_ITEMS[id], id).toBeTruthy()
      for (const id of Object.keys(care.refuses) as CareId[]) expect(care.favorites).not.toContain(id)
      for (const { id } of STATS) expect(care.start[id]).toBeLessThanOrEqual(care.cap[id])
    }
  })
})

describe("humor y reacciones", () => {
  const withStats = (stats: Partial<Record<"barriga" | "energia" | "animo" | "confort", number>>) => ({
    ...newCare(NOW, "folicular"),
    stats: { barriga: 70, energia: 70, animo: 70, confort: 70, ...stats },
  })

  it("manda la necesidad más baja", () => {
    expect(moodOf(withStats({ barriga: 10 }), NOW)).toBe("hambrienta")
    expect(moodOf(withStats({ energia: 10 }), NOW)).toBe("cansada")
    expect(moodOf(withStats({ animo: 10 }), NOW)).toBe("triste")
    expect(moodOf(withStats({ confort: 10 }), NOW)).toBe("incomoda")
    expect(moodOf(withStats({ barriga: 90, energia: 90, animo: 90, confort: 90 }), NOW)).toBe("feliz")
  })

  it("en otoño avisa una vez, luego se enfada y luego no te habla", () => {
    const t = temperamentOf("lutea", "bien")
    expect(t).toBe("grumpy")
    expect(pokeLine(t, 0, "bien")).toMatch(/no estoy de humor/)
    expect(pokeLine(t, 1, "bien")).toMatch(/te he dicho que no/)
    expect(pokeLine(t, 2, "bien")).toMatch(/no te hablo/)
    expect(pokeLine(t, 5, "bien")).toMatch(/no te hablo/)
  })

  it("feliz aguanta más, y con hambre o triste se enfada en cualquier estación", () => {
    expect(temperamentOf("lutea", "feliz")).toBe("soft")
    expect(temperamentOf("menstrual", "feliz")).toBe("happy")
    expect(temperamentOf("folicular", "hambrienta")).toBe("grumpy")
    expect(temperamentOf("ovulatoria", "cansada")).toBe("sleepy")
  })

  it("saluda según su estación y cómo está", () => {
    expect(greeting("menstrual", "incomoda")).toMatch(/frío/)
    expect(greeting("ovulatoria", "incomoda")).toMatch(/calor/)
    expect(greeting("lutea", "feliz")).toBe(PHASE_CARE.lutea.happy)
  })

  it("el cariño sube de nivel", () => {
    expect(levelOf(0)).toMatchObject({ level: 1, title: "Recién conocidas" })
    expect(levelOf(12)).toMatchObject({ level: 2, title: "Amigas" })
    expect(levelOf(999).level).toBe(5)
  })
})
