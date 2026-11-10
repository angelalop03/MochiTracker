import { useState } from "react"
import { BLOCKS, PHASE_CONTENT, pickVariant, type BlockId } from "../content/phases"
import type { Phase } from "../lib/cycle"
import type { AiAdvice } from "../lib/ai/advice"
import type { PersonalTip } from "../lib/personalize"

/** Los bloques de consejos de la fase. Se abre uno cada vez para no saturar el móvil */
interface Props {
  phase: Phase
  seed: number
  tips: PersonalTip[]
  /** Consejos de la IA. Si falta un bloque, se usa el de las reglas */
  aiAdvice?: AiAdvice | null
}

export default function AdviceBlocks({ phase, seed, tips, aiAdvice }: Props) {
  // Si hay un consejo para ella, se abre directamente ese bloque
  const [open, setOpen] = useState<BlockId>(tips[0]?.block ?? "emociones")
  const content = PHASE_CONTENT[phase]
  const personal = aiAdvice?.[open] ?? tips.find((t) => t.block === open)?.text

  return (
    <section className="advice" aria-labelledby="advice-title">
      <h2 id="advice-title" className="section-title">
        Cómo te puedes sentir
      </h2>
      <div className="advice-tabs" role="group" aria-label="Tipo de consejo">
        {BLOCKS.map((block) => (
          <button
            key={block.id}
            type="button"
            aria-pressed={open === block.id}
            className="advice-tab"
            onClick={() => setOpen(block.id)}
          >
            {block.title}
            {(aiAdvice?.[block.id] || tips.some((t) => t.block === block.id)) && (
              <>
                <span aria-hidden="true"> ♡</span>
                <span className="sr-only"> (con un consejo para ti)</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className="paper-box" aria-live="polite">
        <p>{pickVariant(content.blocks[open], seed)}</p>
        {personal && (
          <p className="for-you">
            <span className="for-you-label">Para ti</span>
            {personal}
          </p>
        )}
      </div>
    </section>
  )
}
