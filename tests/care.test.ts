import { describe, expect, it } from "vitest"
import { CARE_ITEMS, PHASE_CARE } from "../src/content/care"
import { freshCare, giveItem, isCared, pokeMood, trayFor } from "../src/lib/care"
import { PHASES } from "../src/lib/cycle"

describe("Cuida a Mochi", () => {
  it("en otoño necesita chocolate, manta e infusión", () => {
    let state = freshCare("2026-11-23", "lutea")
    let r = giveItem(state, "chocolate")
    expect(r.result).toBe("gift")
    state = r.state
    state = giveItem(state, "manta").state
    r = giveItem(state, "infusion")
    expect(r.result).toBe("done")
    expect(isCared(r.state)).toBe(true)
  })

  it("lo que hoy no le apetece no se queda", () => {
    const state = freshCare("2026-11-23", "lutea")
    const r = giveItem(state, "fiesta")
    expect(r.result).toBe("nope")
    expect(r.state.given).toEqual([])
  })

  it("dar dos veces lo mismo no suma", () => {
    const state = giveItem(freshCare("2026-11-23", "menstrual"), "manta").state
    expect(giveItem(state, "manta").result).toBe("repeat")
  })

  it("en otoño se enfada al tocarlo, y se le pasa si le cuidas", () => {
    expect(pokeMood("lutea", false)).toBe("grumpy")
    expect(pokeMood("lutea", true)).toBe("happy")
    expect(pokeMood("menstrual", false)).toBe("sleepy")
    expect(pokeMood("ovulatoria", false)).toBe("party")
  })

  it("cada estación tiene sus cuatro objetos, todos con nombre y sprite", () => {
    for (const phase of PHASES) {
      const tray = trayFor(phase, "2026-11-23")
      expect(new Set(tray).size).toBe(4)
      expect(tray).toContain(PHASE_CARE[phase].nope)
      for (const id of tray) {
        expect(CARE_ITEMS[id].name).not.toBe("")
        expect(CARE_ITEMS[id].sprite.every((row) => row.length === 12)).toBe(true)
        expect(PHASE_CARE[phase].lines.gifts[id] ?? PHASE_CARE[phase].nope).toBeTruthy()
      }
    }
  })

  it("el orden de la bandeja no cambia al recargar el mismo día", () => {
    expect(trayFor("lutea", "2026-11-23")).toEqual(trayFor("lutea", "2026-11-23"))
  })
})
