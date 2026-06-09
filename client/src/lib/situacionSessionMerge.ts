import type { DetalleSubTarea, SubTarea, SubVehiculo, Vehicle } from "./persistence";

function countSubTareasEnCronometro(v: Vehicle): number {
  return v.subTareas?.filter(st => st.enDesgloseCronometro).length ?? 0;
}

export function hasActiveSituacionDesglose(v: Vehicle): boolean {
  if (v.tipoFlota !== "situacion" || v.status !== "activo") return false;
  return (
    (v.subTareas?.length ?? 0) > 0 ||
    v.situacionCronometro?.activo === true ||
    countSubTareasEnCronometro(v) > 0
  );
}

function subTareaSessionScore(st: SubTarea): number {
  let score = (st.detalles?.length ?? 0) * 10;
  if (st.enDesgloseCronometro) score += 4;
  if ((st.minutosCupo ?? 0) > 0) score += 2;
  if (st.cupoFijo) score += 3;
  if (st.resultadoSituacion && st.resultadoSituacion !== "pendiente") score += 1;
  if (st.completada) score += 1;
  return score;
}

function mergeDetallesLists(
  a: DetalleSubTarea[] | undefined,
  b: DetalleSubTarea[] | undefined
): DetalleSubTarea[] | undefined {
  const listA = a ?? [];
  const listB = b ?? [];
  if (listA.length === 0 && listB.length === 0) return undefined;
  const byId = new Map<string, DetalleSubTarea>();
  for (const d of listA) byId.set(d.id, d);
  for (const d of listB) {
    const prev = byId.get(d.id);
    if (!prev) byId.set(d.id, d);
    else byId.set(d.id, { ...prev, ...d, entregado: prev.entregado || d.entregado });
  }
  return [...byId.values()].sort((x, y) => x.creadaAt - y.creadaAt);
}

/** Fusiona subtareas por id conservando la versi�n m�s rica (detalles, cron�metro, cupos). */
export function mergeSubTareasById(
  firebaseSubs: SubTarea[] | undefined,
  localSubs: SubTarea[] | undefined
): SubTarea[] {
  const fb = firebaseSubs ?? [];
  const local = localSubs ?? [];
  const byId = new Map<string, SubTarea>();
  const order: string[] = [];

  for (const st of fb) {
    byId.set(st.id, st);
    order.push(st.id);
  }
  for (const st of local) {
    if (!byId.has(st.id)) {
      byId.set(st.id, st);
      order.push(st.id);
    } else {
      const existing = byId.get(st.id)!;
      const scoreExisting = subTareaSessionScore(existing);
      const scoreIncoming = subTareaSessionScore(st);
      const pickIncoming = scoreIncoming > scoreExisting;
      const base = pickIncoming ? { ...existing, ...st } : existing;
      byId.set(st.id, {
        ...base,
        detalles: mergeDetallesLists(existing.detalles, st.detalles),
      });
    }
  }
  return order.map(id => byId.get(id)!);
}

function pickSituacionCronometro(
  fb: Vehicle["situacionCronometro"],
  local: Vehicle["situacionCronometro"]
): Vehicle["situacionCronometro"] {
  if (!fb && !local) return undefined;
  if (!fb) return local;
  if (!local) return fb;
  if (local.activo === true && fb.activo !== true) return local;
  if (fb.activo === true && local.activo !== true) return fb;
  const fbFin = fb.horaFinContratoMs ?? fb.horaFinMs ?? 0;
  const localFin = local.horaFinContratoMs ?? local.horaFinMs ?? 0;
  return localFin >= fbFin ? local : fb;
}

function pickSituacionCupoAnchor(
  fb: Vehicle["situacionCupoAnchor"],
  local: Vehicle["situacionCupoAnchor"]
): Vehicle["situacionCupoAnchor"] {
  if (!fb?.subTareaId && local?.subTareaId) return local;
  if (fb?.subTareaId && !local?.subTareaId) return fb;
  if (fb?.subTareaId && local?.subTareaId) {
    if (local.subTareaId === fb.subTareaId) {
      return (local.startedAt ?? 0) <= (fb.startedAt ?? 0) ? local : fb;
    }
    return local;
  }
  return fb ?? local;
}

