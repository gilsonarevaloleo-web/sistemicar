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
  aperturaAt?: number;
  cierreAt?: number;
  duracionFinal?: number;
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

function minutosVehiculoConsciente(v: VehiculoAnilloLite, now: number): number {
  if (v.status === "activo" && v.aperturaAt) {
    return Math.max(0, (now - v.aperturaAt) / 60000);
  }
  if (v.duracionFinal != null) return v.duracionFinal;
  if (v.cierreAt && v.aperturaAt) {
    return Math.max(0, (v.cierreAt - v.aperturaAt) / 60000);
  }
  return 0;
}

/** Conquista vs entropía comparten el mismo presupuesto de jornada (arcos complementarios). */
export function calcularMetricasAnilloConciencia(params: {
  segmentos: SegmentoAnilloLite[];
  vehiculos: VehiculoAnilloLite[];
  now?: number;
}): MetricasAnilloConciencia {
  const now = params.now ?? Date.now();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const minutosPlaneados = sumMinutosPlaneados(params.segmentos);
  const jornadaMin = minutosPlaneados || 1440;
  const planificacionPct = Math.min(100, (minutosPlaneados / 1440) * 100);

  const todayConscious = params.vehiculos.filter(
    v =>
      !v.autoVerdad &&
      (v.status === "activo" ||
        ((v.status === "cumplido" || v.status === "archivado") &&
          (v.cierreAt || v.aperturaAt || 0) >= todayStartMs))
  );

  const conquistaMin = todayConscious.reduce(
    (acc, v) => acc + minutosVehiculoConsciente(v, now),
    0
  );

  const centinelaActivo = params.vehiculos.find(v => v.autoVerdad && v.status === "activo");
  const centinelaMinActivo = centinelaActivo?.aperturaAt
    ? Math.max(0, (now - centinelaActivo.aperturaAt) / 60000)
    : 0;
  const centinelasCerrados = params.vehiculos.filter(v => v.autoVerdad && v.status !== "activo");
  const entropiaMin =
    centinelasCerrados.reduce((s, v) => s + (v.duracionFinal || 0), 0) + centinelaMinActivo;

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
  const ini = parseSegMinutes(horaInicio);
  const fin = parseSegMinutes(horaFin);
  return fin >= ini ? fin - ini : fin + 1440 - ini;
}

function segmentWindowMs(
  horaInicio: string,
  horaFin: string,
  dayStartMs: number
): { start: number; end: number } {
  const dayStart = new Date(dayStartMs);
  const [hi, mi] = (horaInicio || "0:0").split(":").map(Number);
  const [hf, mf] = (horaFin || "0:0").split(":").map(Number);
  const start = new Date(dayStart);
  start.setHours(hi || 0, mi || 0, 0, 0);
  const end = new Date(dayStart);
  end.setHours(hf || 0, mf || 0, 0, 0);
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }
  return { start: start.getTime(), end: end.getTime() };
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

function vehicleSessionRange(
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
  } else if (v.duracionFinal != null) {
    end = start + v.duracionFinal * 60000;
  } else {
    return null;
  }
  return end > start ? { start, end } : null;
}

/** Balance del día: tiempo conquistado vs centinela vs vacío, desglosado por segmento. */
export function calcularBalanceConquistaJornada(params: {
  segmentos: Array<SegmentoAnilloLite & { nombre?: string; estado?: string }>;
  vehiculos: VehiculoAnilloLite[];
  now?: number;
  dayStartMs?: number;
}): BalanceConquistaJornada {
  const now = params.now ?? Date.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = params.dayStartMs ?? dayStart.getTime();

  const metricas = calcularMetricasAnilloConciencia({
    segmentos: params.segmentos,
    vehiculos: params.vehiculos,
    now,
  });

  const consciousToday = params.vehiculos.filter(
    v =>
      !v.autoVerdad &&
      (v.status === "activo" ||
        ((v.status === "cumplido" || v.status === "archivado") &&
          (v.cierreAt || v.aperturaAt || 0) >= dayStartMs))
  );
  const centinelas = params.vehiculos.filter(v => v.autoVerdad);

  const segmentosBalance: SegmentoConquistaBalance[] = params.segmentos.map(seg => {
    const duracionMin = Math.max(0, segmentDurationMin(seg.horaInicio || "", seg.horaFin || ""));
    const { start: winStart, end: winEnd } = segmentWindowMs(
      seg.horaInicio || "0:0",
      seg.horaFin || "0:0",
      dayStartMs
    );

    let conquistaMin = 0;
    for (const v of consciousToday) {
      const session = vehicleSessionRange(v, now);
      if (session) conquistaMin += overlapMinutes(session.start, session.end, winStart, winEnd);
    }

    let entropiaMin = 0;
    for (const v of centinelas) {
      const session = vehicleSessionRange(v, now);
      if (session) entropiaMin += overlapMinutes(session.start, session.end, winStart, winEnd);
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

export const getJuicioMensaje = (segundos: number): string => {
  if (segundos < 150)
    return 'A. CONEXIÓN NIÑO: El tiempo es el lienzo de tu destino. ¿Cómo eliges pintar tu historia hoy?';
  if (segundos < 300)
    return 'B. IDENTIDAD SOCIAL: En cómo usas tu tiempo se decide si eres como los demás o superior. ¿Quién eres?';
  if (segundos < 450)
    return 'C. RESISTENCIA: Conoce tu límite de hoy para decidir dónde estar mañana. ¿Quieres montar un peldaño más?';
  return 'D. IDENTIDAD DE JUEZ: Tienes dos caminos: a) La excusa y debilidad, b) El valor y la dignidad. ¿Cuál eliges?';
};

export const calcularVoltajeResistencia = (segundos: number): number => {
  return segundos >= 300 ? 15 : 10;
};

export const getResistenciaColor = (segundos: number): string => {
  const progreso = (segundos % 300) / 300;
  const hue = 120 - progreso * 120;
  return `hsl(${hue}, 100%, 50%)`;
};

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
