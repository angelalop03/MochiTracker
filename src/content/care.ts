// «Cuida a Mochi»: un tamagochi opcional. Mochi siente su estación como tú la tuya, así que lo
// que le sienta bien es lo que te puede sentar bien a ti. Sin dependencias de interfaz.

import type { Phase } from "../lib/cycle.js"
import type { BlockId } from "./phases.js"

/** Sus cuatro necesidades, de 0 a 100 */
export type Stat = "barriga" | "energia" | "animo" | "confort"

export const STATS: { id: Stat; label: string }[] = [
  { id: "barriga", label: "Barriga" },
  { id: "energia", label: "Energía" },
  { id: "animo", label: "Ánimo" },
  { id: "confort", label: "Comodidad" },
]

export type Category = "comida" | "mimos" | "jugar" | "descanso" | "confort"

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "comida", label: "Comida" },
  { id: "mimos", label: "Mimos" },
  { id: "jugar", label: "Jugar" },
  { id: "descanso", label: "Descanso" },
  { id: "confort", label: "Comodidad" },
]

export type CareId =
  | "chocolate"
  | "fresas"
  | "sopa"
  | "limonada"
  | "ensalada"
  | "abrazo"
  | "cepillo"
  | "cuento"
  | "regadera"
  | "cometa"
  | "pelota"
  | "cascos"
  | "pesas"
  | "fiesta"
  | "siesta"
  | "manta"
  | "bolsa"
  | "abanico"
  | "infusion"
  | "bano"

export interface CareItem {
  name: string
  category: Category
  /** Cuánto sube (o baja) cada necesidad */
  effect: Partial<Record<Stat, number>>
  /** Lo que dice Mochi al recibirlo */
  say: string
  /** Se lo pone y lo lleva un rato */
  wear?: boolean
  /** Sprite de 12 × 12: cada letra es un color de la paleta, el punto es transparente */
  sprite: string[]
  palette: Record<string, string>
}

