import { Footprints, PersonStanding, Smile, Soup, Sparkles, Zap, type LucideProps } from "lucide-react"
import type { BlockId } from "../content/phases"

const ICONS: Record<BlockId, (props: LucideProps) => React.ReactNode> = {
  emociones: Smile,
  energia: Zap,
  cuerpo: PersonStanding,
  piel: Sparkles,
  comida: Soup,
  movimiento: Footprints,
}

export default function BlockIcon({ block, size = 20 }: { block: BlockId; size?: number }) {
  const Icon = ICONS[block]
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />
}
