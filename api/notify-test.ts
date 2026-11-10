import type { VercelRequest, VercelResponse } from "@vercel/node"
import { planNotice, type Recipient } from "./_lib/notifications.js"
import { adminClient, realSenders, sameSecret, supabaseStore } from "./_lib/server.js"
import { todayInTimeZone } from "../src/lib/cycle.js"

// Envía un aviso de prueba a UNA cuenta, aunque hoy no le tocara.
// Protegido con el mismo secreto que el cron. No deja rastro en notification_log,
// así que no altera los avisos reales.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Método no permitido" })
  }
  const secret = process.env.CRON_SECRET
  if (!secret || !sameSecret(req.headers.authorization ?? "", `Bearer ${secret}`)) {
    return res.status(401).json({ error: "No autorizado" })
  }

  const body = (req.body ?? {}) as { email?: unknown; only?: unknown }
  const email = String(body.email ?? "").toLowerCase()
  // "email" o "push" para probar solo un canal
  const only = body.only === "email" || body.only === "push" ? body.only : null
  if (!email) return res.status(400).json({ error: "Falta el email" })

  try {
    const db = adminClient()
    const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error
    const user = data.users.find((u) => u.email?.toLowerCase() === email)
    if (!user) return res.status(404).json({ error: "No existe esa cuenta" })

    const profile = await db
      .from("profiles")
      .select("id, name, avg_cycle_length, avg_period_length, notify_email, notify_push, notify_frequency, timezone")
      .eq("id", user.id)
      .single()
    if (profile.error) throw profile.error
    const recipient = profile.data as Recipient

    const now = new Date()
    const store = supabaseStore(db, todayInTimeZone("UTC", now))
    const history = await store.history(user.id)
    const planned = planNotice({ user: recipient, ...history, lastPhase: null, now, force: true })
    if (!planned) return res.status(409).json({ error: "Sin datos de ciclo suficientes" })
    const notice = { ...planned, title: `Prueba: ${planned.title}` }

    const senders = realSenders(db)
    const result: { email: boolean; emailError?: string; pushes: number; pushFailed: number } = {
      email: false,
      pushes: 0,
      pushFailed: 0,
    }
    if (only !== "push") {
      try {
        await senders.email(recipient, notice)
        result.email = true
      } catch (e) {
        result.emailError = (e as Error).message
      }
    }

    for (const target of only === "email" ? [] : await store.pushTargets(user.id)) {
      try {
        await senders.push(target, { title: notice.title, body: notice.pushBody, url: "/hoy" })
        result.pushes++
      } catch (e) {
        console.error("Push de prueba fallido:", (e as { statusCode?: number }).statusCode)
        result.pushFailed++
      }
    }
    return res.status(200).json(result)
  } catch (error) {
    console.error("La prueba ha fallado:", (error as Error).message)
    return res.status(500).json({ error: (error as Error).message })
  }
}
