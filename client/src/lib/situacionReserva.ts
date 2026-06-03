import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, getPrivatePath, isFirebaseConfigured } from "./firebase";
import { activateSovereignModeGlobal, deactivateSovereignModeGlobal, backupToLocal, restoreFromLocal } from "./sovereign-mode";
import type { DetalleSubTarea } from "./persistence";

export type SituacionReservaEstado = "activa" | "retomada_libre" | "retomada_cron";

/** Ruta táctica: S = desglosador situación · E = ejecución · M = tener en cuenta */
export type ReservaTacticaRuta = "situacion_desglosador" | "ejecucion" | "consideracion";

export const RUTA_TACTICA_ORDER: ReservaTacticaRuta[] = [
  "situacion_desglosador",
  "ejecucion",
  "consideracion",
];

export const RUTA_TACTICA_META: Record<
  ReservaTacticaRuta,
  { label: string; short: string; hint: string }
> = {
  situacion_desglosador: {
    label: "Desglosador situación",
    short: "S",
    hint: "Viene del cronómetro situacional",
  },
  ejecucion: {
    label: "Peso de ejecución",
    short: "E",
    hint: "Trabajo real pendiente (captura rápida)",
  },
  consideracion: {
    label: "Tener en cuenta",
    short: "M",
    hint: "Idea o recordatorio sin ejecutar ahora",
  },
};

export interface SituacionReservaItem {
  id: string;
  userId: string;
  texto: string;
  reservadaAt: number;
  ruta?: ReservaTacticaRuta;
  origenVehiculoTitulo?: string;
  origenVehiculoId?: string;
  minutosCupo?: number;
  detalles?: DetalleSubTarea[];
  estado: SituacionReservaEstado;
  retomadaAt?: number;
  retomadaEnVehiculoId?: string;
}

const RUTA_STORAGE_KEY = "sistemicar-reserva-ruta-default";

export function getDefaultReservaRuta(): ReservaTacticaRuta {
  try {
    const raw = localStorage.getItem(RUTA_STORAGE_KEY);
    if (raw === "situacion_desglosador" || raw === "ejecucion" || raw === "consideracion") return raw;
  } catch {}
  return "ejecucion";
}

export function setDefaultReservaRuta(ruta: ReservaTacticaRuta): void {
  try {
    localStorage.setItem(RUTA_STORAGE_KEY, ruta);
  } catch {}
}

function inferRutaFromRow(row: {
  ruta?: unknown;
  origenVehiculoId?: string;
  detalles?: DetalleSubTarea[];
}): ReservaTacticaRuta {
  if (row.ruta === "situacion_desglosador" || row.ruta === "ejecucion" || row.ruta === "consideracion") {
    return row.ruta;
  }
  if (row.origenVehiculoId || (row.detalles && row.detalles.length > 0)) {
    return "situacion_desglosador";
  }
  return "ejecucion";
}

export function sortReservasTacticas(items: SituacionReservaItem[]): SituacionReservaItem[] {
  const rank = (r: ReservaTacticaRuta) => RUTA_TACTICA_ORDER.indexOf(r);
  return [...items].sort((a, b) => {
    const ra = rank(a.ruta ?? "ejecucion");
    const rb = rank(b.ruta ?? "ejecucion");
    if (ra !== rb) return ra - rb;
    return b.reservadaAt - a.reservadaAt;
  });
}

const STORAGE_KEY = "sistemicar_situacion_reserva";
export const SITUACION_RESERVA_EVENT = "sistemicar-situacion-reserva-changed";

function normalizeItem(raw: SituacionReservaItem): SituacionReservaItem {
  const base = {
    ...raw,
    reservadaAt: raw.reservadaAt ?? Date.now(),
    estado: raw.estado ?? "activa",
  };
  return { ...base, ruta: inferRutaFromRow(base) };
}

function getAllLocalReserva(): SituacionReservaItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return (JSON.parse(data) as SituacionReservaItem[]).map(normalizeItem);
  } catch {
    return [];
  }
}

