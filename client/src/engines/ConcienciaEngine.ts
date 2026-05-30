import { getJournalDayStartMs, getLimaDayStartMs, segmentWindowMs } from "@/lib/segmentTime";

export type NivelFatiga = 'Optimo' | 'Distraccion' | 'Confusion' | 'Aburrimiento' | 'Cansancio';

export interface MetricasAnillo {
  planificacionPct: number;
  conquistaPct: number;
}

export const evaluarCapaFatiga = (
  tiempoTranscurrido: number,
  tiempoEstimado: number,
  cambiosDeEstadoRecientes: number,
  horaActual: number
): NivelFatiga => {
  if (tiempoTranscurrido > 7200) return 'Cansancio';
  if (cambiosDeEstadoRecientes > 3 && tiempoTranscurrido < 300) return 'Confusion';
  if (tiempoEstimado > 0 && tiempoTranscurrido > tiempoEstimado * 1.3) return 'Distraccion';
  if (tiempoTranscurrido > 3600 && horaActual >= 14 && horaActual <= 16) return 'Aburrimiento';
  return 'Optimo';
};

function parseSegMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export const calcularAnilloSoberania = (
  segmentos: any[],
  vehiculos: any[]
): MetricasAnillo => {
  const minutosPlaneados = segmentos.reduce((acc, s) => {
    const ini = parseSegMinutes(s.horaInicio);
    const fin = parseSegMinutes(s.horaFin);
    const dur = fin >= ini ? fin - ini : fin + 1440 - ini;
    return acc + Math.max(0, dur);
  }, 0);
  const planificacionPct = Math.min(100, (minutosPlaneados / 1440) * 100);

  const segmentosConActividad = new Set(vehiculos.map((v: any) => v.segmentoId));
  const conquistaPct =
    segmentos.length > 0
      ? (segmentosConActividad.size / segmentos.length) * 100
      : 0;

  return { planificacionPct, conquistaPct };
};

export interface VehiculoAnilloLite {
  autoVerdad?: boolean;
  status?: string;
  tipoFlota?: string;
  aperturaAt?: number;
  cierreAt?: number;
  duracionFinal?: number;
  completedAt?: number | Date;
}

export type TimelineArcKind = "conquista" | "entropia" | "fondo" | "reposo";

export type AnilloPointerMode = "reposo" | "conquista" | "entropia" | "calibracion" | "neutro";

/** Contingencia sin segmentos: umbral a las 06:00 AM (360 min desde medianoche). */
export const UMBRAL_CONTINGENCIA_MIN = 6 * 60;

const MINUTOS_DIA = 1440;

export interface TimelineClockArc {
  startDeg: number;
  endDeg: number;
  kind: TimelineArcKind;
}

export interface TimelineDayStats {
  conquistaMin: number;
  entropiaMin: number;
  vacioMin: number;
  centinelaMin: number;
}

export interface SegmentoAnilloLite {
  horaInicio?: string;
  horaFin?: string;
}

export interface MetricasAnilloConciencia {
  planificacionPct: number;
  conquistaMin: number;
  entropiaMin: number;
  jornadaMin: number;
  conquistaArcPct: number;
  entropiaArcPct: number;
  fillPct: number;
  horasCubiertas: number;
}

function sumMinutosPlaneados(segmentos: SegmentoAnilloLite[]): number {
  return segmentos.reduce((acc, s) => {
    const ini = parseSegMinutes(s.horaInicio || "");
    const fin = parseSegMinutes(s.horaFin || "");
    const dur = fin >= ini ? fin - ini : fin + 1440 - ini;
    return acc + Math.max(0, dur);
  }, 0);
}


function overlapMinutes(
  sessionStart: number,
  sessionEnd: number,
  winStart: number,
  winEnd: number
): number {
  const start = Math.max(sessionStart, winStart);
  const end = Math.min(sessionEnd, winEnd);
  return Math.max(0, (end - start) / 60000);
}

function completedAtMs(v: VehiculoAnilloLite): number | undefined {
  if (!v.completedAt) return undefined;
  return v.completedAt instanceof Date ? v.completedAt.getTime() : v.completedAt;
}

