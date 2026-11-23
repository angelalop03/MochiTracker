import { Check, Heart } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import Loading from "../components/Loading"
import MochiFace from "../components/MochiFace"
import PixelSprite from "../components/PixelSprite"
import SkyPanel from "../components/SkyPanel"
import { CARE_ITEMS, PHASE_CARE, type CareId, type PokeMood } from "../content/care"
import { PHASE_CONTENT } from "../content/phases"
import { useCycleData } from "../hooks/useCycleData"
import { pokeMood, trayFor, useCare } from "../lib/care"
import { getCycleState, todayInTimeZone } from "../lib/cycle"

type Say = { text: string; face: string }

const FACE_FOR_POKE: Record<PokeMood, string> = { grumpy: "irritable", sleepy: "normal", happy: "genial", party: "genial" }

/** «Cuida a Mochi»: un minijuego opcional. Mochi siente su estación como tú la tuya */
export default function CareMochi() {
  const { profile, periods } = useCycleData()
  const today = profile ? todayInTimeZone(profile.timezone) : ""
  const settings = profile
    ? { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length }
    : { avgCycleLength: 28, avgPeriodLength: 5 }
  const cycle = getCycleState(periods, settings, today || "2000-01-01")
  const phase = cycle.status === "no_data" ? "folicular" : cycle.phase
  const { state, cared, give } = useCare(today, phase)
  const [say, setSay] = useState<Say | null>(null)

  if (!profile) return <Loading />

  const care = PHASE_CARE[phase]
  const season = PHASE_CONTENT[phase].season
  const mood = pokeMood(phase, cared)
  const line: Say = say ?? (cared ? { text: care.lines.done, face: "genial" } : { text: care.lines.hello, face: "normal" })

  function offer(id: CareId) {
    const result = give(id)
    if (result === "nope") setSay({ text: care.lines.nope, face: "triste" })
    else if (result === "repeat") setSay({ text: "¡Eso ya me lo has dado!", face: "bien" })
    else if (result === "done") setSay({ text: `${care.lines.gifts[id] ?? ""} ${care.lines.done}`.trim(), face: "genial" })
    else setSay({ text: care.lines.gifts[id] ?? "¡Gracias!", face: "bien" })
  }

  function onPoke(reaction: PokeMood) {
    setSay({ text: cared ? care.lines.pokeCared : care.lines.poke, face: FACE_FOR_POKE[reaction] })
  }

  return (
    <>
      <main className="care-page with-nav" data-phase={phase}>
        <header className="care-head">
          <p className="eyebrow">Cuida a Mochi</p>
          <h1 className="page-title">Mochi en {season.toLowerCase()}</h1>
          <p className="care-lead">Mochi siente su estación como tú la tuya. Tócalo, y dale lo que le siente bien.</p>
        </header>

        <section className="care-stage" aria-label="Mochi en su isla">
          <SkyPanel phase={phase} avatar={profile.avatar} mood={mood} items={state.given} onMochiPoke={onPoke} />
          <div className="care-hearts" aria-label={`${state.given.length} de 3 cuidados`}>
            {care.wants.map((id, i) => (
              <Heart key={id} size={20} strokeWidth={2.2} className={i < state.given.length ? "is-full" : undefined} aria-hidden="true" />
            ))}
          </div>
          <figure key={line.text} className="care-bubble" aria-live="polite">
            <MochiFace mood={line.face} size={36} />
            <p>{line.text}</p>
          </figure>
        </section>

        <section className="care-block" aria-labelledby="needs-title">
          <h2 id="needs-title" className="eyebrow">
            Hoy necesita
          </h2>
          <ul className="care-needs">
            {care.wants.map((id) => {
              const done = state.given.includes(id)
              return (
                <li key={id} className={done ? "is-done" : undefined}>
                  <PixelSprite id={id} size={36} />
                  <span>{CARE_ITEMS[id].name}</span>
                  {done && <Check size={16} strokeWidth={3} aria-label="hecho" />}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="care-block" aria-labelledby="tray-title">
          <h2 id="tray-title" className="eyebrow">
            Dale algo
          </h2>
          <div className="care-tray">
            {trayFor(phase, today).map((id) => {
              const given = state.given.includes(id)
              return (
                <button key={id} type="button" className="care-item" aria-pressed={given} onClick={() => offer(id)}>
                  <PixelSprite id={id} size={48} />
                  <span>{CARE_ITEMS[id].name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {cared && (
          <section className="care-done" aria-live="polite">
            <p className="eyebrow">Y tú, ¿te has cuidado hoy?</p>
            <p>{care.mirror}</p>
            <Link to="/guia" className="button button-small">
              Ver qué te puede sentar bien
            </Link>
          </section>
        )}

        <p className="care-note">Es un juego: Mochi refleja cómo te puedes sentir en tu fase. Se renueva cada día.</p>
      </main>
      <BottomNav />
    </>
  )
}
