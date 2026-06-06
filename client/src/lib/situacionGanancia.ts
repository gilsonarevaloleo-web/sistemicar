import type { SubTarea, Vehicle } from "./persistence";
import { getClockDayStartMs, parseSegmentTime, segmentClockMs } from "./segmentTime";

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
  if (ord) return `${ord} reto de desglosador situacional`;
  return `Reto ${retoNumero} de desglosador situacional`;
}

export function retoSituacionCorto(retoNumero: number): string {
  const ord = RETO_ORDINALS[retoNumero];
  if (ord) return `${ord} reto`;
  return `Reto ${retoNumero}`;
}

/** Minutos de bonificación repartidos en filas pendientes del cronómetro. */
export function sumMinutosEnColaGanancia(subTareas: SubTarea[]): number {
  return subTareas
    .filter(
      st =>
        st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") === "pendiente"
    )
    .reduce((a, st) => a + (st.minutosGanadosAcum ?? 0), 0);
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
