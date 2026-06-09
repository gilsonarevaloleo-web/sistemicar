import { formatHHMM } from "./desglosadorClock";
import type { SubTarea, Vehicle } from "./persistence";
import { situacionContratoFinMs } from "./situacionGanancia";

export function situacionFilaCronometroPendiente(st: SubTarea): boolean {
  return !!st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") === "pendiente";
}

export function situacionFilaEnFocoPendiente(st: SubTarea): boolean {
  if ((st.minutosCupo ?? 0) <= 0) return false;
  if (st.enDesgloseCronometro) return situacionFilaCronometroPendiente(st);
  return !st.completada;
}

/** True cuando debe mostrarse la cuenta regresiva situacional (cronómetro o fila en foco). */
export function situacionRelojDebeMostrarse(vehicle: Pick<Vehicle, "tipoFlota" | "status" | "subTareas" | "situacionCronometro" | "situacionCupoAnchor">): boolean {
  if (vehicle.tipoFlota !== "situacion" || vehicle.status !== "activo") return false;
  const subs = vehicle.subTareas || [];
  if (vehicle.situacionCronometro?.activo === true) {
    if (sumMinutosCronometroPendientes(subs) > 0) return true;
    const firstCron = filasCronometroOrdenadas(subs).find(situacionFilaCronometroPendiente);
    if (firstCron && (firstCron.minutosCupo ?? 0) > 0) return true;
  }
  const anchor = vehicle.situacionCupoAnchor;
  if (anchor?.subTareaId) {
    const sub = subs.find(s => s.id === anchor.subTareaId);
    if (sub && situacionFilaEnFocoPendiente(sub)) return true;
  }
  return false;
}

/** Hora objetivo del reloj situacional: fila en foco, o primera fila del cronómetro mientras sincroniza ancla. */
export function situacionTargetMsReloj(
  vehicle: Pick<Vehicle, "tipoFlota" | "subTareas" | "situacionCronometro" | "situacionCupoAnchor" | "aperturaAt">,
  now = Date.now()
): number | null {
  if (vehicle.tipoFlota !== "situacion") return null;
  const subs = vehicle.subTareas || [];
  const sc = vehicle.situacionCronometro;
  const aperturaMs = vehicle.aperturaAt ?? now;
  const anchor = vehicle.situacionCupoAnchor;
  const adelantoMs = (sc?.saldoAdelantoMin ?? 0) * 60000;

  if (anchor?.subTareaId) {
    const sub = subs.find(s => s.id === anchor.subTareaId);
    if (sub && situacionFilaEnFocoPendiente(sub) && (sub.minutosCupo ?? 0) > 0) {
      return anchor.startedAt + sub.minutosCupo! * 60000 - adelantoMs;
    }
  }

  if (sc?.activo) {
    const firstPending = filasCronometroOrdenadas(subs).find(situacionFilaCronometroPendiente);
    if (firstPending && (firstPending.minutosCupo ?? 0) > 0) {
      const start = sc.bloqueInicioAt ?? aperturaMs;
      return start + firstPending.minutosCupo! * 60000 - adelantoMs;
    }
    const proy = computeSituacionProyeccionFinMs(subs, {
      bloqueInicioAt: sc.bloqueInicioAt ?? aperturaMs,
      anchor,
      now,
      saldoAdelantoMin: sc.saldoAdelantoMin,
    });
    if (proy != null) return proy - adelantoMs;
    const contrato = sc.horaFinContratoMs ?? sc.horaFinMs;
    if (contrato != null) return contrato - adelantoMs;
    const sum = sumMinutosCronometroPendientes(subs);
    if (sum > 0) return (sc.bloqueInicioAt ?? aperturaMs) + sum * 60000 - adelantoMs;
  }

  return null;
}

/** Fin proyectado del bloque según filas pendientes y tiempo ganado en vivo. */
export function computeSituacionProyeccionFinMs(
  subTareas: SubTarea[],
  opts: {
    bloqueInicioAt: number;
    anchor?: { subTareaId: string; startedAt: number } | null;
    now?: number;
    saldoAdelantoMin?: number;
  }
): number | null {
  const horarios = computeSituacionCronometroHorarios(subTareas, {
    bloqueInicioAt: opts.bloqueInicioAt,
    anchor: opts.anchor,
    now: opts.now,
    previewTiempoGanado: true,
    saldoAdelantoMin: opts.saldoAdelantoMin,
  });
  if (horarios.length === 0) return null;
  return horarios[horarios.length - 1]!.finMs;
}

