import { Check } from "lucide-react"
import MochiAvatar, { AVATAR_IDS, AVATARS, type AvatarId } from "./MochiAvatar"

interface Props {
  value: AvatarId | null
  onChange: (avatar: AvatarId | null) => void
  /** Letra para la opción sin Mochi. Si falta, no se ofrece */
  initial?: string
}

/** Los Mochis para elegir como foto de perfil */
export default function AvatarPicker({ value, onChange, initial }: Props) {
  return (
    <div className="avatar-picker" role="radiogroup" aria-label="Elige tu Mochi">
      {AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          aria-label={AVATARS[id].label}
          className="avatar-option"
          onClick={() => onChange(id)}
        >
          <MochiAvatar avatar={id} size={60} />
          {value === id && (
            <span className="avatar-check" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
        </button>
      ))}
      {initial && (
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          aria-label="Usar mi inicial"
          className="avatar-option"
          onClick={() => onChange(null)}
        >
          <span className="avatar avatar-letter">{initial}</span>
          {value === null && (
            <span className="avatar-check" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
        </button>
      )}
    </div>
  )
}
