import {
  getJournalDayStartMs,
  getLimaDayStartMs,
  getLimaMinutesFromMidnight,
  getLimaSecondsFromMidnight,
  segmentWindowMs,
} from "@/lib/segmentTime";

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

export type TimelineArcKind = "conquista" | "entropia" | "fondo";

export type AnilloPointerMode = "libre" | "conquista" | "entropia";

/** Contingencia sin segmentos: umbral a las 06:00 AM (360 min desde medianoche). */
export const UMBRAL_CONTINGENCIA_MIN = 6 * 60;

const MINUTOS_DIA = 1440;

export interface TimelineClockArc {
  startDeg: number;
  endDeg: number;
  kind: TimelineArcKind;
  lap?: 0 | 1;
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

function plannedSegmentWindowsMs(
  segmentos: SegmentoAnilloLite[],
  limaDayStartMs: number,
  livedStartMs: number,
  nowMs: number
): MsInterval[] {
  const windows: MsInterval[] = [];
  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(
      seg.horaInicio || "00:00",
      seg.horaFin || "00:00",
      limaDayStartMs
    );
    const evalStart = Math.max(start, livedStartMs);
    const evalEnd = Math.min(end, nowMs);
    if (evalEnd > evalStart) windows.push({ start: evalStart, end: evalEnd });
  }
  return mergeMsIntervals(windows);
}

function intersectIntervalsWithWindows(intervals: MsInterval[], windows: MsInterval[]): MsInterval[] {
  if (windows.length === 0 || intervals.length === 0) return [];
  const out: MsInterval[] = [];
  for (const interval of intervals) {
    for (const w of windows) {
      const clipped = clipInterval(interval, w.start, w.end);
      if (clipped) out.push(clipped);
    }
  }
  return mergeMsIntervals(out);
}

const MINUTOS_MEDIA_JORNADA = 12 * 60;

/** Grados en reloj 12h: 00:00/12:00 arriba, sentido horario; 360° = 720 min. */
export function clockMinutesToDeg(totalMinutes: number): number {
  const m = ((totalMinutes % MINUTOS_MEDIA_JORNADA) + MINUTOS_MEDIA_JORNADA) % MINUTOS_MEDIA_JORNADA;
  return m * 0.5;
}