function saveAllLocalReserva(items: SituacionReservaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    const isQuota =
      err &&
      typeof err === "object" &&
      ((err as { name?: string }).name === "QuotaExceededError" ||
        (err as { code?: number }).code === 22);
    if (isQuota) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
    } else {
      throw err;
    }
  }
  window.dispatchEvent(new CustomEvent(SITUACION_RESERVA_EVENT));
}

/** Conserva reservas locales aún no reflejadas en Firebase (evita que onSnapshot las borre). */
function mergeReservaRemoteWithLocalPending(
  userId: string,
  remote: SituacionReservaItem[]
): SituacionReservaItem[] {
  const remoteIds = new Set(remote.map(r => r.id));
  const now = Date.now();
  const pendingMs = 5 * 60 * 1000;
  const localPending = getLocalSituacionReserva(userId).filter(
    i =>
      i.estado === "activa" &&
      !remoteIds.has(i.id) &&
      (i.id.startsWith("reserva_") || now - (i.reservadaAt ?? 0) < pendingMs)
  );
  return sortReservasTacticas([...remote, ...localPending]);
}

function buildFirestoreReservaPayload(
  userId: string,
  payload: {
    texto: string;
    reservadaAt: number;
    ruta: ReservaTacticaRuta;
    origenVehiculoTitulo?: string | null;
    origenVehiculoId?: string | null;
    minutosCupo?: number | null;
    detalles?: DetalleSubTarea[] | null;
    estado: string;
  }
): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    texto: payload.texto,
    reservadaAt: payload.reservadaAt,
    ruta: payload.ruta,
    userId,
    estado: payload.estado,
    createdAt: serverTimestamp(),
  };
  if (payload.origenVehiculoTitulo) doc.origenVehiculoTitulo = payload.origenVehiculoTitulo;
  if (payload.origenVehiculoId) doc.origenVehiculoId = payload.origenVehiculoId;
  if (payload.minutosCupo != null && payload.minutosCupo > 0) doc.minutosCupo = payload.minutosCupo;
  if (payload.detalles?.length) doc.detalles = payload.detalles;
  return doc;
}

export function getLocalSituacionReserva(userId: string): SituacionReservaItem[] {
  return getAllLocalReserva()
    .filter(i => i.userId === userId)
    .sort((a, b) => b.reservadaAt - a.reservadaAt);
}

export function getReservaActivas(items: SituacionReservaItem[]): SituacionReservaItem[] {
  return sortReservasTacticas(items.filter(i => i.estado === "activa"));
}

export function subscribeToSituacionReserva(
  userId: string,
  onData: (items: SituacionReservaItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "situacionReserva");
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(d => {
          const row = d.data();
          return normalizeItem({
            id: d.id,
            userId,
            texto: row.texto ?? "",
            reservadaAt: row.reservadaAt ?? row.createdAt?.toDate?.()?.getTime?.() ?? Date.now(),
            origenVehiculoTitulo: row.origenVehiculoTitulo,
            origenVehiculoId: row.origenVehiculoId,
            minutosCupo: row.minutosCupo,
            detalles: row.detalles,
            ruta: inferRutaFromRow(row),
            estado: row.estado ?? "activa",
            retomadaAt: row.retomadaAt,
            retomadaEnVehiculoId: row.retomadaEnVehiculoId,
          });
        });
        const merged = mergeReservaRemoteWithLocalPending(userId, data);
        deactivateSovereignModeGlobal();
        const others = getAllLocalReserva().filter(i => i.userId !== userId);
        saveAllLocalReserva([...others, ...merged]);
        backupToLocal("situacionReserva", merged);
        onData(merged);
      },
      error => {
        console.error("Firebase SituacionReserva Error:", error);
        activateSovereignModeGlobal("Usando reserva situacional local");
        const local =
          restoreFromLocal<SituacionReservaItem[]>("situacionReserva") ||
          getLocalSituacionReserva(userId);
        onData(local);
        onError?.(error);
      }
    );
  }

  onData(getLocalSituacionReserva(userId));
  const handler = () => onData(getLocalSituacionReserva(userId));
  window.addEventListener(SITUACION_RESERVA_EVENT, handler);
  return () => window.removeEventListener(SITUACION_RESERVA_EVENT, handler);
}