/** Aplica merge de sesi�n situacional sobre un veh�culo ya parcialmente fusionado. */
export function applySituacionDesgloseMerge(
  merged: Vehicle,
  firebaseV: Vehicle,
  localV: Vehicle
): Vehicle {
  const activeSituacionPair =
    firebaseV.tipoFlota === "situacion" &&
    localV.tipoFlota === "situacion" &&
    firebaseV.status === "activo" &&
    localV.status === "activo";

  if (
    !activeSituacionPair &&
    !hasActiveSituacionDesglose(firebaseV) &&
    !hasActiveSituacionDesglose(localV)
  ) {
    return merged;
  }
  return {
    ...merged,
    subTareas: mergeSubTareasById(firebaseV.subTareas, localV.subTareas),
    situacionCronometro: pickSituacionCronometro(
      firebaseV.situacionCronometro,
      localV.situacionCronometro
    ),
    situacionCupoAnchor: pickSituacionCupoAnchor(
      firebaseV.situacionCupoAnchor,
      localV.situacionCupoAnchor
    ),
  };
}

/** Fusiona estado de sesi�n local sobre snapshot Firebase (desglosador tiempo + situaci�n). */
function countSubsCerrados(subs: SubVehiculo[] | undefined): number {
  return (subs ?? []).filter(s => s.status === "cumplido" || s.status === "fallado").length;
}

function subVehiculoProgressScore(sub: SubVehiculo): number {
  if (sub.status === "pendiente") return 0;
  if (sub.status === "activo") return 10 + (sub.aperturaAt ?? 0) / 1e15;
  return 20 + (sub.cierreAt ?? 0) / 1e15;
}

/** Fusiona sub-vehículos por id (el desglosador es la maleta; cada sub avanza a su ritmo). */
export function mergeSubVehiculosById(
  firebaseSubs: SubVehiculo[] | undefined,
  localSubs: SubVehiculo[] | undefined
): SubVehiculo[] {
  const fb = firebaseSubs ?? [];
  const local = localSubs ?? [];
  if (local.length === 0) return fb;
  if (fb.length === 0) return local;

  const byId = new Map<string, SubVehiculo>();
  const order: string[] = [];

  for (const s of fb) {
    byId.set(s.id, s);
    order.push(s.id);
  }
  for (const s of local) {
    if (!byId.has(s.id)) {
      byId.set(s.id, s);
      order.push(s.id);
      continue;
    }
    const existing = byId.get(s.id)!;
    const pickLocal = subVehiculoProgressScore(s) >= subVehiculoProgressScore(existing);
    byId.set(s.id, pickLocal ? { ...existing, ...s } : existing);
  }
  return order.map(id => byId.get(id)!);
}

function activeSubId(subs: SubVehiculo[] | undefined): string | undefined {
  return subs?.find(s => s.status === "activo")?.id;
}

/** Conserva subs locales cuando Firebase pierde el array al cerrar el desglosador. */
export function shouldPreferLocalSubVehiculos(firebaseV: Vehicle, localV: Vehicle): boolean {
  if (firebaseV.tipoReloj !== "desglosador" || localV.tipoReloj !== "desglosador") return false;
  const localSubs = localV.subVehiculos ?? [];
  if (localSubs.length === 0) return false;
  const fbSubs = firebaseV.subVehiculos ?? [];
  if (fbSubs.length === 0) return true;
  if (localSubs.length > fbSubs.length) return true;
  if (countSubsCerrados(localSubs) > countSubsCerrados(fbSubs)) return true;
  if (activeSubId(localSubs) !== activeSubId(fbSubs)) return true;
  return false;
}

