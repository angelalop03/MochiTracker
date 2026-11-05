import { describe, expect, it } from "vitest"
import {
  buildMessages,
  cleanReply,
  describeSituation,
  fitsSituation,
  isSafeAdvice,
  shouldUseAi,
  validateReply,
  type AiDay,
  type AiInput,
} from "../src/lib/ai/advice"
import { PHASE_CONTENT, pickVariant } from "../src/content/phases"

const day = (patch: Partial<AiDay> = {}): AiDay => ({
  date: "2026-11-04",
  symptoms: [],
  mood: null,
  energy: null,
  ...patch,
})

const input: AiInput = {
  phase: "lutea",
  cycleDay: 22,
  seed: 0,
  alarm: false,
  days: [day({ symptoms: ["cansancio", "hinchazon"], mood: "sensible", energy: 2 })],
}

describe("buildMessages", () => {
  const [system, user] = buildMessages(input, "movimiento")

  it("describe lo registrado en lenguaje natural", () => {
    expect(user?.content).toContain("cansancio, hinchazón")
    expect(user?.content).toContain("ánimo: sensible")
    expect(user?.content).toContain("energía: 2 de 5")
  })

  it("adapta un consejo revisado, distinto del que ya se ve en pantalla", () => {
    const variants = PHASE_CONTENT.lutea.blocks.movimiento
    expect(user?.content).toContain(pickVariant(variants, 1))
    expect(user?.content).not.toContain(pickVariant(variants, 0))
  })

  it("el prompt de sistema es orientativo y pide consultar ante señales de alarma", () => {
    expect(system?.content).toMatch(/orientativo/)
    expect(system?.content).toMatch(/nunca diagnostiques/)
    expect(system?.content).toMatch(/consultar con un profesional/)
  })

  it("nunca envía las notas personales", () => {
    const withNotes = { ...input, days: [{ ...input.days[0]!, notes: "secreto-personal" }] }
    expect(JSON.stringify(buildMessages(withNotes, "cuerpo"))).not.toContain("secreto-personal")
  })
})

describe("describeSituation", () => {
  it("une los días sin repetir y usa el último ánimo y energía", () => {
    const text = describeSituation([
      day({ symptoms: ["cansancio"], mood: "triste", energy: 1 }),
      day({ symptoms: ["cansancio", "antojos"], mood: "bien", energy: 3 }),
    ])
    expect(text).toBe("síntomas: cansancio, antojos; ánimo: bien; energía: 3 de 5")
  })

  it("sin datos queda vacío", () => {
    expect(describeSituation([day()])).toBe("")
  })
})

describe("shouldUseAi", () => {
  it("se usa si hay algo que personalizar", () => {
    expect(shouldUseAi(input)).toBe(true)
  })

  it("no gasta el modelo sin datos", () => {
    expect(shouldUseAi({ ...input, days: [] })).toBe(false)
    expect(shouldUseAi({ ...input, days: [day()] })).toBe(false)
  })

  it("con señal de alarma mandan las reglas", () => {
    expect(shouldUseAi({ ...input, alarm: true })).toBe(false)
  })
})

describe("cleanReply", () => {
  it("quita lo que el modelo añade alrededor", () => {
    expect(cleanReply("<think>\n\n</think>\n\nCon ese cansancio, descansa un poco hoy.")).toBe(
      "Con ese cansancio, descansa un poco hoy."
    )
    expect(cleanReply('Respuesta: "Hoy te vendrá bien un paseo."')).toBe("Hoy te vendrá bien un paseo.")
  })
})

describe("isSafeAdvice", () => {
  it.each([
    "Parece que tienes endometriosis, deberías mirártelo pronto.",
    "Puede que esto sea un diagnóstico de ovario poliquístico.",
    "Toma paracetamol cuando te duela la tripa esta tarde.",
    "Toma 600 mg cada ocho horas si te duele mucho hoy.",
    "Quizá estés embarazada si tienes este cansancio hoy.",
    "Haz ayuno intermitente para sentirte más ligera estos días.",
    "Cuenta las calorías de lo que comes durante esta fase.",
    "Para adelgazar evita la cena durante esta semana.",
    "Deja la píldora unos días para ver cómo te sientes.",
    "Descansa y no te preocupes, porque pronto se irán los síntomas.",
    "Hoy te recomiendo descansar y que no te stresses tanto.",
  ])("rechaza: %s", (text) => {
    expect(isSafeAdvice(text)).toBe(false)
  })

  it.each(["Today you should rest and drink plenty of water.", "今天你可以休息一下，喝点温水放松身体。"])(
    "rechaza otros idiomas: %s",
    (text) => {
      expect(isSafeAdvice(text)).toBe(false)
    }
  )

  it("rechaza textos demasiado cortos o largos", () => {
    expect(isSafeAdvice("Descansa.")).toBe(false)
    expect(isSafeAdvice("Descansa un poco hoy. ".repeat(20))).toBe(false)
  })

  it("acepta un consejo normal y recomendar un profesional", () => {
    expect(isSafeAdvice("Con el cansancio que llevas, hoy te puede sentar bien caminar.")).toBe(true)
    expect(isSafeAdvice("Si el dolor es muy fuerte, consúltalo con un profesional sanitario.")).toBe(true)
  })
})

describe("fitsSituation", () => {
  const tired = [day({ energy: 1 })]
  // Frase real de un modelo de prueba, dirigida a alguien ansiosa y con energía 1 de 5
  const intense = "Con esa ansiedad, hoy puedes entrenar con mucha intensidad."

  it("no anima a entrenar fuerte a quien no tiene energía", () => {
    expect(fitsSituation(intense, tired)).toBe(false)
    expect(fitsSituation("Hoy puedes entrenar con ganas.", [day({ symptoms: ["cansancio"] })])).toBe(false)
  })

  it("lo permite si tiene energía", () => {
    expect(fitsSituation(intense, [day({ energy: 5 })])).toBe(true)
  })
})

describe("validateReply", () => {
  it("devuelve el texto limpio si se puede mostrar", () => {
    expect(validateReply("Respuesta: Hoy te sentará bien un paseo tranquilo.", [])).toBe(
      "Hoy te sentará bien un paseo tranquilo."
    )
  })

  it("devuelve null si no pasa alguna comprobación", () => {
    expect(validateReply("Toma ibuprofeno por la noche para dormir mejor.", [])).toBeNull()
    expect(validateReply("Hoy puedes entrenar con mucha intensidad y disfrutar.", [day({ energy: 1 })])).toBeNull()
  })
})
