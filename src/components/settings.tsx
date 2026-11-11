// Piezas de la pantalla de Ajustes: grupos con filas, interruptores y contadores,
// como en los ajustes de una app nativa.

import { ChevronRight, Minus, Plus, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

export function SettingsGroup({ title, footer, children }: { title: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="settings-group" aria-label={title}>
      <h2 className="eyebrow">{title}</h2>
      <div className="settings-card">{children}</div>
      {footer && <p className="settings-footer">{footer}</p>}
    </section>
  )
}

interface RowProps {
  icon: LucideIcon
  label: string
  /** Texto secundario debajo de la etiqueta */
  hint?: string
  /** Valor a la derecha */
  value?: ReactNode
  /** Control a la derecha: interruptor, contador… */
  control?: ReactNode
  to?: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}

export function SettingsRow({ icon: Icon, label, hint, value, control, to, onClick, danger, disabled }: RowProps) {
  const content = (
    <>
      <span className={danger ? "settings-icon is-danger" : "settings-icon"}>
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="settings-label">
        <span className={danger ? "is-danger" : undefined}>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      {value !== undefined && <span className="settings-value">{value}</span>}
      {control}
      {(to || onClick) && !control && <ChevronRight className="settings-chevron" size={18} aria-hidden="true" />}
    </>
  )
  if (to) {
    return (
      <Link className="settings-row is-action" to={to}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" className="settings-row is-action" onClick={onClick} disabled={disabled}>
        {content}
      </button>
    )
  }
  return <div className="settings-row">{content}</div>
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

export function Stepper({
  value,
  min,
  max,
  unit,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  unit: string
  label: string
  onChange: (value: number) => void
}) {
  return (
    <span className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Restar un día a ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <output aria-live="polite">
        {value} <small>{unit}</small>
      </output>
      <button type="button" aria-label={`Sumar un día a ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
