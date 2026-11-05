import * as THREE from "three"

export const FOV = 32
export const CAMERA_Z = 16

/** Tamaño aproximado de la isla con sus árboles, para encajarla en su hueco */
export const WORLD_SIZE = 13.5

/** Alto visible del mundo a una profundidad z, para pasar de píxeles a unidades 3D */
export function visibleHeight(z = 0) {
  return 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAMERA_Z - z)
}

// Dos geometrías para casi todo: cada pieza se escala. Pocos polígonos a propósito.
export const box = new THREE.BoxGeometry(1, 1, 1)
export const ball = new THREE.IcosahedronGeometry(1, 2)
/** Esfera lisa para Mochi: las caras planas se quedan para la isla */
export const round = new THREE.SphereGeometry(1, 24, 16)

const materials = new Map<string, THREE.MeshLambertMaterial>()

/** Un material por color, compartido por toda la escena */
export function lambert(color: string) {
  let material = materials.get(color)
  if (!material) {
    material = new THREE.MeshLambertMaterial({ color, flatShading: true })
    materials.set(color, material)
  }
  return material
}

const smoothMaterials = new Map<string, THREE.MeshLambertMaterial>()

/** Igual que lambert(), con sombreado suave */
export function smooth(color: string) {
  let material = smoothMaterials.get(color)
  if (!material) {
    material = new THREE.MeshLambertMaterial({ color })
    smoothMaterials.set(color, material)
  }
  return material
}

export function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
