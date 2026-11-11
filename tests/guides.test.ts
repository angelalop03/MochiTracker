import { describe, expect, it } from "vitest"
import { BLOCK_GUIDES } from "../src/content/guides"
import { BLOCKS } from "../src/content/phases"
import { PHASES } from "../src/lib/cycle"

describe("guías de cada bloque", () => {
  it("hay una guía completa para cada fase y bloque", () => {
    for (const phase of PHASES) {
      for (const block of BLOCKS) {
        const guide = BLOCK_GUIDES[phase][block.id]
        expect(guide.headline.length, `${phase}/${block.id}`).toBeGreaterThan(10)
        expect(guide.why.length, `${phase}/${block.id}`).toBeGreaterThan(60)
        expect(guide.tips.length, `${phase}/${block.id}`).toBeGreaterThanOrEqual(3)
        for (const tip of guide.tips) {
          expect(tip.title.trim()).not.toBe("")
          expect(tip.text.trim()).toMatch(/[.!]$/)
        }
      }
    }
  })

  it("los consejos de un bloque no repiten título", () => {
    for (const phase of PHASES) {
      for (const block of BLOCKS) {
        const titles = BLOCK_GUIDES[phase][block.id].tips.map((t) => t.title)
        expect(new Set(titles).size).toBe(titles.length)
      }
    }
  })
})