export const CARE_ITEMS: Record<CareId, CareItem> = {
  chocolate: {
    name: "Chocolate",
    category: "comida",
    effect: { barriga: 15, animo: 10 },
    say: "Chocolate… mmm.",
    palette: { B: "#8A5A3C", D: "#6B4129", S: "#D9D2CC" },
    sprite: ["...SSSSSS...", "...SSSSSS...", "...BBDBBD...", "...BBDBBD...", "...DDDDDD...", "...BBDBBD...", "...BBDBBD...", "...DDDDDD...", "...BBDBBD...", "...BBDBBD..."],
  },
  fresas: {
    name: "Fresas",
    category: "comida",
    effect: { barriga: 20, animo: 5 },
    say: "¡Fresquitas y riquísimas!",
    palette: { R: "#E8546A", G: "#5FAE6E", Y: "#FFE2A8" },
    sprite: ["....GGGG....", "...GGGGGG...", "..RRRRRRRR..", "..RYRRRYRR..", "..RRRRRRRR..", "...RRYRRR...", "...RRRRRR...", "....RRRR....", ".....RR....."],
  },
  sopa: {
    name: "Sopa calentita",
    category: "comida",
    effect: { barriga: 30, confort: 10 },
    say: "Sopita calentita… qué bien sienta.",
    palette: { B: "#F6A9BB", S: "#F2A65A", W: "#C9B9C4" },
    sprite: ["....W.W.....", "...W.W......", "............", ".BBBBBBBBBB.", ".BSSSSSSSSB.", "..BBBBBBBB..", "...BBBBBB...", "....BBBB...."],
  },
  limonada: {
    name: "Limonada",
    category: "comida",
    effect: { barriga: 10, confort: 15 },
    say: "¡Fresquita!",
    palette: { G: "#A9CFE3", Y: "#F5D76E", S: "#F28FB3" },
    sprite: [".......S....", "......S.....", "..GGGGSGG...", "..GYYYSYG...", "..GYYYYYG...", "..GYYYYYG...", "..GYYYYYG...", "..GYYYYYG...", "...GYYYG....", "...GGGGG...."],
  },
  ensalada: {
    name: "Ensalada",
    category: "comida",
    effect: { barriga: 25 },
    say: "¡Qué fresquita y qué colores!",
    palette: { G: "#5FAE6E", L: "#9FD2AD", R: "#E8546A", B: "#B9A6F2" },
    sprite: ["...G.L.G....", "..LGGRGLG...", ".BBBBBBBBBB.", "..BBBBBBBB..", "...BBBBBB...", "....BBBB...."],
  },
  abrazo: {
    name: "Abrazo",
    category: "mimos",
    effect: { animo: 20, confort: 5 },
    say: "Ayyy, qué abrazo tan bonito.",
    palette: { R: "#E8546A", H: "#FFFFFF" },
    sprite: ["..RR...RR...", ".RRRR.RRRR..", ".RRRRRRRRR..", ".RRHRRRRRR..", "..RRRRRRR...", "...RRRRR....", "....RRR.....", ".....R......"],
  },
  cepillo: {
    name: "Peinarla",
    category: "mimos",
    effect: { animo: 10, confort: 10 },
    say: "Qué gustito… sigue, sigue.",
    palette: { H: "#8A5A3C", B: "#F28FB3", W: "#FFFFFF" },
    sprite: ["........HH..", ".......HHH..", "......HH....", "..BBBBB.....", ".BBBBBBB....", ".BWBWBWB....", ".BBBBBBB....", "..BBBBB....."],
  },
  cuento: {
    name: "Un cuento",
    category: "mimos",
    effect: { animo: 15, energia: 5 },
    say: "Me encanta este cuento.",
    palette: { B: "#8E7CC3", W: "#FFFFFF", P: "#F6A9BB" },
    sprite: ["..BBBBBBB...", "..BWWWWWB...", "..BWBBBWB...", "..BWWWWWB...", "..BWBBBWB...", "..BWWWWWB...", "..BBBBBBB...", "..PPPPPPP..."],
  },
  regadera: {
    name: "Regar flores",
    category: "jugar",
    effect: { animo: 15, energia: -5 },
    say: "¡A regar los brotes!",
    palette: { H: "#5F9FCB", B: "#8CC8EE" },
    sprite: ["...HHH......", "..H...H.....", "..BBBBB...H.", "..BBBBB..H..", "..BBBBBBH...", "..BBBBB.....", "..BBBBB.....", "..BBBBB....."],
  },
  cometa: {
    name: "Cometa",
    category: "jugar",
    effect: { animo: 20, energia: -10 },
    say: "¡Mira qué alto vuela!",
    wear: true,
    palette: { P: "#F28FB3", Y: "#FFFFFF", T: "#8E7CC3" },
    sprite: [".....P......", "....PPP.....", "...PPPPP....", "..PPPYPPP...", "...PPPPP....", "....PPP.....", ".....P......", ".....T......", "......T.....", ".....T......", "......T....."],
  },
  pelota: {
    name: "Pelota",
    category: "jugar",
    effect: { animo: 15, energia: -10, barriga: -5 },
    say: "¡Pásamela otra vez!",
    palette: { R: "#F28FB3", W: "#FFFFFF", Y: "#F5C94A" },
    sprite: ["....RRRR....", "..RRWWRRRR..", "..RWWRRRRR..", ".RRRRRRRRRR.", ".YYYYYYYYYY.", ".RRRRRRRRRR.", "..RRRRRRRR..", "..RRRRRRRR..", "....RRRR...."],
  },
  cascos: {
    name: "Música",
    category: "jugar",
    effect: { animo: 15 },
    say: "¡Esta canción me encanta!",
    wear: true,
    palette: { B: "#3A2A38", C: "#F28FB3" },
    sprite: ["....BBBB....", "...B....B...", "..B......B..", "..B......B..", ".CC......CC.", ".CC......CC.", ".CC......CC."],
  },
  pesas: {
    name: "Entreno intenso",
    category: "jugar",
    effect: { animo: 10, energia: -25 },
    say: "¡Uf, qué fuerza tengo!",
    palette: { K: "#6B5E66", G: "#B8A9B2" },
    sprite: [".KK......KK.", ".KK......KK.", ".KKGGGGGGKK.", ".KK......KK.", ".KK......KK."],
  },
  fiesta: {
    name: "Fiesta",
    category: "jugar",
    effect: { animo: 25, energia: -30 },
    say: "¡Fiestaaa!",
    palette: { K: "#8E7CC3", P: "#F5C94A", Y: "#F28FB3", B: "#8CC8EE" },
    sprite: ["........Y...", "......B..Y..", "....Y...B...", "...KKK......", "..KPKK......", "..KKPK......", ".KPKK.......", ".KKK........", "KK.........."],
  },
  siesta: {
    name: "Siesta",
    category: "descanso",
    effect: { energia: 45 },
    say: "Una siestita… Zzz…",
    palette: { W: "#C9D4F2", B: "#8E9BD8", Z: "#6E7FC8" },
    sprite: ["........ZZ..", ".........Z..", "........ZZ..", "............", "..WWWWWWW...", ".WWWWWWWWW..", ".WBBBBBBBW..", ".WWWWWWWWW..", "..WWWWWWW..."],
  },
  manta: {
    name: "Manta",
    category: "confort",
    effect: { confort: 30 },
    say: "Qué gustito de manta.",
    wear: true,
    palette: { L: "#8E7CC3", W: "#FFFFFF", P: "#B9A6F2" },
    sprite: ["..LLLLLLLL..", ".LWWWWWWWWL.", ".LLLLLLLLLL.", ".LPPPPPPPPL.", ".LWWWWWWWWL.", ".LLLLLLLLLL.", ".LPPPPPPPPL.", "..LLLLLLLL.."],
  },
  bolsa: {
    name: "Bolsa de agua caliente",
    category: "confort",
    effect: { confort: 25, animo: 5 },
    say: "Calor en la tripa… justo lo que necesitaba.",
    wear: true,
    palette: { R: "#F28B8B", H: "#FFFFFF", C: "#8E7CC3" },
    sprite: [".....CC.....", "....CCCC....", "...RRRRRR...", "..RRRRRRRR..", "..RHRRRRRR..", "..RHRRRRRR..", "..RRRRRRRR..", "..RRRRRRRR..", "..RRRRRRRR..", "...RRRRRR..."],
  },
  abanico: {
    name: "Abanico",
    category: "confort",
    effect: { confort: 25 },
    say: "Aire fresco… ¡qué gusto!",
    wear: true,
    palette: { P: "#E88FA0", W: "#FFFFFF", H: "#8A5A3C" },
    sprite: ["..P.P.P.P...", "..PPPPPPP...", "...PWPWP....", "...PPPPP....", "....PWP.....", "....PPP.....", ".....H......", ".....H......"],
  },
  infusion: {
    name: "Infusión",
    category: "confort",
    effect: { confort: 15, animo: 5 },
    say: "Calentita. Gracias.",
    palette: { M: "#E88FA0", T: "#B9784C", W: "#C9B9C4", P: "#F6A9BB" },
    sprite: ["....W.W.....", "...W.W......", "............", "..MMMMMM....", "..MTTTTMMM..", "..MPPPPM.M..", "..MMMMMM.M..", "..MMMMMMMM..", "..MMMMMM....", "...MMMM....."],
  },
  bano: {
    name: "Baño de burbujas",
    category: "confort",
    effect: { confort: 20, animo: 5 },
    say: "¡Burbujitas!",
    palette: { O: "#8CC8EE", K: "#B9A6F2", W: "#E3F2FA" },
    sprite: ["...O..O.....", "..O.O..O....", "...O.O......", "............", "KKKKKKKKKKKK", ".KWWWWWWWWK.", ".KWWWWWWWWK.", "..KKKKKKKK..", "..K......K.."],
  },
}

