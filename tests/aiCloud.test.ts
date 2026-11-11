import { describe, expect, it, vi } from "vitest"
import { buildContext, describeContext } from "../api/_lib/ai/context"
import { adviceMessages, chatMessages, checkChatReply, CRISIS_REPLY, parseAdvice } from "../api/_lib/ai/prompts"
import { mockProvider, openAiCompatible, ProviderLimitError, providerFromEnv, type AiProvider } from "../api/_lib/ai/provider"
import { aiStatus, cleanHistory, limitsFromEnv, runAdvice, runChat, type AiKind, type AiStore } from "../api/_lib/ai/run"
import { addDays } from "../src/lib/cycle"
import type { LogEntry } from "../src/lib/personalize"

const TODAY = "2026-11-11"
const now = new Date(`${TODAY}T10:00:00Z`)
const settings = { avgCycleLength: 28, avgPeriodLength: 5 }
// Día 22: fase lútea
const start = addDays(TODAY, -21)
const periods = [{ start_date: addDays(start, -56) }, { start_date: addDays(start, -28) }, { start_date: start }]
const logs: LogEntry[] = [
  { date: addDays(start, -35), symptoms: ["granitos"], mood: null, energy: null },
  { date: addDays(start, -7), symptoms: ["granitos"], mood: null, energy: null },
  { date: addDays(TODAY, -1), symptoms: ["cansancio"], mood: "sensible", energy: 2 },
]

describe("contexto para la IA", () => {
  const ctx = buildContext({ periods, logs, settings, today: TODAY })!

  it("resume fase, días recientes y lo habitual en esta fase", () => {
    expect(ctx.phase).toBe("lutea")
    expect(ctx.cycleDay).toBe(22)
    expect(ctx.recent).toHaveLength(1)
    expect(ctx.usualInPhase).toContain("granitos")
    const text = describeContext(ctx)
    expect(text).toContain("ayer: cansancio; ánimo sensible; energía 2 de 5")
    expect(text).toContain("suele registrar: granitos")
  })

  it("no lleva fechas exactas, nombres ni identificadores", () => {
    const text = describeContext(ctx) + JSON.stringify(adviceMessages(ctx))
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(text).not.toMatch(/@|user_id|\bid\b/)
  })

  it("sin reglas apuntadas no hay contexto", () => {
    expect(buildContext({ periods: [], logs: [], settings, today: TODAY })).toBeNull()
  })
})

describe("validación de lo que escribe la IA", () => {
  const ctx = buildContext({ periods, logs, settings, today: TODAY })!

  it("se queda solo con los consejos seguros", () => {
    const advice = parseAdvice(
      JSON.stringify({
        emociones: "Estos días puede que estés más sensible; date permiso para ir más despacio y pedir espacio.",
        energia: "Toma 400 mg de ibuprofeno y sigue con tu día.",
        movimiento: "Hoy es perfecto para un entreno intenso a tope, aunque estés cansada.",
        comida: "x",
      }),
      ctx
    )
    expect(Object.keys(advice ?? {})).toEqual(["emociones"])
  })

  it("una respuesta que no es JSON no rompe nada", () => {
    expect(parseAdvice("no soy json", ctx)).toBeNull()
  })

  it("en el chat cambia las dosis por una respuesta prudente", () => {
    expect(checkChatReply("Toma 600 mg cada 8 horas")).toMatch(/profesional sanitario/)
    expect(checkChatReply("<think>x</think> Descansa un poco más hoy.")).toBe("Descansa un poco más hoy.")
    expect(checkChatReply("Ideas:\n* **Caldo** caliente\n*  Paseo corto")).toBe("Ideas:\n- Caldo caliente\n- Paseo corto")
  })

  it("el chat solo envía los últimos mensajes y el contexto, sin notas", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({ role: "user" as const, content: `m${i}` }))
    const messages = chatMessages(ctx, history, "hola")
    expect(messages).toHaveLength(1 + 8 + 1)
    expect(messages[0]!.content).toContain("Fase: lútea")
  })

  it("limpia el historial que llega del navegador", () => {
    expect(cleanHistory([{ role: "system", content: "x" }, { role: "user", content: " hola " }, null, 3])).toEqual([
      { role: "user", content: "hola" },
    ])
  })
})

