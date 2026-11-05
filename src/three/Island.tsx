import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { Phase } from "../lib/cycle"
import { SEASONS, type Season } from "./seasons"
import { ball, box, lambert, seeded } from "./shapes"

const RADIUS = 5.4

interface Block {
  x: number
  y: number
  z: number
  layer: "grass" | "dirt" | "rock"
  alt: boolean
}

// La forma es siempre la misma: solo cambian los colores con la estación
const BLOCKS: Block[] = (() => {
  const rand = seeded(11)
  const list: Block[] = []
  for (let x = -6; x <= 6; x++) {
    for (let z = -6; z <= 6; z++) {
      const d = Math.hypot(x, z) + rand() * 0.9
      if (d > RADIUS + 0.4) continue
      const depth = Math.max(1, Math.round((RADIUS + 0.6 - d) * 1.05 + rand()))
      for (let i = 0; i < depth; i++) {
        list.push({
          x,
          y: -i,
          z,
          layer: i === 0 ? "grass" : i < 2 ? "dirt" : "rock",
          alt: rand() > 0.6,
        })
      }
    }
  }
  return list
})()

const matrix = new THREE.Matrix4()
const color = new THREE.Color()
const white = new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true })

function Ground({ season }: { season: Season }) {
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    BLOCKS.forEach((b, i) => {
      matrix.makeTranslation(b.x, b.y, b.z)
      mesh.setMatrixAt(i, matrix)
      const c = b.layer === "grass" ? season.grass[b.alt ? 1 : 0] : b.layer === "dirt" ? season.dirt : season.rock
      mesh.setColorAt(i, color.set(c))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [season])

  return <instancedMesh ref={ref} args={[box, white, BLOCKS.length]} />
}

type Vec3 = [number, number, number]

function Cube({ p, s = 1, c }: { p: Vec3; s?: number | Vec3; c: string }) {
  return <mesh geometry={box} material={lambert(c)} position={p} scale={s} />
}

function Tree({ p, season, tall = 1 }: { p: Vec3; season: Season; tall?: number }) {
  const [a, b] = season.canopy
  return (
    <group position={p} scale={tall}>
      <Cube p={[0, 1, 0]} s={[0.6, 2, 0.6]} c={season.trunk} />
      <Cube p={[0, 2.5, 0]} s={[2.2, 1.2, 2.2]} c={a} />
      <Cube p={[0, 3.4, 0]} s={[1.5, 0.9, 1.5]} c={b} />
      <Cube p={[0, 4.05, 0]} s={[0.8, 0.5, 0.8]} c={a} />
    </group>
  )
}

function Campfire({ p }: { p: Vec3 }) {
  const flame = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!flame.current) return
    const t = clock.elapsedTime
    flame.current.scale.y = 1 + Math.sin(t * 9) * 0.18 + Math.sin(t * 5.3) * 0.1
  })
  return (
    <group position={p}>
      <Cube p={[0, 0.1, 0]} s={[1.1, 0.22, 0.3]} c="#5A4372" />
      <Cube p={[0, 0.1, 0]} s={[0.3, 0.22, 1.1]} c="#7A5C8E" />
      <group ref={flame} position={[0, 0.2, 0]}>
        <Cube p={[0, 0.3, 0]} s={[0.5, 0.6, 0.5]} c="#F28C5A" />
        <Cube p={[0, 0.45, 0]} s={[0.3, 0.6, 0.3]} c="#FFD23F" />
      </group>
    </group>
  )
}

function Kite({ p }: { p: Vec3 }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.position.y = p[1] + Math.sin(t * 1.3) * 0.25
    ref.current.rotation.z = Math.PI / 4 + Math.sin(t * 1.9) * 0.14
  })
  return (
    <group ref={ref} position={p} rotation={[0, 0, Math.PI / 4]}>
      <Cube p={[0, 0, 0]} s={[1, 1, 0.1]} c="#FFB84D" />
      <Cube p={[0.25, 0.25, 0.06]} s={[0.5, 0.5, 0.08]} c="#FFF4DC" />
      <Cube p={[-0.65, -0.65, 0]} s={[0.25, 0.25, 0.08]} c="#3B3A6B" />
    </group>
  )
}

