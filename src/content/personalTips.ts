// Consejos que se muestran cuando el registro diario activa una regla (src/lib/personalize.ts).
// Orientación general, nunca diagnóstico. Si una fase tiene textos propios se usan esos.

import type { Phase } from "../lib/cycle.js"
import type { BlockId } from "./phases.js"

export interface TipSet {
  block: BlockId
  all: string[]
  byPhase?: Partial<Record<Phase, string[]>>
}

export type RuleId =
  | "energia_movimiento"
  | "energia_comida"
  | "animo_bajo"
  | "dolor_tripa"
  | "dolor_cabeza"
  | "hinchazon"
  | "insomnio"
  | "antojos"

export const PERSONAL_TIPS: Record<RuleId, TipSet> = {
  energia_movimiento: {
    block: "movimiento",
    all: ["Llevas unos días con poca energía. Hoy vale con un paseo corto o unos estiramientos."],
    byPhase: {
      menstrual: ["Llevas unos días con poca energía, algo normal ahora. Descansar también cuenta: si te mueves, que sea suave."],
      folicular: ["Tu energía aún no ha subido estos días. No hace falta forzar: sube la intensidad solo cuando el cuerpo te lo pida."],
      ovulatoria: ["Aunque esta fase suele traer energía, tú llevas unos días floja. Hazle caso a tu cuerpo y elige algo tranquilo."],
      lutea: ["Llevas unos días cansada y en esta fase es muy habitual. Cambia el entreno intenso por caminar, yoga o fuerza suave."],
    },
  },
  energia_comida: {
    block: "comida",
    all: ["Con poca energía ayuda no saltarse comidas e incluir proteína y carbohidratos integrales."],
    byPhase: {
      menstrual: ["Si llevas días cansada, prioriza alimentos con hierro y acompáñalos de vitamina C."],
      lutea: ["Para el cansancio de estos días, reparte bien las comidas: avena, legumbres y frutos secos dan energía estable."],
    },
  },
  animo_bajo: {
    block: "emociones",
    all: ["Llevas unos días con el ánimo más bajo. Baja la exigencia y busca un rato para ti: hablar con alguien o salir a que te dé el aire puede ayudar."],
    byPhase: {
      lutea: ["Te estás notando más sensible y en esta fase es frecuente. No significa que algo vaya mal: date espacio y deja lo importante para cuando estés mejor."],
      menstrual: ["Estos días están siendo más difíciles. Si puedes, quítate tareas y permítete hacer menos."],
    },
  },
  dolor_tripa: {
    block: "cuerpo",
    all: ["Para los calambres y el dolor lumbar suele ayudar el calor local, como una bolsa de agua caliente, y moverse con suavidad."],
  },
  dolor_cabeza: {
    block: "cuerpo",
    all: ["Si te duele la cabeza varios días, bebe agua, intenta dormir a horas regulares y descansa de pantallas cuando puedas."],
  },
  hinchazon: {
    block: "comida",
    all: ["Para la hinchazón puede ayudarte reducir un poco la sal y las bebidas con gas, y beber agua durante el día."],
  },
  insomnio: {
    block: "emociones",
    all: ["Si estás durmiendo mal, prueba a cenar más ligero, bajar la luz y dejar el móvil un rato antes de acostarte."],
  },
  antojos: {
    block: "comida",
    all: ["Los antojos son normales. Hacer comidas completas ayuda, y si te apetece dulce, disfruta de un poco sin culpa."],
  },
}
