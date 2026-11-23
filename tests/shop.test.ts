import { describe, expect, it } from "vitest"
import { CARE_ITEMS, type CareId } from "../src/content/care"
import { buy, dailyGift, DAILY_GIFT, earn, missingFor, newWallet, pantryOf, SHOP, spend, START_COINS } from "../src/lib/shop"

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

  it("si no queda, se paga al dárselo", () => {
    const w = spend(newWallet(), "ensalada")
    expect(w.coins).toBe(START_COINS - 3)
    expect(w.stock.ensalada ?? 0).toBe(0)
  })

  it("la manta se compra una vez y es tuya para siempre", () => {
    const rich = earn(newWallet(), 20)
    const bought = spend(rich, "manta")
    expect(bought.coins).toBe(rich.coins - 20)
    expect(pantryOf(bought, "manta")).toEqual({ kind: "owned" })
    expect(spend(bought, "manta").coins).toBe(bought.coins)
  })

  it("dice cuántas monedas faltan y no cobra sin dinero", () => {
    const poor = { ...newWallet(), coins: 4 }
    expect(missingFor(poor, "manta")).toBe(16)
    expect(missingFor(poor, "agua")).toBe(0)
    expect(spend(poor, "manta")).toEqual(poor)
  })

  it("se pueden comprar unidades para guardarlas", () => {
    const w = buy(newWallet(), "chocolate", 3)
    expect(w?.coins).toBe(START_COINS - 6)
    expect(w?.stock.chocolate).toBe(5)
    expect(buy(newWallet(), "chocolate", 6)).toBeNull()
    expect(buy(newWallet(), "manta")).toBeNull()
    expect(buy(newWallet(), "paseo")).toBeNull()
  })

  it("hay un regalo al día, solo una vez", () => {
    const first = dailyGift(newWallet(), "2026-11-23")
    expect(first.gift).toBe(DAILY_GIFT)
    expect(first.wallet.coins).toBe(START_COINS + DAILY_GIFT)
    expect(dailyGift(first.wallet, "2026-11-23").gift).toBe(0)
    expect(dailyGift(first.wallet, "2026-11-24").gift).toBe(DAILY_GIFT)
  })
})
