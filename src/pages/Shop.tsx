import { ArrowLeft, Coins, Star } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import Loading from "../components/Loading"
import MochiFace from "../components/MochiFace"
import PixelSprite from "../components/PixelSprite"
import { CARE_ITEMS, PHASE_CARE, STATS, type CareId, type Stat } from "../content/care"
import { PHASE_CONTENT } from "../content/phases"
import { useGamePhase } from "../games/GameShell"
import { buyItem, pantryOf, SHOP, useWallet } from "../lib/shop"

const STAT_SHORT = Object.fromEntries(STATS.map((s) => [s.id, s.label])) as Record<Stat, string>

const SHELVES: { title: string; note: string; ids: CareId[] }[] = [
  {
    title: "Comer y beber",
    note: "Se compran por unidades y se gastan al dárselas.",
    ids: (Object.keys(SHOP) as CareId[]).filter((id) => CARE_ITEMS[id].category === "comida"),
  },
  {
    title: "Cuidado del cuerpo",
    note: "Productos que se van gastando.",
    ids: (Object.keys(SHOP) as CareId[]).filter((id) => CARE_ITEMS[id].category === "cuerpo" && !SHOP[id]?.forever),
  },
  {
    title: "Para siempre",
    note: "Se compran una vez y son tuyas.",
    ids: (Object.keys(SHOP) as CareId[]).filter((id) => SHOP[id]?.forever),
  },
]

type Say = { text: string; face: string }

/** La tiendecita de la isla: aquí se gastan las monedas de los minijuegos */
export default function Shop() {
  const { phase, loading } = useGamePhase()
  const wallet = useWallet()
  const [say, setSay] = useState<Say | null>(null)
  const [last, setLast] = useState<{ id: CareId; n: number } | null>(null)

  if (loading) return <Loading />

  const favorites = PHASE_CARE[phase].favorites
  const season = PHASE_CONTENT[phase].season.toLowerCase()
  const line: Say = say ?? { text: "¡Bienvenida a la tiendecita! ¿Qué le llevamos a Mochi?", face: "genial" }

  function purchase(id: CareId) {
    const item = CARE_ITEMS[id]
    const result = buyItem(id)
    if (result.kind === "ok") {
      const forever = SHOP[id]?.forever
      setSay({ text: forever ? `¡${item.name}, ya es tuya para siempre!` : `¡Hecho! ${item.name} a la despensa.`, face: "genial" })
      setLast({ id, n: Date.now() })
    } else if (result.kind === "poor") {
      setSay({
        text: `Te ${result.missing === 1 ? "falta 1 moneda" : `faltan ${result.missing} monedas`} para ${item.name.toLowerCase()}. Se ganan en los minijuegos.`,
        face: "triste",
      })
    }
  }

  return (
    <main className="shop-page" data-phase={phase}>
      <header className="shop-bar">
        <Link to="/mochi" className="icon-button" aria-label="Volver a Mochi">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1>La tiendecita</h1>
        <span className="care-coins" aria-live="polite">
          <Coins size={14} strokeWidth={2.5} aria-hidden="true" />
          <strong>{wallet.coins}</strong>
          <span className="sr-only">{wallet.coins === 1 ? " moneda" : " monedas"}</span>
        </span>
      </header>

      <section className="shop-front" aria-label="El mostrador">
        <div className="shop-awning" aria-hidden="true" />
        <figure key={line.text} className="shop-keeper" aria-live="polite">
          <MochiFace mood={line.face} size={44} />
          <p>{line.text}</p>
        </figure>
      </section>

      {SHELVES.map((shelf) => (
        <section key={shelf.title} className="shop-shelf" aria-labelledby={`shelf-${shelf.title}`}>
          <div className="section-head">
            <h2 id={`shelf-${shelf.title}`} className="eyebrow">
              {shelf.title}
            </h2>
            <span className="section-note">{shelf.note}</span>
          </div>
          <ul className="shop-list">
            {shelf.ids.map((id) => {
              const item = CARE_ITEMS[id]
              const price = SHOP[id]!.price
              const pantry = pantryOf(wallet, id)
              const owned = pantry.kind === "owned"
              const left = pantry.kind === "stock" ? pantry.left : 0
              const short = !owned && price > wallet.coins
              const ups = (Object.entries(item.effect) as [Stat, number][]).filter(([, v]) => v > 0)
              return (
                <li key={id} className="shop-item" data-short={short || undefined}>
                  <span className="shop-item-art">
                    <PixelSprite id={id} size={48} />
                    {last?.id === id && <span key={last.n} className="shop-pop" aria-hidden="true">+1</span>}
                  </span>
                  <span className="shop-item-text">
                    <strong>
                      {item.name}
                      {favorites.includes(id) && (
                        <span className="care-fav shop-fav" title={`Le encanta en ${season}`}>
                          <Star size={11} strokeWidth={2.5} aria-hidden="true" />
                          <span className="sr-only">Le encanta en {season}</span>
                        </span>
                      )}
                    </strong>
                    <span className="shop-item-effect">{ups.map(([stat]) => `+${STAT_SHORT[stat]}`).join(" ")}</span>
                    {!SHOP[id]!.forever && <small>{left ? `En la despensa: ${left}` : "No te queda"}</small>}
                  </span>
                  {owned ? (
                    <span className="shop-owned">Ya es tuya</span>
                  ) : (
                    <button
                      type="button"
                      className="shop-buy"
                      aria-disabled={short || undefined}
                      onClick={() => purchase(id)}
                      aria-label={`Comprar ${item.name} por ${price} ${price === 1 ? "moneda" : "monedas"}`}
                    >
                      <Coins size={14} strokeWidth={2.5} aria-hidden="true" />
                      {price}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <section className="shop-earn">
        <p>
          <strong>¿Te faltan monedas?</strong> Se ganan jugando, y Mochi te regala 5 cada día.
        </p>
        <div className="shop-earn-links">
          <Link to="/mochi/isla" className="button button-small">
            Construye tu isla
          </Link>
          <Link to="/mochi/nubes" className="button button-small button-quiet">
            Salta entre nubes
          </Link>
        </div>
      </section>
    </main>
  )
}
