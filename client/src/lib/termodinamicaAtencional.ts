import type { FocusBandEvent, FocusBandId } from "./focusBandLedger";
import type { SegmentoV5, SovereigntyPointsLog, SubVehiculo, Vehicle } from "./persistence";
import { computeRutaEnfoquePS } from "./rutaEnfoque";
import type { RutaBandaId } from "./rutaEnfoque";

export interface PsDesglose {
  panoramico: number;
  espectro: number;
  vehiculos: number;
  introspeccion: number;
  otros: number;
  total: number;
}

export interface EspectroBloques {
  fluido: number;
  concentrado: number;
  limite: number;
  descansosCuerpo: number;
}

export interface SegmentoSnapshotResumen {
  id: string;
  nombre: string;
  estado: SegmentoV5["estado"];
  psGanados: number;
}

export interface PlanillaDailySnapshot {
  id: string;
  fecha: string;
  timestamp: number;
  segmentos: SegmentoSnapshotResumen[];
  espectroBloques: EspectroBloques;
  profundidadMaxima: FocusBandId;
  psDesglose: PsDesglose;
  ratioConquista: number;
  segmentosCerradosManual: number;
  segmentosEntropia: number;
  segmentosTotales: number;
  bloquesCompletados: number;
}

const BANDA_RANK: Record<FocusBandId, number> = {
  fluido: 1,
  concentrado: 2,
  limite: 3,
};

const SNAPSHOT_LOCAL_KEY = "sistemicar_daily_snapshot";

export function maxBanda(a: FocusBandId, b: FocusBandId): FocusBandId {
  return BANDA_RANK[a] >= BANDA_RANK[b] ? a : b;
}

export function inferBandaBloque(sub: SubVehiculo): FocusBandId {
  const decl = sub.rutaDeclarada || [];
  if (decl.includes("limite")) return "limite";
  if (decl.includes("concentrado")) return "concentrado";
  if (sub.rutaEnfoque?.cruzado.limite) return "limite";
  if (sub.rutaEnfoque?.cruzado.concentrado) return "concentrado";
  return "fluido";
}

export function inferBandaVehiculo(v: Vehicle): FocusBandId | null {
  return (v.intensidadEnergeticaFin || v.intensidadEnergetica || null) as FocusBandId | null;
}

export function classifyPsSource(source: string): keyof Omit<PsDesglose, "total"> {
  const s = source.toLowerCase();
  if (
    s.includes("cierre consciente") ||
    s.includes("cierre fuera") ||
    s.includes("segmento") ||
    s.includes("puerta")
  ) {
    return "panoramico";
  }
  if (
    s.includes("ruta") ||
    s.includes("profundidad") ||
    s.includes("enfoque") ||
    s.includes("concentrado") ||
    s.includes("l�mite") ||
    s.includes("limite")
  ) {
    return "espectro";
  }
  if (s.includes("introspecci")) return "introspeccion";
  if (
    s.includes("veh�culo") ||
    s.includes("vehiculo") ||
    s.includes("desglosador") ||
    s.includes("ciclo") ||
    s.includes("misi�n") ||
    s.includes("mision")
  ) {
    return "vehiculos";
  }
  return "otros";
}

export function computePsDesglose(
  logs: SovereigntyPointsLog[],
  introspeccionPs: number = 0
): PsDesglose {
  const desglose: PsDesglose = {
    panoramico: 0,
    espectro: 0,
    vehiculos: 0,
    introspeccion: introspeccionPs,
    otros: 0,
    total: introspeccionPs,
  };

  for (const log of logs) {
    const key = classifyPsSource(log.source);
    if (key === "introspeccion") continue;
    desglose[key] += log.amount;
    desglose.total += log.amount;
  }

  return desglose;
}

