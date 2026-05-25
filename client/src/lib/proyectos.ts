import type { FocusBandId } from "./focusBandLedger";
import type { SubTarea, SubVehiculo, Vehicle } from "./persistence";
import { maxBanda, inferBandaBloque } from "./termodinamicaAtencional";
import type { RutaCruzadaSnapshot } from "./rutaEnfoque";

export type ProyectoEtiqueta = "proyecto" | "centro";
export type PeldanoEstado = "idea" | "en_curso" | "conquistado";

export interface ProyectoPeldanoResumen {
  subsCumplidos?: number;
  subsTotal?: number;
  duracionMin?: number;
  profundidadMaxima?: FocusBandId;
  psGanados?: number;
  subResumen?: {
    titulo: string;
    status: "cumplido" | "fallado" | "pendiente";
    duracionMin?: number;
  }[];
  subTareasResumen?: { texto: string; resultado?: string }[];
}

export interface ProyectoPeldano {
  id: string;
  proyectoId: string;
  orden: number;
  titulo: string;
  estado: PeldanoEstado;
  tipoOrigen?: "tiempo" | "situacion";
  plantillaSubs?: { titulo: string; cantidadObjetivo?: number }[];
  plantillaSubTareas?: string[];
  vehicleId?: string;
  cerradoAt?: number;
  resumen?: ProyectoPeldanoResumen;
  createdAt: number;
  updatedAt: number;
}

export interface Proyecto {
  id: string;
  titulo: string;
  etiqueta: ProyectoEtiqueta;
  color?: string;
  icono?: string;
  nota?: string;
  createdAt: number;
  updatedAt: number;
  peldanosConquistados: number;
  profundidadMaxima?: FocusBandId;
  minutosTotales?: number;
}

const PROYECTOS_KEY = "sistemicar_proyectos";
const PELDANOS_KEY = "sistemicar_proyecto_peldanos";

function getLocalProyectos(userId: string): Proyecto[] {
  try {
    const raw = localStorage.getItem(`${PROYECTOS_KEY}_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Proyecto[];
    return parsed.map(p => {
      const legacy = p as Record<string, unknown>;
      const legacyCount = legacy["pelda\u00f1osConquistados"];
      return {
        ...p,
        peldanosConquistados:
          p.peldanosConquistados ??
          (typeof legacyCount === "number" ? legacyCount : 0),
      };
    });
  } catch {
    return [];
  }
}

function saveLocalProyectos(userId: string, list: Proyecto[]): void {
  localStorage.setItem(`${PROYECTOS_KEY}_${userId}`, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("proyectos-updated"));
}

function getLocalPeldanos(userId: string): ProyectoPeldano[] {
  try {
    const raw = localStorage.getItem(`${PELDANOS_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as ProyectoPeldano[];
  } catch {
    return [];
  }
}

function saveLocalPeldanos(userId: string, list: ProyectoPeldano[]): void {
  localStorage.setItem(`${PELDANOS_KEY}_${userId}`, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("proyectos-updated"));
}

async function syncFirestoreProyecto(userId: string, proyecto: Proyecto, isDelete = false): Promise<void> {
  const { db, getPrivatePath, isFirebaseConfigured } = await import("./firebase");
  if (!isFirebaseConfigured() || !db) return;
  try {
    const { collection, doc, setDoc, deleteDoc } = await import("firebase/firestore");
    const path = getPrivatePath(userId, "proyectos");
    const ref = doc(collection(db, path), proyecto.id);
    if (isDelete) await deleteDoc(ref);
    else await setDoc(ref, proyecto, { merge: true });
  } catch {
    // local ok
  }
}

async function syncFirestorePeldano(userId: string, peldano: ProyectoPeldano, isDelete = false): Promise<void> {
  const { db, getPrivatePath, isFirebaseConfigured } = await import("./firebase");
  if (!isFirebaseConfigured() || !db) return;
  try {
    const { collection, doc, setDoc, deleteDoc } = await import("firebase/firestore");
    const path = getPrivatePath(userId, "proyecto_peldanos");
    const ref = doc(collection(db, path), peldano.id);
    if (isDelete) await deleteDoc(ref);
    else await setDoc(ref, peldano, { merge: true });
  } catch {
    // local ok
  }
}

async function loadProyectosFromFirestore(userId: string): Promise<Proyecto[]> {
  const { db, getPrivatePath, isFirebaseConfigured } = await import("./firebase");
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const path = getPrivatePath(userId, "proyectos");
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => {
      const data = d.data() as Proyecto & Record<string, unknown>;
      const legacyCount = data["pelda\u00f1osConquistados"];
      return {
        id: d.id,
        ...data,
        peldanosConquistados:
          (data as Proyecto).peldanosConquistados ??
          (typeof legacyCount === "number" ? legacyCount : 0),
      };
    });
  } catch {
    return [];
  }
}

