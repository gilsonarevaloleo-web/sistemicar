import { memo, useMemo } from "react";
import AnilloConciencia from "@/components/AnilloConciencia";
import {
  computeLiveEntropy,
  formatMinutosJornada,
  nowToClockDeg,
  nowToHalfDayLap,
  type SegmentoAnilloLite,
} from "@/engines/ConcienciaEngine";
import { useConcienciaClockTick, useConcienciaMetricTick } from "@/lib/concienciaClock";
import type { Vehicle } from "@/lib/persistence";

const BLOOD = "#FF3131";

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
}: AnilloConcienciaLiveProps) {
  const pointerTick = useConcienciaClockTick();
  const metricTick = useConcienciaMetricTick();

  const model = useMemo(() => {
    void metricTick;
    const nowMs = Date.now();
    const timeline = computeLiveEntropy({
      segmentos,
      vehiculos: vehicles,
      now: nowMs,
    });
    const segConquistados = segmentos.filter(
      s => (s as { estado?: string }).estado === "cerrado_manual"
    ).length;
    return {
      segs: segmentos,
      metricas: timeline.metricas,
      anilloEstado: timeline.anilloEstado,
      timelineArcs: timeline.timelineArcs,
      dayStats: timeline.dayStats,
      segConquistados,
    };
  }, [segmentos, vehicles, metricTick]);

  const pointerDeg = useMemo(() => {
    void pointerTick;
    return nowToClockDeg(Date.now());
  }, [pointerTick]);

  const pointerLap = useMemo(() => {
    void pointerTick;
    return nowToHalfDayLap(Date.now());
  }, [pointerTick]);

  const ring = (
    <AnilloConciencia
      planificacionPct={model.metricas.planificacionPct}
      conquistaArcPct={model.metricas.conquistaArcPct}
      entropiaArcPct={model.metricas.entropiaArcPct}
      timelineArcs={model.timelineArcs}
      conquistaPulse={conquistaPulse}
      size={size}
      segmentos={model.segs}
      pointerDeg={pointerDeg}
      pointerLap={pointerLap}
      pointerMode={model.anilloEstado.mode}
      centerGuide={model.anilloEstado.centerGuide}
    />
  );

  if (ringOnly) return ring;

  return (
    <div className={className}>
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