export function mergeActiveVehicleSessionState(firebaseV: Vehicle, localV: Vehicle | undefined): Vehicle {
  if (!localV) return firebaseV;

  const withLocalSubs = (base: Vehicle): Vehicle =>
    shouldPreferLocalSubVehiculos(base, localV)
      ? {
          ...base,
          subVehiculos: mergeSubVehiculosById(base.subVehiculos, localV.subVehiculos),
        }
      : base;

  if (localV.status !== "activo" && firebaseV.status === "activo") {
    return withLocalSubs({
      ...firebaseV,
      status: localV.status,
      ...(localV.cierreAt != null ? { cierreAt: localV.cierreAt } : {}),
      ...(localV.duracionFinal != null ? { duracionFinal: localV.duracionFinal } : {}),
      ...(localV.cierreManual != null ? { cierreManual: localV.cierreManual } : {}),
      ...(localV.intensidadEnergeticaFin ? { intensidadEnergeticaFin: localV.intensidadEnergeticaFin } : {}),
      ...(localV.etiquetaSalida ? { etiquetaSalida: localV.etiquetaSalida } : {}),
      ...(localV.notaSalida != null ? { notaSalida: localV.notaSalida } : {}),
      situacionCronometro: localV.situacionCronometro ?? null,
      situacionCupoAnchor: localV.situacionCupoAnchor ?? null,
    });
  }

  if (firebaseV.status !== "activo" || localV.status !== "activo") {
    return withLocalSubs(firebaseV);
  }

  let merged: Vehicle = { ...firebaseV };

  if (firebaseV.tipoReloj === "desglosador" && localV.subVehiculos && localV.subVehiculos.length > 0) {
    merged = {
      ...merged,
      subVehiculos: mergeSubVehiculosById(firebaseV.subVehiculos, localV.subVehiculos),
    };
  }
  if (localV.desglosadorBloqueDepthPsGranted != null) {
    merged = { ...merged, desglosadorBloqueDepthPsGranted: localV.desglosadorBloqueDepthPsGranted };
  }
  // Prefer local pause flags (including explicit clears after cerrar interrupción).
  if (firebaseV.tipoReloj === "desglosador" && localV.tipoReloj === "desglosador") {
    merged = {
      ...merged,
      interrupcionActiva: localV.interrupcionActiva === true,
      desglosadorPausa: localV.interrupcionActiva ? localV.desglosadorPausa : undefined,
    };
  }

  return applySituacionDesgloseMerge(merged, firebaseV, localV);
}

/**
 * Interrupción situacional lanzada desde un desglosador que ya no espera ese cierre.
 * Incluye: padre cerrado/archivado, padre sin pausa activa, o padre ausente del snapshot.
 */
export function isOrphanDesglosadorInterrupt(
  vehicle: Vehicle,
  vehiclesById: Map<string, Vehicle>
): boolean {
  if (vehicle.status !== "activo" || vehicle.autoVerdad) return false;
  const parentId = vehicle.vehiculoPadreDesglosadorId;
  if (!parentId) return false;
  const parent = vehiclesById.get(parentId);
  if (!parent) return true;
  if (parent.status !== "activo") return true;
  return !parent.interrupcionActiva;
}

/** Archiva interrupciones huérfanas en lugar de eliminarlas del listado (preserva historial). */
export function archiveOrphanDesglosadorInterrupts(
  vehicles: Vehicle[],
  nowMs: number = Date.now()
): Vehicle[] {
  const byId = new Map(vehicles.map(v => [v.id, v]));
  let changed = false;
  const next = vehicles.map(v => {
    if (!isOrphanDesglosadorInterrupt(v, byId)) return v;
    changed = true;
    const apertura = v.aperturaAt || v.createdAt?.getTime?.() || nowMs;
    return {
      ...v,
      status: "archivado" as const,
      cierreAt: v.cierreAt ?? nowMs,
      duracionFinal: v.duracionFinal ?? Math.max(1, Math.round((nowMs - apertura) / 60000)),
      cierreManual: false,
    };
  });
  return changed ? next : vehicles;
}

/** Desglosador activo en pausa sin vehículo de interrupción visible — libera la cola de subs. */
export function clearStuckDesglosadorPause(
  vehicles: Vehicle[],
  hasOpenInterrupt: (parentId: string) => boolean
): Vehicle[] {
  let changed = false;
  const next = vehicles.map(v => {
    if (
      v.tipoReloj !== "desglosador" ||
      v.status !== "activo" ||
      !v.interrupcionActiva ||
      hasOpenInterrupt(v.id)
    ) {
      return v;
    }
    changed = true;
    return { ...v, interrupcionActiva: false, desglosadorPausa: undefined };
  });
  return changed ? next : vehicles;
}
