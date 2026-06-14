import type { TimelineDayStats } from "@/engines/ConcienciaEngine";
import type { DecisionLedgerEntry } from "./decisionesLedger";
import type { CombustibleDia } from "./termodinamicaAtencional";
import type { DisciplinaDia } from "./disciplinaEngine";
import { decisionesFromSnapshot, type PlanillaDailySnapshot } from "./termodinamicaAtencional";

export type EscaleraCapaId = "presencia" | "entrada" | "produccion";
export type EscaleraNivel = "semilla" | "tallo" | "hoja" | "flor";

export const ESCALERA_NIVEL_LABEL: Record<EscaleraNivel, string> = {
  semilla: "Semilla",
  tallo: "Tallo",
  hoja: "Hoja",
  flor: "Flor",
};

export const ESCALERA_CAPA_META: Record<
  EscaleraCapaId,
  { titulo: string; subtitulo: string; capa: number }
> = {
  presencia: {
    capa: 1,
    titulo: "Presencia",
    subtitulo: "¿En qué se me va el tiempo?",
  },
  entrada: {
    capa: 2,
    titulo: "Entrada",
    subtitulo: "¿Aparezco al trabajo consciente?",
  },
  produccion: {
    capa: 3,
    titulo: "Producción",
    subtitulo: "¿Convierto el tiempo en decisiones?",
  },
};

export interface EscaleraCapaMetric {
  id: EscaleraCapaId;
  capa: number;
  titulo: string;
  subtitulo: string;
  nivel: EscaleraNivel;
  score: number;
  headline: string;
  detalle: string;
  valorPrincipal: string;
  valorSecundario?: string;
}

export interface ProduccionPulsoPoint {
  label: string;
  horaInicioMs: number;
  decisionesHora: number;
  acumulado: number;
}

export interface ProduccionHistoricaPoint {
  fecha: string;
  label: string;
  decisiones: number;
}