describe("proveedor compatible con OpenAI", () => {
  it("pide un JSON estricto y razonamiento corto a gpt-oss", async () => {
    const fetch = vi.fn(async () =>
      Response.json({ choices: [{ message: { content: "{}" } }], usage: { total_tokens: 321 } })
    )
    const provider = openAiCompatible({ baseUrl: "https://x/v1/", apiKey: "k", model: "openai/gpt-oss-120b", fetch })
    const reply = await provider.complete({ messages: [], maxTokens: 10, temperature: 0.2, json: { name: "n", schema: {} } })
    expect(reply.tokens).toBe(321)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://x/v1/chat/completions")
    const body = JSON.parse(String(init.body))
    expect(body.reasoning_effort).toBe("low")
    expect(body.response_format.json_schema.strict).toBe(true)
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k")
  })

  it("un 429 se convierte en límite con su tiempo de espera", async () => {
    const fetch = vi.fn(async () => new Response("", { status: 429, headers: { "retry-after": "120" } }))
    const provider = openAiCompatible({ baseUrl: "https://x", apiKey: "k", model: "m", fetch })
    await expect(provider.complete({ messages: [], maxTokens: 1, temperature: 0 })).rejects.toMatchObject({
      retryAfterSeconds: 120,
    })
  })

  it("sin clave no hay IA, y se puede usar uno simulado", () => {
    expect(providerFromEnv({})).toBeNull()
    expect(providerFromEnv({ AI_PROVIDER: "mock" })?.name).toBe("simulado")
    expect(providerFromEnv({ AI_API_KEY: "k" })?.name).toBe("openai/gpt-oss-120b")
    expect(providerFromEnv({ AI_API_KEY: "k", AI_MODEL: "llama-3.3-70b-versatile" })?.name).toBe("llama-3.3-70b-versatile")
  })

  it("los límites se configuran con variables de entorno", () => {
    expect(limitsFromEnv({})).toEqual({ chat: 5, advice: 1, globalRequests: 900, globalTokens: 180_000 })
    expect(limitsFromEnv({ AI_CHAT_DAILY: "10", AI_ADVICE_DAILY: "x" })).toMatchObject({ chat: 10, advice: 1 })
  })
})

function fakeStore(history = { periods, logs }) {
  const used: Record<AiKind, number> = { chat: 0, advice: 0 }
  const state = { requests: 0, tokens: 0, paused: null as Date | null, released: 0 }
  const store: AiStore = {
    used: async () => ({ ...used }),
    take: async (_u, _d, kind, limit) => (used[kind] < limit ? ++used[kind] : null),
    release: async (_u, _d, kind) => {
      used[kind]--
      state.released++
    },
    globalTake: async (_d, limits) => (state.requests < limits.globalRequests ? (state.requests++, true) : false),
    globalTokens: async (_d, n) => void (state.tokens += n),
    globalPause: async (_d, until) => void (state.paused = until),
    pausedUntil: async () => state.paused,
    history: async () => history,
  }
  return { store, used, state }
}

const limits = { chat: 5, advice: 1, globalRequests: 100, globalTokens: 100_000 }
const user = { id: "ana", timezone: "Europe/Madrid", consent: true, settings }
const counting = (provider: AiProvider) => {
  const spy = vi.spyOn(provider, "complete")
  return { provider, spy }
}

