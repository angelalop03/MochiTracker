import { useEffect, useRef } from "react"
import { PHASE_CONTENT } from "../content/phases"
import type { Phase } from "../lib/cycle"
import MochiAvatar, { isAvatarId } from "./MochiAvatar"
import MochiFace from "./MochiFace"

const ARRIVAL: Record<Phase, string> = {
  menstrual: "Ha llegado el invierno",
  folicular: "Ha llegado la primavera",
  ovulatoria: "Ha llegado el verano",
  lutea: "Ha llegado el otoño",
}

const PARTICLE: Record<Phase, string> = {
  menstrual: "sw-flake",
  folicular: "sw-petal",
  ovulatoria: "sw-spark",
  lutea: "sw-leaf",
}

const MOOD: Record<Phase, string> = { menstrual: "sensible", folicular: "bien", ovulatoria: "genial", lutea: "normal" }

// Posiciones fijas que parecen al azar: así se ve igual cada vez
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 53) % 40) / 10,
  duration: 4 + ((i * 29) % 30) / 10,
  size: 0.7 + ((i * 17) % 7) / 10,
}))

interface Props {
  phase: Phase
  avatar?: string | null
  onClose: () => void
}

/** La primera vez que se abre la app en una estación nueva: una bienvenida corta */
export default function SeasonWelcome({ phase, avatar, onClose }: Props) {
  const button = useRef<HTMLButtonElement>(null)
  const content = PHASE_CONTENT[phase]

  useEffect(() => {
    button.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="season-welcome"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-welcome-title"
      onClick={onClose}
    >
      <div className="sw-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <i
            key={i}
            className={PARTICLE[phase]}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `scale(${p.size})`,
            }}
          />
        ))}
      </div>

      <div className="sw-content">
        <div className="sw-mochi">
          {isAvatarId(avatar) ? <MochiAvatar avatar={avatar} size={128} /> : <MochiFace mood={MOOD[phase]} size={128} />}
        </div>
        <p className="eyebrow">Nueva estación en tu isla</p>
        <h2 id="season-welcome-title">{ARRIVAL[phase]}</h2>
        <p className="sw-phase">Fase {content.name.toLowerCase()}</p>
        <p className="sw-greeting">{content.greetings[0]}</p>
        <button ref={button} type="button" className="button" onClick={onClose}>
          Ver mi día
        </button>
      </div>
    </div>
  )
}
