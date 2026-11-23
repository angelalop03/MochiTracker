// Lo que le has dado a Mochi en «Cuida a Mochi», para que se vea en la isla.
// Una mano para cada cosa: la derecha (x > 0), la izquierda (x < 0), y el resto en el cuerpo.

import * as THREE from "three"
import type { CareId } from "../content/care"
import { box, round, smooth } from "./shapes"

const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16)
const fan = new THREE.CircleGeometry(1, 16, 0, Math.PI)

const RIGHT: [number, number, number] = [1.08, -0.12, 0.42]
const LEFT: [number, number, number] = [-1.08, -0.12, 0.42]

function Item({ id }: { id: CareId }) {
  switch (id) {
    case "manta":
      // Manta a cuadros que le arropa
      return (
        <group position={[0, -0.72, 0]}>
          <mesh geometry={round} material={smooth("#B9A6F2")} scale={[1.2, 0.42, 1.14]} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[0, 0.08, 0]} scale={[1.21, 0.06, 1.15]} />
          <mesh geometry={round} material={smooth("#8E7CC3")} position={[0, -0.12, 0]} scale={[1.21, 0.05, 1.15]} />
        </group>
      )
    case "bolsa":
      return (
        <group position={[0, -0.32, 0.92]} rotation={[0.2, 0, 0]}>
          <mesh geometry={round} material={smooth("#F28B8B")} scale={[0.34, 0.4, 0.12]} />
          <mesh geometry={box} material={smooth("#8E7CC3")} position={[0, 0.42, 0]} scale={[0.14, 0.12, 0.1]} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[-0.14, 0.12, 0.1]} scale={[0.05, 0.12, 0.03]} />
        </group>
      )
    case "chocolate":
      return (
        <group position={RIGHT} rotation={[0.2, -0.3, -0.25]}>
          <mesh geometry={box} material={smooth("#6B4129")} scale={[0.32, 0.46, 0.08]} />
          <mesh geometry={box} material={smooth("#D9D2CC")} position={[0, -0.12, 0.01]} scale={[0.34, 0.24, 0.09]} />
          <mesh geometry={box} material={smooth("#F28FB3")} position={[0, -0.12, 0.02]} scale={[0.35, 0.06, 0.09]} />
        </group>
      )
    case "infusion":
      return (
        <group position={LEFT}>
          <mesh geometry={cylinder} material={smooth("#E88FA0")} scale={[0.2, 0.3, 0.2]} />
          <mesh geometry={cylinder} material={smooth("#B9784C")} position={[0, 0.151, 0]} scale={[0.17, 0.01, 0.17]} />
          <mesh geometry={round} material={smooth("#E88FA0")} position={[-0.22, 0, 0]} scale={[0.07, 0.11, 0.04]} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[0.02, 0.34, 0]} scale={0.06} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[-0.05, 0.48, 0]} scale={0.05} />
        </group>
      )
    case "regadera":
      return (
        <group position={RIGHT} rotation={[0, -0.4, -0.3]}>
          <mesh geometry={cylinder} material={smooth("#8CC8EE")} scale={[0.2, 0.3, 0.2]} />
          <mesh geometry={cylinder} material={smooth("#5F9FCB")} position={[0.27, 0.1, 0]} rotation={[0, 0, -0.9]} scale={[0.04, 0.34, 0.04]} />
          <mesh geometry={round} material={smooth("#5F9FCB")} position={[0, 0.24, 0]} scale={[0.16, 0.08, 0.03]} />
        </group>
      )
    case "fresas":
      return (
        <group position={LEFT}>
          <mesh geometry={round} material={smooth("#E8546A")} scale={[0.17, 0.2, 0.17]} />
          <mesh geometry={round} material={smooth("#5FAE6E")} position={[0, 0.18, 0]} scale={[0.13, 0.05, 0.13]} />
          <mesh geometry={round} material={smooth("#FFE2A8")} position={[0.06, 0.03, 0.15]} scale={0.025} />
          <mesh geometry={round} material={smooth("#FFE2A8")} position={[-0.06, -0.05, 0.15]} scale={0.025} />
        </group>
      )
    case "cometa":
      // Vuela por encima, atada a su mano
      return (
        <group>
          <mesh geometry={box} material={smooth("#F28FB3")} position={[1.9, 2.3, 0]} rotation={[0, 0, Math.PI / 4]} scale={[0.5, 0.5, 0.05]} />
          <mesh geometry={box} material={smooth("#FFFFFF")} position={[1.9, 2.3, 0.03]} rotation={[0, 0, Math.PI / 4]} scale={[0.18, 0.18, 0.05]} />
          <mesh geometry={box} material={smooth("#8E7CC3")} position={[1.5, 0.9, 0.2]} rotation={[0, 0, 0.35]} scale={[0.02, 2.6, 0.02]} />
        </group>
      )
    case "limonada":
      return (
        <group position={RIGHT}>
          <mesh geometry={cylinder} material={smooth("#F5D76E")} scale={[0.17, 0.36, 0.17]} />
          <mesh geometry={cylinder} material={smooth("#F28FB3")} position={[0.05, 0.28, 0]} rotation={[0, 0, -0.25]} scale={[0.025, 0.36, 0.025]} />
          <mesh geometry={round} material={smooth("#B5E4A6")} position={[-0.17, 0.17, 0]} scale={[0.09, 0.09, 0.03]} />
        </group>
      )
    case "abanico":
      return (
        <group position={[-1.12, 0.05, 0.42]} rotation={[0, 0.3, 0.4]}>
          <mesh geometry={fan} material={new THREE.MeshLambertMaterial({ color: "#E88FA0", side: THREE.DoubleSide })} scale={0.38} />
          <mesh geometry={box} material={smooth("#8A5A3C")} position={[0, -0.12, 0]} scale={[0.04, 0.24, 0.03]} />
        </group>
      )
    case "cascos":
      return (
        <group position={[0, 0.15, 0]}>
          <mesh geometry={new THREE.TorusGeometry(1.02, 0.05, 8, 24, Math.PI)} material={smooth("#3A2A38")} />
          <mesh geometry={round} material={smooth("#F28FB3")} position={[-1.02, 0, 0.05]} scale={[0.14, 0.24, 0.22]} />
          <mesh geometry={round} material={smooth("#F28FB3")} position={[1.02, 0, 0.05]} scale={[0.14, 0.24, 0.22]} />
        </group>
      )
    default:
      return null
  }
}

/** Todo lo que le has dado hoy */
export default function CareItems({ items }: { items: readonly CareId[] }) {
  return (
    <>
      {items.map((id) => (
        <Item key={id} id={id} />
      ))}
    </>
  )
}
