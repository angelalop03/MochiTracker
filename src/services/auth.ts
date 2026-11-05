import { DEMO, supabase } from "./supabase"
import { readDemo, writeDemo } from "./demo"
import { PRIVACY_VERSION } from "../content/legal"
import { clearAiAdvice } from "../lib/ai/storage"

export interface SignUpData {
  email: string
  name: string
}

function auth() {
  if (!supabase) throw new Error("Supabase no está configurado")
  return supabase.auth
}

const redirectTo = () => `${window.location.origin}/hoy`

/** El consentimiento viaja en los metadatos y el trigger de la base de datos lo guarda con fecha */
export async function sendSignUpEmail({ email, name }: SignUpData) {
  if (DEMO) {
    writeDemo({
      profile: {
        ...readDemo().profile,
        name,
        health_consent_at: new Date().toISOString(),
        privacy_version: PRIVACY_VERSION,
      },
    })
    return
  }
  const { error } = await auth().signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo(),
      data: { name, health_consent: true, privacy_version: PRIVACY_VERSION },
    },
  })
  if (error) throw error
}

export async function sendSignInEmail(email: string) {
  if (DEMO) return
  const { error } = await auth().signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo() },
  })
  if (error) throw error
}

/** El código del email: en iPhone el enlace se abre fuera de la app instalada */
export async function verifyCode(email: string, token: string) {
  if (DEMO) {
    writeDemo({ signedIn: true })
    window.dispatchEvent(new Event("demo-auth"))
    return
  }
  const { error } = await auth().verifyOtp({ email, token, type: "email" })
  if (error) throw error
}

export async function signOut() {
  clearAiAdvice()
  if (DEMO) {
    writeDemo({ signedIn: false })
    window.dispatchEvent(new Event("demo-auth"))
    return
  }
  await auth().signOut()
}

/** Traduce los errores de Supabase a algo que se entienda */
export function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; status?: number; message?: string }
  if (e.code === "over_email_send_rate_limit" || e.status === 429) {
    return "Se han enviado demasiados correos. Espera un rato y vuelve a intentarlo."
  }
  if (e.code === "otp_expired") return "El código ha caducado o no es correcto. Pide uno nuevo."
  if (e.code === "otp_disabled" || /signups not allowed/i.test(e.message ?? "")) {
    return "No encontramos una cuenta con ese email. ¿Quieres crear una?"
  }
  if (e.code === "email_address_invalid") return "Ese email no parece válido. Revísalo."
  if (e.code === "email_address_not_authorized") {
    return "Este email aún no puede recibir correos: falta configurar el envío en Supabase."
  }
  return "No se ha podido completar. Revisa tu conexión y vuelve a intentarlo."
}
