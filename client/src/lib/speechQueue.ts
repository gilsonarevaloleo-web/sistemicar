/** Cola secuencial para speechSynthesis — evita que utterances se cancelen entre sí. */

import {
  isDesglosadorVoiceEnabled,
  isPuertaVozEnabled,
  isSituacionAlertsEnabled,
} from "./tikSound";

export type UbicacionVoiceSource = "situacion" | "desglosador" | "puerta";

function isVoiceEnabledFor(source: UbicacionVoiceSource): boolean {
  if (source === "puerta") return isPuertaVozEnabled();
  if (source === "desglosador") return isDesglosadorVoiceEnabled();
  return isSituacionAlertsEnabled();
}

let queue: string[] = [];
let speaking = false;
let lastWarmupMs = 0;
let stuckTimer: ReturnType<typeof setTimeout> | null = null;
const idleListeners = new Set<() => void>();

function notifySpeechQueueIdle(): void {
  if (speaking || queue.length > 0) return;
  idleListeners.forEach(fn => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
}

/** Se dispara cuando la cola quedó vacía y no hay utterance activo. */
export function subscribeSpeechQueueIdle(listener: () => void): () => void {
  idleListeners.add(listener);
  return () => idleListeners.delete(listener);
}

const STUCK_SPEAK_MS = 45_000;
const WARMUP_REFRESH_MS = 20 * 60_000;

function clearStuckTimer(): void {
  if (stuckTimer) {
    clearTimeout(stuckTimer);
    stuckTimer = null;
  }
}

function armStuckReset(): void {
  clearStuckTimer();
  stuckTimer = setTimeout(() => {
    if (!speaking) return;
    speaking = false;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* noop */
    }
    processQueue();
  }, STUCK_SPEAK_MS);
}

/** Libera cola atascada (p. ej. pestaña en segundo plano). */
export function recoverSpeechQueue(): void {
  speaking = false;
  clearStuckTimer();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
  processQueue();
}

function processQueue(): void {
  if (speaking || queue.length === 0) return;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    queue = [];
    return;
  }
  const text = queue.shift()!;
  speaking = true;
  armStuckReset();
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.onend = () => {
      speaking = false;
      clearStuckTimer();
      processQueue();
      notifySpeechQueueIdle();
    };
    u.onerror = () => {
      speaking = false;
      clearStuckTimer();
      processQueue();
      notifySpeechQueueIdle();
    };
    window.speechSynthesis.speak(u);
  } catch {
    speaking = false;
    clearStuckTimer();
    processQueue();
  }
}

/**
 * Desbloquea TTS tras gesto del usuario.
 * Se re-ejecuta si pasó tiempo (navegadores revocan autoplay al cabo de rato).
 */
export function warmupSpeechSynthesis(force = false): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const now = Date.now();
  if (!force && now - lastWarmupMs < WARMUP_REFRESH_MS) return;
  lastWarmupMs = now;
  try {
    window.speechSynthesis.getVoices();
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    /* noop */
  }
}

/** Encola frases y las reproduce en orden. cancelPrevious=true cancela lo anterior (nuevo sub). */
export function speakUbicacionQueue(
  phrases: string[],
  cancelPrevious = false,
  source: UbicacionVoiceSource = "situacion"
): void {
  const filtered = phrases.map(p => p.trim()).filter(Boolean);
  if (filtered.length === 0) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  if (!isVoiceEnabledFor(source)) return;

  warmupSpeechSynthesis();

  if (cancelPrevious) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
    queue = [];
    speaking = false;
    clearStuckTimer();
  }

  queue.push(...filtered);
  processQueue();
  if (!speaking && queue.length === 0) notifySpeechQueueIdle();
}

export function speakUbicacionSingle(
  text: string,
  source: UbicacionVoiceSource = "situacion"
): void {
  speakUbicacionQueue([text], false, source);
}