/** Minutos de ventaja vs contrato sellado (positivo = vas ganando). */
export function situacionGananciaVsContratoMin(
  contratoMs: number | null,
  proyeccionMs: number | null
): number | null {
  if (contratoMs == null || proyeccionMs == null) return null;
  return Math.round((contratoMs - proyeccionMs) / 60000);
}

export function isCupoFijo(st: SubTarea): boolean {
  return st.cupoFijo === true && (st.minutosCupo ?? 0) > 0;
}

export function sumMinutosCronometroPendientes(subTareas: SubTarea[] | undefined): number {
  return (subTareas || []).filter(situacionFilaCronometroPendiente).reduce((a, st) => a + (st.minutosCupo ?? 0), 0);
}

export function filasCronometroOrdenadas(subTareas: SubTarea[]): SubTarea[] {
  return (subTareas || []).filter(st => st.enDesgloseCronometro);
}

/** Reparte `total` entre slots con pesos (mín. `minPerSlot` por slot). */
function repartirProporcional(weights: number[], total: number, minPerSlot = 1): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const totalClamped = Math.max(n * minPerSlot, Math.round(total));
  const ws = weights.map(w => Math.max(1, w));
  const sumW = ws.reduce((a, b) => a + b, 0);
  const floors = ws.map(w => Math.max(minPerSlot, Math.floor((totalClamped * w) / sumW)));
  const alloc = [...floors];
  let diff = totalClamped - alloc.reduce((a, b) => a + b, 0);
  let j = 0;
  while (diff > 0) {
    alloc[j % n] += 1;
    diff -= 1;
    j += 1;
  }
  j = 0;
  while (diff < 0 && j < n * 200) {
    const idx = j % n;
    if (alloc[idx] > minPerSlot) {
      alloc[idx] -= 1;
      diff += 1;
    }
    j += 1;
  }
  return alloc;
}

/** Reparte minutos ganados en partes iguales entre filas pendientes elegibles. */
function repartirMinutosGanadosAcum(
  subTareas: SubTarea[],
  minutosGanados: number,
  excludeSubTareaIds: string[],
  opts?: { includeCupoFijo?: boolean }
): SubTarea[] {
  if (minutosGanados <= 0) return subTareas;
  const exclude = new Set(excludeSubTareaIds);
  const pendingIdx = subTareas
    .map((st, i) => ({ st, i }))
    .filter(
      ({ st }) =>
        situacionFilaCronometroPendiente(st) &&
        !exclude.has(st.id) &&
        (opts?.includeCupoFijo || !isCupoFijo(st))
    );
  if (pendingIdx.length === 0) return subTareas;

  const bonus = repartirProporcional(
    pendingIdx.map(() => 1),
    minutosGanados,
    0
  );
  const next = [...subTareas];
  pendingIdx.forEach(({ st, i }, k) => {
    next[i] = {
      ...st,
      minutosGanadosAcum: (st.minutosGanadosAcum ?? 0) + bonus[k],
    };
  });
  return next;
}

function transferirMinutosAlFoco(
  subTareas: SubTarea[],
  focusSubTareaId: string,
  minutos: number
): SubTarea[] {
  if (minutos <= 0) return subTareas;
  const focoIdx = subTareas.findIndex(st => st.id === focusSubTareaId);
  if (focoIdx === -1) return subTareas;
  const foco = subTareas[focoIdx];
  if (!situacionFilaCronometroPendiente(foco)) return subTareas;
  const next = [...subTareas];
  next[focoIdx] = {
    ...foco,
    minutosCupo: (foco.minutosCupo ?? 0) + minutos,
  };
  return next;
}

export type DescontarFlexiblesResult =
  | { ok: true; subTareas: SubTarea[]; descontado: number }
  | { ok: false; reason: "sin_flexibles" | "insuficiente"; disponible: number };

