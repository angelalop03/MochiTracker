// «Cuida a Mochi»: un minijuego opcional. Mochi siente su estación como tú la tuya, así que
// lo que le sienta bien es lo que te puede sentar bien a ti. Sin dependencias de interfaz.

import type { Phase } from "../lib/cycle.js"
import type { BlockId } from "./phases.js"

export type CareId =
  | "manta"
  | "chocolate"
  | "infusion"
  | "bolsa"
  | "regadera"
  | "fresas"
  | "cometa"
  | "siesta"
  | "limonada"
  | "abanico"
  | "cascos"
  | "pesas"
  | "fiesta"

/** Cómo reacciona Mochi al tocarlo */
export type PokeMood = "happy" | "party" | "sleepy" | "grumpy"

export interface CareItem {
  name: string
  /** Sprite de 12 × 12: cada letra es un color de la paleta, el punto es transparente */
  sprite: string[]
  palette: Record<string, string>
}

export const CARE_ITEMS: Record<CareId, CareItem> = {
  manta: {
    name: "Manta",
    palette: { L: "#8E7CC3", W: "#FFFFFF", P: "#B9A6F2" },
    sprite: [
      "............",
      "............",
      "..LLLLLLLL..",
      ".LWWWWWWWWL.",
      ".LLLLLLLLLL.",
      ".LPPPPPPPPL.",
      ".LWWWWWWWWL.",
      ".LLLLLLLLLL.",
      ".LPPPPPPPPL.",
      "..LLLLLLLL..",
    ],
  },
  chocolate: {
    name: "Chocolate",
    palette: { B: "#8A5A3C", D: "#6B4129", S: "#D9D2CC" },
    sprite: [
      "............",
      "...SSSSSS...",
      "...SSSSSS...",
      "...BBDBBD...",
      "...BBDBBD...",
      "...DDDDDD...",
      "...BBDBBD...",
      "...BBDBBD...",
      "...DDDDDD...",
      "...BBDBBD...",
      "...BBDBBD...",
    ],
  },
  infusion: {
    name: "Infusión",
    palette: { M: "#E88FA0", T: "#B9784C", W: "#C9B9C4", P: "#F6A9BB" },
    sprite: [
      "....W.W.....",
      "...W.W......",
      "............",
      "..MMMMMM....",
      "..MTTTTMMM..",
      "..MPPPPM.M..",
      "..MMMMMM.M..",
      "..MMMMMMMM..",
      "..MMMMMM....",
      "...MMMM.....",
    ],
  },
  bolsa: {
    name: "Bolsa de agua caliente",
    palette: { R: "#F28B8B", H: "#FFFFFF", C: "#8E7CC3" },
    sprite: [
      ".....CC.....",
      "....CCCC....",
      "...RRRRRR...",
      "..RRRRRRRR..",
      "..RHRRRRRR..",
      "..RHRRRRRR..",
      "..RRRRRRRR..",
      "..RRRRRRRR..",
      "..RRRRRRRR..",
      "...RRRRRR...",
    ],
  },
  regadera: {
    name: "Regadera",
    palette: { H: "#5F9FCB", B: "#8CC8EE" },
    sprite: [
      "............",
      "...HHH......",
      "..H...H.....",
      "..BBBBB...H.",
      "..BBBBB..H..",
      "..BBBBBBH...",
      "..BBBBB.....",
      "..BBBBB.....",
      "..BBBBB.....",
    ],
  },
  fresas: {
    name: "Fresas",
    palette: { R: "#E8546A", G: "#5FAE6E", Y: "#FFE2A8" },
    sprite: [
      "............",
      "....GGGG....",
      "...GGGGGG...",
      "..RRRRRRRR..",
      "..RYRRRYRR..",
      "..RRRRRRRR..",
      "...RRYRRR...",
      "...RRRRRR...",
      "....RRRR....",
      ".....RR.....",
    ],
  },
  cometa: {
    name: "Cometa",
    palette: { P: "#F28FB3", Y: "#FFFFFF", T: "#8E7CC3" },
    sprite: [
      ".....P......",
      "....PPP.....",
      "...PPPPP....",
      "..PPPYPPP...",
      "...PPPPP....",
      "....PPP.....",
      ".....P......",
      ".....T......",
      "......T.....",
      ".....T......",
      "......T.....",
    ],
  },
  siesta: {
    name: "Siesta larga",
    palette: { W: "#C9D4F2", B: "#8E9BD8", Z: "#6E7FC8" },
    sprite: [
      "........ZZ..",
      ".........Z..",
      "........ZZ..",
      "............",
      "..WWWWWWW...",
      ".WWWWWWWWW..",
      ".WBBBBBBBW..",
      ".WWWWWWWWW..",
      "..WWWWWWW...",
    ],
  },
  limonada: {
    name: "Limonada",
    palette: { G: "#A9CFE3", Y: "#F5D76E", S: "#F28FB3" },
    sprite: [
      ".......S....",
      "......S.....",
      "..GGGGSGG...",
      "..GYYYSYG...",
      "..GYYYYYG...",
      "..GYYYYYG...",
      "..GYYYYYG...",
      "..GYYYYYG...",
      "...GYYYG....",
      "...GGGGG....",
    ],
  },
  abanico: {
    name: "Abanico",
    palette: { P: "#E88FA0", W: "#FFFFFF", H: "#8A5A3C" },
    sprite: [
      "............",
      "..P.P.P.P...",
      "..PPPPPPP...",
      "...PWPWP....",
      "...PPPPP....",
      "....PWP.....",
      "....PPP.....",
      ".....H......",
      ".....H......",
    ],
  },
  cascos: {
    name: "Música",
    palette: { B: "#3A2A38", C: "#F28FB3" },
    sprite: [
      "............",
      "....BBBB....",
      "...B....B...",
      "..B......B..",
      "..B......B..",
      ".CC......CC.",
      ".CC......CC.",
      ".CC......CC.",
    ],
  },
  pesas: {
    name: "Entreno intenso",
    palette: { K: "#6B5E66", G: "#B8A9B2" },
    sprite: [
      "............",
      "............",
      "............",
      ".KK......KK.",
      ".KK......KK.",
      ".KKGGGGGGKK.",
      ".KK......KK.",
      ".KK......KK.",
    ],
  },
  fiesta: {
    name: "Fiesta hasta tarde",
    palette: { K: "#8E7CC3", P: "#F5C94A", Y: "#F28FB3", B: "#8CC8EE" },
    sprite: [
      "........Y...",
      "......B..Y..",
      "....Y...B...",
      "...KKK......",
      "..KPKK......",
      "..KKPK......",
      ".KPKK.......",
      ".KKK........",
      "KK..........",
    ],
  },
}

