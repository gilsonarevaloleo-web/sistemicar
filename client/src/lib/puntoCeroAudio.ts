/** Presets binaurales Punto Cero (carrier Hz + diferencia = beat percibido). */
export const PUNTO_CERO_BINAURAL = {
  /** Alfa 8–10 Hz — fase activa. */
  alpha: { carrier: 200, beat: 9, volume: 0.042 },
  /** Theta 4–7 Hz — fase pasiva día. */
  theta: { carrier: 180, beat: 5.5, volume: 0.048 },
  /** Delta 0.5–4 Hz — fase pasiva noche. */
  delta: { carrier: 100, beat: 2, volume: 0.038 },
} as const;

/** Ajustes globales de mezcla y transiciones. */
export const PUNTO_CERO_AUDIO_TUNING = {
  masterGain: 0.72,
  binauralFadeInSec: 2,
  binauralCrossfadeSec: 2.2,
  binauralStopSec: 0.35,
  solfeggioDurationSec: 2.4,
  solfeggioPeakGain: 0.085,
  solfeggioAttackSec: 0.18,
  reactivacionPeakGain: 0.11,
  reactivacionDurationSec: 2.8,
  nocheFadeOutSec: 12,
  muteFadeSec: 0.28,
  unmuteFadeSec: 0.45,
  defaultVolumePct: 85,
  minVolumePct: 0,
  maxVolumePct: 100,
} as const;

/** Ganancia master según volumen usuario (0–100). */
export function masterOutputGain(volumePct: number): number {
  const v = Math.max(0, Math.min(100, volumePct)) / 100;
  return PUNTO_CERO_AUDIO_TUNING.masterGain * v;
}

export type PuntoCeroBinauralPreset = keyof typeof PUNTO_CERO_BINAURAL;

export type BinauralHandle = {
  stop: (fadeSec?: number) => void;
};

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

export async function ensurePuntoCeroAudioContext(
  existing: AudioContext | null
): Promise<AudioContext | null> {
  const Ctx = getAudioContextClass();
  if (!Ctx) return null;
  const ctx = existing ?? new Ctx();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* gesto del usuario pendiente */
    }
  }
  return ctx;
}

export function startBinauralBeat(
  ctx: AudioContext,
  dest: AudioNode,
  preset: PuntoCeroBinauralPreset,
  fadeInSec = 1.2
): BinauralHandle {
  const { carrier, beat, volume } = PUNTO_CERO_BINAURAL[preset];
  const left = ctx.createOscillator();
  const right = ctx.createOscillator();
  const merger = ctx.createChannelMerger(2);
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  const busGain = ctx.createGain();

  left.type = "sine";
  right.type = "sine";
  left.frequency.value = carrier;
  right.frequency.value = carrier + beat;

  const t = ctx.currentTime;
  busGain.gain.setValueAtTime(0, t);
  busGain.gain.linearRampToValueAtTime(volume, t + fadeInSec);

  left.connect(leftGain);
  right.connect(rightGain);
  leftGain.gain.value = 0.5;
  rightGain.gain.value = 0.5;
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(busGain);
  busGain.connect(dest);

  left.start(t);
  right.start(t);

  return {
    stop(fadeSec = 1.5) {
      const now = ctx.currentTime;
      try {
        busGain.gain.cancelScheduledValues(now);
        busGain.gain.setValueAtTime(busGain.gain.value, now);
        busGain.gain.linearRampToValueAtTime(0, now + fadeSec);
        left.stop(now + fadeSec + 0.05);
        right.stop(now + fadeSec + 0.05);
      } catch {
        try {
          left.stop();
          right.stop();
        } catch {
          /* ya detenido */
        }
      }
    },
  };
}

export function playSolfeggioTone(
  ctx: AudioContext,
  dest: AudioNode,
  hz: number,
  opts?: { durationSec?: number; peakGain?: number; attackSec?: number }
): void {
  const durationSec = opts?.durationSec ?? PUNTO_CERO_AUDIO_TUNING.solfeggioDurationSec;
  const peakGain = opts?.peakGain ?? PUNTO_CERO_AUDIO_TUNING.solfeggioPeakGain;
  const attackSec = opts?.attackSec ?? PUNTO_CERO_AUDIO_TUNING.solfeggioAttackSec;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = hz;
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peakGain, t + attackSec);
  g.gain.setValueAtTime(peakGain * 0.88, t + durationSec - 0.55);
  g.gain.linearRampToValueAtTime(0, t + durationSec);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + durationSec + 0.08);
}

/** Tono ascendente alfa — reactivación modo día. */
export function playReactivacionAlfa(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  const t = ctx.currentTime;
  const peak = PUNTO_CERO_AUDIO_TUNING.reactivacionPeakGain;
  const dur = PUNTO_CERO_AUDIO_TUNING.reactivacionDurationSec;
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(528, t + dur * 0.75);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.3);
  g.gain.linearRampToValueAtTime(peak * 0.55, t + dur * 0.65);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.1);
}

export function setMasterGainLevel(
  ctx: AudioContext,
  master: GainNode,
  level: number,
  fadeSec = PUNTO_CERO_AUDIO_TUNING.unmuteFadeSec
): void {
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, level)), t + fadeSec);
}

export function fadeMasterToSilence(ctx: AudioContext, master: GainNode, fadeSec = 10): void {
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + fadeSec);
}
