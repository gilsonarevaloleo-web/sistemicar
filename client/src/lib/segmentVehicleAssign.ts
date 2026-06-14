import type { SegmentoV5, Vehicle } from "./persistence";
import { getPuertaWindowMs, PUERTA_MARGIN_MIN } from "./segmentAttentionEngine";
import { segmentClockMs, segmentTimeToMinutes, segmentWindowMs } from "./segmentTime";

/** Vehículo abierto hasta N min antes del inicio oficial cuenta para el segmento siguiente. */
export const EARLY_VEHICLE_MARGIN_MIN = 6;

function sortSegmentos(segmentos: SegmentoV5[]): SegmentoV5[] {
  return [...segmentos].sort(
    (a, b) => segmentTimeToMinutes(a.horaInicio) - segmentTimeToMinutes(b.horaInicio)
  );
}

function isSegmentClosed(seg: SegmentoV5): boolean {
  return seg.estado === "entropia" || seg.estado === "cerrado_manual";
}

/**
 * Segmento al que pertenece un vehículo según cuándo se abrió.
 * Prioriza el bloque siguiente si la apertura cae en la ventana anticipada (±puerta / −6 min).
 */
export function resolveSegmentoForVehicleAt(
  segmentos: SegmentoV5[],
  atMs: number,
  dayStartMs: number
): Pick<SegmentoV5, "id" | "nombre"> | null {
  const ordered = sortSegmentos(segmentos);

  for (const seg of ordered) {
    if (isSegmentClosed(seg)) continue;
    const { segmentStartMs, windowEndMs } = getPuertaWindowMs(seg.horaInicio, dayStartMs);
    const earlyStartMs = segmentStartMs - EARLY_VEHICLE_MARGIN_MIN * 60000;
    if (atMs >= earlyStartMs && atMs <= windowEndMs && atMs < segmentStartMs) {
      return { id: seg.id, nombre: seg.nombre };
    }
  }

  const activo = ordered.find(s => s.estado === "activo");
  if (activo?.horaFin) {
    const { start, end } = segmentWindowMs(activo.horaInicio, activo.horaFin, dayStartMs);
    const earlyStart = start - EARLY_VEHICLE_MARGIN_MIN * 60000;
    if (atMs >= earlyStart && atMs <= end) {
      return { id: activo.id, nombre: activo.nombre };
    }
  }

  for (const seg of ordered) {
    if (!seg.horaFin) continue;
    const { start, end } = segmentWindowMs(seg.horaInicio, seg.horaFin, dayStartMs);
    if (atMs >= start && atMs <= end) {
      return { id: seg.id, nombre: seg.nombre };
    }
  }

  return activo ? { id: activo.id, nombre: activo.nombre } : null;
}

export function resolveVehicleSegmentContext(
  vehicle: Vehicle,
  segmentos: SegmentoV5[],
  dayStartMs: number
): { id?: string; nombre?: string } {
  const atMs = vehicle.aperturaAt;
  if (atMs == null) {
    return { id: vehicle.segmentoId, nombre: vehicle.segmentoOrigen };
  }
  const resolved = resolveSegmentoForVehicleAt(segmentos, atMs, dayStartMs);
  if (resolved) return resolved;
  return { id: vehicle.segmentoId, nombre: vehicle.segmentoOrigen };
}

/** Inicio efectivo de ventana de cumplimiento (incluye apertura anticipada). */
export function segmentEffectiveWindowStartMs(
  horaInicio: string,
  dayStartMs: number,
  marginMin: number = EARLY_VEHICLE_MARGIN_MIN
): number {
  return segmentClockMs(horaInicio, dayStartMs) - marginMin * 60000;
}

export function isWithinEarlyVehicleWindow(
  atMs: number,
  horaInicio: string,
  horaFin: string,
  dayStartMs: number
): boolean {
  const { end } = segmentWindowMs(horaInicio, horaFin, dayStartMs);
  const start = segmentEffectiveWindowStartMs(horaInicio, dayStartMs);
  return atMs >= start && atMs <= end;
}

/** Ventana de puerta extendida para lanzamiento (coherente con PUERTA_MARGIN ±5). */
export function isWithinVehicleLaunchPuertaZone(
  atMs: number,
  horaInicio: string,
  dayStartMs: number
): boolean {
  const { windowStartMs, windowEndMs } = getPuertaWindowMs(horaInicio, dayStartMs);
  const earlyStartMs = segmentClockMs(horaInicio, dayStartMs) - EARLY_VEHICLE_MARGIN_MIN * 60000;
  return atMs >= Math.min(windowStartMs, earlyStartMs) && atMs <= windowEndMs;
}

export { PUERTA_MARGIN_MIN };
