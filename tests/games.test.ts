import { describe, expect, it } from "vitest"
import {
  cloudGap,
  cutSlab,
  landsOn,
  makeCloud,
  PERFECT_TOLERANCE,
  rewardPerfect,
  seededRandom,
  slabSpeed,
  coinsFor,
  WORLD_W,
  wrapX,
  type Cloud,
} from "../src/games/logic"

const base = { x: 0, z: 0, w: 3, d: 3 }

describe("Construye tu isla", () => {
  it("se queda solo lo que solapa y lo demás cae por su lado", () => {
    const cut = cutSlab(base, { ...base, x: 1 }, "x")
    expect(cut.kind).toBe("place")
    if (cut.kind !== "place") return
    expect(cut.placed).toMatchObject({ x: 0.5, w: 2 })
    expect(cut.fallen).toMatchObject({ x: 2, w: 1 })
    expect(cut.perfect).toBe(false)
  })

  it("también por el otro eje y hacia el otro lado", () => {
    const cut = cutSlab(base, { ...base, z: -0.5 }, "z")
    if (cut.kind !== "place") throw new Error("debería colocarse")
    expect(cut.placed).toMatchObject({ z: -0.25, d: 2.5 })
    expect(cut.fallen).toMatchObject({ z: -1.75, d: 0.5 })
  })

  it("casi encima cuenta como perfecto y no pierde tamaño", () => {
    const cut = cutSlab(base, { ...base, x: PERFECT_TOLERANCE / 2 }, "x")
    expect(cut).toMatchObject({ kind: "place", perfect: true, fallen: null, placed: { x: 0, w: 3 } })
  })

  it("si no toca, se acaba la partida", () => {
    expect(cutSlab(base, { ...base, x: 3.2 }, "x").kind).toBe("miss")
  })

  it("va cada vez más rápido, con un tope", () => {
    expect(slabSpeed(10)).toBeGreaterThan(slabSpeed(0))
    expect(slabSpeed(999)).toBe(6)
  })

  it("tres perfectos seguidos agrandan la losa sin pasar del tamaño inicial", () => {
    const small = { ...base, w: 2 }
    expect(rewardPerfect(small, 2, "x", 3).w).toBe(2)
    expect(rewardPerfect(small, 3, "x", 3).w).toBe(2.25)
    expect(rewardPerfect({ ...base }, 5, "x", 3).w).toBe(3)
  })
})

describe("Mochi salta entre nubes", () => {
  const cloud: Cloud = { x: 50, y: 100, w: 30, kind: "normal", vx: 0 }

  it("rebota al pisar una nube bajando, no al subir ni fuera de ella", () => {
    expect(landsOn(103, 98, 55, cloud)).toBe(true)
    expect(landsOn(98, 103, 55, cloud)).toBe(false)
    expect(landsOn(103, 98, 5, cloud)).toBe(false)
    expect(landsOn(103, 98, 55, { ...cloud, broken: true })).toBe(false)
  })

  it("al salir por un lado aparece por el otro", () => {
    expect(wrapX(-20)).toBeGreaterThan(WORLD_W / 2)
    expect(wrapX(WORLD_W + 5)).toBeLessThan(0)
    expect(wrapX(80)).toBe(80)
  })

  it("al principio solo hay nubes normales; más arriba aparecen móviles y frágiles", () => {
    const rand = seededRandom(7)
    const low = Array.from({ length: 50 }, () => makeCloud(0, 0, rand))
    expect(low.every((c) => c.kind === "normal")).toBe(true)
    const high = Array.from({ length: 200 }, () => makeCloud(0, 600, rand))
    expect(high.some((c) => c.kind === "moving")).toBe(true)
    expect(high.some((c) => c.kind === "fragile")).toBe(true)
    expect(high.every((c) => c.x >= 0 && c.x + c.w <= WORLD_W)).toBe(true)
  })

  it("las nubes se separan más según sube, sin pasar del salto", () => {
    const rand = () => 0.5
    expect(cloudGap(800, rand)).toBeGreaterThan(cloudGap(0, rand))
    expect(cloudGap(99_999, rand)).toBeLessThan(60)
  })
})

describe("monedas", () => {
  it("se ganan según la puntuación y lo recogido", () => {
    expect(coinsFor("isla", 10)).toBe(3)
    expect(coinsFor("nubes", 45, 4)).toBe(8)
  })
})
