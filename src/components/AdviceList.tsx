import { ChevronDown, Sparkles } from "lucide-react"
import { BLOCK_GUIDES } from "../content/guides"
import { BLOCKS, PHASE_CONTENT, pickVariant, type BlockId } from "../content/phases"
import type { AiAdvice } from "../lib/ai/advice"
import type { Phase } from "../lib/cycle"
import type { PersonalTip } from "../lib/personalize"
import BlockIcon from "./BlockIcon"
import GuideBody from "./GuideBody"

interface Props {
  phase: Phase
  seed: number
  tips: PersonalTip[]
  /** Consejos de la IA. Si falta un bloque, se usa el de las reglas */
  aiAdvice?: AiAdvice | null
}

function personalFor(block: BlockId, tips: PersonalTip[], aiAdvice?: AiAdvice | null) {
  return aiAdvice?.[block] ?? tips.find((t) => t.block === block)?.text
}

/** El consejo destacado: el primero que es para ella o, si no hay, uno que va rotando */
export function FeaturedTip({ phase, seed, tips, aiAdvice }: Props) {
  const personal = BLOCKS.find((b) => personalFor(b.id, tips, aiAdvice))
  const block = personal ?? BLOCKS[seed % BLOCKS.length]!
  const text = personal ? personalFor(block.id, tips, aiAdvice)! : pickVariant(PHASE_CONTENT[phase].blocks[block.id], seed)

  return (
    <section className="featured" aria-label={personal ? "Consejo para ti" : "Consejo de hoy"}>
      <span className="featured-label">
        <BlockIcon block={block.id} size={16} />
        {personal ? "Para ti" : "Consejo de hoy"} · {block.title}
      </span>
      <p>{text}</p>
    </section>
  )
}

/** Los seis bloques como guía: qué suele pasar, por qué y qué hacer */
export default function AdviceList({ phase, tips, aiAdvice }: Props) {
  const guides = BLOCK_GUIDES[phase]
  return (
    <section className="advice-list" aria-labelledby="advice-title">
      <div className="section-head">
        <h2 id="advice-title" className="eyebrow">
          Cómo te puedes sentir
        </h2>
        <span className="section-note">Toca para ver consejos</span>
      </div>
      <ul>
        {BLOCKS.map((block) => {
          const guide = guides[block.id]
          const personal = personalFor(block.id, tips, aiAdvice)
          return (
            <li key={block.id}>
              <details>
                <summary>
                  <span className="advice-icon">
                    <BlockIcon block={block.id} />
                  </span>
                  <span className="advice-text">
                    <span className="advice-title">
                      {block.title}
                      {personal && (
                        <span className="for-you-dot">
                          <span className="sr-only">, con un consejo para ti</span>
                        </span>
                      )}
                    </span>
                    <span className="advice-preview">{guide.headline}</span>
                  </span>
                  <ChevronDown className="advice-chevron" size={18} strokeWidth={1.75} aria-hidden="true" />
                </summary>
                <div className="advice-body">
                  {personal && (
                    <p className="for-you">
                      <span className="for-you-label">
                        <Sparkles size={14} aria-hidden="true" />
                        Para ti
                      </span>
                      {personal}
                    </p>
                  )}

                  <GuideBody guide={guide} />
                </div>
              </details>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