/** Resta minutos solo de filas posteriores pendientes en cronómetro sin cupo fijo. */
export function descontarMinutosDeFlexiblesPosteriores(
  subTareas: SubTarea[],
  subTareaId: string,
  delta: number
): DescontarFlexiblesResult {
  if (delta <= 0) return { ok: false, reason: "insuficiente", disponible: 0 };
  const idx = subTareas.findIndex(st => st.id === subTareaId);
  if (idx === -1) return { ok: false, reason: "sin_flexibles", disponible: 0 };

  const flexTargets = subTareas
    .map((st, i) => ({ st, i }))
    .filter(
      ({ st, i }) =>
        i > idx &&
        situacionFilaCronometroPendiente(st) &&
        !isCupoFijo(st) &&
        (st.minutosCupo ?? 0) > 0
    );

  const disponible = flexTargets.reduce((a, { st }) => a + (st.minutosCupo ?? 0), 0);
  if (flexTargets.length === 0) return { ok: false, reason: "sin_flexibles", disponible: 0 };
  if (disponible < delta) return { ok: false, reason: "insuficiente", disponible };

  let remaining = delta;
  const next = [...subTareas];
  for (const { st, i } of flexTargets) {
    if (remaining <= 0) break;
    const cur = st.minutosCupo ?? 0;
    const take = Math.min(cur, remaining);
    const newMin = cur - take;
    if (newMin <= 0) {
      const row = { ...next[i] };
      delete (row as { minutosCupo?: number }).minutosCupo;
      delete (row as { cupoFijo?: boolean }).cupoFijo;
      next[i] = row;
    } else {
      next[i] = { ...st, minutosCupo: newMin };
    }
    remaining -= take;
  }

  return { ok: true, subTareas: next, descontado: delta };
}

export type QuitarHaciaFocoResult =
  | { ok: true; subTareas: SubTarea[]; descontado: number; focoGanado: number }
  | { ok: false; reason: "sin_flexibles" | "insuficiente" | "sin_foco" | "foco_no_pendiente"; disponible?: number };

/** Quitar min de cola posterior y transferir a la fila foco (Σ cupos constante). */
export function quitarMinutosHaciaFoco(
  subTareas: SubTarea[],
  fromSubTareaId: string,
  focusSubTareaId: string,
  delta: number
): QuitarHaciaFocoResult {
  const discount = descontarMinutosDeFlexiblesPosteriores(subTareas, fromSubTareaId, delta);
  if (!discount.ok) {
    return {
      ok: false,
      reason: discount.reason,
      disponible: discount.disponible,
    };
  }

  const focoIdx = discount.subTareas.findIndex(st => st.id === focusSubTareaId);
  if (focoIdx === -1) return { ok: false, reason: "sin_foco" };

  const foco = discount.subTareas[focoIdx];
  if (!situacionFilaCronometroPendiente(foco)) {
    return { ok: false, reason: "foco_no_pendiente" };
  }

  const next = [...discount.subTareas];
  next[focoIdx] = {
    ...foco,
    minutosCupo: (foco.minutosCupo ?? 0) + discount.descontado,
  };

  return {
    ok: true,
    subTareas: next,
    descontado: discount.descontado,
    focoGanado: discount.descontado,
  };
}

function inicioMsFilaCronometro(
  subTareas: SubTarea[],
  subTareaId: string,
  bloqueInicioAt: number,
  anchor?: { subTareaId: string; startedAt: number } | null
): number {
  const cronRows = filasCronometroOrdenadas(subTareas);
  let cursor = bloqueInicioAt;
  for (const st of cronRows) {
    if (st.id === subTareaId) {
      if (anchor?.subTareaId === st.id) return anchor.startedAt;
      return cursor;
    }
    if (!situacionFilaCronometroPendiente(st)) {
      const durationSec =
        st.duracionRealSec != null
          ? st.duracionRealSec
          : Math.max(0, (st.minutosCupo ?? 0) * 60);
      cursor = (st.cerradaAt ?? cursor + durationSec * 1000);
    } else if (anchor?.subTareaId === st.id) {
      cursor = anchor.startedAt + (st.minutosCupo ?? 0) * 60000;
    } else {
      cursor += (st.minutosCupo ?? 0) * 60000;
    }
  }
  return bloqueInicioAt;
}

