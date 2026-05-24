/** Cola secuencial para speechSynthesis — evita que utterances se cancelen entre sí. */

import { isSituacionAlertsEnabled } from "./tikSound";

let queue: string[] = [];
let speaking = false;
let warmedUp = false;

function processQueue(): void {
  if (speaking || queue.length === 0) return;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    queue = [];
    return;
  }
  const text = queue.shift()!;
  speaking = true;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.onend = () => {
      speaking = false;
      processQueue();
    };
    u.onerror = () => {
      speaking = false;
      processQueue();
    };
    window.speechSynthesis.speak(u);
  } catch {
    speaking = false;
    processQueue();
  }
}

/** Desbloquea autoplay en navegadores que lo exigen tras gesto del usuario. */
export function warmupSpeechSynthesis(): void {
  if (warmedUp || typeof window === "undefined" || !window.speechSynthesis) return;
  warmedUp = true;
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
export function speakUbicacionQueue(phrases: string[], cancelPrevious = false): void {
  const filtered = phrases.map(p => p.trim()).filter(Boolean);
  if (filtered.length === 0) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  if (!isSituacionAlertsEnabled()) return;

  if (cancelPrevious) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
    queue = [];
    speaking = false;
  }

  queue.push(...filtered);
  processQueue();
}

export function speakUbicacionSingle(text: string): void {
  speakUbicacionQueue([text], false);
}
