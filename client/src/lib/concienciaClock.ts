/**
 * Reloj global de conciencia: fuerza re-render del anillo y métricas en vivo
 * aunque no haya vehículos activos ni cambios de estado en segmentos.
 */

export const CONCIENCIA_CLOCK_TICK_EVENT = "sistemicar-conciencia-clock-tick";

export function dispatchConcienciaClockTick(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONCIENCIA_CLOCK_TICK_EVENT));
}