async function loadPeldanosFromFirestore(userId: string): Promise<ProyectoPeldano[]> {
  const { db, getPrivatePath, isFirebaseConfigured } = await import("./firebase");
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const path = getPrivatePath(userId, "proyecto_peldanos");
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProyectoPeldano));
  } catch {
    return [];
  }
}

export async function getProyectos(userId: string): Promise<Proyecto[]> {
  const byId = new Map<string, Proyecto>();
  for (const p of getLocalProyectos(userId)) byId.set(p.id, p);
  for (const p of await loadProyectosFromFirestore(userId)) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProyectoById(userId: string, id: string): Promise<Proyecto | null> {
  const all = await getProyectos(userId);
  return all.find(p => p.id === id) ?? null;
}

export async function addProyecto(
  userId: string,
  data: Omit<Proyecto, "id" | "createdAt" | "updatedAt" | "peldanosConquistados" | "minutosTotales">
): Promise<Proyecto> {
  const now = Date.now();
  const proyecto: Proyecto = {
    id: `proy_${now}_${Math.random().toString(36).slice(2, 6)}`,
    ...data,
    peldanosConquistados: 0,
    minutosTotales: 0,
    createdAt: now,
    updatedAt: now,
  };
  const list = getLocalProyectos(userId);
  list.unshift(proyecto);
  saveLocalProyectos(userId, list);
  void syncFirestoreProyecto(userId, proyecto);
  return proyecto;
}

export async function updateProyecto(
  userId: string,
  id: string,
  patch: Partial<Omit<Proyecto, "id" | "createdAt">>
): Promise<Proyecto | null> {
  const list = getLocalProyectos(userId);
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated: Proyecto = { ...list[idx], ...patch, updatedAt: Date.now() };
  list[idx] = updated;
  saveLocalProyectos(userId, list);
  void syncFirestoreProyecto(userId, updated);
  return updated;
}

export async function deleteProyecto(userId: string, id: string): Promise<void> {
  const prev = getLocalProyectos(userId);
  const removed = prev.find(p => p.id === id);
  saveLocalProyectos(userId, prev.filter(p => p.id !== id));
  const pelToRemove = getLocalPeldanos(userId).filter(p => p.proyectoId === id);
  saveLocalPeldanos(userId, getLocalPeldanos(userId).filter(p => p.proyectoId !== id));
  if (removed) void syncFirestoreProyecto(userId, removed, true);
  for (const pel of pelToRemove) void syncFirestorePeldano(userId, pel, true);
}

export async function getPeldanosByProyecto(userId: string, proyectoId: string): Promise<ProyectoPeldano[]> {
  const byId = new Map<string, ProyectoPeldano>();
  for (const p of getLocalPeldanos(userId).filter(x => x.proyectoId === proyectoId)) {
    byId.set(p.id, p);
  }
  for (const p of (await loadPeldanosFromFirestore(userId)).filter(x => x.proyectoId === proyectoId)) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return Array.from(byId.values()).sort((a, b) => a.orden - b.orden);
}

export async function addPeldanoIdea(
  userId: string,
  proyectoId: string,
  titulo: string,
  opts?: {
    plantillaSubs?: ProyectoPeldano["plantillaSubs"];
    plantillaSubTareas?: string[];
  }
): Promise<ProyectoPeldano> {
  const existing = await getPeldanosByProyecto(userId, proyectoId);
  const maxOrden = existing.reduce((m, p) => Math.max(m, p.orden), -1);
  const now = Date.now();
  const peldano: ProyectoPeldano = {
    id: `pel_${now}_${Math.random().toString(36).slice(2, 6)}`,
    proyectoId,
    orden: maxOrden + 1,
    titulo: titulo.trim(),
    estado: "idea",
    plantillaSubs: opts?.plantillaSubs,
    plantillaSubTareas: opts?.plantillaSubTareas,
    createdAt: now,
    updatedAt: now,
  };
  const all = getLocalPeldanos(userId);
  all.push(peldano);
  saveLocalPeldanos(userId, all);
  void syncFirestorePeldano(userId, peldano);
  await updateProyecto(userId, proyectoId, {});
  return peldano;
}

export async function updatePeldano(
  userId: string,
  id: string,
  patch: Partial<Omit<ProyectoPeldano, "id" | "proyectoId" | "createdAt">>
): Promise<ProyectoPeldano | null> {
  const all = getLocalPeldanos(userId);
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated: ProyectoPeldano = { ...all[idx], ...patch, updatedAt: Date.now() };
  all[idx] = updated;
  saveLocalPeldanos(userId, all);
  void syncFirestorePeldano(userId, updated);
  return updated;
}

export async function reorderPeldano(
  userId: string,
  proyectoId: string,
  peldanoId: string,
  direction: "up" | "down"
): Promise<void> {
  const ideas = (await getPeldanosByProyecto(userId, proyectoId)).filter(p => p.estado === "idea");
  const idx = ideas.findIndex(p => p.id === peldanoId);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ideas.length) return;
  const a = ideas[idx];
  const b = ideas[swapIdx];
  await updatePeldano(userId, a.id, { orden: b.orden });
  await updatePeldano(userId, b.id, { orden: a.orden });
}

