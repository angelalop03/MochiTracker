import type { VercelRequest, VercelResponse } from "@vercel/node"
import { noStore } from "../_lib/ai/http.js"
import { providerFromEnv } from "../_lib/ai/provider.js"
import { aiStatus, limitsFromEnv } from "../_lib/ai/run.js"
import { aiSession } from "../_lib/ai/supabase.js"

// Si la IA está disponible, si ha dado su consentimiento y cuántas consultas le quedan hoy
export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res)
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Método no permitido" })
  }
  try {
    const now = new Date()
    const session = await aiSession(req, now)
    if (!session) return res.status(401).json({ error: "No autorizado" })
    const status = await aiStatus({ ...session, provider: providerFromEnv(), limits: limitsFromEnv(), now })
    return res.status(200).json(status)
  } catch (error) {
    console.error("Estado de la IA:", (error as Error).message)
    return res.status(500).json({ error: "No se ha podido consultar la IA" })
  }
}
