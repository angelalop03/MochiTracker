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
    grass: ["#FFF4DC", "#E6E3F2"],
    dirt: "#7A5C8E",
    rock: "#4F3C68",
    trunk: "#5A4372",
    canopy: ["#E6E3F2", "#FFF4DC"],
    light: { hemiSky: "#BDB8F0", hemiGround: "#3B3A6B", hemi: 1.5, sun: 1.3, sunColor: "#FFE2C2" },
    particles: { colors: ["#FFF4DC", "#D6D3F0"], size: 0.14, speed: 0.7, sway: 0.5, rise: false },
    cloud: "#5C5A94",
    mochi: { breath: 1.1, hopEvery: 0, hopHeight: 0, wave: 0, eyes: 0.35, lookSpeed: 1.5 },
  },
  folicular: {
    grass: ["#9BE564", "#7CCF52"],
    dirt: "#A9764A",
    rock: "#7B5A44",
    trunk: "#7B5A44",
    canopy: ["#C9F08C", "#9BE564"],
    light: { hemiSky: "#FFFFFF", hemiGround: "#9BE564", hemi: 1.9, sun: 1.6, sunColor: "#FFF6D6" },
    particles: { colors: ["#FFF4DC", "#C9F08C"], size: 0.1, speed: 0.35, sway: 0.9, rise: true },
    cloud: "#FFFFFF",
    mochi: { breath: 2.2, hopEvery: 3.2, hopHeight: 0.55, wave: 0.5, eyes: 1, lookSpeed: 4 },
  },
  ovulatoria: {
    grass: ["#5FCB6E", "#47B45F"],
    dirt: "#E8C37E",
    rock: "#C99A5B",
    trunk: "#8A5A3C",
    canopy: ["#2F9E68", "#47B45F"],
    light: { hemiSky: "#FFFDF0", hemiGround: "#FFD23F", hemi: 2.1, sun: 2, sunColor: "#FFF0B8" },
    particles: { colors: ["#FFD23F", "#FFF4DC"], size: 0.09, speed: 0.5, sway: 0.7, rise: true },
    cloud: "#FFFFFF",
    mochi: { breath: 3, hopEvery: 1.6, hopHeight: 0.8, wave: 1, eyes: 1, lookSpeed: 6 },
  },
  lutea: {
    grass: ["#D9A34A", "#C98A3C"],
    dirt: "#8A5A3C",
    rock: "#5E3F33",
    trunk: "#5E3F33",
    canopy: ["#F28C5A", "#D9622E"],
    light: { hemiSky: "#FFD9B8", hemiGround: "#8A4B3C", hemi: 1.7, sun: 1.5, sunColor: "#FFC48A" },
    particles: { colors: ["#F28C5A", "#FFB84D", "#D9622E"], size: 0.15, speed: 0.55, sway: 1.2, rise: false },
    cloud: "#E9B48C",
    mochi: { breath: 1.5, hopEvery: 0, hopHeight: 0, wave: 0.15, eyes: 0.7, lookSpeed: 2.5 },
  },
}
