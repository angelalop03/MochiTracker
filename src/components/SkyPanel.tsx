import { lazy, Suspense, useState, type ReactNode } from "react"
import type { Phase } from "../lib/cycle"
import { canUse3D } from "../three/support"
import StaticIsland from "./StaticIsland"

// Three.js se carga aparte, después del contenido, para que la pantalla aparezca antes
const Scene = lazy(() => import("../three/Scene"))

/** Marco con cielo y la isla: en 3D si se puede, en imagen estática si no */
export default function SkyPanel({ phase, children }: { phase: Phase; children?: ReactNode }) {
  const [use3D] = useState(canUse3D)
  return (
    <div className="sky-panel">
      {use3D ? (
        <Suspense fallback={<StaticIsland phase={phase} />}>
          <Scene phase={phase} />
        </Suspense>
      ) : (
        <StaticIsland phase={phase} />
      )}
      {children}
    </div>
  )
}