export interface EscaleraConcienciaModel {
  capas: EscaleraCapaMetric[];
  integracion: string;
  pulso: ProduccionPulsoPoint[];
  historicaProduccion: ProduccionHistoricaPoint[];
  brechaPresenciaProduccion: boolean;
  ratioDecisionesPorHoraConquista: number | null;
  conquistaMin: number;
  decisionesHoy: number;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function nivelFromScore(score: number): EscaleraNivel {
  if (score >= 80) return "flor";
  if (score >= 60) return "hoja";
  if (score >= 35) return "tallo";
  return "semilla";
}

/** Capa 1 — cobertura consciente del tiempo (conquista vs fuga). */
export function scorePresencia(params: {
  dayStats: TimelineDayStats;
  conquistaArcPct: number;
}): { score: number; headline: string; detalle: string; valorPrincipal: string; valorSecundario: string } {
  const { dayStats, conquistaArcPct } = params;
  const jornadaMin = dayStats.conquistaMin + dayStats.entropiaMin + dayStats.vacioMin;
  const conquistaRatio =
    jornadaMin > 0 ? dayStats.conquistaMin / jornadaMin : conquistaArcPct / 100;
  const entropiaRatio = jornadaMin > 0 ? dayStats.entropiaMin / jornadaMin : 0;
  const score = clampScore(conquistaRatio * 70 + (1 - entropiaRatio) * 30);
  const pct = Math.round(conquistaRatio * 100);

  let headline: string;
  if (jornadaMin < 15) {
    headline = "La jornada apenas despierta — el anillo te muestra dónde fluye el tiempo.";
  } else if (score >= 60) {
    headline = "Presencia activa: estás viendo el tiempo en lugar de perderlo en la inconsciencia.";
  } else if (dayStats.entropiaMin > dayStats.conquistaMin) {
    headline = "Hay fuga de tiempo visible — la capa 1 te señala dónde reconectar.";
  } else {
    headline = "Presencia en construcción — cada minuto consciente fortalece la base.";
  }

  const detalle =
    jornadaMin > 0
      ? `${dayStats.conquistaMin} min conquista · ${dayStats.entropiaMin} min entropía · ${dayStats.vacioMin} min vacío`
      : "Sin minutos evaluables aún en el anillo.";

  return {
    score,
    headline,
    detalle,
    valorPrincipal: jornadaMin > 0 ? `${pct}% conquista` : `${Math.round(conquistaArcPct)}% arco`,
    valorSecundario:
      dayStats.entropiaMin > 0
        ? `${dayStats.entropiaMin} min entropía`
        : "entropía contenida",
  };
}

/** Capa 2 — disciplina de entrada al trabajo con vehículos. */
export function scoreEntrada(disciplina: DisciplinaDia): {
  score: number;
  headline: string;
  detalle: string;
  valorPrincipal: string;
  valorSecundario?: string;
} {
  const score = clampScore(disciplina.indiceDisciplina);
  const delta = disciplina.deltaMedioDesdeInicioMin;

  let headline: string;
  if (disciplina.segmentos.length === 0) {
    headline = "Sin segmentos planificados — la entrada se mide cuando hay puertas de trabajo.";
  } else if (disciplina.sinEntrada > 0 && score < 40) {
    headline = "Segmentos sin vehículo consciente — la entrada al trabajo es el puente hacia producir.";
  } else if (score >= 70) {
    headline = "Entrada sólida: apareces al trabajo cuando el segmento lo pide.";
  } else {
    headline = "Entrada en desarrollo — montar vehículo a tiempo abre la capa de producción.";
  }

  const detalleParts: string[] = [
    `${disciplina.entradasTotales} entradas`,
    `${disciplina.sinEntrada} sin entrada`,
  ];
  if (disciplina.montajes > 0) detalleParts.push(`${disciplina.montajes} montajes`);
  if (delta != null) detalleParts.push(`Δ medio ${delta} min al primer vehículo`);

  return {
    score,
    headline,
    detalle: detalleParts.join(" · "),
    valorPrincipal: `índice ${disciplina.indiceDisciplina}`,
    valorSecundario: delta != null ? `+${delta} min Δ` : undefined,
  };
}

/** Capa 3 — decisiones ejecutadas (combustible de conciencia). */
export function scoreProduccion(params: {
  combustible: CombustibleDia;
  conquistaMin: number;
  brechaPresenciaProduccion: boolean;
}): { score: number; headline: string; detalle: string; valorPrincipal: string; valorSecundario?: string } {
  const { combustible, conquistaMin, brechaPresenciaProduccion } = params;
  const { decisiones, subsTiempo, subsSituacion, misionesDirectas } = combustible;

  const ratioHora =
    conquistaMin >= 15 ? decisiones / (conquistaMin / 60) : decisiones > 0 ? decisiones : 0;
  const ratioScore = Math.min(ratioHora * 25, 55);
  const volumeScore = Math.min(decisiones * 8, 45);
  const score = clampScore(ratioScore + volumeScore);

  let headline: string;
  if (decisiones === 0 && conquistaMin >= 30) {
    headline =
      "Tiempo cubierto, tanque vacío — la parálisis también consume el día; el siguiente nivel es cerrar.";
  } else if (brechaPresenciaProduccion) {
    headline =
      "Estás presente; falta convertir ese tiempo en decisiones — aquí vive la antientropía profunda.";
  } else if (decisiones >= 5) {
    headline = "Producción viva: cada decisión cierra un ciclo y llena el combustible de conciencia.";
  } else if (decisiones > 0) {
    headline = "Primeras decisiones del día — el motor del cambio ya gira.";
  } else {
    headline = "Capa 3 en espera — cierra subs, tareas o misiones para materializar el tiempo.";
  }

  const detalleParts: string[] = [];
  if (subsTiempo > 0) detalleParts.push(`${subsTiempo} subs tiempo`);
  if (subsSituacion > 0) detalleParts.push(`${subsSituacion} situación`);
  if (misionesDirectas > 0) detalleParts.push(`${misionesDirectas} misión${misionesDirectas !== 1 ? "es" : ""}`);
  const detalle =
    detalleParts.length > 0
      ? detalleParts.join(" · ")
      : "Sin decisiones registradas hoy.";

  const valorSecundario =
    conquistaMin >= 15 && decisiones > 0
      ? `${ratioHora.toFixed(1)} dec/h conquista`
      : undefined;

  return {
    score,
    headline,
    detalle,
    valorPrincipal: `${decisiones} decisión${decisiones !== 1 ? "es" : ""}`,
    valorSecundario,
  };
}

export function detectBrechaPresenciaProduccion(
  conquistaMin: number,
  entropiaMin: number,
  decisiones: number
): boolean {
  const jornadaMin = conquistaMin + entropiaMin;
  if (jornadaMin < 30) return false;
  const presenciaFuerte = conquistaMin >= 45 && conquistaMin >= entropiaMin * 1.2;
  return presenciaFuerte && decisiones <= Math.max(2, Math.floor(conquistaMin / 45));
}

/** Pulso intradía: decisiones por hora de jornada (desde dayStartMs). */
export function buildProduccionPulsoSerie(
  ledger: DecisionLedgerEntry[],
  dayStartMs: number,
  nowMs: number = Date.now()
): ProduccionPulsoPoint[] {
  const sorted = [...ledger].sort((a, b) => a.ts - b.ts);
  const endMs = Math.max(nowMs, dayStartMs + 3600_000);
  const firstHour = new Date(dayStartMs).getHours();
  const points: ProduccionPulsoPoint[] = [];
  let acumulado = 0;

  for (let h = 0; h < 24; h++) {
    const horaInicioMs = dayStartMs + h * 3600_000;
    const horaFinMs = horaInicioMs + 3600_000;
    if (horaInicioMs > endMs) break;

    const decisionesHora = sorted.filter(e => e.ts >= horaInicioMs && e.ts < horaFinMs).length;
    acumulado += decisionesHora;
    const hourLabel = ((firstHour + h) % 24).toString().padStart(2, "0");

    points.push({
      label: hourLabel,
      horaInicioMs,
      decisionesHora,
      acumulado,
    });
  }

  const lastWithActivity = points.findLastIndex(p => p.decisionesHora > 0 || p.acumulado > 0);
  if (lastWithActivity >= 0) {
    return points.slice(0, Math.max(lastWithActivity + 2, 3));
  }
  return points.slice(0, Math.min(6, points.length));
}

export function buildProduccionHistoricaSerie(
  snapshots: Array<Pick<PlanillaDailySnapshot, "fecha" | "decisionesDelDia">>,
  todayDecisiones: number,
  todayFecha: string
): ProduccionHistoricaPoint[] {
  const byFecha = new Map<string, number>();
  for (const s of snapshots) {
    const n = decisionesFromSnapshot(s as PlanillaDailySnapshot);
    if (n > 0) byFecha.set(s.fecha, n);
  }
  if (todayDecisiones > 0 || !byFecha.has(todayFecha)) {
    byFecha.set(todayFecha, todayDecisiones);
  }
  return Array.from(byFecha.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, decisiones]) => ({
      fecha,
      decisiones,
      label: fecha.slice(5).replace("-", "/"),
    }));
}