export function computeEspectroBloques(
  vehicles: Vehicle[],
  dayStartMs: number
): EspectroBloques {
  const counts: EspectroBloques = {
    fluido: 0,
    concentrado: 0,
    limite: 0,
    descansosCuerpo: 0,
  };

  const inDay = (ts?: number) => (ts ?? 0) >= dayStartMs;

  for (const v of vehicles) {
    const cierre = v.cierreAt || v.updatedAt?.getTime?.() || 0;
    if (!inDay(cierre) && v.status !== "activo") continue;

    if (v.tipoFlota === "descanso" && (v.status === "cumplido" || v.status === "archivado")) {
      counts.descansosCuerpo++;
      continue;
    }

    if (v.tipoReloj === "desglosador") {
      for (const sub of v.subVehiculos || []) {
        if (sub.status !== "cumplido") continue;
        const banda = inferBandaBloque(sub);
        counts[banda]++;
      }
      continue;
    }

    if (v.status === "cumplido" || v.status === "archivado") {
      const banda = inferBandaVehiculo(v) || "fluido";
      counts[banda]++;
    }
  }

  return counts;
}

export function profundidadFromEspectro(espectro: EspectroBloques): FocusBandId {
  if (espectro.limite > 0) return "limite";
  if (espectro.concentrado > 0) return "concentrado";
  return "fluido";
}

export function profundidadFromEvents(events: FocusBandEvent[]): FocusBandId {
  let max: FocusBandId = "fluido";
  for (const e of events) {
    if (e.source === "descanso_cuerpo") continue;
    max = maxBanda(max, e.banda);
  }
  return max;
}

export function buildDailySnapshot(params: {
  fecha: string;
  segmentos: SegmentoV5[];
  vehicles: Vehicle[];
  dayStartMs: number;
  logs: SovereigntyPointsLog[];
  introspeccionPs?: number;
  events?: FocusBandEvent[];
  conquistaMin?: number;
  entropiaMin?: number;
  vacioMin?: number;
}): PlanillaDailySnapshot {
  const {
    fecha,
    segmentos,
    vehicles,
    dayStartMs,
    logs,
    introspeccionPs = 0,
    events = [],
    conquistaMin = 0,
    entropiaMin = 0,
    vacioMin = 0,
  } = params;

  const espectroBloques = computeEspectroBloques(vehicles, dayStartMs);
  const profundidadMaxima = maxBanda(
    profundidadFromEvents(events),
    profundidadFromEspectro(espectroBloques)
  );

  const cerradosManual = segmentos.filter(s => s.estado === "cerrado_manual").length;
  const entropiaSeg = segmentos.filter(s => s.estado === "entropia").length;
  const totalSeg = segmentos.length;

  const jornadaMin = conquistaMin + entropiaMin + vacioMin;
  const ratioConquista =
    jornadaMin > 0 ? conquistaMin / jornadaMin : cerradosManual / Math.max(totalSeg, 1);

  const bloquesCompletados =
    espectroBloques.fluido + espectroBloques.concentrado + espectroBloques.limite;

  return {
    id: `snap_${fecha}_${Date.now()}`,
    fecha,
    timestamp: Date.now(),
    segmentos: segmentos.map(s => ({
      id: s.id,
      nombre: s.nombre,
      estado: s.estado,
      psGanados: s.psGanados || 0,
    })),
    espectroBloques,
    profundidadMaxima,
    psDesglose: computePsDesglose(logs, introspeccionPs),
    ratioConquista: Math.round(ratioConquista * 100) / 100,
    segmentosCerradosManual: cerradosManual,
    segmentosEntropia: entropiaSeg,
    segmentosTotales: totalSeg,
    bloquesCompletados,
  };
}

export type TermodinamicaCompareRow = {
  key: string;
  label: string;
  today: number;
  yesterday: number;
  delta: number;
  betterWhenHigher: boolean;
};

export type TermodinamicaCompareModel = {
  hasYesterday: boolean;
  rows: TermodinamicaCompareRow[];
  profundidadHoy: FocusBandId;
  profundidadAyer: FocusBandId | null;
  headline: string;
  motivacion: string;
};

const PROFUNDIDAD_LABEL: Record<FocusBandId, string> = {
  fluido: "Fluido",
  concentrado: "Concentrado",
  limite: "Al l�mite",
};

function compareRow(
  key: string,
  label: string,
  today: number,
  yesterday: number,
  betterWhenHigher = true
): TermodinamicaCompareRow {
  return { key, label, today, yesterday, delta: today - yesterday, betterWhenHigher };
}

