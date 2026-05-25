import type { SegmentoV5 } from "./persistence";
import {
  getJournalDayStartMs,
  isPastSegmentAutoStart,
  isPastSegmentEnd,
} from "./segmentTime";

export type SegmentAttentionEvent =
  | { type: "auto_start"; segId: string; nombre: string }
  | { type: "entropia"; segId: string; nombre: string; reason: "past_end" | "missed_window" }
  | { type: "day_rollover_entropia"; segId: string; nombre: string };

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

/** Transiciones de atención panorámica: auto-inicio, entropía por omisión. */
export function applySegmentAttentionTick(
  segmentos: SegmentoV5[],
  nowMs: number,
  dayStartMs?: number
): { segmentos: SegmentoV5[]; events: SegmentAttentionEvent[]; changed: boolean } {
  const dayStart = dayStartMs ?? getJournalDayStartMs(nowMs);
  const events: SegmentAttentionEvent[] = [];
  let changed = false;

  const next = segmentos.map(seg => {
    if (seg.estado === "pendiente") {
      if (seg.horaFin && isPastSegmentEnd(nowMs, seg.horaInicio, seg.horaFin, 5, dayStart)) {
        changed = true;
        events.push({ type: "entropia", segId: seg.id, nombre: seg.nombre, reason: "missed_window" });
        return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
      }
      if (isPastSegmentAutoStart(nowMs, seg.horaInicio, seg.horaFin, 6, dayStart)) {
        changed = true;
        events.push({ type: "auto_start", segId: seg.id, nombre: seg.nombre });
        return { ...seg, estado: "activo" as const, activadoAt: nowMs };
      }
    }

    if (seg.estado === "activo" && seg.horaFin) {
      if (isPastSegmentEnd(nowMs, seg.horaInicio, seg.horaFin, 5, dayStart)) {
        changed = true;
        events.push({ type: "entropia", segId: seg.id, nombre: seg.nombre, reason: "past_end" });
        return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
      }
    }

    return seg;
  });

  return { segmentos: next, events, changed };
}