export function vehicleSessionRange(
  v: VehiculoAnilloLite,
  now: number
): { start: number; end: number } | null {
  const start = v.aperturaAt;
  if (!start) return null;
  let end: number;
  if (v.status === "activo") {
    end = now;
  } else if (v.cierreAt) {
    end = v.cierreAt;
  } else if (v.duracionFinal != null && v.duracionFinal > 0) {
    end = start + v.duracionFinal * 60000;
  } else {
    const completed = completedAtMs(v);
    if (completed && completed > start) {
      end = completed;
    } else if (v.status === "cumplido" || v.status === "archivado") {
      end = start + 60000;
    } else {
      return null;
    }
  }
  return end > start ? { start, end } : null;
}

type MsInterval = { start: number; end: number };

function clipInterval(interval: MsInterval, winStart: number, winEnd: number): MsInterval | null {
  const start = Math.max(interval.start, winStart);
  const end = Math.min(interval.end, winEnd);
  return end > start ? { start, end } : null;
}

function mergeMsIntervals(intervals: MsInterval[]): MsInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: MsInterval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function subtractMsIntervals(base: MsInterval[], subtract: MsInterval[]): MsInterval[] {
  let result = [...base];
  for (const sub of subtract) {
    const next: MsInterval[] = [];
    for (const interval of result) {
      if (sub.end <= interval.start || sub.start >= interval.end) {
        next.push(interval);
        continue;
      }
      if (sub.start > interval.start) {
        next.push({ start: interval.start, end: sub.start });
      }
      if (sub.end < interval.end) {
        next.push({ start: sub.end, end: interval.end });
      }
    }
    result = next;
  }
  return result;
}