/** Comparativa en vivo: hoy (parcial) vs snapshot de ayer sellado. */
export function computeTermodinamicaCompare(
  yesterday: PlanillaDailySnapshot | null,
  today: PlanillaDailySnapshot
): TermodinamicaCompareModel {
  const yEsp = yesterday?.espectroBloques;
  const tEsp = today.espectroBloques;

  const rows: TermodinamicaCompareRow[] = [
    compareRow("limite", "Bloques al l�mite", tEsp.limite, yEsp?.limite ?? 0),
    compareRow("concentrado", "Bloques concentrados", tEsp.concentrado, yEsp?.concentrado ?? 0),
    compareRow("bloques", "Bloques completados", today.bloquesCompletados, yesterday?.bloquesCompletados ?? 0),
    compareRow(
      "segmentos",
      "Segmentos cierre manual",
      today.segmentosCerradosManual,
      yesterday?.segmentosCerradosManual ?? 0
    ),
    compareRow(
      "descansos",
      "Descansos cuerpo",
      tEsp.descansosCuerpo,
      yEsp?.descansosCuerpo ?? 0,
      false
    ),
  ];

  const profundidadHoy = today.profundidadMaxima;
  const profundidadAyer = yesterday?.profundidadMaxima ?? null;
  const rankHoy = BANDA_RANK[profundidadHoy];
  const rankAyer = profundidadAyer ? BANDA_RANK[profundidadAyer] : 0;

  const wins = rows.filter(r => r.betterWhenHigher && r.delta > 0).length;
  const hasYesterday = yesterday != null;

  let headline: string;
  if (!hasYesterday) {
    headline = `Hoy: ${PROFUNDIDAD_LABEL[profundidadHoy]} � ${today.bloquesCompletados} bloque${today.bloquesCompletados !== 1 ? "s" : ""}`;
  } else if (rankHoy > rankAyer) {
    headline = `Profundidad superior a ayer (${PROFUNDIDAD_LABEL[profundidadHoy]})`;
  } else if (wins >= 2) {
    headline = `Vas por encima de ayer en ${wins} medidas clave`;
  } else if (wins === 1) {
    const win = rows.find(r => r.betterWhenHigher && r.delta > 0);
    headline = win ? `+${win.delta} ${win.label.toLowerCase()} vs ayer` : "En carrera con ayer";
  } else if (today.bloquesCompletados === yesterday!.bloquesCompletados && rankHoy === rankAyer) {
    headline = "Mismo ritmo estructural que ayer";
  } else {
    headline = "Ayer fue m�s intenso � el cuerpo tambi�n cuenta";
  }

  let motivacion: string;
  if (!hasYesterday) {
    motivacion = "Sella la jornada hoy para que ma�ana tengas referencia.";
  } else if (rankHoy >= rankAyer && today.segmentosCerradosManual >= (yesterday?.segmentosCerradosManual ?? 0)) {
    motivacion = "Tu cartograf�a panor�mica y tu espectro van al comp�s.";
  } else if (tEsp.descansosCuerpo > (yEsp?.descansosCuerpo ?? 0)) {
    motivacion = "Escuchaste al cuerpo � eso tambi�n es soberan�a.";
  } else if (wins > 0) {
    motivacion = "Compites contigo de ayer, bloque a bloque. Sigue.";
  } else {
    motivacion = "Un d�a m�s ligero no borra el progreso. Ma�ana otra puerta.";
  }

  return {
    hasYesterday,
    rows,
    profundidadHoy,
    profundidadAyer,
    headline,
    motivacion,
  };
}

export interface CartografiaDia {
  fecha: string;
  label: string;
  ratioConquista: number;
  cerradosManual: number;
  entropia: number;
  psPanoramico: number;
}

export interface EspectroDia {
  fecha: string;
  label: string;
  fluido: number;
  concentrado: number;
  limite: number;
  descansos: number;
  profundidadMaxima: FocusBandId;
}

