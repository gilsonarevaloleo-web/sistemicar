export type SpLogEntry = {
  id: string;
  amount: number;
  source: string;
  timestamp: Date;
};

/** Timestamp fiable de un log SP (fallback al epoch embebido en id sp_<ms>_). */
export function spLogEffectiveMs(entry: SpLogEntry): number {
  const ts = entry.timestamp.getTime();
  if (ts > 0 && !Number.isNaN(ts)) return ts;
  const match = entry.id.match(/^sp_(\d+)_/);
  return match ? Number(match[1]) : 0;
}

const DEDUP_WINDOW_MS = 30_000;

/**
 * Evita doble conteo local+Firebase del mismo award (mismo monto, misma fuente exacta,
 * timestamps cercanos). Awards distintos — p. ej. varios subs del desglosador — se conservan.
 */
export function mergeSovereigntyPointsLogs(logs: SpLogEntry[]): SpLogEntry[] {
  const seenIds = new Set<string>();
  const merged: SpLogEntry[] = [];

  for (const entry of logs) {
    if (seenIds.has(entry.id)) continue;

    const ms = spLogEffectiveMs(entry);
    const exactSource = entry.source || "Sistema";

    const isDuplicate = merged.some(kept => {
      if (kept.amount !== entry.amount) return false;
      if ((kept.source || "Sistema") !== exactSource) return false;
      return Math.abs(spLogEffectiveMs(kept) - ms) <= DEDUP_WINDOW_MS;
    });
    if (isDuplicate) continue;

    seenIds.add(entry.id);
    merged.push(entry);
  }

  return merged;
}
