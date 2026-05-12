import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Volume2, VolumeX, Copy, Check, ExternalLink } from "lucide-react";
import type { PiezaSensorial } from "@/lib/persistence";

const GOLD = "#D4AF37";
const CYAN = "#00FFC3";
const RED = "#FF3131";
const DARK = "#0A0A0A";

const CLINICAL_KEYWORDS = [
  "Voltaje", "Hardware", "Chófer", "Pasajero", "Mendigo", "Interfaz",
  "Soberano", "Egrégore", "Terminal", "Frecuencia", "Estática",
  "Calibración", "Descompresión", "Cortocircuito", "Falla", "Mando",
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10"
];

interface PreviewSensorialProps {
  pieza: PiezaSensorial;
  onClose: () => void;
}

export default function PreviewSensorial({ pieza, onClose }: PreviewSensorialProps) {
  const [playing, setPlaying] = useState(false);
  const [currentSubIdx, setCurrentSubIdx] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLRef = useRef<OscillatorNode | null>(null);
  const oscRRef = useRef<OscillatorNode | null>(null);
  const brownNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const totalDuration = pieza.subtitulos.reduce((sum, s) => sum + s.segundos, 0);

  const startAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.12;
      masterGain.connect(ctx.destination);
      gainRef.current = masterGain;

      const baseFreq = pieza.binaural_hz || 432;
      const beatFreq = 6;

      const binauralGain = ctx.createGain();
      binauralGain.gain.value = 0.6;
      binauralGain.connect(masterGain);

      const merger = ctx.createChannelMerger(2);
      merger.connect(binauralGain);

      const oscL = ctx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.value = baseFreq;
      oscL.connect(merger, 0, 0);
      oscL.start();
      oscLRef.current = oscL;

      const oscR = ctx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.value = baseFreq + beatFreq;
      oscR.connect(merger, 0, 1);
      oscR.start();
      oscRRef.current = oscR;

      const brownDuration = Math.max(totalDuration, 120);
      const bufferSize = ctx.sampleRate * brownDuration;
      const brownBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = brownBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const brownSource = ctx.createBufferSource();
      brownSource.buffer = brownBuffer;
      brownSource.loop = true;
      const brownGain = ctx.createGain();
      brownGain.gain.value = 0.4;
      brownSource.connect(brownGain);
      brownGain.connect(masterGain);
      brownSource.start();
      brownNodeRef.current = brownSource;
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, [pieza.binaural_hz, totalDuration]);

  const stopAudio = useCallback(() => {
    try {
      oscLRef.current?.stop();
      oscRRef.current?.stop();
      brownNodeRef.current?.stop();
      audioCtxRef.current?.close();
    } catch {}
    oscLRef.current = null;
    oscRRef.current = null;
    brownNodeRef.current = null;
    audioCtxRef.current = null;
    gainRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopAudio]);

  useEffect(() => {
    if (audioOn) startAudio();
    else stopAudio();
  }, [audioOn, startAudio, stopAudio]);

  useEffect(() => {
    if (playing) {
      timerRef.current = window.setInterval(() => {
        setElapsed(prev => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, totalDuration]);

  useEffect(() => {
    let accum = 0;
    for (let i = 0; i < pieza.subtitulos.length; i++) {
      if (elapsed >= accum && elapsed < accum + pieza.subtitulos[i].segundos) {
        setCurrentSubIdx(i);
        return;
      }
      accum += pieza.subtitulos[i].segundos;
    }
    if (!playing) setCurrentSubIdx(-1);
  }, [elapsed, pieza.subtitulos, playing]);

  const handlePlayPause = () => {
    if (!playing && elapsed === 0) setAudioOn(true);
    setPlaying(!playing);
  };

  const copyText = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  const particlePositions = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      color: i % 3 === 0 ? GOLD : i % 3 === 1 ? CYAN : `${RED}80`,
    }))
  , []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
      data-testid="preview-sensorial-overlay"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl relative"
        style={{ backgroundColor: DARK, border: `1px solid ${GOLD}40` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${RED}20`, border: `1px solid ${RED}40` }}
          data-testid="btn-close-preview"
        >
          <X size={16} style={{ color: RED }} />
        </button>

        <div className="relative overflow-hidden rounded-t-2xl" style={{ minHeight: 340, background: `radial-gradient(ellipse at center, ${GOLD}08 0%, ${DARK} 70%)` }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 120 200" className="h-48 opacity-30" data-testid="visual-silhouette">
              <ellipse cx="60" cy="30" rx="18" ry="22" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
              <line x1="60" y1="52" x2="60" y2="130" stroke={GOLD} strokeWidth="0.8" opacity="0.5" />
              <line x1="60" y1="70" x2="30" y2="100" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
              <line x1="60" y1="70" x2="90" y2="100" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
              <line x1="60" y1="130" x2="40" y2="190" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
              <line x1="60" y1="130" x2="80" y2="190" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
              <motion.circle
                cx="60"
                cy={getZoneY(pieza.interfaz)}
                r="12"
                fill={CYAN}
                opacity={0.3}
                animate={{ opacity: [0.15, 0.45, 0.15], r: [10, 16, 10] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </div>

          {particlePositions.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ width: 2, height: 2, backgroundColor: p.color, left: p.left, top: p.top }}
              animate={{ opacity: [0, 0.7, 0], y: [0, -20, -40] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
            />
          ))}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest px-2 py-1 rounded" style={{ color: CYAN, backgroundColor: `${CYAN}15`, border: `1px solid ${CYAN}30` }} data-testid="text-interfaz-badge">
              {pieza.interfaz}
            </span>
            <span className="text-[9px] font-mono px-2 py-1 rounded" style={{ color: `${GOLD}80`, backgroundColor: `${GOLD}08` }}>
              {pieza.formato || "9:16"} · {pieza.duracion_estimada || "~75"}s
            </span>
          </div>

          <div className="absolute bottom-16 left-0 right-0 text-center px-6">
            <AnimatePresence mode="wait">
              {currentSubIdx >= 0 && pieza.subtitulos[currentSubIdx] && (
                <motion.div
                  key={currentSubIdx}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  data-testid={`subtitle-${currentSubIdx}`}
                >
                  <p className="text-lg font-bold tracking-wide" style={{ color: "#fff", textShadow: `0 0 20px ${GOLD}60, 0 2px 8px rgba(0,0,0,0.8)` }}>
                    {highlightKeywords(pieza.subtitulos[currentSubIdx].texto)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}60` }}
              data-testid="btn-play-pause"
            >
              {playing ? <Pause size={16} style={{ color: GOLD }} /> : <Play size={16} style={{ color: GOLD }} />}
            </button>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${GOLD}20` }}>
              <motion.div className="h-full rounded-full" style={{ backgroundColor: GOLD, width: `${progress}%` }} />
            </div>
            <button
              onClick={() => setAudioOn(!audioOn)}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: audioOn ? `${CYAN}20` : `${GOLD}10` }}
              data-testid="btn-audio-toggle"
            >
              {audioOn ? <Volume2 size={14} style={{ color: CYAN }} /> : <VolumeX size={14} style={{ color: `${GOLD}80` }} />}
            </button>
            <span className="text-[10px] font-mono flex-shrink-0" style={{ color: `${GOLD}80` }}>
              {pieza.binaural_hz}Hz
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black text-white" data-testid="text-titulo-pieza">{pieza.titulo_pieza}</h2>
              <p className="text-xs mt-1" style={{ color: `${GOLD}80` }}>{pieza.nombre_interfaz}</p>
              {pieza.fecha_pieza && (
                <p className="text-[9px] text-slate-600 mt-0.5">
                  {new Date(pieza.fecha_pieza).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
            {pieza.tracking_url && (
              <a
                href={pieza.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] flex items-center gap-1 px-2 py-1 rounded"
                style={{ color: CYAN, backgroundColor: `${CYAN}10`, border: `1px solid ${CYAN}20` }}
                data-testid="link-tracking"
              >
                <ExternalLink size={10} />
                Tracking
              </a>
            )}
          </div>

          <ContentBlock label="Guion del Narrador" content={pieza.guion_narrador} fieldId="guion" copied={copied} onCopy={copyText} highlight />
          <ContentBlock label="Caption Instagram" content={pieza.caption_instagram} fieldId="ig" copied={copied} onCopy={copyText} />
          <ContentBlock label="Caption TikTok" content={pieza.caption_tiktok} fieldId="tt" copied={copied} onCopy={copyText} />
          <ContentBlock label="Descripción Visual" content={pieza.descripcion_visual} fieldId="visual" copied={copied} onCopy={copyText} />
          {pieza.image_prompt && (
            <ContentBlock label="Image Prompt (AI Generation)" content={pieza.image_prompt} fieldId="imgprompt" copied={copied} onCopy={copyText} />
          )}

          {pieza.hashtags && pieza.hashtags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>Hashtags</p>
              <div className="flex flex-wrap gap-1">
                {pieza.hashtags.map((h, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}10`, color: `${GOLD}cc`, border: `1px solid ${GOLD}20` }} data-testid={`hashtag-${i}`}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function highlightKeywords(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchedKeyword = "";
    for (const kw of CLINICAL_KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase());
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        matchedKeyword = kw;
      }
    }
    if (matchedKeyword && earliestIdx < remaining.length) {
      if (earliestIdx > 0) {
        parts.push(remaining.slice(0, earliestIdx));
      }
      parts.push(
        <span key={keyIdx++} style={{ color: CYAN, textShadow: `0 0 8px ${CYAN}40` }}>
          {remaining.slice(earliestIdx, earliestIdx + matchedKeyword.length)}
        </span>
      );
      remaining = remaining.slice(earliestIdx + matchedKeyword.length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return <>{parts}</>;
}

function ContentBlock({ label, content, fieldId, copied, onCopy, highlight }: {
  label: string;
  content: string;
  fieldId: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
  highlight?: boolean;
}) {
  const rendered = highlight ? highlightInContent(content) : content;

  return (
    <div className="rounded-xl p-3 relative group" style={{ backgroundColor: `${GOLD}06`, border: `1px solid ${GOLD}15` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>{label}</p>
        <button
          onClick={() => onCopy(content, fieldId)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: `${GOLD}15` }}
          data-testid={`btn-copy-${fieldId}`}
        >
          {copied === fieldId ? <Check size={12} style={{ color: CYAN }} /> : <Copy size={12} style={{ color: `${GOLD}80` }} />}
        </button>
      </div>
      {typeof rendered === "string" ? (
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid={`text-${fieldId}`}>{rendered}</p>
      ) : (
        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid={`text-${fieldId}`}>{rendered}</div>
      )}
    </div>
  );
}

function highlightInContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchedKeyword = "";
    for (const kw of CLINICAL_KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase());
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        matchedKeyword = kw;
      }
    }
    if (matchedKeyword && earliestIdx < remaining.length) {
      if (earliestIdx > 0) parts.push(remaining.slice(0, earliestIdx));
      parts.push(
        <span key={keyIdx++} className="font-bold" style={{ color: CYAN }}>
          {remaining.slice(earliestIdx, earliestIdx + matchedKeyword.length)}
        </span>
      );
      remaining = remaining.slice(earliestIdx + matchedKeyword.length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return <>{parts}</>;
}

function getZoneY(interfaz: string): number {
  const zones: Record<string, number> = {
    M01: 175, M02: 145, M03: 110,
    M04: 85, M05: 60, M06: 35,
    M07: 28, M08: 15, M09: 80,
    M10: 90,
  };
  return zones[interfaz] || 90;
}
