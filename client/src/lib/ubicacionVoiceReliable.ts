/**
 * Voz de ubicación (desglosador conquista + ring situacional).
 * Reintenta si el navegador bloquea TTS sin gesto o si speechSynthesis queda colgado.
 */

import {
  recoverSpeechQueue,
  speakUbicacionQueue,
  warmupSpeechSynthesis,
  type UbicacionVoiceSource,
} from "./speechQueue";
import { isDesglosadorVoiceEnabled, isSituacionAlertsEnabled } from "./tikSound";

type PendingVoice = {
  phrases: string[];
  cancelPrevious: boolean;
  source: UbicacionVoiceSource;
  onSpoken?: () => void;
  spoken: boolean;
};

const pending = new Map<string, PendingVoice>();
const cleanupByKey = new Map<string, () => void>();

function isVoiceEnabledFor(source: UbicacionVoiceSource): boolean {
  if (source === "desglosador") return isDesglosadorVoiceEnabled();
  if (source === "situacion") return isSituacionAlertsEnabled();
  return true;
}

function trySpeak(key: string): void {
  const entry = pending.get(key);
  if (!entry || entry.spoken || !isVoiceEnabledFor(entry.source)) return;

  warmupSpeechSynthesis(true);
  recoverSpeechQueue();

  speakUbicacionQueue(entry.phrases, entry.cancelPrevious, entry.source, () => {
    const p = pending.get(key);
    if (!p || p.spoken) return;
    p.spoken = true;
    p.onSpoken?.();
    cleanupByKey.get(key)?.();
    cleanupByKey.delete(key);
    pending.delete(key);
  });
}

/**
 * Encola guion con reintentos (gesto, visibilidad, timeouts).
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

  if (!isVoiceEnabledFor(source)) {
    return () => {};
  }

  const filtered = phrases.map(p => p.trim()).filter(Boolean);
  if (filtered.length === 0) {
    return () => {};
  }

  pending.set(key, { phrases: filtered, cancelPrevious, source, onSpoken, spoken: false });

  trySpeak(key);

  const retryTimers = [800, 1800, 4500, 12_000].map(ms =>
    window.setTimeout(() => trySpeak(key), ms)
  );

  const onRetry = () => trySpeak(key);
  window.addEventListener("pointerdown", onRetry, { capture: true });
  document.addEventListener("visibilitychange", onRetry);
  window.addEventListener("focus", onRetry);

  const cleanup = () => {
    retryTimers.forEach(t => window.clearTimeout(t));
    window.removeEventListener("pointerdown", onRetry, { capture: true });
    document.removeEventListener("visibilitychange", onRetry);
    window.removeEventListener("focus", onRetry);
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

/** @deprecated usar cancelUbicacionVoice */
export function cancelDesglosadorVoice(key: string): void {
  cancelUbicacionVoice(key);
}
