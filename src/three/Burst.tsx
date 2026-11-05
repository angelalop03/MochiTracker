import { useImperativeHandle, useRef, type Ref } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { box, lambert } from "./shapes"

const COUNT = 14
const COLORS = ["#FFD23F", "#FFB84D", "#F28C5A", "#9BE564", "#FFF4DC"]

export interface BurstHandle {
  burst: (origin: THREE.Vector3, scale: number) => void
}

// Píxeles que salen de Mochi al tocarlo
export default function Burst({ ref }: { ref: Ref<BurstHandle> }) {
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const particles = useRef(
    Array.from({ length: COUNT }, () => ({ life: 0, size: 1, velocity: new THREE.Vector3() }))
  )

  useImperativeHandle(ref, () => ({
    burst(origin, scale) {
      particles.current.forEach((p, i) => {
        const mesh = meshes.current[i]
        if (!mesh) return
        p.life = 1
        p.size = scale * (0.16 + Math.random() * 0.16)
        p.velocity
          .set((Math.random() - 0.5) * 6, 3 + Math.random() * 3.5, Math.random() * 2)
          .multiplyScalar(scale)
        mesh.position.copy(origin)
        mesh.visible = true
      })
    },
  }))

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    particles.current.forEach((p, i) => {
      const mesh = meshes.current[i]
      if (p.life <= 0 || !mesh) return
      p.life -= dt / 1.2
      p.velocity.y -= 5 * dt
      mesh.position.addScaledVector(p.velocity, dt)
      mesh.scale.setScalar(p.size * Math.min(1, p.life * 3))
      if (p.life <= 0) mesh.visible = false
    })
  })

  return Array.from({ length: COUNT }, (_, i) => (
    <mesh
      key={i}
      ref={(el) => {
        meshes.current[i] = el
      }}
      geometry={box}
      material={lambert(COLORS[i % COLORS.length]!)}
      visible={false}
    />
  ))
}
