import { useRef } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import type { Phase } from "../lib/cycle"
import { SEASONS } from "./seasons"
import { ball, box, lambert } from "./shapes"

const INK = "#2B2140"
const BODY = "#FFF4DC"
const BLUSH = "#F7A58C"

const tmp = new THREE.Vector3()
const { clamp, damp } = THREE.MathUtils
const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

function Outfit({ phase }: { phase: Phase }) {
  switch (phase) {
    case "menstrual":
      // Manta que envuelve el cuerpo hasta el cuello
      return (
        <group>
          <mesh geometry={ball} material={lambert("#FFB84D")} position={[0, -0.28, 0]} scale={[1.2, 0.72, 1.14]} />
          <mesh
            geometry={box}
            material={lambert("#F28C5A")}
            position={[0, 0.13, 0.82]}
            rotation={[0.4, 0, 0]}
            scale={[1.3, 0.14, 0.34]}
          />
        </group>
      )
    case "folicular":
      // Brote en la cabeza
      return (
        <group position={[0, 0.98, 0]}>
          <mesh geometry={box} material={lambert("#47B45F")} position={[0, 0.16, 0]} scale={[0.1, 0.34, 0.1]} />
          <mesh
            geometry={box}
            material={lambert("#9BE564")}
            position={[0.18, 0.34, 0]}
            rotation={[0, 0, 0.4]}
            scale={[0.36, 0.12, 0.16]}
          />
          <mesh
            geometry={box}
            material={lambert("#9BE564")}
            position={[-0.18, 0.34, 0]}
            rotation={[0, 0, -0.4]}
            scale={[0.36, 0.12, 0.16]}
          />
        </group>
      )
    case "ovulatoria":
      // Sombrero de paja
      return (
        <group position={[0, 0.84, 0]} rotation={[-0.08, 0, 0.08]}>
          <mesh geometry={box} material={lambert("#FFD23F")} scale={[2, 0.1, 2]} />
          <mesh geometry={box} material={lambert("#FFD23F")} position={[0, 0.24, 0]} scale={[1.05, 0.46, 1.05]} />
          <mesh geometry={box} material={lambert("#F28C5A")} position={[0, 0.1, 0]} scale={[1.1, 0.14, 1.1]} />
        </group>
      )
    case "lutea":
      // Bufanda con su punta
      return (
        <group position={[0, -0.34, 0]}>
          <mesh geometry={ball} material={lambert("#D9622E")} scale={[1.05, 0.2, 1.02]} />
          <mesh
            geometry={box}
            material={lambert("#F28C5A")}
            position={[0.46, -0.3, 0.86]}
            rotation={[0.2, 0, 0.1]}
            scale={[0.3, 0.56, 0.12]}
          />
        </group>
      )
  }
}

interface Props {
  phase: Phase
  onPoke?: (position: THREE.Vector3) => void
}

