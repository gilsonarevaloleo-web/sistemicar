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
/** Tras esperar voces 450 ms, hablar igual con lang es-ES si la lista sigue vacía (móvil/incógnito). */
let voicesLoadBypass = false;
/** Safari/iOS/Chrome bloquean TTS hasta un speak() dentro de un gesto del usuario. */
let speechUnlocked = false;
let pendingOnPhraseStarted: (() => void) | null = null;
let pendingOnPhraseStartedArmed = false;
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
const VOICES_LOAD_WAIT_MS = 450;
const PHRASE_STARTED_FALLBACK_MS = 8_000;

export type SpeechDiagnostics = {
  synthAvailable: boolean;
  speechUnlocked: boolean;
  voiceCount: number;
  spanishVoiceCount: number;
  speaking: boolean;
  queueLength: number;
  channels: {
    situacion: boolean;
    desglosador: boolean;
    puerta: boolean;
  };
};

export type SpeakVoiceProbeResult = {
  ok: boolean;
  reason?: string;
};

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function primeVoicesOnce(): void {
  primeSpanishVoices();
  if (!voicesPrimed) voicesPrimed = true;
}

function primeSpanishVoicesReady(): boolean {
  primeVoicesOnce();
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.getVoices().length > 0;
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

  if (queue.length > 0 && !speaking && !speechUnlocked) {
    return;
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

export function isSpeechSynthesisUnlocked(): boolean {
  return speechUnlocked;
}

export function getSpeechDiagnostics(): SpeechDiagnostics {
  const synth = getSynth();
  const voices = synth?.getVoices() ?? [];
  const spanishVoiceCount = voices.filter(v => /^es/i.test(v.lang)).length;
  return {
    synthAvailable: !!synth,
    speechUnlocked,
    voiceCount: voices.length,
    spanishVoiceCount,
    speaking,
    queueLength: queue.length,
    channels: {
      situacion: isSituacionAlertsEnabled(),
      desglosador: isDesglosadorVoiceEnabled(),
      puerta: isPuertaVozEnabled(),
    },
  };
}

/** Solo tests — reinicia estado interno de la cola. */
export function resetSpeechQueueForTests(): void {
  cancelSpeechSynthesisHard();
  speechUnlocked = false;
  voicesPrimed = false;
  voicesLoadBypass = false;
}

/** Cancelación fulminante — teardown de sesión situacional / WebView móvil. */
export function cancelSpeechSynthesisHard(): void {
  clearStuckTimer();
  speaking = false;
  queue = [];
  pendingOnPhraseStarted = null;
  pendingOnPhraseStartedArmed = false;
  lastQueuedPhrase = "";
  lastQueuedAtMs = 0;
  try {
    getSynth()?.cancel();
  } catch {
    /* noop */
  }
  notifySpeechQueueIdle();
}

/**
 * Desbloquea speechSynthesis (obligatorio en móvil).
 * Debe llamarse sincrónicamente dentro de pointerdown/click del usuario.
 */
export function unlockSpeechSynthesis(fromUserGesture = false): void {
  const synth = getSynth();
  if (!synth) return;
  primeVoicesOnce();
  resumeSynthIfPaused();
  lastWarmupMs = Date.now();

  // Ya desbloqueado: no volver a synth.speak() en cada pointerdown (congela TTS en móvil).
  if (speechUnlocked) {
    if (queue.length > 0 && !speaking) processQueue();
    return;
  }

  try {
    const u = new SpeechSynthesisUtterance("\u200b");
    applyCalmSpanishUtterance(u);
    u.volume = fromUserGesture ? 0.02 : 0.001;
    u.rate = 1.15;
    u.onend = () => {
      speechUnlocked = true;
      processQueue();
    };
    u.onerror = () => {
      speechUnlocked = true;
      processQueue();
    };
    synth.speak(u);
    if (fromUserGesture) speechUnlocked = true;
  } catch {
    if (fromUserGesture) speechUnlocked = true;
  }

  if (speechUnlocked && queue.length > 0 && !speaking) {
    processQueue();
  }
}

function processQueue(): void {
  if (speaking || queue.length === 0) return;
  const synth = getSynth();
  if (!synth) {
    queue = [];
    return;
  }

  if (!speechUnlocked) return;

  primeVoicesOnce();
  resumeSynthIfPaused();

  if (!primeSpanishVoicesReady()) {
    if (!voicesLoadBypass) {
      voicesLoadBypass = true;
      const retry = () => processQueue();
      synth.addEventListener(
        "voiceschanged",
        () => {
          voicesLoadBypass = false;
          retry();
        },
        { once: true }
      );
      window.setTimeout(retry, VOICES_LOAD_WAIT_MS);
      return;
    }
  } else {
    voicesLoadBypass = false;
  }

  const text = queue.shift()!;
  speaking = true;
  armStuckReset();
  let phraseRetries = 0;
  const maxPhraseRetries = 2;

  const speakPhrase = () => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      applyCalmSpanishUtterance(u);
      let phraseStartedHandled = false;
      let phraseStartedFallbackTimer: ReturnType<typeof setTimeout> | null = null;

      const firePhraseStarted = () => {
        if (phraseStartedHandled || !pendingOnPhraseStartedArmed || !pendingOnPhraseStarted) return;
        phraseStartedHandled = true;
        if (phraseStartedFallbackTimer) {
          clearTimeout(phraseStartedFallbackTimer);
          phraseStartedFallbackTimer = null;
        }
        const cb = pendingOnPhraseStarted;
        pendingOnPhraseStarted = null;
        pendingOnPhraseStartedArmed = false;
        cb();
      };

      u.onstart = () => {
        if (!pendingOnPhraseStartedArmed || !pendingOnPhraseStarted) return;
        phraseStartedFallbackTimer = setTimeout(() => {
          firePhraseStarted();
        }, PHRASE_STARTED_FALLBACK_MS);
      };
      u.onend = () => {
        firePhraseStarted();
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
export function warmupSpeechSynthesis(force = false, fromUserGesture = false): void {
  if (fromUserGesture) {
    unlockSpeechSynthesis(true);
    return;
  }
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

/** Prueba audible — usar solo dentro de un click del usuario. */
export function speakVoiceProbe(source: UbicacionVoiceSource = "puerta"): SpeakVoiceProbeResult {
  const synth = getSynth();
  if (!synth) {
    return { ok: false, reason: "Sin speechSynthesis en este navegador" };
  }
  if (!isVoiceEnabledFor(source)) {
    return { ok: false, reason: "Canal de voz desactivado" };
  }

  unlockSpeechSynthesis(true);
  recoverSpeechQueue();
  speakUbicacionQueue(["SISTEMICAR. Voz activa, operador."], false, source);

  const diag = getSpeechDiagnostics();
  if (!diag.speechUnlocked) {
    return { ok: false, reason: "TTS bloqueado — tocá de nuevo en pantalla" };
  }
  if (diag.voiceCount === 0) {
    return { ok: true, reason: "Sin voces TTS — recarga o usa Chrome" };
  }
  return { ok: true };
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

  if (!speechUnlocked) {
    warmupSpeechSynthesis(true);
  } else {
    resumeSynthIfPaused();
    primeVoicesOnce();
  }

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
    pendingOnPhraseStartedArmed = false;
    lastQueuedPhrase = "";
    lastQueuedAtMs = 0;
  }

  pendingOnPhraseStarted = onPhraseStarted ?? null;
  pendingOnPhraseStartedArmed = !!onPhraseStarted;

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
    pendingOnPhraseStartedArmed = false;
    notifySpeechQueueIdle();
  }
}

export function speakUbicacionSingle(
  text: string,
  source: UbicacionVoiceSource = "situacion"
): void {
  speakUbicacionQueue([text], false, source);
}
