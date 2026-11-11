// Mochi en distintas versiones, para usar como foto de perfil. En píxeles, como la isla.

type Px = [x: number, y: number, w?: number, h?: number]
type Layer = { fill: string; px: Px[] }

export const AVATAR_IDS = ["clasico", "invierno", "primavera", "verano", "otono", "dormilon", "gatito", "estrella"] as const
export type AvatarId = (typeof AVATAR_IDS)[number]

const BODY_FILL = "#FFF9F2"
const INK = "#3A2A38"
const BLUSH = "#F6A9BB"

const BODY: Px[] = [
  [5, 4, 6],
  [4, 5, 8],
  [3, 6, 10, 6],
  [4, 12, 8],
  [5, 13, 6],
]
const EYES: Px[] = [
  [6, 7, 1, 2],
  [9, 7, 1, 2],
]
const SMILE: Px[] = [
  [6, 10],
  [9, 10],
  [7, 11, 2],
]
const CHEEKS: Px[] = [
  [4, 10, 2],
  [10, 10, 2],
]

interface Avatar {
  label: string
  /** Fondo del círculo */
  bg: string
  /** Capas detrás del cuerpo (orejas, gorro largo…) */
  back?: Layer[]
  eyes?: Px[]
  mouth?: Px[]
  /** Capas encima de la cara (gafas, gorro, bufanda…) */
  front?: Layer[]
}

export const AVATARS: Record<AvatarId, Avatar> = {
  clasico: { label: "Mochi clásico", bg: "#F8E1EA" },
  invierno: {
    label: "Mochi con gorro de lana",
    bg: "#E3DCF5",
    front: [
      { fill: "#8E7CC3", px: [[5, 2, 6, 2]] },
      { fill: "#B9A6F2", px: [[4, 4, 8, 1]] },
      { fill: "#FFFFFF", px: [[7, 0, 2, 2]] },
    ],
  },
  primavera: {
    label: "Mochi con una flor",
    bg: "#E0F1E4",
    front: [
      { fill: "#5FAE6E", px: [[9, 4, 1, 1], [8, 3, 1, 1]] },
      { fill: "#F28FB3", px: [[11, 1], [10, 2], [12, 2], [11, 3]] },
      { fill: "#F5C94A", px: [[11, 2]] },
    ],
  },
  verano: {
    label: "Mochi con gafas de sol",
    bg: "#FCEFCB",
    eyes: [],
    mouth: [[6, 10], [9, 10], [7, 11, 2]],
    front: [
      { fill: "#2B2440", px: [[5, 7, 3, 2], [9, 7, 3, 2], [8, 7, 1, 1]] },
      { fill: "#6E8BD8", px: [[6, 7], [10, 7]] },
    ],
  },
  otono: {
    label: "Mochi con bufanda y una hoja",
    bg: "#FBE2D5",
    front: [
      { fill: "#E07A4F", px: [[7, 2, 2, 1], [8, 1], [6, 3]] },
      { fill: "#8A5A3C", px: [[8, 3]] },
      { fill: "#C8553D", px: [[3, 12, 10, 1], [9, 13, 2, 2]] },
      { fill: "#F2A07B", px: [[5, 12], [8, 12], [11, 12]] },
    ],
  },
  dormilon: {
    label: "Mochi dormilón con gorro de dormir",
    bg: "#DCE2F5",
    eyes: [
      [5, 8, 2, 1],
      [9, 8, 2, 1],
    ],
    mouth: [[7, 11, 2]],
    front: [
      { fill: "#6E7FC8", px: [[5, 3, 6, 1], [6, 2, 4, 1], [8, 1, 3, 1], [11, 2, 1, 1]] },
      { fill: "#FFFFFF", px: [[4, 4, 8, 1], [12, 3]] },
      { fill: "#8E9BD8", px: [[13, 0], [14, 1], [13, 2]] },
    ],
  },
  gatito: {
    label: "Mochi con orejas de gato",
    bg: "#F5EBDD",
    back: [
      { fill: BODY_FILL, px: [[3, 3, 2, 3], [11, 3, 2, 3]] },
      { fill: "#F6A9BB", px: [[4, 4], [11, 4]] },
    ],
    mouth: [[7, 10, 2], [6, 11], [9, 11]],
    front: [{ fill: "#C9B9C4", px: [[1, 9, 2], [1, 11, 2], [13, 9, 2], [13, 11, 2]] }],
  },
  estrella: {
    label: "Mochi estrellita",
    bg: "#FBE3EA",
    eyes: [[5, 8], [6, 7], [7, 8], [8, 8], [9, 7], [10, 8]],
    mouth: [[6, 10, 4], [7, 11, 2]],
    front: [{ fill: "#F5C94A", px: [[12, 1], [11, 2, 3, 1], [12, 3], [2, 3], [14, 6]] }],
  },
}

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === "string" && (AVATAR_IDS as readonly string[]).includes(value)
}

interface Props {
  avatar: AvatarId
  size?: number
  /** Texto para lectores de pantalla. Sin él, es decorativo */
  label?: string
}

export default function MochiAvatar({ avatar, size = 56, label }: Props) {
  const a = AVATARS[avatar]
  const rects = (layers: Layer[] | undefined, prefix: string) =>
    layers?.flatMap((layer, i) =>
      layer.px.map(([x, y, w = 1, h = 1], j) => (
        <rect key={`${prefix}${i}-${j}`} x={x} y={y} width={w} height={h} fill={layer.fill} />
      ))
    )
  const ink = (px: Px[], prefix: string) =>
    px.map(([x, y, w = 1, h = 1], i) => <rect key={`${prefix}${i}`} x={x} y={y} width={w} height={h} fill={INK} />)

  return (
    <svg
      className="mochi-avatar"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx={8} cy={8} r={8} fill={a.bg} shapeRendering="geometricPrecision" />
      {rects(a.back, "k")}
      {BODY.map(([x, y, w = 1, h = 1], i) => (
        <rect key={`b${i}`} x={x} y={y} width={w} height={h} fill={BODY_FILL} />
      ))}
      {CHEEKS.map(([x, y, w = 1], i) => (
        <rect key={`c${i}`} x={x} y={y} width={w} height={1} fill={BLUSH} />
      ))}
      {ink(a.eyes ?? EYES, "e")}
      {ink(a.mouth ?? SMILE, "m")}
      {rects(a.front, "f")}
    </svg>
  )
}
