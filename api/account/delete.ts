import type { VercelRequest, VercelResponse } from "@vercel/node"
import { adminClient } from "../_lib/server.js"

// Borra la cuenta de quien llama. El id sale de su sesión, nunca de lo que envíe el navegador.
// Sus datos se borran por cascada desde auth.users.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Método no permitido" })
  }

  const token = req.headers.authorization?.replace(/^Bearer /, "")
  if (!token) return res.status(401).json({ error: "No autorizado" })

  try {
    const db = adminClient()
    const { data, error } = await db.auth.getUser(token)
    if (error || !data.user) return res.status(401).json({ error: "No autorizado" })

    const deleted = await db.auth.admin.deleteUser(data.user.id)
    if (deleted.error) throw deleted.error
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("No se ha podido borrar una cuenta:", (error as Error).message)
    return res.status(500).json({ error: "No se ha podido borrar la cuenta" })
  }
}
