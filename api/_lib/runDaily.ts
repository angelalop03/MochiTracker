// El recorrido diario, sin saber nada de Supabase, Brevo ni web-push: se le pasan
// como dependencias para poder probarlo. Los registros nunca incluyen datos de usuarias.

import type { PeriodRecord, Phase } from "../../src/lib/cycle.js"
import type { LogEntry } from "../../src/lib/personalize.js"
import { planNotice, type Kind, type Notice, type Recipient } from "./notifications.js"

export type Channel = "email" | "push"

export interface Claim {
  userId: string
  date: string
  kind: Kind
  channel: Channel
  phase: Phase
}

export interface PushTarget {
  endpoint: string
  p256dh: string
  auth: string
}

export interface Store {
  recipients(): Promise<Recipient[]>
  history(userId: string): Promise<{ periods: PeriodRecord[]; logs: LogEntry[]; lastPhase: Phase | null }>
  /** Reserva el envío. false si ya estaba hecho: así un reintento del cron no duplica */
  claim(claim: Claim): Promise<boolean>
  release(claim: Claim): Promise<void>
  pushTargets(userId: string): Promise<PushTarget[]>
  removePushTarget(endpoint: string): Promise<void>
}

export interface Senders {
  email(user: Recipient, notice: Notice): Promise<void>
  /** Si falla, lanza un error con statusCode */
  push(target: PushTarget, payload: { title: string; body: string; url: string }): Promise<void>
}

export interface Report {
  recipients: number
  emails: number
  pushes: number
  skippedByCap: number
  failed: number
}

/** El plan gratuito de Brevo permite 300 al día, y los accesos por email también cuentan */
export const DAILY_EMAIL_CAP = 200

interface Options {
  store: Store
  senders: Senders
  now: Date
  emailCap?: number
  /** Pausa entre correos, para no saturar el servicio de correo */
  pause?: () => Promise<void>
}

export async function runDaily({ store, senders, now, emailCap = DAILY_EMAIL_CAP, pause }: Options): Promise<Report> {
  const users = await store.recipients()
  const report: Report = { recipients: users.length, emails: 0, pushes: 0, skippedByCap: 0, failed: 0 }

  const plans: { user: Recipient; notice: Notice }[] = []
  for (const user of users) {
    try {
      const notice = planNotice({ user, ...(await store.history(user.id)), now })
      if (notice) plans.push({ user, notice })
    } catch (error) {
      console.error("No se ha podido preparar un aviso:", (error as Error).name)
      report.failed++
    }
  }

  // Si no llega para todas, primero los cambios de estación
  plans.sort((a, b) => Number(b.notice.kind === "phase_change") - Number(a.notice.kind === "phase_change"))

  for (const { user, notice } of plans) {
    const claim = (channel: Channel): Claim => ({
      userId: user.id,
      date: notice.date,
      kind: notice.kind,
      channel,
      phase: notice.phase,
    })

    if (user.notify_email) {
      if (report.emails >= emailCap) {
        report.skippedByCap++
      } else if (await store.claim(claim("email"))) {
        try {
          await senders.email(user, notice)
          report.emails++
          await pause?.()
        } catch (error) {
          console.error("Fallo al enviar un email:", (error as Error).message)
          await store.release(claim("email"))
          report.failed++
        }
      }
    }

    if (user.notify_push && (await store.claim(claim("push")))) {
      const targets = await store.pushTargets(user.id)
      let delivered = 0
      let gone = 0
      for (const target of targets) {
        try {
          await senders.push(target, { title: notice.title, body: notice.pushBody, url: "/hoy" })
          delivered++
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) {
            // El navegador ya no existe o quitó el permiso
            await store.removePushTarget(target.endpoint)
            gone++
          } else {
            console.error("Fallo al enviar un push:", status)
            report.failed++
          }
        }
      }
      report.pushes += delivered
      // Si no llegó a ningún sitio por un error temporal, se reintentará
      if (delivered === 0 && gone < targets.length) await store.release(claim("push"))
      if (targets.length === 0) await store.release(claim("push"))
    }
  }

  return report
}
