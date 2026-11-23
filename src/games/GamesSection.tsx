import { ChevronRight, Coins } from "lucide-react"
import { Link } from "react-router-dom"
import { useWallet } from "../lib/shop"
import { useGames } from "./store"

/** Dibujo de cada juego en píxeles, para su tarjeta */
function GameIcon({ game }: { game: "isla" | "nubes" }) {
  const rows =
    game === "isla"
      ? ["....AAAA....", "...AAAAAA...", "..BBBBBBBB..", "..BBBBBBBB..", "...CCCCCC...", "...CCCCCC...", "..DDDDDDDD..", "...EEEEEE...", "....EEEE...."]
      : [".....MM.....", "....MMMM....", "....MKMK....", ".....MM.....", "............", ".WWWW.......", "WWWWWW..WWW.", ".......WWWWW", "............"]
  const colors: Record<string, string> = {
    A: "#F28FB3",
    B: "#9FD2AD",
    C: "#F0C76A",
    D: "#B9A6E6",
    E: "#DCB894",
    M: "#FFF9F2",
    K: "#3A2A38",
    W: "#FFFFFF",
  }
  return (
    <svg className="game-icon" viewBox="0 0 12 9" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={colors[c]} />))
      )}
    </svg>
  )
}

/** Los minijuegos, en la pestaña de Mochi */
export default function GamesSection() {
  const { best } = useGames()
  const { coins } = useWallet()
  const games = [
    { id: "isla" as const, to: "/mochi/isla", title: "Construye tu isla", text: "Apila los pisos sin que se caigan" },
    { id: "nubes" as const, to: "/mochi/nubes", title: "Salta entre nubes", text: "Sube lo más alto que puedas" },
  ]
  return (
    <section className="care-block" aria-labelledby="games-title">
      <div className="section-head">
        <h2 id="games-title" className="eyebrow">
          Minijuegos
        </h2>
        <span className="section-note games-coins">
          <Coins size={14} aria-hidden="true" /> {coins} monedas
        </span>
      </div>
      <div className="games-list">
        {games.map((g) => (
          <Link key={g.id} to={g.to} className="game-tile">
            <GameIcon game={g.id} />
            <span className="game-tile-text">
              <strong>{g.title}</strong>
              <span>{g.text}</span>
              <small>Récord: {best[g.id] ?? 0}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
