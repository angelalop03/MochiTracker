import { Coins, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import Loading from "../components/Loading"
import MochiFace from "../components/MochiFace"
import PixelSprite from "../components/PixelSprite"
import SkyPanel from "../components/SkyPanel"
import GamesSection from "../games/GamesSection"
import {
  CARE_ITEMS,
  CATEGORIES,
  MOOD_LABELS,
  PHASE_CARE,
  STATS,
  type CareId,
  type Category,
  type Mood,
  type Stat,
} from "../content/care"
import { PHASE_CONTENT } from "../content/phases"
import { useCycleData } from "../hooks/useCycleData"
import { greeting, levelOf, NAP_MS, pokeLine, useCare, useNow } from "../lib/care"
import { getCycleState, todayInTimeZone } from "../lib/cycle"
import { claimDailyGift, missingFor, pantryOf, spend, updateWallet, useWallet, type Pantry } from "../lib/shop"
import type { Reaction } from "../three/Mochi"

type Say = { text: string; face: string }

const FACE: Record<Mood, string> = {
  feliz: "genial",
  bien: "bien",
  regular: "normal",
  hambrienta: "triste",
  cansada: "sensible",
  triste: "triste",
  incomoda: "ansiosa",
  dormida: "normal",
}

const REACTION_FACE: Record<Reaction, string> = {
  warn: "irritable",
  angry: "irritable",
  turn: "irritable",
  sleepy: "sensible",
  asleep: "normal",
  jump: "genial",
  spin: "genial",
  dizzy: "ansiosa",
}

/** Lo que se ve en la esquina de cada cosa: cuántas quedan o cuánto cuesta */
function PantryTag({ pantry }: { pantry: Pantry }) {
  if (pantry.kind === "free") return null
  if (pantry.kind === "owned") return <span className="care-tag is-owned">Tuya</span>
  if (pantry.kind === "stock") return <span className="care-tag is-stock">×{pantry.left}</span>
  return (
    <span className="care-tag is-buy">
      <Coins size={11} strokeWidth={2.5} aria-hidden="true" />
      {pantry.price}
      <span className="sr-only">{pantry.price === 1 ? " moneda" : " monedas"}</span>
    </span>
  )
}

const STAT_SHORT = Object.fromEntries(STATS.map((s) => [s.id, s.label])) as Record<Stat, string>

/** Lo que sujeta se ve un ratito; lo que hace, un poco más */
const HOLD_MS = 8000
const DO_MS = 12_000

function Meter({ stat, value }: { stat: Stat; value: number }) {
  const filled = Math.round(value / 10)
  return (
    <div className="care-meter" data-stat={stat} data-low={value < 25 || undefined}>
      <span className="care-meter-label">
        {STAT_SHORT[stat]}
        <span className="sr-only">: {value} de 100</span>
      </span>
      <span className="care-meter-bar" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < filled ? "is-on" : undefined} />
        ))}
      </span>
    </div>
  )
}