describe("recorrido de cada consulta", () => {
  it("genera consejos y gasta una del cupo diario", async () => {
    const { store } = fakeStore()
    const result = await runAdvice({ user, store, provider: mockProvider(), limits, now })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(Object.keys(result.value)).toHaveLength(6)
      expect(result.status.advice).toEqual({ used: 1, limit: 1, remaining: 0 })
      expect(result.status.resetsOn).toBe("2026-11-12")
    }
    const again = await runAdvice({ user, store, provider: mockProvider(), limits, now })
    expect(again).toMatchObject({ ok: false, reason: "user_limit" })
  })

  it("sin consentimiento no se envía nada", async () => {
    const { provider, spy } = counting(mockProvider())
    const result = await runChat({ user: { ...user, consent: false }, store: fakeStore().store, provider, limits, now }, "hola", [])
    expect(result).toMatchObject({ ok: false, reason: "consent" })
    expect(spy).not.toHaveBeenCalled()
  })

  it("sin proveedor configurado la IA no está disponible", async () => {
    const result = await runChat({ user, store: fakeStore().store, provider: null, limits, now }, "hola", [])
    expect(result).toMatchObject({ ok: false, reason: "unavailable" })
  })

  it("si el proveedor falla, devuelve el cupo", async () => {
    const { store, used } = fakeStore()
    const provider: AiProvider = { name: "roto", complete: async () => Promise.reject(new Error("caído")) }
    vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await runChat({ user, store, provider, limits, now }, "hola", [])
    expect(result).toMatchObject({ ok: false, reason: "failed" })
    expect(used.chat).toBe(0)
  })

  it("si el proveedor avisa de límite, pausa la IA para todas sin gastar cupo", async () => {
    const { store, used, state } = fakeStore()
    const provider: AiProvider = { name: "lleno", complete: async () => Promise.reject(new ProviderLimitError(300)) }
    const result = await runChat({ user, store, provider, limits, now }, "hola", [])
    expect(result).toMatchObject({ ok: false, reason: "paused" })
    expect(used.chat).toBe(0)
    expect(state.paused?.getTime()).toBe(now.getTime() + 300_000)

    const { provider: next, spy } = counting(mockProvider())
    const later = await runChat({ user, store, provider: next, limits, now }, "hola", [])
    expect(later).toMatchObject({ ok: false, reason: "paused" })
    expect(spy).not.toHaveBeenCalled()
    expect((await aiStatus({ user, store, provider: next, limits, now })).pausedUntil).not.toBeNull()
  })

  it("respeta el tope global y no llama al proveedor", async () => {
    const { store } = fakeStore()
    const { provider, spy } = counting(mockProvider())
    const result = await runChat({ user, store, provider, limits: { ...limits, globalRequests: 0 }, now }, "hola", [])
    expect(result).toMatchObject({ ok: false, reason: "global_limit" })
    expect(spy).not.toHaveBeenCalled()
  })

  it("el chat permite 5 mensajes al día", async () => {
    const { store } = fakeStore()
    const results = []
    for (let i = 0; i < 6; i++) results.push(await runChat({ user, store, provider: mockProvider(), limits, now }, "hola", []))
    expect(results.filter((r) => r.ok)).toHaveLength(5)
    expect(results[5]).toMatchObject({ ok: false, reason: "user_limit" })
  })

  it("ante una crisis responde con ayuda inmediata, sin IA ni cupo", async () => {
    const { store, used } = fakeStore()
    const { provider, spy } = counting(mockProvider())
    const result = await runChat({ user, store, provider, limits, now }, "a veces pienso en hacerme daño", [])
    expect(result).toMatchObject({ ok: true, value: CRISIS_REPLY })
    expect(spy).not.toHaveBeenCalled()
    expect(used.chat).toBe(0)
  })

  it("con señales de alarma no genera consejos: mandan las reglas", async () => {
    const alarm: LogEntry[] = [0, 1, 2].map((n) => ({
      date: addDays(TODAY, -n),
      symptoms: ["dolor_fuerte"],
      mood: null,
      energy: null,
    }))
    const { provider, spy } = counting(mockProvider())
    const result = await runAdvice({ user, store: fakeStore({ periods, logs: alarm }).store, provider, limits, now })
    expect(result).toMatchObject({ ok: false, reason: "no_data" })
    expect(spy).not.toHaveBeenCalled()
  })
})
