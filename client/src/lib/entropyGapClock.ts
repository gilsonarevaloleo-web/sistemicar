/**
 * Entropía del hueco en vivo = baseline sellado + minutos planificados (now − gapAnchor).
 * Inmune a ticks 1s/5s y a parpadeo de vehículos en Firebase.
 */
import type { SegmentoAnilloLite } from "@/engines/ConcienciaEngine";
import { getJournalDayStartMs, getLimaDayStartMs, segmentWindowMs } from "./segmentTime";

const GAP_STATE_KEY = "sistemicar_entropy_live_gap_v1";

export interface LiveGapClockState {
  journalDayMs: number;
  gapAnchorMs: number;
  baselineEntropyMin: number;
}

let memoryGap: LiveGapClockState | null = null;

function readGapFromStorage(): LiveGapClockState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(GAP_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LiveGapClockState;
  } catch {
    return null;
  }
}

function writeGapToStorage(state: LiveGapClockState | null): void {
  if (state && memoryGap) {
    const same =
      memoryGap.journalDayMs === state.journalDayMs &&
      memoryGap.gapAnchorMs === state.gapAnchorMs &&
      memoryGap.baselineEntropyMin === state.baselineEntropyMin;
    if (same) return;
  }
  if (!state && memoryGap === null) return;

  memoryGap = state;
  if (typeof localStorage === "undefined") return;
  try {
    if (!state) localStorage.removeItem(GAP_STATE_KEY);
    else localStorage.setItem(GAP_STATE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function clearLiveGapClock(): void {
  writeGapToStorage(null);
}

export function resetLiveGapClockForTests(): void {
  clearLiveGapClock();
}

export function getLiveGapClockState(nowMs = Date.now()): LiveGapClockState | null {
  const journalDay = getJournalDayStartMs(nowMs);
  const state = memoryGap ?? readGapFromStorage();
  if (!state || state.journalDayMs !== journalDay) return null;
  memoryGap = state;
  return state;
}

/** Inicia o congela un hueco inconsciente con baseline inmutable. */
export function armLiveGapClock(params: {
  gapAnchorMs: number;
  baselineEntropyMin: number;
  nowMs?: number;
}): LiveGapClockState {
  const nowMs = params.nowMs ?? Date.now();
  const state: LiveGapClockState = {
    journalDayMs: getJournalDayStartMs(nowMs),
    gapAnchorMs: params.gapAnchorMs,
    baselineEntropyMin: Math.max(0, params.baselineEntropyMin),
  };
  writeGapToStorage(state);
  return state;
}

function overlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

/** Minutos planificados entre dos instantes (segmentos HH:mm). */
export function plannedMinutesBetween(
  segmentos: SegmentoAnilloLite[],
  limaDayStartMs: number,
  fromMs: number,
  toMs: number
): number {
  if (toMs <= fromMs) return 0;
  if (segmentos.length === 0) {
    return (toMs - fromMs) / 60000;
  }
  let totalMs = 0;
  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(seg.horaInicio || "00:00", seg.horaFin || "00:00", limaDayStartMs);
    totalMs += overlapMs(fromMs, toMs, start, end);
  }
  return totalMs / 60000;
}

/**
 * Entropía en vivo durante hueco: baseline + reloj físico en ventanas planificadas.
 */
export function computeTimestampGapEntropyMin(params: {
  segmentos: SegmentoAnilloLite[];
  nowMs: number;
  gapState: LiveGapClockState;
}): number {
  const limaDayStartMs = getLimaDayStartMs(params.nowMs);
  const clockMin = plannedMinutesBetween(
    params.segmentos,
    limaDayStartMs,
    params.gapState.gapAnchorMs,
    params.nowMs
  );
  return Math.round((params.gapState.baselineEntropyMin + clockMin) * 10) / 10;
}