function buildIntegracion(capas: EscaleraCapaMetric[], brecha: boolean): string {
  const p = capas.find(c => c.id === "presencia")!;
  const e = capas.find(c => c.id === "entrada")!;
  const r = capas.find(c => c.id === "produccion")!;

  if (brecha) {
    return "Las tres capas son peldaños, no competencia: ya ves el tiempo (presencia); el motor del cambio son las decisiones (producción).";
  }
  if (p.nivel === "semilla") {
    return "Empieza por la capa 1 — ver el tiempo es la base; las capas 2 y 3 se abren encima con respeto.";
  }
  if (r.nivel === "flor" || r.nivel === "hoja") {
    return "Antientropía en profundidad: presencia + entrada + decisiones cerradas — el tanque y el anillo avanzan juntos.";
  }
  if (e.score >= 60 && r.score < 40) {
    return "Entras al trabajo; el siguiente desarrollo es dejar de paralizarte y cerrar decisiones.";
  }
  return "Cada capa prepara la siguiente — ninguna es «mejor», todas son desarrollo consciente.";
}

export function buildEscaleraConciencia(params: {
  dayStats: TimelineDayStats;
  conquistaArcPct: number;
  disciplina: DisciplinaDia;
  combustible: CombustibleDia;
  ledger: DecisionLedgerEntry[];
  dayStartMs: number;
  nowMs?: number;
  snapshots?: Array<Pick<PlanillaDailySnapshot, "fecha" | "decisionesDelDia">>;
  todayFecha?: string;
}): EscaleraConcienciaModel {
  const {
    dayStats,
    conquistaArcPct,
    disciplina,
    combustible,
    ledger,
    dayStartMs,
    nowMs = Date.now(),
    snapshots = [],
    todayFecha,
  } = params;

  const brecha = detectBrechaPresenciaProduccion(
    dayStats.conquistaMin,
    dayStats.entropiaMin,
    combustible.decisiones
  );

  const presencia = scorePresencia({ dayStats, conquistaArcPct });
  const entrada = scoreEntrada(disciplina);
  const produccion = scoreProduccion({
    combustible,
    conquistaMin: dayStats.conquistaMin,
    brechaPresenciaProduccion: brecha,
  });

  const capas: EscaleraCapaMetric[] = (
    [
      { id: "presencia" as const, ...presencia },
      { id: "entrada" as const, ...entrada },
      { id: "produccion" as const, ...produccion },
    ] as const
  ).map(row => {
    const meta = ESCALERA_CAPA_META[row.id];
    return {
      ...row,
      ...meta,
      nivel: nivelFromScore(row.score),
    };
  });

  const ratioDecisionesPorHoraConquista =
    dayStats.conquistaMin >= 15
      ? combustible.decisiones / (dayStats.conquistaMin / 60)
      : null;

  return {
    capas,
    integracion: buildIntegracion(capas, brecha),
    pulso: buildProduccionPulsoSerie(ledger, dayStartMs, nowMs),
    historicaProduccion: buildProduccionHistoricaSerie(
      snapshots,
      combustible.decisiones,
      todayFecha ?? new Date(nowMs).toISOString().slice(0, 10)
    ),
    brechaPresenciaProduccion: brecha,
    ratioDecisionesPorHoraConquista,
    conquistaMin: dayStats.conquistaMin,
    decisionesHoy: combustible.decisiones,
  };
}

