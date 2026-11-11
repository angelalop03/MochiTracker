import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { providerFromEnv } from "../api/_lib/ai/provider"
import { runAdvice, runChat, type AiKind, type AiStore } from "../api/_lib/ai/run"
import { addDays } from "../src/lib/cycle"

// Prueba con el proveedor REAL y una usuaria INVENTADA. Solo se ejecuta a mano:
//   AI_LIVE=1 npx vitest run tests/ai.live.test.ts
// Lee AI_API_KEY de .env.local sin mostrarla.
function envLocal() {
  try {
    const text = readFileSync(".env.local", "utf8")
    return Object.fromEntries(
      text
        .split(/\r?\n/)
        .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => [m[1], m[2]!.replace(/^"|"$/g, "")])
    ) as Record<string, string>
  } catch {
    return {}
  }
}

const live = process.env.AI_LIVE === "1"

describe.skipIf(!live)("IA real con datos inventados", () => {
  const env = { ...envLocal(), ...process.env }
  const provider = providerFromEnv(env)
  const today = new Date().toISOString().slice(0, 10)
  const start = addDays(today, -21)
  const used: Record<AiKind, number> = { chat: 0, advice: 0 }
  const store: AiStore = {
    used: async () => used,
    take: async (_u, _d, kind, limit) => (used[kind] < limit ? ++used[kind] : null),
    release: async (_u, _d, kind) => void used[kind]--,
    globalTake: async () => true,
    globalTokens: async () => {},
    globalPause: async () => {},
    pausedUntil: async () => null,
    history: async () => ({
      periods: [{ start_date: addDays(start, -56) }, { start_date: addDays(start, -28) }, { start_date: start }],
      logs: [
        { date: addDays(start, -35), symptoms: ["granitos"], mood: null, energy: null },
        { date: addDays(start, -7), symptoms: ["granitos", "hinchazon"], mood: null, energy: null },
        { date: addDays(today, -1), symptoms: ["cansancio", "hinchazon"], mood: "sensible", energy: 2 },
      ],
    }),
  }
  const deps = {
    user: { id: "prueba", timezone: "Europe/Madrid", consent: true, settings: { avgCycleLength: 28, avgPeriodLength: 5 } },
    store,
    provider,
    limits: { chat: 5, advice: 1, globalRequests: 10, globalTokens: 100_000 },
    now: new Date(),
  }

  it("genera consejos válidos", { timeout: 60_000 }, async () => {
    expect(provider).not.toBeNull()
    const t = Date.now()
    const result = await runAdvice(deps)
    console.log(`Consejos (${Date.now() - t} ms, ${provider?.name}):`, JSON.stringify(result.ok ? result.value : result.reason, null, 2))
    expect(result.ok).toBe(true)
  })

  it("responde en el chat manteniendo el hilo", { timeout: 60_000 }, async () => {
    const t = Date.now()
    const first = await runChat(deps, "¿Por qué estoy tan cansada estos días?", [])
    console.log(`Chat 1 (${Date.now() - t} ms):`, first.ok ? first.value : first.reason)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = await runChat(deps, "¿Y qué puedo cenar hoy?", [
      { role: "user", content: "¿Por qué estoy tan cansada estos días?" },
      { role: "assistant", content: first.value },
    ])
    console.log("Chat 2:", second.ok ? second.value : second.reason)
    expect(second.ok).toBe(true)
  })
})