export async function deletePeldanoIdea(userId: string, id: string): Promise<void> {
  const all = getLocalPeldanos(userId);
  const pel = all.find(p => p.id === id);
  if (!pel || pel.estado !== "idea") return;
  saveLocalPeldanos(userId, all.filter(p => p.id !== id));
  void syncFirestorePeldano(userId, pel, true);
}

export async function markPeldanoEnCurso(
  userId: string,
  peldanoId: string,
  vehicleId: string,
  tipoOrigen: "tiempo" | "situacion"
): Promise<void> {
  await updatePeldano(userId, peldanoId, {
    estado: "en_curso",
    vehicleId,
    tipoOrigen,
  });
}

function profundidadFromSubs(subs: SubVehiculo[], rutaCruzada?: RutaCruzadaSnapshot | null): FocusBandId {
  let max: FocusBandId = "fluido";
  for (const s of subs) {
    if (s.status === "cumplido") max = maxBanda(max, inferBandaBloque(s));
  }
  if (rutaCruzada?.limite) return maxBanda(max, "limite");
  if (rutaCruzada?.concentrado) return maxBanda(max, "concentrado");
  return max;
}

async function refreshProyectoStats(userId: string, proyectoId: string): Promise<void> {
  const conquistados = (await getPeldanosByProyecto(userId, proyectoId)).filter(p => p.estado === "conquistado");
  let profundidad: FocusBandId = "fluido";
  let minutos = 0;
  for (const p of conquistados) {
    if (p.resumen?.profundidadMaxima) profundidad = maxBanda(profundidad, p.resumen.profundidadMaxima);
    minutos += p.resumen?.duracionMin ?? 0;
  }
  await updateProyecto(userId, proyectoId, {
    peldanosConquistados: conquistados.length,
    profundidadMaxima: profundidad,
    minutosTotales: minutos,
  });
}

