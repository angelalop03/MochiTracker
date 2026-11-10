import { describe, expect, it, vi } from "vitest"
import handler from "../api/cron/daily"
import { renderEmail } from "../api/_lib/email"
import { planNotice, type Recipient } from "../api/_lib/notifications"
import { runDaily, type Claim, type PushTarget, type Store } from "../api/_lib/runDaily"
import { brevoPayload, sameSecret, unsubscribeToken } from "../api/_lib/server"
import type { Phase } from "../src/lib/cycle"
import type { LogEntry } from "../src/lib/personalize"

const user = (patch: Partial<Recipient> = {}): Recipient => ({
  id: "ana",
  name: "Ana",
  avg_cycle_length: 28,
  avg_period_length: 5,
  notify_email: true,
  notify_push: false,
  notify_frequency: "daily",
  timezone: "Europe/Madrid",
  ...patch,
})

const periods = [{ start_date: "2026-10-01" }]
const at = (date: string) => new Date(`${date}T07:00:00Z`)
const plan = (date: string, patch: Partial<Recipient> = {}, lastPhase: Phase | null = null, logs: LogEntry[] = []) =>
  planNotice({ user: user(patch), periods, logs, lastPhase, now: at(date) })

describe("planNotice", () => {
  it("con aviso diario envía uno cada día", () => {
    expect(plan("2026-10-03")).toMatchObject({ kind: "daily", phase: "menstrual", title: "Mochi te ha dejado un consejo" })
  })

  it("el día que cambia de fase anuncia la estación", () => {
    expect(plan("2026-10-06")).toMatchObject({
      kind: "phase_change",
      phase: "folicular",
      title: "Ha llegado la primavera a tu isla",
    })
  })

  it("con solo cambios de fase no envía nada los demás días", () => {
    expect(plan("2026-10-03", { notify_frequency: "phase_change" })).toBeNull()
    expect(plan("2026-10-06", { notify_frequency: "phase_change" })?.kind).toBe("phase_change")
  })

  it("recupera un cambio de fase perdido si el cron no corrió ayer", () => {
    const notice = plan("2026-10-07", { notify_frequency: "phase_change" }, "menstrual")
    expect(notice).toMatchObject({ kind: "phase_change", phase: "folicular" })
  })

  it("no repite el aviso de una fase ya avisada", () => {
    expect(plan("2026-10-07", { notify_frequency: "phase_change" }, "folicular")).toBeNull()
  })

  it("usa la fecha de su zona horaria", () => {
    // 23:30 UTC del día 5 ya es el día 6 en Madrid, cuando empieza la fase folicular
    const now = new Date("2026-10-05T23:30:00Z")
    expect(planNotice({ user: user(), periods, logs: [], lastPhase: null, now })?.date).toBe("2026-10-06")
    const mexico = planNotice({ user: user({ timezone: "America/Mexico_City" }), periods, logs: [], lastPhase: null, now })
    expect(mexico?.date).toBe("2026-10-05")
  })

  it("sin datos fiables no envía nada", () => {
    expect(planNotice({ user: user(), periods: [], logs: [], lastPhase: null, now: at("2026-10-03") })).toBeNull()
    expect(plan("2026-12-15")).toBeNull()
  })

  it("incluye el consejo personalizado por reglas", () => {
    const logs = [
      { date: "2026-10-21", symptoms: ["cansancio"], mood: null, energy: null },
      { date: "2026-10-22", symptoms: ["cansancio"], mood: null, energy: null },
    ]
    const notice = plan("2026-10-22", {}, null, logs)
    // El primero con consejo para ella va destacado, y los demás se marcan como suyos
    expect(notice).toMatchObject({ blockTitle: "Energía", tipForYou: true })
    const movement = notice?.blocks.find((b) => b.title === "Movimiento")
    expect(movement?.forYou).toBe(true)
    expect(movement?.text).toMatch(/en esta fase es muy habitual/)
  })

  it("va rotando el bloque de consejos", () => {
    const blocks = new Set(["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"].map((d) => plan(d)?.blockTitle))
    expect(blocks.size).toBe(4)
  })

  it("lo que se ve en la pantalla de bloqueo nunca menciona el ciclo", () => {
    const forbidden = /regla|menstru|ovul|l[uú]tea|folicular|ciclo|sangr/i
    for (let day = 1; day <= 28; day++) {
      const notice = plan(`2026-10-${String(day).padStart(2, "0")}`)!
      expect(notice.title).not.toMatch(forbidden)
      expect(notice.pushBody).not.toMatch(forbidden)
    }
  })
})

