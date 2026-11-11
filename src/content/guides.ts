// Guía ampliada de cada bloque por fase: qué suele pasar, por qué y qué hacer.
// Orientación general, nunca diagnóstico. Cada cuerpo es distinto.

import type { Phase } from "../lib/cycle.js"
import type { BlockId } from "./phases.js"

export interface BlockGuide {
  /** Una línea: cómo suele estar este aspecto en la fase */
  headline: string
  /** Por qué pasa, en pocas frases */
  why: string
  /** Consejos concretos: una idea corta y cómo llevarla a la práctica */
  tips: { title: string; text: string }[]
  /** Cuándo conviene prestar atención o consultar */
  watch?: string
}

export const BLOCK_GUIDES: Record<Phase, Record<BlockId, BlockGuide>> = {
  menstrual: {
    emociones: {
      headline: "Más hacia dentro y con menos ganas de ruido",
      why: "Con los estrógenos y la progesterona en su punto más bajo, mucha gente se nota más introspectiva. Para otras personas llega una sensación de alivio tras los días previos a la regla.",
      tips: [
        {
          title: "Agenda con huecos",
          text: "Deja libre lo que puedas mover y no te comprometas a planes que te den pereza solo de pensarlos.",
        },
        {
          title: "Saca lo que llevas dentro",
          text: "Cinco minutos escribiendo lo que te ronda, sin corregir nada, ayudan a ordenar la cabeza.",
        },
        {
          title: "Un plan de mínimos",
          text: "Elige una sola cosa importante para hoy. Si la haces, el día ya cuenta.",
        },
      ],
    },
    energia: {
      headline: "La batería más baja del ciclo",
      why: "Las hormonas están bajas y el cuerpo está ocupado con la regla. El cansancio suele ser mayor los dos primeros días y va mejorando después.",
      tips: [
        {
          title: "Duerme un poco más",
          text: "Adelantar media hora la hora de acostarte suele notarse más que cualquier café.",
        },
        {
          title: "Lo difícil, para después",
          text: "Si puedes, pasa las tareas más exigentes a la semana que viene, cuando llegue la primavera.",
        },
        {
          title: "Pausas de verdad",
          text: "Cada hora y media, levántate unos minutos, bebe agua y mira lejos de la pantalla.",
        },
      ],
      watch:
        "Si el cansancio es muy fuerte, con mareos o palidez, y se repite cada regla, coméntalo: puede ser falta de hierro.",
    },
    cuerpo: {
      headline: "Calambres, tripa sensible y algo de dolor lumbar",
      why: "El útero se contrae para desprender su capa interna. Esas contracciones, impulsadas por unas sustancias llamadas prostaglandinas, causan los calambres y a veces molestias en la espalda o en la digestión.",
      tips: [
        {
          title: "Calor local",
          text: "Una bolsa de agua caliente o una manta eléctrica sobre la tripa o la zona lumbar relaja el músculo y alivia el dolor.",
        },
        {
          title: "Postura que descansa",
          text: "Tumbada de lado con las rodillas encogidas, o boca arriba con un cojín bajo las rodillas, se suelta la tensión.",
        },
        {
          title: "Bebe agua",
          text: "Mantenerte hidratada ayuda con la hinchazón y con el dolor de cabeza que acompaña a algunas reglas.",
        },
      ],
      watch:
        "Consulta si el dolor no te deja hacer tu vida normal, si empapas una compresa o tampón cada hora o si la regla dura más de 7 días.",
    },
    piel: {
      headline: "Piel más seca, apagada o sensible",
      why: "Con los estrógenos bajos la piel retiene menos agua y su barrera está algo más frágil. El pelo puede verse con menos volumen.",
      tips: [
        {
          title: "Limpieza suave",
          text: "Usa un limpiador sin perfume y agua templada. Evita exfoliantes fuertes estos días.",
        },
        {
          title: "Hidratación extra",
          text: "Una crema algo más rica por la noche, o una capa extra de tu hidratante habitual, ayuda a recuperar la barrera.",
        },
        {
          title: "No toques los granitos",
          text: "Si quedan granitos de la semana anterior, suelen ir mejorando solos. Apretarlos deja marca.",
        },
      ],
    },
    comida: {
      headline: "Calor, hierro y comidas fáciles",
      why: "Con el sangrado se pierde hierro, y el cuerpo agradece platos que reconforten y se digieran sin esfuerzo.",
      tips: [
        {
          title: "Hierro con vitamina C",
          text: "Lentejas, garbanzos, espinacas o carne, acompañados de naranja, kiwi o pimiento para que el hierro se absorba mejor.",
        },
        {
          title: "Platos calientes",
          text: "Caldos, cremas de verdura o un guiso de legumbres. Puedes hacer de más y tener comida para dos días.",
        },
        {
          title: "Magnesio a mano",
          text: "Frutos secos, plátano o un par de onzas de chocolate negro son buenos aliados para los calambres.",
        },
      ],
    },
    movimiento: {
      headline: "Moverte poco y con suavidad",
      why: "El movimiento suave mejora la circulación en la zona pélvica y puede aliviar los calambres, pero el cuerpo pide menos intensidad.",
      tips: [
        {
          title: "Paseo de 20 minutos",
          text: "Caminar a ritmo tranquilo, mejor al aire libre, suele ayudar con el dolor y el ánimo.",
        },
        {
          title: "Movilidad de cadera",
          text: "Postura del niño, gato y vaca, y círculos de cadera: diez minutos para soltar la zona lumbar.",
        },
        {
          title: "Si entrenas, más suave",
          text: "Baja peso o ritmo y alarga el calentamiento. Descansar también es parte del entrenamiento.",
        },
      ],
    },
  },
  folicular: {
    emociones: {
      headline: "Más ganas, curiosidad y optimismo",
      why: "Los estrógenos van subiendo día a día. Se relacionan con más motivación, mejor humor y más facilidad para aprender cosas nuevas.",
      tips: [
        {
          title: "Empieza algo",
          text: "Es buen momento para arrancar ese proyecto o hábito que tenías pendiente. Empieza pequeño para que dure.",
        },
        {
          title: "Planifica el mes",
          text: "Con la cabeza más despejada, organiza las próximas semanas teniendo en cuenta que el otoño llegará.",
        },
        {
          title: "Di que sí a lo nuevo",
          text: "Un sitio nuevo, una clase, una persona. Ahora suele apetecer y costar menos.",
        },
      ],
    },
    energia: {
      headline: "La energía va subiendo",
      why: "Al terminar la regla y subir los estrógenos, la energía y la concentración suelen mejorar poco a poco hasta la ovulación.",
      tips: [
        {
          title: "Tareas de foco",
          text: "Reserva las mañanas para lo que pide concentración: estudiar, escribir, resolver problemas.",
        },
        {
          title: "Sin pasarte",
          text: "Tener energía no significa llenar la agenda. Deja algún hueco libre cada día.",
        },
        {
          title: "Buenos horarios",
          text: "Aprovecha que suele dormirse mejor para fijar una hora de acostarte que puedas mantener todo el ciclo.",
        },
      ],
    },
    cuerpo: {
      headline: "Cuerpo más ligero y con menos molestias",
      why: "Pasada la regla desaparecen los calambres y la hinchazón. El útero empieza a reconstruir su capa interna y un óvulo madura en el ovario.",
      tips: [
        {
          title: "Escucha cómo te sientes",
          text: "Fíjate en cómo duermes, cómo te mueves y cómo digieres. Te servirá para comparar con otras fases.",
        },
        {
          title: "Observa el flujo",
          text: "Suele ser escaso al principio y volverse más húmedo y elástico al acercarse la ovulación. Es lo normal.",
        },
        {
          title: "Revisiones",
          text: "Si tienes pendiente una revisión ginecológica o una citología, estos días suelen ser cómodos para hacerla.",
        },
      ],
    },
    piel: {
      headline: "Piel luminosa y menos reactiva",
      why: "Los estrógenos favorecen la hidratación y el colágeno, y suele haber menos grasa. Es una de las mejores fases para la piel.",
      tips: [
        {
          title: "Prueba productos",
          text: "Si quieres introducir algo nuevo, como un sérum o un exfoliante suave, ahora la piel suele tolerarlo mejor.",
        },
        {
          title: "Exfolia con calma",
          text: "Una o dos veces por semana basta. Más no es mejor.",
        },
        {
          title: "Protector solar",
          text: "Todos los días, también en invierno. Es lo que más ayuda a la piel a largo plazo.",
        },
      ],
    },
    comida: {
      headline: "Fresco, variado y con fibra",
      why: "Con más energía y una digestión más ligera, apetecen platos frescos. La fibra y los fermentados cuidan la flora intestinal.",
      tips: [
        {
          title: "Ensaladas completas",
          text: "Verdura, una proteína (huevo, legumbre, pescado, tofu) y un cereal integral. Así sacia de verdad.",
        },
        {
          title: "Fermentados",
          text: "Yogur natural, kéfir o chucrut ayudan a la digestión. Un poco al día es suficiente.",
        },
        {
          title: "Cocina para la semana",
          text: "Con ganas de hacer cosas, prepara un par de bases, como legumbres cocidas o arroz, para cuando lleguen días más cansados.",
        },
      ],
    },
    movimiento: {
      headline: "Buen momento para retos y fuerza",
      why: "Con los estrógenos subiendo, muchas personas se recuperan mejor y notan más fuerza y ganas de entrenar.",
      tips: [
        {
          title: "Sube poco a poco",
          text: "Añade algo de peso, una serie o unos minutos más. Pequeños pasos semana a semana.",
        },
        {
          title: "Aprende algo",
          text: "Una técnica nueva, un deporte que te da curiosidad o una clase distinta. Ahora cuesta menos coger el ritmo.",
        },
        {
          title: "Técnica primero",
          text: "Antes de subir cargas, asegúrate de que el movimiento sale limpio. Te evitará lesiones más adelante.",
        },
      ],
    },
  },
  ovulatoria: {
    emociones: {
      headline: "Más seguridad y ganas de gente",
      why: "Alrededor de la ovulación los estrógenos llegan a su pico y sube algo la testosterona. Es habitual sentirse más segura, sociable y con más deseo sexual.",
      tips: [
        {
          title: "Conversaciones importantes",
          text: "Si tienes que pedir algo, presentar una idea o aclarar un tema, estos días suele costar menos.",
        },
        {
          title: "Queda con gente",
          text: "Aprovecha las ganas de compañía para ver a quien echas de menos.",
        },
        {
          title: "Sin sobrecargarte",
          text: "Decir que sí a todo ahora puede pasarte factura en el otoño. Elige los planes que de verdad te apetecen.",
        },
      ],
    },
    energia: {
      headline: "El pico de energía del ciclo",
      why: "Suele ser el momento de más energía física y mental. Tras la ovulación empieza a subir la progesterona y la energía se estabiliza.",
      tips: [
        {
          title: "Lo más exigente, ahora",
          text: "Un examen, una entrevista o un entreno duro encajan bien en estos días.",
        },
        {
          title: "Recarga igual",
          text: "Aunque no te notes cansada, mantén tus horas de sueño. El cuerpo las necesita igual.",
        },
        {
          title: "Bebe más",
          text: "Con más actividad y la temperatura algo más alta tras ovular, se agradece beber agua a lo largo del día.",
        },
      ],
    },
    cuerpo: {
      headline: "Flujo distinto y, a veces, un pinchazo",
      why: "El ovario libera el óvulo. Antes de eso el flujo se vuelve transparente y elástico, como clara de huevo, y algunas personas notan un dolor leve a un lado de la tripa.",
      tips: [
        {
          title: "Reconoce las señales",
          text: "El flujo elástico y el pinchazo lateral son normales. Apuntarlos te ayuda a conocer tu ciclo.",
        },
        {
          title: "Calor si molesta",
          text: "Si el pinchazo molesta, el calor local y descansar un rato suelen bastar.",
        },
        {
          title: "No es un anticonceptivo",
          text: "Esta app no sirve para evitar ni buscar un embarazo: las fechas son estimaciones.",
        },
      ],
      watch: "Consulta si el dolor al ovular es fuerte, dura más de un par de días o viene con fiebre.",
    },
    piel: {
      headline: "Piel en su mejor momento, quizá algo más grasa",
      why: "El pico de estrógenos da luminosidad, pero la subida de testosterona puede aumentar un poco la grasa en algunas personas.",
      tips: [
        {
          title: "Limpieza por la noche",
          text: "Limpia la cara cada noche, sobre todo si llevas maquillaje o protector solar.",
        },
        {
          title: "Texturas ligeras",
          text: "Si notas más brillo, cambia a una crema en gel o una fórmula más ligera.",
        },
        {
          title: "Pelo con brillo",
          text: "Suele verse sano. Si vas a estar al sol, protege también el cuero cabelludo y las puntas.",
        },
      ],
    },
    comida: {
      headline: "Ligero, de colores y con proteína",
      why: "Con más actividad, el cuerpo necesita buena hidratación y proteína para recuperarse. Suele apetecer comer más ligero.",
      tips: [
        {
          title: "Plato de colores",
          text: "Cuantos más colores de verdura y fruta, más variedad de vitaminas y antioxidantes.",
        },
        {
          title: "Proteína en cada comida",
          text: "Pescado, huevos, legumbres, yogur o tofu ayudan a recuperarte de los entrenos.",
        },
        {
          title: "Grasas buenas",
          text: "Aceite de oliva, aguacate o frutos secos. Dan saciedad y cuidan la piel.",
        },
      ],
    },
    movimiento: {
      headline: "Hora de los entrenos intensos",
      why: "Con la energía en su punto más alto, el cuerpo suele rendir mejor en esfuerzos fuertes y rápidos.",
      tips: [
        {
          title: "Intervalos o carrera",
          text: "Si te apetece, prueba series cortas e intensas o un entreno más largo de lo habitual.",
        },
        {
          title: "En grupo",
          text: "Una clase colectiva o un partido aprovechan tu lado más social.",
        },
        {
          title: "Calienta bien",
          text: "Algunos estudios sugieren que las articulaciones están algo más laxas estos días. Calienta y cuida la técnica en saltos y cambios de dirección.",
        },
      ],
    },
  },
  lutea: {
    emociones: {
      headline: "Más sensibilidad, sobre todo al final",
      why: "Tras la ovulación sube la progesterona y, al final de la fase, bajan las dos hormonas. Ese descenso puede traer irritabilidad, tristeza o ansiedad: lo que se conoce como síntomas premenstruales.",
      tips: [
        {
          title: "Baja la exigencia",
          text: "No es exagerar. Recorta lo que no sea imprescindible y avisa a tu gente si necesitas espacio.",
        },
        {
          title: "Cierra en vez de abrir",
          text: "Es buen momento para terminar, ordenar y revisar, más que para empezar proyectos nuevos.",
        },
        {
          title: "Luz y aire",
          text: "Un rato al aire libre por la mañana y moverte un poco suelen mejorar el ánimo.",
        },
      ],
      watch:
        "Si los cambios de ánimo antes de la regla son tan fuertes que afectan a tu vida, tu trabajo o tus relaciones, consúltalo. Tiene tratamiento.",
    },
    energia: {
      headline: "La energía baja poco a poco",
      why: "La progesterona tiene un efecto más calmante y sube un poco la temperatura del cuerpo. Es habitual notar más cansancio y dormir peor al final de la fase.",
      tips: [
        {
          title: "Reparte el esfuerzo",
          text: "Pon lo más exigente al principio de la fase y deja los últimos días más tranquilos.",
        },
        {
          title: "Rutina de sueño",
          text: "Mismas horas cada día, habitación fresca y pantallas fuera un rato antes de dormir.",
        },
        {
          title: "Contra el bajón de la tarde",
          text: "Come a horas regulares y da un paseo corto en lugar de otro café.",
        },
      ],
    },
    cuerpo: {
      headline: "Hinchazón, pecho sensible y antojos",
      why: "La progesterona hace que se retengan líquidos y que la digestión vaya más lenta. Por eso es habitual la hinchazón, la tensión en el pecho y más hambre.",
      tips: [
        {
          title: "Menos sal",
          text: "Reducir los ultraprocesados y la sal añadida ayuda a retener menos líquidos.",
        },
        {
          title: "Sujetador cómodo",
          text: "Si notas el pecho sensible, uno sin aros y que sujete bien alivia bastante.",
        },
        {
          title: "Muévete un poco",
          text: "Caminar ayuda a la digestión y a la sensación de hinchazón.",
        },
      ],
    },
    piel: {
      headline: "Más grasa y granitos en la barbilla",
      why: "La progesterona y la testosterona estimulan las glándulas sebáceas. Es habitual que salgan granitos en la barbilla y la mandíbula en los días previos a la regla.",
      tips: [
        {
          title: "Limpieza mañana y noche",
          text: "Con un limpiador suave. Frotar fuerte o usar productos agresivos irrita y empeora la grasa.",
        },
        {
          title: "Productos no comedogénicos",
          text: "Busca cremas y maquillaje que no obstruyan los poros, y cambia la funda de la almohada a menudo.",
        },
        {
          title: "Paciencia con el pelo",
          text: "Es normal que se ensucie antes. Lavarlo más a menudo con un champú suave está bien.",
        },
      ],
      watch:
        "Si los granitos son grandes, duelen o dejan marca cada ciclo, un dermatólogo puede ayudarte.",
    },
    comida: {
      headline: "Más hambre, y es normal",
      why: "En esta fase el cuerpo gasta algo más de energía y es habitual tener más apetito y antojos de dulce.",
      tips: [
        {
          title: "Comidas que sacian",
          text: "Carbohidratos integrales, proteína y grasas buenas en cada comida evitan los picos de hambre.",
        },
        {
          title: "Magnesio",
          text: "Legumbres, frutos secos, plátano, avena o chocolate negro. Pueden ayudar con la irritabilidad y los calambres.",
        },
        {
          title: "Menos café y sal",
          text: "Reducirlos un poco suele aliviar la hinchazón, la tensión en el pecho y ayudarte a dormir.",
        },
      ],
    },
    movimiento: {
      headline: "Constancia más que intensidad",
      why: "Al principio de la fase aún se rinde bien. Según se acerca la regla, el cuerpo suele preferir esfuerzos moderados.",
      tips: [
        {
          title: "Fuerza moderada",
          text: "Mantén tus entrenos con cargas medias y más descanso entre series.",
        },
        {
          title: "Pilates y yoga",
          text: "Encajan muy bien para el cuerpo y para bajar el estrés.",
        },
        {
          title: "Un paseo cuenta",
          text: "Si estás cansada, 20 minutos caminando también suman y suelen mejorar el ánimo.",
        },
      ],
    },
  },
}
