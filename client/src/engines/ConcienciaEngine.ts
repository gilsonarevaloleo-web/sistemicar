import {
  getJournalDayStartMs,
  getLimaDayStartMs,
  getLimaMinutesFromMidnight,
  getLimaSecondsFromMidnight,
  segmentTimeToMinutes,
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
  const strict = segmentTimeToMinutes(t);
  if (strict > 0 || /^0*:0*$/.test((t || "").trim())) return strict;
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
  tipoReloj?: string;
  tipoDescanso?: string;
  interrupcionActiva?: boolean;
  desglosadorPausa?: unknown;
  puntoCero?: { fase?: string };
  aperturaAt?: number;
  createdAt?: number | Date;
  primerAccionAt?: number;
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

function timestampMs(value: number | Date | undefined): number | undefined {
  if (value == null) return undefined;
  return value instanceof Date ? value.getTime() : value;
}

/** Inicio real de cobertura consciente (no antes de creación ni primera acción). */
export function resolveConsciousSessionStart(v: VehiculoAnilloLite): number | null {
  const apertura = v.aperturaAt;
  if (apertura == null || !Number.isFinite(apertura)) return null;
  let start = apertura;
  const created = timestampMs(v.createdAt);
  if (created != null && created > start) start = created;
  if (v.primerAccionAt != null && v.primerAccionAt > start) start = v.primerAccionAt;
  return start;
}

export function vehicleSessionRange(
  v: VehiculoAnilloLite,
  now: number
): { start: number; end: number } | null {
  const start = resolveConsciousSessionStart(v);
  if (start == null) return null;
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

/** Centinela (Modo Verdad): tiempo inconsciente registrado explícitamente. */
function isCentinelaVehicle(v: VehiculoAnilloLite): boolean {
  return !!v.autoVerdad;
}

/** Ejecución consciente voluntaria (tiempo, situación, descanso — no centinela). */
function isConquistaVehicle(v: VehiculoAnilloLite): boolean {
  return !v.autoVerdad;
}

/** Punto Cero en pasiva/completada no cuenta como cobertura consciente del anillo. */
function isPuntoCeroNonCoverPhase(v: VehiculoAnilloLite): boolean {
  if (v.tipoFlota !== "descanso" || v.tipoDescanso !== "punto_cero") return false;
  const fase = v.puntoCero?.fase;
  return fase === "pasiva" || fase === "completada" || fase === "etiqueta";
}

function isVehiclePausedForAnillo(v: VehiculoAnilloLite): boolean {
  return !!(v.interrupcionActiva || v.desglosadorPausa);
}

function isGapCoverVehicle(v: VehiculoAnilloLite): boolean {
  if (!isConquistaVehicle(v)) return false;
  if (isVehiclePausedForAnillo(v)) return false;
  if (isPuntoCeroNonCoverPhase(v)) return false;
  return true;
}

/** Cobertura consciente en el instante `nowMs` (puntero y hueco actual). */
export function vehicleCoversConsciousnessAt(
  v: VehiculoAnilloLite,
  nowMs: number
): boolean {
  if (!isGapCoverVehicle(v)) return false;
  const session = vehicleSessionRange(v, nowMs);
  return session != null && session.start <= nowMs && session.end >= nowMs;
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
    if (!vehicles.some(v => vehicleCoversConsciousnessAt(v, nowMs))) return true;
  }
  return false;
}

/** Huecos de entropía (ms) dentro de ventanas planificadas ya vividas. */
function computePlannedEntropyGapsMs(
  segmentos: SegmentoAnilloLite[],
  limaDayStartMs: number,
  livedStartMs: number,
  nowMs: number,
  gapCoverSessions: MsInterval[]
): MsInterval[] {
  const entropyRaw: MsInterval[] = [];
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
  return mergeMsIntervals(entropyRaw);
}

function sumIntervalMinutes(intervals: MsInterval[]): number {
  return intervals.reduce((acc, i) => acc + (i.end - i.start) / 60000, 0);
}

/** Núcleo único del día: una sola fuente de verdad para arcos, minutos y puntero. */
interface TimelineCore {
  limaDayStartMs: number;
  nowMs: number;
  nowMin: number;
  umbralMin: number;
  livedStartMs: number;
  livedEndMs: number;
  hasSegments: boolean;
  segmentos: SegmentoAnilloLite[];
  todayVehicles: VehiculoAnilloLite[];
  /** Cobertura consciente real (pausas y punto cero pasivo excluidos). */
  coverMerged: MsInterval[];
  /** Ventanas planificadas ya vividas hasta `now`. */
  plannedLivedWindows: MsInterval[];
  /** Minutos planificados totales (incluye futuro del día). */
  totalPlannedMin: number;
  /** Minutos planificados ya vividos. */
  livedPlannedMin: number;
  /** Huecos inconscientes dentro de lo vivido (para pintar arcos rojos). */
  entropiaIntervals: MsInterval[];
  /** Sesiones centinela recortadas al día vivido. */
  centinelaMerged: MsInterval[];
}

function buildTimelineCore(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineCore | null {
  const now = params.now ?? Date.now();
  const limaDayStartMs = getLimaDayStartMs(now);
  const journalEndMs = getJournalDayStartMs(now) + 86400000;
  const nowMs = Math.min(now, journalEndMs);
  const nowMin = getNowMinutesLocal(nowMs, limaDayStartMs);
  const segmentos = params.segmentos ?? [];
  const umbralMin = getUmbralConcienciaMin(segmentos);

  if (nowMin < umbralMin) return null;

  const livedStartMs = limaDayStartMs + umbralMin * 60000;
  const livedEndMs = nowMs;
  if (livedEndMs <= livedStartMs) return null;

  const todayVehicles = filterVehiculosCalendarioHoy(params.vehiculos, now);
  const coverSessions = collectClippedSessions(
    todayVehicles,
    now,
    isGapCoverVehicle,
    livedStartMs,
    livedEndMs
  );
  const coverMerged = mergeMsIntervals(coverSessions);

  const centinelaSessions = collectClippedSessions(
    todayVehicles,
    now,
    isCentinelaVehicle,
    livedStartMs,
    livedEndMs
  );
  const centinelaMerged = mergeMsIntervals(centinelaSessions);

  const hasSegments = segmentos.length > 0;
  const plannedLivedWindows = hasSegments
    ? plannedSegmentWindowsMs(segmentos, limaDayStartMs, livedStartMs, nowMs)
    : [{ start: livedStartMs, end: livedEndMs }];
  const livedPlannedMin = sumIntervalMinutes(plannedLivedWindows);
  const totalPlannedMin = hasSegments
    ? sumMinutosPlaneados(segmentos)
    : livedPlannedMin;

  let entropiaIntervals: MsInterval[];
  if (hasSegments) {
    entropiaIntervals = computePlannedEntropyGapsMs(
      segmentos,
      limaDayStartMs,
      livedStartMs,
      nowMs,
      coverSessions
    );
  } else {
    entropiaIntervals = subtractMsIntervals(
      [{ start: livedStartMs, end: livedEndMs }],
      coverMerged
    );
  }

  return {
    limaDayStartMs,
    nowMs,
    nowMin,
    umbralMin,
    livedStartMs,
    livedEndMs,
    hasSegments,
    segmentos,
    todayVehicles,
    coverMerged,
    plannedLivedWindows,
    totalPlannedMin,
    livedPlannedMin,
    entropiaIntervals: mergeMsIntervals(entropiaIntervals),
    centinelaMerged,
  };
}

export interface ConcienciaTimeline {
  metricas: MetricasAnilloConciencia;
  dayStats: TimelineDayStats;
  timelineArcs: TimelineClockArc[];
  anilloEstado: AnilloEstadoVivo;
}

/** API unificada: arcos, minutos y puntero derivados del mismo núcleo temporal. */
export function buildConcienciaTimeline(params: {
  segmentos: SegmentoAnilloLite[];
  vehiculos: VehiculoAnilloLite[];
  now?: number;
}): ConcienciaTimeline {
  const now = params.now ?? Date.now();
  const core = buildTimelineCore({
    vehiculos: params.vehiculos,
    segmentos: params.segmentos,
    now,
  });

  const minutosPlaneados = sumMinutosPlaneados(params.segmentos);
  const umbralMin = getUmbralConcienciaMin(params.segmentos);
  const limaDayStartMs = getLimaDayStartMs(now);
  const nowMin = getNowMinutesLocal(Math.min(now, getJournalDayStartMs(now) + 86400000), limaDayStartMs);
  const ventanaVivaMin = Math.max(1, nowMin - umbralMin);
  const jornadaMin = minutosPlaneados > 0 ? minutosPlaneados : ventanaVivaMin;
  const planificacionPct = Math.min(100, (minutosPlaneados / MINUTOS_DIA) * 100);

  if (!core) {
    const deg = limaNowToClockDeg(now);
    const hasSegments = params.segmentos.length > 0;
    return {
      metricas: {
        planificacionPct,
        conquistaMin: 0,
        entropiaMin: 0,
        jornadaMin,
        conquistaArcPct: 0,
        entropiaArcPct: 0,
        fillPct: 0,
        horasCubiertas: Math.round(minutosPlaneados / 60),
      },
      dayStats: { conquistaMin: 0, entropiaMin: 0, vacioMin: 0, centinelaMin: 0 },
      timelineArcs: [
        { startDeg: 0, endDeg: 360, kind: "fondo", lap: 0 },
        { startDeg: 0, endDeg: 360, kind: "fondo", lap: 1 },
      ],
      anilloEstado: {
        deg,
        mode: "libre",
        umbralMin,
        sinSegmentos: !hasSegments,
      },
    };
  }

  const conquistaForStats = core.hasSegments
    ? intersectIntervalsWithWindows(core.coverMerged, core.plannedLivedWindows)
    : core.coverMerged;

  const conquistaMinRaw = sumIntervalMinutes(conquistaForStats);
  // Complemento: lo vivido sin cobertura consciente = entropía (sin restas duplicadas).
  const entropiaMinRaw = Math.max(0, core.livedPlannedMin - conquistaMinRaw);
  const centinelaMinRaw = sumIntervalMinutes(core.centinelaMerged);
  const vacioMinRaw = Math.max(0, core.totalPlannedMin - conquistaMinRaw - entropiaMinRaw);

  const conquistaMin = Math.round(conquistaMinRaw * 10) / 10;
  const entropiaMin = Math.round(entropiaMinRaw * 10) / 10;
  const centinelaMin = Math.round(centinelaMinRaw * 10) / 10;
  const vacioMin = Math.round(vacioMinRaw * 10) / 10;

  const totalMin = conquistaMin + entropiaMin;
  const fillPct = Math.min(100, (totalMin / jornadaMin) * 100);
  const conquistaArcPct = totalMin > 0 ? fillPct * (conquistaMin / totalMin) : 0;
  const entropiaArcPct = totalMin > 0 ? fillPct * (entropiaMin / totalMin) : 0;

  const arcs: TimelineClockArc[] = [
    { startDeg: 0, endDeg: 360, kind: "fondo", lap: 0 },
    { startDeg: 0, endDeg: 360, kind: "fondo", lap: 1 },
  ];

  const conquistaInSegments = core.hasSegments
    ? intersectIntervalsWithWindows(core.coverMerged, core.plannedLivedWindows)
    : core.coverMerged;
  for (const interval of conquistaInSegments) {
    arcs.push(...intervalToClockArcs(interval, core.limaDayStartMs, "conquista"));
  }

  if (core.hasSegments) {
    for (const seg of core.segmentos) {
      const gaps = computePlannedEntropyGapsMs(
        [seg],
        core.limaDayStartMs,
        core.livedStartMs,
        core.nowMs,
        collectClippedSessions(
          core.todayVehicles,
          now,
          isGapCoverVehicle,
          core.livedStartMs,
          core.livedEndMs
        )
      );
      for (const gap of gaps) {
        arcs.push(...intervalToClockArcs(gap, core.limaDayStartMs, "entropia"));
      }
    }
  } else {
    for (const gap of core.entropiaIntervals) {
      arcs.push(...intervalToClockArcs(gap, core.limaDayStartMs, "entropia"));
    }
  }

  const anilloEstado = computeAnilloEstadoFromCore(core);

  return {
    metricas: {
      planificacionPct,
      conquistaMin,
      entropiaMin,
      jornadaMin,
      conquistaArcPct,
      entropiaArcPct,
      fillPct,
      horasCubiertas: Math.round(minutosPlaneados / 60),
    },
    dayStats: { conquistaMin, entropiaMin, vacioMin, centinelaMin },
    timelineArcs: arcs,
    anilloEstado,
  };
}

function computeAnilloEstadoFromCore(core: TimelineCore): AnilloEstadoVivo {
  const deg = limaNowToClockDeg(core.nowMs);

  if (core.todayVehicles.some(v => vehicleCoversConsciousnessAt(v, core.nowMs))) {
    return {
      deg,
      mode: "conquista",
      umbralMin: core.umbralMin,
      sinSegmentos: !core.hasSegments,
      centerGuide: core.todayVehicles.some(
        v => vehicleCoversConsciousnessAt(v, core.nowMs) && v.tipoFlota === "descanso"
      )
        ? "Recarga consciente activa"
        : "Sesión consciente activa",
    };
  }

  if (core.hasSegments) {
    if (isNowInPlannedGap(core.segmentos, core.todayVehicles, core.nowMs, core.limaDayStartMs)) {
      return { deg, mode: "entropia", umbralMin: core.umbralMin, sinSegmentos: false };
    }
    return { deg, mode: "libre", umbralMin: core.umbralMin, sinSegmentos: false };
  }

  return {
    deg,
    mode: "entropia",
    umbralMin: core.umbralMin,
    sinSegmentos: true,
    centerGuide: "Sin cobertura consciente",
  };
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

export function computeTimelineClockArcs(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineClockArc[] {
  return buildConcienciaTimeline({
    segmentos: params.segmentos ?? [],
    vehiculos: params.vehiculos,
    now: params.now,
  }).timelineArcs;
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
  return buildConcienciaTimeline({
    segmentos: params.segmentos,
    vehiculos: params.vehiculos,
    now: params.now,
  }).anilloEstado;
}

export function computeTimelineDayStats(params: {
  vehiculos: VehiculoAnilloLite[];
  segmentos?: SegmentoAnilloLite[];
  now?: number;
}): TimelineDayStats {
  return buildConcienciaTimeline({
    segmentos: params.segmentos ?? [],
    vehiculos: params.vehiculos,
    now: params.now,
  }).dayStats;
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
  return buildConcienciaTimeline({
    segmentos: params.segmentos,
    vehiculos: params.vehiculos,
    now: params.now,
  }).metricas;
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

  const consciousToday = jornadaVehiculos.filter(isGapCoverVehicle);

  const segmentosBalance: SegmentoConquistaBalance[] = params.segmentos.map(seg => {
    const duracionMin = Math.max(0, segmentDurationMin(seg.horaInicio || "", seg.horaFin || ""));
    const { start: winStart, end: winEnd } = segmentWindowMs(
      seg.horaInicio || "0:0",
      seg.horaFin || "0:0",
      segmentDayStartMs
    );
    const evalStart = winStart;
    const evalEnd = Math.min(winEnd, now);

    const coverSessions = consciousToday
      .map(v => vehicleSessionRange(v, now))
      .filter((s): s is MsInterval => s != null);

    let conquistaMin = 0;
    for (const session of coverSessions) {
      conquistaMin += overlapMinutes(session.start, session.end, winStart, winEnd);
    }

    let entropiaMin = 0;
    if (evalEnd > evalStart) {
      const window: MsInterval = { start: evalStart, end: evalEnd };
      const coverInWindow = coverSessions
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
  if (min <= 0) return "0 min";
  if (min < 1) return "<1 min";
  const m = Math.round(min);
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