describe("planNotice con todos los bloques", () => {
  it("incluye el destacado y los otros 5 bloques, sin repetir", () => {
    const notice = plan("2026-10-22")!
    expect(notice.blocks).toHaveLength(5)
    expect(notice.blocks.map((b) => b.title)).not.toContain(notice.blockTitle)
    expect(notice.cycleDay).toBe(22)
    expect(notice.next?.phase).toBe("menstrual")
  })

  it("con force envía aunque no toque", () => {
    const onlyChanges = user({ notify_frequency: "phase_change" })
    const input = { user: onlyChanges, periods, logs: [], lastPhase: null, now: at("2026-10-03") }
    expect(planNotice(input)).toBeNull()
    expect(planNotice({ ...input, force: true })?.kind).toBe("daily")
  })
})

describe("renderEmail", () => {
  const context = { name: "Ana <b>", appUrl: "https://isla.test", unsubscribeUrl: "https://isla.test/api/unsubscribe?u=1&t=2" }

  it("lleva saludo, consejo, enlace a Hoy y enlace de baja, y escapa el nombre", () => {
    const mail = renderEmail(plan("2026-10-03")!, context)
    expect(mail.html).toContain("https://isla.test/hoy")
    expect(mail.html).toContain("https://isla.test/email/invierno.jpg")
    expect(mail.html).toContain("Día 3 · Fase menstrual · Invierno")
    expect(mail.html).toContain("Qué está pasando")
    expect(mail.html).toContain("Cambiar mis avisos")
    expect(mail.html).toContain("api/unsubscribe")
    expect(mail.html).toContain("Ana &lt;b&gt;")
    expect(mail.html).not.toContain("<b>")
    expect(mail.html).toContain("Dejar de recibir")
  })

  it("con señal de alarma recomienda consultar", () => {
    const logs = [{ date: "2026-10-03", symptoms: ["dolor_fuerte"], mood: null, energy: null }]
    expect(renderEmail(plan("2026-10-03", {}, null, logs)!, context).html).toMatch(/consultarlo con un profesional/)
  })
})

function fakeStore(users: Recipient[], targets: PushTarget[] = []) {
  const claimed = new Set<string>()
  const key = (c: Claim) => [c.userId, c.date, c.kind, c.channel].join("|")
  const removed: string[] = []
  const store: Store = {
    recipients: async () => users,
    history: async () => ({ periods, logs: [], lastPhase: null }),
    claim: async (c) => {
      if (claimed.has(key(c))) return false
      claimed.add(key(c))
      return true
    },
    release: async (c) => void claimed.delete(key(c)),
    pushTargets: async () => targets,
    removePushTarget: async (endpoint) => void removed.push(endpoint),
  }
  return { store, claimed, removed }
}

const quiet = () => vi.spyOn(console, "error").mockImplementation(() => {})

