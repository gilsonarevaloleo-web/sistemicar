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

/** Evita doble conteo local+Firebase (mismo monto en ventana de 10s, ids distintos). */
export function mergeSovereigntyPointsLogs(logs: SpLogEntry[]): SpLogEntry[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const merged: SpLogEntry[] = [];
  for (const entry of logs) {
    if (seenIds.has(entry.id)) continue;
    const ms = spLogEffectiveMs(entry);
    const key = `${entry.amount}|${Math.floor(ms / 10000)}`;
    if (seenKeys.has(key)) continue;
    seenIds.add(entry.id);
    seenKeys.add(key);
    merged.push(entry);
  }
  return merged;
}
