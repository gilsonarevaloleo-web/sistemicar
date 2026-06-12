import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, Circle, Clock, Sparkles, Sun, Moon, Volume2, VolumeX, Wind } from "lucide-react";
import type { Vehicle } from "@/lib/persistence";
import type { PuntoCeroSession } from "@/lib/puntoCeroTypes";
import {
  PUNTO_CERO_ARCOIRIS,
  etapasPuntoCeroVacias,
} from "@/lib/puntoCeroTypes";
import {
  confirmColor,
  etapasConColoresCompletos,
  faseDuracionesMin,
  getFaseEfectiva,
  initPuntoCeroSession,
  parsePuntoCeroDuracionMin,
  shouldEnterPasiva,
  transitionToPasiva,
} from "@/engines/PuntoCeroEngine";
import { usePuntoCeroOrchestrator } from "@/hooks/usePuntoCeroOrchestrator";
import { usePuntoCeroAudio } from "@/hooks/usePuntoCeroAudio";
import {
  MENSAJE_PASIVA_DIA,
  MENSAJE_PASIVA_NOCHE,
  PUNTO_CERO_ETAPAS_LIST,
  speakColorInmersion,
  speakEtapaPuntoCero,
  speakPuntoCeroSequence,
} from "@/lib/puntoCeroVoice";
import { toast } from "sonner";

const PIZARRA = "#0a0a0a";

