// «Cuida a Mochi»: un tamagochi opcional. Mochi siente su estación como tú la tuya, así que los
// cuidados son autocuidados reales de cada fase (los de las guías), y al recibirlos Mochi cuenta
// para qué sirven. Sin dependencias de interfaz.

import type { Phase } from "../lib/cycle.js"
import type { BlockId } from "./phases.js"

/** Sus cuatro necesidades, de 0 a 100 */
export type Stat = "barriga" | "energia" | "animo" | "confort"

export const STATS: { id: Stat; label: string }[] = [
  { id: "barriga", label: "Alimentación" },
  { id: "energia", label: "Energía" },
  { id: "animo", label: "Ánimo" },
  { id: "confort", label: "Cuerpo" },
]

export type Category = "comida" | "cuerpo" | "moverse" | "mente"

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "comida", label: "Comer y beber" },
  { id: "cuerpo", label: "Cuerpo" },
  { id: "moverse", label: "Moverse" },
  { id: "mente", label: "Mente y descanso" },
]

export type CareId =
  | "lentejas"
  | "chocolate"
  | "frutos"
  | "platano"
  | "naranja"
  | "ensalada"
  | "agua"
  | "infusion"
  | "cafe"
  | "patatas"
  | "bolsa"
  | "manta"
  | "bano"
  | "masaje"
  | "limpieza"
  | "crema"
  | "protector"
  | "paseo"
  | "yoga"
  | "fuerza"
  | "cardio"
  | "bailar"
  | "dormir"
  | "diario"
  | "amiga"
  | "respirar"
  | "desconectar"

/** Lo que hace Mochi mientras tanto, en 3D */
export type Activity = "walk" | "yoga" | "workout" | "dance" | "breathe"

export interface CareItem {
  name: string
  category: Category
  /** Cuánto sube (o baja) cada necesidad */
  effect: Partial<Record<Stat, number>>
  /** Lo que dice Mochi al recibirlo: para qué le sirve */
  say: string
  /** Cómo se ve en 3D: en la mano un momento, puesto un rato o haciendo algo */
  show: "hold" | "wear" | "do"
  activity?: Activity
  /** Sprite de 12 columnas: cada letra es un color de la paleta, el punto es transparente */
  sprite: string[]
  palette: Record<string, string>
}