/** Grados en reloj 24h: 00:00 arriba, sentido horario; 100% = 1440 min. */
export function clockMinutesToDeg(totalMinutes: number): number {
  const m = ((totalMinutes % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  return m * 0.25;
}

/** Puntero en tiempo real Lima: (Horas × 15) + (Minutos × 0.25). */
export function nowToClockDeg(nowMs: number = Date.now()): number {
  const dayStartMs = getLimaDayStartMs(nowMs);
  const min = (nowMs - dayStartMs) / 60000;
  const sec = ((nowMs - dayStartMs) % 60000) / 1000;
  return clockMinutesToDeg(min) + sec * (0.25 / 60);
}

/** Convierte instante Lima (ms desde medianoche del día calendario) a grados del reloj. */
export function msToClockDeg(ms: number, dayStartMs: number): number {
  const minutesFromMidnight = (ms - dayStartMs) / 60000;
  return clockMinutesToDeg(minutesFromMidnight);
}

/** Hora de inicio del primer segmento planificado (Umbral de Conciencia). */
export function getUmbralConcienciaMin(segmentos: SegmentoAnilloLite[]): number {
  if (segmentos.length === 0) return UMBRAL_CONTINGENCIA_MIN;
  let min = MINUTOS_DIA;
  for (const s of segmentos) {
    const ini = parseSegMinutes(s.horaInicio || "");
    if (ini < min) min = ini;
  }
  return min;
}

function getNowMinutesLima(nowMs: number, dayStartMs: number): number {
  return Math.max(0, Math.min(MINUTOS_DIA, Math.floor((nowMs - dayStartMs) / 60000)));
}

function hasVoluntaryOverlapInWindow(
  sessions: MsInterval[],
  winStart: number,
  winEnd: number
): boolean {
  for (const s of sessions) {
    if (overlapMinutes(s.start, s.end, winStart, winEnd) > 0) return true;
  }
  return false;
}

function intervalToClockArc(interval: MsInterval, dayStartMs: number, kind: TimelineArcKind): TimelineClockArc {
  let startDeg = msToClockDeg(interval.start, dayStartMs);
  let endDeg = msToClockDeg(interval.end, dayStartMs);
  if (endDeg <= startDeg) endDeg += 360;
  return { startDeg, endDeg, kind };
}

export function filterVehiculosCalendarioHoy(
  vehiculos: VehiculoAnilloLite[],
  now: number = Date.now()
): VehiculoAnilloLite[] {
  const dayStartMs = getLimaDayStartMs(now);
  const dayEndMs = dayStartMs + 86400000;
  return vehiculos.filter(v => {
    const session = vehicleSessionRange(v, now);
    if (!session) return false;
    return session.end > dayStartMs && session.start < dayEndMs;
  });
}

/**
 * Reloj 24h bio-adaptativo:
 * - Reposo neutro antes del Umbral (primer segmento o 06:00 sin segmentos).
 * - Morado = vehículo voluntario (conquista de atención).
 * - Rojo = bloque planificado iniciado sin activación voluntaria.
 * - Huecos sin planificación = solo pista apagada (sin rojo).
 */
export function computeTimelineClockArcs(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineClockArc[] {
  const now = params.now ?? Date.now();
  const dayStartMs = getLimaDayStartMs(now);
  const dayEndMs = dayStartMs + 86400000;
  const nowMs = Math.min(now, dayEndMs);
  const nowMin = getNowMinutesLima(nowMs, dayStartMs);
  const segmentos = params.segmentos ?? [];
  const hasSegments = segmentos.length > 0;
  const umbralMin = getUmbralConcienciaMin(segmentos);

  const arcs: TimelineClockArc[] = [{ startDeg: 0, endDeg: 360, kind: "fondo" }];

  const reposoEndMin = Math.min(nowMin, umbralMin);
  if (reposoEndMin > 0) {
    arcs.push({
      startDeg: 0,
      endDeg: clockMinutesToDeg(reposoEndMin),
      kind: "reposo",
    });
  }

  if (nowMin < umbralMin) return arcs;

  if (!hasSegments) return arcs;

  const livedStartMs = dayStartMs + umbralMin * 60000;
  const livedEndMs = nowMs;
  if (livedEndMs <= livedStartMs) return arcs;

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);
  const voluntarySessions = todayVehicles
    .filter(v => !v.autoVerdad)
    .map(v => vehicleSessionRange(v, now))
    .filter((s): s is MsInterval => s != null)
    .map(s => clipInterval(s, livedStartMs, livedEndMs))
    .filter((s): s is MsInterval => s != null);

  const consciousMerged = mergeMsIntervals(voluntarySessions);
  for (const interval of consciousMerged) {
    arcs.push(intervalToClockArc(interval, dayStartMs, "conquista"));
  }

  const entropyRaw: MsInterval[] = [];
  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(
      seg.horaInicio || "00:00",
      seg.horaFin || "00:00",
      dayStartMs
    );
    const evalStart = Math.max(start, livedStartMs);
    const evalEnd = Math.min(end, nowMs);
    if (evalEnd <= evalStart) continue;
    if (!hasVoluntaryOverlapInWindow(voluntarySessions, evalStart, evalEnd)) {
      entropyRaw.push({ start: evalStart, end: evalEnd });
    }
  }

  const entropyMerged = mergeMsIntervals(entropyRaw);
  const entropyNet = subtractMsIntervals(entropyMerged, consciousMerged);
  for (const interval of entropyNet) {
    arcs.push(intervalToClockArc(interval, dayStartMs, "entropia"));
  }

  return arcs;
}

export interface AnilloEstadoVivo {
  deg: number;
  mode: AnilloPointerMode;
  umbralMin: number;
  sinSegmentos: boolean;
  centerGuide?: string;
}

/** Estado del puntero y mensaje central (Modo Calibración / reposo / entropía / conquista). */
export function computeAnilloEstado(params: {
  segmentos: SegmentoAnilloLite[];
  vehiculos: VehiculoAnilloLite[];
  now?: number;
}): AnilloEstadoVivo {
  const now = params.now ?? Date.now();
  const dayStartMs = getLimaDayStartMs(now);
  const nowMs = Math.min(now, dayStartMs + 86400000);
  const nowMin = getNowMinutesLima(nowMs, dayStartMs);
  const segmentos = params.segmentos;
  const hasSegments = segmentos.length > 0;
  const umbralMin = getUmbralConcienciaMin(segmentos);
  const deg = nowToClockDeg(nowMs);

  if (nowMin < umbralMin) {
    return { deg, mode: "reposo", umbralMin, sinSegmentos: !hasSegments };
  }

  if (!hasSegments) {
    return {
      deg,
      mode: "calibracion",
      umbralMin,
      sinSegmentos: true,
      centerGuide: "Fundá tu primer vehículo situacional para calibrar el día.",
    };
  }

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);
  const situacionActiva = todayVehicles.some(
    v => !v.autoVerdad && v.tipoFlota === "situacion" && v.status === "activo"
  );
  const cualquierVoluntarioActivo = todayVehicles.some(
    v => !v.autoVerdad && v.status === "activo"
  );

  if (situacionActiva || cualquierVoluntarioActivo) {
    return { deg, mode: "conquista", umbralMin, sinSegmentos: false };
  }

  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(
      seg.horaInicio || "00:00",
      seg.horaFin || "00:00",
      dayStartMs
    );
    if (nowMs < start) continue;
    const evalEnd = Math.min(end, nowMs);
    const voluntary = todayVehicles
      .filter(v => !v.autoVerdad)
      .map(v => vehicleSessionRange(v, now))
      .filter((s): s is MsInterval => s != null);
    if (!hasVoluntaryOverlapInWindow(voluntary, start, evalEnd)) {
      return { deg, mode: "entropia", umbralMin, sinSegmentos: false };
    }
  }

  return { deg, mode: "neutro", umbralMin, sinSegmentos: false };
}