// Mochi: un espíritu redondo hecho solo con primitivas. Respira, parpadea, sigue al puntero
// y da un brinco al tocarlo. Su energía cambia con la estación.
export default function Mochi({ phase, onPoke }: Props) {
  const root = useRef<THREE.Group>(null)
  const face = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Mesh>(null)
  const armR = useRef<THREE.Mesh>(null)
  const anim = useRef({ jump: 0, hover: false, hoverAmt: 0, blink: 2.5 })
  const style = SEASONS[phase].mochi

  useFrame((state, delta) => {
    if (!root.current || !face.current || !eyes.current || !armL.current || !armR.current) return
    const dt = Math.min(delta, 0.1)
    const a = anim.current
    const t = state.clock.elapsedTime

    a.hoverAmt = damp(a.hoverAmt, a.hover ? 1 : 0, 8, dt)
    a.jump = Math.max(0, a.jump - dt / 0.9)
    const arc = a.jump > 0 ? Math.sin((1 - a.jump) * Math.PI) : 0

    // Saltitos propios de la estación
    let hop = 0
    if (style.hopEvery > 0) {
      const progress = (t % style.hopEvery) / 0.5
      if (progress < 1) hop = Math.sin(progress * Math.PI) * style.hopHeight
    }

    const breath = 1 + Math.sin(t * style.breath) * 0.035 + arc * 0.14 + hop * 0.1
    root.current.scale.set(1 / Math.sqrt(breath), breath, 1 / Math.sqrt(breath))
    root.current.position.y = arc * 1.4 + hop
    root.current.rotation.y = a.jump > 0 ? (1 - a.jump) * Math.PI * 2 : 0

    // La cara sigue al puntero
    root.current.getWorldPosition(tmp)
    const px = (state.pointer.x * state.viewport.width) / 2
    const py = (state.pointer.y * state.viewport.height) / 2
    face.current.rotation.y = damp(
      face.current.rotation.y,
      clamp((px - tmp.x) * 0.14, -0.55, 0.55),
      style.lookSpeed,
      dt
    )
    face.current.rotation.x = damp(
      face.current.rotation.x,
      clamp(-(py - tmp.y) * 0.1, -0.3, 0.3),
      style.lookSpeed,
      dt
    )

    // Parpadeo. Al tocarlo abre los ojos aunque tenga sueño
    a.blink -= dt
    if (a.blink < -0.14) a.blink = 2 + Math.random() * 3.5
    const open = Math.max(style.eyes, a.hoverAmt, arc)
    eyes.current.scale.y = a.blink < 0 ? 0.12 : open

    // Saludo
    const cycle = t % 6
    const greet = cycle < 2 ? Math.sin((cycle / 2) * Math.PI) * style.wave : 0
    const wave = Math.max(greet, arc, a.hoverAmt * 0.6)
    armR.current.position.y = -0.2 + wave * 0.75 + Math.sin(t * 11) * 0.07 * wave
    armL.current.position.y = -0.2 + arc * 0.75
  })

  function handleOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    anim.current.hover = true
    document.body.style.cursor = "pointer"
  }

  function handleOut() {
    anim.current.hover = false
    document.body.style.cursor = ""
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (anim.current.jump > 0 || !root.current) return
    anim.current.jump = 1
    root.current.getWorldPosition(tmp)
    onPoke?.(tmp.clone())
  }

  return (
    <group ref={root}>
      <mesh geometry={ball} material={lambert(BODY)} scale={[1.08, 0.94, 1.02]} />
      <mesh ref={armL} geometry={ball} material={lambert(BODY)} position={[-1.05, -0.2, 0.15]} scale={0.24} />
      <mesh ref={armR} geometry={ball} material={lambert(BODY)} position={[1.05, -0.2, 0.15]} scale={0.24} />
      <mesh geometry={ball} material={lambert(BODY)} position={[-0.5, -0.88, 0.25]} scale={[0.28, 0.14, 0.3]} />
      <mesh geometry={ball} material={lambert(BODY)} position={[0.5, -0.88, 0.25]} scale={[0.28, 0.14, 0.3]} />

      <group ref={face}>
        <group ref={eyes} position={[0, 0.1, 0.97]}>
          <mesh geometry={box} material={lambert(INK)} position={[-0.34, 0, 0]} scale={[0.17, 0.26, 0.08]} />
          <mesh geometry={box} material={lambert(INK)} position={[0.34, 0, 0]} scale={[0.17, 0.26, 0.08]} />
        </group>
        <mesh
          geometry={box}
          material={lambert(BLUSH)}
          position={[-0.62, -0.12, 0.83]}
          rotation={[0, -0.6, 0]}
          scale={[0.26, 0.12, 0.06]}
        />
        <mesh
          geometry={box}
          material={lambert(BLUSH)}
          position={[0.62, -0.12, 0.83]}
          rotation={[0, 0.6, 0]}
          scale={[0.26, 0.12, 0.06]}
        />
        <mesh geometry={box} material={lambert(INK)} position={[0, -0.1, 1]} scale={[0.16, 0.05, 0.05]} />
      </group>

      <Outfit phase={phase} />

      {/* Zona invisible para detectar el puntero sobre todo Mochi */}
      <mesh
        geometry={ball}
        material={invisible}
        scale={1.5}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      />
    </group>
  )
}
