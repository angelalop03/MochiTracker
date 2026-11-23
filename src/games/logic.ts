// Reglas de los minijuegos, sin dibujo ni React: así se pueden probar.

// ----------------------------------------------------------- Construye tu isla

/** Una losa de la torre: centro y tamaño en el plano */
export interface Slab {
  x: number
  z: number
  w: number
  d: number
}

export type Axis = "x" | "z"

/** Margen para contar una colocación como perfecta */
export const PERFECT_TOLERANCE = 0.12

export type Cut =
  | { kind: "miss" }
  | { kind: "place"; placed: Slab; fallen: Slab | null; perfect: boolean }

/** Suelta la losa en movimiento sobre la anterior: se queda lo que solapa y lo demás cae */
export function cutSlab(prev: Slab, cur: Slab, axis: Axis): Cut {
  const size = axis === "x" ? prev.w : prev.d
  const delta = cur[axis] - prev[axis]
  const overlap = size - Math.abs(delta)
  if (overlap <= 0) return { kind: "miss" }
  if (Math.abs(delta) <= PERFECT_TOLERANCE) {
    return { kind: "place", placed: { ...cur, [axis]: prev[axis] }, fallen: null, perfect: true }
  }
  const center = prev[axis] + delta / 2
  const placed: Slab = axis === "x" ? { ...cur, x: center, w: overlap } : { ...cur, z: center, d: overlap }
  const sign = Math.sign(delta)
  const fallenCenter = center + sign * (overlap / 2 + Math.abs(delta) / 2)
  const fallen: Slab =
    axis === "x" ? { ...cur, x: fallenCenter, w: Math.abs(delta) } : { ...cur, z: fallenCenter, d: Math.abs(delta) }
  return { kind: "place", placed, fallen, perfect: false }
}

/** Cada vez más rápido, hasta un tope */
export function slabSpeed(score: number) {
  return Math.min(6, 2.4 + score * 0.12)
}

/** Tres perfectos seguidos agrandan un poco la losa, como premio */
export function rewardPerfect(slab: Slab, streak: number, axis: Axis, maxSize: number): Slab {
  if (streak < 3) return slab
  const grow = 0.25
  return axis === "x" ? { ...slab, w: Math.min(maxSize, slab.w + grow) } : { ...slab, d: Math.min(maxSize, slab.d + grow) }
}

// -------------------------------------------------------- Mochi salta entre nubes

export type CloudKind = "normal" | "moving" | "fragile"

export interface Cloud {
  x: number
  y: number
  w: number
  kind: CloudKind
  vx: number
  broken?: boolean
}

/** Tamaño del mundo, en píxeles lógicos */
export const WORLD_W = 120
export const WORLD_H = 214
export const PLAYER = 12

/** Una nube nueva a esta altura: más separadas, móviles y frágiles según sube */
export function makeCloud(y: number, height: number, rand: () => number): Cloud {
  const meters = height / 10
  const w = Math.max(18, 30 - meters * 0.1)
  const roll = rand()
  const kind: CloudKind = meters > 25 && roll < 0.25 ? "moving" : meters > 12 && roll < 0.45 ? "fragile" : "normal"
  return {
    x: rand() * (WORLD_W - w),
    y,
    w,
    kind,
    vx: kind === "moving" ? (rand() < 0.5 ? -1 : 1) * (18 + Math.min(30, meters * 0.4)) : 0,
  }
}

/** Distancia vertical hasta la siguiente nube, que crece con la altura */
export function cloudGap(height: number, rand: () => number) {
  const meters = height / 10
  return 22 + Math.min(24, meters * 0.35) + rand() * 10
}

/** true si al bajar ha pisado la nube por arriba */
export function landsOn(prevBottom: number, bottom: number, x: number, cloud: Cloud) {
  if (cloud.broken) return false
  const falling = bottom < prevBottom
  const crossed = prevBottom >= cloud.y && bottom <= cloud.y
  const overlaps = x + PLAYER * 0.75 > cloud.x && x + PLAYER * 0.25 < cloud.x + cloud.w
  return falling && crossed && overlaps
}

/** Al salir por un lado, aparece por el otro */
export function wrapX(x: number) {
  if (x < -PLAYER / 2) return WORLD_W - PLAYER / 2
  if (x > WORLD_W - PLAYER / 2) return -PLAYER / 2
  return x
}

/** Generador de números pseudoaleatorios con semilla, para poder probarlo */
export function seededRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// -------------------------------------------------------------------- monedas

/** Monedas que da cada partida, para comprarle cosas a Mochi */
export function coinsFor(game: "isla" | "nubes", score: number, collected = 0) {
  return game === "isla" ? Math.floor(score / 3) : Math.floor(score / 10) + collected
}