/** Cómo es de base al tocarla en cada estación */
export type Temperament = "grumpy" | "soft" | "sleepy" | "happy" | "party"

/** Cómo se siente ahora, según sus necesidades */
export type Mood = "feliz" | "bien" | "regular" | "hambrienta" | "cansada" | "triste" | "incomoda" | "dormida"

export interface PhaseCare {
  /** Cuánto baja cada necesidad por hora */
  decay: Record<Stat, number>
  /** Lo que más le gusta en esta estación: hace el doble de efecto */
  favorites: CareId[]
  /** Lo que hoy no quiere, con lo que dice */
  refuses: Partial<Record<CareId, string>>
  temperament: Temperament
  hello: string
  /** Cuando está feliz */
  happy: string
  /** Lo mismo, para ti: el minijuego es un espejo */
  mirror: string
  /** Tema de la guía relacionado */
  topic: BlockId
  /** Con poca comodidad, ¿tiene frío o calor? */
  feels: "frio" | "calor"
}

export const PHASE_CARE: Record<Phase, PhaseCare> = {
  menstrual: {
    decay: { barriga: 5, energia: 8, animo: 5, confort: 7 },
    favorites: ["manta", "bolsa", "infusion", "sopa", "siesta", "cuento"],
    refuses: {
      pesas: "Hoy no puedo con eso. Mejor otro día.",
      fiesta: "¿Fiesta? Hoy solo quiero sofá y mantita.",
      abanico: "Brrr, ¡que tengo frío!",
      cometa: "Hoy no me apetece salir, ¿vale?",
    },
    temperament: "sleepy",
    hello: "Hoy voy despacito… ¿me ayudas a estar calentita?",
    happy: "Calentita y tranquila. Gracias por cuidarme.",
    mirror: "Tú también: calor en la tripa, algo caliente y descanso sin culpa.",
    topic: "cuerpo",
    feels: "frio",
  },
  folicular: {
    decay: { barriga: 6, energia: 4, animo: 3, confort: 4 },
    favorites: ["fresas", "ensalada", "regadera", "cometa", "pelota", "pesas"],
    refuses: {
      siesta: "¿Dormir? ¡Si hay mil cosas por hacer!",
    },
    temperament: "happy",
    hello: "¡Han salido brotes nuevos! ¿Hacemos algo?",
    happy: "¡Llena de energía! ¿Qué probamos ahora?",
    mirror: "Aprovecha tú también: algo fresco, aire libre y un plan nuevo.",
    topic: "energia",
    feels: "calor",
  },
  ovulatoria: {
    decay: { barriga: 7, energia: 3, animo: 3, confort: 7 },
    favorites: ["limonada", "fresas", "abanico", "cascos", "fiesta", "pelota"],
    refuses: {
      manta: "¿Una manta? ¡Con este calor!",
      sopa: "¿Sopa caliente? ¡Me derrito!",
      bolsa: "¡Ni hablar, hace un calor horrible!",
    },
    temperament: "party",
    hello: "¡Hace un sol increíble! ¿Me preparas algo fresquito?",
    happy: "¡Radiante! Hoy no hay quien me pare.",
    mirror: "Tú también: bebe agua, pon tu música y disfruta de la energía.",
    topic: "emociones",
    feels: "calor",
  },
  lutea: {
    decay: { barriga: 8, energia: 5, animo: 8, confort: 5 },
    favorites: ["chocolate", "manta", "infusion", "abrazo", "sopa", "bano"],
    refuses: {
      fiesta: "Hoy no, porfa. Prefiero sofá.",
      pesas: "¿Entrenar fuerte? Hoy no tengo el cuerpo para eso.",
    },
    temperament: "grumpy",
    hello: "Hoy estoy un poco de bajón… ¿me cuidas?",
    happy: "A gustito. Contigo así, se me pasa todo.",
    mirror: "Igual que Mochi, tú también te mereces una manta y algo dulce estos días.",
    topic: "emociones",
    feels: "frio",
  },
}

