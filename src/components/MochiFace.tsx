// La cara de Mochi en píxeles, con una expresión por estado de ánimo.
// Une la interfaz con el mundo pixelado de la isla.

type Px = [x: number, y: number, w?: number, h?: number]

const BODY: Px[] = [
  [3, 1, 6],
  [2, 2, 8],
  [1, 3, 10, 6],
  [2, 9, 8],
  [3, 10, 6],
]

const DOT_EYES: Px[] = [
  [4, 4, 1, 2],
  [7, 4, 1, 2],
]

const FACES: Record<string, { eyes: Px[]; mouth: Px[]; extra?: Px[]; tear?: boolean }> = {
  genial: {
    eyes: [[3, 5], [4, 4], [5, 5], [6, 5], [7, 4], [8, 5]],
    mouth: [[4, 7, 4], [5, 8, 2]],
  },
  bien: { eyes: DOT_EYES, mouth: [[4, 7], [7, 7], [5, 8, 2]] },
  normal: { eyes: DOT_EYES, mouth: [[5, 8, 2]] },
  sensible: { eyes: DOT_EYES, mouth: [[5, 8, 2]], tear: true },
  triste: { eyes: [[4, 5], [7, 5]], mouth: [[5, 7, 2], [4, 8], [7, 8]] },
  irritable: { eyes: [[4, 5], [7, 5]], mouth: [[4, 8, 4]], extra: [[3, 3], [4, 4], [8, 3], [7, 4]] },
  ansiosa: { eyes: [[3, 4, 2, 2], [7, 4, 2, 2]], mouth: [[4, 8], [5, 7], [6, 8], [7, 7]] },
}

interface Props {
  mood?: keyof typeof FACES | string
  size?: number
  /** Texto para lectores de pantalla. Sin él, la cara es decorativa */
  label?: string
}

export default function MochiFace({ mood = "bien", size = 40, label }: Props) {
  const face = FACES[mood] ?? FACES.bien!
  const rect = ([x, y, w = 1, h = 1]: Px, cls: string, key: string) => (
    <rect key={key} x={x} y={y} width={w} height={h} className={cls} />
  )
  return (
    <svg
      className="mochi-face"
      viewBox="0 0 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {BODY.map((p, i) => rect(p, "mf-body", `b${i}`))}
      {rect([2, 7, 2], "mf-blush", "c1")}
      {rect([8, 7, 2], "mf-blush", "c2")}
      {face.eyes.map((p, i) => rect(p, "mf-ink", `e${i}`))}
      {face.mouth.map((p, i) => rect(p, "mf-ink", `m${i}`))}
      {face.extra?.map((p, i) => rect(p, "mf-ink", `x${i}`))}
      {face.tear && rect([8, 6, 1, 1], "mf-tear", "t")}
    </svg>
  )
}
