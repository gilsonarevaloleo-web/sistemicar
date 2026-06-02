import type { SegmentoV5, Vehicle } from "./persistence";
import {
  isWithinSegmentTimeMargin,
  segmentTimeToMinutes,
  segmentWindowMs,
} from "./segmentTime";
import { vehicleActiveAt } from "./puntualidadEngine";

export type PrimerEntradaTipo = {
  tipoFlota?: string;
  tipoReloj?: string;
  titulo?: string;
};

export type SegmentoDisciplina = {
  segmentoId: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  puertaAbiertaAt: number | null;
  puertaManual: boolean;
  primerEntradaAt: number | null;
  primerEntradaTipo: PrimerEntradaTipo;
  deltaDesdeInicioMin: number | null;
  deltaDesdePuertaMin: number | null;
  sinEntrada: boolean;
  montaje: boolean;
  scoreSegmento: number;
  evaluable: boolean;
  enCurso: boolean;
};

export type EstudioTipoVehiculo = {
  tipoFlota: string;
  tipoReloj: string;
  count: number;
};

export type DisciplinaDia = {
  segmentos: SegmentoDisciplina[];
  indiceDisciplina: number;
  entradasTotales: number;
  sinEntrada: number;
  deltaMedioDesdeInicioMin: number | null;
  deltaMedioDesdePuertaMin: number | null;
  estudioTipos: EstudioTipoVehiculo[];
  montajes: number;
};

function sortSegmentos(segmentos: SegmentoV5[]): SegmentoV5[] {
  return [...segmentos].sort(
    (a, b) => segmentTimeToMinutes(a.horaInicio) - segmentTimeToMinutes(b.horaInicio)
  );
}

/** Vehículo consciente que cuenta como entrada al trabajo. */
export function isTrabajoConsciente(v: Vehicle): boolean {
  return !v.autoVerdad && v.tipoFlota !== "descanso";
}

function vehiculosEnVentana(
  vehicles: Vehicle[],
  start: number,
  end: number
): Vehicle[] {
  return vehicles.filter(
    v =>
      isTrabajoConsciente(v) &&
      v.aperturaAt != null &&
      v.aperturaAt >= start &&
      v.aperturaAt <= end
  );
}

