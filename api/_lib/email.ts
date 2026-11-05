import { DISCLAIMER, PHASE_CONTENT } from "../../src/content/phases.js"
import type { Phase } from "../../src/lib/cycle.js"
import type { Notice } from "./notifications.js"

const TINT: Record<Phase, string> = {
  menstrual: "#E2D6F5",
  folicular: "#CDE8D0",
  ovulatoria: "#FFE2A8",
  lutea: "#F9CDB8",
}

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  )

interface Context {
  name: string | null
  appUrl: string
  unsubscribeUrl: string
}

export function renderEmail(notice: Notice, { name, appUrl, unsubscribeUrl }: Context) {
  const content = PHASE_CONTENT[notice.phase]
  const hello = name ? `Hola, ${name}` : "Hola"
  const consult = notice.alarm
    ? "Has registrado un dolor o un sangrado muy fuertes. Te recomendamos consultarlo con un profesional sanitario."
    : null
  const today = `${appUrl}/hoy`

  const text = [
    hello,
    notice.greeting,
    `${notice.blockTitle}: ${notice.tip}`,
    consult,
    `Abre tu isla: ${today}`,
    DISCLAIMER,
    `Dejar de recibir estos correos: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#FFF7F3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7F3"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:'Trebuchet MS',Verdana,sans-serif;color:#4A2F45;line-height:1.6">
  <tr><td style="padding:0 8px 12px;font-size:18px;font-weight:bold;color:#B0406F">Isla Mochi</td></tr>
  <tr><td style="background:${TINT[notice.phase]};border-radius:22px 22px 0 0;padding:22px 24px">
    <div style="font-size:22px;font-weight:bold;line-height:1.25">${escapeHtml(hello)}</div>
    <div style="font-size:15px;padding-top:4px">${escapeHtml(content.season)} en tu isla</div>
  </td></tr>
  <tr><td style="background:#FFFFFF;border-radius:0 0 22px 22px;padding:22px 24px;font-size:16px">
    <p style="margin:0 0 14px">${escapeHtml(notice.greeting)}</p>
    <p style="margin:0 0 4px;font-weight:bold;color:#B0406F">${escapeHtml(notice.blockTitle)}</p>
    <p style="margin:0 0 18px">${escapeHtml(notice.tip)}</p>
    ${consult ? `<p style="margin:0 0 18px;padding:12px 14px;border-radius:14px;background:#FDE4E0;font-weight:bold">${escapeHtml(consult)}</p>` : ""}
    <a href="${escapeHtml(today)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#B0406F;color:#FFFFFF;font-weight:bold;text-decoration:none">Abrir mi isla</a>
  </td></tr>
  <tr><td style="padding:16px 8px;font-size:12px;color:#6E5068">
    ${escapeHtml(DISCLAIMER)}<br>
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6E5068">Dejar de recibir estos correos</a>
  </td></tr>
</table></td></tr></table>
</body></html>`

  return { subject: notice.title, html, text }
}
