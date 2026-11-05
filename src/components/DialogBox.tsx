import type { ReactNode } from "react"

/** Caja de diálogo de RPG: es la voz de Mochi en la app */
export default function DialogBox({ speaker, children }: { speaker?: string; children: ReactNode }) {
  return (
    <div className="dialog-box">
      {speaker && <span className="dialog-speaker">{speaker}</span>}
      <div className="dialog-text">{children}</div>
    </div>
  )
}
