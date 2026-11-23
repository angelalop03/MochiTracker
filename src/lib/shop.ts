// Monedas y despensa de Mochi. Las monedas se ganan en los minijuegos y con un regalo
// cada día; con ellas se compran la comida y los productos. Moverse, descansar o un
// masaje no se compran: son gratis, como en la vida real. Se guarda en el dispositivo.

import { useSyncExternalStore } from "react"
import type { CareId } from "../content/care"

export interface Wallet {
  coins: number
  /** Unidades que quedan de cada cosa */
  stock: Partial<Record<CareId, number>>
  /** Lo que se compra una vez y es tuyo para siempre */
  owned: CareId[]
  /** Último día en que se recogió el regalo */
  lastGift: string
}

export interface ShopItem {
  price: number
  forever?: boolean
}

/** Lo que cuesta cada cosa. Lo que no está aquí es gratis */
export const SHOP: Partial<Record<CareId, ShopItem>> = {
  lentejas: { price: 3 },
  chocolate: { price: 2 },
  frutos: { price: 2 },
  platano: { price: 2 },
  naranja: { price: 2 },
  ensalada: { price: 3 },
  agua: { price: 1 },
  infusion: { price: 1 },
  cafe: { price: 2 },
  patatas: { price: 1 },
  bano: { price: 3 },
  limpieza: { price: 2 },
  crema: { price: 2 },
  protector: { price: 2 },
  bolsa: { price: 15, forever: true },
  manta: { price: 20, forever: true },
}

export const START_COINS = 10
export const DAILY_GIFT = 5
const START_STOCK: Partial<Record<CareId, number>> = { agua: 3, infusion: 2, chocolate: 2, platano: 1, lentejas: 1, crema: 1 }

export function newWallet(): Wallet {
  return { coins: START_COINS, stock: { ...START_STOCK }, owned: [], lastGift: "" }
}

export type Pantry =
  | { kind: "free" }
  | { kind: "stock"; left: number }
  | { kind: "owned" }
  | { kind: "buy"; price: number; forever: boolean }

/** Si se puede dar ya, cuántas quedan o cuánto cuesta */
export function pantryOf(wallet: Wallet, id: CareId): Pantry {
  const item = SHOP[id]
  if (!item) return { kind: "free" }
  if (item.forever) return wallet.owned.includes(id) ? { kind: "owned" } : { kind: "buy", price: item.price, forever: true }
  const left = wallet.stock[id] ?? 0
  return left > 0 ? { kind: "stock", left } : { kind: "buy", price: item.price, forever: false }
}

/** Monedas que faltan para darle esto (0 si se puede) */
export function missingFor(wallet: Wallet, id: CareId) {
  const p = pantryOf(wallet, id)
  return p.kind === "buy" ? Math.max(0, p.price - wallet.coins) : 0
}

/** Después de dárselo: se gasta una unidad, o se paga si no quedaban */
export function spend(wallet: Wallet, id: CareId): Wallet {
  const p = pantryOf(wallet, id)
  if (p.kind === "free" || p.kind === "owned") return wallet
  if (p.kind === "stock") return { ...wallet, stock: { ...wallet.stock, [id]: p.left - 1 } }
  if (wallet.coins < p.price) return wallet
  const coins = wallet.coins - p.price
  return p.forever ? { ...wallet, coins, owned: [...wallet.owned, id] } : { ...wallet, coins }
}

/** Comprar unidades para tenerlas guardadas */
export function buy(wallet: Wallet, id: CareId, units = 1): Wallet | null {
  const item = SHOP[id]
  if (!item || item.forever || units < 1) return null
  const cost = item.price * units
  if (wallet.coins < cost) return null
  return { ...wallet, coins: wallet.coins - cost, stock: { ...wallet.stock, [id]: (wallet.stock[id] ?? 0) + units } }
}

export function earn(wallet: Wallet, coins: number): Wallet {
  return coins > 0 ? { ...wallet, coins: wallet.coins + Math.floor(coins) } : wallet
}

/** Un regalo al día, la primera vez que se entra */
export function dailyGift(wallet: Wallet, today: string): { wallet: Wallet; gift: number } {
  if (!today || wallet.lastGift === today) return { wallet, gift: 0 }
  return { wallet: { ...wallet, coins: wallet.coins + DAILY_GIFT, lastGift: today }, gift: DAILY_GIFT }
}

// ------------------------------------------------------------ almacenamiento
const KEY = "isla-mochi-monedero"
const OLD_GAMES = "isla-mochi-juegos"
const EVENT = "isla-mochi-monedero"

/** Si el navegador no deja guardar, las monedas duran lo que dure la página */
let memory: string | null = null

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return key === KEY ? memory : null
  }
}

/** La primera vez, las estrellas que ya se hubieran ganado pasan a ser monedas */
function oldStars() {
  try {
    return Number((JSON.parse(read(OLD_GAMES) ?? "{}") as { stars?: number }).stars) || 0
  } catch {
    return 0
  }
}

function fresh(): Wallet {
  return earn(newWallet(), oldStars())
}

function parse(raw: string | null): Wallet | null {
  try {
    return raw ? (JSON.parse(raw) as Wallet) : null
  } catch {
    return null
  }
}

let cache: { raw: string | null; wallet: Wallet } | null = null

function snapshot(): Wallet {
  const raw = read(KEY)
  if (cache && cache.raw === raw) return cache.wallet
  const saved = parse(raw)
  cache = { raw, wallet: saved ? { ...newWallet(), ...saved } : fresh() }
  return cache.wallet
}

function save(wallet: Wallet) {
  const raw = JSON.stringify(wallet)
  try {
    localStorage.setItem(KEY, raw)
  } catch {
    memory = raw
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}

export const getWallet = snapshot

export function updateWallet(change: (wallet: Wallet) => Wallet) {
  save(change(snapshot()))
}

/** Suma lo ganado en una partida. Siempre guarda, para no perder las estrellas antiguas */
export function earnCoins(coins: number) {
  updateWallet((w) => earn(w, coins))
}

/** Recoge el regalo del día. Devuelve cuántas monedas da (0 si ya se recogió) */
export function claimDailyGift(today: string) {
  const { wallet, gift } = dailyGift(snapshot(), today)
  if (gift) save(wallet)
  return gift
}

export function useWallet() {
  return useSyncExternalStore(subscribe, snapshot)
}
