import type { VercelRequest, VercelResponse } from "@vercel/node"
import { addDays } from "../src/lib/cycle.js"
import { parsePeriodRequest } from "./_lib/periodCheck.js"
import { adminClient } from "./_lib/server.js"

// El botón «Sí, hoy» de la notificación: apunta el inicio de la regla sin abrir la app.
// No usa la sesión (el service worker no la tiene): va firmado para esa usuaria y ese aviso.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Método no permitido" })
  }
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) return res.status(500).json({ error: "Falta configuración" })

  const request = parsePeriodRequest(req.body, secret, new Date())
  if (!request.ok) return res.status(request.status).json({ error: request.error })

  try {
    const db = adminClient()
    // Si ya hay una regla apuntada estos días (desde la app o con otro toque), no se duplica
    const recent = await db
      .from("periods")
      .select("start_date")
      .eq("user_id", request.userId)
      .gte("start_date", addDays(request.day, -14))
      .limit(1)
    if (recent.error) throw recent.error
    if (recent.data.length > 0) return res.status(200).json({ ok: true, already: true })

    const { error } = await db
      .from("periods")
      .upsert(
        { user_id: request.userId, start_date: request.day },
        { onConflict: "user_id,start_date", ignoreDuplicates: true }
      )
    if (error) throw error
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("No se ha podido apuntar la regla:", (error as Error).message)
    return res.status(500).json({ error: "No se ha podido guardar" })
  }
}
