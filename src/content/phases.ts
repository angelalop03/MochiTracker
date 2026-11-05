// Contenido base por fase. Sin dependencias: lo usan la web y el cron de avisos.
// Orientación general, nunca diagnóstico. Cada bloque tiene varias variantes para
// que los avisos diarios no se repitan siempre.

import type { Phase } from "../lib/cycle"

export type BlockId = "emociones" | "cuerpo" | "comida" | "movimiento"

export const BLOCKS: readonly { id: BlockId; title: string }[] = [
  { id: "emociones", title: "Emociones" },
  { id: "cuerpo", title: "Cuerpo" },
  { id: "comida", title: "Comida" },
  { id: "movimiento", title: "Movimiento" },
]

export interface PhaseContent {
  name: string
  season: string
  /** Lo que dice Mochi. Texto corto para la caja de diálogo */
  greetings: string[]
  /** Explicación sencilla de qué pasa en esta fase */
  summary: string
  blocks: Record<BlockId, string[]>
}

export const PHASE_CONTENT: Record<Phase, PhaseContent> = {
  menstrual: {
    name: "Menstrual",
    season: "Invierno",
    greetings: [
      "Hoy toca ir despacio. Una manta y algo caliente.",
      "En la isla nieva. Si te apetece parar, para.",
      "Hoy vale con lo justo. Lo demás puede esperar.",
    ],
    summary:
      "Empieza el ciclo. Las hormonas están en su punto más bajo y es habitual tener menos energía, sobre todo los primeros días.",
    blocks: {
      emociones: [
        "Puedes sentirte más introspectiva o con menos ganas de gente. Es normal: date permiso para bajar el ritmo y decir que no a lo que no sea urgente.",
        "Si estás más sensible, escribir un rato o hablar con alguien de confianza puede ayudarte a soltar lo que llevas dentro.",
        "A veces llega una sensación de alivio al empezar la regla. Si es tu caso, aprovéchala para ordenar ideas sin exigirte mucho.",
      ],
      cuerpo: [
        "Son habituales los calambres en la tripa, el dolor lumbar y el cansancio. El calor local, como una bolsa de agua caliente, suele aliviar.",
        "Puedes notar la tripa hinchada o dolor de cabeza. Descansar bien y beber agua ayuda a muchas personas.",
        "Los primeros días suelen ser los de más sangrado. Si el dolor te impide hacer tu vida normal, coméntalo con un profesional.",
      ],
      comida: [
        "Prioriza alimentos con hierro, como lentejas, garbanzos, espinacas o carne. Si los acompañas de vitamina C, como naranja o pimiento, se aprovechan mejor.",
        "Los platos calientes y fáciles de digerir sientan muy bien: caldos, cremas de verduras o un guiso de legumbres.",
        "Los frutos secos, el chocolate negro y las semillas aportan magnesio. Mantente hidratada con agua o infusiones.",
      ],
      movimiento: [
        "Moverte con suavidad puede aliviar los calambres: un paseo, estiramientos o yoga tranquilo. Si necesitas descansar, descansa.",
        "Hoy encaja una movilidad suave de 10 minutos para soltar la zona lumbar y las caderas.",
        "Si te apetece entrenar, baja la intensidad y escucha a tu cuerpo. No hay nada que compensar.",
      ],
    },
  },
  folicular: {
    name: "Folicular",
    season: "Primavera",
    greetings: [
      "Han salido brotes nuevos. ¿Qué te apetece empezar?",
      "La isla se despierta y tú igual. Buen día para arrancar cosas.",
      "Se nota otro aire. Aprovecha si tienes ganas.",
    ],
    summary:
      "Tras la regla, los estrógenos suben poco a poco. Mucha gente nota más energía, buen humor y ganas de planes.",
    blocks: {
      emociones: [
        "Puedes sentirte con más optimismo y curiosidad. Es buen momento para empezar proyectos o hacer planes.",
        "Si notas más claridad mental, aprovéchala para las tareas que llevas tiempo posponiendo.",
        "Suele apetecer más la gente y lo nuevo. Prueba algo distinto, aunque sea pequeño.",
      ],
      cuerpo: [
        "El cansancio de la regla suele ir desapareciendo y la energía sube día a día.",
        "Es frecuente dormir mejor y notar la piel más despejada, aunque cada cuerpo va a su ritmo.",
        "Puede que el flujo sea escaso estos días y que vaya cambiando según se acerca la ovulación. Es lo habitual.",
      ],
      comida: [
        "Es un buen momento para platos frescos y variados: ensaladas completas, verduras de temporada y proteína de calidad.",
        "Los alimentos fermentados, como el yogur o el kéfir, y la fibra de las verduras ayudan a tu digestión.",
        "Con más energía, cuida que tus comidas la acompañen: cereales integrales, huevos, legumbres y fruta.",
      ],
      movimiento: [
        "Tu cuerpo suele responder bien a retos: prueba a subir un poco la intensidad o a aprender algo nuevo.",
        "Encaja muy bien el entrenamiento de fuerza. Sube cargas poco a poco y con buena técnica.",
        "Es buen momento para probar esa clase que te da curiosidad: baile, escalada, natación…",
      ],
    },
  },
  ovulatoria: {
    name: "Ovulatoria",
    season: "Verano",
    greetings: [
      "Hace sol en la isla. Hoy Mochi no para quieto.",
      "Día de verano. Si te apetece gente, adelante.",
      "Mucha luz por aquí. Disfrútala a tu manera.",
    ],
    summary:
      "Alrededor de la ovulación los estrógenos llegan a su pico. Suele ser el momento de más energía y más ganas de relacionarse.",
    blocks: {
      emociones: [
        "Puedes sentirte con más seguridad y facilidad para hablar. Buen momento para conversaciones importantes o presentar ideas.",
        "Es habitual tener más ganas de gente y de planes. Disfrútalo sin llenar de más la agenda.",
        "Si te notas con más deseo sexual, también es algo común en estos días.",
      ],
      cuerpo: [
        "Algunas personas notan un pinchazo leve a un lado de la tripa al ovular. Suele durar poco.",
        "Puede aumentar el flujo y volverse más transparente y elástico, parecido a la clara de huevo.",
        "Es frecuente sentir el cuerpo más ligero y con energía. Puede subir un poco la temperatura corporal tras ovular.",
      ],
      comida: [
        "Los alimentos ricos en fibra, como verduras, fruta y cereales integrales, sientan bien estos días.",
        "Platos ligeros y de colores: ensaladas, pescado, frutas de temporada y grasas buenas como el aguacate o el aceite de oliva.",
        "Con más actividad, recuerda hidratarte bien e incluir proteína en cada comida.",
      ],
      movimiento: [
        "Si te apetece, es buen momento para los entrenos más intensos: intervalos, carrera o deportes de equipo.",
        "Aprovecha para hacer ejercicio con más gente. Una clase en grupo o un partido encajan muy bien.",
        "Calienta bien antes de los esfuerzos fuertes y disfruta de la energía sin pasarte.",
      ],
    },
  },
  lutea: {
    name: "Lútea",
    season: "Otoño",
    greetings: [
      "Caen las hojas. Toca recoger y bajar el ritmo.",
      "Mochi saca la bufanda. Cuídate un poco más estos días.",
      "Tarde de otoño en la isla. Hoy no hace falta correr.",
    ],
    summary:
      "Tras la ovulación sube la progesterona. La energía va bajando poco a poco y, al final de la fase, pueden aparecer síntomas premenstruales.",
    blocks: {
      emociones: [
        "Puedes notar más sensibilidad o irritabilidad, sobre todo al final. No es exagerar: date espacio y baja la exigencia.",
        "Es buen momento para cerrar tareas y ordenar, más que para empezar cosas nuevas.",
        "Si te notas con el ánimo bajo, un rato al aire libre y dormir bien suelen ayudar. Si te afecta mucho, habla con un profesional.",
      ],
      cuerpo: [
        "Son habituales la hinchazón, la tensión en el pecho y más cansancio. Suelen pasar al llegar la regla.",
        "Pueden aparecer granitos, dolor de cabeza o dormir peor en los días previos a la regla.",
        "Si retienes líquidos, moverte un poco y reducir la sal puede ayudarte.",
      ],
      comida: [
        "Si tienes más hambre, es normal. Comidas completas con carbohidratos integrales, proteína y grasas buenas ayudan a mantenerte saciada.",
        "Los alimentos con magnesio, como frutos secos, plátano, legumbres o chocolate negro, son buenos aliados.",
        "Reducir un poco la sal y la cafeína puede aliviar la hinchazón y ayudarte a dormir.",
      ],
      movimiento: [
        "Al principio de esta fase aún puedes entrenar con ganas. Según se acerque la regla, baja la intensidad.",
        "Encajan el pilates, el yoga, caminar o la fuerza con cargas moderadas.",
        "Si estás cansada, un paseo tranquilo cuenta. Moverte un poco suele mejorar el ánimo.",
      ],
    },
  },
}

