import { useState } from "react"
import { BLOCKS, PHASE_CONTENT, pickVariant, type BlockId } from "../content/phases"
import type { Phase } from "../lib/cycle"

/** Los 4 bloques de consejos de la fase. Se abre uno cada vez para no saturar el móvil */
export default function AdviceBlocks({ phase, seed }: { phase: Phase; seed: number }) {
  const [open, setOpen] = useState<BlockId>("emociones")
  const content = PHASE_CONTENT[phase]

  return (
    <section className="advice" aria-labelledby="advice-title">
      <h2 id="advice-title" className="section-title">
        Para esta fase
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
          </button>
        ))}
      </div>
      <div className="paper-box" aria-live="polite">
        <p>{pickVariant(content.blocks[open], seed)}</p>
      </div>
    </section>
  )
}
