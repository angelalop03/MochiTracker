import { ChevronDown } from "lucide-react"
import { BLOCKS, PHASE_CONTENT, pickVariant, type BlockId } from "../content/phases"
import type { AiAdvice } from "../lib/ai/advice"
import type { Phase } from "../lib/cycle"
import type { PersonalTip } from "../lib/personalize"
import BlockIcon from "./BlockIcon"

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

/** Los seis bloques como lista: se lee el resumen y se abre el que interesa */
export default function AdviceList({ phase, seed, tips, aiAdvice }: Props) {
  const content = PHASE_CONTENT[phase]
  return (
    <section className="advice-list" aria-labelledby="advice-title">
      <h2 id="advice-title" className="eyebrow">
        Cómo te puedes sentir
      </h2>
      <ul>
        {BLOCKS.map((block) => {
          const base = pickVariant(content.blocks[block.id], seed)
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
                    <span className="advice-preview">{base}</span>
                  </span>
                  <ChevronDown className="advice-chevron" size={18} strokeWidth={1.75} aria-hidden="true" />
                </summary>
                <div className="advice-body">
                  <p>{base}</p>
                  {personal && (
                    <p className="for-you">
                      <span className="for-you-label">Para ti</span>
                      {personal}
                    </p>
                  )}
                </div>
              </details>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
