import { isSituacionAlertsEnabled } from "./tikSound";

let sharedCtx: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new AC();
  if (sharedCtx.state === "suspended") await sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  t0: number,
  durationSec: number,
  gainPeak: number,
  type: OscillatorType = "triangle"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.02);
}

/** Triple campana Do–Mi–Sol — aviso 2 min antes del cupo. */
export async function playSituacion2MinBell(): Promise<void> {
  if (!isSituacionAlertsEnabled()) return;
  const ctx = await getAudioContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99];
  const noteDur = 0.22;
  const gap = 0.12;
  notes.forEach((freq, i) => {
    tone(ctx, freq, ctx.currentTime + i * (noteDur + gap), noteDur, 0.42, "triangle");
  });
}

/** Sirena corta pulsante — cupo alcanzado. */
export async function playSituacionCupoSiren(): Promise<void> {
  if (!isSituacionAlertsEnabled()) return;
  const ctx = await getAudioContext();
  if (!ctx) return;
  const pulses = 6;
  for (let i = 0; i < pulses; i++) {
    const t0 = ctx.currentTime + i * 0.25;
    tone(ctx, i % 2 === 0 ? 440 : 554, t0, 0.18, 0.5, "square");
  }
}

/** Timbres decrecientes al marcar cumplido (más fuertes que antes). */
export async function playSituacionCumplidoChimes(count: number): Promise<void> {
  if (!isSituacionAlertsEnabled()) return;
  const n = Math.min(12, Math.max(1, Math.floor(count)));
  const ctx = await getAudioContext();
  if (!ctx) return;
  const spacingMs = 220;
  const beepMs = 0.16;
  for (let i = 0; i < n; i++) {
    const t0 = ctx.currentTime + (i * (spacingMs + beepMs * 1000)) / 1000;
    tone(ctx, 880 - i * 20, t0, beepMs, 0.35, "sine");
  }
}

/** @deprecated alias — usar playSituacionCumplidoChimes */
export async function playSituacionChimes(count: number): Promise<void> {
  return playSituacionCumplidoChimes(count);
}

export function vibrateSituacion2Min(): void {
  if (!isSituacionAlertsEnabled() || !navigator.vibrate) return;
  navigator.vibrate([180, 70, 180, 70, 180]);
}

export function vibrateSituacionCupo(): void {
  if (!isSituacionAlertsEnabled() || !navigator.vibrate) return;
  navigator.vibrate([300, 90, 300, 90, 400]);
}