/** Cómo reacciona al tocarla, vez a vez: la tercera se repite hasta que la dejas tranquila */
export const POKE_LINES: Record<Temperament, [string, string, string]> = {
  grumpy: ["Oye… hoy no estoy de humor. Mejor no me toques.", "¡Que te he dicho que no!", "Hmph. Ya no te hablo."],
  soft: ["Jiji, hola.", "Vale, ya, ya… que hoy estoy sensible.", "¡Que no! Ahora sí me he enfadado."],
  sleepy: ["Mmm… ¿qué pasa?", "Déjame descansar un poquito…", "Zzz…"],
  happy: ["¡Hola!", "¡Otra vez!", "¡Uy, me mareo!"],
  party: ["¡Wiii!", "¡Más, más!", "Uf… todo me da vueltas."],
}

/** Lo que dice según cómo se siente, cuando no está bien */
export const MOOD_LINES: Partial<Record<Mood, string>> = {
  hambrienta: "Tengo un poco de hambre…",
  cansada: "Estoy agotada… ¿una siestita?",
  triste: "Hoy estoy un poco triste…",
  dormida: "Zzz…",
}

export const MOOD_LABELS: Record<Mood, string> = {
  feliz: "Feliz",
  bien: "Bien",
  regular: "Regular",
  hambrienta: "Con hambre",
  cansada: "Cansada",
  triste: "Triste",
  incomoda: "Incómoda",
  dormida: "Dormida",
}

/** Nivel de cariño: sube con cada cuidado */
export const LEVELS = ["Recién conocidas", "Amigas", "Buenas amigas", "Mejores amigas", "Inseparables"]
