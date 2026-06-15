import { SISTEMICAR_CATEGORY } from "./sistemicarCategory";

/** Identidad visible del módulo `/planeacion` (capa usuario). */
export const JORNADA_MODULE = {
  title: "Jornada",
  titleUpper: "JORNADA",
  /** Categoría pública — no "planificador". */
  tagline: SISTEMICAR_CATEGORY.name,
  taglineShort: "Presencia · Entrada · Producción",
  /** Línea comercial en checkout (Planificación Base, etc.). */
  productLine: "Planificación",
  category: SISTEMICAR_CATEGORY,
} as const;
