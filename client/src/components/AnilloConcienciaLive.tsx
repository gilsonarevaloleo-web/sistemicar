import { memo, useEffect, useMemo, useState } from "react";
import AnilloConciencia from "@/components/AnilloConciencia";
import AnilloConcienciaHorizon from "@/components/AnilloConcienciaHorizon";
import { AnilloRingErrorBoundary } from "@/components/AnilloRingErrorBoundary";
import {
  computeLiveEntropy,
  computeSegmentArcStats,
  computeSegmentBattleArcs,
  computeSegmentClockArcs,
  formatMinutosJornada,
  nowToClockDeg,
  nowToHalfDayLap,
  type SegmentoAnilloLite,
} from "@/engines/ConcienciaEngine";
import { computeHorizonProjection } from "@/engines/ConcienciaHorizonEngine";
import {
  readAnilloViewMode,
  subscribeAnilloViewMode,
  writeAnilloViewMode,
  type AnilloViewMode,
} from "@/lib/anilloViewMode";
import { useConcienciaClockTick, useConcienciaMetricTick } from "@/lib/concienciaClock";
import type { Vehicle } from "@/lib/persistence";

const BLOOD = "#FF3131";

function sanitizeSegmentos(segmentos: SegmentoAnilloLite[]): SegmentoAnilloLite[] {
  return segmentos.filter((s): s is SegmentoAnilloLite => !!s && typeof s === "object");
}

function emptyAnilloModel(segs: SegmentoAnilloLite[]) {
  return {
    segs,
    segmentClockArcs: [] as ReturnType<typeof computeSegmentClockArcs>,
    segmentBattleArcs: [] as ReturnType<typeof computeSegmentBattleArcs>,
    segmentArcStats: [] as ReturnType<typeof computeSegmentArcStats>,
    horizonProjection: computeHorizonProjection({ segmentos: [], vehiculos: [] }),
    metricas: {
      planificacionPct: 0,
      conquistaMin: 0,
      entropiaMin: 0,
      jornadaMin: 0,
      conquistaArcPct: 0,
      entropiaArcPct: 0,
      fillPct: 0,
      horasCubiertas: 0,
    },
    anilloEstado: { mode: "libre" as const, centerGuide: "", deg: 0, umbralMin: 360, sinSegmentos: true },
    timelineArcs: [] as ReturnType<typeof computeLiveEntropy>["timelineArcs"],
    dayStats: { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 },
    segConquistados: 0,
  };
}

export interface AnilloConcienciaLiveProps {
  segmentos: SegmentoAnilloLite[];
  vehicles: Vehicle[];
  conquistaPulse?: boolean;
  /** Solo el SVG del anillo (cockpit). */
  ringOnly?: boolean;
  size?: number;
  className?: string;
  /** Muestra conquista / entropía / segmentos bajo el anillo. */
  showDayStats?: boolean;
  /** Toggle Mapa / Horizonte (cockpit y tarjeta métricas). */
  showViewToggle?: boolean;
}

/**
 * Anillo + contador inconsciente en vivo. Aísla ticks del resto de Jornada.
 * Métricas pesadas: 1 s escritorio / ~5 s móvil. Puntero: cada 1 s (barato).
 */
