import type { SegmentoV5, Vehicle } from "./persistence";

export type NotificationState = { segmentos: SegmentoV5[]; vehicles: Vehicle[] };

let getNotificationState: (() => NotificationState | null) | null = null;

/** Estado vivo para validar alertas programadas al disparar (no al agendar). */
export function registerNotificationStateProvider(fn: () => NotificationState | null): () => void {
  getNotificationState = fn;
  return () => {
    if (getNotificationState === fn) getNotificationState = null;
  };
}

export function readNotificationState(): NotificationState | null {
  return getNotificationState?.() ?? null;
}

export function findSegmentInNotificationState(segId: string): SegmentoV5 | null {
  return readNotificationState()?.segmentos.find(s => s.id === segId) ?? null;
}
