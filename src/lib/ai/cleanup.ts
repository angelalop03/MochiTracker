// Antes la IA se descargaba en el navegador (unos 2,3 GB). Ahora va en la nube, así que
// se libera ese espacio a quien lo tuviera. No hace nada si no hay nada que borrar.

export async function removeOldLocalModel() {
  try {
    localStorage.removeItem("isla-mochi-ia")
    if (!("caches" in window)) return
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n.startsWith("webllm")).map((n) => caches.delete(n)))
  } catch {
    // Sin permiso para tocar la caché: no pasa nada
  }
}
