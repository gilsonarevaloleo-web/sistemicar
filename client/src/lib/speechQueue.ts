/** Cola secuencial para speechSynthesis — evita que utterances se cancelen entre sí. */

import { applyCalmSpanishUtterance, primeSpanishVoices } from "./spanishTtsVoice";
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
let voicesPrimed = false;
let pendingOnPhraseStarted: (() => void) | null = null;
const idleListeners = new Set<() => void>();
let lastQueuedPhrase = "";
let lastQueuedAtMs = 0;

const PHRASE_ENQUEUE_DEDUP_MS = 90_000;

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

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function primeVoicesOnce(): void {
  if (voicesPrimed) return;
  voicesPrimed = true;
  primeSpanishVoices();
}

function resumeSynthIfPaused(): void {
  const synth = getSynth();
  if (!synth) return;
  try {
    if (synth.paused) synth.resume();
  } catch {
    /* noop */
  }
}

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
      getSynth()?.cancel();
    } catch {
      /* noop */
    }
    processQueue();
  }, STUCK_SPEAK_MS);
}

export function isUbicacionPhraseQueued(text: string): boolean {
  const phrase = text.trim();
  if (!phrase) return false;
  return queue.includes(phrase);
}

export function isUbicacionSpeechActive(): boolean {
  const synth = getSynth();
  return speaking || !!(synth?.speaking || synth?.pending);
}

function isBackground(): boolean {
  if (typeof document === "undefined") return false;
  /** Solo pestaña oculta: !hasFocus() mandaba voz al buffer sin reproducir en desktop. */
  return document.hidden;
}

function enqueueForBackground(phrases: string[], source: UbicacionVoiceSource): void {
  void import("./backgroundAttentionAlerts").then(mod => {
    for (const phrase of phrases) {
      mod.enqueueMissedPuertaVoice(phrase, source);
    }
  });
}

/** Libera cola atascada sin cancelar frases en curso si el sintetizador sigue activo. */
export function recoverSpeechQueue(): void {
  const synth = getSynth();
  if (!synth) return;

  resumeSynthIfPaused();
  primeVoicesOnce();

  const synthSpeaking = synth.speaking;
  const flagStuck = speaking && !synthSpeaking;

  if (flagStuck) {
    speaking = false;
    clearStuckTimer();
  }

  if (queue.length > 0 && !speaking) {
    processQueue();
    return;
  }

  if (flagStuck && queue.length === 0) {
    try {
      synth.cancel();
    } catch {
      /* noop */
    }
  }
}

function processQueue(): void {
  if (speaking || queue.length === 0) return;
  const synth = getSynth();
  if (!synth) {
    queue = [];
    return;
  }

  primeVoicesOnce();
  resumeSynthIfPaused();

  const text = queue.shift()!;
  speaking = true;
  armStuckReset();
  let phraseRetries = 0;
  const maxPhraseRetries = 1;

  const speakPhrase = () => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      applyCalmSpanishUtterance(u);
      u.onstart = () => {
        if (pendingOnPhraseStarted) {
          const cb = pendingOnPhraseStarted;
          pendingOnPhraseStarted = null;
          cb();
        }
      };
      u.onend = () => {
        speaking = false;
        clearStuckTimer();
        processQueue();
        notifySpeechQueueIdle();
      };
      u.onerror = () => {
        if (phraseRetries < maxPhraseRetries) {
          phraseRetries += 1;
          speaking = false;
          clearStuckTimer();
          warmupSpeechSynthesis(true);
          resumeSynthIfPaused();
          window.setTimeout(speakPhrase, 280);
          return;
        }
        speaking = false;
        clearStuckTimer();
        processQueue();
        notifySpeechQueueIdle();
      };
      synth.speak(u);
    } catch {
      speaking = false;
      clearStuckTimer();
      processQueue();
    }
  };

  try {
    speakPhrase();
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
  const synth = getSynth();
  if (!synth) return;
  const now = Date.now();
  if (!force && now - lastWarmupMs < WARMUP_REFRESH_MS) return;
  lastWarmupMs = now;
  try {
    primeVoicesOnce();
    resumeSynthIfPaused();
  } catch {
    /* noop */
  }
}

/**
 * Encola frases y las reproduce en orden.
 * cancelPrevious=true cancela lo anterior (nuevo sub).
 * onPhraseStarted se dispara cuando el navegador realmente empieza a hablar la primera frase.
 */
export function speakUbicacionQueue(
  phrases: string[],
  cancelPrevious = false,
  source: UbicacionVoiceSource = "situacion",
  onPhraseStarted?: () => void
): void {
  const filtered = phrases.map(p => p.trim()).filter(Boolean);
  if (filtered.length === 0) return;
  if (!getSynth()) return;

  if (!isVoiceEnabledFor(source)) return;

  if (isBackground()) {
    enqueueForBackground(filtered, source);
    return;
  }

  warmupSpeechSynthesis(true);

  if (cancelPrevious) {
    try {
      getSynth()?.cancel();
    } catch {
      /* noop */
    }
    queue = [];
    speaking = false;
    clearStuckTimer();
    pendingOnPhraseStarted = null;
    lastQueuedPhrase = "";
    lastQueuedAtMs = 0;
  }

  pendingOnPhraseStarted = onPhraseStarted ?? null;

  const now = Date.now();
  for (const phrase of filtered) {
    if (
      phrase === lastQueuedPhrase &&
      now - lastQueuedAtMs < PHRASE_ENQUEUE_DEDUP_MS &&
      (isUbicacionPhraseQueued(phrase) || isUbicacionSpeechActive())
    ) {
      continue;
    }
    queue.push(phrase);
    lastQueuedPhrase = phrase;
    lastQueuedAtMs = now;
  }
  processQueue();
  if (!speaking && queue.length === 0) {
    pendingOnPhraseStarted = null;
    notifySpeechQueueIdle();
  }
}

export function speakUbicacionSingle(
  text: string,
  source: UbicacionVoiceSource = "situacion"
): void {
  speakUbicacionQueue([text], false, source);
}
