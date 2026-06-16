import type { SegmentAttentionEvent } from "./segmentAttentionEngine";

const DEDUP_STORAGE_KEY = "sistemicar_attention_toast_dedup_v1";
const MAX_KEYS_PER_DAY = 64;
const memoryDedup = new Map<string, Set<string>>();

function readDayKeys(fecha: string): Set<string> {
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(DEDUP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string[]>;
        return new Set(parsed[fecha] ?? []);
      }
    } catch {
      /* fallback memoria */
    }
  }
  return new Set(memoryDedup.get(fecha) ?? []);
}

function writeDayKeys(fecha: string, keys: Set<string>): void {
  const list = [...keys].slice(-MAX_KEYS_PER_DAY);
  memoryDedup.set(fecha, new Set(list));
  if (typeof sessionStorage === "undefined") return;
  try {
    const raw = sessionStorage.getItem(DEDUP_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    parsed[fecha] = list;
    sessionStorage.setItem(DEDUP_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* quota */
  }
}

export function attentionEventKey(fecha: string, ev: SegmentAttentionEvent): string {
  if (ev.type === "day_rollover_entropia") return `${fecha}:rollover:${ev.segId}`;
  if (ev.type === "voz_disparada") return `${fecha}:voz:${ev.segId}`;
  return `${fecha}:${ev.type}:${ev.segId}:${"reason" in ev ? ev.reason : ""}`;
}

/** Filtra eventos ya mostrados hoy (evita tormenta de toasts al ponerse al día). */
export function filterNewAttentionEvents(
  fecha: string,
  events: SegmentAttentionEvent[]
): SegmentAttentionEvent[] {
  if (events.length === 0) return [];
  const seen = readDayKeys(fecha);
  const fresh: SegmentAttentionEvent[] = [];
  for (const ev of events) {
    const key = attentionEventKey(fecha, ev);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(ev);
  }
  if (fresh.length > 0) writeDayKeys(fecha, seen);
  return fresh;
}

export function clearAttentionToastDedupForTests(): void {
  memoryDedup.clear();
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(DEDUP_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
