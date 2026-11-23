import { lazy, Suspense, useState, type ReactNode } from "react"
import type { CareId, PokeMood } from "../content/care"
import type { Phase } from "../lib/cycle"
import { canUse3D } from "../three/support"
import StaticIsland from "./StaticIsland"

// Three.js se carga aparte, después del contenido, para que la pantalla aparezca antes
const Scene = lazy(() => import("../three/Scene"))

/** Marco con cielo y la isla: en 3D si se puede, en imagen estática si no */
export default function SkyPanel({
  phase,
  avatar,
  mood,
  items,
  onMochiPoke,
  children,
}: {
  phase: Phase
  /** El Mochi del perfil: el de la isla lleva su accesorio */
  avatar?: string | null
  /** Cómo reacciona Mochi al tocarlo y lo que le han dado en «Cuida a Mochi» */
  mood?: PokeMood
  items?: readonly CareId[]
  onMochiPoke?: (mood: PokeMood) => void
  children?: ReactNode
}) {
  const [use3D] = useState(canUse3D)
  return (
    <div className="sky-panel">
      {use3D ? (
        <Suspense fallback={<StaticIsland phase={phase} />}>
          <Scene phase={phase} avatar={avatar} mood={mood} items={items} onMochiPoke={onMochiPoke} />
        </Suspense>
      ) : (
        <StaticIsland phase={phase} />
      )}
      {children}
    </div>
  )
}
