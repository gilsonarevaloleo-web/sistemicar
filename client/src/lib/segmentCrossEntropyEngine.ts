import type { SegmentoV5, Vehicle } from "./persistence";
import type { SegmentAttentionEvent } from "./segmentAttentionEngine";
import { segmentClockMs } from "./segmentTime";
import { isDesglosadorCrossSegmentExempt } from "./vehicleOperationalSlots";

export const CRUCE_GRACE_MIN = 8;
export const CRUCE_WARNING_MIN = 6;

export type SegmentCrossEntropyEvent =
  | {
      type: "warning";
      vehicleId: string;
      titulo: string;
      originSegId: string;
      originNombre: string;
      activeSegNombre: string;
      minutesLeft: number;
    }
  | {
      type: "voz";
      vehicleId: string;
      titulo: string;
      originSegId: string;
      originNombre: string;
    }
  | {
      type: "auto_close";
      vehicleId: string;
      titulo: string;
      originSegId: string;
      originNombre: string;
    }
  | {
      type: "segment_entropia";
      segId: string;
      nombre: string;
      reason: "cruce_sin_cierre";
    };

export type CruceGraciaPhase = "none" | "grace" | "expired";

export function isExcludedFromCrossEntropy(vehicle: Vehicle): boolean {
  if (vehicle.autoVerdad) return true;
  if (vehicle.tipoFlota === "descanso") return true;
  if (vehicle.status !== "activo") return true;
  if (isDesglosadorCrossSegmentExempt(vehicle)) return true;
  return false;
}

export function getActiveSegment(segmentos: SegmentoV5[]): SegmentoV5 | null {
  return segmentos.find(s => s.estado === "activo") ?? null;
}

export function getCruceGraceEndMs(horaInicio: string, dayStartMs: number): number {
  const segmentStartMs = segmentClockMs(horaInicio, dayStartMs);
  return segmentStartMs + CRUCE_GRACE_MIN * 60000;
}

/** Vehículo abierto en un segmento distinto al activo (no puede continuar: debe abrir otro). */
export function isVehicleFromPreviousSegment(
  vehicle: Vehicle,
  activeSegment: SegmentoV5,
  dayStartMs: number
): boolean {
  if (isExcludedFromCrossEntropy(vehicle)) return false;
  const segmentStartMs = segmentClockMs(activeSegment.horaInicio, dayStartMs);
  if (vehicle.segmentoId) {
    return vehicle.segmentoId !== activeSegment.id;
  }
  const aperturaAt = vehicle.aperturaAt ?? vehicle.createdAt?.getTime();
  if (!aperturaAt) return false;
  return aperturaAt < segmentStartMs;
}

export function getCruceGraciaState(
  vehicle: Vehicle,
  activeSegment: SegmentoV5 | null,
  nowMs: number,
  dayStartMs: number
): { phase: CruceGraciaPhase; minutesLeft: number; originNombre?: string } {
  if (!activeSegment || isExcludedFromCrossEntropy(vehicle)) {
    return { phase: "none", minutesLeft: 0 };
  }
  if (!isVehicleFromPreviousSegment(vehicle, activeSegment, dayStartMs)) {
    return { phase: "none", minutesLeft: 0 };
  }
  const graceEndMs = getCruceGraceEndMs(activeSegment.horaInicio, dayStartMs);
  const msLeft = graceEndMs - nowMs;
  const originNombre = vehicle.segmentoOrigen ?? "segmento anterior";
  if (msLeft <= 0) {
    return { phase: "expired", minutesLeft: 0, originNombre };
  }
  return {
    phase: "grace",
    minutesLeft: Math.ceil(msLeft / 60000),
    originNombre,
  };
}

