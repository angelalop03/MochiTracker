import { DEMO, supabase } from "./supabase"

export type PushSupport = "ready" | "needs_install" | "unsupported"

const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
}

export function pushSupport(): PushSupport {
  // En iPhone, PushManager solo existe dentro de la app instalada
  if (isIos() && !isInstalled()) return "needs_install"
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported"
  }
  return "ready"
}

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/** Pide permiso y guarda este dispositivo. false si la usuaria no da permiso */
export async function enablePush(userId: string): Promise<boolean> {
  if (DEMO) return true
  if (!supabase || !vapidKey) throw new Error("Faltan las claves de notificaciones")
  if ((await Notification.requestPermission()) !== "granted") return false

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyToBytes(vapidKey),
  })
  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error("Suscripción incompleta")

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" })
  if (error) throw error
  return true
}

/** Quita este dispositivo */
export async function disablePush(): Promise<void> {
  if (DEMO || !supabase || !("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)
  await subscription.unsubscribe()
}
