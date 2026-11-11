import type { VercelRequest, VercelResponse } from "@vercel/node"
import { noStore, sendFailure } from "../_lib/ai/http.js"
import { providerFromEnv } from "../_lib/ai/provider.js"
import { cleanHistory, limitsFromEnv, runChat } from "../_lib/ai/run.js"
import { aiSession } from "../_lib/ai/supabase.js"

// Chat con Mochi. La conversación vive en el dispositivo: llega con cada mensaje y no se guarda aquí.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res)
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Método no permitido" })
  }
  const body = (req.body ?? {}) as { message?: unknown; history?: unknown }
  if (typeof body.message !== "string") return res.status(400).json({ error: "Falta el mensaje" })

  try {
    const now = new Date()
    const session = await aiSession(req, now)
    if (!session) return res.status(401).json({ error: "No autorizado" })
    const result = await runChat(
      { ...session, provider: providerFromEnv(), limits: limitsFromEnv(), now },
      body.message,
      cleanHistory(body.history)
    )
    if (!result.ok) return sendFailure(res, result)
    return res.status(200).json({ ok: true, reply: result.value, status: result.status })
  } catch (error) {
    console.error("Chat con IA:", (error as Error).message)
    return res.status(500).json({ error: "Mochi no ha podido responder" })
  }
}
