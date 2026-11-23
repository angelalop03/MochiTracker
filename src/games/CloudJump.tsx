import { useEffect, useRef, useState } from "react"
import Loading from "../components/Loading"
import type { Phase } from "../lib/cycle"
import GameShell, { useGamePhase, type GameResult, type GameStatus } from "./GameShell"
import { cloudGap, landsOn, makeCloud, PLAYER, seededRandom, coinsFor, WORLD_H, WORLD_W, wrapX, type Cloud } from "./logic"
import { recordGame } from "./store"

const GRAVITY = 520
const JUMP = 250
const MOVE = 85

// Mochi en píxeles, mirando de frente: 12 × 12
const MOCHI = [
  "...BBBBBB...",
  "..BBBBBBBB..",
  ".BBBBBBBBBB.",
  ".BBKBBBBKBB.",
  ".BBKBBBBKBB.",
  ".BBBBBBBBBB.",
  ".PPBBKKBBPP.",
  ".BBBBBBBBBB.",
  "..BBBBBBBB..",
  "...BBBBBB...",
  "..BB....BB..",
]

/** Lo que se recoge en cada estación: 5 × 5 */
const PICKUP: Record<Phase, { sprite: string[]; color: string }> = {
  menstrual: { sprite: ["..X..", "X.X.X", ".XXX.", "X.X.X", "..X.."], color: "#FFFFFF" },
  folicular: { sprite: [".X.X.", "XXXXX", ".XYX.", "XXXXX", ".X.X."], color: "#F28FB3" },
  ovulatoria: { sprite: ["X.X.X", ".XXX.", "XXYXX", ".XXX.", "X.X.X"], color: "#F5C94A" },
  lutea: { sprite: ["...XX", "..XXX", ".XXX.", "XXX..", "X...."], color: "#E07A4F" },
}

interface Pickup {
  x: number
  y: number
  taken?: boolean
}

interface World {
  x: number
  y: number
  vx: number
  vy: number
  squash: number
  camera: number
  maxY: number
  clouds: Cloud[]
  pickups: Pickup[]
  collected: number
  nextCloud: number
  rand: () => number
  input: number
  over: boolean
}

function newWorld(seed: number): World {
  const rand = seededRandom(seed)
  const clouds: Cloud[] = [{ x: WORLD_W / 2 - 18, y: 20, w: 36, kind: "normal", vx: 0 }]
  let y = 20
  while (y < WORLD_H + 40) {
    y += cloudGap(0, rand)
    clouds.push(makeCloud(y, 0, rand))
  }
  return {
    x: WORLD_W / 2 - PLAYER / 2,
    y: 22,
    vx: 0,
    vy: JUMP,
    squash: 0,
    camera: 0,
    maxY: 0,
    clouds,
    pickups: [],
    collected: 0,
    nextCloud: y,
    rand,
    input: 0,
    over: false,
  }
}

function css(el: HTMLElement, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

/** «Mochi salta entre nubes»: rebota hacia arriba sin caerte */
export default function CloudJump() {
  const { phase, loading } = useGamePhase()
  const [status, setStatus] = useState<GameStatus>("ready")
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const world = useRef<World>(newWorld(1))
  const statusRef = useRef<GameStatus>("ready")
  statusRef.current = status

  // Teclado
  useEffect(() => {
    const keys = new Set<string>()
    const update = () => {
      world.current.input = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0)
    }
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        keys.add(e.key)
        update()
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key)
      update()
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  // Bucle del juego
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext("2d")
    if (!ctx) return
    const page = el.closest(".game-page") as HTMLElement
    let frame = 0
    let last = performance.now()
    let shownScore = -1

    const loop = (nowMs: number) => {
      const dt = Math.min(0.033, (nowMs - last) / 1000)
      last = nowMs
      const w = world.current
      const playing = statusRef.current === "playing" && !w.over

      if (playing) {
        // Movimiento
        w.vx += (w.input * MOVE - w.vx) * Math.min(1, dt * 10)
        w.x = wrapX(w.x + w.vx * dt)
        const prevBottom = w.y
        w.vy -= GRAVITY * dt
        w.y += w.vy * dt
        w.squash = Math.max(0, w.squash - dt * 4)

        for (const c of w.clouds) {
          if (c.kind === "moving") {
            c.x += c.vx * dt
            if (c.x < 0 || c.x + c.w > WORLD_W) c.vx *= -1
          }
          if (w.vy < 0 && landsOn(prevBottom, w.y, w.x, c)) {
            w.y = c.y
            w.vy = JUMP
            w.squash = 1
            if (c.kind === "fragile") c.broken = true
          }
        }

        // Recoger
        for (const p of w.pickups) {
          if (!p.taken && Math.abs(p.x - (w.x + PLAYER / 2)) < 9 && Math.abs(p.y - (w.y + PLAYER / 2)) < 10) {
            p.taken = true
            w.collected += 1
          }
        }

        // La cámara sube con Mochi; nunca baja
        w.maxY = Math.max(w.maxY, w.y)
        w.camera = Math.max(w.camera, w.y - WORLD_H * 0.42)

        // Nubes nuevas por arriba y fuera las de abajo
        while (w.nextCloud < w.camera + WORLD_H + 40) {
          w.nextCloud += cloudGap(w.maxY, w.rand)
          const cloud = makeCloud(w.nextCloud, w.maxY, w.rand)
          w.clouds.push(cloud)
          if (w.rand() < 0.3) w.pickups.push({ x: cloud.x + cloud.w / 2, y: cloud.y + 16 })
        }
        w.clouds = w.clouds.filter((c) => c.y > w.camera - 20)
        w.pickups = w.pickups.filter((p) => p.y > w.camera - 20)

        if (w.y < w.camera - PLAYER) {
          w.over = true
          const final = Math.floor(w.maxY / 10)
          const coins = coinsFor("nubes", final, w.collected)
          const record = recordGame("nubes", final, coins)
          setTimeout(() => {
            setResult({ score: final, coins, record })
            setStatus("over")
          }, 500)
        }

        const now = Math.floor(w.maxY / 10)
        if (now !== shownScore) {
          shownScore = now
          setScore(now)
        }
      }

      draw(ctx, w, page, phase, nowMs / 1000)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [phase, loading])

  if (loading) return <Loading />

  function start() {
    world.current = newWorld(Math.floor(Math.random() * 1e9))
    setScore(0)
    setResult(null)
    setStatus("playing")
  }

  // Tocar a la izquierda o a la derecha
  function press(e: React.PointerEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    world.current.input = e.clientX - rect.left < rect.width / 2 ? -1 : 1
  }
  function release() {
    world.current.input = 0
  }

  return (
    <GameShell
      game="nubes"
      title="Salta entre nubes"
      phase={phase}
      status={status}
      score={score}
      result={result}
      onStart={start}
      howTo={
        <p>
          Mochi rebota sola. Mantén pulsado a la izquierda o a la derecha de la pantalla para moverla (o usa las flechas).
          Recoge lo que encuentres y no te caigas. Cuidado con las nubes que se deshacen.
        </p>
      }
    >
      <div className="game-canvas" onPointerDown={press} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}>
        <canvas ref={canvas} className="pixel-canvas" width={WORLD_W} height={WORLD_H} aria-label="Mochi saltando entre nubes" />
      </div>
    </GameShell>
  )
}

