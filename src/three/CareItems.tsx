// Lo que le has dado o lo que está haciendo en «Cuida a Mochi», para que se vea en la isla.
// La mano derecha (x > 0) sujeta lo que come o usa; lo demás va en el cuerpo, la cabeza o el suelo.

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { CareId } from "../content/care"
import { box, round, smooth } from "./shapes"

const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16)
const banana = new THREE.TorusGeometry(0.22, 0.06, 8, 16, Math.PI * 0.8)
const band = new THREE.TorusGeometry(1.0, 0.07, 8, 32)
const ring = new THREE.TorusGeometry(1.5, 0.09, 8, 48)
const glass = new THREE.MeshLambertMaterial({ color: "#CFE6F2", transparent: true, opacity: 0.55 })
const bubble = new THREE.MeshLambertMaterial({ color: "#E3F2FA", transparent: true, opacity: 0.8 })
const aura = new THREE.MeshBasicMaterial({ color: "#8FD4A3", transparent: true, opacity: 0.75 })

const R: [number, number, number] = [1.08, -0.12, 0.42]
const L: [number, number, number] = [-1.08, -0.05, 0.5]

/** Un bol con algo encima */
function Bowl({ color, children }: { color: string; children?: React.ReactNode }) {
  return (
    <group position={R} scale={1.4}>
      <mesh geometry={cylinder} material={smooth(color)} scale={[0.24, 0.14, 0.24]} />
      {children}
    </group>
  )
}

/** Cosas que giran despacio alrededor de un punto */
function Orbit({ radius, speed, y = 0, children }: { radius: number; speed: number; y?: number; children: React.ReactNode[] }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * speed
  })
  return (
    <group ref={group} position={[0, y, 0]}>
      {children.map((child, i) => {
        const a = (i / children.length) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a) * radius, Math.sin(a * 2) * 0.15, Math.sin(a) * radius]}>
            {child}
          </group>
        )
      })}
    </group>
  )
}

/** Un anillo que crece y se encoge, como una respiración */
function Aura() {
  const mesh = useRef<THREE.Group>(null)
  useFrame((state) => {
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.12
    mesh.current?.scale.setScalar(s)
  })
  return (
    <group ref={mesh} position={[0, -0.2, 0]}>
      <mesh geometry={ring} material={aura} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={ring} material={aura} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} scale={0.8} />
    </group>
  )
}

/** Notas musicales que suben */
function Notes() {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    group.current?.children.forEach((note, i) => {
      const p = (state.clock.elapsedTime * 0.4 + i / 3) % 1
      note.position.set(1.1 + Math.sin(p * 6 + i) * 0.3, 0.4 + p * 1.6, 0.3)
      note.scale.setScalar(Math.sin(p * Math.PI))
    })
  })
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh geometry={round} material={smooth("#3A2A38")} scale={[0.1, 0.08, 0.06]} />
          <mesh geometry={box} material={smooth("#3A2A38")} position={[0.08, 0.16, 0]} scale={[0.03, 0.32, 0.03]} />
        </group>
      ))}
    </group>
  )
}

