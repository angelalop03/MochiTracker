import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)

/** Sin claves, en desarrollo la app funciona con datos de prueba en el navegador */
export const DEMO = import.meta.env.DEV && !isConfigured

export const supabase = isConfigured ? createClient(url!, key!) : null
