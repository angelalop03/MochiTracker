// El accesorio del avatar elegido, para que el Mochi de la isla sea el mismo que el del perfil.
// Hecho con primitivas, como el resto de Mochi.

import * as THREE from "three"
import type { AvatarId } from "../components/MochiAvatar"
import { round, smooth } from "./shapes"

const BODY = "#FFF9F2"
const cone = new THREE.ConeGeometry(1, 1, 16)

function starShape() {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}
const star = new THREE.ExtrudeGeometry(starShape(), { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 })
star.center()

/** Accesorios que van en la cabeza: quitan el lazo y el gorro o brote de la estación */
export function coversHead(avatar: AvatarId | null | undefined) {
  return avatar === "invierno" || avatar === "dormilon" || avatar === "gatito"
}

/** Accesorios que ocupan el sitio del lazo */
export function replacesBow(avatar: AvatarId | null | undefined) {
  return coversHead(avatar) || avatar === "primavera" || avatar === "otono" || avatar === "estrella"
}

/** Lo que va en la cara: sigue la mirada de Mochi */
export function FaceAccessory({ avatar }: { avatar: AvatarId | null | undefined }) {
  if (avatar !== "verano") return null
  const lens = smooth("#2B2440")
  return (
    <group position={[0, 0.1, 0]}>
      <mesh geometry={round} material={lens} position={[-0.36, 0, 0.97]} scale={[0.25, 0.2, 0.06]} />
      <mesh geometry={round} material={lens} position={[0.36, 0, 0.97]} scale={[0.25, 0.2, 0.06]} />
      <mesh geometry={round} material={lens} position={[0, 0.05, 1]} scale={[0.14, 0.035, 0.03]} />
      <mesh geometry={round} material={smooth("#8FA8E8")} position={[-0.29, 0.07, 1.02]} scale={[0.06, 0.04, 0.02]} />
      <mesh geometry={round} material={smooth("#8FA8E8")} position={[0.43, 0.07, 1.02]} scale={[0.06, 0.04, 0.02]} />
    </group>
  )
}

export default function Accessory({ avatar }: { avatar: AvatarId | null | undefined }) {
  switch (avatar) {
    case "invierno":
      // Gorro de lana con pompón
      return (
        <group>
          <mesh geometry={round} material={smooth("#8E7CC3")} position={[0, 0.78, 0]} scale={[0.92, 0.36, 0.9]} />
          <mesh geometry={round} material={smooth("#B9A6F2")} position={[0, 0.5, 0]} scale={[1, 0.13, 0.98]} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[0, 1.18, 0]} scale={0.2} />
        </group>
      )
    case "dormilon":
      // Gorro de dormir que cae hacia un lado
      return (
        <group>
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[0, 0.5, 0]} scale={[1, 0.13, 0.98]} />
          <mesh geometry={round} material={smooth("#6E7FC8")} position={[0, 0.78, 0]} scale={[0.9, 0.32, 0.88]} />
          <mesh geometry={round} material={smooth("#6E7FC8")} position={[0.18, 1.04, 0]} scale={[0.55, 0.24, 0.55]} />
          <mesh geometry={round} material={smooth("#6E7FC8")} position={[0.45, 1.22, 0]} scale={[0.32, 0.17, 0.32]} />
          <mesh geometry={round} material={smooth("#8E9BD8")} position={[0.68, 1.27, 0]} scale={[0.18, 0.12, 0.18]} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[0.86, 1.2, 0]} scale={0.15} />
        </group>
      )
    case "gatito":
      // Orejitas de gato
      return (
        <group>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.55, 0.82, 0]} rotation={[0, 0, -side * 0.42]}>
              <mesh geometry={cone} material={smooth(BODY)} scale={[0.27, 0.5, 0.2]} />
              <mesh geometry={cone} material={smooth("#F6A9BB")} position={[0, -0.03, 0.09]} scale={[0.15, 0.32, 0.08]} />
            </group>
          ))}
        </group>
      )
    case "primavera":
      // Una flor en lugar del lazo
      return (
        <group position={[0.6, 0.76, 0.42]} rotation={[0.1, 0.35, -0.3]} scale={1.5}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            return (
              <mesh
                key={i}
                geometry={round}
                material={smooth("#F28FB3")}
                position={[Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0]}
                scale={[0.12, 0.12, 0.06]}
              />
            )
          })}
          <mesh geometry={round} material={smooth("#F5C94A")} position={[0, 0, 0.04]} scale={[0.09, 0.09, 0.06]} />
          <mesh geometry={round} material={smooth("#7CC58A")} position={[-0.2, -0.22, -0.02]} rotation={[0, 0, 0.7]} scale={[0.14, 0.06, 0.04]} />
        </group>
      )
    case "otono":
      // Una hoja de otoño en la cabeza
      return (
        <group position={[0.4, 0.95, 0.25]} rotation={[0.5, 0.3, -0.5]} scale={1.6}>
          <mesh geometry={round} material={smooth("#E07A4F")} scale={[0.3, 0.07, 0.17]} />
          <mesh geometry={round} material={smooth("#F2A07B")} position={[0.02, 0.03, 0]} scale={[0.22, 0.03, 0.04]} />
          <mesh geometry={round} material={smooth("#8A5A3C")} position={[-0.32, 0, 0]} scale={[0.08, 0.03, 0.03]} />
        </group>
      )
    case "estrella":
      // Una estrella brillante como horquilla
      return (
        <group position={[0.58, 0.74, 0.42]} rotation={[0.1, 0.35, -0.25]}>
          <mesh geometry={star} material={smooth("#F5C94A")} scale={0.32} />
        </group>
      )
    default:
      return null
  }
}
