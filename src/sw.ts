/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"

declare const self: ServiceWorkerGlobalScope

// Solo se guardan los archivos de la web. Los datos de salud no pasan por aquí
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [/^\/api\//] }))

self.addEventListener("install", () => void self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

interface PeriodCheck {
  u: string
  d: string
  t: string
}

interface PushPayload {
  title?: string
  body?: string
  url?: string
  /** Pregunta de la regla: lleva los botones «Sí, hoy» y «Aún no» */
  check?: PeriodCheck
}

// Los tipos de TypeScript aún no incluyen los botones de las notificaciones
type WithActions = NotificationOptions & { actions?: { action: string; title: string }[] }

/** Hoy en el móvil, como YYYY-MM-DD */
function localDay() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

async function openApp(url: string) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  const open = windows[0]
  if (open) {
    await open.focus()
    await open.navigate(url)
  } else {
    await self.clients.openWindow(url)
  }
}

/** «Sí, hoy»: apunta la regla sin abrir la app. Si falla, abre la app para hacerlo a mano */
async function confirmPeriod(check: PeriodCheck) {
  try {
    const response = await fetch("/api/period-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...check, day: localDay() }),
    })
    if (!response.ok) throw new Error(String(response.status))
    await self.registration.showNotification("Apuntado", {
      body: "Llega el invierno a tu isla. Cuídate estos días.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "regla",
      data: { url: "/hoy" },
    })
  } catch {
    await openApp("/hoy")
  }
}

self.addEventListener("push", (event) => {
  let payload: PushPayload = {}
  try {
    payload = (event.data?.json() ?? {}) as PushPayload
  } catch {
    // Un mensaje sin JSON se muestra con el texto por defecto
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Isla Mochi", {
      body: payload.body ?? "Abre tu isla.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/hoy", check: payload.check },
      ...(payload.check
        ? {
            tag: "regla",
            actions: [
              { action: "si", title: "Sí, hoy" },
              { action: "no", title: "Aún no" },
            ],
          }
        : {}),
    } as WithActions)
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = (event.notification.data ?? {}) as { url?: string; check?: PeriodCheck }
  // «Aún no»: no hace nada, se volverá a preguntar en unos días
  if (event.action === "no") return
  if (event.action === "si" && data.check) {
    event.waitUntil(confirmPeriod(data.check))
    return
  }
  event.waitUntil(openApp(data.url ?? "/hoy"))
})
