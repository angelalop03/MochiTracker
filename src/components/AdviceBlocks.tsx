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
      <div className="advice-tabs" role="tablist" aria-label="Tipo de consejo">
        {BLOCKS.map((block) => (
          <button
            key={block.id}
            id={`tab-${block.id}`}
            type="button"
            role="tab"
            aria-selected={open === block.id}
            aria-controls="advice-panel"
            className="advice-tab"
            onClick={() => setOpen(block.id)}
          >
            {block.title}
          </button>
        ))}
      </div>
      <div id="advice-panel" role="tabpanel" aria-labelledby={`tab-${open}`} className="paper-box">
        <p>{pickVariant(content.blocks[open], seed)}</p>
      </div>
    </section>
  )
}
