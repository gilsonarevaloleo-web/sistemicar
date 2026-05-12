export type ManualType = "espejo" | "deposito" | "alquimia" | "umbral" | "planificacion" | "proyector";

export interface ManualCheckItem {
  text: string;
  key: string;
}

export interface ManualSection {
  title: string;
  instruction: string;
  checklist: ManualCheckItem[];
}

export interface MasterManual {
  id: ManualType;
  title: string;
  subtitle: string;
  principle: string;
  icon: string;
  color: string;
  sections: ManualSection[];
  benefits: string[];
}

export interface ManualBenefits {
  id: ManualType;
  title: string;
  subtitle: string;
  color: string;
  transformation: string;
  benefits: string[];
  emotionalWin: string;
}

export const MASTER_MANUALS: Record<ManualType, MasterManual> = {
  espejo: {
    id: "espejo",
    title: "Manual del Espejo",
    subtitle: "El Arte de Ver",
    principle: "El Espejo no juzga, solo refleja.",
    icon: "Eye",
    color: "#A855F7",
    benefits: [
      "Reduce reacciones impulsivas que dañan relaciones",
      "Aumenta la auto-conciencia e inteligencia emocional",
      "Crea espacio entre estímulo y respuesta",
      "Previene que la presión emocional acumulada explote"
    ],
    sections: [
      {
        title: "PRESENCIA",
        instruction: "No describas lo que piensas, describe lo que siente tu cuerpo ahora.",
        checklist: [
          { key: "espejo_presencia_1", text: "Identifiqué sensaciones físicas específicas (tensión, calor, peso)" },
          { key: "espejo_presencia_2", text: "Evité interpretaciones mentales del momento" },
          { key: "espejo_presencia_3", text: "Describí el AHORA, no el antes ni el después" }
        ]
      },
      {
        title: "TENSIÓN",
        instruction: "No busques soluciones. Encuentra el punto exacto donde la emoción te aprieta.",
        checklist: [
          { key: "espejo_tension_1", text: "Localicé el punto exacto de la tensión en mi cuerpo" },
          { key: "espejo_tension_2", text: "Resistí la urgencia de resolver o escapar" },
          { key: "espejo_tension_3", text: "Nombré la emoción sin justificarla" }
        ]
      },
      {
        title: "RITMO",
        instruction: "Siente el pulso de la emoción. ¿Es rápido? ¿Es lento? No intentes cambiarlo, solo síguelo.",
        checklist: [
          { key: "espejo_ritmo_1", text: "Observé la velocidad natural de la emoción" },
          { key: "espejo_ritmo_2", text: "No intenté acelerar ni frenar el proceso" },
          { key: "espejo_ritmo_3", text: "Seguí el ritmo hasta que cambió solo" }
        ]
      },
      {
        title: "EXPANSIÓN",
        instruction: "Permite que la emoción ocupe toda la habitación. Si la dejas ser, se vuelve luz.",
        checklist: [
          { key: "espejo_expansion_1", text: "Dejé que la emoción se expandiera sin resistencia" },
          { key: "espejo_expansion_2", text: "No contraí mi cuerpo para contenerla" },
          { key: "espejo_expansion_3", text: "Observé cómo se transformó al darle espacio" }
        ]
      }
    ]
  },
  deposito: {
    id: "deposito",
    title: "Manual del Depósito",
    subtitle: "Auditoría de Capital",
    principle: "El pasado es un banco de datos, no un cementerio.",
    icon: "Database",
    color: "#3B82F6",
    benefits: [
      "Transforma experiencias pasadas en sabiduría accionable",
      "Construye confianza documentando logros reales",
      "Crea una base de datos personal para tomar decisiones",
      "Evita repetir los mismos errores"
    ],
    sections: [
      {
        title: "APRENDER",
        instruction: "Si no puedes resumirlo en una frase técnica, aún no lo has aprendido.",
        checklist: [
          { key: "deposito_aprender_1", text: "Resumí el aprendizaje en una frase técnica clara" },
          { key: "deposito_aprender_2", text: "Identifiqué el patrón que debo evitar o replicar" },
          { key: "deposito_aprender_3", text: "Extraje una regla aplicable a situaciones futuras" }
        ]
      },
      {
        title: "GESTIONAR",
        instruction: "Describe el orden que impusiste, no el problema que sufriste.",
        checklist: [
          { key: "deposito_gestionar_1", text: "Describí las acciones de control, no las quejas" },
          { key: "deposito_gestionar_2", text: "Enfoqué en lo que SÍ hice, no en lo que me pasó" },
          { key: "deposito_gestionar_3", text: "Mostré evidencia de gestión activa" }
        ]
      },
      {
        title: "EJECUTAR",
        instruction: "Detalla la mecánica: '¿Qué hiciste primero? ¿Qué hiciste después?'",
        checklist: [
          { key: "deposito_ejecutar_1", text: "Describí la secuencia de pasos en orden" },
          { key: "deposito_ejecutar_2", text: "Incluí detalles de la mecánica de ejecución" },
          { key: "deposito_ejecutar_3", text: "Documenté decisiones tomadas en el proceso" }
        ]
      },
      {
        title: "RESOLUCIÓN",
        instruction: "¿Cuál fue el valor final entregado? Mide el resultado en hechos, no en intenciones.",
        checklist: [
          { key: "deposito_resolucion_1", text: "Definí el resultado en términos medibles" },
          { key: "deposito_resolucion_2", text: "Evité hablar de intenciones, solo de hechos" },
          { key: "deposito_resolucion_3", text: "Cuantifiqué el valor entregado" }
        ]
      }
    ]
  },
  alquimia: {
    id: "alquimia",
    title: "Manual de Alquimia",
    subtitle: "De Plomo a Oro",
    principle: "Tu dolor es la materia prima de tu autoridad.",
    icon: "Sparkles",
    color: "#D4AF37",
    benefits: [
      "Convierte el sufrimiento en autoridad personal y sabiduría",
      "Desarrolla anti-fragilidad: crece más fuerte bajo presión",
      "Crea una biblioteca de algoritmos de crisis reutilizables",
      "Construye un carácter inquebrantable a través de la adversidad"
    ],
    sections: [
      {
        title: "OBSERVACIÓN",
        instruction: "Identifica el momento exacto donde el ego tomó el mando.",
        checklist: [
          { key: "alquimia_observacion_1", text: "Identifiqué el momento preciso del quiebre" },
          { key: "alquimia_observacion_2", text: "Describí la situación sin adornos ni excusas" },
          { key: "alquimia_observacion_3", text: "Nombré la reacción del ego (defensa, ataque, huida)" }
        ]
      },
      {
        title: "CRISIS",
        instruction: "Describe el punto donde la vieja identidad ya no funcionó.",
        checklist: [
          { key: "alquimia_crisis_1", text: "Identifiqué la resistencia REAL (interna o externa)" },
          { key: "alquimia_crisis_2", text: "Describí qué parte de mi vieja identidad colapsó" },
          { key: "alquimia_crisis_3", text: "No minimicé ni dramaticé la crisis" }
        ]
      },
      {
        title: "LECCIÓN",
        instruction: "Extrae el algoritmo de salida. ¿Qué llave abrió la celda?",
        checklist: [
          { key: "alquimia_leccion_1", text: "Extraje pasos ACCIONABLES y concretos" },
          { key: "alquimia_leccion_2", text: "Definí el 'algoritmo de salida' replicable" },
          { key: "alquimia_leccion_3", text: "La lección es aplicable a situaciones similares" }
        ]
      },
      {
        title: "MAESTRÍA",
        instruction: "Declara cómo esta lección se convierte en un pilar de tu nuevo carácter.",
        checklist: [
          { key: "alquimia_maestria_1", text: "Declaré el nuevo pilar de carácter" },
          { key: "alquimia_maestria_2", text: "Definí cómo aplicaré esto en el futuro" },
          { key: "alquimia_maestria_3", text: "La maestría es una transformación, no solo información" }
        ]
      }
    ]
  },
  umbral: {
    id: "umbral",
    title: "Manual del Umbral",
    subtitle: "Puente Hemisférico",
    principle: "El límite es la puerta; el miedo es el portero.",
    icon: "Fingerprint",
    color: "#7C3AED",
    benefits: [
      "Desconecta patrones neuronales limitantes que te frenan",
      "Instala nuevos arquetipos empoderadores en tu identidad",
      "Usa técnicas basadas en EMDR para cambio rápido",
      "Expande tu zona de confort permanentemente"
    ],
    sections: [
      {
        title: "LADO IZQUIERDO (Sombra)",
        instruction: "Sé despiadado con la sombra. Dale un nombre que te haga reír o te dé asco, pero sepárate de ella.",
        checklist: [
          { key: "umbral_izquierdo_1", text: "Di un nombre específico y memorable a la sombra" },
          { key: "umbral_izquierdo_2", text: "Describí su lenguaje (qué dice cuando aparece)" },
          { key: "umbral_izquierdo_3", text: "Identifiqué en qué circunstancias se activa" },
          { key: "umbral_izquierdo_4", text: "Me separé emocionalmente de ella (no soy yo)" }
        ]
      },
      {
        title: "MOVIMIENTO OCULAR",
        instruction: "Mantén la cabeza fija. Deja que tus ojos 'corten' el cable neurológico del límite.",
        checklist: [
          { key: "umbral_ocular_1", text: "Mantuve la cabeza fija durante el ejercicio" },
          { key: "umbral_ocular_2", text: "Seguí el patrón de movimiento ocular completo" },
          { key: "umbral_ocular_3", text: "Sentí el 'corte' o liberación del patrón" }
        ]
      },
      {
        title: "LADO DERECHO (Poder)",
        instruction: "No pidas permiso. Vístete con el traje del Arquetipo de Poder con total soberanía.",
        checklist: [
          { key: "umbral_derecho_1", text: "Nombré al Arquetipo de Poder claramente" },
          { key: "umbral_derecho_2", text: "Describí su lenguaje (qué dice cuando actúa)" },
          { key: "umbral_derecho_3", text: "Definí la acción que toma en vez de la sombra" },
          { key: "umbral_derecho_4", text: "Lo declaré con soberanía, sin pedir permiso" }
        ]
      }
    ]
  },
  planificacion: {
    id: "planificacion",
    title: "Manual de Planificación",
    subtitle: "El Vehículo",
    principle: "La planificación es una guerra contra la entropía.",
    icon: "Target",
    color: "#EF4444",
    benefits: [
      "Elimina la procrastinación dividiendo tareas en pasos pequeños",
      "Anticipa obstáculos antes de que te descarrilen",
      "Crea momentum sostenible a través de enfoque claro",
      "Construye disciplina sin depender de la motivación"
    ],
    sections: [
      {
        title: "ENFOQUE",
        instruction: "Memoriza el objetivo. Si no puedes repetirlo 3 veces sin mirar, no es tu objetivo.",
        checklist: [
          { key: "planificacion_enfoque_1", text: "El objetivo es claro y memorizable" },
          { key: "planificacion_enfoque_2", text: "Puedo repetirlo sin mirar el papel" },
          { key: "planificacion_enfoque_3", text: "Está definido en términos de resultado, no de actividad" }
        ]
      },
      {
        title: "CONFLICTO",
        instruction: "Anticípate. ¿Qué va a intentar detenerte (pereza, teléfono, miedo)? Ponle una trampa.",
        checklist: [
          { key: "planificacion_conflicto_1", text: "Identifiqué los obstáculos específicos" },
          { key: "planificacion_conflicto_2", text: "Definí una trampa/contramedida para cada uno" },
          { key: "planificacion_conflicto_3", text: "No subestimé la resistencia interna" }
        ]
      },
      {
        title: "PASOS",
        instruction: "Divide hasta que la tarea parezca ridículamente fácil.",
        checklist: [
          { key: "planificacion_pasos_1", text: "Dividí la tarea en pasos pequeños y claros" },
          { key: "planificacion_pasos_2", text: "Cada paso es ejecutable en 5-15 minutos" },
          { key: "planificacion_pasos_3", text: "La secuencia tiene sentido lógico" }
        ]
      },
      {
        title: "ALCANCE",
        instruction: "Define el tiempo de resistencia total. No te detengas hasta que el cronómetro llegue a cero.",
        checklist: [
          { key: "planificacion_alcance_1", text: "Definí un tiempo límite específico" },
          { key: "planificacion_alcance_2", text: "El alcance es realista pero desafiante" },
          { key: "planificacion_alcance_3", text: "Me comprometí a no parar hasta el final" }
        ]
      }
    ]
  },
  proyector: {
    id: "proyector",
    title: "Manual del Proyector",
    subtitle: "Arquitectura de Realidad REC",
    principle: "El futuro no se predice, se colapsa.",
    icon: "Rocket",
    color: "#6366F1",
    benefits: [
      "Diseña tu futuro deseado con precisión de ingeniero",
      "Estructura el camino con arquitectura clara",
      "Identifica y moviliza los recursos necesarios",
      "Colapsa la realidad proyectada en fecha específica"
    ],
    sections: [
      {
        title: "VISIÓN",
        instruction: "Describe el evento futuro como si ya hubiera ocurrido. Usa tiempo pasado.",
        checklist: [
          { key: "proyector_vision_1", text: "Escribí el evento en tiempo pasado" },
          { key: "proyector_vision_2", text: "Incluí detalles sensoriales (qué vi, oí, sentí)" },
          { key: "proyector_vision_3", text: "El evento es específico, no vago" }
        ]
      },
      {
        title: "ARQUITECTURA",
        instruction: "Diseña la estructura del camino. ¿Cuáles son las fases y etapas para llegar?",
        checklist: [
          { key: "proyector_arquitectura_1", text: "Definí las fases principales del proyecto" },
          { key: "proyector_arquitectura_2", text: "Cada fase tiene entregables claros" },
          { key: "proyector_arquitectura_3", text: "Identifiqué dependencias entre fases" }
        ]
      },
      {
        title: "RECURSO",
        instruction: "Identifica los recursos necesarios: tiempo, dinero, personas, habilidades.",
        checklist: [
          { key: "proyector_recurso_1", text: "Listé los recursos de tiempo necesarios" },
          { key: "proyector_recurso_2", text: "Identifiqué recursos financieros o materiales" },
          { key: "proyector_recurso_3", text: "Nombré personas o habilidades que necesito" }
        ]
      },
      {
        title: "FECHA COLAPSO",
        instruction: "Declara la fecha en que el evento 'colapsa' de posibilidad a realidad.",
        checklist: [
          { key: "proyector_fechacolapso_1", text: "Definí una fecha específica de colapso" },
          { key: "proyector_fechacolapso_2", text: "La fecha es realista pero ambiciosa" },
          { key: "proyector_fechacolapso_3", text: "Me comprometí públicamente con la fecha" }
        ]
      }
    ]
  }
};

export function getManualByType(type: ManualType): MasterManual {
  return MASTER_MANUALS[type];
}

export function getAllManuals(): MasterManual[] {
  return Object.values(MASTER_MANUALS);
}
