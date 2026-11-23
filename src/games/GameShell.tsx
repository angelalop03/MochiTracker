import { ArrowLeft, Coins, Trophy } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { useCycleData } from "../hooks/useCycleData"
import { getCycleState, todayInTimeZone, type Phase } from "../lib/cycle"
import { useWallet } from "../lib/shop"
import { useGames, type GameId } from "./store"

export type GameStatus = "ready" | "playing" | "over"

export interface GameResult {
  score: number
  coins: number
  record: boolean
}

/** La estación de hoy, para pintar el juego con sus colores */
export function useGamePhase(): { phase: Phase; avatar: string | null; loading: boolean } {
  const { profile, periods } = useCycleData()
  if (!profile) return { phase: "folicular", avatar: null, loading: true }
  const state = getCycleState(
    periods,
    { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length },
    todayInTimeZone(profile.timezone)
  )
  return { phase: state.status === "no_data" ? "folicular" : state.phase, avatar: profile.avatar ?? null, loading: false }
}

interface Props {
  game: GameId
  title: string
  phase: Phase
  status: GameStatus
  score: number
  /** Cómo se juega, en la pantalla de inicio */
  howTo: ReactNode
  result: GameResult | null
  onStart: () => void
  /** Aviso corto encima del juego, como «¡Perfecto!» */
  toast?: string | null
  children: ReactNode
}

/** Marco común de los minijuegos: barra, inicio, puntuación y fin de partida */
export default function GameShell({ game, title, phase, status, score, howTo, result, onStart, toast, children }: Props) {
  const { best } = useGames()
  const { coins } = useWallet()
  const startButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (status !== "playing") startButton.current?.focus()
  }, [status])

  return (
    <main className="game-page" data-phase={phase}>
      <header className="game-bar">
        <Link to="/mochi" className="icon-button" aria-label="Volver a Mochi">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1>{title}</h1>
        <span className="game-score" aria-live="polite">
          {status === "playing" ? score : (best[game] ?? 0)}
          <small>{status === "playing" ? "puntos" : "récord"}</small>
        </span>
      </header>

      <div className="game-stage">
        {children}
        {toast && status === "playing" && (
          <span key={toast + score} className="game-toast">
            {toast}
          </span>
        )}

        {status !== "playing" && (
          <div className="game-overlay">
            <div className="game-card">
              {status === "ready" ? (
                <>
                  <h2>{title}</h2>
                  <div className="game-howto">{howTo}</div>
                </>
              ) : (
                result && (
                  <>
                    <p className="eyebrow">{result.record ? "¡Nuevo récord!" : "Fin de la partida"}</p>
                    <p className="game-final">
                      {result.record && <Trophy size={28} aria-hidden="true" />}
                      {result.score}
                      <small>puntos</small>
                    </p>
                    <p className="game-coins">
                      <Coins size={16} aria-hidden="true" /> +{result.coins} {result.coins === 1 ? "moneda" : "monedas"} · tienes {coins}
                    </p>
                  </>
                )
              )}
              <button ref={startButton} type="button" className="button" onClick={onStart}>
                {status === "ready" ? "Empezar" : "Jugar otra vez"}
              </button>
              {status === "over" && (
                <Link to="/mochi" className="button button-quiet">
                  Volver con Mochi
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
