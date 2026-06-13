import { JORNADA_MODULE } from "./jornadaBrand";

export type PlanificacionPlanProfile = "base" | "estudiante" | "produccion";

export type PrimerDiaCheckKey =
  | "segmento"
  | "vehiculo"
  | "cierre"
  | "desglosador"
  | "proyecto";

export type TutorialStep = {
  title: string;
  description: string;
  action?: string;
};

export const TUTORIAL_DONE_KEY = "sistemicar_planificacion_tutorial_done";
export const CHECKLIST_KEY_PREFIX = "sistemicar_planificacion_primer_dia_";

export function tutorialStorageKey(uid: string): string {
  return `${TUTORIAL_DONE_KEY}_${uid}`;
}

export function checklistStorageKey(uid: string): string {
  return `${CHECKLIST_KEY_PREFIX}${uid}`;
}

export function profileLabel(profile: PlanificacionPlanProfile): string {
  switch (profile) {
    case "produccion":
      return "Producción (Operativo)";
    case "estudiante":
      return "Estudiante (Soberanía del día)";
    default:
      return "Planificación Base";
  }
}

const STEPS_BASE: TutorialStep[] = [
  {
    title: `Bienvenido a ${JORNADA_MODULE.title}`,
    description:
      "Aquí no guardas listas infinitas: estructuras el día en segmentos, operas en La Flota y cierras la jornada con conciencia (cumplido o archivado).",
    action: "Siguiente: entender el monitor del día.",
  },
  {
    title: "Segmentos = tu día en tramos",
    description:
      "Mañana, tarde, noche… Cada segmento tiene hora de inicio y fin. Si ninguno está activo, el monitor muestra OMISIÓN (tiempo sin registro).",
    action: "Ve a «Segmentos del día» y revisa o crea tu tramo actual.",
  },
  {
    title: "La Flota: tus misiones",
    description:
      "Vehículo Express = nombre + tipo de fin en 30 segundos. Vehículo Profundo = 4 ejes (enfoque, conflicto, pasos, alcance) con más PS.",
    action: "Lanza un Express con algo que harás hoy.",
  },
  {
    title: "Cierra para ganar PS",
    description:
      "Una misión solo cuenta cuando la marcas CUMPLIDO o ARCHIVADO. El coraje de intentar también suma puntos.",
    action: "Cierra tu primer vehículo antes de salir.",
  },
  {
    title: "Tu guía: Doctor IA",
    description:
      `En ${JORNADA_MODULE.title} el Doctor responde en modo guía: «¿qué es un segmento?», «¿por dónde empiezo?». Pregunta con tu duda concreta.`,
    action: "Abre el chat flotante y escribe: «¿Por dónde empiezo hoy?»",
  },
];

const STEPS_ESTUDIANTE_EXTRA: TutorialStep[] = [
  {
    title: "Desglosador situacional",
    description:
      "Para tiempo libre e ideas sueltas: bloques 3+3, cupos por subtarea, cronómetro. Ideal cuando nadie te marca la agenda.",
    action: "Crea un desglosador situación y cierra al menos un bloque.",
  },
  {
    title: "Proyectos y peldaños",
    description:
      "En Hub Proyectos subes una escalera de peldaños. Puedes vincular un segmento al proyecto para claridad mental.",
    action: "Abre Proyectos desde el menú y revisa tu escalera activa.",
  },
];

const STEPS_PRODUCCION_EXTRA: TutorialStep[] = [
  {
    title: "Desglosador tiempo (unidades)",
    description:
      "Para producción repetitiva: defines unidades, el contador baja con pitido, cada sub es un bloque medido.",
    action: "Abre un desglosador tiempo en La Flota.",
  },
  {
    title: "Ruta fluido → concentrado → límite",
    description:
      "La voz marca tramos del contador. Al cerrar subs, la termodinámica compara dominio fluido y fricción vs ayer.",
    action: "Cierra 2 subs y revisa la comparativa del día.",
  },
];

export function getTutorialSteps(profile: PlanificacionPlanProfile): TutorialStep[] {
  if (profile === "produccion") {
    return [...STEPS_BASE, ...STEPS_PRODUCCION_EXTRA];
  }
  if (profile === "estudiante") {
    return [...STEPS_BASE, ...STEPS_ESTUDIANTE_EXTRA];
  }
  return STEPS_BASE;
}

