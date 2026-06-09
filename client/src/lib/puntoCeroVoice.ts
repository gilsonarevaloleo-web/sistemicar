/** Susurros de guía nocturna — uno cada 60s en fase pasiva. */
export const SUSURROS_NOCHE: readonly string[] = [
  "Soltá la mandíbula. Nadie te apura.",
  "Dejá que el cuerpo se hunda en la cama o en la silla.",
  "La respiración va sola. Solo observala.",
  "Si aparece un pensamiento, dejalo pasar como una nube.",
  "Aflojá los hombros. No tenés que sostener nada ahora.",
  "El silencio te sostiene. Confiá en el punto neutro.",
  "Cada exhalación es una rendición amable.",
  "No hay tarea pendiente. Solo descanso.",
  "Tu sistema nervioso puede apagarse a su ritmo.",
  "Mañana retomás. Ahora, solo esto.",
];

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
  window.speechSynthesis.cancel();
}

export function mensajeReactivacionDia(): string {
  return "Fase Punto Cero completada. Energía restaurada. Retoma el vehículo.";
}

export function mensajePasivaDia(): string {
  return "Ancla del alivio consciente. Rastreá la fricción corporal y dejá ir con cada exhalación.";
}

export function mensajePasivaNoche(): string {
  return "Modo apagón. Silencio profundo. Solo respiración.";
}