export async function markPeldanoConquistadoTiempo(
  userId: string,
  vehicle: Vehicle,
  subs: SubVehiculo[],
  psGanados: number
): Promise<void> {
  if (!vehicle.proyectoId || !vehicle.proyectoPeldanoId) return;
  const cumplidos = subs.filter(s => s.status === "cumplido").length;
  const duracionMin = vehicle.duracionFinal ?? 0;
  const profundidadMaxima = profundidadFromSubs(subs, vehicle.rutaCruzada);
  const subResumen = subs
    .filter(s => s.status === "cumplido" || s.status === "fallado")
    .map(sv => ({
      titulo: sv.titulo,
      status: sv.status as "cumplido" | "fallado",
      duracionMin: sv.duracionFinal != null ? Math.round(sv.duracionFinal / 60) : undefined,
    }));

  await updatePeldano(userId, vehicle.proyectoPeldanoId, {
    estado: "conquistado",
    tipoOrigen: "tiempo",
    cerradoAt: Date.now(),
    vehicleId: vehicle.id,
    resumen: {
      subsCumplidos: cumplidos,
      subsTotal: subs.length,
      duracionMin,
      profundidadMaxima,
      psGanados,
      subResumen,
    },
  });
  await refreshProyectoStats(userId, vehicle.proyectoId);
}

export async function markPeldanoConquistadoSituacion(
  userId: string,
  vehicle: Vehicle,
  opts: { duracionMin: number; psGanados: number; subTareas: SubTarea[] }
): Promise<void> {
  if (!vehicle.proyectoId || !vehicle.proyectoPeldanoId) return;
  const cumplidas = opts.subTareas.filter(st => st.resultadoSituacion === "cumplido").length;
  const subTareasResumen = opts.subTareas
    .filter(st => st.enDesgloseCronometro)
    .map(st => ({ texto: st.texto, resultado: st.resultadoSituacion }));

  await updatePeldano(userId, vehicle.proyectoPeldanoId, {
    estado: "conquistado",
    tipoOrigen: "situacion",
    cerradoAt: Date.now(),
    vehicleId: vehicle.id,
    resumen: {
      subsCumplidos: cumplidas,
      subsTotal: subTareasResumen.length,
      duracionMin: opts.duracionMin,
      profundidadMaxima: "concentrado",
      psGanados: opts.psGanados,
      subTareasResumen,
    },
  });
  await refreshProyectoStats(userId, vehicle.proyectoId);
}

export function computeProyectoStats(peldanos: ProyectoPeldano[]) {
  const conquistados = peldanos.filter(p => p.estado === "conquistado");
  const ideas = peldanos.filter(p => p.estado === "idea");
  let minutos = 0;
  let profundidad: FocusBandId = "fluido";
  for (const p of conquistados) {
    minutos += p.resumen?.duracionMin ?? 0;
    if (p.resumen?.profundidadMaxima) profundidad = maxBanda(profundidad, p.resumen.profundidadMaxima);
  }
  return {
    conquistados: conquistados.length,
    ideas: ideas.length,
    minutosTotales: minutos,
    profundidadMaxima: profundidad,
    ultimoConquistado: [...conquistados].sort((a, b) => (b.cerradoAt ?? 0) - (a.cerradoAt ?? 0))[0] ?? null,
  };
}

export function subscribeToProyectos(userId: string, onData: () => void): () => void {
  const handler = () => onData();
  window.addEventListener("proyectos-updated", handler);
  return () => window.removeEventListener("proyectos-updated", handler);
}

export function buildLaunchUrl(
  proyectoId: string,
  peldanoId: string,
  launch: "desglosador_tiempo" | "desglosador_situacion"
): string {
  const q = new URLSearchParams({ proyectoId, peldanoId, launch });
  return `/planeacion?${q.toString()}`;
}
