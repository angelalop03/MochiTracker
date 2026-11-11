import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { Phase } from "../lib/cycle"
import { useVisible } from "../hooks/useVisible"
import { isAiBusy, subscribeAiBusy } from "../lib/ai/busy"
import { useTheme } from "../lib/theme"
import Burst, { type BurstHandle } from "./Burst"
import Floaters from "./Floaters"
import Island from "./Island"
import Mochi from "./Mochi"
import { SEASONS } from "./seasons"
import { CAMERA_Z, FOV, WORLD_SIZE, visibleHeight } from "./shapes"

const { damp } = THREE.MathUtils
const FPS = 30
/** Tamaño de cada píxel visible, en píxeles CSS. Más grande es más retro y más ligero */
const PIXEL_SIZE = { mobile: 1.75, desktop: 2.25 }

// Vista casi isométrica: el mundo se inclina y Mochi se gira para seguir mirando de frente
const WORLD_TILT: [number, number, number] = [0.38, -0.55, 0]
const FACING_CAMERA = new THREE.Quaternion().setFromEuler(new THREE.Euler(...WORLD_TILT)).invert()

// Con frameloop="demand" solo se dibuja cuando se pide: 30 fps bastan para el estilo retro
// y gastan menos batería. Fuera de pantalla no se dibuja nada.
function Ticker({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => invalidate(), 1000 / FPS)
    return () => clearInterval(id)
  }, [active, invalidate])
  return null
}

function fitScale(widthPx: number, heightPx: number, canvasW: number, canvasH: number) {
  const visH = visibleHeight(0)
  const visW = (visH * canvasW) / canvasH
  return Math.min(((heightPx / canvasH) * visH) / WORLD_SIZE, ((widthPx / canvasW) * visW) / WORLD_SIZE)
}

/** La isla ocupa todo su contenedor */
function EmbeddedRig({ children }: { children: ReactNode }) {
  const size = useThree((s) => s.size)
  return (
    <group position={[0, -0.25, 0]} scale={fitScale(size.width, size.height, size.width, size.height)}>
      {children}
    </group>
  )
}

/** La isla se coloca sobre el hueco [data-mochi-stage] más cercano y salta de uno a otro */
function ScrollRig({ children }: { children: ReactNode }) {
  const rig = useRef<THREE.Group>(null)
  const stages = useRef<HTMLElement[]>([])
  const track = useRef({ index: -1, hop: 0, y: 0 })
  const size = useThree((s) => s.size)

  useEffect(() => {
    stages.current = [...document.querySelectorAll<HTMLElement>("[data-mochi-stage]")]
  }, [])

  useFrame((_, delta) => {
    const g = rig.current
    if (!g) return
    const dt = Math.min(delta, 0.1)
    let rect: DOMRect | undefined
    let index = -1
    let best = Infinity
    for (const [i, el] of stages.current.entries()) {
      const r = el.getBoundingClientRect()
      if (r.height === 0) continue
      const d = Math.abs(r.top + r.height / 2 - size.height / 2)
      if (d < best) {
        best = d
        rect = r
        index = i
      }
    }
    if (!rect) return

    const s = track.current
    const visH = visibleHeight(0)
    const visW = (visH * size.width) / size.height
    const centerY = rect.top + rect.height / 2
    const x = ((rect.left + rect.width / 2) / size.width - 0.5) * visW
    const y = -(centerY / size.height - 0.5) * visH
    const onScreen = centerY > -rect.height * 0.3 && centerY < size.height + rect.height * 0.3
    const scale = onScreen ? fitScale(rect.width, rect.height, size.width, size.height) : 0.001

    if (s.index === -1) {
      g.position.set(x, y, 0)
      g.scale.setScalar(scale)
      s.y = y
    } else if (index !== s.index) {
      s.hop = 1
    }
    s.index = index

    s.hop = Math.max(0, s.hop - dt / 0.9)
    const hopY = s.hop > 0 ? Math.sin((1 - s.hop) * Math.PI) * 1.4 : 0
    s.y = damp(s.y, y, 10, dt)
    g.position.x = damp(g.position.x, x, 5, dt)
    g.position.y = s.y + hopY
    g.scale.setScalar(damp(g.scale.x, scale, 6, dt))
  })

  return <group ref={rig}>{children}</group>
}

function World({ phase }: { phase: Phase }) {
  const burst = useRef<BurstHandle>(null)
  const holder = useRef<THREE.Group>(null)

  function handlePoke(position: THREE.Vector3) {
    const scale = holder.current?.getWorldScale(new THREE.Vector3()).x ?? 1
    burst.current?.burst(position, scale)
  }

  return (
    <>
      <group ref={holder} rotation={WORLD_TILT}>
        <Island phase={phase} />
        <group position={[-0.2, 2.02, 1.1]} quaternion={FACING_CAMERA} scale={1.6}>
          <Mochi phase={phase} onPoke={handlePoke} />
        </group>
      </group>
      <Burst ref={burst} />
    </>
  )
}

interface SceneProps {
  phase: Phase
  /** "embedded" llena su contenedor. "scroll" va de fondo y acompaña a los huecos de la página */
  mode?: "embedded" | "scroll"
}

export default function Scene({ phase, mode = "embedded" }: SceneProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const visible = useVisible(wrapper)
  const aiBusy = useSyncExternalStore(subscribeAiBusy, isAiBusy)
  const [mobile] = useState(() => window.matchMedia("(max-width: 820px)").matches)
  const { theme } = useTheme()
  const day = SEASONS[phase].light
  // De noche, luz de luna: más tenue y fría, con el suelo de la estación
  const light =
    theme === "dark"
      ? { ...day, hemiSky: "#B8C0FF", hemi: day.hemi * 0.62, sun: day.sun * 0.6, sunColor: "#D6DCFF" }
      : day
  const Rig = mode === "scroll" ? ScrollRig : EmbeddedRig

  return (
    <div ref={wrapper} className={`scene scene-${mode}`} aria-hidden="true">
      <Canvas
        flat
        frameloop="demand"
        dpr={1 / (mobile ? PIXEL_SIZE.mobile : PIXEL_SIZE.desktop)}
        // Las coordenadas "client" solo valen para un canvas a pantalla completa
        {...(mode === "scroll"
          ? { eventSource: document.getElementById("root")!, eventPrefix: "client" as const }
          : {})}
        camera={{ position: [0, 0, CAMERA_Z], fov: FOV }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <Ticker active={visible && !aiBusy} />
        <hemisphereLight args={[light.hemiSky, light.hemiGround, light.hemi]} />
        <directionalLight position={[5, 9, 7]} intensity={light.sun} color={light.sunColor} />
        <Floaters phase={phase} count={mobile ? 22 : 40} parallax={mode === "scroll"} />
        <Rig>
          <World phase={phase} />
        </Rig>
      </Canvas>
    </div>
  )
}
