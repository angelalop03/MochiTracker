// Plantilla del email de avisos. Tablas y estilos en línea: es lo único que respetan
// todos los clientes de correo. Las imágenes son capturas reales de la isla.

import { DISCLAIMER, PHASE_CONTENT, WHEN_TO_CONSULT } from "../../src/content/phases.js"
import type { Phase } from "../../src/lib/cycle.js"
import { formatDay, formatInDays } from "../../src/lib/format.js"
import type { Notice } from "./notifications.js"

interface Palette {
  /** Fondo suave de la cabecera */
  tint: string
  /** Acento de la estación, para títulos y detalles */
  accent: string
  image: string
}

const PALETTE: Record<Phase, Palette> = {
  menstrual: { tint: "#EFE8FA", accent: "#7A5FB0", image: "invierno" },
  folicular: { tint: "#E3F2E5", accent: "#3F8A55", image: "primavera" },
  ovulatoria: { tint: "#FFF1D2", accent: "#A86F12", image: "verano" },
  lutea: { tint: "#FCE6DA", accent: "#B4533A", image: "otono" },
}

const INK = "#4A2F45"
const SOFT = "#6E5068"
const ROSE = "#B0406F"
const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif"

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

function section(title: string, body: string, accent: string) {
  return `
  <tr><td style="padding:22px 28px 0">
    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold;color:${accent};padding-bottom:8px">${escapeHtml(title)}</div>
    ${body}
  </td></tr>`
}

