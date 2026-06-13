/**
 * Reloj global de conciencia: fuerza re-render del anillo y métricas en vivo
 * aunque no haya vehículos activos ni cambios de estado en segmentos.
 */

import { useEffect, useState } from "react";

export const CONCIENCIA_CLOCK_TICK_EVENT = "sistemicar-conciencia-clock-tick";

export function dispatchConcienciaClockTick(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONCIENCIA_CLOCK_TICK_EVENT));
}

/** Tras volver de segundo plano, fuerza varios re-cálculos con Date.now() actualizado. */
export function burstConcienciaClockTick(bursts = 3, gapMs = 120): void {
  dispatchConcienciaClockTick();
  if (typeof window === "undefined") return;
  for (let i = 1; i < bursts; i++) {
    window.setTimeout(dispatchConcienciaClockTick, gapMs * i);
  }
}

/** Suscripción al reloj global (1 s en primer plano, 5 s en background). */
export function useConcienciaClockTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onClock = () => setTick(t => t + 1);
    window.addEventListener(CONCIENCIA_CLOCK_TICK_EVENT, onClock);
    dispatchConcienciaClockTick();
    return () => window.removeEventListener(CONCIENCIA_CLOCK_TICK_EVENT, onClock);
  }, []);
  return tick;
}
