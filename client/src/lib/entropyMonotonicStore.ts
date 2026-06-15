/**
 * Acumulado monótono de entropía en vivo — persiste en localStorage por día-jornada.
 * Evita resets espurios por reconcile Firebase / cobertura intermitente.
 */
import { clearLiveGapClock } from "./entropyGapClock";
import { resetLiveEntropyFreeze } from "./entropyLiveFreeze";
import { getJournalDayStartMs } from "./segmentTime";

const STATE_KEY = "sistemicar_entropy_monotonic_v2";
const LAUNCH_GATE_KEY = "sistemicar_entropy_conscious_launch";

export interface EntropyMonotonicState {
  journalDayMs: number;
  floorMin: number;
  gapAnchorMs: number | null;
  updatedAtMs: number;
}

interface ConsciousLaunchGate {
  atMs: number;
  consumed: boolean;
}

let memoryState: EntropyMonotonicState | null = null;
let memoryLaunchGate: ConsciousLaunchGate | null = null;

function readStateFromStorage(): EntropyMonotonicState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EntropyMonotonicState;
  } catch {
    return null;
  }
}

function writeStateToStorage(state: EntropyMonotonicState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

function readLaunchGateFromStorage(): ConsciousLaunchGate | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAUNCH_GATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsciousLaunchGate;
  } catch {
    return null;
  }
}

function writeLaunchGateToStorage(gate: ConsciousLaunchGate | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (!gate) sessionStorage.removeItem(LAUNCH_GATE_KEY);
    else sessionStorage.setItem(LAUNCH_GATE_KEY, JSON.stringify(gate));
  } catch {
    /* ignore */
  }
}

function freshState(journalDayMs: number, nowMs: number): EntropyMonotonicState {
  return {
    journalDayMs,
    floorMin: 0,
    gapAnchorMs: null,
    updatedAtMs: nowMs,
  };
}

function loadState(journalDayMs: number, nowMs: number): EntropyMonotonicState {
  if (memoryState?.journalDayMs === journalDayMs) return memoryState;
  const stored = readStateFromStorage();
  if (stored?.journalDayMs === journalDayMs) {
    memoryState = stored;
    return stored;
  }
  memoryState = freshState(journalDayMs, nowMs);
  return memoryState;
}

function saveState(state: EntropyMonotonicState, persist: boolean): void {
  memoryState = state;
  if (persist) writeStateToStorage(state);
}

const PERSIST_MIN_DELTA = 0.1;

function shouldPersistMonotonicState(
  prev: EntropyMonotonicState,
  next: EntropyMonotonicState
): boolean {
  if (prev.journalDayMs !== next.journalDayMs) return true;
  if (prev.gapAnchorMs !== next.gapAnchorMs) return true;
  if (Math.abs(next.floorMin - prev.floorMin) >= PERSIST_MIN_DELTA) return true;
  return false;
}

function saveStateIfChanged(
  prev: EntropyMonotonicState,
  next: EntropyMonotonicState,
  persist: boolean
): void {
  memoryState = next;
  if (persist && shouldPersistMonotonicState(prev, next)) {
    writeStateToStorage(next);
  }
}

function readLaunchGate(): ConsciousLaunchGate | null {
  return memoryLaunchGate ?? readLaunchGateFromStorage();
}

function writeLaunchGate(gate: ConsciousLaunchGate | null, persist: boolean): void {
  memoryLaunchGate = gate;
  if (persist) writeLaunchGateToStorage(gate);
}

export function resetEntropyMonotonicState(): void {
  clearLiveGapClock();
  resetLiveEntropyFreeze();
  memoryState = null;
  memoryLaunchGate = null;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STATE_KEY);
    } catch {
      /* ignore */
    }
  }
  writeLaunchGate(null, true);
}

/** Llamar al lanzar vehículo consciente legítimo (Flota, Express, desglosador). */
export function recordConsciousVehicleLaunch(nowMs = Date.now()): void {
  clearLiveGapClock();
  resetLiveEntropyFreeze(nowMs);
  writeLaunchGate({ atMs: nowMs, consumed: false }, true);
}

function consumeConsciousLaunchGate(nowMs: number, persist: boolean): boolean {
  const gate = readLaunchGate();
  if (!gate || gate.consumed) return false;
  if (nowMs - gate.atMs > 180_000) {
    writeLaunchGate(null, persist);
    return false;
  }
  writeLaunchGate({ ...gate, consumed: true }, persist);
  return true;
}

/**
 * Aplica piso monótono al contador visible.
 * - En hueco: solo sube (max con motor crudo).
 * - Con cobertura consciente: solo baja tras lanzamiento explícito registrado.
 */
export function applyMonotonicLiveEntropy(params: {
  rawMin: number;
  nowMs: number;
  consciousNow: boolean;
  /** Tests: no escribe localStorage. */
  persist?: boolean;
}): number {
  const { rawMin, nowMs, consciousNow } = params;
  const persist = params.persist !== false;
  const journalDayMs = getJournalDayStartMs(nowMs);
  const state = loadState(journalDayMs, nowMs);

  if (consciousNow) {
    const allowDecrease = consumeConsciousLaunchGate(nowMs, persist);
    if (allowDecrease || rawMin + 0.05 >= state.floorMin) {
      const next: EntropyMonotonicState = {
        ...state,
        floorMin: Math.max(0, rawMin),
        gapAnchorMs: null,
        updatedAtMs: nowMs,
      };
      saveStateIfChanged(state, next, persist);
      return next.floorMin;
    }
    const next: EntropyMonotonicState = { ...state, updatedAtMs: nowMs };
    saveStateIfChanged(state, next, persist);
    return state.floorMin;
  }

  const next: EntropyMonotonicState = {
    ...state,
    gapAnchorMs: state.gapAnchorMs ?? nowMs,
    floorMin: Math.max(state.floorMin, rawMin),
    updatedAtMs: nowMs,
  };
  saveStateIfChanged(state, next, persist);
  return next.floorMin;
}

export function getEntropyMonotonicDebugState(nowMs = Date.now()): EntropyMonotonicState | null {
  const journalDayMs = getJournalDayStartMs(nowMs);
  const state = memoryState ?? readStateFromStorage();
  if (!state || state.journalDayMs !== journalDayMs) return null;
  return state;
}