/** Mismo día, mismo texto; día siguiente, otro. Sin azar, para poder repetirlo en el cron */
export function pickVariant<T>(variants: readonly T[], seed: number): T {
  return variants[Math.abs(seed) % variants.length]!
}

export const WHEN_TO_CONSULT = {
  title: "Cuándo consultar con un profesional",
  intro: "Esta app te orienta, pero no sustituye a un profesional sanitario. Pide cita si te pasa algo de esto:",
  items: [
    "Dolor muy fuerte que te impide hacer tu vida normal o no mejora con analgésicos habituales.",
    "Sangrado muy abundante: si empapas una compresa o tampón cada hora durante varias horas, o tienes coágulos grandes.",
    "Reglas que duran más de 7 días o sangrado entre reglas.",
    "Ciclos muy irregulares, de menos de 21 días o más de 35 de forma habitual.",
    "Tres meses o más sin regla sin estar embarazada, o un retraso con posibilidad de embarazo.",
    "Sangrado después de las relaciones sexuales o tras la menopausia.",
    "Mucho cansancio, mareos o palidez, que pueden indicar anemia.",
    "Cambios de ánimo tan fuertes antes de la regla que afectan a tu vida, tu trabajo o tus relaciones.",
  ],
  urgent:
    "Ve a urgencias si tienes un dolor intenso y repentino, fiebre alta con dolor en la tripa, desmayos o un sangrado que no para. Si tienes pensamientos de hacerte daño, llama al 024 (España) o al 112.",
}

export const DISCLAIMER =
  "El contenido es informativo y no sustituye a un profesional sanitario. Las fases son estimaciones."

export const CONTRACEPTION_NOTICE =
  "Esta app no sirve como método anticonceptivo ni para buscar un embarazo. Si usas anticonceptivos hormonales o estás embarazada, las fases estimadas no se aplican igual."