export const CARE_ITEMS: Record<CareId, CareItem> = {
  // ------------------------------------------------------------ comer y beber
  lentejas: {
    name: "Lentejas",
    category: "comida",
    effect: { barriga: 30, energia: 10 },
    say: "¡Lentejas! El hierro me ayuda a recuperar lo que pierdo con la regla.",
    show: "hold",
    palette: { L: "#C98B5A", D: "#8A5A3C", B: "#F6A9BB" },
    sprite: ["...LDLDLD...", "..DLDLDLDL..", ".BBBBBBBBBB.", ".BBBBBBBBBB.", "..BBBBBBBB..", "...BBBBBB...", "....BBBB...."],
  },
  chocolate: {
    name: "Chocolate negro",
    category: "comida",
    effect: { barriga: 10, animo: 15 },
    say: "Un par de onzas de chocolate negro: su magnesio me calma.",
    show: "hold",
    palette: { B: "#8A5A3C", D: "#6B4129", S: "#D9D2CC" },
    sprite: ["...SSSSSS...", "...SSSSSS...", "...BBDBBD...", "...BBDBBD...", "...DDDDDD...", "...BBDBBD...", "...BBDBBD...", "...DDDDDD...", "...BBDBBD...", "...BBDBBD..."],
  },
  frutos: {
    name: "Frutos secos",
    category: "comida",
    effect: { barriga: 15, animo: 5, energia: 5 },
    say: "Un puñado de frutos secos: magnesio y energía que dura.",
    show: "hold",
    palette: { A: "#C98B5A", N: "#8A5A3C", B: "#B9A6F2" },
    sprite: ["...ANANA....", "..NANANAN...", ".BBBBBBBBBB.", "..BBBBBBBB..", "...BBBBBB..."],
  },
  platano: {
    name: "Plátano",
    category: "comida",
    effect: { barriga: 15, confort: 10 },
    say: "Un plátano: su potasio y su magnesio me ayudan con los calambres.",
    show: "hold",
    palette: { Y: "#F5D76E", S: "#8A5A3C" },
    sprite: [".........S..", "........YY..", ".......YYY..", "......YYYY..", ".Y...YYYYY..", ".YYYYYYYY...", "..YYYYYY....", "....YY......"],
  },
  naranja: {
    name: "Naranja",
    category: "comida",
    effect: { barriga: 10, energia: 10 },
    say: "¡Naranja! La vitamina C me ayuda a aprovechar el hierro.",
    show: "hold",
    palette: { O: "#F2A65A", H: "#FFE2A8", G: "#5FAE6E" },
    sprite: [".....G......", "....GG......", "...OOOOO....", "..OOOOOOO...", ".OOHOOOOOO..", ".OOOOOOOOO..", ".OOOOOOOOO..", "..OOOOOOO...", "...OOOOO...."],
  },
  ensalada: {
    name: "Ensalada con proteína",
    category: "comida",
    effect: { barriga: 25, energia: 5 },
    say: "Verdura, legumbre y huevo: fresquita y me sacia de verdad.",
    show: "hold",
    palette: { G: "#5FAE6E", L: "#9FD2AD", R: "#E8546A", B: "#B9A6F2" },
    sprite: ["...G.L.G....", "..LGGRGLG...", ".BBBBBBBBBB.", "..BBBBBBBB..", "...BBBBBB...", "....BBBB...."],
  },
  agua: {
    name: "Vaso de agua",
    category: "comida",
    effect: { confort: 10, energia: 5 },
    say: "Beber agua me quita el dolor de cabeza y la hinchazón.",
    show: "hold",
    palette: { G: "#A9CFE3", W: "#8CC8EE", H: "#FFFFFF" },
    sprite: ["..G......G..", "..GWWWWWWG..", "..GWHWWWWG..", "..GWWWWWWG..", "..GWWWWWWG..", "...GWWWWG...", "...GGGGGG..."],
  },
  infusion: {
    name: "Infusión de jengibre",
    category: "comida",
    effect: { confort: 15, animo: 5 },
    say: "Jengibre calentito: me calma la tripa.",
    show: "hold",
    palette: { M: "#E88FA0", T: "#B9784C", W: "#C9B9C4", P: "#F6A9BB" },
    sprite: ["....W.W.....", "...W.W......", "............", "..MMMMMM....", "..MTTTTMMM..", "..MPPPPM.M..", "..MMMMMM.M..", "..MMMMMMMM..", "..MMMMMM....", "...MMMM....."],
  },
  cafe: {
    name: "Café",
    category: "comida",
    effect: { energia: 15, confort: -5 },
    say: "Un cafecito para arrancar.",
    show: "hold",
    palette: { M: "#C9B9C4", C: "#6B4129", W: "#C9B9C4" },
    sprite: ["....W.W.....", "...W.W......", "............", "..MMMMMM....", "..MCCCCMMM..", "..MMMMMM.M..", "..MMMMMMMM..", "..MMMMMM....", "...MMMM....."],
  },
  patatas: {
    name: "Patatas de bolsa",
    category: "comida",
    effect: { barriga: 10, confort: -10 },
    say: "Crujientes… aunque con tanta sal me noto más hinchada.",
    show: "hold",
    palette: { R: "#E8546A", Y: "#F5C94A" },
    sprite: ["...RRRRRR...", "...RYYYYR...", "...YYYYYY...", "...YRRRRY...", "...YRYYRY...", "...YRRRRY...", "...YYYYYY...", "...RRRRRR..."],
  },

  // ------------------------------------------------------------------- cuerpo
  bolsa: {
    name: "Bolsa de agua caliente",
    category: "cuerpo",
    effect: { confort: 30 },
    say: "Calor en la tripa: relaja el músculo y los calambres se calman.",
    show: "wear",
    palette: { R: "#F28B8B", H: "#FFFFFF", C: "#8E7CC3" },
    sprite: [".....CC.....", "....CCCC....", "...RRRRRR...", "..RRRRRRRR..", "..RHRRRRRR..", "..RHRRRRRR..", "..RRRRRRRR..", "..RRRRRRRR..", "..RRRRRRRR..", "...RRRRRR..."],
  },
  manta: {
    name: "Manta y sofá",
    category: "cuerpo",
    effect: { confort: 20, animo: 5 },
    say: "Manta y sofá: hoy toca ir despacio.",
    show: "wear",
    palette: { L: "#8E7CC3", W: "#FFFFFF", P: "#B9A6F2" },
    sprite: ["..LLLLLLLL..", ".LWWWWWWWWL.", ".LLLLLLLLLL.", ".LPPPPPPPPL.", ".LWWWWWWWWL.", ".LLLLLLLLLL.", ".LPPPPPPPPL.", "..LLLLLLLL.."],
  },
  bano: {
    name: "Baño o ducha caliente",
    category: "cuerpo",
    effect: { confort: 20, animo: 10 },
    say: "Agua calentita: se me suelta la espalda y me relajo.",
    show: "do",
    palette: { O: "#8CC8EE", K: "#B9A6F2", W: "#E3F2FA" },
    sprite: ["...O..O.....", "..O.O..O....", "...O.O......", "............", "KKKKKKKKKKKK", ".KWWWWWWWWK.", ".KWWWWWWWWK.", "..KKKKKKKK..", "..K......K.."],
  },
  masaje: {
    name: "Masaje en la tripa",
    category: "cuerpo",
    effect: { confort: 25 },
    say: "Un masaje suave en círculos me alivia la tripa y la zona lumbar.",
    show: "do",
    palette: { P: "#F6C3B0", H: "#E8546A" },
    sprite: ["........H.H.", "....P.P..H..", "...PPPPP.P..", "...PPPPPPP..", "...PPPPPPP..", "...PPPPPP...", "....PPPP....", "....PPPP...."],
  },
  limpieza: {
    name: "Limpieza facial suave",
    category: "cuerpo",
    effect: { confort: 10, animo: 5 },
    say: "Limpieza suave mañana y noche: así salen menos granitos.",
    show: "do",
    palette: { B: "#8CC8EE", W: "#FFFFFF", D: "#5F9FCB" },
    sprite: ["....B.......", "...BWB..B...", "....B..BWB..", "........B...", "..DD........", ".DDDD.......", ".DDDD.......", "..DD........"],
  },
  crema: {
    name: "Crema hidratante",
    category: "cuerpo",
    effect: { confort: 10 },
    say: "Hidratante: estos días tengo la piel más seca.",
    show: "hold",
    palette: { L: "#B9A6F2", J: "#F6A9BB", W: "#FFFFFF" },
    sprite: ["...LLLLLL...", "...LLLLLL...", "..JJJJJJJJ..", "..JWJJJJJJ..", "..JJJJJJJJ..", "..JJJJJJJJ..", "..JJJJJJJJ.."],
  },
  protector: {
    name: "Protector solar",
    category: "cuerpo",
    effect: { confort: 10 },
    say: "Protector solar todos los días: lo que más cuida la piel.",
    show: "hold",
    palette: { S: "#F5C94A", T: "#F2A65A", Y: "#FFE2A8", K: "#8E7CC3" },
    sprite: ["S.S.........", ".SSS........", "SSSSS.......", ".SSS........", "S.S.TTTTT...", "....TYYYT...", "....TYYYT...", "....TYYYT...", "....TTTTT...", ".....KKK...."],
  },

  // ------------------------------------------------------------------ moverse
  paseo: {
    name: "Paseo",
    category: "moverse",
    effect: { animo: 15, energia: 5, barriga: -5 },
    say: "Un paseo al aire libre: me despeja y me mejora el ánimo.",
    show: "do",
    activity: "walk",
    palette: { P: "#F28FB3", W: "#C9B9C4" },
    sprite: ["....PPP.....", "...PPWP.....", "..PPPPPPP...", ".PPPPPPPPPP.", ".WWWWWWWWWW."],
  },
  yoga: {
    name: "Yoga suave",
    category: "moverse",
    effect: { confort: 15, animo: 10 },
    say: "Yoga suave: estirar me suelta las caderas y la espalda.",
    show: "do",
    activity: "yoga",
    palette: { R: "#8E7CC3", L: "#B9A6F2", M: "#B9A6F2" },
    sprite: ["..RR........", ".RLLR.......", ".RLLRMMMMMM.", "..RRMMMMMMM."],
  },
  fuerza: {
    name: "Entreno de fuerza",
    category: "moverse",
    effect: { animo: 10, energia: -15 },
    say: "Fuerza con buena técnica: ¡ahora mi cuerpo responde genial!",
    show: "do",
    activity: "workout",
    palette: { K: "#6B5E66", G: "#B8A9B2" },
    sprite: [".KK......KK.", ".KK......KK.", ".KKGGGGGGKK.", ".KK......KK.", ".KK......KK."],
  },
  cardio: {
    name: "Cardio intenso",
    category: "moverse",
    effect: { animo: 15, energia: -25 },
    say: "¡Series a tope! Hoy tengo energía para darlo todo.",
    show: "do",
    activity: "workout",
    palette: { H: "#E8546A", P: "#3A2A38" },
    sprite: ["..HH..HH....", ".HHHHHHHH...", ".HHHHHHHH...", "PPPHPPHPPPPP", "..HHHHHH....", "...HHHH.....", "....HH......"],
  },
  bailar: {
    name: "Bailar",
    category: "moverse",
    effect: { animo: 20, energia: -10 },
    say: "¡Música y a bailar! Moverme con ganas me sienta genial.",
    show: "do",
    activity: "dance",
    palette: { B: "#3A2A38", C: "#F28FB3" },
    sprite: ["....BBBB....", "...B....B...", "..B......B..", "..B......B..", ".CC......CC.", ".CC......CC.", ".CC......CC."],
  },

  // --------------------------------------------------------- mente y descanso
  dormir: {
    name: "Dormir bien",
    category: "mente",
    effect: { energia: 45 },
    say: "A dormir un ratito… Descansar es lo que más energía me da.",
    show: "do",
    palette: { W: "#C9D4F2", B: "#8E9BD8", Z: "#6E7FC8" },
    sprite: ["........ZZ..", ".........Z..", "........ZZ..", "............", "..WWWWWWW...", ".WWWWWWWWW..", ".WBBBBBBBW..", ".WWWWWWWWW..", "..WWWWWWW..."],
  },
  diario: {
    name: "Escribir en el diario",
    category: "mente",
    effect: { animo: 15 },
    say: "Escribir lo que siento me ayuda a soltarlo.",
    show: "hold",
    palette: { B: "#8E7CC3", W: "#FFFFFF", P: "#F6A9BB" },
    sprite: ["..BBBBBBB...", "..BWWWWWB...", "..BWBBBWB...", "..BWWWWWB...", "..BWBBBWB...", "..BWWWWWB...", "..BBBBBBB...", "..PPPPPPP..."],
  },
  amiga: {
    name: "Hablar con una amiga",
    category: "mente",
    effect: { animo: 20 },
    say: "Hablar con alguien de confianza me quita un peso de encima.",
    show: "hold",
    palette: { K: "#3A2A38", S: "#F6A9BB", H: "#E8546A" },
    sprite: ["......HH.HH.", "......HHHHH.", ".......HHH..", "..KKKK..H...", "..KSSK......", "..KSSK......", "..KSSK......", "..KKKK......"],
  },
  respirar: {
    name: "Respirar despacio",
    category: "mente",
    effect: { animo: 10, confort: 10 },
    say: "Respirar despacio unos minutos me baja la ansiedad.",
    show: "do",
    activity: "breathe",
    palette: { A: "#8FD4A3" },
    sprite: ["..AAAAAA....", ".A......A...", "........A...", "..AAAAAA....", "............", ".AAAAAAAAA..", "..........A.", ".....AAAAA.."],
  },
  desconectar: {
    name: "Dejar el móvil",
    category: "mente",
    effect: { energia: 10, animo: 5 },
    say: "Sin pantallas un rato antes de dormir, descanso mucho mejor.",
    show: "do",
    palette: { M: "#8E9BD8", K: "#3A2A38", D: "#6B5E66" },
    sprite: ["........MM..", ".......M....", "........MM..", "..KKKK......", "..KDDK......", "..KDDK......", "..KDDK......", "..KKKK......"],
  },
}