export function aggregateCartografiaSemanal(
  snapshots: PlanillaDailySnapshot[]
): CartografiaDia[] {
  return snapshots.map(s => ({
    fecha: s.fecha,
    label: s.fecha.slice(5),
    ratioConquista: Math.round(s.ratioConquista * 100),
    cerradosManual: s.segmentosCerradosManual,
    entropia: s.segmentosEntropia,
    psPanoramico: s.psDesglose.panoramico + s.psDesglose.introspeccion,
  }));
}

export function aggregateEspectroSemanal(snapshots: PlanillaDailySnapshot[]): EspectroDia[] {
  return snapshots.map(s => ({
    fecha: s.fecha,
    label: s.fecha.slice(5),
    fluido: s.espectroBloques.fluido,
    concentrado: s.espectroBloques.concentrado,
    limite: s.espectroBloques.limite,
    descansos: s.espectroBloques.descansosCuerpo,
    profundidadMaxima: s.profundidadMaxima,
  }));
}

export function psEspectroBloque(sub: SubVehiculo): number {
  if (!sub.rutaEnfoque?.activa || !sub.rutaDeclarada?.length) return 0;
  return computeRutaEnfoquePS(sub.rutaDeclarada as RutaBandaId[], sub.rutaEnfoque.cruzado);
}

function getLocalSnapshots(userId: string): PlanillaDailySnapshot[] {
  try {
    const raw = localStorage.getItem(`${SNAPSHOT_LOCAL_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as PlanillaDailySnapshot[];
  } catch {
    return [];
  }
}

function saveLocalSnapshots(userId: string, snapshots: PlanillaDailySnapshot[]): void {
  localStorage.setItem(`${SNAPSHOT_LOCAL_KEY}_${userId}`, JSON.stringify(snapshots.slice(-60)));
}

export async function savePlanillaDailySnapshot(
  userId: string,
  snapshot: PlanillaDailySnapshot
): Promise<void> {
  const locals = getLocalSnapshots(userId).filter(s => s.fecha !== snapshot.fecha);
  locals.push(snapshot);
  locals.sort((a, b) => a.fecha.localeCompare(b.fecha));
  saveLocalSnapshots(userId, locals);

  const { db, getPrivatePath, isFirebaseConfigured } = await import("./firebase");
  if (isFirebaseConfigured() && db) {
    try {
      const { addDoc, collection, getDocs, query, where, deleteDoc } = await import("firebase/firestore");
      const path = getPrivatePath(userId, "dailySnapshots");
      const q = query(collection(db, path), where("fecha", "==", snapshot.fecha));
      const existing = await getDocs(q);
      for (const docSnap of existing.docs) {
        await deleteDoc(docSnap.ref);
      }
      await addDoc(collection(db, path), snapshot);
    } catch {
      // local saved
    }
  }
}

export async function getPlanillaDailySnapshots(
  userId: string,
  days: number
): Promise<PlanillaDailySnapshot[]> {
  const { getLimaDateString } = await import("./persistence");
  const end = getLimaDateString();
  const startMs = Date.now() - (days - 1) * 24 * 60 * 60 * 1000;
  const start = getLimaDateString(startMs);
  const inRange = (f: string) => f >= start && f <= end;

  const byFecha = new Map<string, PlanillaDailySnapshot>();
  for (const s of getLocalSnapshots(userId)) {
    if (inRange(s.fecha)) byFecha.set(s.fecha, s);
  }

  const { db, getPrivatePath, isFirebaseConfigured } = await import("./firebase");
  if (isFirebaseConfigured() && db) {
    try {
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      const path = getPrivatePath(userId, "dailySnapshots");
      const q = query(
        collection(db, path),
        where("fecha", ">=", start),
        where("fecha", "<=", end)
      );
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const s = docSnap.data() as PlanillaDailySnapshot;
        if (!byFecha.has(s.fecha)) byFecha.set(s.fecha, { ...s, id: s.id || docSnap.id });
      }
    } catch {
      // local only
    }
  }

  return Array.from(byFecha.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export async function getPlanillaDailySnapshotForDate(
  userId: string,
  fecha: string
): Promise<PlanillaDailySnapshot | null> {
  const snaps = await getPlanillaDailySnapshots(userId, 21);
  return snaps.find(s => s.fecha === fecha) ?? null;
}
