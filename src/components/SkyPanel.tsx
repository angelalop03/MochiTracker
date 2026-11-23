import { lazy, Suspense, useState, type ReactNode } from "react"
import type { Activity, CareId, Mood, Temperament } from "../content/care"
import type { Reaction } from "../three/Mochi"
import type { Phase } from "../lib/cycle"
import { canUse3D } from "../three/support"
import StaticIsland from "./StaticIsland"

// Three.js se carga aparte, después del contenido, para que la pantalla aparezca antes
const Scene = lazy(() => import("../three/Scene"))

/** Marco con cielo y la isla: en 3D si se puede, en imagen estática si no */
export default function SkyPanel({
  phase,
  avatar,
  temperament,
  expression,
  items,
  calm,
  activity,
  onMochiPoke,
  children,
}: {
  phase: Phase
  /** El Mochi del perfil: el de la isla lleva su accesorio */
  avatar?: string | null
  /** Cómo reacciona Mochi al tocarla, cómo se siente y lo que lleva en «Cuida a Mochi» */
  temperament?: Temperament
  expression?: Mood
  items?: readonly CareId[]
  calm?: number
  activity?: Activity
  onMochiPoke?: (reaction: Reaction, step: number) => void
  children?: ReactNode
}) {
  const [use3D] = useState(canUse3D)
  return (
    <div className="sky-panel">
      {use3D ? (
        <Suspense fallback={<StaticIsland phase={phase} />}>
          <Scene
            phase={phase}
            avatar={avatar}
            temperament={temperament}
            expression={expression}
            items={items}
            calm={calm}
            activity={activity}
            onMochiPoke={onMochiPoke}
          />
        </Suspense>
      ) : (
        <StaticIsland phase={phase} />
      )}
      {children}
    </div>
  )
}
