import { ArrowLeft, ArrowRight, Flower2, Leaf, Snowflake, Sun, Undo2, type LucideIcon } from "lucide-react"
import { useState } from "react"
import BlockIcon from "../components/BlockIcon"
import BottomNav from "../components/BottomNav"
import ConsultCard from "../components/ConsultCard"
import Glance from "../components/Glance"
import GuideBody from "../components/GuideBody"
import HormoneChart from "../components/HormoneChart"
import Loading from "../components/Loading"
import MochiFace from "../components/MochiFace"
import SkyPanel from "../components/SkyPanel"
import { BLOCK_GUIDES } from "../content/guides"
import { BLOCKS, DISCLAIMER, PHASE_CONTENT, type BlockId } from "../content/phases"
import { useCycleData } from "../hooks/useCycleData"
import { getCycleState, phaseRanges, PHASES, todayInTimeZone, type Phase } from "../lib/cycle"

const SEASON_ICONS: Record<Phase, LucideIcon> = {
  menstrual: Snowflake,
  folicular: Flower2,
  ovulatoria: Sun,
  lutea: Leaf,
}

const MOCHI_MOOD: Record<Phase, string> = {
  menstrual: "sensible",
  folicular: "bien",
  ovulatoria: "genial",
  lutea: "normal",
}

/** Las cuatro estaciones para explorarlas con calma, aunque no sea tu fase de hoy */
export default function Guide() {
  const { profile, periods } = useCycleData()
  const [picked, setPicked] = useState<Phase | null>(null)
  const [block, setBlock] = useState<BlockId>("emociones")
  if (!profile) return <Loading />

  const settings = { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length }
  const state = getCycleState(periods, settings, todayInTimeZone(profile.timezone))
  const ranges = phaseRanges(state.estimate.cycleLength, state.estimate.periodLength)
  const current = state.status === "no_data" ? null : state.phase
  const phase = picked ?? current ?? "menstrual"
  const content = PHASE_CONTENT[phase]
  const range = ranges.find((r) => r.phase === phase)
  const guide = BLOCK_GUIDES[phase][block]

  const index = PHASES.indexOf(phase)
  const prev = PHASES[(index + PHASES.length - 1) % PHASES.length]!
  const next = PHASES[(index + 1) % PHASES.length]!
  const go = (p: Phase) => {
    setPicked(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      <main className="guide-page with-nav" data-phase={phase}>
        <header className="guide-hero">
          <p className="eyebrow">Guía del ciclo</p>
          <h1 className="guide-title">
            Las cuatro estaciones <span>de tu isla</span>
          </h1>
          <p className="guide-lead">Elige una estación para ver qué pasa por dentro y qué te puede ayudar.</p>

          <div className="season-tabs" role="group" aria-label="Elegir estación">
            {PHASES.map((p) => {
              const Icon = SEASON_ICONS[p]
              const r = ranges.find((x) => x.phase === p)
              return (
                <button
                  key={p}
                  type="button"
                  className="season-tab"
                  data-phase={p}
                  aria-pressed={phase === p}
                  onClick={() => setPicked(p)}
                >
                  <span className="season-tab-icon">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <strong>{PHASE_CONTENT[p].season}</strong>
                  <span>{PHASE_CONTENT[p].name}</span>
                  {r && (
                    <small>
                      Días {r.startDay}–{r.endDay}
                    </small>
                  )}
                  {p === current && <em className="season-tab-today">Hoy</em>}
                </button>
              )
            })}
          </div>
        </header>

        <div key={phase} className="guide-content">
          {current && phase !== current && (
            <div className="sim-banner" role="status">
              <span>Estás leyendo otra estación. La tuya hoy es {PHASE_CONTENT[current].season.toLowerCase()}.</span>
              <button type="button" className="button button-small" onClick={() => setPicked(null)}>
                <Undo2 size={16} aria-hidden="true" />
                Volver a la mía
              </button>
            </div>
          )}

          <section className="guide-scene" aria-label={`La isla en ${content.season.toLowerCase()}`}>
            <SkyPanel phase={phase} avatar={profile.avatar} />
            <figure className="guide-bubble">
              <MochiFace mood={MOCHI_MOOD[phase]} size={40} />
              <blockquote>
                <p>{content.greetings[0]}</p>
              </blockquote>
            </figure>
          </section>

          <section className="guide-summary">
            <span className="phase-pill">
              Fase {content.name.toLowerCase()}
              {range && ` · días ${range.startDay}–${range.endDay}`}
            </span>
            <h2 className="section-title">Qué está pasando</h2>
            <p>{content.summary}</p>
            <HormoneChart
              ranges={ranges}
              cycleLength={state.estimate.cycleLength}
              selected={phase}
              today={state.status === "no_data" ? null : state.cycleDay}
            />
          </section>

          <Glance phase={phase} title="De un vistazo" />

          <section className="block-explorer" aria-labelledby="explorer-title">
            <h2 id="explorer-title" className="eyebrow">
              Cómo te puedes sentir
            </h2>
            <div className="block-tabs" role="group" aria-label="Elegir tema">
              {BLOCKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="block-tab"
                  aria-pressed={block === b.id}
                  onClick={() => setBlock(b.id)}
                >
                  <BlockIcon block={b.id} size={18} />
                  {b.title}
                </button>
              ))}
            </div>
            <article key={block} className="block-card">
              <h3>{guide.headline}</h3>
              <GuideBody guide={guide} />
            </article>
          </section>

          <nav className="season-nav" aria-label="Otras estaciones">
            <button type="button" className="season-nav-button" data-phase={prev} onClick={() => go(prev)}>
              <ArrowLeft size={18} aria-hidden="true" />
              <span>
                <small>Anterior</small>
                {PHASE_CONTENT[prev].season}
              </span>
            </button>
            <button type="button" className="season-nav-button is-next" data-phase={next} onClick={() => go(next)}>
              <span>
                <small>Siguiente</small>
                {PHASE_CONTENT[next].season}
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </nav>

          <ConsultCard />
          <p className="legal-note">{DISCLAIMER}</p>
        </div>
      </main>
      <BottomNav />
    </>
  )
}
