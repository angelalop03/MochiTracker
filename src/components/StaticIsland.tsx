import type { Phase } from "../lib/cycle"
import { SEASONS } from "../three/seasons"

const INK = "#2B2140"
const BODY = "#FFF4DC"

const OUTFIT: Record<Phase, string> = {
  menstrual: "#FFB84D",
  folicular: "#9BE564",
  ovulatoria: "#FFD23F",
  lutea: "#D9622E",
}

/** La isla en píxeles, sin 3D: para quien no tiene WebGL o pide menos movimiento */
export default function StaticIsland({ phase }: { phase: Phase }) {
  const s = SEASONS[phase]
  return (
    <svg
      className="static-island"
      viewBox="0 0 64 48"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Isla en ${phase === "menstrual" ? "invierno" : phase === "folicular" ? "primavera" : phase === "ovulatoria" ? "verano" : "otoño"} con Mochi`}
    >
      {/* Isla */}
      <rect x="10" y="29" width="44" height="3" fill={s.grass[0]} />
      <rect x="12" y="32" width="40" height="3" fill={s.dirt} />
      <rect x="18" y="35" width="28" height="3" fill={s.rock} />
      <rect x="25" y="38" width="14" height="3" fill={s.rock} />
      {/* Árbol */}
      <rect x="15" y="21" width="3" height="8" fill={s.trunk} />
      <rect x="11" y="15" width="11" height="6" fill={s.canopy[0]} />
      <rect x="13" y="11" width="7" height="4" fill={s.canopy[1]} />
      {/* Mochi */}
      <rect x="28" y="21" width="12" height="8" fill={BODY} />
      <rect x="29" y="19" width="10" height="2" fill={BODY} />
      <rect x="31" y="23" width="1" height="2" fill={INK} />
      <rect x="36" y="23" width="1" height="2" fill={INK} />
      <rect x="29" y="25" width="2" height="1" fill="#F7A58C" />
      <rect x="37" y="25" width="2" height="1" fill="#F7A58C" />
      {phase === "menstrual" && <rect x="27" y="26" width="14" height="3" fill={OUTFIT.menstrual} />}
      {phase === "folicular" && <rect x="33" y="16" width="2" height="3" fill={OUTFIT.folicular} />}
      {phase === "ovulatoria" && (
        <>
          <rect x="27" y="18" width="14" height="1" fill={OUTFIT.ovulatoria} />
          <rect x="30" y="16" width="8" height="2" fill={OUTFIT.ovulatoria} />
          <rect x="4" y="4" width="7" height="7" fill={OUTFIT.ovulatoria} />
        </>
      )}
      {phase === "lutea" && <rect x="28" y="26" width="12" height="1" fill={OUTFIT.lutea} />}
      {/* Copos, brotes u hojas */}
      {[
        [24, 8],
        [46, 12],
        [54, 20],
        [6, 22],
        [40, 5],
      ].map(([x, y]) => (
        <rect key={x} x={x} y={y} width="1" height="1" fill={s.particles.colors[0]} />
      ))}
    </svg>
  )
}