/** Copia virtual: minutos ganados en foco → chips en cola (preview UI). */
function aplicarPreviewTiempoGanado(
  subTareas: SubTarea[],
  anchor: { subTareaId: string; startedAt: number },
  now: number
): SubTarea[] {
  const focal = subTareas.find(st => st.id === anchor.subTareaId);
  if (!focal || !situacionFilaCronometroPendiente(focal)) return subTareas;
  const cupoMin = focal.minutosCupo ?? 0;
  if (cupoMin <= 0) return subTareas;
  const elapsedMin = Math.floor(Math.max(0, now - anchor.startedAt) / 60000);
  const minutosVirtualesGanados = Math.max(0, cupoMin - elapsedMin);
  if (minutosVirtualesGanados <= 0) return subTareas;
  return repartirMinutosGanadosAcum(subTareas, minutosVirtualesGanados, [anchor.subTareaId]);
}

export type SituacionFilaHorario = {
  subTareaId: string;
  inicioMs: number;
  finMs: number;
  finLabel: string;
  minutosCupo: number;
  enFoco: boolean;
  pendiente: boolean;
};

export function computeSituacionCronometroHorarios(
  subTareas: SubTarea[],
  opts: {
    bloqueInicioAt: number;
    anchor?: { subTareaId: string; startedAt: number } | null;
    now?: number;
    previewTiempoGanado?: boolean;
    saldoAdelantoMin?: number;
  }
): SituacionFilaHorario[] {
  const now = opts.now ?? Date.now();
  const cronRows = filasCronometroOrdenadas(subTareas);
  if (cronRows.length === 0) return [];

  let effective = subTareas;
  if (opts.previewTiempoGanado && opts.anchor?.subTareaId) {
    effective = aplicarPreviewTiempoGanado(subTareas, opts.anchor, now);
  }
  const effectiveById = new Map(filasCronometroOrdenadas(effective).map(st => [st.id, st]));

  let cursor = opts.bloqueInicioAt;
  const out: SituacionFilaHorario[] = [];

  for (const st of cronRows) {
    const eff = effectiveById.get(st.id) ?? st;
    const pendiente = situacionFilaCronometroPendiente(st);
    const enFoco = pendiente && opts.anchor?.subTareaId === st.id;
    const minutosCupo = st.minutosCupo ?? eff.minutosCupo ?? 0;

    if (!pendiente) {
      const durationSec =
        st.duracionRealSec != null
          ? st.duracionRealSec
          : Math.max(0, minutosCupo * 60);
      const inicioMs = cursor;
      const finMs = st.cerradaAt ?? inicioMs + durationSec * 1000;
      cursor = finMs;
      out.push({
        subTareaId: st.id,
        inicioMs,
        finMs,
        finLabel: formatHHMM(finMs),
        minutosCupo,
        enFoco: false,
        pendiente: false,
      });
      continue;
    }

    let inicioMs: number;
    let finMs: number;

    if (enFoco && opts.anchor) {
      inicioMs = opts.anchor.startedAt;
      const plannedFinMs = inicioMs + minutosCupo * 60000;
      finMs = plannedFinMs;
      const ahead = opts.previewTiempoGanado && now < plannedFinMs;
      cursor = ahead ? now : plannedFinMs;
    } else {
      inicioMs = cursor;
      finMs = inicioMs + minutosCupo * 60000;
      cursor = finMs;
    }

    out.push({
      subTareaId: st.id,
      inicioMs,
      finMs,
      finLabel: formatHHMM(finMs),
      minutosCupo,
      enFoco,
      pendiente: true,
    });
  }

  const adelantoMs = (opts.saldoAdelantoMin ?? 0) * 60000;
  if (adelantoMs > 0) {
    return out.map(h => ({
      ...h,
      finMs: h.finMs - adelantoMs,
      finLabel: formatHHMM(h.finMs - adelantoMs),
    }));
  }

  return out;
}