function Item({ id }: { id: CareId }) {
  switch (id) {
    // ------------------------------------------------------------ comer y beber
    case "lentejas":
      return (
        <Bowl color="#F6A9BB">
          <mesh geometry={cylinder} material={smooth("#8A5A3C")} position={[0, 0.07, 0]} scale={[0.21, 0.02, 0.21]} />
          <mesh geometry={round} material={smooth("#C98B5A")} position={[0.06, 0.09, 0.05]} scale={0.04} />
          <mesh geometry={round} material={smooth("#C98B5A")} position={[-0.07, 0.09, -0.02]} scale={0.04} />
        </Bowl>
      )
    case "chocolate":
      return (
        <group position={R} scale={1.4} rotation={[0.2, -0.3, -0.25]}>
          <mesh geometry={box} material={smooth("#6B4129")} scale={[0.32, 0.46, 0.08]} />
          <mesh geometry={box} material={smooth("#D9D2CC")} position={[0, -0.12, 0.01]} scale={[0.34, 0.24, 0.09]} />
        </group>
      )
    case "frutos":
      return (
        <Bowl color="#B9A6F2">
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              geometry={round}
              material={smooth(i % 2 ? "#8A5A3C" : "#C98B5A")}
              position={[Math.cos(i * 1.6) * 0.1, 0.1, Math.sin(i * 1.6) * 0.1]}
              scale={[0.07, 0.05, 0.05]}
            />
          ))}
        </Bowl>
      )
    case "platano":
      return (
        <group position={R} scale={1.4} rotation={[0, 0, 1.2]}>
          <mesh geometry={banana} material={smooth("#F5D76E")} />
          <mesh geometry={round} material={smooth("#8A5A3C")} position={[0.22, 0, 0]} scale={0.05} />
        </group>
      )
    case "naranja":
      return (
        <group position={R} scale={1.4}>
          <mesh geometry={round} material={smooth("#F2A65A")} scale={0.19} />
          <mesh geometry={round} material={smooth("#5FAE6E")} position={[0.04, 0.19, 0]} rotation={[0, 0, 0.6]} scale={[0.08, 0.03, 0.04]} />
        </group>
      )
    case "ensalada":
      return (
        <Bowl color="#E9E2DC">
          <mesh geometry={round} material={smooth("#7CC58A")} position={[0, 0.1, 0]} scale={[0.2, 0.08, 0.2]} />
          <mesh geometry={round} material={smooth("#E8546A")} position={[0.08, 0.15, 0.04]} scale={0.05} />
          <mesh geometry={round} material={smooth("#FFF4D6")} position={[-0.07, 0.15, 0.02]} scale={[0.06, 0.04, 0.05]} />
        </Bowl>
      )
    case "agua":
      return (
        <group position={R} scale={1.4}>
          <mesh geometry={cylinder} material={glass} scale={[0.15, 0.36, 0.15]} />
          <mesh geometry={cylinder} material={smooth("#8CC8EE")} position={[0, -0.04, 0]} scale={[0.13, 0.26, 0.13]} />
        </group>
      )
    case "infusion":
    case "cafe":
      return (
        <group position={R} scale={1.4}>
          <mesh geometry={cylinder} material={smooth(id === "cafe" ? "#E9E2DC" : "#E88FA0")} scale={[0.19, 0.28, 0.19]} />
          <mesh
            geometry={cylinder}
            material={smooth(id === "cafe" ? "#4A2F1F" : "#B9784C")}
            position={[0, 0.141, 0]}
            scale={[0.16, 0.01, 0.16]}
          />
          <mesh geometry={round} material={smooth(id === "cafe" ? "#E9E2DC" : "#E88FA0")} position={[0.21, 0, 0]} scale={[0.07, 0.1, 0.04]} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[0.02, 0.32, 0]} scale={0.06} />
          <mesh geometry={round} material={smooth("#FFFFFF")} position={[-0.05, 0.46, 0]} scale={0.05} />
        </group>
      )
    case "patatas":
      return (
        <group position={R} scale={1.4} rotation={[0, -0.3, -0.15]}>
          <mesh geometry={box} material={smooth("#F5C94A")} scale={[0.3, 0.4, 0.1]} />
          <mesh geometry={box} material={smooth("#E8546A")} position={[0, 0.16, 0.01]} scale={[0.31, 0.08, 0.1]} />
        </group>
      )

    // ------------------------------------------------------------------- cuerpo
    case "manta":
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
        </group>
      )
    case "bano":
      return (
        <Orbit radius={1.25} speed={0.6} y={-0.4}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} geometry={round} material={bubble} scale={0.12 + (i % 3) * 0.05} />
          ))}
        </Orbit>
      )
    case "masaje":
      return (
        <group position={[0, -0.3, 0.6]}>
          <Orbit radius={0.45} speed={1.6}>
            {[0, 1, 2].map((i) => (
              <group key={i}>
                <mesh geometry={round} material={smooth("#E8546A")} position={[-0.04, 0, 0]} scale={0.05} />
                <mesh geometry={round} material={smooth("#E8546A")} position={[0.04, 0, 0]} scale={0.05} />
                <mesh geometry={round} material={smooth("#E8546A")} position={[0, -0.05, 0]} scale={0.045} />
              </group>
            ))}
          </Orbit>
        </group>
      )
    case "limpieza":
      return (
        <group>
          <mesh geometry={band} material={smooth("#FFFFFF")} position={[0, 0.55, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]} scale={[1.02, 1.02, 1.6]} />
          {[-0.62, 0.62, 0.45].map((x, i) => (
            <mesh key={i} geometry={round} material={bubble} position={[x, -0.05 + i * 0.12, 0.8]} scale={0.08} />
          ))}
        </group>
      )
    case "crema":
      return (
        <group position={R} scale={1.4}>
          <mesh geometry={cylinder} material={smooth("#F6A9BB")} scale={[0.17, 0.16, 0.17]} />
          <mesh geometry={cylinder} material={smooth("#B9A6F2")} position={[0, 0.11, 0]} scale={[0.18, 0.06, 0.18]} />
        </group>
      )
    case "protector":
      return (
        <group position={R} scale={1.4} rotation={[0, 0, -0.3]}>
          <mesh geometry={box} material={smooth("#F2A65A")} scale={[0.16, 0.38, 0.1]} />
          <mesh geometry={box} material={smooth("#FFE2A8")} position={[0, 0, 0.01]} scale={[0.12, 0.2, 0.1]} />
          <mesh geometry={cylinder} material={smooth("#8E7CC3")} position={[0, -0.24, 0]} scale={[0.06, 0.1, 0.06]} />
        </group>
      )

    // ------------------------------------------------------------------ moverse
    case "paseo":
      return (
        <group>
          {[-0.5, 0.5].map((x) => (
            <group key={x} position={[x, -0.92, 0.3]}>
              <mesh geometry={box} material={smooth("#F28FB3")} scale={[0.36, 0.14, 0.44]} />
              <mesh geometry={box} material={smooth("#FFFFFF")} position={[0, -0.07, 0]} scale={[0.38, 0.05, 0.46]} />
            </group>
          ))}
        </group>
      )
    case "yoga":
      return (
        <group position={[0, -0.95, 0.55]} rotation={[0.85, 0, 0]}>
          <mesh geometry={box} material={smooth("#F28FB3")} scale={[3.2, 0.1, 1.9]} />
          <mesh geometry={box} material={smooth("#FFFFFF")} position={[0, 0.03, 0]} scale={[3, 0.1, 0.12]} />
          <mesh geometry={cylinder} material={smooth("#E06A94")} position={[1.7, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.16, 1.9, 0.16]} />
        </group>
      )
    case "fuerza":
      return (
        <group position={R} scale={1.4} rotation={[0, 0, Math.PI / 2]}>
          <mesh geometry={cylinder} material={smooth("#B8A9B2")} scale={[0.03, 0.5, 0.03]} />
          <mesh geometry={cylinder} material={smooth("#6B5E66")} position={[0, 0.25, 0]} scale={[0.13, 0.08, 0.13]} />
          <mesh geometry={cylinder} material={smooth("#6B5E66")} position={[0, -0.25, 0]} scale={[0.13, 0.08, 0.13]} />
        </group>
      )
    case "cardio":
      return <mesh geometry={band} material={smooth("#F28FB3")} position={[0, 0.55, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]} scale={[1.02, 1.02, 1.4]} />
    case "bailar":
      return <Notes />

    // --------------------------------------------------------- mente y descanso
    case "diario":
      return (
        <group position={R} scale={1.4} rotation={[0.3, -0.4, -0.2]}>
          <mesh geometry={box} material={smooth("#8E7CC3")} scale={[0.32, 0.4, 0.06]} />
          <mesh geometry={box} material={smooth("#FFFFFF")} position={[0, 0, 0.02]} scale={[0.26, 0.34, 0.04]} />
          <mesh geometry={box} material={smooth("#F5C94A")} position={[0.18, 0.1, 0.06]} rotation={[0, 0, -0.6]} scale={[0.04, 0.34, 0.04]} />
        </group>
      )
    case "amiga":
      return (
        <group>
          <group position={L} rotation={[0, 0.4, 0.2]}>
            <mesh geometry={box} material={smooth("#3A2A38")} scale={[0.18, 0.32, 0.04]} />
            <mesh geometry={box} material={smooth("#F6A9BB")} position={[0, 0, 0.01]} scale={[0.14, 0.26, 0.04]} />
          </group>
          <group position={[-0.9, 1.05, 0.4]} scale={1.4}>
            <mesh geometry={round} material={smooth("#E8546A")} position={[-0.05, 0, 0]} scale={0.07} />
            <mesh geometry={round} material={smooth("#E8546A")} position={[0.05, 0, 0]} scale={0.07} />
            <mesh geometry={round} material={smooth("#E8546A")} position={[0, -0.07, 0]} scale={0.06} />
          </group>
        </group>
      )
    case "respirar":
      return <Aura />
    case "desconectar":
      return (
        <group position={[1.35, -0.98, 0.5]} rotation={[-Math.PI / 2, 0, 0.4]}>
          <mesh geometry={box} material={smooth("#3A2A38")} scale={[0.22, 0.38, 0.04]} />
        </group>
      )
    case "dormir":
      // Duerme sobre su almohada
      return <mesh geometry={round} material={smooth("#C9D4F2")} position={[0, -0.95, -0.4]} scale={[1, 0.2, 0.6]} />
    default:
      return null
  }
}

/** Todo lo que lleva o está haciendo ahora */
export default function CareItems({ items }: { items: readonly CareId[] }) {
  return (
    <>
      {items.map((id) => (
        <Item key={id} id={id} />
      ))}
    </>
  )
}
