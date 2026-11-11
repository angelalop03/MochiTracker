// Tema claro u oscuro. La preferencia es de cada dispositivo, así que va en localStorage.
// index.html aplica el tema antes de pintar la página para que no haya un destello.

import { useSyncExternalStore } from "react"

export type ThemePref = "auto" | "light" | "dark"
export type Theme = "light" | "dark"

const KEY = "isla-mochi-tema"
const EVENT = "isla-mochi-tema"
const COLORS: Record<Theme, string> = { light: "#FAF7F4", dark: "#16111A" }

const media = () => window.matchMedia("(prefers-color-scheme: dark)")

export function getThemePref(): ThemePref {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === "light" || saved === "dark" ? saved : "auto"
  } catch {
    return "auto"
  }
}

export function resolveTheme(pref: ThemePref): Theme {
  return pref === "auto" ? (media().matches ? "dark" : "light") : pref
}

function apply() {
  const theme = resolveTheme(getThemePref())
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLORS[theme])
  window.dispatchEvent(new Event(EVENT))
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "auto") localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // Sin almacenamiento, el cambio dura lo que dure la página
  }
  apply()
}

/** Si el tema es automático, sigue los cambios del sistema */
export function watchSystemTheme() {
  apply()
  media().addEventListener("change", () => {
    if (getThemePref() === "auto") apply()
  })
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, getThemePref)
  const theme = useSyncExternalStore(subscribe, () => resolveTheme(getThemePref()))
  return { pref, theme, setPref: setThemePref }
}
