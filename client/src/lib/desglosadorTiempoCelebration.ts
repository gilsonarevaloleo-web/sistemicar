import type { SubVehiculo, Vehicle } from "./persistence";
import { formatCombustibleCelebracionBloque } from "./combustibleConciencia";
import { computeDesglosadorSubAwardPS, DESGLOSADOR_CYCLE_CLOSE_BASE_PS } from "./sovereigntyPointsConfig";
import { computeRutaPrivilegioPS } from "./rutaSeguimiento";
import { getDesglosadorSessionElapsedSec } from "./desglosadorClock";

export type DesglosadorTiempoCloseSummary = {
  cumplidos: number;
  fallados: number;
  totalSubs: number;
  minutosSesion: number;
  sessionElapsedSec: number;
  totalRealSec: number;
  totalSugeridoSec: number;
  deltaTotalSec: number;
  deltaGanando: boolean;
  deltaPerdiendo: boolean;
  psSubs: number;
  psCierre: number;
  psProfundidad: number;
  psRuta: number;
  psTotal: number;
  psAwardedNow: number;
  mensaje: string;
  combustibleMensaje: string;
  subs: Array<{
    id: string;
    titulo: string;
    status: SubVehiculo["status"];
    duracionFinal?: number;
    tiempoSugeridoSeg?: number;
    cantidadLograda?: number;
    cantidadObjetivo?: number;
  }>;
};

export function fmtDesgloseSec(sec: number): string {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function computeDesglosadorTiempoCloseSummary(
  vehicle: Vehicle,
  subs: SubVehiculo[],
  opts: {
    duracionMin: number;
    psSubs: number;
    psCierre: number;
    psProfundidad: number;
    psRuta: number;
    psTotal: number;
    psAwardedNow: number;
  }
): DesglosadorTiempoCloseSummary {
  const cumplidos = subs.filter(s => s.status === "cumplido").length;
  const fallados = subs.filter(s => s.status === "fallado").length;
  const sessionElapsedSec = getDesglosadorSessionElapsedSec(vehicle);
  const totalRealSec = subs.reduce((acc, s) => acc + (s.duracionFinal || 0), 0);
  const totalSugeridoSec = subs.reduce((acc, s) => acc + (s.tiempoSugeridoSeg || 0), 0);
  const hasSugerido = totalSugeridoSec > 0;
  const deltaTotalSec = totalRealSec - totalSugeridoSec;
  const deltaGanando = hasSugerido && deltaTotalSec < -5;
  const deltaPerdiendo = hasSugerido && deltaTotalSec > 5;

  let mensaje: string;
  if (cumplidos === subs.length && subs.length > 0) {
    mensaje = deltaGanando
      ? "Ciclo dominado en el tiempo. Enumeraste, ejecutaste y cerraste por debajo de tu referencia — eso es soberanía sobre el reloj."
      : "Dominio total del ciclo. Cada sub sellado es territorio conquistado en el tiempo.";
  } else if (cumplidos >= fallados && cumplidos > 0) {
    mensaje = deltaGanando
      ? "La mayoría de subs quedó cumplida y recuperaste tiempo frente a tu referencia. El desglose te devolvió margen."
      : "Trabajo duro convertido en unidades cerradas. La mayoría de subs quedó cumplida.";
  } else if (cumplidos > 0) {
    mensaje = "Avance parcial en el ciclo. Cada cumplido cuenta — el desglose honesto alimenta tu espejo.";
  } else if (fallados > 0) {
    mensaje = "Ciclo exigente; registrar lo fallado también es soberanía. Mañana afinas tiempos y cantidades.";
  } else {
    mensaje = "Ciclo de desglose cerrado. Nombrar y encadenar subs ya entrena tu capacidad de decidir.";
  }

  const minutosSesion = Math.max(1, opts.duracionMin || Math.round(sessionElapsedSec / 60));

  return {
    cumplidos,
    fallados,
    totalSubs: subs.length,
    minutosSesion,
    sessionElapsedSec,
    totalRealSec,
    totalSugeridoSec,
    deltaTotalSec,
    deltaGanando,
    deltaPerdiendo,
    psSubs: opts.psSubs,
    psCierre: opts.psCierre,
    psProfundidad: opts.psProfundidad,
    psRuta: opts.psRuta,
    psTotal: opts.psTotal,
    psAwardedNow: opts.psAwardedNow,
    mensaje,
    combustibleMensaje: formatCombustibleCelebracionBloque({
      minutos: minutosSesion,
      decisiones: cumplidos,
      psTotal: opts.psTotal,
    }),
    subs: subs.map(sv => ({
      id: sv.id,
      titulo: sv.titulo,
      status: sv.status,
      duracionFinal: sv.duracionFinal,
      tiempoSugeridoSeg: sv.tiempoSugeridoSeg,
      cantidadLograda: sv.cantidadLograda,
      cantidadObjetivo: sv.cantidadObjetivo,
    })),
  };
}

/** Estimación previa al cierre (panel inline «Ciclo completado»). */
export function estimateDesglosadorCloseSummaryFromSubs(
  vehicle: Vehicle,
  subs: SubVehiculo[]
): DesglosadorTiempoCloseSummary {
  const psProfundidad = vehicle.desglosadorBloqueDepthPsGranted ?? 0;
  const psSubs = subs
    .filter(s => s.status === "cumplido")
    .reduce((sum, s) => sum + (s.psOtorgados ?? computeDesglosadorSubAwardPS(s)), 0);
  const psRuta = subs.reduce((sum, s) => sum + computeRutaPrivilegioPS(s), 0);
  const psTotal = psSubs + DESGLOSADOR_CYCLE_CLOSE_BASE_PS + psProfundidad;
  const apertura = vehicle.aperturaAt || vehicle.createdAt?.getTime() || Date.now();
  const duracionMin = Math.max(1, Math.round((Date.now() - apertura) / 60000));
  return computeDesglosadorTiempoCloseSummary(vehicle, subs, {
    duracionMin,
    psSubs,
    psCierre: DESGLOSADOR_CYCLE_CLOSE_BASE_PS,
    psProfundidad,
    psRuta,
    psTotal,
    psAwardedNow: psTotal,
  });
}
