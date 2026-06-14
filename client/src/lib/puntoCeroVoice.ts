import { warmupSpeechSynthesis } from "./speechQueue";
import { isPuntoCeroVoiceEnabled } from "./tikSound";
import {
  colorInmersionVoz,
  MENSAJE_PASIVA_DIA,
  MENSAJE_PASIVA_NOCHE,
  MENSAJE_REACTIVACION_DIA,
  PUNTO_CERO_ETAPA4_TRANSICION,
  PUNTO_CERO_ETAPAS,
  PUNTO_CERO_INTRO_VOZ,
} from "./puntoCeroGuides";

export type { PuntoCeroEtapaKey } from "./puntoCeroGuides";
export {
  colorInmersionVoz,
  MENSAJE_PASIVA_DIA,
  MENSAJE_PASIVA_NOCHE,
  mensajePasivaDia,
  mensajePasivaNoche,
  mensajeReactivacionDia,
  PUNTO_CERO_ETAPAS,
  PUNTO_CERO_ETAPAS_LIST,
} from "./puntoCeroGuides";
import type { PuntoCeroEtapaKey } from "./puntoCeroGuides";

/** Susurros de guía nocturna — uno cada 60s en fase pasiva. */
export const SUSURROS_NOCHE: readonly string[] = [
  "Soltá la mandíbula… nadie te apura.",
  "Dejá que el cuerpo se hunda… en la cama o en la silla.",
  "La respiración va sola… solo observala.",
  "Si aparece un pensamiento… dejalo pasar como una nube.",
  "Aflojá los hombros… no tenés que sostener nada ahora.",
  "El silencio te sostiene… confiá en el punto neutro.",
  "Cada exhalación… es una rendición amable.",
  "No hay tarea pendiente… solo descanso.",
  "Tu sistema nervioso… puede apagarse a su ritmo.",
  "Mañana retomás… ahora, solo esto.",
];

export type PuntoCeroVoiceProfile = "calm" | "night" | "day" | "reactivation";

const VOICE_PROFILES: Record<
  PuntoCeroVoiceProfile,
  { rate: number; pitch: number; volume: number; pauseMs: number }
> = {
  calm: { rate: 0.82, pitch: 0.95, volume: 0.55, pauseMs: 620 },
  night: { rate: 0.78, pitch: 0.92, volume: 0.48, pauseMs: 780 },
  day: { rate: 0.82, pitch: 0.95, volume: 0.55, pauseMs: 580 },
  reactivation: { rate: 0.88, pitch: 1, volume: 0.58, pauseMs: 420 },
};

let voicesCache: SpeechSynthesisVoice[] | null = null;
let pcQueue: string[] = [];
let pcSpeaking = false;
let pcPauseTimer: ReturnType<typeof setTimeout> | null = null;
let pcProfile: PuntoCeroVoiceProfile = "calm";

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  if (voicesCache?.length) return voicesCache;
  voicesCache = window.speechSynthesis.getVoices();
  return voicesCache;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}

/** Elige voz en español con tono suave (preferencia femenina si existe). */
export function pickPleasantSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  const es = voices.filter(v => /es/i.test(v.lang));
  const prefer = es.find(v =>
    /female|mujer|paulina|helena|lucia|monica|soledad|espa/i.test(`${v.name} ${v.voiceURI}`)
  );
  return prefer ?? es[0] ?? voices[0] ?? null;
}

/** @deprecated Usar pickPleasantSpanishVoice */
export function pickCalmDeepSpanishVoice(): SpeechSynthesisVoice | null {
  return pickPleasantSpanishVoice();
}

function clearPuntoCeroPauseTimer(): void {
  if (pcPauseTimer) {
    clearTimeout(pcPauseTimer);
    pcPauseTimer = null;
  }
}

function applyCalmVoice(u: SpeechSynthesisUtterance, profile: PuntoCeroVoiceProfile): void {
  const p = VOICE_PROFILES[profile];
  u.lang = "es-ES";
  u.rate = p.rate;
  u.pitch = p.pitch;
  u.volume = p.volume;
  const voice = pickCalmDeepSpanishVoice();
  if (voice) u.voice = voice;
}