export function applyOriginSegmentCruceEntropia(
  segmentos: SegmentoV5[],
  originSegId: string,
  nowMs: number
): { segmentos: SegmentoV5[]; event: SegmentAttentionEvent | null; changed: boolean } {
  let changed = false;
  let event: SegmentAttentionEvent | null = null;
  const next = segmentos.map(seg => {
    if (seg.id !== originSegId || seg.estado !== "activo") return seg;
    changed = true;
    event = {
      type: "entropia",
      segId: seg.id,
      nombre: seg.nombre,
      reason: "cruce_sin_cierre",
    };
    return { ...seg, estado: "entropia" as const, cerradoAt: nowMs, psGanados: 0 };
  });
  return { segmentos: next, event, changed };
}

export function getCrossingVehiclesState(
  segmentos: SegmentoV5[],
  vehicles: Vehicle[],
  dayStartMs: number
): { activeSegment: SegmentoV5; crossing: Vehicle[] } | null {
  const activeSegment = getActiveSegment(segmentos);
  if (!activeSegment) return null;
  const crossing = vehicles.filter(v => isVehicleFromPreviousSegment(v, activeSegment, dayStartMs));
  if (crossing.length === 0) return null;
  return { activeSegment, crossing };
}

export function evaluateSegmentCrossEntropy(params: {
  vehicles: Vehicle[];
  segmentos: SegmentoV5[];
  nowMs: number;
  dayStartMs: number;
  warnedVehicleIds: Set<string>;
}): { events: SegmentCrossEntropyEvent[]; vehicleVozPatches: Array<{ vehicleId: string; cruceEntropiaVozAt: number }> } {
  const { vehicles, segmentos, nowMs, dayStartMs, warnedVehicleIds } = params;
  const activeSegment = getActiveSegment(segmentos);
  if (!activeSegment) return { events: [], vehicleVozPatches: [] };

  const graceEndMs = getCruceGraceEndMs(activeSegment.horaInicio, dayStartMs);
  const warningStartMs =
    segmentClockMs(activeSegment.horaInicio, dayStartMs) + CRUCE_WARNING_MIN * 60000;
  const events: SegmentCrossEntropyEvent[] = [];
  const vehicleVozPatches: Array<{ vehicleId: string; cruceEntropiaVozAt: number }> = [];
  const originSegIdsForEntropia = new Set<string>();

  for (const vehicle of vehicles) {
    if (!isVehicleFromPreviousSegment(vehicle, activeSegment, dayStartMs)) continue;

    const originSegId = vehicle.segmentoId ?? "";
    const originNombre = vehicle.segmentoOrigen ?? "segmento anterior";

    if (nowMs >= graceEndMs) {
      if (!vehicle.cruceEntropiaVozAt) {
        events.push({
          type: "voz",
          vehicleId: vehicle.id,
          titulo: vehicle.titulo,
          originSegId,
          originNombre,
        });
        vehicleVozPatches.push({ vehicleId: vehicle.id, cruceEntropiaVozAt: nowMs });
      }
      events.push({
        type: "auto_close",
        vehicleId: vehicle.id,
        titulo: vehicle.titulo,
        originSegId,
        originNombre,
      });
      if (originSegId) originSegIdsForEntropia.add(originSegId);
      continue;
    }

    if (nowMs >= warningStartMs && !warnedVehicleIds.has(vehicle.id)) {
      const minutesLeft = Math.ceil((graceEndMs - nowMs) / 60000);
      events.push({
        type: "warning",
        vehicleId: vehicle.id,
        titulo: vehicle.titulo,
        originSegId,
        originNombre,
        activeSegNombre: activeSegment.nombre,
        minutesLeft,
      });
      warnedVehicleIds.add(vehicle.id);
    }
  }

  for (const originSegId of Array.from(originSegIdsForEntropia)) {
    const originSeg = segmentos.find(s => s.id === originSegId);
    if (!originSeg || originSeg.estado !== "activo") continue;
    events.push({
      type: "segment_entropia",
      segId: originSegId,
      nombre: originSeg.nombre,
      reason: "cruce_sin_cierre",
    });
  }

  return { events, vehicleVozPatches };
}