function AnilloConcienciaLiveInner({
  segmentos,
  vehicles,
  conquistaPulse = false,
  ringOnly = false,
  size = 130,
  className,
  showDayStats = false,
  showViewToggle = true,
}: AnilloConcienciaLiveProps) {
  const [viewMode, setViewMode] = useState<AnilloViewMode>(() => readAnilloViewMode());
  const pointerTick = useConcienciaClockTick();
  const metricTick = useConcienciaMetricTick();

  useEffect(() => subscribeAnilloViewMode(setViewMode), []);

  const model = useMemo(() => {
    void metricTick;
    const nowMs = Date.now();
    const segs = sanitizeSegmentos(segmentos);
    const vehiculos = Array.isArray(vehicles) ? vehicles : [];
    try {
      const timeline = computeLiveEntropy({
        segmentos: segs,
        vehiculos,
        now: nowMs,
      });
      const segConquistados = segs.filter(
        s => (s as { estado?: string }).estado === "cerrado_manual"
      ).length;
      const battleParams = { segmentos: segs, vehiculos, now: nowMs };
      return {
        segs,
        segmentClockArcs: computeSegmentClockArcs(segs, nowMs),
        segmentBattleArcs: computeSegmentBattleArcs(battleParams),
        segmentArcStats: computeSegmentArcStats(battleParams),
        horizonProjection: computeHorizonProjection(battleParams),
        metricas: timeline.metricas,
        anilloEstado: timeline.anilloEstado,
        timelineArcs: timeline.timelineArcs,
        dayStats: timeline.dayStats,
        segConquistados,
      };
    } catch (err) {
      console.error("[AnilloConcienciaLive] model", err);
      return emptyAnilloModel(segs);
    }
  }, [segmentos, vehicles, metricTick]);

  const pointerDeg = useMemo(() => {
    void pointerTick;
    return nowToClockDeg(Date.now());
  }, [pointerTick]);

  const pointerLap = useMemo(() => {
    void pointerTick;
    return nowToHalfDayLap(Date.now());
  }, [pointerTick]);

  const toggle = showViewToggle ? (
    <div
      className="flex rounded-lg border overflow-hidden mb-1"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
      role="tablist"
      aria-label="Vista del anillo"
    >
      {(["mapa", "horizonte"] as const).map(mode => {
        const active = viewMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`anillo-view-${mode}`}
            className="px-2 py-0.5 text-[7px] font-black uppercase tracking-widest transition-colors"
            style={{
              backgroundColor: active ? "rgba(0,255,195,0.12)" : "transparent",
              color: active ? "#00FFC3" : "rgba(148,163,184,0.7)",
            }}
            onClick={() => {
              writeAnilloViewMode(mode);
              setViewMode(mode);
            }}
          >
            {mode === "mapa" ? "Mapa" : "Horizonte"}
          </button>
        );
      })}
    </div>
  ) : null;

  const ring = (
    <AnilloRingErrorBoundary size={size}>
      {viewMode === "horizonte" ? (
        <AnilloConcienciaHorizon
          projection={model.horizonProjection}
          planificacionPct={model.metricas.planificacionPct}
          conquistaArcPct={model.metricas.conquistaArcPct}
          entropiaArcPct={model.metricas.entropiaArcPct}
          size={size}
        />
      ) : (
        <AnilloConciencia
          planificacionPct={model.metricas.planificacionPct}
          conquistaArcPct={model.metricas.conquistaArcPct}
          entropiaArcPct={model.metricas.entropiaArcPct}
          timelineArcs={model.timelineArcs}
          conquistaPulse={conquistaPulse}
          size={size}
          segmentClockArcs={model.segmentClockArcs}
          segmentBattleArcs={model.segmentBattleArcs}
          segmentArcStats={model.segmentArcStats}
          segmentos={model.segs}
          pointerDeg={pointerDeg}
          pointerLap={pointerLap}
          pointerMode={model.anilloEstado.mode}
          centerGuide={model.anilloEstado.centerGuide}
        />
      )}
    </AnilloRingErrorBoundary>
  );

  if (ringOnly) {
    return (
      <div className={className}>
        {toggle}
        {ring}
      </div>
    );
  }

  return (
    <div className={className}>
      {toggle}
      {ring}
      {showDayStats && (
        <div className="mt-2 grid grid-cols-3 gap-1 w-full text-center">
          <div>
            <p className="text-[7px] uppercase font-bold" style={{ color: "#8B5CF6" }}>
              Consciente
            </p>
            <p className="text-xs font-black" style={{ color: "#8B5CF6" }}>
              {formatMinutosJornada(model.dayStats.conquistaMin)}
            </p>
          </div>
          <div>
            <p className="text-[7px] uppercase font-bold" style={{ color: BLOOD }}>
              Inconsciente
            </p>
            <p
              className="text-xs font-black"
              style={{
                color: model.dayStats.entropiaMin > 0 ? BLOOD : "rgba(148,163,184,0.5)",
              }}
            >
              {formatMinutosJornada(model.dayStats.entropiaMin)}
            </p>
          </div>
          <div>
            <p className="text-[7px] text-slate-500 uppercase">Seg. cerrados</p>
            <p className="text-xs font-black" style={{ color: "#00FFC3" }}>
              {model.segConquistados}/{model.segs.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const AnilloConcienciaLive = memo(AnilloConcienciaLiveInner);
export default AnilloConcienciaLive;
