import type { Vehicle } from "./persistence";
import { getJournalDayStartMs } from "./segmentTime";
import { isOrphanDesglosadorInterrupt } from "./situacionSessionMerge";

/** Sesión consciente activa más allá de esto se considera fantasma obsoleta. */
export const GHOST_MAX_SESSION_MS = 12 * 3600_000;

/** Ventana para preservar activos locales aún sincronizando con Firebase. */
export const LOCAL_SYNC_GRACE_MS = 15 * 60_000;

/**
 * Trabajo continuo legítimo que empezó justo antes de las 05:00 (p. ej. 04:00 → 09:00).
 * No confundir con sesión nocturna (21:00–23:00) dejada abierta al dormir.
 */
export const JOURNAL_PRESTART_WINDOW_MS = 3600_000;

/** Máxima duración de un arrastre pre-05:00 que sigue contando en el journal nuevo. */
export const JOURNAL_CARRYOVER_MAX_MS = 6 * 3600_000;

/**
 * Vehículo abierto en un journal anterior (p. ej. 21:00–23:00) que sigue `activo` tras las 05:00.
 * No cubre segmentos del día nuevo y puede inundar el anillo de rojo si no se cierra.
 */
export function isJournalStaleActiveVehicle(
  aperturaAt: number,
  nowMs: number,
  dayStartMs: number
): boolean {
  if (aperturaAt === 0 || aperturaAt >= dayStartMs) return false;
  const sessionAge = nowMs - aperturaAt;
  const startedJustBeforeJournal =
    aperturaAt >= dayStartMs - JOURNAL_PRESTART_WINDOW_MS && aperturaAt < dayStartMs;
  if (startedJustBeforeJournal && sessionAge <= JOURNAL_CARRYOVER_MAX_MS) return false;
  if (sessionAge <= 2 * 3600_000) return false;
  return true;
}

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
  if (isJournalStaleActiveVehicle(apertura, nowMs, dayStartMs)) return true;

  if (v.vehiculoPadreDesglosadorId) {
    const parent = vehiclesById?.get(v.vehiculoPadreDesglosadorId);
    if (!parent || parent.status !== "activo") return true;
  }

  if (vehiclesById && isOrphanDesglosadorInterrupt(v, vehiclesById)) return true;

  if (v.tipoFlota === "descanso") {
    const match = v.criterioDetalle?.match(/([\d.]+)\s*min/i);
    const plannedMin = match ? parseFloat(match[1]) : v.tipoDescanso === "punto_cero" ? 20 : 15;
    const graceMin = v.tipoDescanso === "punto_cero" ? 45 : 20;
    if (apertura > 0 && nowMs - apertura > (plannedMin + graceMin) * 60000) return true;
    if (v.puntoCero?.fase === "completada") {
      const since = v.puntoCero.faseInicioAt ?? apertura;
      if (nowMs - since > 20 * 60_000) return true;
    }
  }

  return false;
}

/**
 * Preservar activos locales ausentes del snapshot de Firebase.
 * Cualquier vehículo consciente abierto en el día-jornada actual se mantiene
 * hasta cierre explícito (no solo 15 min de gracia de sync).
 */
export function shouldPreserveLocalActivo(v: Vehicle, nowMs: number, dayStartMs?: number): boolean {
  if (v.status !== "activo" || v.autoVerdad) return false;
  const dayStart = dayStartMs ?? getJournalDayStartMs(nowMs);
  if (isGhostActiveVehicle(v, nowMs, dayStart)) return false;

  const apertura = v.aperturaAt || (v.createdAt instanceof Date ? v.createdAt.getTime() : 0);
  if (apertura >= dayStart) return true;

  const age = apertura > 0 ? nowMs - apertura : Infinity;
  if (age < LOCAL_SYNC_GRACE_MS) return true;
  if (v.clientRequestId && age < 30 * 60_000) return true;
  return false;
}

/** Reincorpora activos del día-jornada guardados en local pero ausentes del merge remoto. */
export function recoverMissingJournalDayActives(
  merged: Vehicle[],
  localSource: Vehicle[],
  nowMs: number = Date.now(),
  isRecentlyClosed: (id: string) => boolean = () => false,
  isLocallyClosed: (id: string) => boolean = () => false
): Vehicle[] {
  const dayStart = getJournalDayStartMs(nowMs);
  const mergedIds = new Set(merged.map(v => v.id));
  const mergedCrq = new Set(merged.map(v => v.clientRequestId).filter(Boolean));
  const byId = new Map(merged.map(v => [v.id, v]));
  const missing = localSource.filter(v => {
    if (v.status !== "activo" || v.autoVerdad) return false;
    if (mergedIds.has(v.id)) return false;
    if (v.clientRequestId && mergedCrq.has(v.clientRequestId)) return false;
    if (isRecentlyClosed(v.id)) return false;
    if (isLocallyClosed(v.id)) return false;
    if (isOrphanDesglosadorInterrupt(v, byId)) return false;
    return shouldPreserveLocalActivo(v, nowMs, dayStart);
  });
  if (missing.length === 0) return merged;
  return [...missing, ...merged];
}

/** Excluye fantasmas del cálculo de cobertura / entropía del anillo. */
export function filterVehiclesForEntropy(vehicles: Vehicle[], nowMs = Date.now()): Vehicle[] {
  const dayStart = getJournalDayStartMs(nowMs);
  const byId = new Map(vehicles.map(v => [v.id, v]));
  return vehicles.filter(v => !isGhostActiveVehicle(v, nowMs, dayStart, byId));
}

/**
 * Cobertura del anillo de conciencia: solo cuenta trabajo consciente abierto
 * en la jornada actual (desde 05:00). Un `activo` arrastrado de antes de las 05:00
 * no bloquea entropía aunque siga en Firebase/local.
 */
export function filterVehiclesForAnilloCoverage(vehicles: Vehicle[], nowMs = Date.now()): Vehicle[] {
  const dayStart = getJournalDayStartMs(nowMs);
  return filterVehiclesForEntropy(vehicles, nowMs).filter(v => {
    // Centinela (autoVerdad): sesiones selladas de entropía — siempre incluir.
    if (v.autoVerdad) return true;
    if (v.status !== "activo") return true;

    const apertura = v.aperturaAt || (v.createdAt instanceof Date ? v.createdAt.getTime() : 0);
    if (apertura > 0 && apertura < dayStart) return false;

    if (v.tipoFlota === "descanso" || v.tipoDescanso === "punto_cero") {
      return apertura >= dayStart;
    }
    return true;
  });
}

export function hasRealActiveConsciousVehicle(vehicles: Vehicle[], nowMs = Date.now()): boolean {
  return filterVehiclesForEntropy(vehicles, nowMs).some(v => v.status === "activo" && !v.autoVerdad);
}
