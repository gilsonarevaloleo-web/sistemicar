/**
 * Congela el valor visible de entropía ante lag UI o parpadeo de cobertura.
 * La verdad del hueco vive en entropyGapClock; esto evita resets espurios en pantalla.
 */
import { getJournalDayStartMs } from "./segmentTime";

let lastValidEntropyMin = 0;
let journalDayMs = 0;

export function resetLiveEntropyFreeze(nowMs = Date.now()): void {
  lastValidEntropyMin = 0;
  journalDayMs = getJournalDayStartMs(nowMs);
}

function ensureJournalDay(nowMs: number): void {
  const day = getJournalDayStartMs(nowMs);
  if (journalDayMs !== day) {
    journalDayMs = day;
    lastValidEntropyMin = 0;
  }
}

/**
 * En hueco: solo sube. En consciente: permite bajar (monotonic ya aplicó launch gate).
 */
export function clampLiveEntropyDisplay(
  candidate: number,
  nowMs: number,
  consciousNow: boolean
): number {
  ensureJournalDay(nowMs);
  const safe = Math.max(0, candidate);

  if (consciousNow) {
    if (safe + 0.05 < lastValidEntropyMin) {
      lastValidEntropyMin = safe;
      return safe;
    }
    lastValidEntropyMin = Math.max(lastValidEntropyMin, safe);
    return safe;
  }

  if (safe + 0.05 < lastValidEntropyMin) return lastValidEntropyMin;
  lastValidEntropyMin = Math.max(lastValidEntropyMin, safe);
  return lastValidEntropyMin;
}

export function getLiveEntropyFreezeDebug(): { lastValidEntropyMin: number; journalDayMs: number } {
  return { lastValidEntropyMin, journalDayMs };
}