/** Snapshot compacto para persistir en cierre de jornada. */
export interface EscaleraCierreSnapshot {
  presenciaScore: number;
  presenciaNivel: EscaleraNivel;
  presenciaValor: string;
  entradaScore: number;
  entradaNivel: EscaleraNivel;
  entradaValor: string;
  produccionScore: number;
  produccionNivel: EscaleraNivel;
  produccionValor: string;
  decisionesHoy: number;
  conquistaMin: number;
  entropiaMin: number;
  brechaPresenciaProduccion: boolean;
  integracion: string;
}

export function serializeEscaleraForCierre(model: EscaleraConcienciaModel): EscaleraCierreSnapshot {
  const presencia = model.capas.find(c => c.id === "presencia")!;
  const entrada = model.capas.find(c => c.id === "entrada")!;
  const produccion = model.capas.find(c => c.id === "produccion")!;
  return {
    presenciaScore: presencia.score,
    presenciaNivel: presencia.nivel,
    presenciaValor: presencia.valorPrincipal,
    entradaScore: entrada.score,
    entradaNivel: entrada.nivel,
    entradaValor: entrada.valorPrincipal,
    produccionScore: produccion.score,
    produccionNivel: produccion.nivel,
    produccionValor: produccion.valorPrincipal,
    decisionesHoy: model.decisionesHoy,
    conquistaMin: model.conquistaMin,
    entropiaMin: 0,
    brechaPresenciaProduccion: model.brechaPresenciaProduccion,
    integracion: model.integracion,
  };
}

export function serializeEscaleraForCierreWithStats(
  model: EscaleraConcienciaModel,
  entropiaMin: number
): EscaleraCierreSnapshot {
  return { ...serializeEscaleraForCierre(model), entropiaMin };
}
