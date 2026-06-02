import type { SegmentoV5 } from "./persistence";
import { getJournalDayStartMs, segmentWindowMs } from "./segmentTime";
import type { PuertaTiming } from "./segmentAttentionEngine";
import { isWithinPuertaWindow } from "./segmentAttentionEngine";

export type { PuertaTiming };

export type SegmentoAtencion = {
  segmentoId: string;
  nombre: string;
  horaInicio: string;
  puertaAbierta: boolean;
  puertaTiming: PuertaTiming | null;
  puertaPerdida: boolean;
  cierreConsciente: boolean;
  ventanaPuertaAbierta: boolean;
  evaluable: boolean;
};

export type AtencionPanoramicaDia = {
  segmentos: SegmentoAtencion[];
  puertasAbiertas: number;
  puertasPerdidas: number;
  cierresConscientes: number;
  ratioAntesVoz: number | null;
  indiceAtencion: number;
};

export function atencionBadgeLabel(sa: SegmentoAtencion): string | null {
  if (sa.puertaPerdida) return "—";
  if (sa.puertaTiming === "antes_voz") return "AV";
  if (sa.puertaTiming === "despues_voz") return "DV";
  if (sa.ventanaPuertaAbierta) return "…";
  return null;
}

export function describeSegmentoAtencion(sa: SegmentoAtencion): string {
  if (sa.puertaPerdida) return "Puerta de atención no abierta a tiempo";
  if (sa.cierreConsciente) {
    if (sa.puertaTiming === "antes_voz") return "Puerta abierta antes de la voz · cierre consciente";
    if (sa.puertaTiming === "despues_voz") return "Puerta abierta tras la voz · cierre consciente";
    return "Cierre consciente";
  }
  if (sa.puertaAbierta && sa.puertaTiming === "antes_voz") return "Puerta abierta antes de la voz";
  if (sa.puertaAbierta && sa.puertaTiming === "despues_voz") return "Puerta abierta tras la voz";
  if (sa.ventanaPuertaAbierta) return "Ventana de puerta abierta — marca tu atención";
  if (sa.evaluable) return "Sin puerta en este ciclo";
  return "Pendiente";
}

export function computeAtencionPanoramicaDia(params: {
  segmentos: SegmentoV5[];
  nowMs?: number;
  dayStartMs?: number;
}): AtencionPanoramicaDia {
  const nowMs = params.nowMs ?? Date.now();
  const dayStartMs = params.dayStartMs ?? getJournalDayStartMs(nowMs);

  const segmentosOut: SegmentoAtencion[] = params.segmentos.map(seg => {
    const { end } = segmentWindowMs(seg.horaInicio, seg.horaFin, dayStartMs);
    const evaluable = nowMs >= end || seg.estado === "entropia" || seg.estado === "cerrado_manual";
    const puertaAbierta =
      seg.activadoAt != null &&
      (seg.estado === "activo" || seg.estado === "cerrado_manual" || seg.estado === "entropia");
    const puertaPerdida =
      seg.estado === "entropia" && (seg.activadoAt == null || !puertaAbierta);
    const cierreConsciente = seg.estado === "cerrado_manual";
    const ventanaPuertaAbierta =
      seg.estado === "pendiente" && isWithinPuertaWindow(nowMs, seg.horaInicio, dayStartMs);

    return {
      segmentoId: seg.id,
      nombre: seg.nombre,
      horaInicio: seg.horaInicio,
      puertaAbierta,
      puertaTiming: seg.puertaTiming ?? null,
      puertaPerdida,
      cierreConsciente,
      ventanaPuertaAbierta,
      evaluable,
    };
  });

  const puertasAbiertas = segmentosOut.filter(s => s.puertaAbierta).length;
  const puertasPerdidas = segmentosOut.filter(s => s.puertaPerdida).length;
  const cierresConscientes = segmentosOut.filter(s => s.cierreConsciente).length;

  const conTiming = segmentosOut.filter(s => s.puertaTiming != null);
  const antesVoz = conTiming.filter(s => s.puertaTiming === "antes_voz").length;
  const ratioAntesVoz =
    conTiming.length > 0 ? Math.round((antesVoz / conTiming.length) * 100) : null;

  const evaluables = segmentosOut.filter(s => s.evaluable || s.puertaPerdida);
  const aciertos = evaluables.filter(s => s.puertaAbierta && !s.puertaPerdida).length;
  const indiceAtencion =
    evaluables.length > 0 ? Math.round((aciertos / evaluables.length) * 100) : 0;

  return {
    segmentos: segmentosOut,
    puertasAbiertas,
    puertasPerdidas,
    cierresConscientes,
    ratioAntesVoz,
    indiceAtencion,
  };
}

export function computeAtencionCompare(
  yesterday: AtencionPanoramicaDia | null | undefined,
  today: AtencionPanoramicaDia
): { headline: string; motivacion: string; deltaIndice: number | null } {
  const deltaIndice =
    yesterday != null && yesterday.indiceAtencion > 0
      ? today.indiceAtencion - yesterday.indiceAtencion
      : null;

  const headline = `Índice ${today.indiceAtencion} · ${today.puertasAbiertas} puertas abiertas`;

  let motivacion = "Marca la puerta de atención en ±5 min del inicio. La voz llega al minuto 4.";
  if (today.ratioAntesVoz != null) {
    motivacion = `${today.ratioAntesVoz}% de puertas abiertas antes de la voz (autonomía).`;
  }
  if (today.puertasPerdidas > 0) {
    motivacion += ` ${today.puertasPerdidas} puerta(s) perdida(s).`;
  }
  if (deltaIndice != null && deltaIndice > 0) {
    motivacion += ` +${deltaIndice} vs ayer.`;
  }

  return { headline, motivacion, deltaIndice };
}
