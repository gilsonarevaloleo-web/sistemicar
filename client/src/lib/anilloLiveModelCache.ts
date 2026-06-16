import {
  computeAnilloRingModelBundle,
  type SegmentoAnilloLite,
} from "@/engines/ConcienciaEngine";
import { computeHorizonProjection } from "@/engines/ConcienciaHorizonEngine";
import type { Vehicle } from "@/lib/persistence";

const CACHE_BUCKET_MS = 3_000;

type CachedAnilloModel = {
  segs: SegmentoAnilloLite[];
  segmentClockArcs: ReturnType<typeof computeAnilloRingModelBundle>["segmentClockArcs"];
  segmentBattleArcs: ReturnType<typeof computeAnilloRingModelBundle>["segmentBattleArcs"];
  segmentArcStats: ReturnType<typeof computeAnilloRingModelBundle>["segmentArcStats"];
  horizonProjection: ReturnType<typeof computeHorizonProjection>;
  metricas: ReturnType<typeof computeAnilloRingModelBundle>["timeline"]["metricas"];
  anilloEstado: ReturnType<typeof computeAnilloRingModelBundle>["timeline"]["anilloEstado"];
  timelineArcs: ReturnType<typeof computeAnilloRingModelBundle>["timeline"]["timelineArcs"];
  dayStats: ReturnType<typeof computeAnilloRingModelBundle>["timeline"]["dayStats"];
  segConquistados: number;
};

let cache: { key: string; model: CachedAnilloModel } | null = null;

function segmentSig(segs: SegmentoAnilloLite[]): string {
  return segs
    .map(s => `${s.id ?? ""}:${(s as { estado?: string }).estado ?? ""}:${s.horaInicio ?? ""}:${s.horaFin ?? ""}`)
    .join("|");
}

function vehicleSig(vehicles: Vehicle[]): string {
  let active = 0;
  for (const v of vehicles) {
    if (v.status === "activo") active += 1;
  }
  return `${vehicles.length}:${active}`;
}

/** Cache compartido entre instancias de AnilloConcienciaLive (cockpit + métricas). */
export function getSharedAnilloLiveModel(
  segmentos: SegmentoAnilloLite[],
  vehicles: Vehicle[],
  nowMs = Date.now()
): CachedAnilloModel {
  const segs = segmentos.filter((s): s is SegmentoAnilloLite => !!s && typeof s === "object");
  const vehiculos = Array.isArray(vehicles) ? vehicles : [];
  const bucket = Math.floor(nowMs / CACHE_BUCKET_MS);
  const key = `${bucket}|${segmentSig(segs)}|${vehicleSig(vehiculos)}`;
  if (cache?.key === key) return cache.model;

  const bundle = computeAnilloRingModelBundle({ segmentos: segs, vehiculos, now: nowMs });
  const segConquistados = segs.filter(s => (s as { estado?: string }).estado === "cerrado_manual").length;
  const model: CachedAnilloModel = {
    segs,
    segmentClockArcs: bundle.segmentClockArcs,
    segmentBattleArcs: bundle.segmentBattleArcs,
    segmentArcStats: bundle.segmentArcStats,
    horizonProjection: computeHorizonProjection({ segmentos: segs, vehiculos, now: nowMs }),
    metricas: bundle.timeline.metricas,
    anilloEstado: bundle.timeline.anilloEstado,
    timelineArcs: bundle.timeline.timelineArcs,
    dayStats: bundle.timeline.dayStats,
    segConquistados,
  };
  cache = { key, model };
  return model;
}

export function invalidateAnilloLiveModelCache(): void {
  cache = null;
}
