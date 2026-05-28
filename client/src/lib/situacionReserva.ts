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

export interface SituacionReservaItem {
  id: string;
  userId: string;
  texto: string;
  reservadaAt: number;
  origenVehiculoTitulo?: string;
  origenVehiculoId?: string;
  minutosCupo?: number;
  detalles?: DetalleSubTarea[];
  estado: SituacionReservaEstado;
  retomadaAt?: number;
  retomadaEnVehiculoId?: string;
}

const STORAGE_KEY = "sistemicar_situacion_reserva";
export const SITUACION_RESERVA_EVENT = "sistemicar-situacion-reserva-changed";

function normalizeItem(raw: SituacionReservaItem): SituacionReservaItem {
  return {
    ...raw,
    reservadaAt: raw.reservadaAt ?? Date.now(),
    estado: raw.estado ?? "activa",
  };
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(SITUACION_RESERVA_EVENT));
}

export function getLocalSituacionReserva(userId: string): SituacionReservaItem[] {
  return getAllLocalReserva()
    .filter(i => i.userId === userId)
    .sort((a, b) => b.reservadaAt - a.reservadaAt);
}

export function getReservaActivas(items: SituacionReservaItem[]): SituacionReservaItem[] {
  return items.filter(i => i.estado === "activa");
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
            estado: row.estado ?? "activa",
            retomadaAt: row.retomadaAt,
            retomadaEnVehiculoId: row.retomadaEnVehiculoId,
          });
        });
        const sorted = data.sort((a, b) => b.reservadaAt - a.reservadaAt);
        deactivateSovereignModeGlobal();
        const others = getAllLocalReserva().filter(i => i.userId !== userId);
        saveAllLocalReserva([...others, ...sorted]);
        backupToLocal("situacionReserva", sorted);
        onData(sorted);
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
  const payload = {
    texto: item.texto,
    reservadaAt: Date.now(),
    origenVehiculoTitulo: item.origenVehiculoTitulo ?? null,
    origenVehiculoId: item.origenVehiculoId ?? null,
    minutosCupo: item.minutosCupo ?? null,
    detalles: item.detalles ?? null,
    estado: item.estado ?? "activa",
  };

  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "situacionReserva");
    const docRef = await addDoc(collection(db, path), {
      ...payload,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  const id = `reserva_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const all = getAllLocalReserva();
  all.unshift({
    id,
    userId,
    ...payload,
    estado: payload.estado as SituacionReservaEstado,
  });
  saveAllLocalReserva(all);
  return id;
}

export async function updateSituacionReservaEstado(
  userId: string,
  reservaId: string,
  estado: SituacionReservaEstado,
  extra?: { retomadaAt?: number; retomadaEnVehiculoId?: string }
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "situacionReserva");
    await updateDoc(doc(db, path, reservaId), {
      estado,
      ...(extra?.retomadaAt != null ? { retomadaAt: extra.retomadaAt } : {}),
      ...(extra?.retomadaEnVehiculoId ? { retomadaEnVehiculoId: extra.retomadaEnVehiculoId } : {}),
    });
    return;
  }

  const all = getAllLocalReserva().map(i =>
    i.id === reservaId && i.userId === userId
      ? { ...i, estado, ...extra }
      : i
  );
  saveAllLocalReserva(all);
}

export async function deleteSituacionReserva(userId: string, reservaId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "situacionReserva");
    await deleteDoc(doc(db, path, reservaId));
    return;
  }

  saveAllLocalReserva(getAllLocalReserva().filter(i => !(i.id === reservaId && i.userId === userId)));
}