export function computeTimelineDayStats(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineDayStats {
  const now = params.now ?? Date.now();
  const dayStartMs = getLimaDayStartMs(now);
  const nowMs = Math.min(now, dayStartMs + 86400000);
  const nowMin = getNowMinutesLima(nowMs, dayStartMs);
  const segmentos = params.segmentos ?? [];
  const umbralMin = getUmbralConcienciaMin(segmentos);

  if (nowMin < umbralMin) {
    return { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 };
  }

  if (segmentos.length === 0) {
    return { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 };
  }

  const livedStartMs = dayStartMs + umbralMin * 60000;
  const livedEndMs = nowMs;
  if (livedEndMs <= livedStartMs) {
    return { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 };
  }

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);
  const voluntarySessions = todayVehicles
    .filter(v => !v.autoVerdad)
    .map(v => vehicleSessionRange(v, now))
    .filter((s): s is MsInterval => s != null)
    .map(s => clipInterval(s, livedStartMs, livedEndMs))
    .filter((s): s is MsInterval => s != null);

  const consciousMerged = mergeMsIntervals(voluntarySessions);

  const entropyRaw: MsInterval[] = [];
  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(
      seg.horaInicio || "00:00",
      seg.horaFin || "00:00",
      dayStartMs
    );
    const evalStart = Math.max(start, livedStartMs);
    const evalEnd = Math.min(end, nowMs);
    if (evalEnd <= evalStart) continue;
    if (!hasVoluntaryOverlapInWindow(voluntarySessions, evalStart, evalEnd)) {
      entropyRaw.push({ start: evalStart, end: evalEnd });
    }
  }
  const entropyMerged = mergeMsIntervals(entropyRaw);
  const entropyNet = subtractMsIntervals(entropyMerged, consciousMerged);

  const sumMin = (intervals: MsInterval[]) =>
    intervals.reduce((acc, i) => acc + (i.end - i.start) / 60000, 0);

  const conquistaMin = sumMin(consciousMerged);
  const entropiaMin = sumMin(entropyNet);
  const livedMin = (livedEndMs - livedStartMs) / 60000;
  const vacioMin = Math.max(0, livedMin - conquistaMin - entropiaMin);

  return {
    conquistaMin: Math.round(conquistaMin * 10) / 10,
    centinelaMin: 0,
    vacioMin: Math.round(vacioMin * 10) / 10,
    entropiaMin: Math.round(entropiaMin * 10) / 10,
  };
}

function sessionMinutesInWindow(
  session: { start: number; end: number },
  winStart: number,
  winEnd: number
): number {
  return overlapMinutes(session.start, session.end, winStart, winEnd);
}

/** Minutos de sesión dentro del día-jornada (desde 05:00 Lima). */
export function sessionMinutesInJournalDay(
  v: VehiculoAnilloLite,
  now: number = Date.now()
): number {
  const session = vehicleSessionRange(v, now);
  if (!session) return 0;
  const journalStart = getJournalDayStartMs(now);
  return sessionMinutesInWindow(session, journalStart, now);
}