function PuntoCeroAudioControls({
  vehicleId,
  muted,
  volume,
  unlocked,
  flotaColor,
  onToggle,
  onVolumeChange,
  dark = false,
  compact = false,
}: {
  vehicleId: string;
  muted: boolean;
  volume: number;
  unlocked: boolean;
  flotaColor: string;
  onToggle: () => void;
  onVolumeChange: (pct: number) => void;
  dark?: boolean;
  compact?: boolean;
}) {
  const label = muted ? "Off" : unlocked ? "On" : "Activar";
  const trackColor = dark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)";
  const accent = muted ? (dark ? "rgba(255,255,255,0.25)" : "#64748b") : flotaColor;

  return (
    <div
      className={`flex items-center gap-1.5 ${compact ? "flex-col items-stretch" : "flex-wrap"}`}
      onClick={e => e.stopPropagation()}
      data-testid={`punto-cero-audio-controls-${vehicleId}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all flex-shrink-0"
        style={{
          backgroundColor: muted
            ? "rgba(255,255,255,0.04)"
            : unlocked
              ? `${flotaColor}18`
              : "rgba(255,255,255,0.06)",
          borderColor: muted
            ? "rgba(255,255,255,0.12)"
            : unlocked
              ? `${flotaColor}55`
              : "rgba(255,255,255,0.15)",
          color: muted ? (dark ? "rgba(255,255,255,0.35)" : "#64748b") : unlocked ? flotaColor : (dark ? "rgba(255,255,255,0.5)" : "#94a3b8"),
        }}
        title={muted ? "Activar audio" : "Silenciar audio"}
        data-testid={`punto-cero-audio-toggle-${vehicleId}`}
      >
        {muted || volume <= 0 ? <VolumeX size={10} /> : <Volume2 size={10} />}
        <span className="text-[7px] font-bold uppercase tracking-wide">{label}</span>
      </button>
      <div className={`flex items-center gap-1.5 min-w-0 ${compact ? "w-full" : "flex-1"}`}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={muted ? 0 : volume}
          onChange={e => onVolumeChange(parseInt(e.target.value, 10))}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer min-w-[4.5rem]"
          style={{
            accentColor: accent,
            background: `linear-gradient(to right, ${accent} ${muted ? 0 : volume}%, ${trackColor} ${muted ? 0 : volume}%)`,
          }}
          title="Volumen Punto Cero"
          data-testid={`punto-cero-audio-volume-${vehicleId}`}
        />
        <span
          className="text-[7px] font-mono font-bold tabular-nums w-7 text-right flex-shrink-0"
          style={{ color: dark ? "rgba(255,255,255,0.35)" : "#64748b" }}
        >
          {muted ? "0" : volume}%
        </span>
      </div>
    </div>
  );
}

export type PuntoCeroPanelProps = {
  vehicle: Vehicle;
  flotaColor: string;
  showMicroPasos: boolean;
  showDescansoReloj: boolean;
  onToggleReloj: () => void;
  onEtapaToggle: (vehicleId: string, etapa: "etapa1" | "etapa2" | "etapa3" | "etapa4") => void;
  onColorConfirm: (vehicleId: string, idx: number, session: PuntoCeroSession) => void;
  onSessionPersist: (vehicleId: string, session: PuntoCeroSession) => void;
  onAutoClose: (vehicleId: string) => void;
};

export function PuntoCeroPanel({
  vehicle,
  flotaColor,
  showMicroPasos,
  showDescansoReloj,
  onToggleReloj,
  onEtapaToggle,
  onColorConfirm,
  onSessionPersist,
  onAutoClose,
}: PuntoCeroPanelProps) {
  const session = vehicle.puntoCero;
  const ep = vehicle.etapasPuntoCero ?? etapasPuntoCeroVacias();
  const colores = session?.coloresConfirmados ?? Array(7).fill(false);
  const fase = session ? getFaseEfectiva(session, Date.now(), colores) : "activa";
  const enPasiva = fase === "pasiva" || fase === "completada";
  const enCompletada = fase === "completada";

  const [colorInmersion, setColorInmersion] = useState<{ color: string; zona: string; idx: number } | null>(null);
  const [inmersionCount, setInmersionCount] = useState(3);
  const primeraGuiaVozRef = useRef(true);

  const primerAccionMs = vehicle.primerAccionAt;
  const aperturaMs = vehicle.aperturaAt || Date.now();
  const eficienciaSec = primerAccionMs ? Math.round((primerAccionMs - aperturaMs) / 1000) : null;

  const handleSessionUpdate = useCallback(
    (next: PuntoCeroSession) => {
      onSessionPersist(vehicle.id, next);
    },
    [onSessionPersist, vehicle.id]
  );

  const audioEnabled = vehicle.status === "activo" && !!session;
  const puntoCeroAudio = usePuntoCeroAudio(audioEnabled, session?.modo, fase);

  const orchestratorActive =
    vehicle.status === "activo" && !!session && session.fase !== "completada";

  usePuntoCeroOrchestrator(session, orchestratorActive, {
    onSessionUpdate: handleSessionUpdate,
    onAutoClose: () => onAutoClose(vehicle.id),
    onEnterPasiva: () => {
      if (session?.modo === "dia") {
        speakPuntoCeroSequence(MENSAJE_PASIVA_DIA, "day");
      } else {
        speakPuntoCeroSequence(MENSAJE_PASIVA_NOCHE, "night");
      }
    },
    onCompletada: msg => {
      void puntoCeroAudio.onCompletada(session?.modo ?? "dia");
      toast.success(msg, {
        style: { backgroundColor: PIZARRA, border: `1px solid ${flotaColor}`, color: flotaColor },
        duration: session?.modo === "noche" ? 3000 : 5000,
      });
    },
  });

  useEffect(() => {
    if (!enCompletada || vehicle.status !== "activo") return;
    const t = window.setTimeout(() => onAutoClose(vehicle.id), 2500);
    return () => clearTimeout(t);
  }, [enCompletada, vehicle.status, vehicle.id, onAutoClose]);

  useEffect(() => {
    if (vehicle.status !== "activo" || vehicle.tipoDescanso !== "punto_cero" || session) return;
    onSessionPersist(
      vehicle.id,
      initPuntoCeroSession("dia", parsePuntoCeroDuracionMin(vehicle.criterioDetalle), vehicle.aperturaAt ?? Date.now())
    );
  }, [vehicle.id, vehicle.status, vehicle.tipoDescanso, vehicle.criterioDetalle, vehicle.aperturaAt, session, onSessionPersist]);

  useEffect(() => {
    if (!colorInmersion) return;
    void puntoCeroAudio.playSolfeggio(PUNTO_CERO_ARCOIRIS[colorInmersion.idx]!.solfeggioHz);
    setInmersionCount(3);
    const iv = setInterval(() => setInmersionCount(c => (c > 1 ? c - 1 : c)), 1000);
    const to = setTimeout(() => {
      if (!session) return;
      const nextSession = confirmColor(session, colorInmersion.idx);
      onColorConfirm(vehicle.id, colorInmersion.idx, nextSession);
      if (shouldEnterPasiva(nextSession, Date.now(), nextSession.coloresConfirmados)) {
        onSessionPersist(vehicle.id, transitionToPasiva(nextSession, Date.now()));
      }
      setColorInmersion(null);
    }, 3000);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [colorInmersion, onColorConfirm, onSessionPersist, session, vehicle.id]);

  const epCompletados = [ep.etapa1, ep.etapa2, ep.etapa3, ep.etapa4].filter(Boolean).length;
  const todosColoresConfirmados = colores.every(Boolean);
  const { activaMin, pasivaMin } = session
    ? faseDuracionesMin(session.duracionTotalMin)
    : { activaMin: 5, pasivaMin: 10 };

  const etapasCfg = PUNTO_CERO_ETAPAS_LIST.map(({ key, label, instruccion }) => ({
    key,
    label,
    instruccion,
    Icon: key === "etapa1" ? Circle : key === "etapa2" ? Brain : key === "etapa3" ? Wind : Sparkles,
  }));

  if (enPasiva && session) {
    return (
      <>
        <div
          className="fixed inset-0 flex flex-col items-center justify-center px-6"
          style={{ zIndex: 9998, backgroundColor: "#000000" }}
          data-testid={`punto-cero-pasiva-${vehicle.id}`}
        >
          <div className="absolute top-4 left-4 right-4 max-w-[14rem] ml-auto">
            <PuntoCeroAudioControls
              vehicleId={vehicle.id}
              muted={puntoCeroAudio.muted}
              volume={puntoCeroAudio.volume}
              unlocked={puntoCeroAudio.unlocked}
              flotaColor={flotaColor}
              onToggle={() => void puntoCeroAudio.toggleMute()}
              onVolumeChange={pct => void puntoCeroAudio.setVolume(pct)}
              dark
              compact
            />
          </div>
          <div className="max-w-xs text-center space-y-4">
            {session.modo === "dia" ? (
              <Sun size={20} className="mx-auto text-amber-400/40" />
            ) : (
              <Moon size={20} className="mx-auto text-indigo-400/30" />
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25">
              {session.modo === "dia" ? "Ancla del alivio" : "Apagón nocturno"}
            </p>
            <p className="text-sm text-white/50 leading-relaxed font-light">
              {session.modo === "dia"
                ? "Rastreá la fricción corporal. Dejá ir con cada exhalación."
                : "Silencio profundo. Solo la respiración."}
            </p>
            {!enCompletada && (
              <p className="text-[9px] text-white/20 font-mono">
                Fase pasiva · {pasivaMin} min · {session.modo === "dia" ? "ondas theta" : "ondas delta"}
              </p>
            )}
            {enCompletada && (
              <div className="space-y-5 pt-2">
                <p className="text-[10px] font-bold" style={{ color: flotaColor }}>
                  Punto Cero completado
                </p>
                <button
                  type="button"
                  onClick={() => onAutoClose(vehicle.id)}
                  className="w-full min-h-[3rem] px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border-2 transition-transform active:scale-[0.98]"
                  style={{
                    backgroundColor: `${flotaColor}22`,
                    borderColor: flotaColor,
                    color: flotaColor,
                    boxShadow: `0 0 24px ${flotaColor}30`,
                  }}
                  data-testid={`punto-cero-cerrar-${vehicle.id}`}
                >
                  Cerrar y retomar
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {colorInmersion && (
          <motion.div
            key="color-inmersion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              if (!session) return;
              const nextSession = confirmColor(session, colorInmersion.idx);
              onColorConfirm(vehicle.id, colorInmersion.idx, nextSession);
              setColorInmersion(null);
            }}
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 9999, backgroundColor: `${colorInmersion.color}E0`, cursor: "pointer" }}
            data-testid={`overlay-inmersion-${vehicle.id}`}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 select-none"
            >
              <div className="w-32 h-32 rounded-full" style={{ backgroundColor: colorInmersion.color, boxShadow: `0 0 60px ${colorInmersion.color}, 0 0 120px ${colorInmersion.color}80` }} />
              <p className="text-5xl font-black uppercase tracking-widest text-white" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)", fontFamily: "Playfair Display, serif" }}>{colorInmersion.zona.toUpperCase()}</p>
              <p className="text-sm text-white/60 uppercase tracking-[0.25em]">Inhálalo · Introdúcelo a su zona</p>
              <motion.p
                key={inmersionCount}
                initial={{ opacity: 0, scale: 1.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-4xl font-black text-white/80 tabular-nums"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)", fontFamily: "Playfair Display, serif" }}
              >
                {inmersionCount}
              </motion.p>
              <p className="text-xs text-white/30">Toca para continuar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2" data-testid={`descanso-msg-${vehicle.id}`}>
        <div className="p-3 rounded-xl border" style={{ backgroundColor: `${flotaColor}08`, borderColor: `${flotaColor}30` }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Circle size={14} style={{ color: flotaColor }} />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: flotaColor }}>PUNTO CERO</span>
            {session && (
              <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: session.modo === "dia" ? "rgba(251,191,36,0.15)" : "rgba(99,102,241,0.15)", color: session.modo === "dia" ? "#fbbf24" : "#a5b4fc" }}>
                {session.modo === "dia" ? "Recarga operativa" : "Apagón nocturno"}
              </span>
            )}
            <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${flotaColor}15`, color: flotaColor }}>{epCompletados}/4 PS</span>
            <button type="button" onClick={onToggleReloj} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all" style={{ backgroundColor: showDescansoReloj ? `${flotaColor}20` : "transparent", borderColor: showDescansoReloj ? flotaColor : "rgba(255,255,255,0.15)", color: showDescansoReloj ? flotaColor : "#64748b" }} data-testid={`toggle-reloj-descanso-${vehicle.id}`}>
              <Clock size={10} />
            </button>
          </div>
          <div className="mb-1.5">
            <PuntoCeroAudioControls
              vehicleId={vehicle.id}
              muted={puntoCeroAudio.muted}
              volume={puntoCeroAudio.volume}
              unlocked={puntoCeroAudio.unlocked}
              flotaColor={flotaColor}
              onToggle={() => void puntoCeroAudio.toggleMute()}
              onVolumeChange={pct => void puntoCeroAudio.setVolume(pct)}
            />
          </div>
          <p className="text-[9px] text-slate-500 italic">
            Polo Neutro · Fase activa ~{activaMin} min · ondas alfa
            {showDescansoReloj ? " · Reloj activo" : " · Reloj oculto"}
          </p>
          <p className="text-[7px] text-slate-600 mt-0.5">
            {puntoCeroAudio.muted || puntoCeroAudio.volume <= 0
              ? "Audio silenciado — subí el volumen o activá On · voz guía al tocar etapas"
              : puntoCeroAudio.unlocked
                ? `Audio ${puntoCeroAudio.volume}% · auriculares recomendados · voz guía lee el protocolo completo`
                : "Tocá una etapa para iniciar audio y escuchar el protocolo paso a paso"}
          </p>
          {eficienciaSec !== null && (
            <p className="text-[8px] mt-1" style={{ color: flotaColor }}>⚡ Primera etapa: {eficienciaSec < 60 ? `${eficienciaSec}s` : `${Math.round(eficienciaSec / 60)}m`} desde apertura</p>
          )}
        </div>

        {showMicroPasos ? (
          <div className="space-y-1.5">
            {etapasCfg.map(({ key, label, instruccion, Icon: EtapaIcon }) => {
              const checked = ep[key];
              const isColorEtapa = key === "etapa4";
              const colorCount = colores.filter(Boolean).length;
              const prevRequired = key === "etapa2" ? !ep.etapa1 : key === "etapa3" ? !ep.etapa2 : key === "etapa4" ? (!ep.etapa3 || !todosColoresConfirmados) : false;
              const isLocked = !checked && prevRequired;
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (checked || isLocked || isColorEtapa) return;
                      void puntoCeroAudio.unlockAudio();
                      const intro = primeraGuiaVozRef.current;
                      if (intro) primeraGuiaVozRef.current = false;
                      speakEtapaPuntoCero(key, {
                        intro,
                        transicionEtapa4: key === "etapa3",
                      });
                      onEtapaToggle(vehicle.id, key);
                    }}
                    disabled={checked || isLocked || isColorEtapa}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl border transition-all text-left"
                    style={{ backgroundColor: checked ? `${flotaColor}10` : "rgba(255,255,255,0.03)", borderColor: checked ? flotaColor : (isLocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"), cursor: (checked || isLocked || isColorEtapa) ? "default" : "pointer", opacity: isLocked ? 0.4 : 1 }}
                    data-testid={`etapa-pc-${key}-${vehicle.id}`}
                  >
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: checked ? flotaColor : "rgba(255,255,255,0.2)", backgroundColor: checked ? `${flotaColor}20` : "transparent" }}>
                      {checked ? <Check size={9} style={{ color: flotaColor }} /> : <EtapaIcon size={9} style={{ color: isLocked ? "#334155" : "#64748b" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold" style={{ color: checked ? flotaColor : "#64748b" }}>{label}</p>
                      <p className="text-[8px] text-slate-600 mt-0.5">{instruccion}</p>
                    </div>
                    {checked
                      ? <span className="text-[8px] font-bold flex-shrink-0" style={{ color: flotaColor }}>+1 PS</span>
                      : isColorEtapa && ep.etapa3
                        ? <span className="text-[8px] flex-shrink-0" style={{ color: todosColoresConfirmados ? flotaColor : "#64748b" }}>{colorCount}/7</span>
                        : <span className="text-[8px] text-slate-600 flex-shrink-0">activar</span>
                    }
                  </button>
                  {isColorEtapa && !checked && ep.etapa3 && (
                    <div className="grid grid-cols-4 gap-2 mt-2 px-1">
                      {PUNTO_CERO_ARCOIRIS.map(({ color, zona }, idx) => {
                        const confirmado = colores[idx];
                        return (
                          <button
                            key={zona}
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              if (!confirmado && session) {
                                void puntoCeroAudio.unlockAudio();
                                speakColorInmersion(zona, idx);
                                setColorInmersion({ color, zona, idx });
                              }
                            }}
                            disabled={confirmado || !session}
                            className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all"
                            style={{ backgroundColor: confirmado ? `${color}25` : `${color}12`, borderColor: confirmado ? color : `${color}35`, cursor: confirmado ? "default" : "pointer", boxShadow: confirmado ? `0 0 10px ${color}50` : `0 0 4px ${color}20` }}
                            data-testid={`color-pc-${idx}-${vehicle.id}`}
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: confirmado ? color : `${color}40`, boxShadow: confirmado ? `0 0 8px ${color}` : "none" }}>
                              {confirmado && <Check size={10} color="#fff" />}
                            </div>
                            <span className="text-[7px] font-bold text-center leading-tight" style={{ color: confirmado ? color : `${color}90` }}>{zona}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isColorEtapa && checked && (
                    <div className="flex gap-1 flex-wrap mt-1.5 px-1">
                      {PUNTO_CERO_ARCOIRIS.map(({ color, zona }) => (
                        <span key={zona} className="text-[7px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>✓ {zona}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[8px] text-center text-slate-600">Las etapas aparecerán en unos segundos...</p>
        )}
      </div>
    </>
  );
}
