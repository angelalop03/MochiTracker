import { Bell, BookOpen, Droplet, Flower2, Laptop, Leaf, Snowflake, Sun, X, type LucideIcon } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react"
import { PHASE_CONTENT } from "../content/phases"
import { phaseRanges, PHASES, type Phase } from "../lib/cycle"
import { updateProfile, type Profile } from "../services/data"
import AvatarPicker from "./AvatarPicker"
import CycleDial from "./CycleDial"
import MochiAvatar, { isAvatarId, type AvatarId } from "./MochiAvatar"

const SEASON_ICONS: Record<Phase, LucideIcon> = {
  menstrual: Snowflake,
  folicular: Flower2,
  ovulatoria: Sun,
  lutea: Leaf,
}

interface Slide {
  title: string
  text: ReactNode
  art: ReactNode
}

function Hello() {
  return (
    <div className="tut-hello">
      <span className="tut-spark tut-spark-1" />
      <span className="tut-spark tut-spark-2" />
      <span className="tut-spark tut-spark-3" />
      <MochiAvatar avatar="clasico" size={132} />
    </div>
  )
}

function Seasons() {
  return (
    <div className="tut-seasons">
      {PHASES.map((p, i) => {
        const Icon = SEASON_ICONS[p]
        return (
          <div key={p} className="tut-season" data-phase={p} style={{ animationDelay: `${i * 90}ms` }}>
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            <strong>{PHASE_CONTENT[p].season}</strong>
            <span>{PHASE_CONTENT[p].name}</span>
          </div>
        )
      })}
    </div>
  )
}

function TodayArt() {
  return (
    <div className="tut-today" data-phase="lutea">
      <CycleDial ranges={phaseRanges(28, 5)} cycleDay={22} cycleLength={28} size={128} />
      <div className="tut-today-tags">
        {["Emociones", "Energía", "Piel", "Comida"].map((t, i) => (
          <span key={t} style={{ animationDelay: `${200 + i * 100}ms` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function NoticeArt() {
  return (
    <div className="tut-notice" data-phase="menstrual">
      <div className="tut-push">
        <span className="tut-push-icon">
          <Bell size={16} aria-hidden="true" />
        </span>
        <div>
          <strong>¿Ha llegado el invierno a tu isla?</strong>
          <span>Si ya ha llegado, apúntalo con un toque.</span>
          <div className="tut-push-actions">
            <span>Sí, hoy</span>
            <span>Aún no</span>
          </div>
        </div>
      </div>
      <span className="tut-drop">
        <Droplet size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </div>
  )
}

function IconArt({ icon: Icon, phase }: { icon: LucideIcon; phase: Phase }) {
  return (
    <div className="tut-icon" data-phase={phase}>
      <Icon size={56} strokeWidth={1.5} aria-hidden="true" />
    </div>
  )
}

interface Props {
  profile: Profile
  onSaved: () => Promise<void>
  onClose: () => void
}

/** Minitutorial para quien empieza: siete pantallas cortas con Mochi */
export default function Tutorial({ profile, onSaved, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [avatar, setAvatar] = useState<AvatarId | null>(isAvatarId(profile.avatar) ? profile.avatar : "clasico")
  const dialog = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  const slides: Slide[] = [
    {
      title: "¡Hola! Soy Mochi",
      text: "Esta es tu isla. Te acompaño para entender cómo te puedes sentir en cada momento del ciclo. No es un registro: es una guía con consejos para ti.",
      art: <Hello />,
    },
    {
      title: "Tu ciclo, en cuatro estaciones",
      text: "La regla es el invierno, la fase folicular la primavera, la ovulación el verano y la fase lútea el otoño. Tu isla cambia con ellas.",
      art: <Seasons />,
    },
    {
      title: "Cada día, en Hoy",
      text: "Verás en qué fase estás, qué pasa en tu cuerpo y consejos para tus emociones, energía, cuerpo, piel, comida y movimiento.",
      art: <TodayArt />,
    },
    {
      title: "Solo necesito tu regla",
      text: "Cuando te venga, apúntala con un toque. Si activas los avisos en Ajustes, te preguntaré cuando toque y podrás contestar desde la notificación.",
      art: <NoticeArt />,
    },
    {
      title: "¿Usas Clue?",
      text: "Puedes traer tus fechas y síntomas para que los consejos sean más tuyos. Es más cómodo desde el ordenador: lo tienes en Ajustes → Importar desde Clue.",
      art: <IconArt icon={Laptop} phase="folicular" />,
    },
    {
      title: "La Guía, para curiosear",
      text: "Explora las cuatro estaciones cuando quieras, aunque no sea la tuya, con todo lo que pasa por dentro y qué te puede ayudar.",
      art: <IconArt icon={BookOpen} phase="ovulatoria" />,
    },
    {
      title: "Elige tu Mochi",
      text: (
        <>
          Será tu foto de perfil. Puedes cambiarla cuando quieras en Ajustes.
          <small>Isla Mochi orienta, pero no sustituye a un profesional ni sirve como anticonceptivo.</small>
        </>
      ),
      art: <AvatarPicker value={avatar} onChange={setAvatar} />,
    },
  ]

  const last = step === slides.length - 1
  const slide = slides[step]!

  async function finish() {
    if (avatar !== (profile.avatar ?? null)) {
      try {
        await updateProfile(profile.id, { avatar })
        await onSaved()
      } catch (error) {
        // No pasa nada: se puede elegir luego en Ajustes
        console.error(error)
      }
    }
    onClose()
  }

  useEffect(() => {
    dialog.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  const next = () => (last ? void finish() : setStep(step + 1))
  const prev = () => setStep(Math.max(0, step - 1))

  function onTouchEnd(e: TouchEvent) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0]!.clientX - touchX.current
    touchX.current = null
    if (dx < -50 && !last) next()
    if (dx > 50) prev()
  }

  return (
    <div className="tutorial-backdrop">
      <div
        ref={dialog}
        className="tutorial"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose()
          if (e.key === "ArrowRight" && !last) next()
          if (e.key === "ArrowLeft") prev()
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0]!.clientX)}
        onTouchEnd={onTouchEnd}
      >
        <button type="button" className="tutorial-skip" onClick={onClose}>
          {last ? <X size={18} aria-label="Cerrar" /> : "Saltar"}
        </button>

        <div key={step} className="tutorial-slide">
          <div className="tutorial-art">{slide.art}</div>
          <h2 id="tutorial-title">{slide.title}</h2>
          <p className="tutorial-text">{slide.text}</p>
        </div>

        <div className="tutorial-foot">
          <div className="tutorial-dots" aria-label={`Paso ${step + 1} de ${slides.length}`}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir al paso ${i + 1}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => setStep(i)}
              />
            ))}
          </div>
          <div className="tutorial-actions">
            {step > 0 && (
              <button type="button" className="button button-quiet" onClick={prev}>
                Atrás
              </button>
            )}
            <button type="button" className="button" onClick={next}>
              {last ? "Empezar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
