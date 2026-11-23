import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import Loading from "../components/Loading"
import type { Phase } from "../lib/cycle"
import { useTheme } from "../lib/theme"
import Mochi from "../three/Mochi"
import { SEASONS } from "../three/seasons"
import { box, lambert } from "../three/shapes"
import GameShell, { useGamePhase, type GameResult, type GameStatus } from "./GameShell"
import { cutSlab, rewardPerfect, slabSpeed, coinsFor, type Axis, type Slab } from "./logic"
import { recordGame } from "./store"

const SIZE = 3
const H = 0.5
const RANGE = 3.6
const START: Slab = { x: 0, z: 0, w: SIZE, d: SIZE }

interface Placed extends Slab {
  y: number
  color: string
}

interface Falling extends Slab {
  id: number
  y: number
  color: string
  axis: Axis
  sign: number
}

/** Colores de cada piso, sacados de la isla de la estación */
function palette(phase: Phase) {
  const s = SEASONS[phase]
  return [s.grass[0], s.grass[1], s.canopy[0], s.canopy[1], s.dirt]
}

function colorFor(phase: Phase, level: number) {
  const colors = palette(phase)
  const a = new THREE.Color(colors[Math.floor(level / 3) % colors.length])
  const b = new THREE.Color(colors[(Math.floor(level / 3) + 1) % colors.length])
  return `#${a.lerp(b, (level % 3) / 3).getHexString()}`
}

/** Una losa que cae girando y se va */
function FallingSlab({ slab, onGone }: { slab: Falling; onGone: (id: number) => void }) {
  const mesh = useRef<THREE.Mesh>(null)
  const t = useRef(0)
  useFrame((_, delta) => {
    t.current += delta
    const m = mesh.current
    if (!m) return
    m.position.y = slab.y - 4.9 * t.current * t.current
    const spin = t.current * 2 * slab.sign
    if (slab.axis === "x") m.rotation.z = -spin
    else m.rotation.x = spin
    if (t.current > 1.6) onGone(slab.id)
  })
  return (
    <mesh ref={mesh} geometry={box} material={lambert(slab.color)} position={[slab.x, slab.y, slab.z]} scale={[slab.w, H, slab.d]} />
  )
}

/** La cámara sube con la torre */
function CameraRig({ top }: { top: number }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const target = useRef(new THREE.Vector3())
  useFrame((_, delta) => {
    const y = THREE.MathUtils.damp(target.current.y, top, 4, delta)
    target.current.set(0, y, 0)
    camera.position.set(9, y + 9, 9)
    camera.lookAt(target.current)
    const cam = camera as THREE.OrthographicCamera
    cam.zoom = Math.min(size.width / 7.5, size.height / 12)
    cam.updateProjectionMatrix()
  })
  return null
}

interface SceneProps {
  phase: Phase
  avatar: string | null
  status: GameStatus
  onPlace: (result: { perfect: boolean; miss: boolean }) => void
  dropRef: React.RefObject<(() => void) | null>
  resetKey: number
}

