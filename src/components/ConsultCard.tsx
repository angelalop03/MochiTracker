import { WHEN_TO_CONSULT } from "../content/phases"

export default function ConsultCard() {
  return (
    <details className="consult">
      <summary>{WHEN_TO_CONSULT.title}</summary>
      <p>{WHEN_TO_CONSULT.intro}</p>
      <ul>
        {WHEN_TO_CONSULT.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="consult-urgent">{WHEN_TO_CONSULT.urgent}</p>
    </details>
  )
}
