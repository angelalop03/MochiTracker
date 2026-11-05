import type { Phase } from "../lib/cycle"

export interface Season {
  grass: [string, string]
  dirt: string
  rock: string
  trunk: string
  canopy: [string, string]
  light: { hemiSky: string; hemiGround: string; hemi: number; sun: number; sunColor: string }
  particles: { colors: string[]; size: number; speed: number; sway: number; rise: boolean }
  cloud: string
  /** Nube discreta para la landing: pasa detrás del texto y no puede restarle contraste */
  cloudMuted: string
  /** Color del lazo de Mochi */
  bow: string
  /** Cómo se mueve Mochi: refleja la energía de la fase */
  mochi: {
    breath: number
    /** Segundos entre saltitos. 0 = no salta */
    hopEvery: number
    hopHeight: number
    /** Ganas de saludar, de 0 a 1 */
    wave: number
    /** Apertura de los ojos, de 0 a 1 */
    eyes: number
    lookSpeed: number
  }
}

export const SEASONS: Record<Phase, Season> = {
  menstrual: {
    grass: ["#FDF6F6", "#EEE6F7"],
    dirt: "#C3AEDF",
    rock: "#A893CB",
    trunk: "#A48DB8",
    canopy: ["#EFE7F8", "#FFFFFF"],
    light: { hemiSky: "#FFFFFF", hemiGround: "#CFC4EE", hemi: 2.3, sun: 1.1, sunColor: "#FFE9E0" },
    particles: { colors: ["#FFFFFF", "#E2D6F5"], size: 0.13, speed: 0.6, sway: 0.5, rise: false },
    cloud: "#F4EEFB",
    cloudMuted: "#EBE2F7",
    bow: "#C7A8E8",
    mochi: { breath: 1.1, hopEvery: 0, hopHeight: 0, wave: 0, eyes: 0.5, lookSpeed: 1.5 },
  },
  folicular: {
    grass: ["#C3EBBE", "#AEE0AC"],
    dirt: "#E0C3A6",
    rock: "#CDAD93",
    trunk: "#BC9882",
    canopy: ["#DBF2C8", "#C3EBBE"],
    light: { hemiSky: "#FFFFFF", hemiGround: "#CDE8D0", hemi: 2.3, sun: 1.2, sunColor: "#FFF8E4" },
    particles: { colors: ["#FFFFFF", "#CDE8D0"], size: 0.1, speed: 0.35, sway: 0.9, rise: true },
    cloud: "#FFFFFF",
    cloudMuted: "#E0F0E2",
    bow: "#F2A0B8",
    mochi: { breath: 2.2, hopEvery: 3.2, hopHeight: 0.55, wave: 0.5, eyes: 1, lookSpeed: 4 },
  },
  ovulatoria: {
    grass: ["#B2E5B6", "#9CDAAC"],
    dirt: "#F4DCB0",
    rock: "#EAC592",
    trunk: "#C9A084",
    canopy: ["#8FD3A6", "#B2E5B6"],
    light: { hemiSky: "#FFFFFF", hemiGround: "#FFE2A8", hemi: 2.4, sun: 1.3, sunColor: "#FFF4CC" },
    particles: { colors: ["#FFE2A8", "#FFFFFF"], size: 0.09, speed: 0.5, sway: 0.7, rise: true },
    cloud: "#FFFFFF",
    cloudMuted: "#FFEFD0",
    bow: "#F4889F",
    mochi: { breath: 3, hopEvery: 1.6, hopHeight: 0.8, wave: 1, eyes: 1, lookSpeed: 6 },
  },
  lutea: {
    grass: ["#F5D8A6", "#F0CA94"],
    dirt: "#DDB096",
    rock: "#C49582",
    trunk: "#AE7E6E",
    canopy: ["#F7BA9C", "#F09E85"],
    light: { hemiSky: "#FFF6F0", hemiGround: "#F1BDB9", hemi: 2.3, sun: 1.2, sunColor: "#FFDCC4" },
    particles: { colors: ["#F7BA9C", "#F5D8A6", "#F09E85"], size: 0.14, speed: 0.5, sway: 1.2, rise: false },
    cloud: "#FFF0E8",
    cloudMuted: "#F9E0D6",
    bow: "#D9798F",
    mochi: { breath: 1.5, hopEvery: 0, hopHeight: 0, wave: 0.15, eyes: 0.75, lookSpeed: 2.5 },
  },
}
