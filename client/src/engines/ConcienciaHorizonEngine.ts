/**
 * Proyección "Horizonte": puntero fijo en Norte, mundo relativo a now.
 * Ventana default 8h (4h atrás + 4h adelante).
 */

import {
  buildSegmentBattleIntervalsForHorizon,
  type SegmentoAnilloLite,
  type VehiculoAnilloLite,
} from "./ConcienciaEngine";
import { getLimaDayStartMs, segmentWindowMs } from "@/lib/segmentTime";

export const HORIZON_WINDOW_MIN_DEFAULT = 480;
export const HORIZON_VISIBLE_DEG = 240;

export type HorizonArcKind = "segmento" | "conquista" | "entropia" | "fondo";

export interface HorizonArc {
  startDeg: number;
  endDeg: number;
  kind: HorizonArcKind;
  ordinal?: number;
  nombre?: string;
  estado?: string;
  strokeOpacity?: number;
}

export type HorizonProjection = {
  arcs: HorizonArc[];
  windowMin: number;
  pointerDeg: number;
};

/** 0° = ahora (Norte). Pasado hacia Oeste (negativo), futuro hacia Este (positivo). */
export function msToHorizonDeg(offsetMs: number, halfWindowMs: number): number {
  if (halfWindowMs <= 0) return 0;
  const clamped = Math.max(-halfWindowMs, Math.min(halfWindowMs, offsetMs));
  return (clamped / halfWindowMs) * (HORIZON_VISIBLE_DEG / 2);
}

function intervalToHorizonArcs(
  startMs: number,
  endMs: number,
  nowMs: number,
  halfWindowMs: number,
  kind: HorizonArcKind,
  meta?: { ordinal?: number; nombre?: string; estado?: string; strokeOpacity?: number }
): HorizonArc[] {
  const winStart = nowMs - halfWindowMs;
  const winEnd = nowMs + halfWindowMs;
  const clipStart = Math.max(startMs, winStart);
  const clipEnd = Math.min(endMs, winEnd);
  if (clipEnd <= clipStart) return [];

  const startDeg = msToHorizonDeg(clipStart - nowMs, halfWindowMs);
  let endDeg = msToHorizonDeg(clipEnd - nowMs, halfWindowMs);
  if (endDeg <= startDeg) endDeg += 0.01;

  return [{ startDeg, endDeg, kind, ...meta }];
}

export function computeHorizonProjection(params: {
  segmentos: Array<SegmentoAnilloLite & { estado?: string; nombre?: string }>;
  vehiculos: VehiculoAnilloLite[];
  now?: number;
  windowMin?: number;
}): HorizonProjection {
  const nowMs = params.now ?? Date.now();
  const windowMin = params.windowMin ?? HORIZON_WINDOW_MIN_DEFAULT;
  const halfWindowMs = (windowMin / 2) * 60000;
  const dayStartMs = getLimaDayStartMs(nowMs);

  const arcs: HorizonArc[] = [
    { startDeg: -HORIZON_VISIBLE_DEG / 2, endDeg: HORIZON_VISIBLE_DEG / 2, kind: "fondo" },
  ];

  params.segmentos.forEach((seg, idx) => {
    if (!seg.horaInicio || !seg.horaFin) return;
    const { start, end } = segmentWindowMs(seg.horaInicio, seg.horaFin, dayStartMs);
    const isActive = seg.estado === "activo";
    arcs.push(
      ...intervalToHorizonArcs(start, end, nowMs, halfWindowMs, "segmento", {
        ordinal: idx + 1,
        nombre: seg.nombre,
        estado: seg.estado ?? "pendiente",
        strokeOpacity: isActive ? 1 : 0.72,
      })
    );
  });

  for (const battle of buildSegmentBattleIntervalsForHorizon(params)) {
    arcs.push(
      ...intervalToHorizonArcs(battle.startMs, battle.endMs, nowMs, halfWindowMs, battle.kind, {
        ordinal: battle.ordinal,
      })
    );
  }

  return { arcs, windowMin, pointerDeg: 0 };
}
