// Conexiones reales: solo se usan en el servidor. La service role se salta RLS,
// así que nunca debe llegar al navegador.

import { createHmac, timingSafeEqual } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { addDays } from "../../src/lib/cycle.js"
import { renderEmail, renderPeriodCheckEmail } from "./email.js"
import type { Notice, Recipient } from "./notifications.js"
import type { Senders, Store } from "./runDaily.js"

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable ${name}`)
  return value
}

export function adminClient() {
  return createClient(env("VITE_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Comparación en tiempo constante para que no se pueda adivinar un secreto probando */
export function sameSecret(a: string, b: string) {
  const [x, y] = [Buffer.from(a), Buffer.from(b)]
  return x.length === y.length && timingSafeEqual(x, y)
}

export function unsubscribeToken(userId: string, secret: string) {
  return createHmac("sha256", secret).update(userId).digest("hex")
}

/** Firma la pregunta de la regla: solo sirve para esa usuaria y ese día */
export function periodToken(userId: string, date: string, secret: string) {
  return createHmac("sha256", secret).update(`period:${userId}:${date}`).digest("hex")
}

const LOG_DAYS = 220

export function supabaseStore(db: SupabaseClient, today: string): Store {
  return {
    async recipients() {
      const { data, error } = await db
        .from("profiles")
        .select(
          "id, name, avg_cycle_length, avg_period_length, notify_email, notify_push, notify_frequency, timezone"
        )
        .or("notify_email.eq.true,notify_push.eq.true")
        .not("health_consent_at", "is", null)
        .not("onboarded_at", "is", null)
      if (error) throw error
      return data as Recipient[]
    },

    async history(userId) {
      // Las notas no se piden: nunca salen en un aviso
      const [periods, logs, last] = await Promise.all([
        db.from("periods").select("start_date, end_date").eq("user_id", userId),
        db
          .from("daily_logs")
          .select("date, symptoms, mood, energy")
          .eq("user_id", userId)
          .gte("date", addDays(today, -LOG_DAYS)),
        db
          .from("notification_log")
          .select("phase")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(1),
      ])
      const error = periods.error ?? logs.error ?? last.error
      if (error) throw error
      return { periods: periods.data ?? [], logs: logs.data ?? [], lastPhase: last.data?.[0]?.phase ?? null }
    },

    async claim({ userId, date, kind, channel, phase }) {
      const { data, error } = await db
        .from("notification_log")
        .upsert(
          { user_id: userId, date, kind, channel, phase },
          { onConflict: "user_id,date,kind,channel", ignoreDuplicates: true }
        )
        .select("id")
      if (error) throw error
      return data.length > 0
    },

    async release({ userId, date, kind, channel }) {
      const { error } = await db
        .from("notification_log")
        .delete()
        .match({ user_id: userId, date, kind, channel })
      if (error) throw error
    },

    async pushTargets(userId) {
      const { data, error } = await db
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)
      if (error) throw error
      return data
    },

    async removePushTarget(endpoint) {
      const { error } = await db.from("push_subscriptions").delete().eq("endpoint", endpoint)
      if (error) throw error
    },
  }
}

/** El cuerpo de la petición a Brevo */
export function brevoPayload(
  sender: { name: string; email: string },
  to: string,
  mail: { subject: string; html: string },
  unsubscribeUrl: string
) {
  return {
    sender,
    to: [{ email: to }],
    subject: mail.subject,
    htmlContent: mail.html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }
}

export function realSenders(db: SupabaseClient): Senders {
  const appUrl = env("APP_URL").replace(/\/$/, "")
  const secret = env("UNSUBSCRIBE_SECRET")
  const sender = { name: "Isla Mochi", email: env("BREVO_SENDER_EMAIL") }
  webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VITE_VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"))

  return {
    async email(user: Recipient, notice: Notice) {
      const { data, error } = await db.auth.admin.getUserById(user.id)
      if (error || !data.user.email) throw new Error("No se ha encontrado el email")

      const unsubscribeUrl = `${appUrl}/api/unsubscribe?u=${user.id}&t=${unsubscribeToken(user.id, secret)}`
      const context = { name: user.name, appUrl, unsubscribeUrl }
      const mail = notice.kind === "period_check" ? renderPeriodCheckEmail(notice, context) : renderEmail(notice, context)

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": env("BREVO_API_KEY"), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(brevoPayload(sender, data.user.email, mail, unsubscribeUrl)),
      })
      if (!response.ok) {
        // Brevo explica el motivo (clave, IP no autorizada, remitente…) sin incluir datos sensibles
        const reason = (await response.json().catch(() => ({}))) as { code?: string; message?: string }
        throw new Error(`Brevo respondió ${response.status}: ${reason.code ?? ""} ${reason.message ?? ""}`.trim())
      }
    },

    async push(target, { periodCheck, ...payload }) {
      // El token permite apuntar la regla desde la notificación sin abrir la app
      const check = periodCheck
        ? { u: periodCheck.userId, d: periodCheck.date, t: periodToken(periodCheck.userId, periodCheck.date, secret) }
        : undefined
      await webpush.sendNotification(
        { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
        JSON.stringify({ ...payload, check }),
        { TTL: 60 * 60 * 12 }
      )
    },
  }
}
