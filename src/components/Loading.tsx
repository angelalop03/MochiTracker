import { useEffect, useState } from "react"

const PHRASES = [
  "Mochi está regando tu isla",
  "Despertando a las flores",
  "Preparando tus consejos",
  "Ya casi está",
]

type Px = [x: number, y: number, w?: number, h?: number]
const px = ([x, y, w = 1, h = 1]: Px, className: string, key: string | number) => (
  <rect key={key} x={x} y={y} width={w} height={h} className={className} />
)

// Mochi mirando a su planta. Coordenadas en la cuadrícula de 40 × 30 píxeles
const BODY: Px[] = [
  [10, 10, 6],
  [9, 11, 8],
  [8, 12, 10, 6],
  [9, 18, 8],
  [10, 19, 6],
]
const FACE: Px[] = [
  [12, 13, 1, 2],
  [15, 13, 1, 2],
  [13, 16],
  [16, 16],
  [14, 17, 2],
]
const ISLAND: [Px, string][] = [
  [[5, 21, 30, 2], "ld-grass"],
  [[6, 23, 28, 2], "ld-dirt"],
  [[9, 25, 22, 2], "ld-dirt"],
  [[13, 27, 14, 2], "ld-rock"],
  [[17, 29, 6, 1], "ld-rock"],
]

/** Mochi riega una planta que crece y florece mientras carga la app */
export default function Loading() {
  const [phrase, setPhrase] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPhrase((n) => (n + 1) % PHRASES.length), 2400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="center-screen loading-screen" role="status" aria-live="polite">
      <svg className="mochi-loader" viewBox="0 0 40 31" shapeRendering="crispEdges" aria-hidden="true">
        <circle cx={20} cy={16} r={15} className="ld-sky" />
        <g className="ld-world">
          {ISLAND.map(([p, cls], i) => px(p, cls, `i${i}`))}

          <g className="ld-plant">
            <rect x={28} y={15} width={1} height={6} className="ld-stem" />
            <g className="ld-leaves">
              {px([26, 18, 2], "ld-leaf", "l1")}
              {px([29, 17, 2], "ld-leaf", "l2")}
            </g>
            <g className="ld-flower">
              {px([28, 13], "ld-petal", "p1")}
              {px([27, 14], "ld-petal", "p2")}
              {px([29, 14], "ld-petal", "p3")}
              {px([28, 15], "ld-petal", "p4")}
              {px([28, 14], "ld-center", "c")}
            </g>
            <g className="ld-sparkle">
              {px([32, 9], "ld-spark", "s1")}
              {px([31, 10], "ld-spark", "s2")}
              {px([33, 10], "ld-spark", "s3")}
              {px([32, 11], "ld-spark", "s4")}
            </g>
          </g>

          <g className="ld-drops">
            {px([25, 13], "ld-drop", "d1")}
            {px([26, 13], "ld-drop", "d2")}
            {px([25, 13], "ld-drop", "d3")}
          </g>

          <g className="ld-mochi">
            {BODY.map((p, i) => px(p, "ld-body", `b${i}`))}
            {px([10, 16, 2], "ld-blush", "k1")}
            {px([16, 16, 2], "ld-blush", "k2")}
            {FACE.map((p, i) => px(p, "ld-ink", `f${i}`))}
            <g className="ld-can">
              {px([18, 13, 4, 3], "ld-can-body", "cb")}
              {px([22, 12, 2], "ld-can-body", "cs1")}
              {px([24, 11], "ld-can-body", "cs2")}
              {px([19, 12, 2], "ld-can-dark", "ch")}
              {px([17, 14], "ld-body", "arm")}
            </g>
          </g>
        </g>
      </svg>
      <p className="loading-text">
        <span key={phrase} className="loading-phrase">
          {PHRASES[phrase]}
        </span>
        <span className="loading-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </p>
    </div>
  )
}
