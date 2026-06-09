/**
 * Puente voz ↔ segundo plano.
 * speechSynthesis no habla fuera de la pestaña en móvil; usamos notificaciones
 * programadas + cola de frases pendientes al volver a la app.
 */

import type { UbicacionVoiceSource } from "./speechQueue";
import { speakUbicacionSingle } from "./speechQueue";
import { isPuertaVozEnabled } from "./tikSound";

function postAttentionNotification(opts: {
  title: string;
  body: string;
  tag: string;
}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      icon: "/favicon.ico",
      tag: opts.tag,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = "/planeacion";
      n.close();
    };
  } catch {
    /* noop */
  }
}

const MISSED_VOICE_KEY = "sistemicar_missed_puerta_voice";
let memoryMissedQueue: MissedVoiceItem[] = [];

export type MissedVoiceItem = {
  text: string;
  source: UbicacionVoiceSource;
  at: number;
};

export function isAppInBackground(): boolean {
  if (typeof document === "undefined") return false;
  return document.hidden || !document.hasFocus();
}

function readMissedQueue(): MissedVoiceItem[] {
  try {
    if (typeof sessionStorage !== "undefined") {
      const raw = sessionStorage.getItem(MISSED_VOICE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MissedVoiceItem[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    /* fallback memoria */
  }
  return [...memoryMissedQueue];
}

function writeMissedQueue(items: MissedVoiceItem[]): void {
  const cutoff = Date.now() - 6 * 3600_000;
  const trimmed = items.filter(i => i.at >= cutoff).slice(-12);
  memoryMissedQueue = trimmed;
  try {
    if (typeof sessionStorage === "undefined") return;
    if (trimmed.length === 0) {
      sessionStorage.removeItem(MISSED_VOICE_KEY);
      return;
    }
    sessionStorage.setItem(MISSED_VOICE_KEY, JSON.stringify(trimmed));
  } catch {
    /* noop */
  }
}

export function peekMissedPuertaVoiceQueue(): MissedVoiceItem[] {
  return readMissedQueue();
}

export function clearMissedPuertaVoiceQueue(): void {
  writeMissedQueue([]);
}

export function enqueueMissedPuertaVoice(text: string, source: UbicacionVoiceSource = "puerta"): void {
  const phrase = text.trim();
  if (!phrase) return;
  const queue = readMissedQueue();
  if (queue.some(q => q.text === phrase)) return;
  queue.push({ text: phrase, source, at: Date.now() });
  writeMissedQueue(queue);
}

/** Reproduce frases que no pudieron hablarse en segundo plano. */
export function flushMissedPuertaVoiceOnVisible(): number {
  if (isAppInBackground()) return 0;
  const queue = readMissedQueue();
  if (queue.length === 0) return 0;
  writeMissedQueue([]);
  for (const item of queue) {
    speakUbicacionSingle(item.text, item.source);
  }
  return queue.length;
}

export function deliverPuertaVoice(
  text: string,
  opts?: {
    source?: UbicacionVoiceSource;
    notifyTitle?: string;
    notifyBody?: string;
    notifyTag?: string;
  }
): void {
  const phrase = text.trim();
  if (!phrase || !isPuertaVozEnabled()) return;
  const source = opts?.source ?? "puerta";

  if (isAppInBackground()) {
    enqueueMissedPuertaVoice(phrase, source);
    if (opts?.notifyTitle) {
      postAttentionNotification({
        title: opts.notifyTitle,
        body: opts.notifyBody ?? phrase,
        tag: opts.notifyTag ?? `puerta-voz-${Date.now()}`,
      });
    }
    return;
  }

  speakUbicacionSingle(phrase, source);
}

export function deliverSegmentEntropiaAlert(params: {
  nombre: string;
  reason: string;
  voicePhrase?: string;
}): void {
  const title = `ENTROPÍA: ${params.nombre}`;
  const body =
    params.reason === "missed_puerta"
      ? "Puerta abierta por el sistema. −2 PS. Cierra la puerta para recuperar +2 PS."
      : params.reason === "past_end"
        ? "No cerraste a tiempo. El sistema no perdona la omisión."
        : params.reason === "cruce_sin_cierre"
          ? "Vehículo del segmento anterior sin cierre consciente."
          : "Ventana de segmento perdida sin puerta consciente.";
  const phrase = params.voicePhrase ?? `Entropía en ${params.nombre}. ${body}`;

  if (isPuertaVozEnabled()) {
    deliverPuertaVoice(phrase, {
      source: "puerta",
      notifyTitle: title,
      notifyBody: body,
      notifyTag: `entropia-${params.nombre}`,
    });
  } else {
    postAttentionNotification({
      title,
      body,
      tag: `entropia-${params.nombre}`,
    });
  }
}
