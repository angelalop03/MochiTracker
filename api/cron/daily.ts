import type { VercelRequest, VercelResponse } from "@vercel/node"
import { todayInTimeZone } from "../../src/lib/cycle.js"
import { runDaily } from "../_lib/runDaily.js"
import { adminClient, realSenders, sameSecret, supabaseStore } from "../_lib/server.js"

export const config = { maxDuration: 300 }

// Vercel Cron llama aquí una vez al día con Authorization: Bearer <CRON_SECRET>
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (!secret || !sameSecret(req.headers.authorization ?? "", `Bearer ${secret}`)) {
    return res.status(401).json({ error: "No autorizado" })
  }

  try {
    const db = adminClient()
    const now = new Date()
    const report = await runDaily({
      store: supabaseStore(db, todayInTimeZone("UTC", now)),
      senders: realSenders(db),
      now,
      pause: () => new Promise((resolve) => setTimeout(resolve, 600)),
    })
    console.log("Avisos del día:", report)
    return res.status(200).json(report)
  } catch (error) {
    console.error("El cron ha fallado:", (error as Error).message)
    return res.status(500).json({ error: "Error en el cron" })
  }
}