export interface PhaseCare {
  /** Lo que le sienta bien en esta estación */
  wants: [CareId, CareId, CareId]
  /** Lo que hoy no le apetece */
  nope: CareId
  /** Cómo reacciona al tocarlo si aún no le has cuidado */
  poke: PokeMood
  lines: {
    hello: string
    poke: string
    /** Al tocarlo cuando ya le has cuidado */
    pokeCared: string
    gifts: Partial<Record<CareId, string>>
    nope: string
    done: string
  }
  /** Lo mismo, para ti: el minijuego es un espejo */
  mirror: string
  /** Tema de la guía relacionado */
  topic: BlockId
}

export const PHASE_CARE: Record<Phase, PhaseCare> = {
  menstrual: {
    wants: ["manta", "bolsa", "infusion"],
    nope: "pesas",
    poke: "sleepy",
    lines: {
      hello: "Hoy voy despacito… ¿me ayudas a estar calentita?",
      poke: "Mmm… déjame descansar un poquito.",
      pokeCared: "Gracias por cuidarme. Ya me encuentro mejor.",
      gifts: {
        manta: "Qué gustito de manta.",
        bolsa: "Calor en la tripa… justo lo que necesitaba.",
        infusion: "Calentita. Gracias.",
      },
      nope: "Hoy no puedo con eso. Mejor otro día.",
      done: "Mochi está calentita y tranquila.",
    },
    mirror: "Tú también: calor en la tripa, algo caliente y descanso sin culpa.",
    topic: "cuerpo",
  },
  folicular: {
    wants: ["regadera", "fresas", "cometa"],
    nope: "siesta",
    poke: "happy",
    lines: {
      hello: "¡Han salido brotes nuevos! ¿Hacemos algo?",
      poke: "¡Hola! ¿Qué hacemos hoy?",
      pokeCared: "¡Qué día tan bonito!",
      gifts: {
        regadera: "¡A regar los brotes!",
        fresas: "¡Fresquitas y riquísimas!",
        cometa: "¡Mira qué alto vuela!",
      },
      nope: "¿Dormir? ¡Si hay mil cosas por hacer!",
      done: "Mochi está llena de energía.",
    },
    mirror: "Aprovecha tú también: algo fresco, aire libre y un plan nuevo.",
    topic: "energia",
  },
  ovulatoria: {
    wants: ["limonada", "abanico", "cascos"],
    nope: "manta",
    poke: "party",
    lines: {
      hello: "¡Hace un sol increíble! ¿Me preparas algo fresquito?",
      poke: "¡Wiii! ¡Otra vez!",
      pokeCared: "¡Hoy no hay quien me pare!",
      gifts: {
        limonada: "¡Fresquita! Justo lo que necesitaba con este calor.",
        abanico: "Aire fresco… ¡qué gusto!",
        cascos: "¡Esta canción me encanta!",
      },
      nope: "¿Una manta? ¡Con este calor!",
      done: "Mochi está radiante.",
    },
    mirror: "Tú también: bebe agua, pon tu música y disfruta de la energía.",
    topic: "emociones",
  },
  lutea: {
    wants: ["chocolate", "manta", "infusion"],
    nope: "fiesta",
    poke: "grumpy",
    lines: {
      hello: "Hoy estoy un poco de bajón… ¿me cuidas?",
      poke: "¡Eh! Hoy no estoy para saltos.",
      pokeCared: "Vale, vale… un saltito pequeño. Gracias.",
      gifts: {
        chocolate: "Chocolate… justo lo que necesitaba.",
        manta: "Qué gustito de manta.",
        infusion: "Calentita. Me sienta genial.",
      },
      nope: "Hoy no, porfa. Prefiero sofá.",
      done: "Mochi está a gustito.",
    },
    mirror: "Igual que Mochi, tú también te mereces una manta y algo dulce estos días.",
    topic: "emociones",
  },
}
