import { getJournalDayStartMs } from "./segmentTime";
import { spLogEffectiveMs, type SpLogEntry } from "./dailyPointsCollect";
import type { SovereigntyPointsLog } from "./persistence";

function isInJournalDay(ts: number, journalStartMs: number): boolean {
  return ts >= journalStartMs;
}

export function getJournalSpLogs<T extends SpLogEntry>(logs: T[], journalStartMs = getJournalDayStartMs()): T[] {
  return logs.filter(l => isInJournalDay(spLogEffectiveMs(l), journalStartMs));
}

export function hasJournalSpExactSource(
  logs: SpLogEntry[],
  source: string,
  journalStartMs = getJournalDayStartMs()
): boolean {
  return getJournalSpLogs(logs, journalStartMs).some(
    l => (l.source || "Sistema") === source
  );
}

export function hasJournalSpSourcePrefix(
  logs: SpLogEntry[],
  prefix: string,
  journalStartMs = getJournalDayStartMs()
): boolean {
  return getJournalSpLogs(logs, journalStartMs).some(l =>
    (l.source || "Sistema").startsWith(prefix)
  );
}

/** Extrae id de sub de fuentes tipo `… [subId]`. */
function extractBracketId(source: string): string | null {
  const m = source.match(/\[([^\]]+)\]\s*$/);
  return m?.[1] ?? null;
}

/** Extrae vehicleId de fuentes `… [vehicleId]…`. */
function extractVehicleIdFromSource(source: string): string | null {
  const m = source.match(/\[([a-zA-Z0-9_-]+)\]/);
  return m?.[1] ?? null;
}

const MAX_DEPTH_PS_PER_VEHICLE_DAY = 420;

/**
 * Elimina PS duplicados del día-jornada por reintentos de cierre / profundidad reseteada.
 * Conserva el primer award idempotente de cada ciclo, sub y nivel de profundidad.
 */
export function sanitizeJournalSpLogs(
  logs: SovereigntyPointsLog[],
  journalStartMs = getJournalDayStartMs()
): { logs: SovereigntyPointsLog[]; removed: number; journalTotal: number } {
  const journal = getJournalSpLogs(logs, journalStartMs).sort(
    (a, b) => spLogEffectiveMs(a) - spLogEffectiveMs(b)
  );
  const before = journal.length;
  const older = logs.filter(l => !isInJournalDay(spLogEffectiveMs(l), journalStartMs));

  const seenCycle = new Set<string>();
  const seenSub = new Set<string>();
  const depthByVehicle = new Map<string, number>();
  const keptJournal: SovereigntyPointsLog[] = [];

  for (const entry of journal) {
    const source = entry.source || "Sistema";

    if (source.startsWith("Cierre ciclo desglosador")) {
      const vehicleId = extractVehicleIdFromSource(source) ?? source;
      if (seenCycle.has(vehicleId)) continue;
      seenCycle.add(vehicleId);
      keptJournal.push(entry);
      continue;
    }

    if (source.startsWith("Desglosador ·") && source.includes("[")) {
      const subId = extractBracketId(source);
      if (subId) {
        if (seenSub.has(subId)) continue;
        seenSub.add(subId);
      }
      keptJournal.push(entry);
      continue;
    }

    if (source.startsWith("Profundidad desglosador")) {
      const vehicleId = extractVehicleIdFromSource(source) ?? "_legacy_";
      const nivelMatch = source.match(/nivel:(\d+)/);
      const nivel = nivelMatch ? Number(nivelMatch[1]) : null;
      const prev = depthByVehicle.get(vehicleId) ?? 0;

      if (nivel != null && !Number.isNaN(nivel)) {
        if (nivel <= prev) continue;
        if (nivel > MAX_DEPTH_PS_PER_VEHICLE_DAY) continue;
        depthByVehicle.set(vehicleId, nivel);
        keptJournal.push(entry);
        continue;
      }

      const next = prev + entry.amount;
      if (entry.amount <= 0 || next > MAX_DEPTH_PS_PER_VEHICLE_DAY) continue;
      if (entry.amount > 80 && prev > 0) continue;
      depthByVehicle.set(vehicleId, next);
      keptJournal.push(entry);
      continue;
    }

    keptJournal.push(entry);
  }

  const all = [...older, ...keptJournal].sort(
    (a, b) => spLogEffectiveMs(b) - spLogEffectiveMs(a)
  );
  const journalTotal = keptJournal.reduce((s, l) => s + l.amount, 0);
  return { logs: all, removed: before - keptJournal.length, journalTotal };
}
