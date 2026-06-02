import type { Planilla, SegmentoV5, Vehicle } from "./persistence.ts";
import { hasRealActiveConsciousVehicle } from "./ghostVehicleEngine.ts";
import {
  getJournalDayStartMs,
  isPastJournalDayStart,
  JOURNAL_DAY_START,
  segmentWindowMs,
} from "./segmentTime.ts";

export const CENTINELA_DELAY_MS = 120_000;
export const NO_VEHICLE_SINCE_KEY = "sistemicar_no_vehicle_since";

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

/** Libera suppress si quedó atascado tras un lanzamiento interrumpido. */
export function maybeReleaseStaleSuppression(maxAgeMs = 60_000): void {
  if (!suppressed) return;
  try {
    const t = parseInt(sessionStorage.getItem(SUPPRESS_AT_KEY) || "0", 10);
    if (t > 0 && Date.now() - t > maxAgeMs) releaseCentinela();
  } catch { }
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
    getJournalDayStartMs(nowMs),
    getJournalDayStartMs(nowMs) - 86400000,
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
  const journalStart = getJournalDayStartMs(nowMs);
  return [...segmentos].sort(
    (a, b) =>
      segmentWindowMs(a.horaInicio, a.horaFin, journalStart).start -
      segmentWindowMs(b.horaInicio, b.horaFin, journalStart).start
  )[0];
}

/** Evalúa si el centinela puede activarse según segmentos y hora (día-jornada desde 05:00). */
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
    const journalStart = getJournalDayStartMs(nowMs);
    const { start } = segmentWindowMs(first.horaInicio, first.horaFin, journalStart);
    if (nowMs >= start) {
      return { allowed: true, segContext: first };
    }
  }

  // Tras las 05:00 sin vehículos: centinela aunque el primer segmento aún no haya empezado
  return { allowed: true, segContext: first };
}

export function isCentinelaBlockedByVehicles(vehicles: Vehicle[], nowMs = Date.now()): boolean {
  return hasRealActiveConsciousVehicle(vehicles, nowMs);
}

/** Cierra centinelas activos cuando hay trabajo consciente (evita entropía fantasma en el anillo). */
export async function archiveActiveCentinelasWhenBlocked(
  userId: string,
  vehicles: Vehicle[]
): Promise<string[]> {
  if (!isCentinelaBlockedByVehicles(vehicles)) return [];
  const active = vehicles.filter(v => v.autoVerdad && v.status === "activo");
  if (active.length === 0) return [];

  const { updateVehicle, updateVehicleStatus } = await import("./persistence.ts");
  const now = Date.now();
  const closedIds: string[] = [];

  for (const av of active) {
    const dur = Math.max(0, Math.round((now - (av.aperturaAt || now)) / 60000));
    try {
      await updateVehicle(userId, av.id, { cierreAt: now, duracionFinal: dur });
      await updateVehicleStatus(userId, av.id, "archivado");
      closedIds.push(av.id);
      console.log(`[Centinela] Cerrado por vehículo consciente activo: ${av.id} (${dur} min)`);
    } catch (e) {
      console.warn("[Centinela] archiveActiveCentinelasWhenBlocked:", av.id, e);
    }
  }
  return closedIds;
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
          ? `Vehículo activo: ${active.titulo}`
          : "Hay un vehículo consciente activo",
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
  const { addVehicle } = await import("./persistence.ts");
  await addVehicle(userId, {
    titulo: "Modo Centinela",
    criterioFin: "circunstancia",
    criterioDetalle: "Modo Verdad",
    tiempoInicio: new Date(centinelaAperturaAt),
    ejes: STUB_EJES,
    tipoTerminoRapido: "omitido",
    tipoFlota: "verdad",
    aperturaAt: centinelaAperturaAt,
    autoVerdad: true,
  });

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("SISTEMICAR - Modo Centinela Activado", {
      body: "Ningún vehículo activo. El centinela registra el vacío.",
      icon: "/favicon.ico",
      silent: false,
    });
  }
}
