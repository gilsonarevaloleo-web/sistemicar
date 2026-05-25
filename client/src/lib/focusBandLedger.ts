import { db, getPrivatePath, isFirebaseConfigured } from "./firebase";
import { getLimaDateString } from "./persistence";
import type { RutaBandaId } from "./rutaEnfoque";

export type FocusBandId = RutaBandaId;

export type FocusEventSource =
  | "ruta_cruce"
  | "bloque_cierre"
  | "vehiculo_inicio"
  | "vehiculo_cierre"
  | "descanso_cuerpo";

export interface FocusBandEvent {
  id: string;
  fecha: string;
  timestamp: number;
  source: FocusEventSource;
  banda: FocusBandId;
  vehicleId?: string;
  subVehicleId?: string;
  subTitulo?: string;
  segmentoId?: string;
  psEspectro?: number;
}

const LEDGER_LOCAL_KEY = "sistemicar_focus_band_ledger";

function getLocalEvents(userId: string): FocusBandEvent[] {
  try {
    const raw = localStorage.getItem(`${LEDGER_LOCAL_KEY}_${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as FocusBandEvent[];
  } catch {
    return [];
  }
}

function saveLocalEvents(userId: string, events: FocusBandEvent[]): void {
  localStorage.setItem(`${LEDGER_LOCAL_KEY}_${userId}`, JSON.stringify(events.slice(-500)));
}

export async function recordFocusBandEvent(
  userId: string,
  data: Omit<FocusBandEvent, "id" | "fecha" | "timestamp">
): Promise<FocusBandEvent> {
  const entry: FocusBandEvent = {
    id: `fbe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fecha: getLimaDateString(),
    timestamp: Date.now(),
    ...data,
  };

  const locals = getLocalEvents(userId);
  locals.push(entry);
  saveLocalEvents(userId, locals);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("focus-band-events-updated"));
  }

  if (isFirebaseConfigured() && db) {
    try {
      const { addDoc, collection } = await import("firebase/firestore");
      const path = getPrivatePath(userId, "focusBandEvents");
      await addDoc(collection(db, path), entry);
    } catch {
      // local already saved
    }
  }

  return entry;
}

export async function getFocusBandEventsForRange(
  userId: string,
  fechaStart: string,
  fechaEnd: string
): Promise<FocusBandEvent[]> {
  const inRange = (f: string) => f >= fechaStart && f <= fechaEnd;
  const local = getLocalEvents(userId).filter(e => inRange(e.fecha));
  const seen = new Set(local.map(e => e.id));

  if (isFirebaseConfigured() && db) {
    try {
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      const path = getPrivatePath(userId, "focusBandEvents");
      const q = query(
        collection(db, path),
        where("fecha", ">=", fechaStart),
        where("fecha", "<=", fechaEnd)
      );
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const e = docSnap.data() as FocusBandEvent;
        if (!seen.has(e.id)) {
          seen.add(e.id);
          local.push({ ...e, id: e.id || docSnap.id });
        }
      }
    } catch {
      // use local only
    }
  }

  return local.sort((a, b) => a.timestamp - b.timestamp);
}

export async function getFocusBandEventsRecent(
  userId: string,
  days: number
): Promise<FocusBandEvent[]> {
  const end = getLimaDateString();
  const startMs = Date.now() - (days - 1) * 24 * 60 * 60 * 1000;
  const start = getLimaDateString(startMs);
  return getFocusBandEventsForRange(userId, start, end);
}
