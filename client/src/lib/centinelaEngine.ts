import type { Planilla, SegmentoV5, Vehicle } from "./persistence";
import { listRetroactiveCentinelaGapsToPersist } from "@/engines/ConcienciaEngine";
import {
  ENTROPY_TIME_POLICY,
  hasActiveConsciousCoverage,
  resolveCoverageVehicles,
} from "./entropyTimePolicy";
import { recordConsciousVehicleLaunch } from "./entropyMonotonicStore";
import {
  getJournalDayStartMs,
  getSegmentCalendarDayStartMs,
  isPastJournalDayStart,
  JOURNAL_DAY_START,
  segmentWindowMs,
} from "./segmentTime";

export const CENTINELA_DELAY_MS = ENTROPY_TIME_POLICY.CENTINELA_DELAY_MS;
export const NO_VEHICLE_SINCE_KEY = "sistemicar_no_vehicle_since";
export const CENTINELA_TITULO = "Modo Centinela";

/** Centinela automático (invisible en flota); distinto de verdad inconsciente manual del usuario. */
export function isInvisibleCentinelaVehicle(v: { autoVerdad?: boolean; titulo?: string; excluirDeHistorial?: boolean }): boolean {
  return !!v.autoVerdad && (v.titulo === CENTINELA_TITULO || !!v.excluirDeHistorial);
}

export type CentinelaGate =
  | { allowed: true; segContext?: SegmentoV5 }
  | { allowed: false; reason: string };

export type CentinelaUiState = {
  esperaSec: number;
  blockReason: string | null;
};

const STUB_EJES = {
  enfoque: { text: "", trifecta: "omitir" as const },
  conflicto: { text: "", trifecta: "omitir" as const },
  pasos: { text: "", trifecta: "omitir" as const },
  limite: { text: "", trifecta: "omitir" as const },
};

const SUPPRESS_AT_KEY = "sistemicar_centinela_suppressed_at";

let suppressed = false;

export function suppressCentinela(): void {
  suppressed = true;
  try { sessionStorage.setItem(SUPPRESS_AT_KEY, Date.now().toString()); } catch { }
  emitCentinelaUi({ esperaSec: 0, blockReason: "Preparando lanzamiento" });
}

export function releaseCentinela(): void {
  suppressed = false;
  try { sessionStorage.removeItem(SUPPRESS_AT_KEY); } catch { }
}

/** Libera suppress si qued├│ atascado tras un lanzamiento interrumpido. */
export function maybeReleaseStaleSuppression(maxAgeMs = 60_000): void {
  try {
    const t = parseInt(sessionStorage.getItem(SUPPRESS_AT_KEY) || "0", 10);
    if (t <= 0) {
      suppressed = false;
      return;
    }
    if (Date.now() - t > maxAgeMs) releaseCentinela();
    else suppressed = true;
  } catch {
    releaseCentinela();
  }
}

/** Al abrir Planificaci├│n: nunca dejar el centinela bloqueado por un lanzamiento anterior. */
export function resetCentinelaLaunchGate(): void {
  releaseCentinela();
  resetCentinelaTimerState();
  emitCentinelaUi({ esperaSec: 0, blockReason: null });
}

export function isCentinelaSuppressed(): boolean {
  return suppressed;
}

export function emitCentinelaUi(state: CentinelaUiState): void {
  window.dispatchEvent(new CustomEvent("centinela-ui-state", { detail: state }));
}

export function findSegmentCoveringNow(
  segmentos: SegmentoV5[],
  nowMs: number
): SegmentoV5 | undefined {
  const dayStarts = [
    getSegmentCalendarDayStartMs(nowMs),
    getSegmentCalendarDayStartMs(nowMs) - 86400000,
  ];
  for (const dayStart of dayStarts) {
    for (const seg of segmentos) {
      const { start, end } = segmentWindowMs(seg.horaInicio, seg.horaFin, dayStart);
      if (nowMs >= start && nowMs <= end) return seg;
    }
  }
  return undefined;
}

function findFirstJournalSegment(
  segmentos: SegmentoV5[],
  nowMs: number
): SegmentoV5 | undefined {
  if (segmentos.length === 0) return undefined;
  const calDayStart = getSegmentCalendarDayStartMs(nowMs);
  return [...segmentos].sort(
    (a, b) =>
      segmentWindowMs(a.horaInicio, a.horaFin, calDayStart).start -
      segmentWindowMs(b.horaInicio, b.horaFin, calDayStart).start
  )[0];
}

