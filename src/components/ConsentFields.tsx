import { Link } from "react-router-dom"
import { MIN_AGE } from "../content/legal"

interface Props {
  health: boolean
  terms: boolean
  onHealth: (value: boolean) => void
  onTerms: (value: boolean) => void
}

/** Dos casillas separadas y sin marcar: el consentimiento de datos de salud tiene que ser explícito */
export default function ConsentFields({ health, terms, onHealth, onTerms }: Props) {
  return (
    <fieldset className="consent">
      <legend>Tu consentimiento</legend>
      <label className="check">
        <input type="checkbox" checked={health} onChange={(e) => onHealth(e.target.checked)} required />
        <span>
          Doy mi consentimiento explícito para que Isla Mochi trate mis <strong>datos de salud</strong> (fechas
          de regla, síntomas, ánimo y energía) con el único fin de mostrarme información sobre mi ciclo. Puedo
          retirarlo cuando quiera borrando mi cuenta.
        </span>
      </label>
      <label className="check">
        <input type="checkbox" checked={terms} onChange={(e) => onTerms(e.target.checked)} required />
        <span>
          Tengo {MIN_AGE} años o más y he leído la{" "}
          <Link to="/privacidad" target="_blank">
            política de privacidad
          </Link>
          .
        </span>
      </label>
    </fieldset>
  )
}
