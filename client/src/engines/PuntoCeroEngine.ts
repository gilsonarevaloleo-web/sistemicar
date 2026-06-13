import type {
  EtapasPuntoCero,
  FasePuntoCero,
  ModoPuntoCero,
  PuntoCeroSession,
} from "@/lib/puntoCeroTypes";
import {
  PUNTO_CERO_COLOR_COUNT,
  coloresConfirmadosVacios,
} from "@/lib/puntoCeroTypes";

/** Proporción activa:pasiva = 1:2 (5 min + 10 min en bloque de 15). */
export const PUNTO_CERO_RATIO_ACTIVA = 1 / 3;

export type PuntoCeroEngineEvent =
  | { type: "enter_pasiva" }
  | { type: "enter_completada" }
  | { type: "whisper_due" }
  | { type: "auto_close_due" }
  | { type: "corona_completada" };

export function parsePuntoCeroDuracionMin(criterioDetalle?: string): number {
  const m = criterioDetalle?.match(/([\d.]+)\s*min/i);
  const n = m ? parseFloat(m[1]) : 0;
  return n > 0 ? n : 20;
}

/** Reparte duración total en fase activa (≈1/3) y pasiva (≈2/3). */
export function faseDuracionesMin(duracionTotalMin: number): {
  activaMin: number;
  pasivaMin: number;
} {
  const total = Math.max(10, Math.round(duracionTotalMin));
  const activaMin = Math.max(3, Math.round(total * PUNTO_CERO_RATIO_ACTIVA));
  const pasivaMin = Math.max(5, total - activaMin);
  return { activaMin, pasivaMin: total - activaMin };
}

export function initPuntoCeroSession(
  modo: ModoPuntoCero,
  duracionTotalMin: number,
  now: number
): PuntoCeroSession {
  return {
    modo,
    fase: "activa",
    faseInicioAt: now,
    sesionInicioAt: now,
    duracionTotalMin: Math.max(10, Math.round(duracionTotalMin)),
    coloresConfirmados: coloresConfirmadosVacios(),
  };
}

export function elapsedSesionMin(session: PuntoCeroSession, now: number): number {
  return Math.max(0, (now - session.sesionInicioAt) / 60000);
}

export function todosColoresConfirmados(colores: boolean[]): boolean {
  return colores.length >= PUNTO_CERO_COLOR_COUNT && colores.every(Boolean);
}

export function coronaConfirmada(colores: boolean[]): boolean {
  return colores.length >= PUNTO_CERO_COLOR_COUNT && colores[PUNTO_CERO_COLOR_COUNT - 1] === true;
}

/** Algún color confirmado pero aún no los 7 — no interrumpir la secuencia del arcoíris. */
export function coloresEnProgreso(colores: boolean[]): boolean {
  return colores.some(Boolean) && !todosColoresConfirmados(colores);
}

export function shouldEnterPasiva(
  session: PuntoCeroSession,
  now: number,
  colores: boolean[]
): boolean {
  if (session.fase === "pasiva" || session.fase === "completada") return false;
  if (todosColoresConfirmados(colores)) return true;
  if (coloresEnProgreso(colores)) return false;
  const { activaMin } = faseDuracionesMin(session.duracionTotalMin);
  const elapsed = elapsedSesionMin(session, now);
  return elapsed >= activaMin;
}

export function shouldComplete(session: PuntoCeroSession, now: number): boolean {
  if (session.fase === "completada") return false;
  return elapsedSesionMin(session, now) >= session.duracionTotalMin;
}

export function shouldWhisperNoche(session: PuntoCeroSession, now: number): boolean {
  if (session.modo !== "noche" || session.fase !== "pasiva") return false;
  const last = session.ultimoSusurroAt ?? session.faseInicioAt;
  return now - last >= 60_000;
}

export function transitionToPasiva(
  session: PuntoCeroSession,
  now: number
): PuntoCeroSession {
  if (session.fase === "pasiva" || session.fase === "completada") return session;
  return {
    ...session,
    fase: "pasiva",
    faseInicioAt: now,
    ultimoSusurroAt: session.modo === "noche" ? now : session.ultimoSusurroAt,
  };
}

export function transitionToCompletada(
  session: PuntoCeroSession,
  now: number
): PuntoCeroSession {
  return {
    ...session,
    fase: "completada",
    faseInicioAt: now,
  };
}

export function markWhisperDelivered(
  session: PuntoCeroSession,
  now: number
): PuntoCeroSession {
  return { ...session, ultimoSusurroAt: now };
}

export function markAutoCierreDisparado(session: PuntoCeroSession): PuntoCeroSession {
  return { ...session, autoCierreDisparado: true };
}

export function confirmColor(
  session: PuntoCeroSession,
  idx: number
): PuntoCeroSession {
  if (idx < 0 || idx >= PUNTO_CERO_COLOR_COUNT) return session;
  const colores = [...session.coloresConfirmados];
  while (colores.length < PUNTO_CERO_COLOR_COUNT) colores.push(false);
  colores[idx] = true;
  return { ...session, coloresConfirmados: colores };
}

/** Sincroniza etapa4 cuando los 7 colores están confirmados. */
export function etapasConColoresCompletos(
  etapas: EtapasPuntoCero,
  colores: boolean[]
): EtapasPuntoCero {
  if (!todosColoresConfirmados(colores)) return etapas;
  return { ...etapas, etapa4: true };
}

export function getFaseEfectiva(
  session: PuntoCeroSession,
  now: number,
  colores?: boolean[]
): FasePuntoCero {
  if (session.fase === "completada") return "completada";
  if (shouldComplete(session, now)) return "completada";
  const cols = colores ?? session.coloresConfirmados;
  if (session.fase === "pasiva" || shouldEnterPasiva(session, now, cols)) return "pasiva";
  return session.fase === "preparacion" ? "preparacion" : "activa";
}

export function tickPuntoCero(
  session: PuntoCeroSession,
  now: number,
  colores?: boolean[]
): { session: PuntoCeroSession; events: PuntoCeroEngineEvent[] } {
  const events: PuntoCeroEngineEvent[] = [];
  let next = { ...session, coloresConfirmados: colores ?? session.coloresConfirmados };

  if (next.fase === "completada") {
    if (!next.autoCierreDisparado) {
      next = markAutoCierreDisparado(next);
      events.push({ type: "auto_close_due" });
    }
    return { session: next, events };
  }

  const cols = next.coloresConfirmados;
  if (
    coronaConfirmada(cols) &&
    !todosColoresConfirmados(cols.slice(0, -1).concat([true]))
  ) {
    /* noop — corona is last color */
  }
  if (todosColoresConfirmados(cols) && next.fase === "activa") {
    events.push({ type: "corona_completada" });
  }

  if (shouldComplete(next, now)) {
    next = transitionToCompletada(next, now);
    events.push({ type: "enter_completada" });
    if (!next.autoCierreDisparado) {
      next = markAutoCierreDisparado(next);
      events.push({ type: "auto_close_due" });
    }
    return { session: next, events };
  }

  if (shouldEnterPasiva(next, now, cols) && next.fase !== "pasiva") {
    next = transitionToPasiva(next, now);
    events.push({ type: "enter_pasiva" });
  }

  if (shouldWhisperNoche(next, now)) {
    events.push({ type: "whisper_due" });
  }

  return { session: next, events };
}

/** Mensaje de cierre según modo al completar el bloque. */
export function mensajeCompletado(modo: ModoPuntoCero): string {
  return modo === "dia"
    ? "Fase Punto Cero completada. Energía restaurada. Retoma el vehículo."
    : "Apagón completado. Silencio absoluto. Buen descanso.";
}
