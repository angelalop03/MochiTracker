import { CARE_ITEMS, type CareId } from "../content/care"

/** Un objeto de «Cuida a Mochi» en píxeles, como la isla */
export default function PixelSprite({ id, size = 40 }: { id: CareId; size?: number }) {
  const { sprite, palette } = CARE_ITEMS[id]
  // Centra en vertical los sprites que no ocupan las 12 filas
  const top = Math.floor((12 - sprite.length) / 2)
  return (
    <svg className="pixel-sprite" viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {sprite.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y + top} width={1} height={1} fill={palette[c]} />
        )
      )}
    </svg>
  )
}
