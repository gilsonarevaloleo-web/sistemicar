import type { DetalleSubTarea, SubTarea, Vehicle } from "./persistence";

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
  const fbFin = fb.horaFinMs ?? 0;
  const localFin = local.horaFinMs ?? 0;
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
export function mergeActiveVehicleSessionState(firebaseV: Vehicle, localV: Vehicle | undefined): Vehicle {
  if (!localV) return firebaseV;

  if (localV.status !== "activo" && firebaseV.status === "activo") {
    return {
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
    };
  }

  if (firebaseV.status !== "activo" || localV.status !== "activo") {
    if (
      firebaseV.tipoReloj === "desglosador" &&
      localV.subVehiculos &&
      localV.subVehiculos.length > 0
    ) {
      const rutaRichness = (subs: typeof localV.subVehiculos) =>
        (subs ?? []).filter(
          s =>
            s.status === "cumplido" &&
            ((s.rutaDeclarada?.length ?? 0) > 0 ||
              s.rutaEnfoque?.cruzado?.concentrado ||
              s.rutaEnfoque?.cruzado?.limite)
        ).length;
      if (rutaRichness(localV.subVehiculos) > rutaRichness(firebaseV.subVehiculos)) {
        return { ...firebaseV, subVehiculos: localV.subVehiculos };
      }
    }
    return firebaseV;
  }

  let merged: Vehicle = { ...firebaseV };

  if (firebaseV.tipoReloj === "desglosador" && localV.subVehiculos && localV.subVehiculos.length > 0) {
    merged = { ...merged, subVehiculos: localV.subVehiculos };
  }
  if (localV.desglosadorBloqueDepthPsGranted != null) {
    merged = { ...merged, desglosadorBloqueDepthPsGranted: localV.desglosadorBloqueDepthPsGranted };
  }
  if (localV.desglosadorPausa) {
    merged = { ...merged, desglosadorPausa: localV.desglosadorPausa };
  }
  if (localV.interrupcionActiva) {
    merged = { ...merged, interrupcionActiva: localV.interrupcionActiva };
  }

  return applySituacionDesgloseMerge(merged, firebaseV, localV);
}