function calcMinutosGanadosCierre(
  target: SubTarea,
  anchor: { subTareaId: string; startedAt: number } | null | undefined,
  now: number,
  bloqueInicioAt: number,
  subTareas: SubTarea[]
): { duracionRealSec: number; minutosGanados: number } {
  const cupoMin = target.minutosCupo ?? 0;
  let duracionRealSec = Math.max(0, cupoMin * 60);
  let minutosGanados = 0;

  if (cupoMin <= 0) {
    return { duracionRealSec: 0, minutosGanados: 0 };
  }

  if (anchor?.subTareaId === target.id) {
    duracionRealSec = Math.max(0, Math.floor((now - anchor.startedAt) / 1000));
  } else {
    const inicio = inicioMsFilaCronometro(subTareas, target.id, bloqueInicioAt, anchor);
    duracionRealSec = Math.max(0, Math.floor((now - inicio) / 1000));
  }

  const elapsedMin = Math.ceil(duracionRealSec / 60);
  minutosGanados = Math.max(0, cupoMin - elapsedMin);
  return { duracionRealSec, minutosGanados };
}

/**
 * Al marcar cumplido: registra duración real, reparte minutos ganados como chips en cola.
 */
export function aplicarTiempoGanadoAlCumplir(
  subTareas: SubTarea[],
  subTareaId: string,
  anchor: { subTareaId: string; startedAt: number } | null | undefined,
  now: number,
  bloqueInicioAt?: number
): { subTareas: SubTarea[]; minutosGanados: number; saldoAdelantoMin: number } {
  const target = subTareas.find(st => st.id === subTareaId);
  if (!target?.enDesgloseCronometro || (target.resultadoSituacion ?? "pendiente") !== "pendiente") {
    return { subTareas, minutosGanados: 0, saldoAdelantoMin: 0 };
  }

  const baseInicio = bloqueInicioAt ?? now;
  const { duracionRealSec, minutosGanados } = calcMinutosGanadosCierre(
    target,
    anchor,
    now,
    baseInicio,
    subTareas
  );

  let next = subTareas.map(st =>
    st.id === subTareaId
      ? {
          ...st,
          completada: true,
          resultadoSituacion: "cumplido" as const,
          duracionRealSec,
          cerradaAt: now,
        }
      : st
  );

  let saldoAdelantoMin = 0;
  if (minutosGanados > 0) {
    const eraFoco = anchor?.subTareaId === subTareaId;
    if (eraFoco) {
      const before = JSON.stringify(next);
      next = repartirMinutosGanadosAcum(next, minutosGanados, [subTareaId]);
      if (JSON.stringify(next) === before) {
        saldoAdelantoMin = minutosGanados;
      }
    } else {
      const focusId = resolveFocusSubTareaId(subTareas, anchor);
      const before = JSON.stringify(next);
      if (focusId) {
        next = transferirMinutosAlFoco(next, focusId, minutosGanados);
      }
      if (JSON.stringify(next) === before) {
        saldoAdelantoMin = minutosGanados;
      }
    }
  }

  return { subTareas: next, minutosGanados, saldoAdelantoMin };
}

/**
 * Saca una fila pendiente del cronómetro hacia la reserva acumulativa (sin PS).
 * Conserva texto, cupo y detalles para retomar después.
 */
export function extraerSubTareaAReserva(
  subTareas: SubTarea[],
  subTareaId: string
): { subTareas: SubTarea[]; extraido: SubTarea | null } {
  const target = subTareas.find(st => st.id === subTareaId);
  if (!target?.enDesgloseCronometro || (target.resultadoSituacion ?? "pendiente") !== "pendiente") {
    return { subTareas, extraido: null };
  }
  return {
    subTareas: subTareas.filter(st => st.id !== subTareaId),
    extraido: target,
  };
}

/** Cierra todas las filas pendientes del cronómetro de un golpe (fallado con tiempo real en foco). */
export function cerrarCronometroDeGolpe(
  subTareas: SubTarea[],
  anchor: { subTareaId: string; startedAt: number } | null | undefined,
  now: number,
  bloqueInicioAt: number
): SubTarea[] {
  return subTareas.map(st => {
    if (!st.enDesgloseCronometro || (st.resultadoSituacion ?? "pendiente") !== "pendiente") {
      return st;
    }
    const { duracionRealSec } = calcMinutosGanadosCierre(st, anchor, now, bloqueInicioAt, subTareas);
    return {
      ...st,
      completada: false,
      resultadoSituacion: "fallado" as const,
      duracionRealSec,
      cerradaAt: now,
    };
  });
}

