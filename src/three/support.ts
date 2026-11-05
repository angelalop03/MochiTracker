// Sin WebGL, o si se pide menos movimiento, se muestra la imagen estática de la isla
export function canUse3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  try {
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}