/** Eval├║a si el centinela puede activarse seg├║n segmentos y hora (d├¡a-jornada desde 05:00). */
export function getCentinelaSegmentGate(
  planilla: Planilla | null,
  nowMs: number = Date.now()
): CentinelaGate {
  if (!isPastJournalDayStart(nowMs)) {
    return { allowed: false, reason: `Centinela disponible desde las ${JOURNAL_DAY_START}` };
  }

  if (!planilla || planilla.segmentos.length === 0) {
    return { allowed: true };
  }

  const segActivo = planilla.segmentos.find(s => s.estado === "activo");
  if (segActivo) {
    if (segActivo.centinelaEnabled === false) {
      return { allowed: false, reason: `Centinela desactivado en "${segActivo.nombre}"` };
    }
    return { allowed: true, segContext: segActivo };
  }

  const covering = findSegmentCoveringNow(planilla.segmentos, nowMs);
  if (covering) {
    if (covering.centinelaEnabled === false) {
      return { allowed: false, reason: `Centinela desactivado en "${covering.nombre}"` };
    }
    return { allowed: true, segContext: covering };
  }

  const anyEnabled = planilla.segmentos.some(s => s.centinelaEnabled !== false);
  if (!anyEnabled) {
    return { allowed: false, reason: "Centinela desactivado en todos los segmentos" };
  }

  const first = findFirstJournalSegment(planilla.segmentos, nowMs);
  if (first) {
    const calDayStart = getSegmentCalendarDayStartMs(nowMs);
    const { start } = segmentWindowMs(first.horaInicio, first.horaFin, calDayStart);
    if (nowMs >= start) {
      return { allowed: true, segContext: first };
    }
  }

  // Tras las 05:00 sin veh├¡culos: centinela aunque el primer segmento a├║n no haya empezado
  return { allowed: true, segContext: first };
}

/** Centinelas activos en la flota (Modo Centinela / autoVerdad). */
export function listActiveCentinelas(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter(v => v.autoVerdad && v.status === "activo");
}

/**
 * Exclusión mutua centinela ↔ consciente.
 * Misma lista filtrada que el anillo (`resolveCoverageVehicles`).
 */
export function isCentinelaBlockedByVehicles(vehicles: Vehicle[], nowMs = Date.now()): boolean {
  return hasActiveConsciousCoverage(vehicles, nowMs);
}

export function buildCentinelaArchiveFields(
  v: Vehicle,
  cierreAt: number
): { status: "archivado"; cierreAt: number; duracionFinal: number } {
  return {
    status: "archivado",
    cierreAt,
    duracionFinal: Math.max(0, Math.round((cierreAt - (v.aperturaAt || cierreAt)) / 60000)),
  };
}

/** Cierra todos los centinelas activos (Firebase + local vía persistence). */
export async function archiveActiveCentinelas(
  userId: string,
  vehicles: Vehicle[]
): Promise<string[]> {
  const active = listActiveCentinelas(vehicles);
  if (active.length === 0) return [];

  const { updateVehicle, updateVehicleStatus } = await import("./persistence");
  const now = Date.now();
  const closedIds: string[] = [];

  for (const av of active) {
    const fields = buildCentinelaArchiveFields(av, now);
    try {
      await updateVehicle(userId, av.id, {
        cierreAt: fields.cierreAt,
        duracionFinal: fields.duracionFinal,
      });
      await updateVehicleStatus(userId, av.id, "archivado");
      closedIds.push(av.id);
      console.log(
        `[Centinela] Cerrado por vehículo consciente activo: ${av.id} (${fields.duracionFinal} min)`
      );
    } catch (e) {
      console.warn("[Centinela] archiveActiveCentinelas:", av.id, e);
    }
  }
  return closedIds;
}

/** Cierra centinelas activos cuando hay trabajo consciente (evita entropía fantasma en el anillo). */
export async function archiveActiveCentinelasWhenBlocked(
  userId: string,
  vehicles: Vehicle[]
): Promise<string[]> {
  if (!isCentinelaBlockedByVehicles(vehicles)) return [];
  return archiveActiveCentinelas(userId, vehicles);
}

/** Antes de lanzar un vehículo consciente: suprimir timer y archivar centinelas activos. */
export async function closeCentinelasBeforeConsciousLaunch(
  userId: string,
  vehicles: Vehicle[]
): Promise<string[]> {
  suppressCentinela();
  resetCentinelaTimerState();
  recordConsciousVehicleLaunch();
  return archiveActiveCentinelas(userId, vehicles);
}

export function resetCentinelaTimerState(): void {
  localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
}

export function ensureCentinelaTimerStarted(now: number, inMemorySince: number): number {
  const persistedSince = parseInt(localStorage.getItem(NO_VEHICLE_SINCE_KEY) || "0", 10);
  const MAX_SINCE_AGE = 4 * 3600 * 1000;
  const persistedSinceValid = persistedSince > 0 && now - persistedSince < MAX_SINCE_AGE;

  if (inMemorySince > 0) return inMemorySince;

  if (persistedSinceValid) return persistedSince;

  if (persistedSince > 0) localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
  localStorage.setItem(NO_VEHICLE_SINCE_KEY, now.toString());
  return now;
}