export type NuevaSituacionReserva = Omit<SituacionReservaItem, "id" | "userId" | "reservadaAt" | "estado"> & {
  estado?: SituacionReservaEstado;
};

export async function addSituacionReserva(userId: string, item: NuevaSituacionReserva): Promise<string> {
  const ruta = item.ruta ?? inferRutaFromRow(item);
  const reservadaAt = Date.now();
  const estado = (item.estado ?? "activa") as SituacionReservaEstado;
  const tempId = `reserva_${reservadaAt}_${Math.random().toString(36).slice(2, 6)}`;

  const created: SituacionReservaItem = {
    id: tempId,
    userId,
    texto: item.texto.trim(),
    reservadaAt,
    ruta,
    estado,
    ...(item.origenVehiculoTitulo ? { origenVehiculoTitulo: item.origenVehiculoTitulo } : {}),
    ...(item.origenVehiculoId ? { origenVehiculoId: item.origenVehiculoId } : {}),
    ...(item.minutosCupo != null && item.minutosCupo > 0 ? { minutosCupo: item.minutosCupo } : {}),
    ...(item.detalles?.length ? { detalles: item.detalles } : {}),
  };

  const withoutDup = getAllLocalReserva().filter(i => i.id !== tempId);
  saveAllLocalReserva([created, ...withoutDup]);

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "situacionReserva");
      const docRef = await addDoc(
        collection(db, path),
        buildFirestoreReservaPayload(userId, {
          texto: created.texto,
          reservadaAt,
          ruta,
          origenVehiculoTitulo: item.origenVehiculoTitulo ?? null,
          origenVehiculoId: item.origenVehiculoId ?? null,
          minutosCupo: item.minutosCupo ?? null,
          detalles: item.detalles ?? null,
          estado,
        })
      );
      const withFirebaseId = getAllLocalReserva().map(i =>
        i.id === tempId && i.userId === userId ? { ...i, id: docRef.id } : i
      );
      saveAllLocalReserva(withFirebaseId);
      return docRef.id;
    } catch (error) {
      console.error("[addSituacionReserva] Firebase falló; reserva quedó en local:", error);
      return tempId;
    }
  }

  return tempId;
}

export async function updateSituacionReservaEstado(
  userId: string,
  reservaId: string,
  estado: SituacionReservaEstado,
  extra?: { retomadaAt?: number; retomadaEnVehiculoId?: string }
): Promise<void> {
  const all = getAllLocalReserva().map(i =>
    i.id === reservaId && i.userId === userId ? { ...i, estado, ...extra } : i
  );
  saveAllLocalReserva(all);

  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "situacionReserva");
    await updateDoc(doc(db, path, reservaId), {
      estado,
      ...(extra?.retomadaAt != null ? { retomadaAt: extra.retomadaAt } : {}),
      ...(extra?.retomadaEnVehiculoId ? { retomadaEnVehiculoId: extra.retomadaEnVehiculoId } : {}),
    });
  }
}

export async function updateSituacionReservaRuta(
  userId: string,
  reservaId: string,
  ruta: ReservaTacticaRuta
): Promise<void> {
  const all = getAllLocalReserva().map(i =>
    i.id === reservaId && i.userId === userId ? { ...i, ruta } : i
  );
  saveAllLocalReserva(all);

  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "situacionReserva");
    await updateDoc(doc(db, path, reservaId), { ruta });
  }
}

export async function deleteSituacionReserva(userId: string, reservaId: string): Promise<void> {
  saveAllLocalReserva(
    getAllLocalReserva().filter(i => !(i.id === reservaId && i.userId === userId))
  );

  if (isFirebaseConfigured() && db && !reservaId.startsWith("reserva_")) {
    try {
      const path = getPrivatePath(userId, "situacionReserva");
      await deleteDoc(doc(db, path, reservaId));
    } catch (error) {
      console.error("[deleteSituacionReserva] Firebase:", error);
    }
  }
}
