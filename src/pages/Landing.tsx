import { Droplet, Flower2, Leaf, Lock, Snowflake, Sparkles, Sun, Upload, type LucideIcon } from "lucide-react"
import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import BlockIcon from "../components/BlockIcon"
import MochiAvatar, { AVATAR_IDS, AVATARS } from "../components/MochiAvatar"
import MochiFace from "../components/MochiFace"
import SkyPanel from "../components/SkyPanel"
import ThemeToggle from "../components/ThemeToggle"
import { BLOCK_GUIDES } from "../content/guides"
import { BLOCKS, CONTRACEPTION_NOTICE, DISCLAIMER, PHASE_CONTENT } from "../content/phases"
import useReveal from "../hooks/useReveal"
import { useSession } from "../hooks/useSession"
import { PHASES, type Phase } from "../lib/cycle"

const SEASON_ICONS: Record<Phase, LucideIcon> = {
  menstrual: Snowflake,
  folicular: Flower2,
  ovulatoria: Sun,
  lutea: Leaf,
}

const MOOD: Record<Phase, string> = { menstrual: "sensible", folicular: "bien", ovulatoria: "genial", lutea: "normal" }

/** Portada: la isla primero y, debajo, lo que te cuenta Mochi */
export default function Landing() {
  const session = useSession()
  const [phase, setPhase] = useState<Phase>("folicular")
  useReveal()

  if (session.status === "in") return <Navigate to="/hoy" replace />

  const content = PHASE_CONTENT[phase]

  return (
    <main className="today landing-page" data-phase={phase}>
      <section className="today-hero" aria-label="La isla de Mochi">
        <div className="hero-bar">
          <span className="wordmark">Isla Mochi</span>
          <div className="hero-bar-actions">
            <Link to="/entrar" className="hero-link">
              Entrar
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <SkyPanel phase={phase}>
          <span className="sky-chip">Toca a Mochi</span>
        </SkyPanel>
      </section>

      <div className="today-sheet">
        <header className="today-head landing-head">
          <p className="eyebrow">Una guía de tu ciclo</p>
          <h1 className="season-title">
            Tu ciclo, como las estaciones <span>de una pequeña isla</span>
          </h1>
          <p className="landing-lead">
            Cada fase es una estación. Mochi te cuenta cómo te puedes sentir, por dentro y por fuera, y qué te puede
            sentar bien. Sin apuntarlo todo: para eso ya tienes tu app de siempre.
          </p>
          <div className="landing-actions">
            <Link className="button" to="/registro">
              Crear mi isla
            </Link>
            <Link className="button button-quiet" to="/entrar">
              Ya tengo cuenta
            </Link>
          </div>
        </header>

        <section className="landing-block" data-reveal aria-labelledby="seasons-title">
          <h2 id="seasons-title" className="eyebrow">
            Cuatro estaciones
          </h2>
          <div className="season-tabs" role="group" aria-label="Elegir estación">
            {PHASES.map((p) => {
              const Icon = SEASON_ICONS[p]
              return (
                <button
                  key={p}
                  type="button"
                  className="season-tab"
                  data-phase={p}
                  aria-pressed={phase === p}
                  onClick={() => setPhase(p)}
                >
                  <span className="season-tab-icon">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <strong>{PHASE_CONTENT[p].season}</strong>
                  <span>{PHASE_CONTENT[p].name}</span>
                </button>
              )
            })}
          </div>
          <div key={phase} className="landing-season">
            <figure className="mochi-quote">
              <MochiFace mood={MOOD[phase]} size={48} />
              <blockquote>
                <p>{content.greetings[0]}</p>
                <figcaption>Mochi</figcaption>
              </blockquote>
            </figure>
            <p className="dial-summary">{content.summary}</p>
          </div>
        </section>

        <section className="landing-block" data-reveal aria-labelledby="blocks-title">
          <h2 id="blocks-title" className="eyebrow">
            Lo que te cuenta Mochi
          </h2>
          <p className="landing-text">
            Seis temas en cada estación, con por qué pasa y qué puedes hacer. Ahora, en {content.season.toLowerCase()}:
          </p>
          <ul className="landing-blocks">
            {BLOCKS.map((b) => (
              <li key={b.id}>
                <span className="advice-icon">
                  <BlockIcon block={b.id} />
                </span>
                <span>
                  <strong>{b.title}</strong>
                  <small>{BLOCK_GUIDES[phase][b.id].headline}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-block landing-card" data-reveal aria-labelledby="chat-title">
          <h2 id="chat-title" className="eyebrow">
            Pregúntale a Mochi
          </h2>
          <div className="landing-chat" aria-hidden="true">
            <p className="chat-bubble is-me-bubble">¿Por qué estoy tan cansada estos días?</p>
            <div className="chat-row is-mochi">
              <MochiFace mood="bien" size={32} />
              <p className="chat-bubble">
                En los días antes de la regla es habitual que la energía vaya bajando. Prueba a acostarte un poco antes
                y a cenar algo templado.
              </p>
            </div>
          </div>
          <p className="landing-text">
            <Sparkles size={16} aria-hidden="true" /> Consejos y respuestas con IA, gratis y sin descargar nada. Solo si
            tú quieres, y nunca con tu nombre ni tus notas.
          </p>
        </section>

        <section className="landing-block" data-reveal aria-labelledby="simple-title">
          <h2 id="simple-title" className="eyebrow">
            Sin apuntarlo todo
          </h2>
          <ul className="landing-points">
            <li>
              <span className="card-icon" data-phase="menstrual">
                <Droplet size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <strong>Solo necesita tu regla.</strong> Cuando llegue, la apuntas con un toque, incluso desde la
                notificación.
              </span>
            </li>
            <li>
              <span className="card-icon" data-phase="folicular">
                <Upload size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <strong>¿Usas Clue?</strong> Trae tus fechas y síntomas para que los consejos sean más tuyos.
              </span>
            </li>
            <li>
              <span className="card-icon" data-phase="lutea">
                <Lock size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <strong>Tus datos son tuyos.</strong> Solo tú puedes verlos, no se venden y puedes borrarlos cuando
                quieras. <Link to="/privacidad">Política de privacidad</Link>.
              </span>
            </li>
          </ul>
        </section>

        <section className="landing-block landing-final" data-reveal aria-labelledby="final-title">
          <div className="landing-avatars" aria-hidden="true">
            {AVATAR_IDS.map((id, i) => (
              <span key={id} style={{ animationDelay: `${i * 0.12}s` }}>
                <MochiAvatar avatar={id} size={52} label={AVATARS[id].label} />
              </span>
            ))}
          </div>
          <h2 id="final-title" className="section-title">
            Elige tu Mochi y crea tu isla
          </h2>
          <p className="landing-text">Gratis, sin anuncios y en un minuto.</p>
          <Link className="button" to="/registro">
            Empezar
          </Link>
        </section>

        <footer className="legal-note">
          <p>{DISCLAIMER}</p>
          <p>{CONTRACEPTION_NOTICE}</p>
        </footer>
      </div>
    </main>
  )
}
