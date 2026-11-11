import { describe, expect, it } from "vitest"
import { renderPeriodCheckEmail } from "../api/_lib/email"
import { planNotice, type Recipient } from "../api/_lib/notifications"
import { parsePeriodRequest } from "../api/_lib/periodCheck"
import { pushPayload, runDaily, type PushPayload, type Store } from "../api/_lib/runDaily"
import { periodToken } from "../api/_lib/server"

const user = (patch: Partial<Recipient> = {}): Recipient => ({
  id: "ana",
  name: "Ana",
  avg_cycle_length: 28,
  avg_period_length: 5,
  notify_email: true,
  notify_push: true,
  notify_frequency: "phase_change",
  timezone: "Europe/Madrid",
  ...patch,
})

// Regla el 1 de octubre y ciclos de 28 días: la siguiente se espera el 29
const periods = [{ start_date: "2026-10-01" }]
const at = (date: string) => new Date(`${date}T07:00:00Z`)
const plan = (date: string, patch: Partial<Recipient> = {}) =>
  planNotice({ user: user(patch), periods, logs: [], lastPhase: "lutea", now: at(date) })

describe("pregunta de la regla", () => {
  it("pregunta el día previsto y dos veces más si no se apunta", () => {
    expect(plan("2026-10-29")?.kind).toBe("period_check")
    expect(plan("2026-10-31")?.kind).toBe("period_check")
    expect(plan("2026-11-04")?.kind).toBe("period_check")
  })

  it("no insiste los demás días", () => {
    expect(plan("2026-10-28")).toBeNull()
    expect(plan("2026-10-30")).toBeNull()
    expect(plan("2026-11-02")).toBeNull()
  })

  it("con aviso diario, ese día la pregunta sustituye al consejo", () => {
    expect(plan("2026-10-29", { notify_frequency: "daily" })?.kind).toBe("period_check")
    expect(plan("2026-10-30", { notify_frequency: "daily" })?.kind).toBe("daily")
  })

  it("si la regla ya está apuntada no pregunta", () => {
    const notice = planNotice({
      user: user(),
      periods: [...periods, { start_date: "2026-10-28" }],
      logs: [],
      lastPhase: "lutea",
      now: at("2026-10-29"),
    })
    expect(notice?.kind).not.toBe("period_check")
  })

  it("el título que se ve en la pantalla de bloqueo no menciona el ciclo", () => {
    const notice = plan("2026-10-29")!
    for (const text of [notice.title, notice.pushBody]) {
      expect(text).not.toMatch(/regla|menstru|ovula|ciclo|sangr/i)
    }
  })

  it("el push lleva los datos para el botón y el consejo diario no", () => {
    expect(pushPayload("ana", plan("2026-10-29")!).periodCheck).toEqual({ userId: "ana", date: "2026-10-29" })
    const daily = planNotice({ user: user({ notify_frequency: "daily" }), periods, logs: [], lastPhase: null, now: at("2026-10-10") })!
    expect(pushPayload("ana", daily).periodCheck).toBeUndefined()
  })

  it("el correo es corto, escapa el nombre y enlaza a Hoy", () => {
    const mail = renderPeriodCheckEmail(plan("2026-10-31")!, {
      name: "<Ana>",
      appUrl: "https://isla.test",
      unsubscribeUrl: "https://isla.test/api/unsubscribe?u=ana&t=x",
    })
    expect(mail.subject).toBe("¿Ha llegado el invierno a tu isla?")
    expect(mail.html).toContain("&lt;Ana&gt;")
    expect(mail.html).toContain("https://isla.test/hoy")
    expect(mail.html).toContain("hace 2 días")
  })

  it("runDaily envía la pregunta con los botones", async () => {
    const sent: PushPayload[] = []
    const store: Store = {
      recipients: async () => [user({ notify_email: false })],
      history: async () => ({ periods, logs: [], lastPhase: "lutea" }),
      claim: async () => true,
      release: async () => {},
      pushTargets: async () => [{ endpoint: "https://push/1", p256dh: "k", auth: "a" }],
      removePushTarget: async () => {},
    }
    await runDaily({ store, senders: { email: async () => {}, push: async (_, p) => void sent.push(p) }, now: at("2026-10-29") })
    expect(sent).toHaveLength(1)
    expect(sent[0]?.periodCheck?.date).toBe("2026-10-29")
  })
})

describe("botón «Sí, hoy»", () => {
  const secret = "secreto"
  const now = at("2026-10-30")
  const body = (patch: Record<string, unknown> = {}) => ({
    u: "ana",
    d: "2026-10-29",
    t: periodToken("ana", "2026-10-29", secret),
    day: "2026-10-30",
    ...patch,
  })

  it("acepta el día del aviso y los siguientes", () => {
    expect(parsePeriodRequest(body(), secret, now)).toEqual({ ok: true, userId: "ana", day: "2026-10-30" })
    expect(parsePeriodRequest(body({ day: "2026-10-29" }), secret, now).ok).toBe(true)
  })

  it("rechaza una firma de otra usuaria o de otro día", () => {
    expect(parsePeriodRequest(body({ u: "bea" }), secret, now)).toMatchObject({ ok: false, status: 401 })
    expect(parsePeriodRequest(body({ d: "2026-10-28" }), secret, now)).toMatchObject({ ok: false, status: 401 })
    expect(parsePeriodRequest(body(), "otro", now)).toMatchObject({ ok: false, status: 401 })
  })

  it("rechaza días anteriores al aviso, muy posteriores o en el futuro", () => {
    expect(parsePeriodRequest(body({ day: "2026-10-28" }), secret, now)).toMatchObject({ status: 410 })
    expect(parsePeriodRequest(body({ day: "2026-11-05" }), secret, at("2026-11-05"))).toMatchObject({ status: 410 })
    expect(parsePeriodRequest(body({ day: "2026-11-01" }), secret, now)).toMatchObject({ status: 410 })
  })

  it("rechaza datos que faltan o mal formados", () => {
    expect(parsePeriodRequest(null, secret, now)).toMatchObject({ status: 400 })
    expect(parsePeriodRequest(body({ day: "ayer" }), secret, now)).toMatchObject({ status: 400 })
  })
})
