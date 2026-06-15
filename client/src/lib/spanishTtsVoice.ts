/** Selección de voz TTS en español — compartido por cola general y Punto Cero. */

let voicesCache: SpeechSynthesisVoice[] | null = null;

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

function scoreSpanishVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  const blob = `${v.name} ${v.voiceURI} ${v.lang}`.toLowerCase();
  if (/^es-es/i.test(v.lang)) score += 50;
  else if (/^es-/i.test(v.lang)) score += 28;
  if (/google.*espa(?!.*estados)/i.test(v.name)) score += 38;
  if (/microsoft.*(laura|elena|sabina|helena)/i.test(blob)) score += 42;
  if (/natural|neural|premium|online/i.test(blob)) score += 24;
  if (/female|mujer|helena|laura|sabina|elena|monica|paulina|soledad|paloma/i.test(blob)) score += 20;
  if (/male|hombre|diego|jorge|pablo|enrique|carlos|daniel|antonio|david/i.test(blob)) score -= 18;
  if (/estados unidos|latino|méxico|mexico|mexican/i.test(blob)) score -= 8;
  if (/english|en-us|en-gb/i.test(v.lang)) score -= 40;
  return score;
}

export function primeSpanishVoices(): void {
  loadVoices();
}

/** Voz en español clara — prioriza es-ES, neurales y timbre femenino del sistema. */
export function pickCalmDeepSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  const es = voices.filter(v => /^es/i.test(v.lang));
  const pool = es.length ? es : voices;
  const ranked = [...pool].sort((a, b) => scoreSpanishVoice(b) - scoreSpanishVoice(a));
  return ranked[0] ?? voices[0] ?? null;
}

/** Alias histórico — misma selección calmada es-ES. */
export const pickPleasantSpanishVoice = pickCalmDeepSpanishVoice;

/** Alertas operativas (puerta, situación, desglosador) — ritmo natural, sin ronquera. */
export function applyAlertSpanishUtterance(u: SpeechSynthesisUtterance): void {
  const voice = pickCalmDeepSpanishVoice();
  if (voice) u.voice = voice;
  u.lang = "es-ES";
  u.rate = 0.96;
  u.pitch = 1.02;
  u.volume = 0.94;
}

/** Alias histórico — alertas de ubicación. */
export function applyCalmSpanishUtterance(u: SpeechSynthesisUtterance): void {
  applyAlertSpanishUtterance(u);
}
