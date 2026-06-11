import { warmupSpeechSynthesis } from "./speechQueue";
import { isPuntoCeroVoiceEnabled } from "./tikSound";

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

export type PuntoCeroEtapaKey = "etapa1" | "etapa2" | "etapa3" | "etapa4";
export type PuntoCeroVoiceProfile = "calm" | "night" | "day" | "reactivation";

/** Guía hablada en frases cortas — pausas naturales entre cada una. */
export const ETAPA_VOZ: Record<PuntoCeroEtapaKey, readonly string[]> = {
  etapa1: [
    "Tensión… y quietud.",
    "Tensá el cuerpo… de la cabeza a los pies.",
    "Soltá todo… y quedate en quietud.",
  ],
  etapa2: [
    "Identificá el pensamiento.",
    "¿Qué estoy pensando?",
    "Lo nombro… y apago ese movimiento.",
  ],
  etapa3: [
    "Ritmo y respiración.",
    "Sentí el ritmo tal como está… sin corregir.",
    "Jugá con polos opuestos… retención y apnea… a tu medida.",
  ],
  etapa4: [
    "Alimento de colores.",
    "Tocá cada color… para inhalarlo en su zona.",
  ],
};

const VOICE_PROFILES: Record<
  PuntoCeroVoiceProfile,
  { rate: number; pitch: number; volume: number; pauseMs: number }
> = {
  calm: { rate: 0.7, pitch: 0.8, volume: 0.46, pauseMs: 720 },
  night: { rate: 0.64, pitch: 0.76, volume: 0.38, pauseMs: 900 },
  day: { rate: 0.72, pitch: 0.82, volume: 0.48, pauseMs: 680 },
  reactivation: { rate: 0.78, pitch: 0.88, volume: 0.52, pauseMs: 500 },
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

/** Voz en español profunda y calmada (preferencia masculina / grave si existe). */
export function pickCalmDeepSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  const es = voices.filter(v => /es/i.test(v.lang));
  const pool = es.length ? es : voices;
  const deep = pool.find(v =>
    /male|hombre|diego|jorge|pablo|enrique|carlos|daniel|antonio|baritone|deep|bass/i.test(
      `${v.name} ${v.voiceURI}`
    )
  );
  const soft = pool.find(v =>
    /google español(?!.*estados)/i.test(v.name) || /microsoft.*espa/i.test(v.name)
  );
  return deep ?? soft ?? pool[0] ?? voices[0] ?? null;
}

/** @deprecated Usar pickCalmDeepSpanishVoice */
export function pickPleasantSpanishVoice(): SpeechSynthesisVoice | null {
  return pickCalmDeepSpanishVoice();
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
  u.rate = opts?.rate ?? VOICE_PROFILES.calm.rate;
  u.pitch = opts?.pitch ?? VOICE_PROFILES.calm.pitch;
  u.volume = opts?.volume ?? VOICE_PROFILES.calm.volume;
  const voice = pickCalmDeepSpanishVoice();
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
    .split(/(?<=[.!?…])\s+/)
    .map(p => p.trim())
    .filter(Boolean);
}

export function speakEtapaPuntoCero(
  etapa: PuntoCeroEtapaKey,
  opts?: { intro?: boolean }
): void {
  const phrases = [...ETAPA_VOZ[etapa]];
  if (!phrases.length || !isPuntoCeroVoiceEnabled()) return;

  const sequence = opts?.intro ? ["Punto Cero.", "Polo neutro.", ...phrases] : phrases;
  if (etapa === "etapa3") {
    sequence.push(...ETAPA_VOZ.etapa4);
  }
  speakPuntoCeroSequence(sequence, "calm");
}

export function speakColorInmersion(zona: string): void {
  speakPuntoCeroSequence(
    [`${zona}…`, "Inhálalo…", "Introdúcelo en su zona."],
    "calm"
  );
}

export function mensajeReactivacionDia(): string {
  return "Punto Cero completado. Energía restaurada. Retomá el vehículo.";
}

export const MENSAJE_PASIVA_DIA: readonly string[] = [
  "Ancla del alivio consciente.",
  "Rastreá la fricción corporal…",
  "Dejá ir… con cada exhalación.",
];

export const MENSAJE_PASIVA_NOCHE: readonly string[] = [
  "Modo apagón.",
  "Silencio profundo…",
  "Solo la respiración.",
];

export function mensajePasivaDia(): string {
  return MENSAJE_PASIVA_DIA.join(" ");
}

export function mensajePasivaNoche(): string {
  return MENSAJE_PASIVA_NOCHE.join(" ");
}