/** «Cuida a Mochi»: un tamagochi opcional. Mochi siente su estación como tú la tuya */
export default function CareMochi() {
  const { profile, periods } = useCycleData()
  const now = useNow(5000)
  const today = profile ? todayInTimeZone(profile.timezone) : ""
  const settings = profile
    ? { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length }
    : { avgCycleLength: 28, avgPeriodLength: 5 }
  const cycle = getCycleState(periods, settings, today || "2000-01-01")
  const phase = cycle.status === "no_data" ? "folicular" : cycle.phase
  const care = useCare(phase, today, now)
  const [category, setCategory] = useState<Category>("comida")
  const [say, setSay] = useState<Say | null>(null)
  const [showing, setShowing] = useState<{ id: CareId; n: number } | null>(null)
  const [, refresh] = useState(0)
  const [calm, setCalm] = useState(0)
  const [paid, setPaid] = useState<{ text: string; n: number } | null>(null)
  const wallet = useWallet()

  // Un regalo de monedas al día, al entrar
  useEffect(() => {
    if (!today) return
    const gift = claimDailyGift(today)
    if (gift) setSay({ text: `¡Regalo del día! Toma ${gift} monedas para mis cositas.`, face: "genial" })
  }, [today])

  useEffect(() => {
    if (!paid) return
    const id = setTimeout(() => setPaid(null), 2200)
    return () => clearTimeout(id)
  }, [paid])

  useEffect(() => {
    if (!showing) return
    const item = CARE_ITEMS[showing.id]
    const ms = showing.id === "dormir" ? NAP_MS : item.show === "do" ? DO_MS : HOLD_MS
    const id = setTimeout(() => setShowing(null), ms)
    return () => clearTimeout(id)
  }, [showing])

  if (!profile) return <Loading />

  const phaseCare = PHASE_CARE[phase]
  const season = PHASE_CONTENT[phase].season
  const level = levelOf(care.state.xp)
  const days = care.state.days.length
  const now_ = showing?.id
  const items = now_ && !care.worn.includes(now_) ? [...care.worn, now_] : care.worn
  const activity = now_ ? CARE_ITEMS[now_].activity : undefined
  const line: Say = say ?? { text: greeting(phase, care.mood), face: FACE[care.mood] }

  function offer(id: CareId) {
    const item = CARE_ITEMS[id]
    const pantry = pantryOf(wallet, id)
    const missing = missingFor(wallet, id)
    if (pantry.kind === "buy" && missing > 0) {
      setSay({
        text: `${item.name}: cuesta ${pantry.price} y tienes ${wallet.coins}. Te faltan ${missing} ${missing === 1 ? "moneda" : "monedas"}; gánalas en los minijuegos de abajo.`,
        face: "triste",
      })
      return
    }
    const result = care.give(id)
    if (result.kind === "ok") {
      // Solo se gasta o se paga si se lo ha tomado
      updateWallet((w) => spend(w, id))
      if (pantry.kind === "buy") setPaid({ text: pantry.forever ? `−${pantry.price} · ¡ya es tuya!` : `−${pantry.price}`, n: Date.now() })
      setCalm((n) => n + 1)
      setSay({ text: result.line, face: result.favorite ? "genial" : "bien" })
      if (CARE_ITEMS[id].show !== "wear") setShowing({ id, n: Date.now() })
      // Cuando se despierte, se vuelve a pintar
      if (id === "dormir") setTimeout(() => refresh((n) => n + 1), NAP_MS + 200)
    } else if (result.kind === "refused") {
      setSay({ text: result.line, face: "irritable" })
    } else {
      setSay({ text: result.line, face: "normal" })
    }
  }

  function onPoke(reaction: Reaction, step: number) {
    setSay({ text: pokeLine(care.temperament, step, care.mood), face: REACTION_FACE[reaction] })
  }

  return (
    <>
      <main className="care-page with-nav" data-phase={phase}>
        <header className="care-head">
          <p className="eyebrow">Cuida a Mochi</p>
          <h1 className="page-title">Mochi en {season.toLowerCase()}</h1>
          <div className="care-badges">
            <span className="care-level">
              <strong>Nivel {level.level}</strong> · {level.title}
              <span className="care-level-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(level.progress * 100)}%` }} />
              </span>
            </span>
            <span className="care-coins" aria-live="polite">
              <Coins size={14} strokeWidth={2.5} aria-hidden="true" />
              <strong>{wallet.coins}</strong> {wallet.coins === 1 ? "moneda" : "monedas"}
              {paid && (
                <span key={paid.n} className="care-paid">
                  {paid.text}
                </span>
              )}
            </span>
            {days > 0 && (
              <span className="care-days">
                {days} {days === 1 ? "día juntas" : "días juntas"}
              </span>
            )}
          </div>
        </header>

        <section className="care-stage" aria-label="Mochi en su isla">
          <SkyPanel
            phase={phase}
            avatar={profile.avatar}
            temperament={care.temperament}
            expression={care.mood}
            items={items}
            calm={calm}
            activity={activity}
            onMochiPoke={onPoke}
          />
          <span className="care-mood" data-mood={care.mood}>
            {MOOD_LABELS[care.mood]}
          </span>
          <figure key={line.text} className="care-bubble" aria-live="polite">
            <MochiFace mood={line.face} size={36} />
            <p>{line.text}</p>
          </figure>
        </section>

        <section className="care-stats" aria-label="Cómo está Mochi">
          {STATS.map(({ id }) => (
            <Meter key={id} stat={id} value={care.state.stats[id]} />
          ))}
        </section>

        <section className="care-block" aria-labelledby="actions-title">
          <h2 id="actions-title" className="eyebrow">
            Cuídala
          </h2>
          <div className="care-tabs" role="group" aria-label="Tipo de cuidado">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" className="care-tab" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div key={category} className="care-tray">
            {(Object.entries(CARE_ITEMS) as [CareId, (typeof CARE_ITEMS)[CareId]][])
              .filter(([, item]) => item.category === category)
              .map(([id, item]) => {
                const favorite = phaseCare.favorites.includes(id)
                const ups = (Object.entries(item.effect) as [Stat, number][]).filter(([, v]) => v > 0)
                const pantry = pantryOf(wallet, id)
                const short = pantry.kind === "buy" && pantry.price > wallet.coins
                return (
                  <button
                    key={id}
                    type="button"
                    className="care-item"
                    data-pantry={pantry.kind}
                    data-short={short || undefined}
                    onClick={() => offer(id)}
                  >
                    <PantryTag pantry={pantry} />
                    {favorite && (
                      <span className="care-fav" title={`Le encanta en ${season.toLowerCase()}`}>
                        <Star size={12} strokeWidth={2.5} aria-hidden="true" />
                        <span className="sr-only">Le encanta en {season.toLowerCase()}</span>
                      </span>
                    )}
                    <PixelSprite id={id} size={44} />
                    <span className="care-item-name">{item.name}</span>
                    <span className="care-item-effect">{ups.map(([stat]) => `+${STAT_SHORT[stat]}`).join(" ")}</span>
                  </button>
                )
              })}
          </div>
        </section>

        {care.mood === "feliz" && (
          <section className="care-done" aria-live="polite">
            <p className="eyebrow">Y tú, ¿te has cuidado hoy?</p>
            <p>{phaseCare.mirror}</p>
            <Link to="/guia" className="button button-small">
              Ver qué te puede sentar bien
            </Link>
          </section>
        )}

        <GamesSection />

        <p className="care-note">
          Es un juego: Mochi siente su estación como tú la tuya, y sus necesidades bajan con el tiempo. Se guarda en
          este dispositivo.
        </p>
      </main>
      <BottomNav />
    </>
  )
}