function processPuntoCeroQueue(): void {
  if (pcSpeaking || pcQueue.length === 0) return;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    pcQueue = [];
    return;
  }

  const text = pcQueue.shift()!;
  pcSpeaking = true;
  const profile = pcProfile;
  const pauseMs = VOICE_PROFILES[profile].pauseMs;

  try {
    const u = new SpeechSynthesisUtterance(text);
    applyCalmVoice(u, profile);
    u.onend = () => {
      pcSpeaking = false;
      if (pcQueue.length > 0) {
        pcPauseTimer = setTimeout(processPuntoCeroQueue, pauseMs);
      }
    };
    u.onerror = () => {
      pcSpeaking = false;
      processPuntoCeroQueue();
    };
    window.speechSynthesis.speak(u);
  } catch {
    pcSpeaking = false;
    processPuntoCeroQueue();
  }
}

/** Encola frases con pausas — fluidez meditativa, sin cortes bruscos. */
export function speakPuntoCeroSequence(
  phrases: readonly string[],
  profile: PuntoCeroVoiceProfile = "calm",
  cancelPrevious = true
): void {
  const filtered = phrases.map(p => p.trim()).filter(Boolean);
  if (filtered.length === 0 || !isPuntoCeroVoiceEnabled()) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  warmupSpeechSynthesis(true);
  pcProfile = profile;

  if (cancelPrevious) {
    clearPuntoCeroPauseTimer();
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
    pcQueue = [];
    pcSpeaking = false;
  }

  pcQueue.push(...filtered);
  processPuntoCeroQueue();
}

export function susurroNocheTexto(sessionStartAt: number, now: number): string {
  const idx = Math.floor((now - sessionStartAt) / 60_000) % SUSURROS_NOCHE.length;
  return SUSURROS_NOCHE[idx]!;
}

export function speakPleasant(
  text: string,
  opts?: { rate?: number; pitch?: number; volume?: number }
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  u.rate = opts?.rate ?? 0.82;
  u.pitch = opts?.pitch ?? 0.95;
  u.volume = opts?.volume ?? 0.55;
  const voice = pickPleasantSpanishVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

export function stopPleasantVoice(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  clearPuntoCeroPauseTimer();
  pcQueue = [];
  pcSpeaking = false;
  window.speechSynthesis.cancel();
}

/** TTS de Punto Cero con warmup (requerido en móvil tras gesto del usuario). */
export function speakPuntoCeroGuide(
  text: string,
  opts?: { rate?: number; pitch?: number; volume?: number; profile?: PuntoCeroVoiceProfile }
): void {
  if (!text.trim() || !isPuntoCeroVoiceEnabled()) return;
  const profile = opts?.profile ?? "calm";
  if (opts?.rate != null || opts?.pitch != null || opts?.volume != null) {
    warmupSpeechSynthesis(true);
    speakPleasant(text, opts);
    return;
  }
  speakPuntoCeroSequence(splitMeditativePhrases(text), profile);
}

function splitMeditativePhrases(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|(?<=[;—])\s+/)
    .map(p => p.trim())
    .filter(Boolean);
}

export function speakEtapaPuntoCero(
  etapa: PuntoCeroEtapaKey,
  opts?: { intro?: boolean; transicionEtapa4?: boolean }
): void {
  const guide = PUNTO_CERO_ETAPAS[etapa];
  if (!guide.voz.length || !isPuntoCeroVoiceEnabled()) return;

  const sequence: string[] = opts?.intro ? [...PUNTO_CERO_INTRO_VOZ, ...guide.voz] : [...guide.voz];
  if (opts?.transicionEtapa4 && etapa === "etapa3") {
    sequence.push(...PUNTO_CERO_ETAPA4_TRANSICION);
  }
  speakPuntoCeroSequence(sequence, "calm");
}

export function speakEtapa4Intro(): void {
  speakPuntoCeroSequence(PUNTO_CERO_ETAPAS.etapa4.voz, "calm");
}

export function speakColorInmersion(zona: string, indice = 0, opts?: { incluirIntroEtapa4?: boolean }): void {
  const phrases: string[] = [];
  if (opts?.incluirIntroEtapa4) {
    phrases.push(...PUNTO_CERO_ETAPAS.etapa4.voz);
  }
  phrases.push(...colorInmersionVoz(zona, indice));
  speakPuntoCeroSequence(phrases, "calm");
}

export function speakReactivacionDia(): void {
  speakPuntoCeroSequence(MENSAJE_REACTIVACION_DIA, "reactivation");
}