export function renderEmail(notice: Notice, { name, appUrl, unsubscribeUrl }: Context) {
  const content = PHASE_CONTENT[notice.phase]
  const palette = PALETTE[notice.phase]
  const hello = name ? `Hola, ${name}` : "Hola"
  const today = `${appUrl}/hoy`
  const e = escapeHtml

  const next = notice.next
    ? (() => {
        const nextContent = PHASE_CONTENT[notice.next.phase]
        return `${nextContent.season} (fase ${nextContent.name.toLowerCase()}) llega ${formatInDays(notice.next.inDays)}, el ${formatDay(notice.next.date)}.`
      })()
    : notice.daysLate > 0
      ? `Tu regla lleva ${notice.daysLate} ${notice.daysLate === 1 ? "día" : "días"} de retraso según tu media. Es frecuente: cuando te venga, actualiza la fecha en la app.`
      : null

  const blocks = notice.blocks
    .map(
      (b) => `
      <tr><td style="padding:0 0 10px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate">
          <tr>
            <td width="4" style="background:${palette.accent};border-radius:4px;font-size:0;line-height:0">&nbsp;</td>
            <td style="padding:2px 0 2px 14px">
              <div style="font-size:15px;font-weight:bold;color:${INK}">${e(b.title)}${b.forYou ? ` <span style="font-size:12px;font-weight:bold;color:${ROSE}">· Para ti</span>` : ""}</div>
              <div style="font-size:15px;line-height:1.55;color:${INK};padding-top:2px">${e(b.text)}</div>
            </td>
          </tr>
        </table>
      </td></tr>`
    )
    .join("")

  const consult = notice.alarm
    ? `
  <tr><td style="padding:22px 28px 0">
    <div style="padding:14px 16px;border-radius:16px;background:#FDE4E0;color:#7A1F2E;font-size:15px;line-height:1.5;font-weight:bold">
      Has registrado un dolor o un sangrado muy fuertes. Te recomendamos consultarlo con un profesional sanitario.
    </div>
  </td></tr>`
    : ""

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(notice.title)}</title>
</head>
<body style="margin:0;padding:0;background:#FFF7F3;font-family:${FONT};color:${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(notice.greeting)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7F3">
<tr><td align="center" style="padding:24px 12px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <tr><td style="padding:0 6px 14px">
    <a href="${e(appUrl)}" style="font-size:20px;font-weight:bold;color:${ROSE};text-decoration:none">Isla Mochi</a>
  </td></tr>

  <tr><td style="background:#FFFFFF;border-radius:26px;overflow:hidden;box-shadow:0 12px 30px -20px rgba(122,74,110,0.5)">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

    <tr><td style="background:${palette.tint};border-radius:26px 26px 0 0;padding:0">
      <img src="${e(`${appUrl}/email/${palette.image}.jpg`)}" width="560" alt="Mochi en su isla, en ${e(content.season.toLowerCase())}" style="display:block;width:100%;max-width:560px;height:auto;border-radius:26px 26px 0 0">
    </td></tr>

    <tr><td style="background:${palette.tint};padding:18px 28px 22px">
      <div style="font-size:26px;font-weight:bold;line-height:1.2;color:${INK}">${e(hello)}</div>
      <div style="padding-top:8px">
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#FFFFFF;color:${palette.accent};font-size:13px;font-weight:bold">Día ${notice.cycleDay} · Fase ${e(content.name.toLowerCase())} · ${e(content.season)}</span>
      </div>
    </td></tr>

    <tr><td style="padding:24px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 0 14px">
          <span style="display:inline-block;padding:2px 12px;border-radius:999px;background:#FBE3EA;color:${ROSE};font-size:13px;font-weight:bold">Mochi</span>
        </td></tr>
        <tr><td style="padding-top:6px">
          <div style="padding:14px 18px;border-radius:20px;border:2px solid #F1DFE3;font-size:17px;line-height:1.5;color:${INK}">${e(notice.greeting)}</div>
        </td></tr>
      </table>
    </td></tr>

    ${section(
      "Qué está pasando",
      `<div style="font-size:15px;line-height:1.6;color:${INK}">${e(notice.summary)}</div>`,
      palette.accent
    )}

    <tr><td style="padding:22px 28px 0">
      <div style="padding:18px 20px;border-radius:20px;background:${palette.tint}">
        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold;color:${notice.tipForYou ? ROSE : palette.accent}">${notice.tipForYou ? "Para ti" : "Consejo de hoy"} · ${e(notice.blockTitle)}</div>
        <div style="font-size:17px;line-height:1.5;color:${INK};padding-top:6px">${e(notice.tip)}</div>
      </div>
    </td></tr>

    ${section(
      "Cómo te puedes sentir",
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${blocks}</table>`,
      palette.accent
    )}

    ${next ? section("Lo próximo", `<div style="font-size:15px;line-height:1.6;color:${INK}">${e(next)}</div>`, palette.accent) : ""}

    ${consult}

    <tr><td align="center" style="padding:28px 28px 30px">
      <a href="${e(today)}" style="display:inline-block;padding:14px 30px;border-radius:999px;background:${ROSE};color:#FFFFFF;font-size:16px;font-weight:bold;text-decoration:none">Abrir mi isla</a>
    </td></tr>

  </table>
  </td></tr>

  <tr><td style="padding:22px 10px 0;font-size:13px;line-height:1.6;color:${SOFT}">
    <strong>${e(WHEN_TO_CONSULT.title)}:</strong> si tienes un dolor que te impide hacer vida normal, un sangrado muy abundante o reglas muy irregulares. Tienes la lista completa en la app.
  </td></tr>

  <tr><td style="padding:14px 10px 0;font-size:12px;line-height:1.6;color:${SOFT}">
    ${e(DISCLAIMER)}<br>
    Recibes este correo porque activaste los avisos en Isla Mochi.<br>
    <a href="${e(`${appUrl}/ajustes`)}" style="color:${SOFT}">Cambiar mis avisos</a> &nbsp;·&nbsp;
    <a href="${e(unsubscribeUrl)}" style="color:${SOFT}">Dejar de recibir estos correos</a>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject: notice.title, html }
}

/** La pregunta de la regla: un correo corto con un solo botón */
export function renderPeriodCheckEmail(notice: Notice, { name, appUrl, unsubscribeUrl }: Context) {
  const palette = PALETTE.menstrual
  const hello = name ? `Hola, ${name}` : "Hola"
  const e = escapeHtml
  const late =
    notice.daysLate > 1
      ? `Según tu media, la esperábamos hace ${notice.daysLate - 1} ${notice.daysLate === 2 ? "día" : "días"}. Un retraso de unos días es frecuente: el estrés, los viajes o los cambios de rutina pueden moverla.`
      : "Según tu media, tu regla podría llegar hoy."

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(notice.title)}</title>
</head>
<body style="margin:0;padding:0;background:#FFF7F3;font-family:${FONT};color:${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Si ya ha llegado, apúntalo con un toque.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7F3">
<tr><td align="center" style="padding:24px 12px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <tr><td style="padding:0 6px 14px">
    <a href="${e(appUrl)}" style="font-size:20px;font-weight:bold;color:${ROSE};text-decoration:none">Isla Mochi</a>
  </td></tr>

  <tr><td style="background:#FFFFFF;border-radius:26px;overflow:hidden;box-shadow:0 12px 30px -20px rgba(122,74,110,0.5)">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="background:${palette.tint};border-radius:26px 26px 0 0;padding:0">
      <img src="${e(`${appUrl}/email/${palette.image}.jpg`)}" width="560" alt="Mochi en su isla, en invierno" style="display:block;width:100%;max-width:560px;height:auto;border-radius:26px 26px 0 0">
    </td></tr>
    <tr><td style="background:${palette.tint};padding:18px 28px 22px">
      <div style="font-size:26px;font-weight:bold;line-height:1.2;color:${INK}">${e(hello)}</div>
      <div style="font-size:17px;line-height:1.5;color:${INK};padding-top:8px">¿Ha llegado ya el invierno a tu isla?</div>
    </td></tr>
    <tr><td style="padding:22px 28px 0;font-size:15px;line-height:1.6;color:${INK}">
      ${e(late)}<br><br>
      Si ya te ha venido, apúntalo en tu isla para que Mochi sepa en qué estación estás. Si aún no, no tienes que hacer nada: te lo volveremos a preguntar en unos días.
    </td></tr>
    <tr><td align="center" style="padding:26px 28px 30px">
      <a href="${e(`${appUrl}/hoy`)}" style="display:inline-block;padding:14px 30px;border-radius:999px;background:${palette.accent};color:#FFFFFF;font-size:16px;font-weight:bold;text-decoration:none">Apuntarlo en mi isla</a>
    </td></tr>
  </table>
  </td></tr>

  <tr><td style="padding:22px 10px 0;font-size:13px;line-height:1.6;color:${SOFT}">
    Si llevas tres meses o más sin regla, o un retraso con posibilidad de embarazo, consúltalo con un profesional sanitario.
  </td></tr>
  <tr><td style="padding:14px 10px 0;font-size:12px;line-height:1.6;color:${SOFT}">
    ${e(DISCLAIMER)}<br>
    Recibes este correo porque activaste los avisos en Isla Mochi.<br>
    <a href="${e(`${appUrl}/ajustes`)}" style="color:${SOFT}">Cambiar mis avisos</a> &nbsp;·&nbsp;
    <a href="${e(unsubscribeUrl)}" style="color:${SOFT}">Dejar de recibir estos correos</a>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject: notice.title, html }
}