/** Vehículos con sesión que intersecta el día-jornada actual. */
export function filterVehiculosJornadaActual(
  vehiculos: VehiculoAnilloLite[],
  now: number = Date.now()
): VehiculoAnilloLite[] {
  const journalStart = getJournalDayStartMs(now);
  return vehiculos.filter(v => {
    const session = vehicleSessionRange(v, now);
    if (!session) return false;
    return session.end >= journalStart && session.start <= now;
  });
}

function computeConquistaEntropiaMinutos(params: {
  vehiculos: VehiculoAnilloLite[];
  now: number;
}): { conquistaMin: number; entropiaMin: number } {
  const { vehiculos, now } = params;
  const journalStart = getJournalDayStartMs(now);

  const consciousSessions = vehiculos
    .filter(v => !v.autoVerdad)
    .map(v => vehicleSessionRange(v, now))
    .filter((s): s is { start: number; end: number } => s != null);

  const centinelaSessions = vehiculos
    .filter(v => v.autoVerdad)
    .map(v => vehicleSessionRange(v, now))
    .filter((s): s is { start: number; end: number } => s != null);

  let conquistaMin = 0;
  for (const s of consciousSessions) {
    conquistaMin += sessionMinutesInWindow(s, journalStart, now);
  }

  let entropiaMin = 0;
  for (const cs of centinelaSessions) {
    let mins = sessionMinutesInWindow(cs, journalStart, now);
    for (const qs of consciousSessions) {
      mins -= overlapMinutes(cs.start, cs.end, qs.start, qs.end);
    }
    entropiaMin += Math.max(0, mins);
  }

  return { conquistaMin, entropiaMin };
}

/** Conquista vs entropía comparten el mismo presupuesto de jornada (arcos complementarios). */
export function calcularMetricasAnilloConciencia(params: {
  segmentos: SegmentoAnilloLite[];
  vehiculos: VehiculoAnilloLite[];
  now?: number;
}): MetricasAnilloConciencia {
  const now = params.now ?? Date.now();

  const minutosPlaneados = sumMinutosPlaneados(params.segmentos);
  const umbralMin = getUmbralConcienciaMin(params.segmentos);
  const nowMin = getNowMinutesLima(now, getLimaDayStartMs(now));
  const ventanaVivaMin = Math.max(1, nowMin - umbralMin);
  const jornadaMin = minutosPlaneados > 0 ? minutosPlaneados : ventanaVivaMin;
  const planificacionPct = Math.min(100, (minutosPlaneados / MINUTOS_DIA) * 100);

  const dayStats = computeTimelineDayStats({
    vehiculos: params.vehiculos,
    segmentos: params.segmentos,
    now,
  });
  const conquistaMin = dayStats.conquistaMin;
  const entropiaMin = dayStats.entropiaMin;

  const totalMin = conquistaMin + entropiaMin;
  const fillPct = Math.min(100, (totalMin / jornadaMin) * 100);
  const conquistaArcPct = totalMin > 0 ? fillPct * (conquistaMin / totalMin) : 0;
  const entropiaArcPct = totalMin > 0 ? fillPct * (entropiaMin / totalMin) : 0;

  return {
    planificacionPct,
    conquistaMin,
    entropiaMin,
    jornadaMin,
    conquistaArcPct,
    entropiaArcPct,
    fillPct,
    horasCubiertas: Math.round(minutosPlaneados / 60),
  };
}

export interface SegmentoConquistaBalance {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  duracionMin: number;
  conquistaMin: number;
  entropiaMin: number;
  vacioMin: number;
  estado?: string;
}

export interface BalanceConquistaJornada {
  jornadaMin: number;
  conquistaMin: number;
  entropiaMin: number;
  vacioMin: number;
  conquistaPct: number;
  entropiaPct: number;
  vacioPct: number;
  segmentos: SegmentoConquistaBalance[];
}

function segmentDurationMin(horaInicio: string, horaFin: string): number {
  const { durationMin } = segmentWindowMs(horaInicio, horaFin, getLimaDayStartMs());
  return durationMin;
}