function draw(ctx: CanvasRenderingContext2D, w: World, page: HTMLElement, phase: Phase, t: number) {
  const top = css(page, "--sky-top", "#bfe6db")
  const bottom = css(page, "--sky-bottom", "#f6f2df")
  const dark = document.documentElement.dataset.theme === "dark"
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H)
  sky.addColorStop(0, top)
  sky.addColorStop(1, bottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)

  // Estrellas de noche, o nubecitas de fondo de día
  ctx.fillStyle = dark ? "#FFFFFF" : "rgba(255,255,255,0.5)"
  for (let i = 0; i < 18; i++) {
    const x = (i * 53) % WORLD_W
    const y = (((i * 97 - w.camera * 0.3) % WORLD_H) + WORLD_H) % WORLD_H
    if (dark) ctx.fillRect(x, y, 1, 1)
    else if (i % 3 === 0) ctx.fillRect(x, y, 14, 3)
  }

  const sy = (y: number) => Math.round(WORLD_H - (y - w.camera))

  // Nubes
  for (const c of w.clouds) {
    if (c.broken) continue
    const x = Math.round(c.x)
    const y = sy(c.y)
    const fragile = c.kind === "fragile"
    ctx.fillStyle = fragile ? "rgba(255,255,255,0.55)" : "#FFFFFF"
    ctx.fillRect(x + 2, y - 2, c.w - 4, 2)
    ctx.fillRect(x, y, c.w, 4)
    ctx.fillStyle = fragile ? "rgba(200,190,210,0.6)" : c.kind === "moving" ? "#C9D4F2" : "#E9E2DC"
    ctx.fillRect(x + 1, y + 4, c.w - 2, 2)
  }

  // Lo que se recoge
  const pick = PICKUP[phase]
  for (const p of w.pickups) {
    if (p.taken) continue
    const bob = Math.round(Math.sin(t * 4 + p.x) * 1.5)
    pick.sprite.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === ".") return
        ctx.fillStyle = ch === "Y" ? "#FFE2A8" : pick.color
        ctx.fillRect(Math.round(p.x) - 2 + rx, sy(p.y) - 2 + ry + bob, 1, 1)
      })
    )
  }

  // Mochi, que se aplasta al rebotar
  const squash = w.squash
  const px = Math.round(w.x)
  const py = sy(w.y) - PLAYER
  MOCHI.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      if (ch === ".") return
      ctx.fillStyle = ch === "K" ? "#3A2A38" : ch === "P" ? "#F6A9BB" : "#FFF9F2"
      const y = py + Math.round(ry * (1 - squash * 0.25) + squash * 3)
      ctx.fillRect(px + rx, y, 1, 1)
    })
  )
  // Contorno suave para que se vea sobre el cielo claro
  ctx.fillStyle = "rgba(58,42,56,0.25)"
  ctx.fillRect(px + 2, py + PLAYER - 1, PLAYER - 4, 1)
}
