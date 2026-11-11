import { describe, expect, it } from "vitest"
import { cleanReply, fitsSituation, isSafeAdvice, validateReply, type AiDay } from "../src/lib/ai/advice"

const day = (patch: Partial<AiDay> = {}): AiDay => ({
  date: "2026-11-04",
  symptoms: [],
  mood: null,
  energy: null,
  ...patch,
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
