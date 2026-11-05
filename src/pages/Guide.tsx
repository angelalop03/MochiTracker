import { useState } from "react"
import BottomNav from "../components/BottomNav"
import ConsultCard from "../components/ConsultCard"
import Loading from "../components/Loading"
import StaticIsland from "../components/StaticIsland"
import { BLOCKS, DISCLAIMER, PHASE_CONTENT } from "../content/phases"
import { useCycleData } from "../hooks/useCycleData"
import { getCycleState, PHASES, todayInTimeZone, type Phase } from "../lib/cycle"

/** Toda la información por fase, para leerla con calma aunque no sea tu fase de hoy */
export default function Guide() {
  const { profile, periods } = useCycleData()
  const [picked, setPicked] = useState<Phase | null>(null)
  if (!profile) return <Loading />

  const state = getCycleState(
    periods,
    { avgCycleLength: profile.avg_cycle_length, avgPeriodLength: profile.avg_period_length },
    todayInTimeZone(profile.timezone)
  )
  const current = state.status === "no_data" ? null : state.phase
  const phase = picked ?? current ?? "menstrual"
  const content = PHASE_CONTENT[phase]

  return (
    <>
      <main className="narrow-page with-nav" data-phase={phase}>
        <h1 className="page-title">Guía del ciclo</h1>
        <p>Cómo te puedes sentir en cada fase, por dentro y por fuera, y qué te puede ayudar.</p>

        <div className="season-picker" role="group" aria-label="Elegir fase">
          {PHASES.map((p) => (
            <button key={p} type="button" aria-pressed={phase === p} onClick={() => setPicked(p)}>
              {PHASE_CONTENT[p].name}
            </button>
          ))}
        </div>

        <div className="sky-panel guide-sky">
          <StaticIsland phase={phase} />
        </div>

        <section className="paper-box">
          <h2 className="section-title">
            {content.season}
            {phase === current ? " · Tu fase de hoy" : ""}
          </h2>
          <p>{content.summary}</p>
        </section>

        {BLOCKS.map((block) => (
          <section key={block.id} className="paper-box">
            <h2 className="section-title">{block.title}</h2>
            <ul className="guide-tips">
              {content.blocks[block.id].map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        ))}

        <ConsultCard />
        <p className="legal-note">{DISCLAIMER}</p>
      </main>
      <BottomNav />
    </>
  )
}
