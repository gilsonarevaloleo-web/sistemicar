import type { SegmentoV5, Vehicle } from "./persistence";
import { segmentClockMs, segmentTimeToMinutes, segmentWindowMs } from "./segmentTime";

export type SegmentoPuntualidadEstado =
  | "puntual"
  | "vacio"
  | "montaje"
  | "mixto"
  | "pendiente";

export type SegmentoPuntualidad = {
  segmentoId: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  vacio: boolean;
  montaje: boolean;
  montajeVehiculoIds: string[];
  montajeOrigenNombres: string[];
  estado: SegmentoPuntualidadEstado;
  evaluable: boolean;
  enRiesgoVacio: boolean;
};

export type PuntualidadDia = {
  segmentos: SegmentoPuntualidad[];
  totalSegmentos: number;
  evaluables: number;
  puntuales: number;
  vacios: number;
  montajes: number;
  puntualidadPct: number;
};

function sortSegmentos(segmentos: SegmentoV5[]): SegmentoV5[] {
  return [...segmentos].sort(
    (a, b) => segmentTimeToMinutes(a.horaInicio) - segmentTimeToMinutes(b.horaInicio)
  );
}

export function isCumplimientoVehicle(v: Vehicle): boolean {
  return !v.autoVerdad && v.tipoFlota !== "descanso";
}

export function vehicleActiveAt(v: Vehicle, ts: number): boolean {
  if (v.aperturaAt == null || v.aperturaAt > ts) return false;
  if (v.status === "activo") return true;
  return (v.cierreAt ?? 0) > ts;
}

function cumplimientoEnVentana(
  vehicles: Vehicle[],
  segmentoNombre: string,
  start: number,
  end: number
): Vehicle[] {
  return vehicles.filter(
    v =>
      isCumplimientoVehicle(v) &&
      v.segmentoOrigen === segmentoNombre &&
      v.aperturaAt != null &&
      v.aperturaAt >= start &&
      v.aperturaAt <= end
  );
}

function detectMontajeInvasores(
  vehicles: Vehicle[],
  segmento: SegmentoV5,
  start: number,
  evalAt: number
): Vehicle[] {
  const ts = Math.max(start, evalAt);
  return vehicles.filter(
    v =>
      v.tipoFlota === "situacion" &&
      !v.autoVerdad &&
      v.aperturaAt != null &&
      v.aperturaAt < start &&
      vehicleActiveAt(v, ts) &&
      v.segmentoOrigen !== segmento.nombre
  );
}

function detectMontajeCruce(
  vehicles: Vehicle[],
  segmento: SegmentoV5
): Vehicle[] {
  return vehicles.filter(
    v =>
      v.tipoFlota === "situacion" &&
      (v.segmentosCruzados ?? 0) > 0 &&
      (v.segmentoMontadoId === segmento.id ||
        v.segmentoMontadoNombre === segmento.nombre)
  );
}

function resolveEstado(vacio: boolean, montaje: boolean, evaluable: boolean): SegmentoPuntualidadEstado {
  if (vacio && montaje) return "mixto";
  if (montaje) return "montaje";
  if (vacio && evaluable) return "vacio";
  if (!evaluable && !montaje) return "pendiente";
  return "puntual";
}