function Lantern({ p, c }: { p: Vec3; c: string }) {
  return (
    <group position={p}>
      <Cube p={[0, 1.1, 0]} s={[0.14, 2.2, 0.14]} c="#8A5A3C" />
      <Cube p={[0, 2.35, 0]} s={[0.55, 0.6, 0.55]} c={c} />
      <Cube p={[0, 2.72, 0]} s={[0.36, 0.1, 0.36]} c="#FFF4DC" />
    </group>
  )
}

function Mushroom({ p, c }: { p: Vec3; c: string }) {
  return (
    <group position={p}>
      <Cube p={[0, 0.2, 0]} s={[0.26, 0.4, 0.26]} c="#FFF4DC" />
      <Cube p={[0, 0.48, 0]} s={[0.66, 0.26, 0.66]} c={c} />
    </group>
  )
}

function Sun() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += Math.min(dt, 0.1) * 0.25
  })
  return (
    <group ref={ref} position={[-5.2, 7.2, -4]}>
      <mesh geometry={ball} material={lambert("#FFD23F")} scale={1.15} />
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
          <Cube p={[0, 0, 0]} s={[3.4, 0.28, 0.28]} c="#FFB84D" />
        </group>
      ))}
    </group>
  )
}

const SPROUTS: [number, number][] = [
  [-3.2, 2.1],
  [-1.8, 3.4],
  [3.6, -0.8],
  [1.4, 3.5],
]

const FALLEN_LEAVES: [number, number, string][] = [
  [-1.6, 3.4, "#F28C5A"],
  [0.8, 3.8, "#D9622E"],
  [-3.8, 0.6, "#FFB84D"],
  [1.9, -3.4, "#F28C5A"],
]

function Props({ phase }: { phase: Phase }) {
  switch (phase) {
    case "menstrual":
      return (
        <>
          <Campfire p={[2.7, 0.5, 1.6]} />
          <Cube p={[-3, 0.72, 2.2]} s={[0.9, 0.45, 0.9]} c="#FFF4DC" />
          <Cube p={[3.4, 0.62, -1.6]} s={[0.7, 0.25, 0.7]} c="#E6E3F2" />
        </>
      )
    case "folicular":
      return (
        <>
          <Kite p={[4.6, 7, -2]} />
          <Cube p={[2.9, 0.52, 1.8]} s={[1.8, 0.06, 1.2]} c="#7FD6E8" />
          {SPROUTS.map(([x, z]) => (
            <group key={x} position={[x, 0.5, z]}>
              <Cube p={[0, 0.16, 0]} s={[0.12, 0.32, 0.12]} c="#47B45F" />
              <Cube p={[0.12, 0.34, 0]} s={[0.24, 0.1, 0.14]} c="#C9F08C" />
              <Cube p={[-0.12, 0.26, 0]} s={[0.24, 0.1, 0.14]} c="#C9F08C" />
            </group>
          ))}
        </>
      )
    case "ovulatoria":
      return (
        <>
          <Sun />
          <Lantern p={[3.3, 0.5, 1.5]} c="#FFD23F" />
          <Lantern p={[-3.4, 0.5, 2]} c="#F28C5A" />
          <Cube p={[2, 0.56, 3.3]} s={[1.6, 0.1, 1]} c="#E8C37E" />
        </>
      )
    case "lutea":
      return (
        <>
          <Mushroom p={[2.6, 0.5, 2.2]} c="#D9622E" />
          <Mushroom p={[3.3, 0.5, 1.5]} c="#FFB84D" />
          <Mushroom p={[-3.2, 0.5, 2.3]} c="#D9622E" />
          <Lantern p={[3.6, 0.5, -1.2]} c="#FFB84D" />
          {FALLEN_LEAVES.map(([x, z, c]) => (
            <Cube key={x} p={[x, 0.52, z]} s={[0.4, 0.05, 0.3]} c={c} />
          ))}
        </>
      )
  }
}

const TREES: { p: Vec3; tall: number }[] = [
  { p: [-2.6, 0.5, -2.4], tall: 1.1 },
  { p: [1.6, 0.5, -3.2], tall: 0.85 },
  { p: [-4, 0.5, -0.4], tall: 0.7 },
]

export default function Island({ phase }: { phase: Phase }) {
  const season = SEASONS[phase]
  return (
    <group>
      <Ground season={season} />
      {TREES.map((t, i) => (
        <Tree key={i} p={t.p} tall={t.tall} season={season} />
      ))}
      <Props phase={phase} />
    </group>
  )
}