function primerVehiculoPorApertura(vehicles: Vehicle[]): Vehicle | null {
  if (vehicles.length === 0) return null;
  return vehicles.reduce((best, v) =>
    (v.aperturaAt ?? Infinity) < (best.aperturaAt ?? Infinity) ? v : best
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

function detectMontajeCruce(vehicles: Vehicle[], segmento: SegmentoV5): Vehicle[] {
  return vehicles.filter(
    v =>
      v.tipoFlota === "situacion" &&
      (v.segmentosCruzados ?? 0) > 0 &&
      (v.segmentoMontadoId === segmento.id ||
        v.segmentoMontadoNombre === segmento.nombre)
  );
}

function computeScoreSegmento(
  sinEntrada: boolean,
  deltaDesdeInicioMin: number | null,
  duracionMin: number
): number {
  if (sinEntrada || deltaDesdeInicioMin == null || duracionMin <= 0) return 0;
  return Math.round(
    Math.max(0, 100 - (deltaDesdeInicioMin / duracionMin) * 100)
  );
}

function tipoKey(v: Vehicle): string {
  return `${v.tipoFlota ?? "otro"}|${v.tipoReloj ?? "-"}`;
}

function buildEstudioTipos(vehicles: Vehicle[], segmentos: SegmentoV5[], dayStartMs: number): EstudioTipoVehiculo[] {
  const map = new Map<string, number>();
  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(seg.horaInicio, seg.horaFin, dayStartMs);
    for (const v of vehiculosEnVentana(vehicles, start, end)) {
      const key = tipoKey(v);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([key, count]) => {
      const [tipoFlota, tipoReloj] = key.split("|");
      return { tipoFlota, tipoReloj, count };
    })
    .sort((a, b) => b.count - a.count);
}

/** Disciplina del día: minutos hasta entrar al trabajo y score por segmento. */
export function computeDisciplinaDia(params: {
  segmentos: SegmentoV5[];
  vehicles: Vehicle[];
  dayStartMs: number;
  nowMs?: number;
}): DisciplinaDia {
  const { segmentos, vehicles, dayStartMs, nowMs = Date.now() } = params;
  const ordered = sortSegmentos(segmentos);

  const segmentosOut: SegmentoDisciplina[] = ordered.map(seg => {
    const { start, end, durationMin } = segmentWindowMs(
      seg.horaInicio,
      seg.horaFin,
      dayStartMs
    );
    const evaluable = nowMs >= end;
    const enCurso = nowMs >= start && nowMs < end;

    const puertaAbiertaAt =
      seg.activadoAt != null &&
      (seg.estado === "activo" ||
        seg.estado === "cerrado_manual" ||
        seg.estado === "entropia")
        ? seg.activadoAt
        : null;

    const puertaManual =
      puertaAbiertaAt != null &&
      isWithinSegmentTimeMargin(
        puertaAbiertaAt,
        seg.horaInicio,
        seg.horaFin,
        "inicio",
        5,
        dayStartMs
      );

    const enVentana = vehiculosEnVentana(vehicles, start, end);
    const primer = primerVehiculoPorApertura(enVentana);
    const primerEntradaAt = primer?.aperturaAt ?? null;

    const deltaDesdeInicioMin =
      primerEntradaAt != null
        ? Math.max(0, Math.round((primerEntradaAt - start) / 60000))
        : null;

    const deltaDesdePuertaMin =
      primerEntradaAt != null && puertaAbiertaAt != null
        ? Math.max(0, Math.round((primerEntradaAt - puertaAbiertaAt) / 60000))
        : null;

    const sinEntrada = evaluable && primerEntradaAt == null;

    const invasores =
      nowMs >= start ? detectMontajeInvasores(vehicles, seg, start, nowMs) : [];
    const cruce = detectMontajeCruce(vehicles, seg);
    const montaje = invasores.length > 0 || cruce.length > 0;

    const scoreSegmento = computeScoreSegmento(
      sinEntrada,
      deltaDesdeInicioMin,
      durationMin
    );

    return {
      segmentoId: seg.id,
      nombre: seg.nombre,
      horaInicio: seg.horaInicio,
      horaFin: seg.horaFin,
      puertaAbiertaAt,
      puertaManual,
      primerEntradaAt,
      primerEntradaTipo: primer
        ? {
            tipoFlota: primer.tipoFlota,
            tipoReloj: primer.tipoReloj,
            titulo: primer.titulo,
          }
        : {},
      deltaDesdeInicioMin,
      deltaDesdePuertaMin,
      sinEntrada,
      montaje,
      scoreSegmento,
      evaluable,
      enCurso,
    };
  });

  const evaluables = segmentosOut.filter(s => s.evaluable);
  const conEntrada = segmentosOut.filter(s => s.primerEntradaAt != null);
  const sinEntradaCount = segmentosOut.filter(s => s.sinEntrada).length;
  const montajes = segmentosOut.filter(s => s.montaje).length;

  const indiceDisciplina =
    evaluables.length > 0
      ? Math.round(
          evaluables.reduce((acc, s) => acc + s.scoreSegmento, 0) / evaluables.length
        )
      : conEntrada.length > 0
        ? Math.round(
            conEntrada.reduce((acc, s) => acc + s.scoreSegmento, 0) / conEntrada.length
          )
        : 0;

  const deltasInicio = conEntrada
    .map(s => s.deltaDesdeInicioMin)
    .filter((d): d is number => d != null);
  const deltasPuerta = conEntrada
    .map(s => s.deltaDesdePuertaMin)
    .filter((d): d is number => d != null);

  const deltaMedioDesdeInicioMin =
    deltasInicio.length > 0
      ? Math.round(deltasInicio.reduce((a, b) => a + b, 0) / deltasInicio.length)
      : null;

  const deltaMedioDesdePuertaMin =
    deltasPuerta.length > 0
      ? Math.round(deltasPuerta.reduce((a, b) => a + b, 0) / deltasPuerta.length)
      : null;

  return {
    segmentos: segmentosOut,
    indiceDisciplina,
    entradasTotales: conEntrada.length,
    sinEntrada: sinEntradaCount,
    deltaMedioDesdeInicioMin,
    deltaMedioDesdePuertaMin,
    estudioTipos: buildEstudioTipos(vehicles, ordered, dayStartMs),
    montajes,
  };
}

export function describeSegmentoDisciplina(sd: SegmentoDisciplina): string {
  if (sd.sinEntrada) return "Sin entrada al trabajo en este ciclo";
  if (sd.primerEntradaAt == null && sd.enCurso) return "Ciclo en curso — aún sin entrada";
  if (sd.primerEntradaAt == null) return "En curso";
  const tipo = sd.primerEntradaTipo.tipoReloj ?? sd.primerEntradaTipo.tipoFlota ?? "vehículo";
  const desdeInicio =
    sd.deltaDesdeInicioMin != null ? `+${sd.deltaDesdeInicioMin} min desde inicio` : "";
  const desdePuerta =
    sd.deltaDesdePuertaMin != null ? `+${sd.deltaDesdePuertaMin} min desde puerta` : "";
  const partes = [desdeInicio, desdePuerta, tipo].filter(Boolean);
  if (sd.montaje) partes.push("montaje situacional");
  return partes.join(" · ");
}

export function disciplinaBadgeLabel(sd: SegmentoDisciplina): string | null {
  if (sd.montaje && sd.enCurso) return "M!";
  if (sd.sinEntrada) return "—";
  if (sd.deltaDesdeInicioMin != null) return `+${sd.deltaDesdeInicioMin}`;
  if (sd.enCurso) return "…";
  return null;
}

export function formatEstudioTipoChip(e: EstudioTipoVehiculo): string {
  const label =
    e.tipoReloj && e.tipoReloj !== "-"
      ? e.tipoReloj
      : e.tipoFlota;
  return `${label} · ${e.count}`;
}

export function computeDisciplinaCompare(
  yesterday: DisciplinaDia | null | undefined,
  today: DisciplinaDia
): { headline: string; motivacion: string; deltaIndice: number | null } {
  const hasYesterday = yesterday != null && yesterday.indiceDisciplina > 0;
  const deltaIndice = hasYesterday
    ? today.indiceDisciplina - yesterday!.indiceDisciplina
    : null;

  const headline = `Índice ${today.indiceDisciplina} · ${today.entradasTotales} entradas al trabajo`;

  let motivacion: string;
  if (today.deltaMedioDesdeInicioMin != null) {
    motivacion = `Δ medio ${today.deltaMedioDesdeInicioMin} min hasta el primer vehículo consciente`;
  } else {
    motivacion = "Disciplina operativa: cuándo entras al trabajo con vehículos (independiente de la puerta).";
  }

  if (deltaIndice != null && deltaIndice > 0) {
    motivacion += ` · +${deltaIndice} vs ayer.`;
  } else if (deltaIndice != null && deltaIndice < 0) {
    motivacion += ` · ${deltaIndice} vs ayer.`;
  }

  return { headline, motivacion, deltaIndice };
}

export type DisciplinaSeriePoint = {
  fecha: string;
  indiceDisciplina: number;
  label: string;
};

/** Serie para gráfico de línea (snapshots + hoy en vivo). */
export function buildDisciplinaSerie(
  snapshots: Array<{ fecha: string; disciplina?: DisciplinaDia }>,
  todayLive?: DisciplinaDia,
  todayFecha?: string
): DisciplinaSeriePoint[] {
  const byFecha = new Map<string, number>();
  for (const s of snapshots) {
    if (s.disciplina != null) {
      byFecha.set(s.fecha, s.disciplina.indiceDisciplina);
    }
  }
  if (todayLive && todayFecha) {
    byFecha.set(todayFecha, todayLive.indiceDisciplina);
  }
  return Array.from(byFecha.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, indiceDisciplina]) => ({
      fecha,
      indiceDisciplina,
      label: fecha.slice(5).replace("-", "/"),
    }));
}
