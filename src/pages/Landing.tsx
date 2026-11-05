import { lazy, Suspense, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import StaticIsland from "../components/StaticIsland"
import { CONTRACEPTION_NOTICE, DISCLAIMER, PHASE_CONTENT } from "../content/phases"
import useReveal from "../hooks/useReveal"
import { useSession } from "../hooks/useSession"
import { PHASES, type Phase } from "../lib/cycle"
import { canUse3D } from "../three/support"

const Scene = lazy(() => import("../three/Scene"))

export default function Landing() {
  const session = useSession()
  const [phase, setPhase] = useState<Phase>("folicular")
  const [use3D] = useState(canUse3D)
  useReveal()

  if (session.status === "in") return <Navigate to="/hoy" replace />

  return (
    <div className="landing" data-phase={phase}>
      {use3D && (
        <Suspense fallback={null}>
          <Scene phase={phase} mode="scroll" />
        </Suspense>
      )}

      <main>
        <section className="hero">
          <div className="hero-text">
            <p className="brand">Isla Mochi</p>
            <h1 className="hero-title">Tu ciclo, como las estaciones de una pequeña isla</h1>
            <p className="hero-lead">
              Cada fase es una estación. Mochi te cuenta cómo te puedes sentir hoy, por dentro y por fuera, y qué te puede sentar bien.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/registro">
                Empezar
              </Link>
              <Link className="button button-quiet" to="/entrar">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <div className="mochi-stage" data-mochi-stage>
            {!use3D && <StaticIsland phase={phase} />}
          </div>
        </section>

        <section className="landing-section" data-reveal>
          <div>
            <h2 className="section-title">Cuatro estaciones</h2>
            <p>Toca una para ver cómo cambia la isla.</p>
            <div className="season-picker" role="group" aria-label="Elegir estación">
              {PHASES.map((p) => (
                <button key={p} type="button" aria-pressed={phase === p} onClick={() => setPhase(p)}>
                  {PHASE_CONTENT[p].season}
                </button>
              ))}
            </div>
            <div className="paper-box">
              <h3>Fase {PHASE_CONTENT[phase].name.toLowerCase()}</h3>
              <p>{PHASE_CONTENT[phase].summary}</p>
            </div>
          </div>
          <div className="mochi-stage" data-mochi-stage>
            {!use3D && <StaticIsland phase={phase} />}
          </div>
        </section>

        <section className="landing-section" data-reveal>
          <div>
            <h2 className="section-title">Consejos para cada día</h2>
            <p>No es otra app para apuntar tu regla: para eso ya tienes la tuya. Aquí vienes a entenderte mejor.</p>
            <ul className="feature-list">
              <li>
                <strong>Emociones.</strong> Cómo puedes sentirte y qué te puede ayudar.
              </li>
              <li>
                <strong>Cuerpo.</strong> Los síntomas físicos habituales de cada fase.
              </li>
              <li>
                <strong>Comida.</strong> Qué te puede sentar mejor.
              </li>
              <li>
                <strong>Movimiento.</strong> El tipo de ejercicio que mejor encaja.
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-section" data-reveal>
          <div>
            <h2 className="section-title">Tus datos son tuyos</h2>
            <p>
              Son datos de salud y los tratamos como tales: solo tú puedes verlos, no se venden y puedes borrarlos
              cuando quieras. <Link to="/privacidad">Lee la política de privacidad</Link>.
            </p>
            <Link className="button" to="/registro">
              Crear mi isla
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>{DISCLAIMER}</p>
        <p>{CONTRACEPTION_NOTICE}</p>
      </footer>
    </div>
  )
}