/** Balance del día: tiempo conquistado vs centinela vs vacío, desglosado por segmento. */
export function calcularBalanceConquistaJornada(params: {
  segmentos: Array<SegmentoAnilloLite & { nombre?: string; estado?: string }>;
  vehiculos: VehiculoAnilloLite[];
  now?: number;
  dayStartMs?: number;
}): BalanceConquistaJornada {
  const now = params.now ?? Date.now();
  const segmentDayStartMs = params.dayStartMs ?? getLimaDayStartMs(now);

  const jornadaVehiculos = filterVehiculosJornadaActual(params.vehiculos, now);
  const metricas = calcularMetricasAnilloConciencia({
    segmentos: params.segmentos,
    vehiculos: jornadaVehiculos,
    now,
  });

  const consciousToday = jornadaVehiculos.filter(v => !v.autoVerdad);
  const centinelas = jornadaVehiculos.filter(v => v.autoVerdad);

  const segmentosBalance: SegmentoConquistaBalance[] = params.segmentos.map(seg => {
    const duracionMin = Math.max(0, segmentDurationMin(seg.horaInicio || "", seg.horaFin || ""));
    const { start: winStart, end: winEnd } = segmentWindowMs(
      seg.horaInicio || "0:0",
      seg.horaFin || "0:0",
      segmentDayStartMs
    );

    let conquistaMin = 0;
    for (const v of consciousToday) {
      const session = vehicleSessionRange(v, now);
      if (session) conquistaMin += overlapMinutes(session.start, session.end, winStart, winEnd);
    }

    let entropiaMin = 0;
    const consciousSessions = consciousToday
      .map(v => vehicleSessionRange(v, now))
      .filter((s): s is { start: number; end: number } => s != null);
    for (const v of centinelas) {
      const session = vehicleSessionRange(v, now);
      if (!session) continue;
      let mins = overlapMinutes(session.start, session.end, winStart, winEnd);
      for (const qs of consciousSessions) {
        mins -= overlapMinutes(session.start, session.end, qs.start, qs.end);
      }
      entropiaMin += Math.max(0, mins);
    }

    const vacioMin = Math.max(0, duracionMin - conquistaMin - entropiaMin);

    return {
      nombre: seg.nombre || "Segmento",
      horaInicio: seg.horaInicio || "",
      horaFin: seg.horaFin || "",
      duracionMin,
      conquistaMin: Math.round(conquistaMin * 10) / 10,
      entropiaMin: Math.round(entropiaMin * 10) / 10,
      vacioMin: Math.round(vacioMin * 10) / 10,
      estado: seg.estado,
    };
  });

  const jornadaMin = metricas.jornadaMin;
  const conquistaMin = Math.round(metricas.conquistaMin * 10) / 10;
  const entropiaMin = Math.round(metricas.entropiaMin * 10) / 10;
  const vacioMin = Math.round(Math.max(0, jornadaMin - conquistaMin - entropiaMin) * 10) / 10;

  return {
    jornadaMin,
    conquistaMin,
    entropiaMin,
    vacioMin,
    conquistaPct: jornadaMin > 0 ? Math.round((conquistaMin / jornadaMin) * 100) : 0,
    entropiaPct: jornadaMin > 0 ? Math.round((entropiaMin / jornadaMin) * 100) : 0,
    vacioPct: jornadaMin > 0 ? Math.round((vacioMin / jornadaMin) * 100) : 0,
    segmentos: segmentosBalance,
  };
}

export function formatMinutosJornada(min: number): string {
  const m = Math.round(min);
  if (m <= 0) return "0 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

export const debeEstarAbierto = (horaInicio: number): boolean => {
  const horaActual = new Date().getHours();
  return horaActual === horaInicio;
};

export interface SugerenciaConciencia {
  tiempoRecord: number;
  esDesafio: boolean;
  mensaje: string;
}

export const generarSugerencia = (
  nombreTarea: string,
  historial: any[]
): SugerenciaConciencia | null => {
  const record = historial
    .filter(h => h.nombre.toLowerCase() === nombreTarea.toLowerCase())
    .sort((a, b) => a.tiempo - b.tiempo)[0];
  if (!record) return null;
  return {
    tiempoRecord: record.tiempo,
    esDesafio: true,
    mensaje: `Tu victoria pasada fue de ${record.tiempo} min. ¿Lograrás superarlo o ajustarás por energía?`
  };
};