/** Registra cierre fallado con duración real (sin redistribuir tiempo). */
export function registrarCierreFalladoCronometro(
  subTareas: SubTarea[],
  subTareaId: string,
  anchor: { subTareaId: string; startedAt: number } | null | undefined,
  now: number,
  bloqueInicioAt?: number
): SubTarea[] {
  const target = subTareas.find(st => st.id === subTareaId);
  if (!target) return subTareas;

  const baseInicio = bloqueInicioAt ?? now;
  const { duracionRealSec } = calcMinutosGanadosCierre(target, anchor, now, baseInicio, subTareas);

  return subTareas.map(st =>
    st.id === subTareaId
      ? {
          ...st,
          completada: false,
          resultadoSituacion: "fallado" as const,
          duracionRealSec,
          cerradaAt: now,
        }
      : st
  );
}

/**
 * Reparte minutos entre filas pendientes del cronómetro.
 * Filas con `cupoFijo` conservan su minutosCupo; el resto del presupuesto va a las flexibles.
 */
export function redistribuirMinutosSituacionCronometro(subTareas: SubTarea[], remainingMin: number): SubTarea[] {
  const pendingIdx = subTareas
    .map((st, i) => ({ st, i }))
    .filter(({ st }) => situacionFilaCronometroPendiente(st));
  if (pendingIdx.length === 0) return subTareas;

  const fixed = pendingIdx.filter(({ st }) => isCupoFijo(st));
  const flexible = pendingIdx.filter(({ st }) => !isCupoFijo(st));

  const fixedSum = fixed.reduce((a, { st }) => a + (st.minutosCupo ?? 0), 0);
  const next = [...subTareas];

  if (flexible.length === 0) return next;

  const flexBudget = Math.max(flexible.length, Math.round(remainingMin) - fixedSum);
  const alloc = repartirProporcional(
    flexible.map(() => 1),
    flexBudget,
    1
  );

  flexible.forEach(({ st, i }, k) => {
    next[i] = { ...st, minutosCupo: alloc[k] };
  });

  return next;
}

/** Aplica minutos manuales (marca cupoFijo) y redistribuye el sobrante entre filas flexibles. */
export function applyCupoManualYRedistribuir(
  subTareas: SubTarea[],
  subTareaId: string,
  minutos: number | undefined,
  totalBudgetMin: number
): SubTarea[] {
  const afterManual = subTareas.map(st => {
    if (st.id !== subTareaId) return st;
    if (minutos === undefined || minutos <= 0 || !Number.isFinite(minutos)) {
      const next = { ...st };
      delete (next as { minutosCupo?: number; cupoFijo?: boolean }).minutosCupo;
      delete (next as { cupoFijo?: boolean }).cupoFijo;
      return next;
    }
    return {
      ...st,
      minutosCupo: Math.round(Math.min(999, Math.max(0, minutos))),
      cupoFijo: true,
    };
  });
  return redistribuirMinutosSituacionCronometro(afterManual, totalBudgetMin);
}

export function totalBudgetMinFromCronometro(
  subTareas: SubTarea[],
  bloqueInicioAt: number,
  horaFinContratoMs?: number
): number {
  if (horaFinContratoMs != null) {
    return Math.max(1, Math.round((horaFinContratoMs - bloqueInicioAt) / 60000));
  }
  return Math.max(1, sumMinutosCronometroPendientes(subTareas));
}

/** Minutos restantes hasta la meta sellada (+ adelanto acumulado) para repartir cupos sin mover el objetivo. */
export function remainingCronometroBudgetMin(
  sc: Vehicle["situacionCronometro"],
  nowMs: number = Date.now()
): number | null {
  if (!sc?.activo) return null;
  const contratoMs = situacionContratoFinMs(sc);
  if (contratoMs == null) return null;
  const wallMin = Math.round((contratoMs - nowMs) / 60000);
  const adelanto = sc.saldoAdelantoMin ?? 0;
  return Math.max(1, wallMin + adelanto);
}

export function resolveFocusSubTareaId(
  subTareas: SubTarea[],
  anchor?: { subTareaId: string; startedAt: number } | null
): string | null {
  if (anchor?.subTareaId) {
    const sub = subTareas.find(st => st.id === anchor.subTareaId);
    if (sub && situacionFilaCronometroPendiente(sub)) return anchor.subTareaId;
  }
  const first = filasCronometroOrdenadas(subTareas).find(situacionFilaCronometroPendiente);
  return first?.id ?? null;
}
