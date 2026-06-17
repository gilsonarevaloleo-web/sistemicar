/**
 * Voz de ubicación (desglosador conquista + ring situacional).
 * Reintenta si el navegador bloquea TTS sin gesto o si speechSynthesis queda colgado.
 */

import {
  recoverSpeechQueue,
  speakUbicacionQueue,
  unlockSpeechSynthesis,
  warmupSpeechSynthesis,
  isUbicacionPhraseQueued,
  isUbicacionSpeechActive,
  type UbicacionVoiceSource,
} from "./speechQueue";
import {
  isDesglosadorVoiceEnabled,
  isPuertaVozEnabled,
  isSituacionAlertsEnabled,
} from "./tikSound";

type PendingVoice = {
  phrases: string[];
  cancelPrevious: boolean;
  source: UbicacionVoiceSource;
  onSpoken?: () => void;
  spoken: boolean;
  attempts: number;
};

const pending = new Map<string, PendingVoice>();
const cleanupByKey = new Map<string, () => void>();
const MAX_RELIABLE_ATTEMPTS = 2;
let voiceRetryHubRegistered = false;

function isVoiceEnabledFor(source: UbicacionVoiceSource): boolean {
  if (source === "desglosador") return isDesglosadorVoiceEnabled();
  if (source === "situacion") return isSituacionAlertsEnabled();
  if (source === "puerta") return isPuertaVozEnabled();
  return true;
}

function markVoiceDelivered(key: string): void {
  const entry = pending.get(key);
  if (!entry || entry.spoken) return;
  entry.spoken = true;
  entry.onSpoken?.();
  cleanupByKey.get(key)?.();
  cleanupByKey.delete(key);
  pending.delete(key);
}

function trySpeak(key: string): void {
  const entry = pending.get(key);
  if (!entry || entry.spoken || !isVoiceEnabledFor(entry.source)) return;

  if (entry.attempts >= MAX_RELIABLE_ATTEMPTS) {
    markVoiceDelivered(key);
    return;
  }

  const phrase = entry.phrases[0];
  if (phrase && isUbicacionPhraseQueued(phrase)) {
    markVoiceDelivered(key);
    return;
  }

  if (entry.attempts > 0 && isUbicacionSpeechActive()) {
    markVoiceDelivered(key);
    return;
  }

  entry.attempts += 1;
  if (entry.attempts === 1) {
    unlockSpeechSynthesis(true);
  } else {
    warmupSpeechSynthesis(true);
  }
  recoverSpeechQueue();

  speakUbicacionQueue(entry.phrases, entry.cancelPrevious, entry.source, () => {
    markVoiceDelivered(key);
  });
}

/** Hub global visibility/focus — pointerdown vive en VoiceBootstrap (App.tsx). */
export function ensureUbicacionVoiceRetryHub(): void {
  if (voiceRetryHubRegistered || typeof window === "undefined") return;
  voiceRetryHubRegistered = true;
  const onRetry = () => retryAllPendingUbicacionVoice();
  document.addEventListener("visibilitychange", onRetry);
  window.addEventListener("focus", onRetry);
}

export function retryAllPendingUbicacionVoice(): void {
  for (const key of [...pending.keys()]) {
    const entry = pending.get(key);
    if (entry && !entry.spoken) trySpeak(key);
  }
}

/**
 * Encola guion con reintentos (gesto global, visibilidad, timeouts).
 * Solo marca `onSpoken` cuando el navegador realmente empieza a hablar.
 */
export function speakUbicacionVoiceReliable(
  key: string,
  phrases: string[],
  cancelPrevious: boolean,
  source: UbicacionVoiceSource,
  onSpoken?: () => void
): () => void {
  cleanupByKey.get(key)?.();
  ensureUbicacionVoiceRetryHub();

  if (!isVoiceEnabledFor(source)) {
    return () => {};
  }

  const filtered = phrases.map(p => p.trim()).filter(Boolean);
  if (filtered.length === 0) {
    return () => {};
  }

  pending.set(key, { phrases: filtered, cancelPrevious, source, onSpoken, spoken: false, attempts: 0 });

  trySpeak(key);

  const retryTimers = [1500, 4000].map(ms => window.setTimeout(() => trySpeak(key), ms));

  const cleanup = () => {
    retryTimers.forEach(t => window.clearTimeout(t));
    pending.delete(key);
    cleanupByKey.delete(key);
  };

  cleanupByKey.set(key, cleanup);
  return cleanup;
}

export function speakDesglosadorVoiceReliable(
  key: string,
  phrases: string[],
  cancelPrevious: boolean,
  onSpoken?: () => void
): () => void {
  return speakUbicacionVoiceReliable(key, phrases, cancelPrevious, "desglosador", onSpoken);
}

export function speakSituacionVoiceReliable(
  key: string,
  phrases: string[],
  cancelPrevious: boolean,
  onSpoken?: () => void
): () => void {
  return speakUbicacionVoiceReliable(key, phrases, cancelPrevious, "situacion", onSpoken);
}

export function cancelUbicacionVoice(key: string): void {
  cleanupByKey.get(key)?.();
}

/** Cancela voz pendiente de un vehículo (timers de retry incluidos). */
export function cancelUbicacionVoiceForVehicle(vehicleId: string): void {
  const scopedPrefix = `${vehicleId}:`;
  for (const key of [...cleanupByKey.keys()]) {
    if (key.startsWith(scopedPrefix) || key.includes(vehicleId)) {
      cleanupByKey.get(key)?.();
    }
  }
}

export function cancelAllUbicacionVoice(): void {
  for (const cleanup of cleanupByKey.values()) {
    cleanup();
  }
  cleanupByKey.clear();
  pending.clear();
}

/** @deprecated usar cancelUbicacionVoice */
export function cancelDesglosadorVoice(key: string): void {
  cancelUbicacionVoice(key);
}