/** Cómo es de base al tocarla en cada estación */
export type Temperament = "grumpy" | "soft" | "sleepy" | "happy" | "party"

/** Cómo se siente ahora, según sus necesidades */
export type Mood = "feliz" | "bien" | "regular" | "hambrienta" | "cansada" | "triste" | "incomoda" | "dormida"

export interface PhaseCare {
  /** Cómo está al empezar la estación: lo habitual en esa fase */
  start: Record<Stat, number>
  /** Hasta dónde puede llegar en esta fase, aunque la cuides mucho */
  cap: Record<Stat, number>
  /** Cuánto baja cada necesidad por hora */
  decay: Record<Stat, number>
  /** Lo que mejor le sienta en esta estación: hace más efecto */
  favorites: CareId[]
  /** Lo que en esta fase no le sienta bien, con lo que dice */
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
    start: { barriga: 60, energia: 35, animo: 50, confort: 35 },
    cap: { barriga: 100, energia: 75, animo: 90, confort: 90 },
    decay: { barriga: 5, energia: 7, animo: 5, confort: 7 },
    favorites: ["lentejas", "chocolate", "platano", "infusion", "bolsa", "manta", "masaje", "bano", "yoga", "dormir", "crema", "diario"],
    refuses: {
      cardio: "Hoy no: mi cuerpo pide moverse suave.",
      fuerza: "Hoy mejor algo suave. Las pesas, en unos días.",
      patatas: "Tanta sal me hincha más la tripa.",
    },
    temperament: "sleepy",
    hello: "Hoy voy despacito… ¿me ayudas a estar calentita?",
    happy: "Calentita y tranquila. Gracias por cuidarme.",
    mirror: "Tú también: calor en la tripa, comida con hierro y descanso sin culpa.",
    topic: "cuerpo",
    feels: "frio",
  },
  folicular: {
    start: { barriga: 65, energia: 70, animo: 75, confort: 70 },
    cap: { barriga: 100, energia: 100, animo: 100, confort: 100 },
    decay: { barriga: 6, energia: 4, animo: 3, confort: 4 },
    favorites: ["naranja", "ensalada", "agua", "fuerza", "paseo", "bailar", "amiga", "protector"],
    refuses: {},
    temperament: "happy",
    hello: "¡Han salido brotes nuevos! ¿Hacemos algo?",
    happy: "¡Llena de energía! ¿Qué probamos ahora?",
    mirror: "Aprovecha tú también: comida fresca, fuerza y un plan nuevo.",
    topic: "energia",
    feels: "calor",
  },
  ovulatoria: {
    start: { barriga: 65, energia: 90, animo: 85, confort: 60 },
    cap: { barriga: 100, energia: 100, animo: 100, confort: 100 },
    decay: { barriga: 7, energia: 3, animo: 3, confort: 7 },
    favorites: ["agua", "ensalada", "cardio", "bailar", "amiga", "protector", "limpieza"],
    refuses: {
      manta: "¿Una manta? ¡Con este calor!",
      bolsa: "¡Ni hablar, hace un calor horrible!",
    },
    temperament: "party",
    hello: "¡Hace un sol increíble! ¿Me traes agua fresquita?",
    happy: "¡Radiante! Hoy no hay quien me pare.",
    mirror: "Tú también: bebe agua, muévete con ganas y queda con tu gente.",
    topic: "emociones",
    feels: "calor",
  },
  lutea: {
    start: { barriga: 45, energia: 50, animo: 40, confort: 55 },
    cap: { barriga: 100, energia: 85, animo: 85, confort: 95 },
    decay: { barriga: 8, energia: 5, animo: 8, confort: 5 },
    favorites: ["chocolate", "frutos", "platano", "infusion", "manta", "bano", "limpieza", "paseo", "yoga", "diario", "respirar", "desconectar"],
    refuses: {
      cafe: "El café hoy me pone más nerviosa y me quita el sueño.",
      patatas: "Con tanta sal me hincho todavía más.",
      cardio: "¿Series a tope? Hoy mejor algo más tranquilo.",
    },
    temperament: "grumpy",
    hello: "Hoy estoy un poco de bajón… ¿me cuidas?",
    happy: "A gustito. Contigo así, se me pasa todo.",
    mirror: "Igual que Mochi, tú también te mereces algo calentito, un paseo y bajar la exigencia.",
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
  cansada: "Estoy agotada… ¿me dejas dormir un rato?",
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