describe("runDaily", () => {
  const now = at("2026-10-03")
  const target = { endpoint: "https://push/1", p256dh: "k", auth: "a" }

  it("repetir el cron el mismo día no duplica nada", async () => {
    const { store } = fakeStore([user({ notify_push: true })], [target])
    const email = vi.fn(async () => {})
    const push = vi.fn(async () => {})
    await runDaily({ store, senders: { email, push }, now })
    await runDaily({ store, senders: { email, push }, now })
    expect(email).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledTimes(1)
  })

  it("si un email falla se libera para reintentarlo", async () => {
    quiet()
    const { store, claimed } = fakeStore([user()])
    const report = await runDaily({
      store,
      senders: { email: async () => Promise.reject(new Error("caído")), push: async () => {} },
      now,
    })
    expect(report).toMatchObject({ emails: 0, failed: 1 })
    expect(claimed.size).toBe(0)
  })

  it("borra los dispositivos que ya no existen", async () => {
    const { store, removed } = fakeStore([user({ notify_email: false, notify_push: true })], [target])
    const gone = Object.assign(new Error("gone"), { statusCode: 410 })
    await runDaily({ store, senders: { email: async () => {}, push: async () => Promise.reject(gone) }, now })
    expect(removed).toEqual(["https://push/1"])
  })

  it("con un error temporal de push libera para reintentar", async () => {
    quiet()
    const { store, claimed, removed } = fakeStore([user({ notify_email: false, notify_push: true })], [target])
    const down = Object.assign(new Error("caído"), { statusCode: 503 })
    await runDaily({ store, senders: { email: async () => {}, push: async () => Promise.reject(down) }, now })
    expect(claimed.size).toBe(0)
    expect(removed).toEqual([])
  })

  it("al llegar al límite de emails prioriza los cambios de fase", async () => {
    // El día 6 empieza la folicular para quien tuvo la regla el 1; para las demás es un día normal
    const users = [user({ id: "diaria" }), user({ id: "cambio" })]
    const { store } = fakeStore(users)
    store.history = async (id) => ({
      periods: id === "cambio" ? periods : [{ start_date: "2026-10-03" }],
      logs: [],
      lastPhase: null,
    })
    const sent: string[] = []
    const report = await runDaily({
      store,
      senders: { email: async (u) => void sent.push(u.id), push: async () => {} },
      now: at("2026-10-06"),
      emailCap: 1,
    })
    expect(sent).toEqual(["cambio"])
    expect(report.skippedByCap).toBe(1)
  })

  it("un fallo con una usuaria no para a las demás", async () => {
    quiet()
    const { store } = fakeStore([user({ id: "rota" }), user({ id: "bien" })])
    const history = store.history
    store.history = async (id) => {
      if (id === "rota") throw new Error("mal")
      return history(id)
    }
    const report = await runDaily({ store, senders: { email: async () => {}, push: async () => {} }, now })
    expect(report).toMatchObject({ emails: 1, failed: 1 })
  })
})

describe("brevoPayload", () => {
  it("prepara el envío con su enlace de baja en un clic", () => {
    const payload = brevoPayload(
      { name: "Isla Mochi", email: "mochi@test.dev" },
      "ana@test.dev",
      { subject: "Asunto", html: "<p>Hola</p>" },
      "https://isla.test/baja"
    )
    expect(payload).toMatchObject({
      sender: { email: "mochi@test.dev" },
      to: [{ email: "ana@test.dev" }],
      subject: "Asunto",
      htmlContent: "<p>Hola</p>",
    })
    expect(payload.headers["List-Unsubscribe"]).toBe("<https://isla.test/baja>")
  })
})

describe("seguridad", () => {
  const response = () => {
    const res = { code: 0, status: (c: number) => ((res.code = c), res), json: () => res }
    return res
  }
  const call = async (authorization?: string) => {
    const res = response()
    await handler({ headers: { authorization } } as never, res as never)
    return res.code
  }

  it("el cron rechaza peticiones sin el secreto correcto", async () => {
    vi.stubEnv("CRON_SECRET", "secreto-de-prueba")
    expect(await call()).toBe(401)
    expect(await call("Bearer otro")).toBe(401)
    vi.unstubAllEnvs()
  })

  it("sin CRON_SECRET configurado rechaza todo", async () => {
    vi.stubEnv("CRON_SECRET", "")
    expect(await call("Bearer ")).toBe(401)
    vi.unstubAllEnvs()
  })

  it("el enlace de baja está firmado por usuaria", () => {
    const token = unsubscribeToken("ana", "s")
    expect(sameSecret(token, unsubscribeToken("ana", "s"))).toBe(true)
    expect(sameSecret(token, unsubscribeToken("bea", "s"))).toBe(false)
    expect(sameSecret(token, "corto")).toBe(false)
  })
})
