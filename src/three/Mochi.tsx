import { useRef } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { isAvatarId } from "../components/MochiAvatar"
import type { Phase } from "../lib/cycle"
import Accessory, { coversHead, FaceAccessory, replacesBow } from "./Accessory"
import { SEASONS } from "./seasons"
import { lambert, round, smooth } from "./shapes"

const INK = "#4A2F45"
const BODY = "#FFF9F2"
const BLUSH = "#FBB3C4"

const tmp = new THREE.Vector3()
const { clamp, damp } = THREE.MathUtils
const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

function Bow({ color }: { color: string }) {
  const m = smooth(color)
  return (
    <group position={[0.58, 0.72, 0.42]} rotation={[0.1, 0.35, -0.5]}>
      <mesh geometry={round} material={m} position={[-0.2, 0, 0]} scale={[0.22, 0.15, 0.09]} />
      <mesh geometry={round} material={m} position={[0.2, 0, 0]} scale={[0.22, 0.15, 0.09]} />
      <mesh geometry={round} material={m} scale={[0.08, 0.08, 0.09]} />
    </group>
  )
}

/** Ropa de cada estación. Sin lo de la cabeza si el accesorio del avatar ya la ocupa */
function Outfit({ phase, headFree }: { phase: Phase; headFree: boolean }) {
  if (!headFree && (phase === "folicular" || phase === "ovulatoria")) return null
  switch (phase) {
    case "menstrual":
      // Mantita que le arropa por debajo de la cara
      return (
        <mesh geometry={round} material={smooth("#F7C9D6")} position={[0, -0.74, 0]} scale={[1.18, 0.42, 1.12]} />
      )
    case "folicular":
      // Brotecito en la cabeza
      return (
        <group position={[-0.1, 0.94, 0]}>
          <mesh geometry={round} material={smooth("#8CCB8E")} position={[0, 0.14, 0]} scale={[0.05, 0.18, 0.05]} />
          <mesh
            geometry={round}
            material={smooth("#B5E4A6")}
            position={[0.15, 0.3, 0]}
            rotation={[0, 0, 0.5]}
            scale={[0.18, 0.08, 0.08]}
          />
          <mesh
            geometry={round}
            material={smooth("#B5E4A6")}
            position={[-0.15, 0.3, 0]}
            rotation={[0, 0, -0.5]}
            scale={[0.18, 0.08, 0.08]}
          />
        </group>
      )
    case "ovulatoria":
      // Pamela de verano
      return (
        <group position={[0, 0.74, 0]} rotation={[-0.1, 0, 0.1]}>
          <mesh geometry={round} material={smooth("#FFE7B0")} scale={[1.35, 0.07, 1.35]} />
          <mesh geometry={round} material={smooth("#FFE7B0")} position={[0, 0.18, 0]} scale={[0.68, 0.34, 0.68]} />
          <mesh geometry={round} material={smooth("#F4889F")} position={[0, 0.1, 0]} scale={[0.7, 0.09, 0.7]} />
        </group>
      )
    case "lutea":
      // Bufanda suave con su punta
      return (
        <group position={[0, -0.36, 0]}>
          <mesh geometry={round} material={smooth("#E88FA0")} scale={[1.04, 0.19, 1.02]} />
          <mesh
            geometry={round}
            material={smooth("#F2AEB9")}
            position={[0.46, -0.3, 0.84]}
            rotation={[0.2, 0, 0.1]}
            scale={[0.16, 0.3, 0.07]}
          />
        </group>
      )
  }
}

interface Props {
  phase: Phase
  /** El Mochi elegido como foto de perfil: lleva su accesorio */
  avatar?: string | null
  onPoke?: (position: THREE.Vector3) => void
}

// Mochi: un espíritu redondo hecho solo con primitivas. Respira, parpadea, sigue al puntero
// y da un brinco al tocarlo. Su energía cambia con la estación.
export default function Mochi({ phase, avatar: chosen, onPoke }: Props) {
  const avatar = isAvatarId(chosen) ? chosen : null
  const root = useRef<THREE.Group>(null)
  const face = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Mesh>(null)
  const armR = useRef<THREE.Mesh>(null)
  const anim = useRef({ jump: 0, hover: false, hoverAmt: 0, blink: 2.5 })
  const season = SEASONS[phase]
  const style = season.mochi

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
      <mesh geometry={round} material={smooth(BODY)} scale={[1.08, 0.94, 1.02]} />
      <mesh ref={armL} geometry={round} material={smooth(BODY)} position={[-1.05, -0.2, 0.15]} scale={0.24} />
      <mesh ref={armR} geometry={round} material={smooth(BODY)} position={[1.05, -0.2, 0.15]} scale={0.24} />
      <mesh geometry={round} material={smooth(BODY)} position={[-0.5, -0.88, 0.25]} scale={[0.28, 0.14, 0.3]} />
      <mesh geometry={round} material={smooth(BODY)} position={[0.5, -0.88, 0.25]} scale={[0.28, 0.14, 0.3]} />

      <group ref={face}>
        {/* Ojitos redondos con su brillo */}
        <group ref={eyes} position={[0, 0.1, 0.93]}>
          <mesh geometry={round} material={smooth(INK)} position={[-0.36, 0, 0]} scale={[0.14, 0.18, 0.06]} />
          <mesh geometry={round} material={smooth(INK)} position={[0.36, 0, 0]} scale={[0.14, 0.18, 0.06]} />
          <mesh geometry={round} material={lambert("#FFFFFF")} position={[-0.31, 0.07, 0.06]} scale={0.05} />
          <mesh geometry={round} material={lambert("#FFFFFF")} position={[0.41, 0.07, 0.06]} scale={0.05} />
        </group>
        <mesh geometry={round} material={smooth(BLUSH)} position={[-0.6, -0.12, 0.78]} scale={[0.19, 0.11, 0.05]} />
        <mesh geometry={round} material={smooth(BLUSH)} position={[0.6, -0.12, 0.78]} scale={[0.19, 0.11, 0.05]} />
        <mesh geometry={round} material={smooth("#D9798F")} position={[0, -0.1, 0.96]} scale={[0.07, 0.04, 0.03]} />
        <FaceAccessory avatar={avatar} />
      </group>

      {phase !== "ovulatoria" && !replacesBow(avatar) && <Bow color={season.bow} />}
      <Outfit phase={phase} headFree={!coversHead(avatar)} />
      <Accessory avatar={avatar} />

      {/* Zona invisible para detectar el puntero sobre todo Mochi */}
      <mesh
        geometry={round}
        material={invisible}
        scale={1.5}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      />
    </group>
  )
}