/** Calcula puntualidad del día: vacío (sin vehículos en ventana) y montaje (situacional invade segmento). */
export function computePuntualidadDia(params: {
  segmentos: SegmentoV5[];
  vehicles: Vehicle[];
  dayStartMs: number;
  nowMs?: number;
}): PuntualidadDia {
  const { segmentos, vehicles, dayStartMs, nowMs = Date.now() } = params;
  const ordered = sortSegmentos(segmentos);

  const segmentosOut: SegmentoPuntualidad[] = ordered.map(seg => {
    const { start, end } = segmentWindowMs(seg.horaInicio, seg.horaFin, dayStartMs);
    const evaluable = nowMs >= end;
    const cumplimiento = cumplimientoEnVentana(vehicles, seg.nombre, start, end);
    const vacio = evaluable && cumplimiento.length === 0;

    const invasores =
      nowMs >= start
        ? detectMontajeInvasores(vehicles, seg, start, nowMs)
        : [];
    const cruce = detectMontajeCruce(vehicles, seg);
    const montajeVehiculos = [...new Map(
      [...invasores, ...cruce].map(v => [v.id, v])
    ).values()];
    const montaje = montajeVehiculos.length > 0;

    const cumplimientoParcial = cumplimientoEnVentana(
      vehicles,
      seg.nombre,
      start,
      Math.min(nowMs, end)
    );
    const enRiesgoVacio =
      !evaluable && nowMs >= start && cumplimientoParcial.length === 0;

    const montajeOrigenNombres = [
      ...new Set(
        montajeVehiculos
          .map(v => v.segmentoOrigen)
          .filter((n): n is string => Boolean(n))
      ),
    ];

    const estado = resolveEstado(vacio, montaje, evaluable);

    return {
      segmentoId: seg.id,
      nombre: seg.nombre,
      horaInicio: seg.horaInicio,
      horaFin: seg.horaFin,
      vacio,
      montaje,
      montajeVehiculoIds: montajeVehiculos.map(v => v.id),
      montajeOrigenNombres,
      estado,
      evaluable,
      enRiesgoVacio,
    };
  });

  const evaluables = segmentosOut.filter(s => s.evaluable || s.montaje).length;
  const puntuales = segmentosOut.filter(s => s.estado === "puntual").length;
  const vacios = segmentosOut.filter(s => s.vacio).length;
  const montajes = segmentosOut.filter(s => s.montaje).length;
  const puntualidadPct =
    evaluables > 0 ? Math.round((puntuales / evaluables) * 100) : 100;

  return {
    segmentos: segmentosOut,
    totalSegmentos: segmentosOut.length,
    evaluables,
    puntuales,
    vacios,
    montajes,
    puntualidadPct,
  };
}

export function describeSegmentoPuntualidad(sp: SegmentoPuntualidad): string {
  if (sp.estado === "puntual") return "Cumplimiento en ventana";
  if (sp.estado === "vacio") return "Ningún vehículo en ventana";
  if (sp.estado === "montaje") {
    const origen = sp.montajeOrigenNombres.length
      ? sp.montajeOrigenNombres.join(", ")
      : "segmento anterior";
    return `Situacional de ${origen} montó este segmento`;
  }
  if (sp.estado === "mixto") {
    return "Montaje + sin vehículos propios en ventana";
  }
  if (sp.enRiesgoVacio) return "Sin vehículos aún · ventana en curso";
  return "En curso";
}

export function punctualidadBadgeLabel(estado: SegmentoPuntualidadEstado): string | null {
  switch (estado) {
    case "puntual":
      return "OK";
    case "vacio":
      return "V";
    case "montaje":
      return "M";
    case "mixto":
      return "V+M";
    default:
      return null;
  }
}

export function computePuntualidadCompare(
  yesterday: PuntualidadDia | null | undefined,
  today: PuntualidadDia
): { headline: string; motivacion: string; deltaPct: number | null } {
  const hasYesterday = yesterday != null && yesterday.evaluables > 0;
  const deltaPct = hasYesterday
    ? today.puntualidadPct - yesterday!.puntualidadPct
    : null;

  const headline = hasYesterday
    ? `${today.puntuales}/${today.evaluables || today.totalSegmentos} puntuales · ${today.puntualidadPct}%`
    : `${today.puntuales}/${today.evaluables || today.totalSegmentos} segmentos puntuales hoy`;

  let motivacion: string;
  if (!hasYesterday) {
    motivacion = "Propósito (segmento) vs cumplimiento (vehículo en ventana).";
  } else if (deltaPct != null && deltaPct > 0) {
    motivacion = `+${deltaPct} pts vs ayer en puntualidad.`;
  } else if (deltaPct != null && deltaPct < 0) {
    motivacion = `${deltaPct} pts vs ayer · revisa vacíos y montajes.`;
  } else {
    motivacion = "Misma puntualidad que ayer.";
  }

  return { headline, motivacion, deltaPct };
}

/** Segmentos que acaban de entrar en ventana de montaje (para tick en vivo). */
export function segmentosConMontajeEnVivo(params: {
  segmentos: SegmentoV5[];
  vehicles: Vehicle[];
  dayStartMs: number;
  nowMs?: number;
  marginMin?: number;
}): string[] {
  const { segmentos, vehicles, dayStartMs, nowMs = Date.now(), marginMin = 1 } = params;
  const marginMs = marginMin * 60_000;
  const ids: string[] = [];

  for (const seg of segmentos) {
    const start = segmentClockMs(seg.horaInicio, dayStartMs);
    if (nowMs < start || nowMs > start + marginMs) continue;
    const invasores = detectMontajeInvasores(vehicles, seg, start, nowMs);
    const cruce = detectMontajeCruce(vehicles, seg);
    if (invasores.length > 0 || cruce.length > 0) ids.push(seg.id);
  }
  return ids;
}
