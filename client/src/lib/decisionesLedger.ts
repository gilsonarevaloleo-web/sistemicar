import { getJournalDayStartMs } from "./segmentTime";

export type DecisionKind = "sub_desglosador" | "sub_situacion" | "mision_directa";

export interface DecisionLedgerEntry {
  key: string;
  kind: DecisionKind;
  vehicleId: string;
  ts: number;
}

const LEDGER_PREFIX = "sistemicar_decisiones_ledger_";

function storageKey(userId: string, dayStartMs: number): string {
  return `${LEDGER_PREFIX}${userId}_${dayStartMs}`;
}

function readAll(userId: string): DecisionLedgerEntry[] {
  try {
    const raw = localStorage.getItem(`${LEDGER_PREFIX}${userId}_index`);
    if (!raw) return [];
    const keys: string[] = JSON.parse(raw);
    const entries: DecisionLedgerEntry[] = [];
    for (const k of keys) {
      const dayRaw = localStorage.getItem(k);
      if (!dayRaw) continue;
      const parsed = JSON.parse(dayRaw) as DecisionLedgerEntry[];
      if (Array.isArray(parsed)) entries.push(...parsed);
    }
    return entries;
  } catch {
    return [];
  }
}

function writeDay(userId: string, dayStartMs: number, entries: DecisionLedgerEntry[]): void {
  const key = storageKey(userId, dayStartMs);
  localStorage.setItem(key, JSON.stringify(entries));
  try {
    const indexKey = `${LEDGER_PREFIX}${userId}_index`;
    const raw = localStorage.getItem(indexKey);
    const keys = new Set<string>(raw ? JSON.parse(raw) : []);
    keys.add(key);
    const cutoff = getJournalDayStartMs() - 8 * 86400000;
    for (const k of [...keys]) {
      const dayMs = Number(k.split("_").pop());
      if (!Number.isNaN(dayMs) && dayMs < cutoff) {
        localStorage.removeItem(k);
        keys.delete(k);
      }
    }
    localStorage.setItem(indexKey, JSON.stringify([...keys]));
  } catch {
    /* noop */
  }
}

/** Registra una decisión ejecutada (append-only, idempotente por key). */
export function recordDecision(
  userId: string,
  entry: { key: string; kind: DecisionKind; vehicleId: string; ts?: number }
): void {
  const ts = entry.ts ?? Date.now();
  const dayStartMs = getJournalDayStartMs(ts);
  const key = storageKey(userId, dayStartMs);
  let day: DecisionLedgerEntry[] = [];
  try {
    const raw = localStorage.getItem(key);
    day = raw ? (JSON.parse(raw) as DecisionLedgerEntry[]) : [];
  } catch {
    day = [];
  }
  if (day.some(e => e.key === entry.key)) return;
  day.push({ key: entry.key, kind: entry.kind, vehicleId: entry.vehicleId, ts });
  writeDay(userId, dayStartMs, day);
}

export function getDecisionLedger(userId: string, dayStartMs = getJournalDayStartMs()): DecisionLedgerEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, dayStartMs));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DecisionLedgerEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function countDecisionesFromLedger(entries: DecisionLedgerEntry[]): {
  subsTiempo: number;
  subsSituacion: number;
  misionesDirectas: number;
  decisiones: number;
} {
  let subsTiempo = 0;
  let subsSituacion = 0;
  let misionesDirectas = 0;
  for (const e of entries) {
    if (e.kind === "sub_desglosador") subsTiempo++;
    else if (e.kind === "sub_situacion") subsSituacion++;
    else if (e.kind === "mision_directa") misionesDirectas++;
  }
  return {
    subsTiempo,
    subsSituacion,
    misionesDirectas,
    decisiones: subsTiempo + subsSituacion + misionesDirectas,
  };
}

export function decisionKeySubDesglosador(vehicleId: string, subId: string): string {
  return `sub_desglosador:${vehicleId}:${subId}`;
}

export function decisionKeySubSituacion(vehicleId: string, subId: string): string {
  return `sub_situacion:${vehicleId}:${subId}`;
}

export function decisionKeyMision(vehicleId: string): string {
  return `mision:${vehicleId}`;
}

/** Expone lectura total para tests / depuración. */
export function getAllDecisionLedgerEntries(userId: string): DecisionLedgerEntry[] {
  return readAll(userId);
}
