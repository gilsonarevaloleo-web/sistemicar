/**
 * Identidad de categoría pública SISTEMICAR Planificación.
 * Una sola voz: checkout (/pagos), kit vendedores, onboarding y Jornada.
 * No somos planificador/calendario — somos motor de cierre consciente por capas.
 */
export const SISTEMICAR_CATEGORY = {
  name: "Motor de cierre consciente por capas",
  nameShort: "Cierre consciente por capas",
  oneLiner:
    "No es un calendario ni una lista: cierras el día midiendo presencia, entrada y producción.",
  notA:
    "No competimos con Notion ni Google Calendar — ellos almacenan; nosotros medimos cierres y decisiones.",
  puente:
    "Conquista sin decisiones es ilusión de progreso. La Escalera te lo muestra sin culpa — capa por capa.",
  elevator:
    "SISTEMICAR Jornada es un motor de cierre consciente por capas: presencia (anillo), entrada (disciplina) y producción (decisiones). No es una lista — es maduración medida. Elige el peldaño comercial que necesitas.",
} as const;

export const ESCALERA_CAPAS_PUBLIC = [
  {
    capa: 1,
    titulo: "Presencia",
    pregunta: "¿En qué se me va el tiempo?",
    metrica: "Anillo de conciencia",
    color: "#8B5CF6",
  },
  {
    capa: 2,
    titulo: "Entrada",
    pregunta: "¿Aparezco al trabajo consciente?",
    metrica: "Disciplina por segmento",
    color: "#D4AF37",
  },
  {
    capa: 3,
    titulo: "Producción",
    pregunta: "¿Convierto el tiempo en decisiones?",
    metrica: "Combustible de conciencia",
    color: "#A855F7",
  },
] as const;

export const CATEGORY_FOOTER =
  "Tres capas de desarrollo — ninguna sustituye a la otra. Los peldaños comerciales (Base, Operativo, Soberanía) profundizan el método.";
