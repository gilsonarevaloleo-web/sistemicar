import type { SubTarea, Vehicle } from "./persistence";
import { getClockDayStartMs, parseSegmentTime, segmentClockMs } from "./segmentTime";

function filaCronPendiente(st: SubTarea): boolean {
  return !!st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") === "pendiente";
}

export type SituacionBolsaGanancia = {
  retoNumero: number;
  retosCompletados: number;
  minutosGanadosReto: number;
  minutosGanadosSesion: number;
  minutosEnCola: number;
  minutosAdelanto: number;
};

const RETO_ORDINALS: Record<number, string> = {
  1: "Primer",
  2: "Segundo",
  3: "Tercer",
  4: "Cuarto",
  5: "Quinto",
};

export function retoSituacionLabel(retoNumero: number): string {
  const ord = RETO_ORDINALS[retoNumero];
  if (ord) return `${ord} reto de enfoque`;
  return `Reto ${retoNumero} de enfoque`;
}

export function retoSituacionCorto(retoNumero: number): string {
  const ord = RETO_ORDINALS[retoNumero];
  if (ord) return `${ord} reto`;
  return `Reto ${retoNumero}`;
}

/** Minutos repartidos en cupo de filas pendientes (ya no en chips separados). */
export function sumMinutosEnColaGanancia(subTareas: SubTarea[]): number {
  return 0;
}

export function describeRepartoGananciaEnCola(
  antes: SubTarea[],
  despues: SubTarea[],
  _afterSubTareaId: string
): string | null {
  const partes: string[] = [];
  for (const next of despues.filter(st => st.enDesgloseCronometro && filaCronPendiente(st))) {
    const prev = antes.find(s => s.id === next.id);
    if (!prev) continue;
    const delta = (next.minutosCupo ?? 0) - (prev.minutosCupo ?? 0);
    if (delta === 0) continue;
    const label = next.texto.length > 22 ? `${next.texto.slice(0, 22)}…` : next.texto;
    partes.push(`${label} ${delta > 0 ? "+" : ""}${delta}′`);
  }
  if (partes.length === 0) return null;
  return partes.join(" · ");
}

export function computeSituacionBolsaGanancia(
  subTareas: SubTarea[],
  sc: Vehicle["situacionCronometro"]
): SituacionBolsaGanancia {
  return {
    retoNumero: sc?.retoNumero ?? 1,
    retosCompletados: sc?.retosCompletados ?? 0,
    minutosGanadosReto: sc?.minutosGanadosReto ?? 0,
    minutosGanadosSesion: sc?.minutosGanadosSesion ?? 0,
    minutosEnCola: sumMinutosEnColaGanancia(subTareas),
    minutosAdelanto: sc?.saldoAdelantoMin ?? 0,
  };
}

/** Minutos reales usados en filas cronometradas ya cerradas. */
export function sumMinutosRealesCronometro(subTareas: SubTarea[]): number {
  return subTareas
    .filter(st => st.enDesgloseCronometro && st.duracionRealSec != null)
    .reduce((a, st) => a + Math.ceil((st.duracionRealSec ?? 0) / 60), 0);
}

export function computeEficienciaSituacionPct(
  minutosGanados: number,
  minutosReales: number
): number | null {
  const base = minutosReales + minutosGanados;
  if (base <= 0 || minutosGanados <= 0) return null;
  return Math.min(99, Math.round((minutosGanados / base) * 100));
}

export function nextRetoNumero(prevSc: Vehicle["situacionCronometro"]): number {
  const completados = prevSc?.retosCompletados ?? 0;
  return completados > 0 ? completados + 1 : 1;
}

/** Meta sellada del reto (fallback a horaFinMs en datos legacy). */
export function situacionContratoFinMs(
  sc: Vehicle["situacionCronometro"] | null | undefined
): number | null {
  if (!sc) return null;
  return sc.horaFinContratoMs ?? sc.horaFinMs ?? null;
}

/** Minutos disponibles para abrir el siguiente reto (tras cerrar bloque). */
export function bolsaDisponibleSegundoReto(
  sc: Vehicle["situacionCronometro"] | null | undefined
): number {
  if (!sc || sc.activo === true) return 0;
  return Math.max(0, Math.round(sc.bolsaSegundoRetoMin ?? 0));
}

/** Cierra el bloque activo: marca reto cumplido y calcula bolsa (ganancia + tiempo restante en meta). */
export function buildSituacionCronometroCierre(
  sc: NonNullable<Vehicle["situacionCronometro"]>,
  nowMs: number = Date.now()
): NonNullable<Vehicle["situacionCronometro"]> {
  const contratoMs = situacionContratoFinMs(sc);
  const minutosRestantesObjetivo =
    contratoMs != null ? Math.max(0, Math.round((contratoMs - nowMs) / 60000)) : 0;
  const bolsaGanada = (sc.minutosGanadosReto ?? 0) + (sc.saldoAdelantoMin ?? 0);
  const bolsaTotal = bolsaGanada + minutosRestantesObjetivo;
  return {
    activo: false,
    bloqueInicioAt: sc.bloqueInicioAt,
    depthBlockPsGranted: sc.depthBlockPsGranted ?? 0,
    retosCompletados: (sc.retosCompletados ?? 0) + 1,
    retoNumero: sc.retoNumero ?? 1,
    minutosGanadosReto: sc.minutosGanadosReto ?? 0,
    minutosGanadosSesion: sc.minutosGanadosSesion ?? 0,
    saldoAdelantoMin: 0,
    bolsaSegundoRetoMin: bolsaTotal > 0 ? bolsaTotal : undefined,
    ...(sc.horaFinContratoMs != null
      ? { horaFinContratoMs: sc.horaFinContratoMs, horaFinMs: sc.horaFinContratoMs }
      : sc.horaFinMs != null
        ? { horaFinMs: sc.horaFinMs, horaFinContratoMs: sc.horaFinMs }
        : {}),
  };
}

/** Convierte HH:mm local en timestamp de meta (hoy o mañana si ya pasó). */
export function situacionObjetivoHoraToContratoMs(
  hhmm: string,
  nowMs: number = Date.now()
): number | null {
  if (!parseSegmentTime(hhmm)) return null;
  const dayStart = getClockDayStartMs(nowMs);
  let target = segmentClockMs(hhmm, dayStart);
  if (target <= nowMs) target += 86400000;
  return target;
}

/** Minutos restantes hasta una meta HH:mm (mínimo 1). */
export function situacionMinutosHastaObjetivoHora(
  hhmm: string,
  nowMs: number = Date.now()
): number | null {
  const target = situacionObjetivoHoraToContratoMs(hhmm, nowMs);
  if (target == null) return null;
  const remaining = Math.round((target - nowMs) / 60000);
  return remaining >= 1 ? remaining : null;
}

/** Meta para abrir el ring desde el Crisol: fin de segmento activo o +30 min. */
export function resolveDefaultObjetivoHoraParaRing(
  segmentoHoraFin?: string,
  nowMs: number = Date.now()
): string | null {
  const fin = segmentoHoraFin?.trim();
  if (fin && situacionMinutosHastaObjetivoHora(fin, nowMs) != null) {
    return fin;
  }
  const d = new Date(nowMs + 30 * 60000);
  const candidate = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return situacionMinutosHastaObjetivoHora(candidate, nowMs) != null ? candidate : null;
}
