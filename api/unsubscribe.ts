import type { VercelRequest, VercelResponse } from "@vercel/node"
import { escapeHtml } from "./_lib/email.js"
import { adminClient, sameSecret, unsubscribeToken } from "./_lib/server.js"

const page = (body: string) => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Isla Mochi</title></head>
<body style="margin:0;padding:40px 16px;background:#FFF7F3;color:#4A2F45;font-family:'Trebuchet MS',Verdana,sans-serif;text-align:center">
${body}</body></html>`

// GET solo pregunta: algunos correos abren los enlaces solos y eso no debe dar de baja a nadie.
// La baja la hace el POST, que es también lo que usa el botón «Cancelar suscripción» del correo.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = String(req.query.u ?? "")
  const token = String(req.query.t ?? "")
  const secret = process.env.UNSUBSCRIBE_SECRET

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  if (!secret || !user || !sameSecret(token, unsubscribeToken(user, secret))) {
    return res.status(400).send(page("<p>Este enlace no es válido.</p>"))
  }

  if (req.method === "GET") {
    const action = `/api/unsubscribe?u=${encodeURIComponent(user)}&t=${encodeURIComponent(token)}`
    return res.status(200).send(
      page(`<h1 style="font-size:24px">¿Dejar de recibir correos?</h1>
<form method="post" action="${escapeHtml(action)}">
<button style="padding:12px 24px;border:0;border-radius:999px;background:#B0406F;color:#fff;font:inherit;font-weight:bold;cursor:pointer">Sí, darme de baja</button>
</form>`)
    )
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST")
    return res.status(405).send(page("<p>Método no permitido.</p>"))
  }

  const { error } = await adminClient().from("profiles").update({ notify_email: false }).eq("id", user)
  if (error) {
    console.error("No se ha podido dar de baja:", error.code)
    return res.status(500).send(page("<p>No se ha podido completar. Vuelve a intentarlo.</p>"))
  }
  return res.status(200).send(page("<p>Listo. Ya no recibirás más correos de Isla Mochi.</p>"))
}
