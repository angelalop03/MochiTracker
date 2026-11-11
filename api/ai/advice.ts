import type { VercelRequest, VercelResponse } from "@vercel/node"
import { noStore, sendFailure } from "../_lib/ai/http.js"
import { providerFromEnv } from "../_lib/ai/provider.js"
import { limitsFromEnv, runAdvice } from "../_lib/ai/run.js"
import { aiSession } from "../_lib/ai/supabase.js"

// Consejos personalizados para hoy. El contexto lo calcula el servidor con sus datos:
// el navegador no envía nada más que su sesión.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res)
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Método no permitido" })
  }
  try {
    const now = new Date()
    const session = await aiSession(req, now)
    if (!session) return res.status(401).json({ error: "No autorizado" })
    const result = await runAdvice({ ...session, provider: providerFromEnv(), limits: limitsFromEnv(), now })
    if (!result.ok) return sendFailure(res, result)
    return res.status(200).json({ ok: true, advice: result.value, status: result.status })
  } catch (error) {
    console.error("Consejos con IA:", (error as Error).message)
    return res.status(500).json({ error: "No se han podido generar los consejos" })
  }
}
