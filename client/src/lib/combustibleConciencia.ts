export type { CombustibleDia } from "./termodinamicaAtencional";
export {
  computeCombustibleDia,
  decisionesFromSnapshot,
  subTareaDecisionEnJornada,
  countSubsSituacionCumplidosHoy,
  countMisionesDirectasCerradasHoy,
} from "./termodinamicaAtencional";
import type { CombustibleDia } from "./termodinamicaAtencional";

/** Etiqueta compacta para UI: "2 bloques · 8 decisiones". */
export function formatCombustibleResumen(c: CombustibleDia): string {
  const bloqueLabel = `${c.bloques} bloque${c.bloques !== 1 ? "s" : ""}`;
  const decLabel = `${c.decisiones} decisión${c.decisiones !== 1 ? "es" : ""}`;
  return `${bloqueLabel} · ${decLabel}`;
}

/** Desglose opcional para tooltip o detalle. */
export function formatCombustibleDetalle(c: CombustibleDia): string {
  const parts: string[] = [];
  if (c.subsTiempo > 0) parts.push(`${c.subsTiempo} sub${c.subsTiempo !== 1 ? "s" : ""} tiempo`);
  if (c.subsSituacion > 0) parts.push(`${c.subsSituacion} situación`);
  if (c.misionesDirectas > 0) parts.push(`${c.misionesDirectas} misión${c.misionesDirectas !== 1 ? "es" : ""}`);
  if (parts.length === 0) return "Cierra tareas para alimentar el combustible";
  return parts.join(" · ");
}
