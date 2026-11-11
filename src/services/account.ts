import { fetchLogs, fetchPeriods, fetchProfile } from "./data"
import { signOut } from "./auth"
import { DEMO, supabase } from "./supabase"
import { clearDemo } from "./demo"
import { clearAiAdvice } from "../lib/ai/storage"

/** Descarga todos los datos de la cuenta en un JSON. Se genera en el propio navegador */
export async function exportData(userId: string, email: string) {
  const [profile, periods, logs] = await Promise.all([
    fetchProfile(userId),
    fetchPeriods(),
    fetchLogs("0001-01-01"),
  ])
  const data = { exported_at: new Date().toISOString(), email, profile, periods, daily_logs: logs }

  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "isla-mochi-mis-datos.json"
  link.click()
  URL.revokeObjectURL(url)
}

/** Borra la cuenta y, por cascada, todos sus datos */
export async function deleteAccount() {
  clearAiAdvice()
  if (DEMO) {
    clearDemo()
    window.dispatchEvent(new Event("demo-auth"))
    return
  }
  if (!supabase) throw new Error("Supabase no está configurado")
  const { data } = await supabase.auth.getSession()
  const response = await fetch("/api/account/delete", {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
  })
  if (!response.ok) throw new Error(`No se ha podido borrar la cuenta (${response.status})`)
  await signOut()
}
