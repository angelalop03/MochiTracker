import type { VercelRequest, VercelResponse } from "@vercel/node"
import { addDays } from "../../src/lib/cycle.js"
import { providerFromEnv } from "../_lib/ai/provider.js"
import { limitsFromEnv, runAdvice, runChat, type AiKind, type AiStore } from "../_lib/ai/run.js"
import { sameSecret } from "../_lib/server.js"

// Prueba la IA real con una usuaria INVENTADA, sin tocar la base de datos ni datos reales.
// Protegido con el mismo secreto que el cron.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store")
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Método no permitido" })
  }
  const secret = process.env.CRON_SECRET
  if (!secret || !sameSecret(req.headers.authorization ?? "", `Bearer ${secret}`)) {
    return res.status(401).json({ error: "No autorizado" })
  }

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const used: Record<AiKind, number> = { chat: 0, advice: 0 }
  // Ciclos de 28 días; hoy es el día 22 (fase lútea), con cansancio e hinchazón estos días
  // y granitos en la fase lútea de ciclos anteriores
  const start = addDays(today, -21)
  const fake: AiStore = {
    used: async () => used,
    take: async (_u, _d, kind, limit) => (used[kind] < limit ? ++used[kind] : null),
    release: async (_u, _d, kind) => void (used[kind] = Math.max(0, used[kind] - 1)),
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
        { date: today, symptoms: ["cansancio"], mood: null, energy: 2 },
      ],
    }),
  }
  const deps = {
    user: { id: "prueba", timezone: "Europe/Madrid", consent: true, settings: { avgCycleLength: 28, avgPeriodLength: 5 } },
    store: fake,
    provider: providerFromEnv(),
    limits: { ...limitsFromEnv(), chat: 5, advice: 1 },
    now,
  }

  const t0 = Date.now()
  const advice = await runAdvice(deps)
  const t1 = Date.now()
  const chat = await runChat(deps, "¿Por qué estoy tan cansada estos días y qué puedo cenar hoy?", [])
  const t2 = Date.now()
  return res.status(200).json({
    model: deps.provider?.name ?? null,
    advice: advice.ok ? advice.value : advice.reason,
    adviceMs: t1 - t0,
    chat: chat.ok ? chat.value : chat.reason,
    chatMs: t2 - t1,
  })
}