export type PrimerDiaItem = {
  key: PrimerDiaCheckKey;
  label: string;
  hint: string;
  /** Solo visible si el plan incluye esta capacidad */
  requires?: "desglosador" | "proyecto";
};

export function getPrimerDiaItems(profile: PlanificacionPlanProfile): PrimerDiaItem[] {
  const items: PrimerDiaItem[] = [
    {
      key: "segmento",
      label: "Tengo un segmento del día definido (o activo)",
      hint: "Segmentos del día → crea mañana/tarde o usa plantilla.",
    },
    {
      key: "vehiculo",
      label: "Lancé al menos un vehículo en La Flota",
      hint: "Express para empezar rápido; Profundo si la misión importa.",
    },
    {
      key: "cierre",
      label: "Cerré un vehículo (cumplido o archivado)",
      hint: "Sin cierre no hay PS ni datos en termodinámica.",
    },
  ];
  if (profile === "estudiante" || profile === "produccion") {
    items.push({
      key: "desglosador",
      label: "Usé un desglosador y cerré al menos un sub",
      hint:
        profile === "produccion"
          ? "Desglosador tiempo → subs por unidades."
          : "Desglosador situación → bloques 3+3.",
      requires: "desglosador",
    });
  }
  if (profile === "estudiante") {
    items.push({
      key: "proyecto",
      label: "Revisé o avancé un peldaño en Proyectos",
      hint: "Menú → Proyectos → escalera activa.",
      requires: "proyecto",
    });
  }
  return items;
}

export function loadChecklistState(uid: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(checklistStorageKey(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChecklistState(uid: string, state: Record<string, boolean>): void {
  try {
    localStorage.setItem(checklistStorageKey(uid), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function isTutorialDone(uid: string): boolean {
  try {
    return localStorage.getItem(tutorialStorageKey(uid)) === "1";
  } catch {
    return false;
  }
}

export function markTutorialDone(uid: string): void {
  try {
    localStorage.setItem(tutorialStorageKey(uid), "1");
  } catch {
    /* ignore */
  }
}

export function computePrimerDiaAutoComplete(params: {
  dayStartMs: number;
  segmentos: Array<{ estado?: string }>;
  vehicles: Array<{
    status?: string;
    tipoReloj?: string;
    cierreAt?: number;
    aperturaAt?: number;
    subVehiculos?: Array<{ status?: string; cierreAt?: number }>;
  }>;
}): Partial<Record<PrimerDiaCheckKey, boolean>> {
  const { dayStartMs, segmentos, vehicles } = params;
  const out: Partial<Record<PrimerDiaCheckKey, boolean>> = {};

  if (segmentos.length > 0) {
    out.segmento = true;
  }

  const enJornada = vehicles.filter(v => {
    const ts = v.cierreAt ?? v.aperturaAt ?? 0;
    return v.status === "activo" || ts >= dayStartMs;
  });

  if (enJornada.length > 0) {
    out.vehiculo = true;
  }

  const cerrado = vehicles.some(
    v =>
      (v.status === "cumplido" || v.status === "archivado") &&
      (v.cierreAt ?? 0) >= dayStartMs
  );
  if (cerrado) {
    out.cierre = true;
  }

  const subCerrado = vehicles.some(v => {
    if (v.tipoReloj !== "desglosador") return false;
    return (v.subVehiculos ?? []).some(
      s => s.status === "cumplido" && (s.cierreAt ?? v.cierreAt ?? 0) >= dayStartMs
    );
  });
  if (subCerrado) {
    out.desglosador = true;
  }

  return out;
}

export function buildPrimerDiaSummaryForDoctor(
  items: PrimerDiaItem[],
  manual: Record<string, boolean>,
  auto: Partial<Record<PrimerDiaCheckKey, boolean>>
): string {
  return items
    .map(it => {
      const done = manual[it.key] || auto[it.key];
      return `- ${it.label}: ${done ? "hecho" : "pendiente"}`;
    })
    .join("\n");
}

/** Preguntas rápidas para el Doctor en Jornada */
export const PLANIFICACION_DOCTOR_QUICK_PROMPTS = [
  "¿Por dónde empiezo hoy?",
  "¿Qué es un segmento?",
  "¿Express o vehículo profundo?",
  "¿Cómo funciona el desglosador?",
  "¿Por qué no veo mis subs en termodinámica?",
] as const;