function Tower({ phase, avatar, status, onPlace, dropRef, resetKey }: SceneProps) {
  const [placed, setPlaced] = useState<Placed[]>([])
  const [falling, setFalling] = useState<Falling[]>([])
  const moving = useRef<THREE.Mesh>(null)
  const movingMaterial = useMemo(() => new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }), [])
  const mochi = useRef<THREE.Group>(null)
  const game = useRef({ axis: "x" as Axis, t: 0, current: START, prev: START, level: 0, streak: 0, over: false, nextId: 1 })

  // Partida nueva
  useEffect(() => {
    setPlaced([])
    setFalling([])
    game.current = { axis: "x", t: 0, current: START, prev: START, level: 0, streak: 0, over: false, nextId: 1 }
  }, [resetKey])

  useEffect(() => {
    dropRef.current = () => {
      const g = game.current
      if (g.over || status !== "playing") return
      const cut = cutSlab(g.prev, g.current, g.axis)
      const y = g.level * H
      if (cut.kind === "miss") {
        g.over = true
        setFalling((f) => [...f, { ...g.current, id: g.nextId++, y, color: colorFor(phase, g.level), axis: g.axis, sign: 1 }])
        onPlace({ perfect: false, miss: true })
        return
      }
      g.streak = cut.perfect ? g.streak + 1 : 0
      const kept = cut.perfect ? rewardPerfect(cut.placed, g.streak, g.axis, SIZE) : cut.placed
      const color = colorFor(phase, g.level)
      setPlaced((p) => [...p, { ...kept, y, color }])
      if (cut.fallen) {
        const sign = Math.sign(g.axis === "x" ? cut.fallen.x - kept.x : cut.fallen.z - kept.z)
        setFalling((f) => [...f, { ...cut.fallen!, id: g.nextId++, y, color, axis: g.axis, sign }])
      }
      g.level += 1
      g.prev = kept
      g.axis = g.axis === "x" ? "z" : "x"
      g.current = { ...kept }
      g.t = 0
      onPlace({ perfect: cut.perfect, miss: false })
    }
  }, [dropRef, onPlace, phase, status])

  useFrame((state, delta) => {
    const g = game.current
    const m = moving.current
    if (m) {
      m.visible = !g.over && status === "playing"
      if (!g.over && status === "playing") {
        g.t += delta * slabSpeed(g.level)
        // Va y viene de un lado a otro
        const phaseT = (g.t % 4) / 4
        const offset = (phaseT < 0.5 ? phaseT * 4 - 1 : 3 - phaseT * 4) * RANGE
        g.current = g.axis === "x" ? { ...g.current, x: g.prev.x + offset, z: g.prev.z } : { ...g.current, z: g.prev.z + offset, x: g.prev.x }
        m.position.set(g.current.x, g.level * H, g.current.z)
        m.scale.set(g.current.w, H, g.current.d)
        ;(m.material as THREE.MeshLambertMaterial).color.set(colorFor(phase, g.level))
      }
    }
    // Mochi sube a la última losa
    if (mochi.current) {
      const top = (g.level - 1) * H + H / 2 + 0.6
      mochi.current.position.y = THREE.MathUtils.damp(mochi.current.position.y, top, 8, delta)
      mochi.current.position.x = THREE.MathUtils.damp(mochi.current.position.x, g.prev.x, 8, delta)
      mochi.current.position.z = THREE.MathUtils.damp(mochi.current.position.z, g.prev.z, 8, delta)
      mochi.current.lookAt(state.camera.position.x, mochi.current.position.y, state.camera.position.z)
    }
  })

  const s = SEASONS[phase]
  return (
    <>
      <CameraRig top={game.current.level * H} />
      {/* La base: un trozo de isla */}
      <mesh geometry={box} material={lambert(s.grass[0])} position={[0, -H, 0]} scale={[SIZE, H, SIZE]} />
      <mesh geometry={box} material={lambert(s.dirt)} position={[0, -H * 2.2, 0]} scale={[SIZE * 0.85, H * 1.4, SIZE * 0.85]} />
      <mesh geometry={box} material={lambert(s.rock)} position={[0, -H * 4, 0]} scale={[SIZE * 0.55, H * 2.2, SIZE * 0.55]} />
      {placed.map((p, i) => (
        <mesh key={i} geometry={box} material={lambert(p.color)} position={[p.x, p.y, p.z]} scale={[p.w, H, p.d]} />
      ))}
      {falling.map((f) => (
        <FallingSlab key={f.id} slab={f} onGone={(id) => setFalling((list) => list.filter((x) => x.id !== id))} />
      ))}
      <mesh ref={moving} geometry={box} material={movingMaterial} />
      <group ref={mochi} position={[0, -H / 2 + 0.62, 0]} scale={0.6}>
        <Mochi phase={phase} avatar={avatar} expression={game.current.over ? "triste" : "bien"} />
      </group>
    </>
  )
}

/** «Construye tu isla»: suelta cada piso encima del anterior. Lo que sobresale, se cae */
export default function StackIsland() {
  const { phase, avatar, loading } = useGamePhase()
  const { theme } = useTheme()
  const [status, setStatus] = useState<GameStatus>("ready")
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const drop = useRef<(() => void) | null>(null)
  const scoreRef = useRef(0)
  const streak = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && status === "playing") {
        e.preventDefault()
        drop.current?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [status])

  if (loading) return <Loading />

  function start() {
    scoreRef.current = 0
    streak.current = 0
    setScore(0)
    setResult(null)
    setToast(null)
    setResetKey((k) => k + 1)
    setStatus("playing")
  }

  function onPlace({ perfect, miss }: { perfect: boolean; miss: boolean }) {
    if (miss) {
      const final = scoreRef.current
      const coins = coinsFor("isla", final)
      const record = recordGame("isla", final, coins)
      setTimeout(() => {
        setResult({ score: final, coins, record })
        setStatus("over")
      }, 900)
      return
    }
    streak.current = perfect ? streak.current + 1 : 0
    scoreRef.current += perfect ? 2 : 1
    setScore(scoreRef.current)
    setToast(perfect ? (streak.current >= 3 ? `¡Perfecto ×${streak.current}! La isla crece` : "¡Perfecto!") : null)
  }

  const light = SEASONS[phase].light

  return (
    <GameShell
      game="isla"
      title="Construye tu isla"
      phase={phase}
      status={status}
      score={score}
      result={result}
      onStart={start}
      toast={toast}
      howTo={
        <p>
          Toca la pantalla para soltar cada piso encima del anterior. Lo que sobresale se cae. Si lo encajas justo,
          ¡perfecto! Tres seguidos hacen crecer la isla.
        </p>
      }
    >
      <div
        className="game-canvas"
        onPointerDown={(e) => {
          e.preventDefault()
          drop.current?.()
        }}
      >
        <Canvas orthographic flat dpr={1 / 1.6} camera={{ position: [9, 9, 9], zoom: 40, near: -50, far: 200 }} gl={{ antialias: false, alpha: true }}>
          <hemisphereLight
            args={[theme === "dark" ? "#B8C0FF" : light.hemiSky, light.hemiGround, light.hemi * (theme === "dark" ? 0.7 : 1)]}
          />
          <directionalLight position={[5, 12, 4]} intensity={light.sun * (theme === "dark" ? 0.6 : 1)} color={light.sunColor} />
          <Tower phase={phase} avatar={avatar} status={status} onPlace={onPlace} dropRef={drop} resetKey={resetKey} />
        </Canvas>
      </div>
    </GameShell>
  )
}
