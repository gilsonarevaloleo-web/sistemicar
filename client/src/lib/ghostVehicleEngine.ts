import type { Vehicle } from "./persistence";
import { getJournalDayStartMs } from "./segmentTime";
import { isOrphanDesglosadorInterrupt } from "./situacionSessionMerge";

/** Sesión consciente activa más allá de esto se considera fantasma obsoleta. */
export const GHOST_MAX_SESSION_MS = 12 * 3600_000;

/** Ventana para preservar activos locales aún sincronizando con Firebase. */
export const LOCAL_SYNC_GRACE_MS = 15 * 60_000;

/**
 * Vehículo consciente `activo` que no representa trabajo real en curso.
 * Bloquea entropía del anillo y al Centinela si no se filtra.
 */
export function isGhostActiveVehicle(
  v: Vehicle,
  nowMs: number,
  dayStartMs: number,
  vehiclesById?: Map<string, Vehicle>
): boolean {
  if (v.status !== "activo" || v.autoVerdad) return false;

  const apertura = v.aperturaAt || (v.createdAt instanceof Date ? v.createdAt.getTime() : 0);
  if (apertura === 0) return true;
  if (nowMs - apertura > GHOST_MAX_SESSION_MS) return true;
  // Sesión activa que cruzó el rollover 05:00: sigue siendo real (no bloquear el anillo).
  if (apertura < dayStartMs) {
    return false;
  }

  if (v.vehiculoPadreDesglosadorId) {
    const parent = vehiclesById?.get(v.vehiculoPadreDesglosadorId);
    if (!parent || parent.status !== "activo") return true;
  }

  if (vehiclesById && isOrphanDesglosadorInterrupt(v, vehiclesById)) return true;

  return false;
}

/** Solo preservar activos locales ausentes del snapshot si aún pueden estar sincronizando. */
export function shouldPreserveLocalActivo(v: Vehicle, nowMs: number, dayStartMs?: number): boolean {
  if (v.status !== "activo" || v.autoVerdad) return false;
  const dayStart = dayStartMs ?? getJournalDayStartMs(nowMs);
  if (isGhostActiveVehicle(v, nowMs, dayStart)) return false;

  const apertura = v.aperturaAt || (v.createdAt instanceof Date ? v.createdAt.getTime() : 0);
  const age = apertura > 0 ? nowMs - apertura : Infinity;
  if (age < LOCAL_SYNC_GRACE_MS) return true;
  if (v.clientRequestId && age < 30 * 60_000) return true;
  return false;
}

/** Excluye fantasmas del cálculo de cobertura / entropía del anillo. */
export function filterVehiclesForEntropy(vehicles: Vehicle[], nowMs = Date.now()): Vehicle[] {
  const dayStart = getJournalDayStartMs(nowMs);
  const byId = new Map(vehicles.map(v => [v.id, v]));
  return vehicles.filter(v => !isGhostActiveVehicle(v, nowMs, dayStart, byId));
}

export function hasRealActiveConsciousVehicle(vehicles: Vehicle[], nowMs = Date.now()): boolean {
  return filterVehiclesForEntropy(vehicles, nowMs).some(v => v.status === "activo" && !v.autoVerdad);
}