export function getHalfDayLap(totalMinutes: number): 0 | 1 {
  const m = ((totalMinutes % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  return (m >= MINUTOS_MEDIA_JORNADA ? 1 : 0) as 0 | 1;
}

export function nowToHalfDayLap(nowMs: number = Date.now()): 0 | 1 {
  return limaNowToHalfDayLap(nowMs);
}

/** Puntero en tiempo local 12h + vuelta (lap) para indicar PM. */
export function nowToClockDeg(nowMs: number = Date.now()): number {
  return limaNowToClockDeg(nowMs);
}

/** Puntero del anillo anclado a hora Lima (misma base que segmentos HH:mm). */
export function limaNowToClockDeg(nowMs: number = Date.now()): number {
  const min = getLimaMinutesFromMidnight(nowMs);
  const sec = getLimaSecondsFromMidnight(nowMs) % 60;
  return clockMinutesToDeg(min) + sec * (0.5 / 60);
}

export function limaNowToHalfDayLap(nowMs: number = Date.now()): 0 | 1 {
  return getHalfDayLap(getLimaMinutesFromMidnight(nowMs));
}

/** Convierte instante local (ms desde medianoche) a grados del reloj 12h. */
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

function getNowMinutesLocal(nowMs: number, dayStartMs: number): number {
  return Math.max(0, Math.min(MINUTOS_DIA, Math.floor((nowMs - dayStartMs) / 60000)));
}

/** Ejecución consciente voluntaria (tiempo, situación, descanso — no centinela). */
function isConquistaVehicle(v: VehiculoAnilloLite): boolean {
  return !v.autoVerdad;
}

function isGapCoverVehicle(v: VehiculoAnilloLite): boolean {
  return isConquistaVehicle(v);
}

/** Solo cuenta trabajo dentro del día-jornada actual (05:00 → 05:00). */
function clipSessionToJournalDay(session: MsInterval, now: number): MsInterval | null {
  const journalStart = getJournalDayStartMs(now);
  const journalEnd = journalStart + 86400000;
  return clipInterval(session, journalStart, Math.min(now, journalEnd));
}

function collectClippedSessions(
  vehicles: VehiculoAnilloLite[],
  now: number,
  filter: (v: VehiculoAnilloLite) => boolean,
  clipStart: number,
  clipEnd: number
): MsInterval[] {
  return vehicles
    .filter(filter)
    .map(v => vehicleSessionRange(v, now))
    .filter((s): s is MsInterval => s != null)
    .map(s => clipSessionToJournalDay(s, now))
    .filter((s): s is MsInterval => s != null)
    .map(s => clipInterval(s, clipStart, clipEnd))
    .filter((s): s is MsInterval => s != null);
}

function isActiveAtNow(v: VehiculoAnilloLite, nowMs: number): boolean {
  if (v.status !== "activo") return false;
  const session = vehicleSessionRange(v, nowMs);
  return session != null && session.start <= nowMs && session.end >= nowMs;
}

function isNowInPlannedGap(
  segmentos: SegmentoAnilloLite[],
  vehicles: VehiculoAnilloLite[],
  nowMs: number,
  dayStartMs: number
): boolean {
  for (const seg of segmentos) {
    const { start, end } = segmentWindowMs(
      seg.horaInicio || "00:00",
      seg.horaFin || "00:00",
      dayStartMs
    );
    if (nowMs < start || nowMs >= end) continue;
    const covered = vehicles.some(v => {
      if (!isGapCoverVehicle(v)) return false;
      const session = vehicleSessionRange(v, nowMs);
      return session != null && session.start <= nowMs && session.end >= nowMs;
    });
    if (!covered) return true;
  }
  return false;
}

function splitByHalfDayLap(interval: MsInterval, dayStartMs: number): Array<{ interval: MsInterval; lap: 0 | 1 }> {
  const dayEnd = dayStartMs + 86400000;
  const start = Math.max(interval.start, dayStartMs);
  const end = Math.min(interval.end, dayEnd);
  if (end <= start) return [];

  const noon = dayStartMs + MINUTOS_MEDIA_JORNADA * 60000;
  if (end <= noon) return [{ interval: { start, end }, lap: 0 }];
  if (start >= noon) return [{ interval: { start, end }, lap: 1 }];
  return [
    { interval: { start, end: noon }, lap: 0 },
    { interval: { start: noon, end }, lap: 1 },
  ];
}

function intervalToClockArcs(interval: MsInterval, dayStartMs: number, kind: TimelineArcKind): TimelineClockArc[] {
  const parts = splitByHalfDayLap(interval, dayStartMs);
  const out: TimelineClockArc[] = [];
  for (const p of parts) {
    let startDeg = msToClockDeg(p.interval.start, dayStartMs);
    let endDeg = msToClockDeg(p.interval.end, dayStartMs);
    if (endDeg <= startDeg) endDeg += 360;
    out.push({ startDeg, endDeg, kind, lap: p.lap });
  }
  return out;
}

export function filterVehiculosCalendarioHoy(
  vehiculos: VehiculoAnilloLite[],
  now: number = Date.now()
): VehiculoAnilloLite[] {
  const dayStartMs = getJournalDayStartMs(now);
  const dayEndMs = dayStartMs + 86400000;
  return vehiculos.filter(v => {
    const session = vehicleSessionRange(v, now);
    if (!session) return false;
    const journalSession = clipSessionToJournalDay(session, now);
    if (!journalSession) return false;
    return journalSession.end > dayStartMs && journalSession.start < dayEndMs;
  });
}

/**
 * Reloj 24h — 4 estados visuales:
 * - Morado = conquista (ejecución consciente: tiempo, situación o descanso).
 * - Rojo = entropía (huecos sin cobertura consciente: en segmento planificado o en contingencia sin segmentos).
 * - Gris = libre (antes del umbral o fuera de ventana planificada con segmentos).
 */
export function computeTimelineClockArcs(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineClockArc[] {
  const now = params.now ?? Date.now();
  const limaDayStartMs = getLimaDayStartMs(now);
  const journalEndMs = getJournalDayStartMs(now) + 86400000;
  const nowMs = Math.min(now, journalEndMs);
  const nowMin = getNowMinutesLocal(nowMs, limaDayStartMs);
  const segmentos = params.segmentos ?? [];
  const hasSegments = segmentos.length > 0;
  const umbralMin = getUmbralConcienciaMin(segmentos);

  // Fondo: dos vueltas (AM/PM) para reloj 12h.
  const arcs: TimelineClockArc[] = [
    { startDeg: 0, endDeg: 360, kind: "fondo", lap: 0 },
    { startDeg: 0, endDeg: 360, kind: "fondo", lap: 1 },
  ];

  if (nowMin < umbralMin) return arcs;

  const livedStartMs = limaDayStartMs + umbralMin * 60000;
  const livedEndMs = nowMs;
  if (livedEndMs <= livedStartMs) return arcs;

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);
  const conquistaSessions = collectClippedSessions(
    todayVehicles,
    now,
    isConquistaVehicle,
    livedStartMs,
    livedEndMs
  );
  const gapCoverSessions = collectClippedSessions(
    todayVehicles,
    now,
    isGapCoverVehicle,
    livedStartMs,
    livedEndMs
  );

  const conquistaMerged = mergeMsIntervals(conquistaSessions);
  const gapCoverMerged = mergeMsIntervals(gapCoverSessions);

  if (hasSegments) {
    const segmentWindows = plannedSegmentWindowsMs(segmentos, limaDayStartMs, livedStartMs, nowMs);
    const conquistaInSegments = intersectIntervalsWithWindows(conquistaMerged, segmentWindows);
    for (const interval of conquistaInSegments) {
      arcs.push(...intervalToClockArcs(interval, limaDayStartMs, "conquista"));
    }

    for (const seg of segmentos) {
      const { start, end } = segmentWindowMs(
        seg.horaInicio || "00:00",
        seg.horaFin || "00:00",
        limaDayStartMs
      );
      const evalStart = Math.max(start, livedStartMs);
      const evalEnd = Math.min(end, nowMs);
      if (evalEnd <= evalStart) continue;

      const window: MsInterval = { start: evalStart, end: evalEnd };
      const coverInWindow = gapCoverSessions
        .filter(s => s.start < evalEnd && s.end > evalStart)
        .map(s => clipInterval(s, evalStart, evalEnd))
        .filter((s): s is MsInterval => s != null);
      const gaps = subtractMsIntervals([window], mergeMsIntervals(coverInWindow));
      for (const gap of gaps) {
        arcs.push(...intervalToClockArcs(gap, limaDayStartMs, "entropia"));
      }
    }
  } else {
    for (const interval of conquistaMerged) {
      arcs.push(...intervalToClockArcs(interval, limaDayStartMs, "conquista"));
    }
    const window: MsInterval = { start: livedStartMs, end: livedEndMs };
    const gaps = subtractMsIntervals([window], gapCoverMerged);
    for (const gap of gaps) {
      arcs.push(...intervalToClockArcs(gap, limaDayStartMs, "entropia"));
    }
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

/** Estado del puntero: libre / conquista / entropía. */
export function computeAnilloEstado(params: {
  segmentos: SegmentoAnilloLite[];
  vehiculos: VehiculoAnilloLite[];
  now?: number;
}): AnilloEstadoVivo {
  const now = params.now ?? Date.now();
  const limaDayStartMs = getLimaDayStartMs(now);
  const journalEndMs = getJournalDayStartMs(now) + 86400000;
  const nowMs = Math.min(now, journalEndMs);
  const nowMin = getNowMinutesLocal(nowMs, limaDayStartMs);
  const segmentos = params.segmentos;
  const hasSegments = segmentos.length > 0;
  const umbralMin = getUmbralConcienciaMin(segmentos);
  const deg = limaNowToClockDeg(nowMs);

  if (nowMin < umbralMin) {
    return { deg, mode: "libre", umbralMin, sinSegmentos: !hasSegments };
  }

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);

  if (todayVehicles.some(v => isConquistaVehicle(v) && isActiveAtNow(v, nowMs))) {
    return {
      deg,
      mode: "conquista",
      umbralMin,
      sinSegmentos: !hasSegments,
      centerGuide: todayVehicles.some(
        v => isActiveAtNow(v, nowMs) && isConquistaVehicle(v) && v.tipoFlota === "descanso"
      )
        ? "Recarga consciente activa"
        : "Sesión consciente activa",
    };
  }

  if (hasSegments) {
    if (isNowInPlannedGap(segmentos, todayVehicles, nowMs, limaDayStartMs)) {
      return { deg, mode: "entropia", umbralMin, sinSegmentos: false };
    }
    return { deg, mode: "libre", umbralMin, sinSegmentos: false };
  }

  return {
    deg,
    mode: "entropia",
    umbralMin,
    sinSegmentos: true,
    centerGuide: "Sin cobertura consciente",
  };
}

export function computeTimelineDayStats(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineDayStats {
  const now = params.now ?? Date.now();
  const limaDayStartMs = getLimaDayStartMs(now);
  const journalEndMs = getJournalDayStartMs(now) + 86400000;
  const nowMs = Math.min(now, journalEndMs);
  const nowMin = getNowMinutesLocal(nowMs, limaDayStartMs);
  const segmentos = params.segmentos ?? [];
  const umbralMin = getUmbralConcienciaMin(segmentos);

  if (nowMin < umbralMin) {
    return { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 };
  }

  const livedStartMs = limaDayStartMs + umbralMin * 60000;
  const livedEndMs = nowMs;
  if (livedEndMs <= livedStartMs) {
    return { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 };
  }

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);
  const conquistaSessions = collectClippedSessions(
    todayVehicles,
    now,
    isConquistaVehicle,
    livedStartMs,
    livedEndMs
  );
  const gapCoverSessions = collectClippedSessions(
    todayVehicles,
    now,
    isGapCoverVehicle,
    livedStartMs,
    livedEndMs
  );
  const conquistaMerged = mergeMsIntervals(conquistaSessions);
  const gapCoverMerged = mergeMsIntervals(gapCoverSessions);

  const entropyRaw: MsInterval[] = [];
  let conquistaForStats = conquistaMerged;
  if (segmentos.length > 0) {
    const segmentWindows = plannedSegmentWindowsMs(segmentos, limaDayStartMs, livedStartMs, nowMs);
    conquistaForStats = intersectIntervalsWithWindows(conquistaMerged, segmentWindows);

    for (const seg of segmentos) {
      const { start, end } = segmentWindowMs(
        seg.horaInicio || "00:00",
        seg.horaFin || "00:00",
        limaDayStartMs
      );
      const evalStart = Math.max(start, livedStartMs);
      const evalEnd = Math.min(end, nowMs);
      if (evalEnd <= evalStart) continue;

      const window: MsInterval = { start: evalStart, end: evalEnd };
      const coverInWindow = gapCoverSessions
        .filter(s => s.start < evalEnd && s.end > evalStart)
        .map(s => clipInterval(s, evalStart, evalEnd))
        .filter((s): s is MsInterval => s != null);
      entropyRaw.push(...subtractMsIntervals([window], mergeMsIntervals(coverInWindow)));
    }
  } else {
    const window: MsInterval = { start: livedStartMs, end: livedEndMs };
    entropyRaw.push(...subtractMsIntervals([window], gapCoverMerged));
  }
  const entropiaMerged = mergeMsIntervals(entropyRaw);

  const sumMin = (intervals: MsInterval[]) =>
    intervals.reduce((acc, i) => acc + (i.end - i.start) / 60000, 0);

  const conquistaMin = sumMin(conquistaForStats);
  const entropiaMin = sumMin(entropiaMerged);
  const livedMin = (livedEndMs - livedStartMs) / 60000;
  const plannedMin =
    segmentos.length > 0
      ? sumMin(plannedSegmentWindowsMs(segmentos, limaDayStartMs, livedStartMs, nowMs))
      : livedMin;
  const vacioMin = Math.max(0, plannedMin - conquistaMin - entropiaMin);

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

/** Conquista vs entropía comparten el mismo presupuesto de jornada (arcos complementarios). */
export function calcularMetricasAnilloConciencia(params: {
  segmentos: SegmentoAnilloLite[];
  vehiculos: VehiculoAnilloLite[];
  now?: number;
}): MetricasAnilloConciencia {
  const now = params.now ?? Date.now();

  const minutosPlaneados = sumMinutosPlaneados(params.segmentos);
  const umbralMin = getUmbralConcienciaMin(params.segmentos);
  const nowMin = getNowMinutesLocal(now, getLimaDayStartMs(now));
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

/** Balance del día: tiempo conquistado vs entropía vs vacío, desglosado por segmento. */
export function calcularBalanceConquistaJornada(params: {
  segmentos: Array<SegmentoAnilloLite & { nombre?: string; estado?: string }>;
  vehiculos: VehiculoAnilloLite[];
  now?: number;
  dayStartMs?: number;
}): BalanceConquistaJornada {
  const now = params.now ?? Date.now();
  const segmentDayStartMs = getLimaDayStartMs(now);

  const jornadaVehiculos = filterVehiculosJornadaActual(params.vehiculos, now);
  const metricas = calcularMetricasAnilloConciencia({
    segmentos: params.segmentos,
    vehiculos: jornadaVehiculos,
    now,
  });

  const consciousToday = jornadaVehiculos.filter(v => !v.autoVerdad);

  const segmentosBalance: SegmentoConquistaBalance[] = params.segmentos.map(seg => {
    const duracionMin = Math.max(0, segmentDurationMin(seg.horaInicio || "", seg.horaFin || ""));
    const { start: winStart, end: winEnd } = segmentWindowMs(
      seg.horaInicio || "0:0",
      seg.horaFin || "0:0",
      segmentDayStartMs
    );
    const evalStart = winStart;
    const evalEnd = Math.min(winEnd, now);

    let conquistaMin = 0;
    const consciousSessions = consciousToday
      .map(v => vehicleSessionRange(v, now))
      .filter((s): s is MsInterval => s != null);

    for (const session of consciousSessions) {
      conquistaMin += overlapMinutes(session.start, session.end, winStart, winEnd);
    }

    let entropiaMin = 0;
    if (evalEnd > evalStart) {
      const window: MsInterval = { start: evalStart, end: evalEnd };
      const coverInWindow = consciousSessions
        .map(s => clipInterval(s, evalStart, evalEnd))
        .filter((s): s is MsInterval => s != null);
      const gaps = subtractMsIntervals([window], mergeMsIntervals(coverInWindow));
      entropiaMin = gaps.reduce((acc, g) => acc + (g.end - g.start) / 60000, 0);
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
