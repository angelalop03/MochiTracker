import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { Phase } from "../lib/cycle"
import { SEASONS } from "./seasons"
import { box, lambert, seeded, visibleHeight } from "./shapes"

const matrix = new THREE.Matrix4()
const position = new THREE.Vector3()
const rotation = new THREE.Quaternion()
const euler = new THREE.Euler()
const scale = new THREE.Vector3()
const color = new THREE.Color()
const white = new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true })

const mod = (n: number, m: number) => ((n % m) + m) % m

interface FloatersProps {
  phase: Phase
  count: number
  parallax: boolean
}

// Nieve, polen, chispas u hojas según la estación, todo en una sola llamada de dibujo
function Particles({ phase, count, parallax }: FloatersProps) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const season = SEASONS[phase].particles
  const size = useThree((s) => s.size)

  const items = useMemo(() => {
    const rand = seeded(23)
    return Array.from({ length: count }, () => ({
      x: rand() - 0.5,
      y: rand(),
      z: -1 - rand() * 6,
      speed: 0.6 + rand() * 0.8,
      offset: rand() * Math.PI * 2,
      size: 0.7 + rand() * 0.7,
      tint: Math.floor(rand() * 8),
    }))
  }, [count])

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    const aspect = size.width / size.height
    const scroll = parallax ? window.scrollY / size.height : 0

    items.forEach((p, i) => {
      const visH = visibleHeight(p.z)
      const travel = t * season.speed * p.speed * 0.12 * (season.rise ? -1 : 1)
      const y = mod(p.y + travel - scroll * 0.3, 1)
      position.set(
        p.x * visH * aspect + Math.sin(t * 0.8 + p.offset) * season.sway * 0.4,
        (0.5 - y) * visH,
        p.z
      )
      euler.set(t * 0.7 + p.offset, t * 0.5, 0)
      rotation.setFromEuler(euler)
      scale.setScalar(season.size * p.size)
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
      mesh.setColorAt(i, color.set(season.colors[p.tint % season.colors.length]!))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[box, white, count]} frustumCulled={false} />
}

const CLOUDS = (() => {
  const rand = seeded(5)
  return Array.from({ length: 5 }, (_, i) => ({
    x: (i % 2 === 0 ? -1 : 1) * (0.3 + rand() * 0.2),
    y: i / 5 + rand() * 0.1,
    z: -6 - rand() * 4,
    speed: 0.3 + rand() * 0.3,
    drift: 0.08 + rand() * 0.1,
    size: 0.8 + rand() * 0.6,
  }))
})()

// Nubes de bloques con parallax: se mueven más despacio que el scroll
function Clouds({ phase, parallax }: Omit<FloatersProps, "count">) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const material = lambert(SEASONS[phase].cloud)

  useFrame(({ clock, size }) => {
    const t = clock.elapsedTime
    const aspect = size.width / size.height
    const scroll = parallax ? window.scrollY / size.height : 0
    CLOUDS.forEach((c, i) => {
      const g = groups.current[i]
      if (!g) return
      const visH = visibleHeight(c.z)
      const span = visH * aspect + 6
      g.position.set(
        mod(c.x * visH * aspect + t * c.drift + span / 2, span) - span / 2,
        (0.5 - mod(c.y - scroll * c.speed, 1.2)) * visH,
        c.z
      )
    })
  })

  return CLOUDS.map((c, i) => (
    <group
      key={i}
      ref={(el) => {
        groups.current[i] = el
      }}
      scale={c.size}
    >
      <mesh geometry={box} material={material} scale={[3, 0.7, 1]} />
      <mesh geometry={box} material={material} position={[-0.3, 0.5, 0]} scale={[1.6, 0.6, 1]} />
      <mesh geometry={box} material={material} position={[0.7, 0.35, 0]} scale={[1, 0.4, 1]} />
    </group>
  ))
}

export default function Floaters({ phase, count, parallax }: FloatersProps) {
  return (
    <>
      <Clouds phase={phase} parallax={parallax} />
      <Particles phase={phase} count={count} parallax={parallax} />
    </>
  )
}
