import type { SegmentoV5 } from "./persistence";
import {
  getLimaDayStartMs,
  isPastSegmentEnd,
  segmentClockMs,
  segmentWindowMs,
} from "./segmentTime";

export type PuertaTiming = "antes_voz" | "despues_voz";

export const PUERTA_MARGIN_MIN = 5;
export const VOZ_OFFSET_MIN = 4;

export type SegmentAttentionEvent =
  | {
      type: "entropia";
      segId: string;
      nombre: string;
      reason: "past_end" | "missed_puerta" | "missed_window" | "cruce_sin_cierre";
    }
  | { type: "day_rollover_entropia"; segId: string; nombre: string }
  | { type: "voz_disparada"; segId: string; nombre: string; ordinal: number; total: number };

export function getPuertaWindowMs(
  horaInicio: string,
  dayStartMs: number
): { windowStartMs: number; windowEndMs: number; segmentStartMs: number } {
  const segmentStartMs = segmentClockMs(horaInicio, dayStartMs);
  const marginMs = PUERTA_MARGIN_MIN * 60000;
  return {
    segmentStartMs,
    windowStartMs: segmentStartMs - marginMs,
    windowEndMs: segmentStartMs + marginMs,
  };
}

export function getVozDisparoMs(horaInicio: string, dayStartMs: number): number {
  const { segmentStartMs } = getPuertaWindowMs(horaInicio, dayStartMs);
  return segmentStartMs + VOZ_OFFSET_MIN * 60000;
}

export function isWithinPuertaWindow(
  nowMs: number,
  horaInicio: string,
  dayStartMs: number
): boolean {
  const { windowStartMs, windowEndMs } = getPuertaWindowMs(horaInicio, dayStartMs);
  return nowMs >= windowStartMs && nowMs <= windowEndMs;
}

export function isPastPuertaWindow(
  nowMs: number,
  horaInicio: string,
  dayStartMs: number
): boolean {
  const { windowEndMs } = getPuertaWindowMs(horaInicio, dayStartMs);
  return nowMs > windowEndMs;
}

export function classifyPuertaTiming(
  activadoAt: number,
  horaInicio: string,
  dayStartMs: number
): PuertaTiming {
  const vozMs = getVozDisparoMs(horaInicio, dayStartMs);
  return activadoAt < vozMs ? "antes_voz" : "despues_voz";
}

export function applyDayRolloverEntropia(
  segmentos: SegmentoV5[],
  nowMs: number
): { segmentos: SegmentoV5[]; events: SegmentAttentionEvent[]; changed: boolean } {
  const events: SegmentAttentionEvent[] = [];
  let changed = false;
  const next = segmentos.map(seg => {
    if (seg.estado !== "activo") return seg;
    changed = true;
    events.push({ type: "day_rollover_entropia", segId: seg.id, nombre: seg.nombre });
    return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
  });
  return { segmentos: next, events, changed };
}

/** Transiciones de atención panorámica: entropía por puerta perdida o cierre omitido. */
export function applySegmentAttentionTick(
  segmentos: SegmentoV5[],
  nowMs: number,
  dayStartMs?: number
): { segmentos: SegmentoV5[]; events: SegmentAttentionEvent[]; changed: boolean } {
  // dayStart debe ser medianoche calendario (Lima) para que "HH:mm" sea absoluto.
  // El "día-jornada" (05:00) se usa para agrupar/snapshot, no para anclar horarios de segmentos.
  const dayStart = dayStartMs ?? getLimaDayStartMs(nowMs);
  const events: SegmentAttentionEvent[] = [];
  let changed = false;

  const next = segmentos.map(seg => {
    if (seg.estado === "pendiente") {
      if (isPastPuertaWindow(nowMs, seg.horaInicio, dayStart)) {
        changed = true;
        events.push({
          type: "entropia",
          segId: seg.id,
          nombre: seg.nombre,
          reason: "missed_puerta",
        });
        return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
      }
      if (seg.horaFin && isPastSegmentEnd(nowMs, seg.horaInicio, seg.horaFin, PUERTA_MARGIN_MIN, dayStart)) {
        changed = true;
        events.push({
          type: "entropia",
          segId: seg.id,
          nombre: seg.nombre,
          reason: "missed_window",
        });
        return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
      }
    }

    if (seg.estado === "activo" && seg.horaFin) {
      if (isPastSegmentEnd(nowMs, seg.horaInicio, seg.horaFin, PUERTA_MARGIN_MIN, dayStart)) {
        changed = true;
        events.push({ type: "entropia", segId: seg.id, nombre: seg.nombre, reason: "past_end" });
        return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
      }
    }

    return seg;
  });

  return { segmentos: next, events, changed };
}

/** Segmentos pendientes que deben recibir voz en minuto 4 (una vez por día). */
export function collectVozPuertaEvents(
  segmentos: SegmentoV5[],
  nowMs: number,
  dayStartMs?: number
): Array<{ segId: string; nombre: string; ordinal: number; total: number }> {
  const dayStart = dayStartMs ?? getLimaDayStartMs(nowMs);
  const total = segmentos.length;
  const out: Array<{ segId: string; nombre: string; ordinal: number; total: number }> = [];

  segmentos.forEach((seg, idx) => {
    if (seg.estado !== "pendiente" || seg.vozDisparadaAt != null) return;
    const vozMs = getVozDisparoMs(seg.horaInicio, dayStart);
    if (nowMs < vozMs) return;
    const { windowEndMs } = getPuertaWindowMs(seg.horaInicio, dayStart);
    if (nowMs > windowEndMs) return;
    out.push({
      segId: seg.id,
      nombre: seg.nombre,
      ordinal: idx + 1,
      total,
    });
  });

  return out;
}

export function segmentOrdinalIndex(segmentos: SegmentoV5[], segId: string): number {
  const idx = segmentos.findIndex(s => s.id === segId);
  return idx >= 0 ? idx + 1 : 1;
}