export function computeCentinelaUiState(
  planilla: Planilla | null,
  vehicles: Vehicle[],
  now: number,
  inMemorySince: number
): { ui: CentinelaUiState; since: number } {
  if (suppressed) {
    return { ui: { esperaSec: 0, blockReason: "Preparando lanzamiento" }, since: 0 };
  }

  if (vehicles.some(v => v.autoVerdad && v.status === "activo")) {
    return { ui: { esperaSec: 0, blockReason: null }, since: 0 };
  }

  const gate = getCentinelaSegmentGate(planilla, now);
  if (!gate.allowed) {
    return { ui: { esperaSec: 0, blockReason: gate.reason }, since: 0 };
  }

  if (isCentinelaBlockedByVehicles(vehicles)) {
    const active = vehicles.find(v => v.status === "activo" && !v.autoVerdad);
    return {
      ui: {
        esperaSec: 0,
        blockReason: active
          ? `Veh├¡culo activo: ${active.titulo}`
          : "Hay un veh├¡culo consciente activo",
      },
      since: 0,
    };
  }

  const since = ensureCentinelaTimerStarted(now, inMemorySince);
  const elapsedWait = now - since;
  return {
    ui: {
      esperaSec: Math.max(0, Math.ceil((CENTINELA_DELAY_MS - elapsedWait) / 1000)),
      blockReason: null,
    },
    since,
  };
}

export async function activateCentinelaVehicle(
  userId: string,
  centinelaAperturaAt: number
): Promise<void> {
  const { addVehicle } = await import("./persistence");
  await addVehicle(userId, {
    titulo: CENTINELA_TITULO,
    criterioFin: "circunstancia",
    criterioDetalle: "Modo Verdad",
    tiempoInicio: new Date(centinelaAperturaAt),
    ejes: STUB_EJES,
    tipoTerminoRapido: "omitido",
    tipoFlota: "verdad",
    aperturaAt: centinelaAperturaAt,
    autoVerdad: true,
    excluirDeHistorial: true,
  });

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("SISTEMICAR - Modo Centinela Activado", {
      body: "Ningun vehiculo activo. El centinela registra el vacio.",
      icon: "/favicon.ico",
      silent: false,
    });
  }
}

/**
 * Persiste sesiones centinela archivadas para huecos pasados en segmentos planificados
 * (p. ej. usuario entró tarde). Solo corre cuando hay segmentos; no aplica sin planilla.
 */
/** Máx. huecos centinela retro por ejecución — evita tormenta de vehículos al abrir Jornada. */
const MAX_RETRO_CENTINELA_GAPS_PER_RUN = 4;

export async function materializeRetroactiveCentinelas(
  userId: string,
  planilla: Planilla | null,
  vehicles: Vehicle[],
  nowMs = Date.now()
): Promise<string[]> {
  if (!planilla?.segmentos?.length) return [];
  if (isCentinelaSuppressed()) return [];
  if (isCentinelaBlockedByVehicles(vehicles, nowMs)) return [];

  const coverageVehicles = resolveCoverageVehicles(vehicles, nowMs);
  const gaps = listRetroactiveCentinelaGapsToPersist({
    segmentos: planilla.segmentos,
    vehiculos: coverageVehicles,
    now: nowMs,
  });
  if (gaps.length === 0) return [];

  const { addVehicle, updateVehicle, updateVehicleStatus } = await import("./persistence");
  const createdIds: string[] = [];

  for (const gap of gaps.slice(0, MAX_RETRO_CENTINELA_GAPS_PER_RUN)) {
    const duracionFinal = Math.max(1, Math.round((gap.cierreAt - gap.aperturaAt) / 60000));
    try {
      const id = await addVehicle(userId, {
        titulo: CENTINELA_TITULO,
        criterioFin: "circunstancia",
        criterioDetalle: "Modo Verdad",
        tiempoInicio: new Date(gap.aperturaAt),
        ejes: STUB_EJES,
        tipoTerminoRapido: "omitido",
        tipoFlota: "verdad",
        aperturaAt: gap.aperturaAt,
        autoVerdad: true,
        excluirDeHistorial: true,
      });
      await updateVehicle(userId, id, { cierreAt: gap.cierreAt, duracionFinal });
      await updateVehicleStatus(userId, id, "archivado");
      createdIds.push(id);
      console.log(
        `[Centinela] Retro sellado ${new Date(gap.aperturaAt).toLocaleTimeString()}–${new Date(gap.cierreAt).toLocaleTimeString()} (${duracionFinal} min)`
      );
    } catch (e) {
      console.warn("[Centinela] materializeRetroactiveCentinelas:", e);
    }
  }

  return createdIds;
}
