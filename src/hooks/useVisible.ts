import { useEffect, useState, type RefObject } from "react"

/** true si el elemento está en pantalla y la pestaña visible: si no, la escena se pausa */
export function useVisible(ref: RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(true)
  const [pageVisible, setPageVisible] = useState(!document.hidden)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? true))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden)
    document.addEventListener("visibilitychange", sync)
    return () => document.removeEventListener("visibilitychange", sync)
  }, [])

  return onScreen && pageVisible
}
