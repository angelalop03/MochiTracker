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

interface PushPayload {
  title?: string
  body?: string
  url?: string
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
      data: { url: payload.url ?? "/hoy" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | null)?.url ?? "/hoy"
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      const open = windows[0]
      if (open) {
        await open.focus()
        await open.navigate(url)
      } else {
        await self.clients.openWindow(url)
      }
    })()
  )
})
