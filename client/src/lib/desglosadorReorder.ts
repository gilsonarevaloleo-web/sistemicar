import type { SubTarea, SubVehiculo } from "./persistence";

export type ReorderDirection = "up" | "down";

export function isSituacionCronometroPendiente(st: SubTarea): boolean {
  return !!st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") === "pendiente";
}

/** Reordena subs pendientes; null si id inválido o movimiento imposible. */
export function reorderSubVehiculos(
  subs: SubVehiculo[],
  movedId: string,
  direction: ReorderDirection
): SubVehiculo[] | null {
  const firstPending = subs.findIndex(s => s.status === "pendiente");
  if (firstPending === -1) return null;

  const pending = subs.filter(s => s.status === "pendiente");
  if (pending.length < 2) return null;

  const idx = pending.findIndex(s => s.id === movedId);
  if (idx === -1) return null;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= pending.length) return null;

  const reordered = [...pending];
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

  const afterPending = subs.slice(firstPending + pending.length);
  return [...subs.slice(0, firstPending), ...reordered, ...afterPending];
}

/** Reordena filas pendientes del cronómetro situacional (swap en subTareas). */
export function reorderSubTareasCronometro(
  subTareas: SubTarea[],
  movedId: string,
  direction: ReorderDirection
): SubTarea[] | null {
  const pendingSlots = subTareas
    .map((st, i) => ({ st, i }))
    .filter(({ st }) => isSituacionCronometroPendiente(st));

  if (pendingSlots.length < 2) return null;

  const idx = pendingSlots.findIndex(({ st }) => st.id === movedId);
  if (idx === -1) return null;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= pendingSlots.length) return null;

  const next = [...subTareas];
  const iA = pendingSlots[idx].i;
  const iB = pendingSlots[swapIdx].i;
  [next[iA], next[iB]] = [next[iB], next[iA]];
  return next;
}

export function firstPendingSubVehiculoTitulo(subs: SubVehiculo[]): string | null {
  return subs.find(s => s.status === "pendiente")?.titulo ?? null;
}

export function firstPendingCronometroTexto(subTareas: SubTarea[]): string | null {
  return subTareas.find(isSituacionCronometroPendiente)?.texto ?? null;
}
