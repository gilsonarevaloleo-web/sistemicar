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

/** Mensaje de celebración al cerrar un bloque situacional. */
export function formatCombustibleCelebracionBloque(opts: {
  minutos: number;
  decisiones: number;
  psTotal: number;
}): string {
  const { minutos, decisiones, psTotal } = opts;
  if (decisiones <= 0) {
    return "Cada bloque cerrado entrena tu capacidad de decidir con claridad — el combustible de conciencia crece con cada cierre.";
  }
  const tiempo =
    minutos >= 60
      ? `${Math.floor(minutos / 60)} h ${minutos % 60} min`
      : `${minutos} min`;
  const psFrase = psTotal > 0 ? ` Ganaste +${psTotal} PS de poder.` : "";
  const decisionLabel = decisiones === 1 ? "decisión" : "decisiones";
  return `Hoy, en ${tiempo}, resolviste ${decisiones} ${decisionLabel} — esto llena tu tanque de combustible de conciencia.${psFrase}`;
}
