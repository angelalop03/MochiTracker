import { describe, expect, it } from "vitest"
import { CARE_ITEMS, type CareId } from "../src/content/care"
import { buy, canGive, dailyGift, DAILY_GIFT, earn, newWallet, pantryOf, SHOP, spend, START_COINS, type Purchase } from "../src/lib/shop"

const bought = (p: Purchase) => {
  if (p.kind !== "ok") throw new Error(p.kind)
  return p.wallet
}

describe("monedero de Mochi", () => {
  it("empieza con unas monedas y algo en la despensa", () => {
    const w = newWallet()
    expect(w.coins).toBe(START_COINS)
    expect(pantryOf(w, "agua")).toEqual({ kind: "stock", left: 3 })
    expect(pantryOf(w, "ensalada")).toEqual({ kind: "buy", price: 3, forever: false })
  })

  it("moverse, descansar y el masaje son gratis", () => {
    const free = (Object.keys(CARE_ITEMS) as CareId[]).filter((id) => !SHOP[id])
    for (const id of free) expect(["moverse", "mente"].includes(CARE_ITEMS[id].category) || id === "masaje").toBe(true)
    expect(pantryOf(newWallet(), "paseo")).toEqual({ kind: "free" })
    expect(spend(newWallet(), "yoga")).toEqual(newWallet())
  })

  it("toda la comida y los productos cuestan algo", () => {
    for (const id of Object.keys(CARE_ITEMS) as CareId[]) {
      if (CARE_ITEMS[id].category === "comida") expect(SHOP[id]?.price).toBeGreaterThan(0)
    }
  })

  it("dar algo que tienes gasta una unidad", () => {
    const w = spend(newWallet(), "agua")
    expect(w.stock.agua).toBe(2)
    expect(w.coins).toBe(START_COINS)
  })

  it("si no queda, no se le puede dar ni se cobra nada", () => {
    const w = newWallet()
    expect(canGive(w, "ensalada")).toBe(false)
    expect(spend(w, "ensalada")).toEqual(w)
    expect(canGive(w, "paseo")).toBe(true)
  })

  it("en la tienda se compran unidades para la despensa", () => {
    const w = bought(buy(newWallet(), "chocolate", 3))
    expect(w.coins).toBe(START_COINS - 6)
    expect(w.stock.chocolate).toBe(5)
    const salad = bought(buy(newWallet(), "ensalada"))
    expect(canGive(salad, "ensalada")).toBe(true)
    expect(spend(salad, "ensalada").stock.ensalada).toBe(0)
  })

  it("la manta se compra una vez y es tuya para siempre", () => {
    const rich = earn(newWallet(), 20)
    const w = bought(buy(rich, "manta"))
    expect(w.coins).toBe(rich.coins - 20)
    expect(pantryOf(w, "manta")).toEqual({ kind: "owned" })
    expect(buy(w, "manta")).toEqual({ kind: "owned" })
    expect(spend(w, "manta")).toEqual(w)
  })

  it("dice cuántas monedas faltan y no cobra sin dinero", () => {
    const poor = { ...newWallet(), coins: 4 }
    expect(buy(poor, "manta")).toEqual({ kind: "poor", missing: 16 })
    expect(buy(poor, "chocolate", 3)).toEqual({ kind: "poor", missing: 2 })
    expect(buy(poor, "paseo")).toEqual({ kind: "free" })
  })

  it("hay un regalo al día, solo una vez", () => {
    const first = dailyGift(newWallet(), "2026-11-23")
    expect(first.gift).toBe(DAILY_GIFT)
    expect(first.wallet.coins).toBe(START_COINS + DAILY_GIFT)
    expect(dailyGift(first.wallet, "2026-11-23").gift).toBe(0)
    expect(dailyGift(first.wallet, "2026-11-24").gift).toBe(DAILY_GIFT)
  })
})
