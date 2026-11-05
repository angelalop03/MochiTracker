// La IA y la escena 3D comparten la GPU: con las dos a la vez la IA tarda más del doble.
// Mientras Mochi escribe, la escena se queda quieta.

let busy = false
const listeners = new Set<() => void>()

export function setAiBusy(value: boolean) {
  busy = value
  listeners.forEach((listener) => listener())
}

export const isAiBusy = () => busy

export function subscribeAiBusy(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
