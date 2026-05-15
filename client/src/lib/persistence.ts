import { 
  db, 
  collection,
  collectionGroup,
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where, 
  limit,
  serverTimestamp, 
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  getPrivatePath,
  isFirebaseConfigured
} from "./firebase";
import { activateSovereignModeGlobal, deactivateSovereignModeGlobal, backupToLocal, restoreFromLocal } from "./sovereign-mode";

export interface AcervoEntry {
  id: string;
  text: string;
  axis: "enfoque" | "conflicto" | "pasos" | "limite";
  points: number;
  userId: string;
  createdAt: Date;
}

const STORAGE_KEY = "sistemicar_acervo";

function getLocalEntries(): AcervoEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const entries = JSON.parse(data) as AcervoEntry[];
    return entries.map(e => ({
      ...e,
      createdAt: new Date(e.createdAt)
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function saveLocalEntries(entries: AcervoEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearAllLocalData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("sistemicar_vehicles");
  localStorage.removeItem("sistemicar_boss_step");
  localStorage.removeItem("sistemicar_chispazos");
  localStorage.removeItem("tutorial_completed");
  localStorage.removeItem("sistemi_silencio_completado");
  localStorage.removeItem("referralCode");
  localStorage.removeItem("user_referral_code");
  sessionStorage.clear();
  window.dispatchEvent(new CustomEvent("acervo-updated"));
  window.dispatchEvent(new CustomEvent("vehicles-updated"));
  window.dispatchEvent(new CustomEvent("boss-updated"));
  window.dispatchEvent(new CustomEvent("chispazos-updated"));
}

export async function syncLocalDataToFirebase(userId: string): Promise<{ synced: number; errors: number }> {
  if (!isFirebaseConfigured() || !db) {
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  try {
    const localEnergyLogs = getLocalEnergyLogs();
    for (const log of localEnergyLogs) {
      if (log.id.startsWith("temp_") || log.id.startsWith("local_")) {
        try {
          const path = getPrivatePath(userId, "energyLogs");
          await addDoc(collection(db, path), {
            text: log.text,
            type: log.type,
            points: log.points,
            userId,
            timestamp: serverTimestamp()
          });
          synced++;
        } catch { errors++; }
      }
    }

    const localVehicles = getLocalVehicles();
    for (const v of localVehicles) {
      if (v.id.startsWith("temp_") || v.id.startsWith("vehicle_")) {
        try {
          const path = getPrivatePath(userId, "vehicles");
          await addDoc(collection(db, path), {
            titulo: v.titulo,
            criterioFin: v.criterioFin,
            criterioDetalle: v.criterioDetalle,
            ejes: v.ejes,
            status: v.status,
            userId,
            tiempoInicio: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          synced++;
        } catch { errors++; }
      }
    }

    const localProgression = getLocalProgression(userId);
    if (localProgression.points > 0 || localProgression.totalMissionsCompleted > 0) {
      try {
        const path = getPrivatePath(userId, "progression");
        await addDoc(collection(db, path), {
          ...localProgression,
          userId,
          lastUpdated: serverTimestamp()
        });
        synced++;
      } catch { errors++; }
    }
  } catch {
    errors++;
  }

  return { synced, errors };
}

export async function migrateDataToNewUid(oldUid: string, newUid: string): Promise<{ migrated: number; errors: number }> {
  if (!isFirebaseConfigured() || !db) {
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  const collections = ["energyLogs", "vehicles", "progression", "acervo", "codices", "hopeLog", "bossSteps"];

  for (const collName of collections) {
    try {
      const oldPath = getPrivatePath(oldUid, collName);
      const newPath = getPrivatePath(newUid, collName);
      const snapshot = await getDocs(collection(db, oldPath));
      
      for (const docSnap of snapshot.docs) {
        try {
          const data = docSnap.data();
          await addDoc(collection(db, newPath), {
            ...data,
            userId: newUid,
            migratedFrom: oldUid,
            migratedAt: serverTimestamp()
          });
          migrated++;
        } catch {
          errors++;
        }
      }
    } catch {
      errors++;
    }
  }

  return { migrated, errors };
}

export function saveMigrationPending(oldUid: string): void {
  localStorage.setItem("sistemicar_migration_pending", JSON.stringify({
    oldUid,
    timestamp: Date.now()
  }));
}

export function getMigrationPending(): { oldUid: string; timestamp: number } | null {
  try {
    const data = localStorage.getItem("sistemicar_migration_pending");
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearMigrationPending(): void {
  localStorage.removeItem("sistemicar_migration_pending");
}

export async function findAccountsWithData(): Promise<Array<{ uid: string; totalCP: number; rank: string; lastUpdated: Date | null }>> {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const usersRef = collection(db, "artifacts/sistemicar-v2-5/users");
    const usersSnapshot = await getDocs(usersRef);
    const accounts: Array<{ uid: string; totalCP: number; rank: string; lastUpdated: Date | null }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        const progressionPath = `artifacts/sistemicar-v2-5/users/${uid}/progression`;
        const progressionSnapshot = await getDocs(collection(db, progressionPath));
        
        if (!progressionSnapshot.empty) {
          const progData = progressionSnapshot.docs[0].data();
          if (progData.totalCP > 0 || progData.points > 0) {
            accounts.push({
              uid,
              totalCP: progData.totalCP || progData.points || 0,
              rank: progData.rank || "observador",
              lastUpdated: progData.lastUpdated?.toDate() || null
            });
          }
        }
      } catch {
        // Skip this user
      }
    }

    return accounts.sort((a, b) => b.totalCP - a.totalCP);
  } catch (error) {
    console.error("Error finding accounts:", error);
    return [];
  }
}

export function subscribeToAcervo(
  userId: string,
  onData: (entries: AcervoEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "acervo");
    const q = query(
      collection(db, path),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as AcervoEntry[];
      // Sort client-side to avoid Firebase index requirement
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(data);
    }, (err) => {
      console.error("Error listening to acervo:", err);
      // Fallback to local storage on error
      activateSovereignModeGlobal("acervo");
      onData(getLocalEntries());
    });
  } else {
    onData(getLocalEntries());
    return () => {};
  }
}

export async function addAcervoEntry(
  userId: string,
  entry: Omit<AcervoEntry, "id" | "createdAt" | "userId">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "acervo");
    const docRef = await addDoc(collection(db, path), {
      ...entry,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const entries = getLocalEntries();
    const newId = `local_${Date.now()}`;
    const newEntry: AcervoEntry = {
      ...entry,
      id: newId,
      userId,
      createdAt: new Date()
    };
    entries.unshift(newEntry);
    saveLocalEntries(entries);
    window.dispatchEvent(new CustomEvent("acervo-updated"));
    return newId;
  }
}

export async function deleteAcervoEntry(userId: string, entryId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "acervo");
    await deleteDoc(doc(db, path, entryId));
  } else {
    const entries = getLocalEntries().filter(e => e.id !== entryId);
    saveLocalEntries(entries);
    window.dispatchEvent(new CustomEvent("acervo-updated"));
  }
}

export async function clearAllAcervoEntries(userId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "acervo");
    const snapshot = await getDocs(collection(db, path));
    await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, path, d.id))));
  } else {
    saveLocalEntries([]);
    window.dispatchEvent(new CustomEvent("acervo-updated"));
  }
}

// ========== ENERGY LOGS (Los 4 Ejes) ==========

export interface EnergyLog {
  id: string;
  text: string;
  type: "enfoque" | "conflicto" | "pasos" | "alcance" | "percibo" | "reconozco" | "cuento_con" | "transformo";
  points: number;
  userId: string;
  timestamp: Date;
}

const ENERGY_LOGS_KEY = "sistemicar_energy_logs";

function getLocalEnergyLogs(): EnergyLog[] {
  try {
    const data = localStorage.getItem(ENERGY_LOGS_KEY);
    if (!data) return [];
    const logs = JSON.parse(data) as EnergyLog[];
    return logs.map(l => ({
      ...l,
      timestamp: new Date(l.timestamp)
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch {
    return [];
  }
}

function saveLocalEnergyLogs(logs: EnergyLog[]): void {
  localStorage.setItem(ENERGY_LOGS_KEY, JSON.stringify(logs));
}

export function subscribeToEnergyLogs(
  userId: string,
  onData: (logs: EnergyLog[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "energyLogs");
    const q = query(collection(db, path));

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate() || new Date()
      })) as EnergyLog[];
      const sorted = data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      deactivateSovereignModeGlobal();
      backupToLocal("energy_logs", sorted);
      saveLocalEnergyLogs(sorted);
      onData(sorted);
    }, (error) => {
      console.error("Firebase Error:", error);
      activateSovereignModeGlobal("Conexión con la Nube interrumpida");
      const localData = restoreFromLocal<EnergyLog[]>("energy_logs") || getLocalEnergyLogs();
      onData(localData);
      onError(error);
    });
  } else {
    const handleUpdate = () => onData(getLocalEnergyLogs());
    handleUpdate();
    window.addEventListener("energy-logs-updated", handleUpdate);
    return () => window.removeEventListener("energy-logs-updated", handleUpdate);
  }
}

export async function addEnergyLog(
  userId: string,
  log: Omit<EnergyLog, "id" | "timestamp" | "userId">
): Promise<string> {
  const saveLocally = () => {
    const logs = getLocalEnergyLogs();
    const newId = `temp_${Date.now()}`;
    const newLog: EnergyLog = {
      ...log,
      id: newId,
      userId,
      timestamp: new Date()
    };
    logs.unshift(newLog);
    saveLocalEnergyLogs(logs);
    window.dispatchEvent(new CustomEvent("energy-logs-updated"));
    return newId;
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "energyLogs");
      const docRef = await addDoc(collection(db, path), {
        ...log,
        userId,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error al guardar en nube:", error);
      activateSovereignModeGlobal("Saldo agotado. Los datos se guardan en tu dispositivo.");
      return saveLocally();
    }
  } else {
    return saveLocally();
  }
}

export function calculateTotalCP(logs: EnergyLog[]): number {
  return logs.reduce((sum, log) => sum + log.points, 0);
}

export type TrifectaState = "omitir" | "blando" | "intermedio" | "reto";
export type CriterioFin = "tiempo" | "circunstancia";
export type VehicleStatus = "activo" | "cumplido" | "archivado";
export type TipoTerminoRapido = "hora" | "situacion" | "omitido";
export type TipoFlota = "tiempo" | "situacion" | "descanso" | "verdad";

export interface VehicleAxis {
  text: string;
  trifecta: TrifectaState;
}

export interface ParentesisRecarga {
  inicio: number;
  fin: number;
  duracionMin: number;
}

export interface DetalleSubTarea {
  id: string;
  texto: string;
  entregado: boolean;
  creadaAt: number;
}

export interface SubTarea {
  id: string;
  texto: string;
  completada: boolean;
  creadaAt: number;
  detalles?: DetalleSubTarea[];
  /** Cupo de tiempo (min) para foco situacional; opcional. */
  minutosCupo?: number;
  /** Si true, la fila está en el desglose con tiempo madre (4 PS al cumplir, cupo/+5′). */
  enDesgloseCronometro?: boolean;
  /** Resultado en lista cronometrada; en lista libre suele omitirse (solo `completada`). */
  resultadoSituacion?: "pendiente" | "cumplido" | "fallado";
}

export interface SubVehiculo {
  id: string;
  titulo: string;
  aperturaAt?: number;
  cierreAt?: number;
  status: "pendiente" | "activo" | "cumplido" | "fallado";
  cantidadObjetivo?: number;
  cantidadLograda?: number;
  duracionFinal?: number;
  tiempoRecordMinPerUnit?: number;
  tiempoSugeridoSeg?: number;
}

export interface EnergiaOscuraEntry {
  vehiculoId: string;
  vehiculoTitulo: string;
  tipoFlota?: TipoFlota;
  minutosExceso: number;
  justificacion?: string;
  justificado: boolean;
  psOtorgados: number;
  timestamp: number;
}

export interface CierreJornadaLog {
  id: string;
  fecha: string;
  totalPS: number;
  porcentajeSoberania: number;
  segmentosCerradosManual: number;
  segmentosTotales: number;
  energiaOscuraEntries: EnergiaOscuraEntry[];
  energiaOscuraTotal: number;
  energiaRecuperada: number;
  fugasVoltaje: number;
  selloEmitido: boolean;
  bloqueadoNocturno: boolean;
  timestamp: number;
  vehiculosCumplidos?: number;
  vehiculosTotales?: number;
  porcentajeDiaIdeal?: number;
  energiaOscuraDetectada?: number;
  selloTexto?: string;
  cierreAt?: number;
}

export interface Vehicle {
  id: string;
  titulo: string;
  criterioFin: CriterioFin;
  criterioDetalle: string;
  tiempoInicio: Date;
  ejes: {
    enfoque: VehicleAxis;
    conflicto: VehicleAxis;
    pasos: VehicleAxis;
    limite: VehicleAxis;
  };
  status: VehicleStatus;
  userId: string;
  createdAt: Date;
  completedAt?: Date;
  tipoTerminoRapido?: TipoTerminoRapido;
  tipoFlota?: TipoFlota;
  aperturaAt?: number;
  cierreAt?: number;
  duracionFinal?: number;
  parentesisRecarga?: ParentesisRecarga[];
  bonoTemple?: boolean;
  cierreManual?: boolean;
  energiaOscura?: boolean;
  justificacion?: string;
  subTareas?: SubTarea[];
  autoVerdad?: boolean;
  tipoReloj?: "proyectivo" | "produccion" | "manual" | "investigador" | "desglosador";
  subVehiculos?: SubVehiculo[];
  cantidadObjetivo?: number;
  resultadoPorUnidad?: number;
  mejorTiempoPorUnidad?: number;
  estadoEnergia?: "optima" | "baja";
  energiaDiffPct?: number;
  segmentoOrigen?: string;
  segmentosCruzados?: number;
  rendimientoConsciente?: "igual" | "mejor" | "peor";
  recordSugerido?: number;
  tiempoElegido?: number;
  datoConfiable?: boolean;
  intensidadEnergetica?: "fluido" | "concentrado" | "limite";
  /** Energía percibida al cerrar el vehículo (espejo de cierre vs. intensidadEnergetica al inicio). */
  intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite";
  clientRequestId?: string;
  tipoDescanso?: "intercepcion" | "microcarga" | "reset_profundo" | "punto_cero";
  microPasos?: { hidratacion: boolean; respiracion: boolean; pantallaZero: boolean };
  etapasPuntoCero?: { etapa1: boolean; etapa2: boolean; etapa3: boolean; etapa4: boolean };
  primerAccionAt?: number;
  etiquetaSalida?: "recuperado" | "parcial" | "fragmentado";
  notaSalida?: string;
  /** Primera subtarea pendiente con cupo: inicio del intervalo para alarma auditiva (desglosador situacional). */
  situacionCupoAnchor?: { subTareaId: string; startedAt: number } | null;
  /** Desglose situacional con tiempo madre: hora fin, inicio de bloque (PS profundidad por h real), PS profundidad ya otorgados en el bloque. */
  situacionCronometro?: {
    activo: boolean;
    horaFinMs?: number;
    bloqueInicioAt?: number;
    /** Suma de PS de profundidad (+5/h de bloque) ya entregados en este vehículo activo. */
    depthBlockPsGranted?: number;
  } | null;
  /** PS de profundidad por duración real del desglosador de tiempo (sesión); evita doble premio al activar subs. */
  desglosadorBloqueDepthPsGranted?: number;
}

const VEHICLES_KEY = "sistemicar_vehicles";

export function getLocalVehicles(): Vehicle[] {
  try {
    const data = localStorage.getItem(VEHICLES_KEY);
    if (!data) return [];
    const vehicles = JSON.parse(data) as Vehicle[];
    return vehicles.map(v => ({
      ...v,
      tiempoInicio: new Date(v.tiempoInicio),
      createdAt: new Date(v.createdAt),
      completedAt: v.completedAt ? new Date(v.completedAt) : undefined
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

export function saveLocalVehicles(vehicles: Vehicle[]): void {
  // Defense-in-depth: never reduce active vehicle count without an explicit close signal.
  // Multiple concurrent subscribers (Doctor IA, historial, radar, etc.) all call this
  // function. If ANY subscriber receives a Firebase snapshot missing an active vehicle
  // (timing, provisional ID not yet in Firestore, mobile connectivity hiccup), it would
  // otherwise overwrite localStorage and silently lose the vehicle.
  //
  // Per-ID tracking (not a global time window): only skip preservation for vehicle IDs
  // that were explicitly closed recently. A NEW vehicle created immediately after closing
  // another has a different ID and is always protected.
  const current = getLocalVehicles();
  const newIds = new Set(vehicles.map(v => v.id));
  const newClientRequestIds = new Set(
    vehicles.map(v => v.clientRequestId).filter(Boolean)
  );
  const preserved = current.filter(v => {
    if (v.status !== "activo" || v.autoVerdad) return false;
    if (newIds.has(v.id)) return false;
    if (v.clientRequestId && newClientRequestIds.has(v.clientRequestId)) return false;
    // Skip preservation if THIS specific vehicle was recently closed
    if (wasVehicleRecentlyClosed(v.id)) return false;
    return true; // locally-active vehicle absent from new data — preserve it
  });
  if (preserved.length > 0) {
    console.warn(`[saveLocalVehicles] Preservando ${preserved.length} activo(s) no presentes en datos nuevos:`, preserved.map(v => `${v.id}:${v.titulo}`));
    vehicles = [...preserved, ...vehicles];
  }
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

// Per-vehicle-ID close tracking. Maps vehicleId → close timestamp.
// Allows saveLocalVehicles to bypass protection only for the specific vehicle that was
// just closed — NOT for all vehicles globally (which would wipe a new vehicle created
// immediately after a close, since its provisional ID isn't in Firebase yet).
const RECENTLY_CLOSED_MS = 60_000;
const RECENTLY_CLOSED_SESSION_KEY = "sistemicar_recently_closed_vehicles";
const RECENTLY_CLOSED_SESSION_TTL_MS = 5 * 60_000;

const _recentlyClosedIds = new Map<string, number>();

function readClosedIdsFromSession(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(RECENTLY_CLOSED_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeClosedIdToSession(vehicleId: string): void {
  try {
    const now = Date.now();
    const data = readClosedIdsFromSession();
    data[vehicleId] = now;
    const cutoff = now - RECENTLY_CLOSED_SESSION_TTL_MS;
    for (const [id, t] of Object.entries(data)) {
      if (t < cutoff) delete data[id];
    }
    sessionStorage.setItem(RECENTLY_CLOSED_SESSION_KEY, JSON.stringify(data));
  } catch { /* sessionStorage unavailable */ }
}

/** True if this vehicle was closed recently (memory or sessionStorage, survives F5). */
export function wasVehicleRecentlyClosed(vehicleId: string): boolean {
  const mem = _recentlyClosedIds.get(vehicleId);
  if (mem != null && Date.now() - mem < RECENTLY_CLOSED_MS) return true;
  const session = readClosedIdsFromSession()[vehicleId];
  return session != null && Date.now() - session < RECENTLY_CLOSED_SESSION_TTL_MS;
}

export function notifyVehicleClosed(vehicleId?: string): void {
  if (vehicleId) {
    const now = Date.now();
    _recentlyClosedIds.set(vehicleId, now);
    writeClosedIdToSession(vehicleId);
    const cutoff = now - RECENTLY_CLOSED_MS;
    for (const [id, t] of _recentlyClosedIds) {
      if (t < cutoff) _recentlyClosedIds.delete(id);
    }
  }
}

/** Evita crear un segundo centinela si otra pestaña/dispositivo ya escribió uno en Firestore. */
export async function hasActiveCentinelaInFirestore(userId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  try {
    const path = getPrivatePath(userId, "vehicles");
    const snap = await getDocs(collection(db, path));
    return snap.docs.some(d => {
      const r = d.data() as { status?: string; autoVerdad?: boolean };
      return r.status === "activo" && r.autoVerdad === true;
    });
  } catch {
    return false;
  }
}

export function subscribeToVehicles(
  userId: string,
  onData: (vehicles: Vehicle[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "vehicles");
    const q = query(collection(db, path));

    const fromLocal = getLocalVehicles();
    const localImmediate = fromLocal.length > 0
      ? fromLocal
      : (restoreFromLocal<Vehicle[]>("vehicles") || []);
    if (localImmediate.length > 0) {
      onData(localImmediate);
    }

    return onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs;
      const data = allDocs.map(d => {
        const raw = d.data();
        const aperturaFallback = raw.aperturaAt ? new Date(raw.aperturaAt) : new Date();
        const createdAtDate = raw.createdAt?.toDate?.() || aperturaFallback;
        return {
          id: d.id,
          ...raw,
          tiempoInicio: raw.tiempoInicio?.toDate?.() || aperturaFallback,
          createdAt: createdAtDate,
          completedAt: raw.completedAt?.toDate?.()
        } as Vehicle;
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartMs = todayStart.getTime();
      const thirtyDaysAgoMs = todayStartMs - 30 * 24 * 60 * 60 * 1000;

      const activos = data.filter(v => v.status === "activo");

      const completadosRecientes = data.filter(v => {
        if (v.status !== "cumplido" && v.status !== "archivado") return false;
        if (v.autoVerdad) return false;

        const createdMs = v.createdAt?.getTime?.() || 0;
        const aperturaMs = v.aperturaAt || 0;
        const cierreMs = v.cierreAt || 0;
        const bestTimestamp = Math.max(createdMs, aperturaMs, cierreMs);

        return bestTimestamp >= thirtyDaysAgoMs;
      });

      const centinelasCerradosHoy = data.filter(v => {
        if (!v.autoVerdad) return false;
        if (v.status === "activo") return false;
        const cierreMs = v.cierreAt || v.aperturaAt || v.createdAt?.getTime?.() || 0;
        return cierreMs >= todayStartMs;
      });

      const merged = [...activos, ...completadosRecientes, ...centinelasCerradosHoy];
      const sorted = merged.sort((a, b) => {
        const aTime = a.createdAt?.getTime?.() || a.aperturaAt || 0;
        const bTime = b.createdAt?.getTime?.() || b.aperturaAt || 0;
        return bTime - aTime;
      });

      const filteredOut = allDocs.length - sorted.length;
      console.log(`[Vehicles] Total docs: ${allDocs.length}, Activos: ${activos.length}, Completados recientes (30d): ${completadosRecientes.length}, Emitiendo: ${sorted.length}${filteredOut > 0 ? `, Filtrados (>30d o centinelas): ${filteredOut}` : ""}`);
      if (activos.length > 0) {
        console.log(`[Vehicles] Activos:`, activos.map(v => `${v.id}:${v.titulo}(${v.status})`));
      }

      if (allDocs.length > 0 && sorted.length === 0) {
        const sample = allDocs.slice(0, 5).map(d => {
          const r = d.data();
          return `${d.id}: status="${r.status}" titulo="${r.titulo}" createdAt=${r.createdAt ? "OK" : "NULL"} aperturaAt=${r.aperturaAt || "NULL"}`;
        });
        console.log(`[Vehicles] DIAGNÓSTICO - 0 vehículos visibles. Muestra:`, sample);
      }

      deactivateSovereignModeGlobal();

      // Preserve subVehiculos for active desglosador vehicles so Firebase snapshots
      // never destroy in-progress sub-vehicle state (subVehiculos are session-local only)
      const existingLocal = getLocalVehicles();
      const sortedWithSubs = sorted.map(v => {
        const localV = existingLocal.find(lv => lv.id === v.id);
        if (localV && localV.status !== "activo" && v.status === "activo") {
          return {
            ...v,
            status: localV.status,
            ...(localV.cierreAt != null ? { cierreAt: localV.cierreAt } : {}),
            ...(localV.duracionFinal != null ? { duracionFinal: localV.duracionFinal } : {}),
            ...(localV.cierreManual != null ? { cierreManual: localV.cierreManual } : {}),
            ...(localV.intensidadEnergeticaFin ? { intensidadEnergeticaFin: localV.intensidadEnergeticaFin } : {}),
            situacionCronometro: null,
            situacionCupoAnchor: null,
          };
        }
        if (v.tipoReloj === "desglosador" && v.status === "activo") {
          if (localV?.subVehiculos && localV.subVehiculos.length > 0) {
            return { ...v, subVehiculos: localV.subVehiculos };
          }
        }
        return v;
      });

      if (snapshot.metadata.fromCache) {
        // Never let any stale cache snapshot remove vehicles that are confirmed locally active.
        // The previous guard only caught empty cache snapshots; non-empty stale snapshots (e.g.
        // only old completados, no new activo yet) could clear the UI after the optimistic ref
        // was already flushed by an earlier correct snapshot.
        const localActivos = existingLocal.filter(v => v.status === "activo" && !v.autoVerdad);
        if (localActivos.length > 0 || sorted.length === 0) {
          const snapshotIds = new Set(allDocs.map(d => d.id));
          const snapshotCRQs = new Set(
            allDocs.map(d => (d.data() as Record<string, unknown>).clientRequestId as string | undefined).filter(Boolean)
          );
          const missingActivo = localActivos.some(v =>
            !snapshotIds.has(v.id) &&
            !(v.clientRequestId && snapshotCRQs.has(v.clientRequestId))
          );
          if (missingActivo || sorted.length === 0) {
            console.log(`[Vehicles] Ignorando snapshot de caché (${sorted.length} docs, ${localActivos.length} activos locales ausentes) — esperando red`);
            return;
          }
        }
      }

      // MERGE: include any locally-active vehicles that Firebase doesn't know about.
      // Covers: (a) provisional-ID vehicles pending Firebase write,
      //         (b) vehicles whose Firebase write failed silently.
      // Note: fromCache snapshots with 0 docs exit early above (the subscriber already
      // received localImmediate on mount), so merge runs for all non-empty snapshots.
      // Per-ID tracking: only skip preservation for vehicles whose IDs were recently closed.
      {
        // Build lookup sets for deterministic identity matching
        const firebaseIds = new Set(sortedWithSubs.map(v => v.id));
        // Build set of clientRequestIds present in Firebase snapshot
        const firebaseClientRequestIds = new Set(
          sortedWithSubs.map(v => v.clientRequestId).filter(Boolean)
        );
        const localActivos = existingLocal.filter(v => v.status === "activo" && !v.autoVerdad);
        const orphanedActivos = localActivos.filter(v => {
          // Already present in Firebase snapshot by Firestore document ID
          if (firebaseIds.has(v.id)) return false;
          // Present by clientRequestId — provisional was written to Firebase successfully;
          // the post-write ID replacement in localStorage may not have run yet
          if (v.clientRequestId && firebaseClientRequestIds.has(v.clientRequestId)) return false;
          if (wasVehicleRecentlyClosed(v.id)) return false;
          // Genuinely not in Firebase — must be preserved
          return true;
        });
        if (orphanedActivos.length > 0) {
          console.warn(`[Vehicles] Preservando ${orphanedActivos.length} activo(s) local(es) no en Firebase:`, orphanedActivos.map(v => `${v.id}:${v.titulo}`));
          sortedWithSubs.unshift(...orphanedActivos);
          sortedWithSubs.sort((a, b) => {
            const aTime = a.createdAt?.getTime?.() || a.aperturaAt || 0;
            const bTime = b.createdAt?.getTime?.() || b.aperturaAt || 0;
            return bTime - aTime;
          });
        }
      }

      // Persist the merged result locally (always save the fullest result)
      if (sortedWithSubs.length > 0) {
        backupToLocal("vehicles", sortedWithSubs);
        saveLocalVehicles(sortedWithSubs);
      }

      onData(sortedWithSubs);
    }, (error) => {
      console.error("Firebase Vehicles Error:", error);
      activateSovereignModeGlobal("Usando datos locales de vehículos");
      const localData = restoreFromLocal<Vehicle[]>("vehicles") || getLocalVehicles();
      onData(localData);
      onError(error);
    });
  } else {
    const handleUpdate = () => onData(getLocalVehicles());
    handleUpdate();
    window.addEventListener("vehicles-updated", handleUpdate);
    return () => window.removeEventListener("vehicles-updated", handleUpdate);
  }
}

export async function addVehicle(
  userId: string,
  vehicle: Omit<Vehicle, "id" | "createdAt" | "userId" | "status">
): Promise<string> {
  // Generate a stable client-side request ID that is saved both locally and in Firebase.
  // This allows the subscription merge to deterministically identify whether a local
  // provisional vehicle was already written to Firebase (even before localStorage is
  // updated with the real Firestore document ID).
  const clientRequestId = `crq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const provisionalId = `vehicle_${Date.now()}`;
  const aperturaAt = vehicle.aperturaAt ?? Date.now();
  const provisionalVehicle: Vehicle = {
    ...vehicle,
    aperturaAt,
    id: provisionalId,
    userId,
    status: "activo",
    createdAt: new Date(),
    clientRequestId
  };
  // Save locally FIRST — vehicle is never lost regardless of Firebase outcome
  const existingLocal = getLocalVehicles();
  existingLocal.unshift(provisionalVehicle);
  saveLocalVehicles(existingLocal);
  backupToLocal("vehicles", existingLocal);
  window.dispatchEvent(new CustomEvent("vehicles-updated"));

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "vehicles");
      console.log(`[addVehicle] Guardando "${vehicle.titulo}" en Firebase con status: activo, crqId: ${clientRequestId}`);
      const docRef = await addDoc(collection(db, path), {
        ...vehicle,
        aperturaAt,
        userId,
        status: "activo",
        createdAt: serverTimestamp(),
        clientRequestId
      });
      console.log(`[addVehicle] OK → id: ${docRef.id}, titulo: "${vehicle.titulo}"`);
      // Replace the provisional ID with the real Firebase ID in localStorage.
      // Keep clientRequestId so any in-flight subscription snapshot can still
      // reconcile the record before this update propagates.
      const latestLocal = getLocalVehicles();
      const updatedLocal = latestLocal.map(v =>
        v.id === provisionalId ? { ...v, id: docRef.id } : v
      );
      saveLocalVehicles(updatedLocal);
      backupToLocal("vehicles", updatedLocal);
      window.dispatchEvent(new CustomEvent("vehicles-updated"));
      return docRef.id;
    } catch (error) {
      console.error("[addVehicle] ERROR Firebase:", error);
      activateSovereignModeGlobal("Guardando vehículo localmente");
      // Vehicle already saved locally with provisional ID — no data loss
      return provisionalId;
    }
  } else {
    return provisionalId;
  }
}

export async function updateVehicleStatus(
  userId: string,
  vehicleId: string,
  status: VehicleStatus
): Promise<void> {
  console.log(`[updateVehicleStatus] vehicleId: ${vehicleId} → status: ${status}`);
  if (status !== "activo" && status !== "pendiente") {
    notifyVehicleClosed(vehicleId);
  }
  const updateLocally = () => {
    const vehicles = getLocalVehicles().map(v => 
      v.id === vehicleId 
        ? { ...v, status, ...(status === "cumplido" ? { completedAt: new Date() } : {}) }
        : v
    );
    saveLocalVehicles(vehicles);
    backupToLocal("vehicles", vehicles);
    window.dispatchEvent(new CustomEvent("vehicles-updated"));
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "vehicles");
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, path, vehicleId), { 
        status,
        ...(status === "cumplido" ? { completedAt: serverTimestamp() } : {})
      });
      console.log(`[updateVehicleStatus] OK → ${vehicleId} ahora es ${status}`);
      // Also update localStorage immediately — don't wait for the Firebase snapshot.
      // Without this, there's a window where localStorage still shows "activo" but
      // Firebase has "cumplido". If saveLocalVehicles runs during that window (from
      // another subscriber), the protection logic would re-add the "activo" vehicle.
      updateLocally();
      window.dispatchEvent(new CustomEvent("vehicles-status-changed"));
    } catch (error) {
      console.error("[updateVehicleStatus] ERROR:", error);
      activateSovereignModeGlobal("Guardando estado localmente");
      updateLocally();
    }
  } else {
    updateLocally();
  }
}

export async function deleteVehicle(userId: string, vehicleId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "vehicles");
    await deleteDoc(doc(db, path, vehicleId));
  } else {
    const vehicles = getLocalVehicles().filter(v => v.id !== vehicleId);
    saveLocalVehicles(vehicles);
    window.dispatchEvent(new CustomEvent("vehicles-updated"));
  }
}

export async function updateVehicle(
  userId: string,
  vehicleId: string,
  updates: Partial<Pick<Vehicle, "titulo" | "criterioFin" | "criterioDetalle" | "ejes" | "tipoFlota" | "aperturaAt" | "cierreAt" | "duracionFinal" | "parentesisRecarga" | "bonoTemple" | "cierreManual" | "energiaOscura" | "justificacion" | "subTareas" | "subVehiculos" | "autoVerdad" | "status" | "tipoReloj" | "cantidadObjetivo" | "resultadoPorUnidad" | "mejorTiempoPorUnidad" | "segmentosCruzados" | "rendimientoConsciente" | "recordSugerido" | "tiempoElegido" | "datoConfiable" | "intensidadEnergetica" | "intensidadEnergeticaFin" | "tipoDescanso" | "microPasos" | "etapasPuntoCero" | "primerAccionAt" | "etiquetaSalida" | "notaSalida" | "situacionCupoAnchor" | "situacionCronometro" | "desglosadorBloqueDepthPsGranted">>
): Promise<void> {
  const updateLocally = () => {
    const vehicles = getLocalVehicles().map(v =>
      v.id === vehicleId ? { ...v, ...updates } : v
    );
    saveLocalVehicles(vehicles);
    window.dispatchEvent(new CustomEvent("vehicles-updated"));
  };
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "vehicles");
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, path, vehicleId), updates);
      if (updates.status === "cumplido" || updates.status === "archivado") {
        notifyVehicleClosed(vehicleId);
      }
      updateLocally();
    } catch (error) {
      console.warn("[updateVehicle] Firebase falló, guardando localmente:", error);
      updateLocally();
    }
  } else {
    updateLocally();
  }
}

// ========== HISTORIAL DE VEHÍCULOS (BÓVEDA DE RÉCORD) ==========

const VEHICLE_HISTORY_KEY = "sistemicar_vehicle_history";

export type VehicleHistoryEntry = {
  titulo: string;
  minPerUnit: number;
  totalMin: number;
  tipoReloj: string;
  fecha: number;
  status?: "cumplido" | "incumplido" | "fallado";
  cumplidos?: number;
  fallados?: number;
  totalSubs?: number;
  subResumen?: {
    titulo: string;
    status: "cumplido" | "fallado" | "pendiente";
    cantidadObjetivo?: number;
    cantidadLograda?: number;
    duracionMin?: number;
  }[];
};

export async function saveVehicleHistoryFirebase(
  userId: string,
  history: VehicleHistoryEntry[]
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const path = getPrivatePath(userId, "vehicleHistory");
    const { setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, path, "entries"), { history }, { merge: false });
  } catch (e) {
    console.warn("[vehicleHistory] Firebase save falló:", e);
  }
}

export async function loadVehicleHistoryFromFirebase(
  userId: string
): Promise<VehicleHistoryEntry[]> {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const path = getPrivatePath(userId, "vehicleHistory");
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, path, "entries"));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data?.history) ? data.history as VehicleHistoryEntry[] : [];
  } catch (e) {
    console.warn("[vehicleHistory] Firebase load falló:", e);
    return [];
  }
}

export function mergeVehicleHistories(
  local: VehicleHistoryEntry[],
  remote: VehicleHistoryEntry[]
): VehicleHistoryEntry[] {
  const seen = new Set<number>();
  const merged = [...local, ...remote].filter(e => {
    if (seen.has(e.fecha)) return false;
    seen.add(e.fecha);
    return true;
  });
  merged.sort((a, b) => a.fecha - b.fecha);
  if (merged.length > 200) merged.splice(0, merged.length - 200);
  return merged;
}

// ========== CIERRE DE JORNADA ==========

const CIERRE_JORNADA_KEY = "sistemicar_cierre_jornada";

function getLocalCierres(): CierreJornadaLog[] {
  try {
    const data = localStorage.getItem(CIERRE_JORNADA_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLocalCierres(cierres: CierreJornadaLog[]) {
  localStorage.setItem(CIERRE_JORNADA_KEY, JSON.stringify(cierres));
}

export async function saveCierreJornada(userId: string, cierre: CierreJornadaLog): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "cierreJornada");
      await addDoc(collection(db, path), { ...cierre, userId, timestamp: Date.now() });
    } catch {
      const cierres = getLocalCierres();
      cierres.unshift(cierre);
      saveLocalCierres(cierres);
    }
  } else {
    const cierres = getLocalCierres();
    cierres.unshift(cierre);
    saveLocalCierres(cierres);
  }
}

export async function getLastCierreJornada(userId: string): Promise<CierreJornadaLog | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "cierreJornada");
      const { query: fbQuery, orderBy, limit, getDocs } = await import("firebase/firestore");
      const q = fbQuery(collection(db, path), orderBy("timestamp", "desc"), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as CierreJornadaLog;
    } catch { return null; }
  }
  const cierres = getLocalCierres();
  return cierres.length > 0 ? cierres[0] : null;
}

export async function getTodayCierreJornada(userId: string): Promise<CierreJornadaLog | null> {
  const today = new Date().toISOString().split("T")[0];
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "cierreJornada");
      const { query: fbQuery, where, getDocs } = await import("firebase/firestore");
      const q = fbQuery(collection(db, path), where("fecha", "==", today));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as CierreJornadaLog;
    } catch { return null; }
  }
  const cierres = getLocalCierres();
  return cierres.find(c => c.fecha === today) || null;
}

// ========== BOSS STEP (Paso Jefe) ==========

export interface BossStep {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
  completedAt?: Date;
  status: "active" | "defeated" | "archived";
}

const BOSS_STORAGE_KEY = "sistemicar_boss_step";

function getLocalBossStep(): BossStep | null {
  try {
    const data = localStorage.getItem(BOSS_STORAGE_KEY);
    if (!data) return null;
    const boss = JSON.parse(data) as BossStep;
    return {
      ...boss,
      createdAt: new Date(boss.createdAt),
      completedAt: boss.completedAt ? new Date(boss.completedAt) : undefined
    };
  } catch {
    return null;
  }
}

function saveLocalBossStep(boss: BossStep | null): void {
  if (boss) {
    localStorage.setItem(BOSS_STORAGE_KEY, JSON.stringify(boss));
  } else {
    localStorage.removeItem(BOSS_STORAGE_KEY);
  }
}

export function subscribeToBossStep(
  userId: string,
  onData: (boss: BossStep | null) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "bossStep");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const activeBosses = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
          completedAt: d.data().completedAt?.toDate()
        } as BossStep))
        .filter(b => b.status === "active")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const boss = activeBosses[0] || null;
      deactivateSovereignModeGlobal();
      if (boss) {
        saveLocalBossStep(boss);
        backupToLocal("boss_step", boss);
      }
      onData(boss);
    }, (error) => {
      console.error("Firebase BossStep Error:", error);
      activateSovereignModeGlobal("Usando datos locales del Paso Jefe");
      const localBoss = restoreFromLocal<BossStep>("boss_step") || getLocalBossStep();
      onData(localBoss?.status === "active" ? localBoss : null);
      onError(error);
    });
  } else {
    const boss = getLocalBossStep();
    onData(boss?.status === "active" ? boss : null);
    const handler = () => {
      const b = getLocalBossStep();
      onData(b?.status === "active" ? b : null);
    };
    window.addEventListener("boss-updated", handler);
    return () => window.removeEventListener("boss-updated", handler);
  }
}

export async function setBossStep(
  userId: string,
  text: string
): Promise<string> {
  const saveLocally = () => {
    const newId = `boss_${Date.now()}`;
    const boss: BossStep = {
      id: newId,
      text,
      userId,
      status: "active",
      createdAt: new Date()
    };
    saveLocalBossStep(boss);
    backupToLocal("boss_step", boss);
    window.dispatchEvent(new CustomEvent("boss-updated"));
    return newId;
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "bossStep");
      const { updateDoc, getDocs } = await import("firebase/firestore");
      const activeQuery = query(collection(db, path));
      const activeSnapshot = await getDocs(activeQuery);
      for (const d of activeSnapshot.docs) {
        if (d.data().status === "active") {
          await updateDoc(doc(db, path, d.id), { status: "defeated", completedAt: serverTimestamp() });
        }
      }
      const docRef = await addDoc(collection(db, path), {
        text,
        userId,
        status: "active",
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error guardando Paso Jefe en Firebase:", error);
      activateSovereignModeGlobal("Guardando Paso Jefe localmente");
      return saveLocally();
    }
  } else {
    return saveLocally();
  }
}

export async function defeatBossStep(userId: string): Promise<void> {
  const defeatLocally = () => {
    const boss = getLocalBossStep();
    if (boss && boss.status === "active") {
      boss.status = "defeated";
      boss.completedAt = new Date();
      saveLocalBossStep(boss);
      backupToLocal("boss_step", boss);
      window.dispatchEvent(new CustomEvent("boss-updated"));
    }
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "bossStep");
      const { updateDoc, getDocs } = await import("firebase/firestore");
      const activeQuery = query(collection(db, path));
      const activeSnapshot = await getDocs(activeQuery);
      for (const d of activeSnapshot.docs) {
        if (d.data().status === "active") {
          await updateDoc(doc(db, path, d.id), { status: "defeated", completedAt: serverTimestamp() });
        }
      }
    } catch (error) {
      console.error("Error derrotando Paso Jefe en Firebase:", error);
      activateSovereignModeGlobal("Guardando derrota localmente");
      defeatLocally();
    }
  } else {
    defeatLocally();
  }
}

export async function archiveBossStep(userId: string): Promise<void> {
  const archiveLocally = () => {
    const boss = getLocalBossStep();
    if (boss && boss.status === "active") {
      boss.status = "archived";
      boss.completedAt = new Date();
      saveLocalBossStep(boss);
      backupToLocal("boss_step", boss);
      window.dispatchEvent(new CustomEvent("boss-updated"));
    }
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "bossStep");
      const { updateDoc, getDocs } = await import("firebase/firestore");
      const activeQuery = query(collection(db, path));
      const activeSnapshot = await getDocs(activeQuery);
      for (const d of activeSnapshot.docs) {
        if (d.data().status === "active") {
          await updateDoc(doc(db, path, d.id), { status: "archived", completedAt: serverTimestamp() });
        }
      }
    } catch (error) {
      console.error("Error archivando Paso Jefe en Firebase:", error);
      activateSovereignModeGlobal("Guardando archivo localmente");
      archiveLocally();
    }
  } else {
    archiveLocally();
  }
}

// ========== BOSS STEPS HISTORY ========== 

export async function loadBossStepsHistory(userId: string, limit: number = 15): Promise<BossStep[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "bossStep");
      const snapshot = await getDocs(collection(db, path));
      const steps = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        completedAt: d.data().completedAt?.toDate()
      })) as BossStep[];
      steps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return steps.slice(0, limit);
    } catch (e) {
      console.warn("[bossStepsHistory] Firebase load falló:", e);
    }
  }
  const local = getLocalBossStep();
  return local ? [local] : [];
}

// ========== SOVEREIGNTY POINTS SEMANA (14 días) ==========

export type DailyPS = { isoDate: string; label: string; total: number };

export async function loadSovereigntyPointsSemana(userId: string): Promise<DailyPS[]> {
  const now = Date.now();
  const hace14 = now - 14 * 86400000;
  const dailyMap: Record<string, number> = {};

  // Initialize all 14 days to 0 so trend computation has complete windows
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    dailyMap[iso] = 0;
  }

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "sovereigntyPointsLog");
      const snapshot = await getDocs(collection(db, path));
      snapshot.docs.forEach(d => {
        const data = d.data();
        const ts: number = data.timestamp?.toMillis?.() || (data.timestamp?.seconds ? data.timestamp.seconds * 1000 : 0);
        if (ts >= hace14) {
          const iso = new Date(ts).toISOString().slice(0, 10);
          if (dailyMap[iso] !== undefined) {
            dailyMap[iso] = (dailyMap[iso] || 0) + (data.amount || 0);
          }
        }
      });
    } catch (e) {
      console.warn("[SPSemana] Firebase load falló:", e);
    }
  }

  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, total]) => ({
      isoDate: iso,
      label: new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
      total
    }));
}

export async function loadSovereigntyPuntosMes(userId: string): Promise<DailyPS[]> {
  const now = Date.now();
  const hace30 = now - 30 * 86400000;
  const dailyMap: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    dailyMap[iso] = 0;
  }

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "sovereigntyPointsLog");
      const snapshot = await getDocs(collection(db, path));
      snapshot.docs.forEach(d => {
        const data = d.data();
        const ts: number = data.timestamp?.toMillis?.() || (data.timestamp?.seconds ? data.timestamp.seconds * 1000 : 0);
        if (ts >= hace30) {
          const iso = new Date(ts).toISOString().slice(0, 10);
          if (dailyMap[iso] !== undefined) {
            dailyMap[iso] = (dailyMap[iso] || 0) + (data.amount || 0);
          }
        }
      });
    } catch (e) {
      console.warn("[SPMes] Firebase load falló:", e);
    }
  }

  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, total]) => ({
      isoDate: iso,
      label: new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
      total
    }));
}

// ========== CHISPAZOS (Radar del Subconsciente) ==========

export interface Chispazo {
  id: string;
  text: string;
  userId: string;
  isDeseoLoco: boolean;
  createdAt: Date;
}

const CHISPAZOS_STORAGE_KEY = "sistemicar_chispazos";

function getLocalChispazos(): Chispazo[] {
  try {
    const data = localStorage.getItem(CHISPAZOS_STORAGE_KEY);
    if (!data) return [];
    const items = JSON.parse(data) as Chispazo[];
    return items.map(c => ({
      ...c,
      createdAt: new Date(c.createdAt)
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function saveLocalChispazos(items: Chispazo[]): void {
  localStorage.setItem(CHISPAZOS_STORAGE_KEY, JSON.stringify(items));
}

export function subscribeToChispazos(
  userId: string,
  onData: (items: Chispazo[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "chispazos");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as Chispazo[];
      const sorted = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      deactivateSovereignModeGlobal();
      saveLocalChispazos(sorted);
      backupToLocal("chispazos", sorted);
      onData(sorted);
    }, (error) => {
      console.error("Firebase Chispazos Error:", error);
      activateSovereignModeGlobal("Usando datos locales de chispazos");
      const localData = restoreFromLocal<Chispazo[]>("chispazos") || getLocalChispazos();
      onData(localData);
      onError(error);
    });
  } else {
    onData(getLocalChispazos());
    const handler = () => onData(getLocalChispazos());
    window.addEventListener("chispazos-updated", handler);
    return () => window.removeEventListener("chispazos-updated", handler);
  }
}

export async function addChispazo(
  userId: string,
  text: string,
  isDeseoLoco: boolean = false
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "chispazos");
    const docRef = await addDoc(collection(db, path), {
      text,
      userId,
      isDeseoLoco,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const items = getLocalChispazos();
    const newId = `chispazo_${Date.now()}`;
    const newItem: Chispazo = {
      id: newId,
      text,
      userId,
      isDeseoLoco,
      createdAt: new Date()
    };
    items.unshift(newItem);
    saveLocalChispazos(items);
    window.dispatchEvent(new CustomEvent("chispazos-updated"));
    return newId;
  }
}

export async function toggleDeseoLoco(userId: string, chispazoId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "chispazos");
    const { updateDoc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, path, chispazoId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const current = snapshot.data().isDeseoLoco || false;
      await updateDoc(docRef, { isDeseoLoco: !current });
    }
  } else {
    const items = getLocalChispazos().map(c => 
      c.id === chispazoId ? { ...c, isDeseoLoco: !c.isDeseoLoco } : c
    );
    saveLocalChispazos(items);
    window.dispatchEvent(new CustomEvent("chispazos-updated"));
  }
}

export async function deleteChispazo(userId: string, chispazoId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "chispazos");
    await deleteDoc(doc(db, path, chispazoId));
  } else {
    const items = getLocalChispazos().filter(c => c.id !== chispazoId);
    saveLocalChispazos(items);
    window.dispatchEvent(new CustomEvent("chispazos-updated"));
  }
}

// ========== ANÁLISIS DEL SUBCONSCIENTE ==========

export interface SubconsciousAnalysis {
  id: string;
  patterns: {
    category: string;
    energy: number;
    description: string;
  }[];
  chispazoCount: number;
  userId: string;
  createdAt: Date;
}

const ANALYSIS_STORAGE_KEY = "sistemicar_subconscious_analysis";

function getLocalAnalysis(): SubconsciousAnalysis | null {
  try {
    const data = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!data) return null;
    const analysis = JSON.parse(data) as SubconsciousAnalysis;
    return { ...analysis, createdAt: new Date(analysis.createdAt) };
  } catch {
    return null;
  }
}

function saveLocalAnalysis(analysis: SubconsciousAnalysis): void {
  localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
}

export function subscribeToSubconsciousAnalysis(
  userId: string,
  onData: (analysis: SubconsciousAnalysis | null) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "subconsciente_analisis");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        onData(null);
      } else {
        // Sort client-side and get most recent
        const sorted = snapshot.docs
          .map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date()
          }) as SubconsciousAnalysis)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        onData(sorted[0] || null);
      }
    }, (err) => {
      console.error("Error listening to analysis:", err);
      onData(getLocalAnalysis());
    });
  } else {
    onData(getLocalAnalysis());
    const handler = () => onData(getLocalAnalysis());
    window.addEventListener("analysis-updated", handler);
    return () => window.removeEventListener("analysis-updated", handler);
  }
}

export async function saveSubconsciousAnalysis(
  userId: string,
  patterns: { category: string; energy: number; description: string }[],
  chispazoCount: number
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "subconsciente_analisis");
    const docRef = await addDoc(collection(db, path), {
      patterns,
      chispazoCount,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const newId = `analysis_${Date.now()}`;
    const analysis: SubconsciousAnalysis = {
      id: newId,
      patterns,
      chispazoCount,
      userId,
      createdAt: new Date()
    };
    saveLocalAnalysis(analysis);
    window.dispatchEvent(new CustomEvent("analysis-updated"));
    return newId;
  }
}

// ========== MISIONES (Historia de Vehículos) ==========

export interface MisionScores {
  enfoque: number;
  conflicto: number;
  pasos: number;
  limite: number;
}

export interface Mision {
  id: string;
  titulo: string;
  estado: "cumplido" | "archivado";
  scores: MisionScores;
  soberaniaMomento: number;
  comentario: string | null;
  userId: string;
  createdAt: Date;
}

const MISIONES_KEY = "sistemicar_misiones";

function getLocalMisiones(): Mision[] {
  try {
    const data = localStorage.getItem(MISIONES_KEY);
    if (!data) return [];
    const misiones = JSON.parse(data) as Mision[];
    return misiones.map(m => ({
      ...m,
      createdAt: new Date(m.createdAt)
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function saveLocalMisiones(misiones: Mision[]): void {
  localStorage.setItem(MISIONES_KEY, JSON.stringify(misiones));
}

export function subscribeToMisiones(
  userId: string,
  onData: (misiones: Mision[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "misiones");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as Mision[];
      // Sort client-side to avoid Firebase index requirement
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(data);
    }, (err) => {
      console.error("Error listening to misiones:", err);
      onData(getLocalMisiones());
    });
  } else {
    onData(getLocalMisiones());
    const handler = () => onData(getLocalMisiones());
    window.addEventListener("misiones-updated", handler);
    return () => window.removeEventListener("misiones-updated", handler);
  }
}

export async function saveMision(
  userId: string,
  mision: Omit<Mision, "id" | "createdAt" | "userId">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "misiones");
    const docRef = await addDoc(collection(db, path), {
      ...mision,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const misiones = getLocalMisiones();
    const newId = `mision_${Date.now()}`;
    const newMision: Mision = {
      ...mision,
      id: newId,
      userId,
      createdAt: new Date()
    };
    misiones.unshift(newMision);
    saveLocalMisiones(misiones);
    window.dispatchEvent(new CustomEvent("misiones-updated"));
    return newId;
  }
}

// ========== PROGRESIÓN DE USUARIO (Embudo de Iniciación) ==========

export type UserRank = "iniciado" | "guerrero" | "operador" | "arquitecto" | "soberano_operativo" | "soberano";

const OWNER_EMAIL = "gilsonarevalo.leo@gmail.com";

export function hasDesglosadorAccess(subscriptionPlan?: string | null, email?: string | null): boolean {
  if (email?.toLowerCase() === OWNER_EMAIL) return true;
  return subscriptionPlan === "soberano_operativo" || subscriptionPlan === "soberano";
}

export function hasArquitectoAccess(subscriptionPlan?: string | null, email?: string | null): boolean {
  if (email?.toLowerCase() === OWNER_EMAIL) return true;
  return subscriptionPlan === "arquitecto" || subscriptionPlan === "soberano_operativo" || subscriptionPlan === "soberano";
}

export function hasPuntoCeroAccess(subscriptionPlan?: string | null, email?: string | null): boolean {
  if (email?.toLowerCase() === OWNER_EMAIL) return true;
  return subscriptionPlan === "soberano_operativo" || subscriptionPlan === "soberano";
}

// ========== MODOS DE CLIENTE (Segmentación para Gemini) ==========
// GRATUITO: Usuario nuevo, objetivo = retención
// PAGO: Suscriptor, objetivo = prepararlo para ser guerrero (85% en Acervo)
// RETO: Completó el reto de guerrero, objetivo = ofrecerle el negocio 30%
export type ClientMode = "gratuito" | "pago" | "reto";

export function getClientMode(progression: UserProgression): ClientMode {
  // Si completó el reto de guerrero → Modo RETO (ofrecerle negocio)
  if (progression.warriorChallengeCompleted) {
    return "reto";
  }
  
  // Si tiene rango operador o arquitecto → Modo PAGO (prepararlo para guerrero)
  if (progression.rank === "operador" || progression.rank === "arquitecto") {
    return "pago";
  }
  
  // Si tiene más de 5 días de registro y está activo → considera como PAGO
  if (progression.registrationDays >= 5 && progression.totalMissionsCompleted >= 3) {
    return "pago";
  }
  
  // Por defecto → Modo GRATUITO (retención)
  return "gratuito";
}

export interface UserProgression {
  id: string;
  rank: UserRank;
  points: number;
  consecutiveMissionStreak: number;
  totalMissionsCompleted: number;
  registrationDays: number;
  lastActivityDate: Date | null;
  cooldownUntil: Date | null;
  warriorChallengeUnlocked: boolean;
  warriorChallengeCompleted: boolean;
  allianceProposalShown: boolean;
  allianceProposalUnlocked: boolean;
  hopeAverages: { date: string; average: number }[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  totalCP: number;
  momentum: number;
  bestDayCP: number;
  afiliadoActivo: boolean;
  referralCode?: string;
  sovereigntyPoints: number;
  ptsEspejo: number;
  ptsPlanificacion: number;
  ptsDeposito: number;
  subscriptionPlan?: string | null;
}

const PROGRESSION_KEY = "sistemicar_progression";

/** Con varios docs en `progression` (p. ej. migraciones), evitar tomar uno arbitrario. */
function pickLatestProgressionDoc(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>
): { id: string; data: () => Record<string, unknown> } | null {
  if (!docs.length) return null;
  const toMs = (u: unknown): number => {
    if (u && typeof (u as { toMillis?: () => number }).toMillis === "function") return (u as { toMillis: () => number }).toMillis();
    if (u instanceof Date) return u.getTime();
    return 0;
  };
  return [...docs].sort((a, b) => {
    const da = a.data();
    const db = b.data();
    const ta = toMs(da.updatedAt) || toMs(da.createdAt) || 0;
    const tb = toMs(db.updatedAt) || toMs(db.createdAt) || 0;
    return tb - ta;
  })[0];
}

function maxSovereigntyAcrossRemoteDocs(
  docs: Array<{ data: () => Record<string, unknown> }>
): { sovereignty: number; ptsE: number; ptsP: number; ptsD: number; totalCP: number } {
  let sovereignty = 0;
  let ptsE = 0;
  let ptsP = 0;
  let ptsD = 0;
  let totalCP = 0;
  for (const d of docs) {
    const r = d.data();
    sovereignty = Math.max(sovereignty, (r.sovereigntyPoints ?? 0) as number);
    ptsE = Math.max(ptsE, (r.ptsEspejo ?? 0) as number);
    ptsP = Math.max(ptsP, (r.ptsPlanificacion ?? 0) as number);
    ptsD = Math.max(ptsD, (r.ptsDeposito ?? 0) as number);
    totalCP = Math.max(totalCP, (r.totalCP ?? 0) as number);
  }
  return { sovereignty, ptsE, ptsP, ptsD, totalCP };
}

function getDefaultProgression(userId: string): UserProgression {
  return {
    id: `prog_${Date.now()}`,
    rank: "iniciado",
    points: 0,
    consecutiveMissionStreak: 0,
    totalMissionsCompleted: 0,
    registrationDays: 0,
    lastActivityDate: null,
    cooldownUntil: null,
    warriorChallengeUnlocked: false,
    warriorChallengeCompleted: false,
    allianceProposalShown: false,
    allianceProposalUnlocked: false,
    hopeAverages: [],
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalCP: 0,
    momentum: 50,
    bestDayCP: 0,
    afiliadoActivo: false,
    referralCode: undefined,
    sovereigntyPoints: 0,
    ptsEspejo: 0,
    ptsPlanificacion: 0,
    ptsDeposito: 0
  };
}

function getLocalProgression(userId: string): UserProgression {
  try {
    const data = localStorage.getItem(PROGRESSION_KEY);
    if (!data) return getDefaultProgression(userId);
    const prog = JSON.parse(data) as UserProgression;
    return {
      ...prog,
      lastActivityDate: prog.lastActivityDate ? new Date(prog.lastActivityDate) : null,
      cooldownUntil: prog.cooldownUntil ? new Date(prog.cooldownUntil) : null,
      createdAt: new Date(prog.createdAt),
      updatedAt: new Date(prog.updatedAt)
    };
  } catch {
    return getDefaultProgression(userId);
  }
}

function saveLocalProgression(prog: UserProgression): void {
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(prog));
  window.dispatchEvent(new CustomEvent("progression-updated"));
}

export function subscribeToProgression(
  userId: string,
  onData: (prog: UserProgression) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "progression");
    const q = query(collection(db, path));
    const applySnapshot = async (snapshot: { empty: boolean; docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
      if (snapshot.empty) {
        const defaultProg = getDefaultProgression(userId);
        const localProg = getLocalProgression(userId);
        const localBelongsToUser = !localProg.userId || localProg.userId === userId;
        const localHasMeaningfulProgress =
          localBelongsToUser &&
          ((localProg.totalCP ?? 0) > 0 ||
            (localProg.sovereigntyPoints ?? 0) > 0 ||
            (localProg.ptsEspejo ?? 0) + (localProg.ptsPlanificacion ?? 0) + (localProg.ptsDeposito ?? 0) > 0 ||
            (localProg.totalMissionsCompleted ?? 0) > 0);
        if (localHasMeaningfulProgress) {
          deactivateSovereignModeGlobal();
          backupToLocal("progression", localProg);
          onData(localProg);
        } else {
          onData(defaultProg);
        }
      } else {
        if (snapshot.docs.length > 1) {
          console.warn(`[subscribeToProgression] ${snapshot.docs.length} documentos en progression — usando el más reciente y fusionando máximos de PS/módulos.`);
        }
        const d = pickLatestProgressionDoc(snapshot.docs);
        if (!d) {
          onData(getDefaultProgression(userId));
          return;
        }
        const data = d.data();
        const remoteMax = maxSovereigntyAcrossRemoteDocs(snapshot.docs);
        const localProg = getLocalProgression(userId);
        const localSp = localProg.sovereigntyPoints ?? 0;
        const sovereigntyPoints = Math.max(remoteMax.sovereignty, localSp);
        const ptsEspejo = Math.max(remoteMax.ptsE, localProg.ptsEspejo ?? 0);
        const ptsPlanificacion = Math.max(remoteMax.ptsP, localProg.ptsPlanificacion ?? 0);
        const ptsDeposito = Math.max(remoteMax.ptsD, localProg.ptsDeposito ?? 0);
        const totalCP = Math.max(remoteMax.totalCP, localProg.totalCP ?? 0);
        const prog = {
          id: d.id,
          ...data,
          sovereigntyPoints,
          ptsEspejo,
          ptsPlanificacion,
          ptsDeposito,
          totalCP,
          lastActivityDate: data.lastActivityDate?.toDate() || null,
          cooldownUntil: data.cooldownUntil?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as UserProgression;
        deactivateSovereignModeGlobal();
        backupToLocal("progression", prog);
        saveLocalProgression(prog);
        onData(prog);
      }
    };
    const unsubFs = onSnapshot(q, (snapshot) => {
      void applySnapshot(snapshot);
    }, (error) => {
      console.error("Firebase Progression Error:", error);
      activateSovereignModeGlobal("Error de conexión. Usando datos locales.");
      const localProg = restoreFromLocal<UserProgression>("progression") || getLocalProgression(userId);
      onData(localProg);
      onError(error);
    });
    const onLocalProgressionRefresh = () => {
      onData(getLocalProgression(userId));
    };
    window.addEventListener("progression-updated", onLocalProgressionRefresh);
    return () => {
      unsubFs();
      window.removeEventListener("progression-updated", onLocalProgressionRefresh);
    };
  } else {
    onData(getLocalProgression(userId));
    const handler = () => onData(getLocalProgression(userId));
    window.addEventListener("progression-updated", handler);
    return () => window.removeEventListener("progression-updated", handler);
  }
}

export async function updateProgression(
  userId: string,
  updates: Partial<Omit<UserProgression, "id" | "userId" | "createdAt">>
): Promise<void> {
  const saveLocally = () => {
    const prog = getLocalProgression(userId);
    const updated = { ...prog, ...updates, updatedAt: new Date() };
    saveLocalProgression(updated);
    backupToLocal("progression", updated);
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "progression");
      const { updateDoc, getDocs, setDoc } = await import("firebase/firestore");
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const newProg = { ...getDefaultProgression(userId), ...updates, updatedAt: serverTimestamp() };
        await setDoc(doc(db, path, `prog_${Date.now()}`), {
          ...newProg,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const latest = pickLatestProgressionDoc(snapshot.docs);
        if (!latest) {
          const newProg = { ...getDefaultProgression(userId), ...updates, updatedAt: serverTimestamp() };
          await setDoc(doc(db, path, `prog_${Date.now()}`), {
            ...newProg,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(doc(db, path, latest.id), {
            ...updates,
            updatedAt: serverTimestamp()
          });
        }
      }
      saveLocally();
    } catch (error) {
      console.error("Error actualizando progresión en Firebase:", error);
      activateSovereignModeGlobal("Guardando localmente. Sin conexión a la nube.");
      saveLocally();
    }
  } else {
    saveLocally();
  }
}

export type ModuleKey = "espejo" | "planificacion" | "deposito";

const MODULE_FIELD_MAP: Record<ModuleKey, keyof UserProgression> = {
  espejo: "ptsEspejo",
  planificacion: "ptsPlanificacion",
  deposito: "ptsDeposito"
};

export async function incrementModulePoints(userId: string, module: ModuleKey, amount: number = 1): Promise<void> {
  const rounded = Math.round(amount);
  if (rounded <= 0) return;
  const field = MODULE_FIELD_MAP[module];

  // Locally: optimistic update
  const prog = getLocalProgression(userId);
  const current = (prog[field] as number) || 0;
  const updated = { ...prog, [field]: current + rounded, updatedAt: new Date() };
  saveLocalProgression(updated);

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "progression");
      const { increment: fbIncrement, updateDoc, getDocs, setDoc } = await import("firebase/firestore");
      const snapshot = await getDocs(query(collection(db, path)));
      if (snapshot.empty) {
        // Create doc with the increment value as absolute
        const newProg = { ...getDefaultProgression(userId), [field]: rounded, updatedAt: serverTimestamp() };
        await setDoc(doc(db, path, `prog_${Date.now()}`), {
          ...newProg,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const latest = pickLatestProgressionDoc(snapshot.docs);
        const targetId = latest?.id ?? snapshot.docs[0].id;
        // Atomic field-level increment — no read-modify-write race condition
        await updateDoc(doc(db, path, targetId), {
          [field]: fbIncrement(rounded),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("[incrementModulePoints] Firebase error — local already updated:", error);
    }
  }
}

export async function recordActivity(userId: string): Promise<{
  newDay: boolean;
  registrationDays: number;
  warriorUnlocked: boolean;
}> {
  const prog = getLocalProgression(userId);
  const today = new Date().toDateString();
  const lastActivity = prog.lastActivityDate?.toDateString();
  
  if (lastActivity === today) {
    return { 
      newDay: false, 
      registrationDays: prog.registrationDays,
      warriorUnlocked: prog.warriorChallengeUnlocked 
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = lastActivity === yesterday.toDateString();
  
  const newRegDays = wasYesterday ? prog.registrationDays + 1 : 1;
  const warriorUnlocked = newRegDays >= 5 && !prog.warriorChallengeCompleted;
  
  await updateProgression(userId, {
    registrationDays: newRegDays,
    lastActivityDate: new Date(),
    cooldownUntil: null,
    warriorChallengeUnlocked: warriorUnlocked || prog.warriorChallengeUnlocked
  });

  return { 
    newDay: true, 
    registrationDays: newRegDays,
    warriorUnlocked: warriorUnlocked && !prog.warriorChallengeUnlocked
  };
}

export async function recordMissionResult(
  userId: string,
  isHardMissionSuccess: boolean,
  missionCompleted: boolean,
  points: number = 0
): Promise<{
  streak: number;
  challengeCompleted: boolean;
  newRank: UserRank | null;
}> {
  const prog = getLocalProgression(userId);
  
  let newStreak = prog.consecutiveMissionStreak;
  if (isHardMissionSuccess) {
    newStreak = prog.consecutiveMissionStreak + 1;
  } else if (missionCompleted) {
    newStreak = 0;
  }
  
  const newTotal = missionCompleted ? prog.totalMissionsCompleted + 1 : prog.totalMissionsCompleted;
  const newPoints = prog.points + points;
  
  const challengeCompleted = !prog.warriorChallengeCompleted && 
    prog.warriorChallengeUnlocked && 
    newStreak >= 3;
  
  let newRank: UserRank | null = null;
  if (challengeCompleted && prog.rank === "iniciado") {
    newRank = "guerrero";
  } else if (newPoints >= 500 && prog.rank !== "arquitecto") {
    newRank = "arquitecto";
  } else if (newPoints >= 50 && prog.rank === "guerrero") {
    newRank = "operador";
  }

  await updateProgression(userId, {
    consecutiveMissionStreak: newStreak,
    totalMissionsCompleted: newTotal,
    points: newPoints,
    ...(challengeCompleted && { warriorChallengeCompleted: true }),
    ...(newRank && { rank: newRank })
  });

  return { streak: newStreak, challengeCompleted, newRank };
}

export async function recordHopeAverage(
  userId: string,
  average: number
): Promise<{ allianceUnlocked: boolean }> {
  const prog = getLocalProgression(userId);
  const today = new Date().toISOString().split("T")[0];
  
  const hopeAverages = prog.hopeAverages.filter(h => h.date !== today);
  hopeAverages.push({ date: today, average });
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentAverages = hopeAverages
    .filter(h => new Date(h.date) >= sevenDaysAgo)
    .slice(-7);
  
  const hasConsistentHope = recentAverages.length >= 7 &&
    recentAverages.every(h => h.average >= 85);
  
  const allianceUnlocked = hasConsistentHope && 
    prog.totalMissionsCompleted >= 10 && 
    !prog.allianceProposalUnlocked;

  await updateProgression(userId, {
    hopeAverages: recentAverages,
    ...(allianceUnlocked && { allianceProposalUnlocked: true })
  });

  return { allianceUnlocked };
}

export async function checkCooldown(userId: string): Promise<{
  inCooldown: boolean;
  daysInactive: number;
}> {
  const prog = getLocalProgression(userId);
  
  if (prog.cooldownUntil && new Date() < prog.cooldownUntil) {
    return { inCooldown: true, daysInactive: 0 };
  }
  
  if (!prog.lastActivityDate) {
    return { inCooldown: false, daysInactive: 0 };
  }
  
  const now = new Date();
  const diffMs = now.getTime() - prog.lastActivityDate.getTime();
  const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (daysInactive >= 3 && prog.rank === "iniciado") {
    const cooldownEnd = new Date();
    cooldownEnd.setDate(cooldownEnd.getDate() + 1);
    
    await updateProgression(userId, {
      cooldownUntil: cooldownEnd,
      consecutiveMissionStreak: 0,
      registrationDays: 0
    });
    
    return { inCooldown: true, daysInactive };
  }
  
  return { inCooldown: false, daysInactive };
}

export async function markAllianceProposalShown(userId: string): Promise<void> {
  await updateProgression(userId, { allianceProposalShown: true });
}

// ========== PUNTOS DE SOBERANÍA ==========

export interface SovereigntyPointsLog {
  id: string;
  amount: number;
  source: string;
  timestamp: Date;
}

const SP_LOG_KEY = "sistemicar_sp_log";

function getLocalSPLog(): SovereigntyPointsLog[] {
  try {
    const data = localStorage.getItem(SP_LOG_KEY);
    if (!data) return [];
    return JSON.parse(data).map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp)
    }));
  } catch {
    return [];
  }
}

function saveLocalSPLog(logs: SovereigntyPointsLog[]): void {
  localStorage.setItem(SP_LOG_KEY, JSON.stringify(logs));
}

export async function awardSovereigntyPoints(
  userId: string,
  amount: number,
  source?: string
): Promise<{ newTotal: number }> {
  const roundedAmount = Math.round(amount);
  const progBefore = getLocalProgression(userId);
  if (roundedAmount <= 0) return { newTotal: progBefore.sovereigntyPoints || 0 };

  const currentPoints = progBefore.sovereigntyPoints || 0;
  const newTotal = currentPoints + roundedAmount;

  // Guardar log de puntos con timestamp para consultas diarias
  const logEntry: SovereigntyPointsLog = {
    id: `sp_${Date.now()}`,
    amount: roundedAmount,
    source: source || "Sistema",
    timestamp: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "sovereigntyPointsLog");
      await addDoc(collection(db, path), {
        ...logEntry,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving SP log to Firebase:", error);
      const logs = getLocalSPLog();
      logs.unshift(logEntry);
      saveLocalSPLog(logs);
    }
  } else {
    const logs = getLocalSPLog();
    logs.unshift(logEntry);
    saveLocalSPLog(logs);
  }

  if (isFirebaseConfigured() && db) {
    try {
      const { updateDoc, getDocs, increment } = await import("firebase/firestore");
      const pathProg = getPrivatePath(userId, "progression");
      const snap = await getDocs(query(collection(db, pathProg)));
      if (snap.empty) {
        await updateProgression(userId, { sovereigntyPoints: newTotal });
      } else {
        const latest = pickLatestProgressionDoc(snap.docs);
        const targetId = latest?.id ?? snap.docs[0].id;
        await updateDoc(doc(db, pathProg, targetId), {
          sovereigntyPoints: increment(roundedAmount),
          updatedAt: serverTimestamp()
        });
        const localProg = getLocalProgression(userId);
        const mergedSp = (localProg.sovereigntyPoints || 0) + roundedAmount;
        const merged = { ...localProg, sovereigntyPoints: mergedSp, updatedAt: new Date() };
        saveLocalProgression(merged);
        backupToLocal("progression", merged);
      }
    } catch (error) {
      console.error("[awardSovereigntyPoints] Error actualizando progresión:", error);
      await updateProgression(userId, { sovereigntyPoints: newTotal });
    }
  } else {
    await updateProgression(userId, { sovereigntyPoints: newTotal });
  }

  window.dispatchEvent(new CustomEvent("sovereignty-points-awarded", {
    detail: { amount: roundedAmount, source, newTotal: getLocalProgression(userId).sovereigntyPoints || 0 }
  }));

  return { newTotal: getLocalProgression(userId).sovereigntyPoints || 0 };
}

// Calcular inicio del día en Lima (UTC-5) - Función helper
function getLimaDayStart(): Date {
  // Lima es UTC-5 (sin horario de verano)
  const LIMA_OFFSET_HOURS = -5;
  
  // Hora actual en UTC
  const nowUtc = Date.now();
  
  // Hora actual en Lima (UTC - 5 horas)
  const nowLimaMs = nowUtc + (LIMA_OFFSET_HOURS * 60 * 60 * 1000);
  const nowLima = new Date(nowLimaMs);
  
  // Calcular medianoche UTC de hoy en Lima
  // Ejemplo: si en Lima son las 22:48 del día 1, el inicio del día Lima fue hace 22h 48m
  const limaHours = nowLima.getUTCHours();
  const limaMinutes = nowLima.getUTCMinutes();
  const limaSeconds = nowLima.getUTCSeconds();
  const limaMs = nowLima.getUTCMilliseconds();
  
  // Restar las horas/minutos/segundos transcurridos para llegar a medianoche Lima
  const msSinceMidnightLima = (limaHours * 60 * 60 * 1000) + (limaMinutes * 60 * 1000) + (limaSeconds * 1000) + limaMs;
  const midnightLimaUtcMs = nowUtc - msSinceMidnightLima;
  
  console.log(`[getLimaDayStart] Ahora UTC: ${new Date(nowUtc).toISOString()}`);
  console.log(`[getLimaDayStart] Ahora Lima: ${nowLima.toISOString()} (simulado como UTC)`);
  console.log(`[getLimaDayStart] Medianoche Lima (UTC timestamp): ${new Date(midnightLimaUtcMs).toISOString()}`);
  
  return new Date(midnightLimaUtcMs);
}

// Obtener timestamp en milisegundos desde cualquier formato
function getTimestampMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts === 'object' && 'seconds' in ts) {
    return ts.seconds * 1000;
  }
  if (ts instanceof Date) {
    return ts.getTime();
  }
  return new Date(ts).getTime();
}

// Obtener puntos del día actual (zona horaria America/Lima)
export async function getDailyPoints(userId: string): Promise<{
  total: number;
  logs: SovereigntyPointsLog[];
}> {
  const todayLima = getLimaDayStart();
  const todayStartMs = todayLima.getTime();
  
  console.log(`[getDailyPoints] Inicio del día Lima: ${todayLima.toISOString()}`);
  console.log(`[getDailyPoints] Timestamp inicio: ${todayStartMs}`);
  
  let allLogs: SovereigntyPointsLog[] = [];
  
  // 1. Obtener logs del sovereigntyPointsLog (nuevos registros)
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "sovereigntyPointsLog");
      console.log(`[getDailyPoints] SPLogsPath: ${path}`);
      const snapshot = await getDocs(collection(db, path));
      console.log(`[getDailyPoints] SPLogs en Firebase: ${snapshot.docs.length}`);
      snapshot.docs.forEach(d => {
        const data = d.data();
        const ts = getTimestampMs(data.timestamp);
        console.log(`[getDailyPoints] SPLog ts=${ts}, start=${todayStartMs}, diff=${ts - todayStartMs}`);
        if (ts >= todayStartMs) {
          allLogs.push({
            id: d.id,
            amount: data.amount || 0,
            source: data.source || "Sistema",
            timestamp: data.timestamp?.toDate() || new Date()
          });
        }
      });
    } catch (error) {
      console.error("[getDailyPoints] Error SP logs:", error);
    }
    
    // 2. TAMBIÉN buscar en energyLogs del día (tienen timestamp y otorgan puntos)
    try {
      const energyPath = getPrivatePath(userId, "energyLogs");
      console.log(`[getDailyPoints] EnergyPath: ${energyPath}`);
      const energySnapshot = await getDocs(collection(db, energyPath));
      console.log(`[getDailyPoints] EnergyLogs en Firebase: ${energySnapshot.docs.length}`);
      energySnapshot.docs.forEach(d => {
        const data = d.data();
        const ts = getTimestampMs(data.timestamp);
        if (ts >= todayStartMs && data.points > 0) {
          // Evitar duplicados
          const sourceId = `energy_${d.id}`;
          if (!allLogs.find(l => l.id === sourceId)) {
            allLogs.push({
              id: sourceId,
              amount: data.points || 0,
              source: `Registro: ${data.type === "positive" ? "Energía+" : data.type === "negative" ? "Tensión" : "Neutral"}`,
              timestamp: data.timestamp?.toDate() || new Date()
            });
          }
        }
      });
    } catch (error) {
      console.error("[getDailyPoints] Error energy logs:", error);
    }
    
    // 3. Buscar vehículos completados hoy
    try {
      const vehiclesPath = getPrivatePath(userId, "vehicles");
      const vehiclesSnapshot = await getDocs(collection(db, vehiclesPath));
      vehiclesSnapshot.docs.forEach(d => {
        const data = d.data();
        const ts = getTimestampMs(data.completedAt || data.updatedAt);
        if (ts >= todayStartMs && (data.status === "cumplido" || data.status === "archivado")) {
          // Calcular CP potencial del vehículo
          const ejes = data.ejes || {};
          let vehiclePoints = 0;
          const trifectaToBase = (t: string) => t === "reto" ? 10 : t === "intermedio" ? 5 : t === "blando" ? 2 : 0;
          Object.values(ejes).forEach((eje: any) => {
            vehiclePoints += trifectaToBase(eje?.trifecta || "omitir");
          });
          if (data.status === "cumplido") vehiclePoints = Math.round(vehiclePoints * 1.5);
          if (data.status === "archivado") vehiclePoints = Math.round(vehiclePoints * 0.3);
          
          if (vehiclePoints > 0) {
            const sourceId = `vehicle_${d.id}`;
            if (!allLogs.find(l => l.id === sourceId)) {
              allLogs.push({
                id: sourceId,
                amount: vehiclePoints,
                source: `Vehículo: ${data.titulo || "Misión"}`,
                timestamp: new Date(ts)
              });
            }
          }
        }
      });
    } catch (error) {
      console.error("[getDailyPoints] Error vehicles:", error);
    }
    
    // 4. Buscar entradas de alquimia del día (+2 PS cada una)
    try {
      const alquimiaPath = getPrivatePath(userId, "alquimia");
      const alquimiaSnapshot = await getDocs(collection(db, alquimiaPath));
      console.log(`[getDailyPoints] Alquimia en Firebase: ${alquimiaSnapshot.docs.length}`);
      alquimiaSnapshot.docs.forEach(d => {
        const data = d.data();
        const ts = getTimestampMs(data.timestamp || data.createdAt);
        if (ts >= todayStartMs) {
          const sourceId = `alquimia_${d.id}`;
          if (!allLogs.find(l => l.id === sourceId)) {
            allLogs.push({
              id: sourceId,
              amount: 2,
              source: `Alquimia: ${data.type || "Reflexión"}`,
              timestamp: new Date(ts)
            });
          }
        }
      });
    } catch (error) {
      console.error("[getDailyPoints] Error alquimia:", error);
    }
    
    // 5. Buscar sesiones de meditación del día (+3 PS cada una)
    try {
      const meditationPath = getPrivatePath(userId, "meditationSessions");
      const meditationSnapshot = await getDocs(collection(db, meditationPath));
      console.log(`[getDailyPoints] Meditación en Firebase: ${meditationSnapshot.docs.length}`);
      meditationSnapshot.docs.forEach(d => {
        const data = d.data();
        const ts = getTimestampMs(data.timestamp || data.completedAt);
        if (ts >= todayStartMs) {
          const sourceId = `meditation_${d.id}`;
          if (!allLogs.find(l => l.id === sourceId)) {
            allLogs.push({
              id: sourceId,
              amount: 3,
              source: `Meditación: ${data.duration || 0}min`,
              timestamp: new Date(ts)
            });
          }
        }
      });
    } catch (error) {
      console.error("[getDailyPoints] Error meditation:", error);
    }
    
    // 6. Buscar hopeLogs del día (+1 PS cada uno)
    try {
      const hopePath = getPrivatePath(userId, "hopeLogs");
      const hopeSnapshot = await getDocs(collection(db, hopePath));
      console.log(`[getDailyPoints] HopeLogs en Firebase: ${hopeSnapshot.docs.length}`);
      hopeSnapshot.docs.forEach(d => {
        const data = d.data();
        const ts = getTimestampMs(data.timestamp || data.createdAt);
        if (ts >= todayStartMs) {
          const sourceId = `hope_${d.id}`;
          if (!allLogs.find(l => l.id === sourceId)) {
            allLogs.push({
              id: sourceId,
              amount: 1,
              source: "Registro de Esperanza",
              timestamp: new Date(ts)
            });
          }
        }
      });
    } catch (error) {
      console.error("[getDailyPoints] Error hopeLogs:", error);
    }
  }
  
  // Fallback local
  const localLogs = getLocalSPLog().filter(l => l.timestamp.getTime() >= todayStartMs);
  localLogs.forEach(l => {
    if (!allLogs.find(existing => existing.id === l.id)) {
      allLogs.push(l);
    }
  });
  
  const total = allLogs.reduce((sum, log) => sum + log.amount, 0);
  
  console.log(`[getDailyPoints] Usuario: ${userId}`);
  console.log(`[getDailyPoints] Logs encontrados hoy: ${allLogs.length}`);
  console.log(`[getDailyPoints] TOTAL PS HOY: ${total}`);
  allLogs.forEach(l => console.log(`  - ${l.source}: +${l.amount}`));
  
  return { total, logs: allLogs };
}

// Subscribe to daily points changes - usa getDailyPoints para consistencia
export function subscribeToDailyPoints(
  userId: string,
  onData: (data: { total: number; logs: SovereigntyPointsLog[] }) => void,
  onError: (error: Error) => void
): () => void {
  // Función que obtiene todos los puntos del día
  const fetchAllDailyPoints = async () => {
    try {
      const result = await getDailyPoints(userId);
      onData(result);
    } catch (error) {
      onError(error as Error);
    }
  };
  
  // Cargar inicialmente
  fetchAllDailyPoints();
  
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "sovereigntyPointsLog");
    
    // Escuchar cambios en sovereigntyPointsLog y recargar todos los puntos
    return onSnapshot(collection(db, path),
      () => {
        fetchAllDailyPoints();
      },
      onError
    );
  } else {
    const handler = () => fetchAllDailyPoints();
    window.addEventListener("sovereignty-points-awarded", handler);
    return () => window.removeEventListener("sovereignty-points-awarded", handler);
  }
}

export function getSovereigntyPointsBreakdown() {
  return {
    introspection: {
      espejo: { fields: 4, pointsPerField: 2, maxPoints: 8 },
      deposito: { fields: 4, pointsPerField: 2, maxPoints: 8 },
      radar: { fields: 1, pointsPerField: 2, maxPoints: 2 }
    },
    planning: {
      basesByAxis: { enfoque: 5, conflicto: 10, pasos: 15, alcance: 20 },
      multipliers: { omitir: 0.25, blando: 0.50, intermedio: 0.75, reto: 1.0 },
      panoramaPoints: 1
    },
    archiving: {
      maxRecoveryPercent: 0.50,
      justificationBonus: 4
    }
  };
}

export function calculateVehiclePoints(
  axes: { enfoque?: string; conflicto?: string; pasos?: string; alcance?: string },
  isPanorama: boolean = false
): number {
  if (isPanorama) return 1;
  
  const breakdown = getSovereigntyPointsBreakdown();
  const bases = breakdown.planning.basesByAxis;
  const multipliers = breakdown.planning.multipliers;
  
  let totalPoints = 0;
  
  const axisKeys = ["enfoque", "conflicto", "pasos", "alcance"] as const;
  for (const axis of axisKeys) {
    const detail = axes[axis] as keyof typeof multipliers | undefined;
    if (detail && detail !== "omitir") {
      const basePoints = bases[axis];
      const multiplier = multipliers[detail] || 0.25;
      totalPoints += basePoints * multiplier;
    }
  }
  
  return Math.round(totalPoints);
}

export function calculateArchivePoints(
  potentialPoints: number,
  justifications: { enfoque?: string; conflicto?: string; pasos?: string; alcance?: string }
): number {
  const breakdown = getSovereigntyPointsBreakdown();
  const ceiling = potentialPoints * breakdown.archiving.maxRecoveryPercent;
  
  let bonus = 0;
  const axisKeys = ["enfoque", "conflicto", "pasos", "alcance"] as const;
  for (const axis of axisKeys) {
    if (justifications[axis] && justifications[axis]!.trim().length > 0) {
      bonus += breakdown.archiving.justificationBonus;
    }
  }
  
  return Math.round(Math.min(bonus, ceiling));
}

// ========== CÓDICES DE SABIDURÍA ==========

export interface SavedCodice {
  id: string;
  titulo: string;
  contenido: string;
  ejes: {
    enfoque: number;
    conflicto: number;
    pasos: number;
    alcance: number;
  };
  nivel: string;
  categoria: "reflexion" | "leccion" | "victoria" | "insight" | "estrategia" | "oferta" | "grito";
  userId: string;
  createdAt: Date;
}

const CODICES_STORAGE_KEY = "sistemicar_codices";

function getLocalCodices(): SavedCodice[] {
  try {
    const data = localStorage.getItem(CODICES_STORAGE_KEY);
    if (!data) return [];
    const items = JSON.parse(data) as SavedCodice[];
    return items.map(c => ({
      ...c,
      createdAt: new Date(c.createdAt)
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function saveLocalCodices(items: SavedCodice[]): void {
  localStorage.setItem(CODICES_STORAGE_KEY, JSON.stringify(items));
}

export function subscribeToCodices(
  userId: string,
  onData: (codices: SavedCodice[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "codices");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as SavedCodice[];
      // Sort client-side to avoid Firebase index requirement
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(data);
    }, (err) => {
      console.error("Error listening to codices:", err);
      const codices = getLocalCodices().filter(c => c.userId === userId);
      onData(codices);
    });
  } else {
    const codices = getLocalCodices().filter(c => c.userId === userId);
    onData(codices);
    const handler = () => {
      const updated = getLocalCodices().filter(c => c.userId === userId);
      onData(updated);
    };
    window.addEventListener("codices-updated", handler);
    return () => window.removeEventListener("codices-updated", handler);
  }
}

export async function saveCodice(
  userId: string,
  codice: Omit<SavedCodice, "id" | "userId" | "createdAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "codices");
    const docRef = await addDoc(collection(db, path), {
      ...codice,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const newId = `codice_${Date.now()}`;
    const newCodice: SavedCodice = {
      id: newId,
      ...codice,
      userId,
      createdAt: new Date()
    };
    const codices = getLocalCodices();
    codices.unshift(newCodice);
    saveLocalCodices(codices);
    window.dispatchEvent(new CustomEvent("codices-updated"));
    return newId;
  }
}

export async function deleteCodice(userId: string, codiceId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "codices");
    await deleteDoc(doc(db, path, codiceId));
  } else {
    const codices = getLocalCodices().filter(c => c.id !== codiceId);
    saveLocalCodices(codices);
    window.dispatchEvent(new CustomEvent("codices-updated"));
  }
}

export async function deleteAllCodices(userId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const firestore = db;
    const path = getPrivatePath(userId, "codices");
    const q = query(collection(firestore, path));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(firestore, path, d.id)));
    await Promise.all(deletePromises);
  } else {
    const codices = getLocalCodices().filter(c => c.userId !== userId);
    saveLocalCodices(codices);
    window.dispatchEvent(new CustomEvent("codices-updated"));
  }
}

// ============ HOPE LOGS (Esperanza) ============

export interface HopeLog {
  id: string;
  userId: string;
  text: string;
  type: string;
  referenceDate?: Date | null;
  createdAt: Date;
}

const HOPE_STORAGE_KEY = "sistemicar_hope";

function getLocalHopeLogs(): HopeLog[] {
  try {
    const data = localStorage.getItem(HOPE_STORAGE_KEY);
    if (!data) return [];
    const items = JSON.parse(data) as HopeLog[];
    return items.map(h => ({
      ...h,
      createdAt: new Date(h.createdAt),
      referenceDate: h.referenceDate ? new Date(h.referenceDate) : null
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function saveLocalHopeLogs(items: HopeLog[]): void {
  localStorage.setItem(HOPE_STORAGE_KEY, JSON.stringify(items));
}

export function subscribeToHopeLogs(
  userId: string,
  onData: (logs: HopeLog[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "hopeLogs");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        referenceDate: d.data().referenceDate?.toDate() || null
      })) as HopeLog[];
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      saveLocalHopeLogs(data);
      onData(data);
    }, (err) => {
      console.error("Error listening to hope logs:", err);
      const localData = getLocalHopeLogs().filter(h => h.userId === userId);
      onData(localData);
    });
  } else {
    const localData = getLocalHopeLogs().filter(h => h.userId === userId);
    onData(localData);
    const handler = () => {
      const updated = getLocalHopeLogs().filter(h => h.userId === userId);
      onData(updated);
    };
    window.addEventListener("hope-updated", handler);
    return () => window.removeEventListener("hope-updated", handler);
  }
}

export async function addHopeLog(
  userId: string,
  text: string,
  type: string,
  referenceDate?: Date | null
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "hopeLogs");
    const docRef = await addDoc(collection(db, path), {
      userId,
      text,
      type,
      referenceDate: referenceDate || null,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const newId = `hope_${Date.now()}`;
    const newLog: HopeLog = {
      id: newId,
      userId,
      text,
      type,
      referenceDate: referenceDate || null,
      createdAt: new Date()
    };
    const logs = getLocalHopeLogs();
    logs.unshift(newLog);
    saveLocalHopeLogs(logs);
    window.dispatchEvent(new CustomEvent("hope-updated"));
    return newId;
  }
}

export async function deleteHopeLog(userId: string, hopeId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "hopeLogs");
    await deleteDoc(doc(db, path, hopeId));
  } else {
    const logs = getLocalHopeLogs().filter(h => h.id !== hopeId);
    saveLocalHopeLogs(logs);
    window.dispatchEvent(new CustomEvent("hope-updated"));
  }
}

// ============ MEDITATION SESSIONS ============

export interface MeditationSession {
  id: string;
  userId: string;
  durationMinutes: number;
  completedAt: Date;
}

const MEDITATION_STORAGE_KEY = "sistemicar_meditation";

function getLocalMeditationSessions(): MeditationSession[] {
  try {
    const data = localStorage.getItem(MEDITATION_STORAGE_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data) as MeditationSession[];
    return sessions.map(s => ({
      ...s,
      completedAt: new Date(s.completedAt)
    })).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  } catch {
    return [];
  }
}

function saveLocalMeditationSessions(sessions: MeditationSession[]): void {
  localStorage.setItem(MEDITATION_STORAGE_KEY, JSON.stringify(sessions));
}

export function subscribeToMeditationSessions(
  userId: string,
  onData: (sessions: MeditationSession[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "meditationSessions");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        completedAt: d.data().completedAt?.toDate() || new Date()
      })) as MeditationSession[];
      data.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      onData(data);
    }, (err) => {
      console.error("Error listening to meditation sessions:", err);
      const sessions = getLocalMeditationSessions().filter(s => s.userId === userId);
      onData(sessions);
    });
  } else {
    const sessions = getLocalMeditationSessions().filter(s => s.userId === userId);
    onData(sessions);
    const handler = () => {
      const updated = getLocalMeditationSessions().filter(s => s.userId === userId);
      onData(updated);
    };
    window.addEventListener("meditation-updated", handler);
    return () => window.removeEventListener("meditation-updated", handler);
  }
}

export async function saveMeditationSession(
  userId: string,
  durationMinutes: number
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "meditationSessions");
    const docRef = await addDoc(collection(db, path), {
      userId,
      durationMinutes,
      completedAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const newId = `meditation_${Date.now()}`;
    const newSession: MeditationSession = {
      id: newId,
      userId,
      durationMinutes,
      completedAt: new Date()
    };
    const sessions = getLocalMeditationSessions();
    sessions.unshift(newSession);
    saveLocalMeditationSessions(sessions);
    window.dispatchEvent(new CustomEvent("meditation-updated"));
    return newId;
  }
}

export function calculateMeditationStreak(sessions: MeditationSession[]): number {
  if (sessions.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const uniqueDays = new Set<string>();
  sessions.forEach(s => {
    const d = new Date(s.completedAt);
    d.setHours(0, 0, 0, 0);
    uniqueDays.add(d.toISOString().split("T")[0]);
  });
  
  const sortedDays = Array.from(uniqueDays).sort().reverse();
  
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (sortedDays[0] !== todayStr && sortedDays[0] !== yesterdayStr) {
    return 0;
  }
  
  let streak = 1;
  let currentDate = new Date(sortedDays[0]);
  
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = prevDate.toISOString().split("T")[0];
    
    if (sortedDays[i] === prevStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getTotalMeditationMinutes(sessions: MeditationSession[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
}

export interface AlquimiaEntry {
  id: string;
  userId: string;
  observacion: string;
  crisis: string;
  leccion: string;
  maestria: string;
  oro: string;
  alquimiaScore: number;
  totalPoints: number;
  isPublic: boolean;
  userName: string;
  createdAt: Date;
}

const ALQUIMIA_KEY = "sistemicar_alquimia";

function getLocalAlquimia(): AlquimiaEntry[] {
  try {
    const data = localStorage.getItem(ALQUIMIA_KEY);
    if (!data) return [];
    return JSON.parse(data).map((e: AlquimiaEntry) => ({
      ...e,
      createdAt: new Date(e.createdAt)
    })).sort((a: AlquimiaEntry, b: AlquimiaEntry) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveLocalAlquimia(entries: AlquimiaEntry[]): void {
  localStorage.setItem(ALQUIMIA_KEY, JSON.stringify(entries));
}

export async function addAlquimiaEntry(
  userId: string,
  data: Omit<AlquimiaEntry, "id" | "userId" | "createdAt">
): Promise<AlquimiaEntry> {
  if (isFirebaseConfigured() && db) {
    const collectionRef = collection(db, getPrivatePath(userId, "alquimia"));
    const docRef = await addDoc(collectionRef, {
      ...data,
      userId,
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      userId,
      ...data,
      createdAt: new Date()
    };
  } else {
    const newEntry: AlquimiaEntry = {
      id: `alq_${Date.now()}`,
      userId,
      ...data,
      createdAt: new Date()
    };
    const entries = getLocalAlquimia();
    entries.unshift(newEntry);
    saveLocalAlquimia(entries);
    window.dispatchEvent(new CustomEvent("alquimia-updated"));
    return newEntry;
  }
}

export function subscribeToAlquimiaEntries(
  userId: string,
  onData: (entries: AlquimiaEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const q = query(
      collection(db, getPrivatePath(userId, "alquimia")),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q,
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        })) as AlquimiaEntry[];
        onData(entries);
      },
      onError
    );
  } else {
    onData(getLocalAlquimia().filter(e => e.userId === userId));
    const handler = () => {
      onData(getLocalAlquimia().filter(e => e.userId === userId));
    };
    window.addEventListener("alquimia-updated", handler);
    return () => window.removeEventListener("alquimia-updated", handler);
  }
}

export function subscribeToPublicAlquimia(
  onData: (entries: AlquimiaEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const q = query(
      collection(db, "public_alquimia"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q,
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        })) as AlquimiaEntry[];
        onData(entries);
      },
      onError
    );
  } else {
    onData(getLocalAlquimia().filter(e => e.isPublic));
    const handler = () => {
      onData(getLocalAlquimia().filter(e => e.isPublic));
    };
    window.addEventListener("alquimia-updated", handler);
    return () => window.removeEventListener("alquimia-updated", handler);
  }
}

export interface AliadoEntry {
  id: string;
  userId: string;
  nombre?: string;
  shadow: {
    identidad: string;
    lenguaje: string;
    accion: string;
    tiempo: string;
  };
  power: {
    identidad: string;
    lenguaje: string;
    accion: string;
    tiempo: string;
  };
  expansion?: {
    despierto: { q1: string; q2: string };
    lugar: { q1: string; q2: string };
    accion: { q1: string; q2: string };
    expansion: { q1: string; q2: string };
  };
  personification?: {
    [capsuleId: string]: { [nivel: number]: string };
  };
  personificationLevels?: {
    [capsuleId: string]: number;
  };
  totalPoints: number;
  createdAt: Date;
  updatedAt?: Date;
}

const ALIADOS_KEY = "sistemicar_aliados";

function getLocalAliados(): AliadoEntry[] {
  try {
    const data = localStorage.getItem(ALIADOS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((e: AliadoEntry) => ({
      ...e,
      createdAt: new Date(e.createdAt)
    })).sort((a: AliadoEntry, b: AliadoEntry) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveLocalAliados(entries: AliadoEntry[]): void {
  localStorage.setItem(ALIADOS_KEY, JSON.stringify(entries));
}

export async function addAliadoEntry(
  userId: string,
  data: Omit<AliadoEntry, "id" | "userId">
): Promise<AliadoEntry> {
  if (isFirebaseConfigured() && db) {
    const collectionRef = collection(db, getPrivatePath(userId, "galeria_aliados"));
    const docRef = await addDoc(collectionRef, {
      ...data,
      userId,
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      userId,
      ...data
    };
  } else {
    const newEntry: AliadoEntry = {
      id: `aliado_${Date.now()}`,
      userId,
      ...data
    };
    const entries = getLocalAliados();
    entries.unshift(newEntry);
    saveLocalAliados(entries);
    window.dispatchEvent(new CustomEvent("aliados-updated"));
    return newEntry;
  }
}

export async function updateAliadoEntry(
  userId: string,
  aliadoId: string,
  data: Partial<Omit<AliadoEntry, "id" | "userId" | "createdAt">>
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const docRef = doc(db, getPrivatePath(userId, "galeria_aliados"), aliadoId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } else {
    const entries = getLocalAliados();
    const index = entries.findIndex(e => e.id === aliadoId);
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        ...data,
        updatedAt: new Date()
      };
      saveLocalAliados(entries);
      window.dispatchEvent(new CustomEvent("aliados-updated"));
    }
  }
}

export function subscribeToAliados(
  userId: string,
  onData: (entries: AliadoEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const q = query(
      collection(db, getPrivatePath(userId, "galeria_aliados")),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q,
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        })) as AliadoEntry[];
        onData(entries);
      },
      onError
    );
  } else {
    onData(getLocalAliados().filter(e => e.userId === userId));
    const handler = () => {
      onData(getLocalAliados().filter(e => e.userId === userId));
    };
    window.addEventListener("aliados-updated", handler);
    return () => window.removeEventListener("aliados-updated", handler);
  }
}

export type ManualType = "espejo" | "deposito" | "alquimia" | "umbral" | "planificacion" | "proyector";

export interface ManualProgress {
  manualType: ManualType;
  readAt: Date;
  checkedItems: Record<string, boolean>;
  completionPercent: number;
}

export interface UserCertification {
  manualsRead: ManualType[];
  totalChecklistCompleted: number;
  certificationLevel: number;
  lastUpdated: Date;
}

const MANUAL_PROGRESS_KEY = "sistemicar_manual_progress";

export const CERTIFICATION_LEVELS = [
  { level: 0, name: "Observador", minManuals: 0, minChecklist: 0 },
  { level: 1, name: "Aprendiz", minManuals: 1, minChecklist: 0 },
  { level: 2, name: "Practicante", minManuals: 3, minChecklist: 0 },
  { level: 3, name: "Maestro", minManuals: 5, minChecklist: 0 },
  { level: 4, name: "Arquitecto", minManuals: 5, minChecklist: 30 },
  { level: 5, name: "Gran Maestro", minManuals: 5, minChecklist: 50 }
];

function getLocalManualProgress(): Record<string, ManualProgress> {
  try {
    const data = localStorage.getItem(MANUAL_PROGRESS_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveLocalManualProgress(progress: Record<string, ManualProgress>): void {
  localStorage.setItem(MANUAL_PROGRESS_KEY, JSON.stringify(progress));
}

export async function getManualProgress(
  userId: string,
  manualType: ManualType
): Promise<ManualProgress | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, getPrivatePath(userId, "manual_progress"), manualType);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          readAt: data.readAt?.toDate?.() || new Date()
        } as ManualProgress;
      }
      return null;
    } catch {
      return getLocalManualProgress()[manualType] || null;
    }
  } else {
    return getLocalManualProgress()[manualType] || null;
  }
}

export async function markManualAsRead(
  userId: string,
  manualType: ManualType
): Promise<void> {
  const progress = await getManualProgress(userId, manualType);
  
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, getPrivatePath(userId, "manual_progress"), manualType);
      await setDoc(docRef, {
        manualType,
        readAt: serverTimestamp(),
        checkedItems: progress?.checkedItems || {},
        completionPercent: progress?.completionPercent || 0
      }, { merge: true });
    } catch (error) {
      console.error("Error marking manual as read:", error);
      const local = getLocalManualProgress();
      local[manualType] = {
        manualType,
        readAt: new Date(),
        checkedItems: progress?.checkedItems || {},
        completionPercent: progress?.completionPercent || 0
      };
      saveLocalManualProgress(local);
    }
  } else {
    const local = getLocalManualProgress();
    local[manualType] = {
      manualType,
      readAt: new Date(),
      checkedItems: progress?.checkedItems || {},
      completionPercent: progress?.completionPercent || 0
    };
    saveLocalManualProgress(local);
  }
}

export async function markChecklistItem(
  userId: string,
  manualType: ManualType,
  itemKey: string,
  checked: boolean
): Promise<void> {
  const progress = await getManualProgress(userId, manualType);
  const checkedItems = { ...(progress?.checkedItems || {}), [itemKey]: checked };
  const completionPercent = calculateManualCompletion(manualType, checkedItems);
  
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, getPrivatePath(userId, "manual_progress"), manualType);
      await setDoc(docRef, {
        manualType,
        readAt: progress?.readAt || serverTimestamp(),
        checkedItems,
        completionPercent
      }, { merge: true });
    } catch (error) {
      console.error("Error marking checklist item:", error);
      const local = getLocalManualProgress();
      local[manualType] = {
        manualType,
        readAt: progress?.readAt || new Date(),
        checkedItems,
        completionPercent
      };
      saveLocalManualProgress(local);
    }
  } else {
    const local = getLocalManualProgress();
    local[manualType] = {
      manualType,
      readAt: progress?.readAt || new Date(),
      checkedItems,
      completionPercent
    };
    saveLocalManualProgress(local);
  }
}

function calculateManualCompletion(manualType: ManualType, checkedItems: Record<string, boolean>): number {
  const itemCounts: Record<ManualType, number> = {
    espejo: 12,
    deposito: 12,
    alquimia: 12,
    umbral: 11,
    planificacion: 12,
    proyector: 12
  };
  const total = itemCounts[manualType] || 12;
  const checked = Object.values(checkedItems).filter(Boolean).length;
  return Math.round((checked / total) * 100);
}

const BENEFITS_READ_KEY = "sistemicar_benefits_read";

function getLocalBenefitsRead(): Record<string, boolean> {
  try {
    const data = localStorage.getItem(BENEFITS_READ_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveLocalBenefitsRead(data: Record<string, boolean>): void {
  localStorage.setItem(BENEFITS_READ_KEY, JSON.stringify(data));
}

export async function hasBenefitsBeenRead(
  userId: string,
  manualType: ManualType
): Promise<boolean> {
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, getPrivatePath(userId, "benefits_read"), manualType);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch {
      return getLocalBenefitsRead()[manualType] || false;
    }
  }
  return getLocalBenefitsRead()[manualType] || false;
}

export async function markBenefitsAsRead(
  userId: string,
  manualType: ManualType
): Promise<boolean> {
  const alreadyRead = await hasBenefitsBeenRead(userId, manualType);
  if (alreadyRead) return false;
  
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, getPrivatePath(userId, "benefits_read"), manualType);
      await setDoc(docRef, {
        manualType,
        readAt: serverTimestamp()
      });
      
      await awardSovereigntyPoints(userId, 3, `Leíste los beneficios del manual ${manualType}`);
      return true;
    } catch (error) {
      console.error("Error marking benefits as read:", error);
      const local = getLocalBenefitsRead();
      local[manualType] = true;
      saveLocalBenefitsRead(local);
      return true;
    }
  } else {
    const local = getLocalBenefitsRead();
    local[manualType] = true;
    saveLocalBenefitsRead(local);
    return true;
  }
}

export async function getUserCertification(userId: string): Promise<UserCertification> {
  const allManuals: ManualType[] = ["espejo", "deposito", "alquimia", "umbral", "planificacion", "proyector"];
  const manualsRead: ManualType[] = [];
  let totalChecklistCompleted = 0;

  for (const manualType of allManuals) {
    const progress = await getManualProgress(userId, manualType);
    if (progress) {
      manualsRead.push(manualType);
      const checkedCount = Object.values(progress.checkedItems || {}).filter(Boolean).length;
      totalChecklistCompleted += checkedCount;
    }
  }

  let certificationLevel = 0;
  if (manualsRead.length >= 1) certificationLevel = 1;
  if (manualsRead.length >= 3) certificationLevel = 2;
  if (manualsRead.length >= 5) certificationLevel = 3;
  if (totalChecklistCompleted >= 30) certificationLevel = 4;
  if (totalChecklistCompleted >= 50) certificationLevel = 5;

  return {
    manualsRead,
    totalChecklistCompleted,
    certificationLevel,
    lastUpdated: new Date()
  };
}

export function subscribeToManualProgress(
  userId: string,
  onData: (data: UserCertification) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const q = collection(db, getPrivatePath(userId, "manual_progress"));
    return onSnapshot(q,
      async (snapshot) => {
        try {
          const manualsRead: ManualType[] = [];
          let totalChecklistCompleted = 0;

          snapshot.docs.forEach(d => {
            const data = d.data();
            if (data.manualType) {
              manualsRead.push(data.manualType as ManualType);
              const checkedCount = Object.values(data.checkedItems || {}).filter(Boolean).length;
              totalChecklistCompleted += checkedCount;
            }
          });

          let certificationLevel = 0;
          if (manualsRead.length >= 1) certificationLevel = 1;
          if (manualsRead.length >= 3) certificationLevel = 2;
          if (manualsRead.length >= 5) certificationLevel = 3;
          if (totalChecklistCompleted >= 30) certificationLevel = 4;
          if (totalChecklistCompleted >= 50) certificationLevel = 5;

          onData({
            manualsRead,
            totalChecklistCompleted,
            certificationLevel,
            lastUpdated: new Date()
          });
        } catch (error) {
          onError(error as Error);
        }
      },
      onError
    );
  } else {
    const loadLocal = async () => {
      try {
        const cert = await getUserCertification(userId);
        onData(cert);
      } catch (error) {
        onError(error as Error);
      }
    };
    loadLocal();
    
    const handler = () => loadLocal();
    window.addEventListener("manual-progress-updated", handler);
    return () => window.removeEventListener("manual-progress-updated", handler);
  }
}

// ========== PROYECTOR - Arquitectura de Realidad ==========

export type ProyectorEje = "vision" | "arquitectura" | "recurso" | "fecha_colapso";

export interface ProyectorHito {
  id: string;
  tarea: string;
  eje: ProyectorEje;
  estado: "proyectado" | "colapsado";
  frecuencia: "diario" | "semanal" | "mensual" | "unico";
  userId: string;
  createdAt: Date;
  collapsedAt?: Date;
  fechaColapso?: Date;
}

export const PROYECTOR_EJES_CONFIG = {
  vision: { label: "VISIÓN", points: 5, description: "¿Qué quiero ver manifestado?" },
  arquitectura: { label: "ARQUITECTURA", points: 10, description: "¿Cómo estructuro mi camino hacia la visión?" },
  recurso: { label: "RECURSO", points: 15, description: "¿Qué recursos necesito movilizar?" },
  fecha_colapso: { label: "FECHA COLAPSO", points: 20, description: "¿Cuándo colapsa esta realidad?" }
};

const PROYECTOR_LOCAL_KEY = "sistemicar_proyector_hitos";

function getLocalProyectorHitos(): ProyectorHito[] {
  try {
    const data = localStorage.getItem(PROYECTOR_LOCAL_KEY);
    if (!data) return [];
    return JSON.parse(data).map((h: ProyectorHito) => ({
      ...h,
      createdAt: new Date(h.createdAt),
      collapsedAt: h.collapsedAt ? new Date(h.collapsedAt) : undefined
    }));
  } catch { return []; }
}

function saveLocalProyectorHitos(hitos: ProyectorHito[]): void {
  localStorage.setItem(PROYECTOR_LOCAL_KEY, JSON.stringify(hitos));
  window.dispatchEvent(new CustomEvent("proyector-updated"));
}

export async function addProyectorHito(
  userId: string,
  tarea: string,
  eje: ProyectorEje,
  frecuencia: ProyectorHito["frecuencia"]
): Promise<string> {
  const newHito: ProyectorHito = {
    id: `hito_${Date.now()}`,
    tarea,
    eje,
    estado: "proyectado",
    frecuencia,
    userId,
    createdAt: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "proyector_hitos");
      const docRef = await addDoc(collection(db, path), {
        tarea: newHito.tarea,
        eje: newHito.eje,
        estado: newHito.estado,
        frecuencia: newHito.frecuencia,
        userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding hito to Firebase:", error);
      const locals = getLocalProyectorHitos();
      locals.unshift(newHito);
      saveLocalProyectorHitos(locals);
      return newHito.id;
    }
  } else {
    const locals = getLocalProyectorHitos();
    locals.unshift(newHito);
    saveLocalProyectorHitos(locals);
    return newHito.id;
  }
}

export async function colapsarProyectorHito(
  userId: string,
  hitoId: string
): Promise<number> {
  let pointsEarned = 0;

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "proyector_hitos");
      const docRef = doc(db, path, hitoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const eje = data.eje as ProyectorEje;
        pointsEarned = PROYECTOR_EJES_CONFIG[eje]?.points || 5;
        
        await setDoc(docRef, {
          ...data,
          estado: "colapsado",
          collapsedAt: serverTimestamp()
        }, { merge: true });
        
        await awardSovereigntyPoints(userId, pointsEarned, `Hito colapsado: ${eje.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Error collapsing hito:", error);
    }
  } else {
    const locals = getLocalProyectorHitos();
    const idx = locals.findIndex(h => h.id === hitoId);
    if (idx !== -1) {
      const eje = locals[idx].eje;
      pointsEarned = PROYECTOR_EJES_CONFIG[eje]?.points || 5;
      locals[idx].estado = "colapsado";
      locals[idx].collapsedAt = new Date();
      saveLocalProyectorHitos(locals);
      await awardSovereigntyPoints(userId, pointsEarned, `Hito colapsado: ${eje.toUpperCase()}`);
    }
  }

  return pointsEarned;
}

export async function deleteProyectorHito(userId: string, hitoId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "proyector_hitos");
      await deleteDoc(doc(db, path, hitoId));
    } catch (error) {
      console.error("Error deleting hito:", error);
    }
  } else {
    const locals = getLocalProyectorHitos();
    saveLocalProyectorHitos(locals.filter(h => h.id !== hitoId));
  }
}

export async function restaurarProyectorHito(userId: string, hitoId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "proyector_hitos");
      const docRef = doc(db, path, hitoId);
      await setDoc(docRef, {
        estado: "proyectado",
        collapsedAt: null
      }, { merge: true });
    } catch (error) {
      console.error("Error restoring hito:", error);
    }
  } else {
    const locals = getLocalProyectorHitos();
    const idx = locals.findIndex(h => h.id === hitoId);
    if (idx !== -1) {
      locals[idx].estado = "proyectado";
      locals[idx].collapsedAt = undefined;
      saveLocalProyectorHitos(locals);
    }
  }
}

export function subscribeToProyectorHitos(
  userId: string,
  onData: (hitos: ProyectorHito[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "proyector_hitos");
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    return onSnapshot(q,
      (snapshot) => {
        const hitos: ProyectorHito[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            tarea: data.tarea,
            eje: data.eje,
            estado: data.estado,
            frecuencia: data.frecuencia,
            userId: data.userId,
            createdAt: data.createdAt?.toDate() || new Date(),
            collapsedAt: data.collapsedAt?.toDate()
          };
        });
        onData(hitos);
      },
      onError
    );
  } else {
    const loadLocal = () => {
      try {
        onData(getLocalProyectorHitos());
      } catch (error) {
        onError(error as Error);
      }
    };
    loadLocal();
    
    const handler = () => loadLocal();
    window.addEventListener("proyector-updated", handler);
    return () => window.removeEventListener("proyector-updated", handler);
  }
}

// ==================== PROYECCIONES (Sistema de Cápsulas Futuras) ====================

export interface ProyeccionEntry {
  id: string;
  capsulas: {
    [capsuleId: string]: {
      [nivel: number]: string;
    };
  };
  projectionNarrative: string;
  createdAt: Date;
  updatedAt: Date;
}

const PROYECCIONES_LOCAL_KEY = "sistemicar_proyecciones";

function getLocalProyecciones(): ProyeccionEntry[] {
  try {
    const data = localStorage.getItem(PROYECCIONES_LOCAL_KEY);
    if (!data) return [];
    return JSON.parse(data).map((p: ProyeccionEntry) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }));
  } catch {
    return [];
  }
}

function saveLocalProyecciones(proyecciones: ProyeccionEntry[]): void {
  localStorage.setItem(PROYECCIONES_LOCAL_KEY, JSON.stringify(proyecciones));
  window.dispatchEvent(new CustomEvent("proyecciones-updated"));
}

export async function addProyeccion(
  userId: string,
  data: Omit<ProyeccionEntry, "id">
): Promise<ProyeccionEntry> {
  const newEntry: ProyeccionEntry = {
    id: `proy_${Date.now()}`,
    ...data
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "proyecciones");
      const docRef = await addDoc(collection(db, path), {
        ...newEntry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      newEntry.id = docRef.id;
    } catch (error) {
      console.error("Error adding proyeccion to Firebase:", error);
      const locals = getLocalProyecciones();
      locals.unshift(newEntry);
      saveLocalProyecciones(locals);
    }
  } else {
    const locals = getLocalProyecciones();
    locals.unshift(newEntry);
    saveLocalProyecciones(locals);
  }

  return newEntry;
}

export async function updateProyeccion(
  userId: string,
  proyeccionId: string,
  updates: Partial<ProyeccionEntry>
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "proyecciones");
      const docRef = doc(db, path, proyeccionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating proyeccion in Firebase:", error);
      const locals = getLocalProyecciones();
      const idx = locals.findIndex(p => p.id === proyeccionId);
      if (idx !== -1) {
        locals[idx] = { ...locals[idx], ...updates, updatedAt: new Date() };
        saveLocalProyecciones(locals);
      }
    }
  } else {
    const locals = getLocalProyecciones();
    const idx = locals.findIndex(p => p.id === proyeccionId);
    if (idx !== -1) {
      locals[idx] = { ...locals[idx], ...updates, updatedAt: new Date() };
      saveLocalProyecciones(locals);
    }
  }
}

export function subscribeToProyecciones(
  userId: string,
  onData: (proyecciones: ProyeccionEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "proyecciones");
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    return onSnapshot(q,
      (snapshot) => {
        const proyecciones: ProyeccionEntry[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            capsulas: data.capsulas || {},
            projectionNarrative: data.projectionNarrative || "",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        });
        onData(proyecciones);
      },
      onError
    );
  } else {
    const loadLocal = () => {
      try {
        onData(getLocalProyecciones());
      } catch (error) {
        onError(error as Error);
      }
    };
    loadLocal();
    
    const handler = () => loadLocal();
    window.addEventListener("proyecciones-updated", handler);
    return () => window.removeEventListener("proyecciones-updated", handler);
  }
}

// ============================================================
// PROSPECTOS - Sistema de Captura de Leads
// ============================================================

export interface Prospecto {
  id: string;
  nombre: string;
  whatsapp: string;
  correo: string;
  registradoEn: Date;
  pagoConfirmado: boolean;
  retoGuerreroActivo: boolean;
  retoGuerreroInicio: Date | null;
  ultimaActividad: Date | null;
  source?: string;
  interfaz_origen?: string;
}

const PROSPECTOS_KEY = "sistemicar_prospectos";

function getLocalProspectos(): Prospecto[] {
  try {
    const data = localStorage.getItem(PROSPECTOS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((p: any) => ({
      ...p,
      registradoEn: new Date(p.registradoEn),
      retoGuerreroInicio: p.retoGuerreroInicio ? new Date(p.retoGuerreroInicio) : null,
      ultimaActividad: p.ultimaActividad ? new Date(p.ultimaActividad) : null
    }));
  } catch {
    return [];
  }
}

function saveLocalProspectos(prospectos: Prospecto[]): void {
  localStorage.setItem(PROSPECTOS_KEY, JSON.stringify(prospectos));
}

export async function getAllProspectos(): Promise<Prospecto[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snapshot = await getDocs(collection(db, "prospectos"));
      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          nombre: data.nombre || "",
          whatsapp: data.whatsapp || "",
          correo: data.correo || "",
          registradoEn: data.registradoEn?.toDate() || new Date(),
          pagoConfirmado: data.pagoConfirmado || false,
          retoGuerreroActivo: data.retoGuerreroActivo || false,
          retoGuerreroInicio: data.retoGuerreroInicio?.toDate() || null,
          ultimaActividad: data.ultimaActividad?.toDate() || null
        };
      });
    } catch (error) {
      console.error("Error getting all prospectos:", error);
    }
  }
  return getLocalProspectos();
}

export async function addProspecto(
  data: Omit<Prospecto, "id">
): Promise<Prospecto> {
  const newProspecto: Prospecto = {
    id: `prospecto_${Date.now()}`,
    ...data
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "prospectos"), {
        ...newProspecto,
        registradoEn: serverTimestamp()
      });
      newProspecto.id = docRef.id;
    } catch (error) {
      console.error("Error adding prospecto to Firebase:", error);
      const locals = getLocalProspectos();
      locals.unshift(newProspecto);
      saveLocalProspectos(locals);
    }
  } else {
    const locals = getLocalProspectos();
    locals.unshift(newProspecto);
    saveLocalProspectos(locals);
  }

  return newProspecto;
}

export async function getProspectoByEmail(email: string): Promise<Prospecto | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, "prospectos"),
        where("correo", "==", email.toLowerCase())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          nombre: docData.nombre,
          whatsapp: docData.whatsapp,
          correo: docData.correo,
          registradoEn: docData.registradoEn?.toDate() || new Date(),
          pagoConfirmado: docData.pagoConfirmado || false,
          retoGuerreroActivo: docData.retoGuerreroActivo || false,
          retoGuerreroInicio: docData.retoGuerreroInicio?.toDate() || null,
          ultimaActividad: docData.ultimaActividad?.toDate() || null
        };
      }
    } catch (error) {
      console.error("Error getting prospecto from Firebase:", error);
    }
  }
  
  const locals = getLocalProspectos();
  return locals.find(p => p.correo.toLowerCase() === email.toLowerCase()) || null;
}

export async function updateProspecto(
  email: string,
  updates: Partial<Prospecto>
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, "prospectos"),
        where("correo", "==", email.toLowerCase())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = doc(db, "prospectos", snapshot.docs[0].id);
        await updateDoc(docRef, updates);
      }
    } catch (error) {
      console.error("Error updating prospecto in Firebase:", error);
    }
  }
  
  const locals = getLocalProspectos();
  const idx = locals.findIndex(p => p.correo.toLowerCase() === email.toLowerCase());
  if (idx !== -1) {
    locals[idx] = { ...locals[idx], ...updates };
    saveLocalProspectos(locals);
  }
}

export async function activarRetoGuerrero(email: string): Promise<void> {
  const updates = {
    retoGuerreroActivo: true,
    retoGuerreroInicio: new Date(),
    ultimaActividad: new Date()
  };
  
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, "prospectos"),
        where("correo", "==", email.toLowerCase())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = doc(db, "prospectos", snapshot.docs[0].id);
        await updateDoc(docRef, {
          ...updates,
          retoGuerreroInicio: serverTimestamp(),
          ultimaActividad: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error activating reto guerrero:", error);
    }
  }
  
  const locals = getLocalProspectos();
  const idx = locals.findIndex(p => p.correo.toLowerCase() === email.toLowerCase());
  if (idx !== -1) {
    locals[idx] = { ...locals[idx], ...updates };
    saveLocalProspectos(locals);
  }
}

export function subscribeToAllProspectos(
  onData: (prospectos: Prospecto[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const q = query(collection(db, "prospectos"), orderBy("registradoEn", "desc"));
    return onSnapshot(q, (snapshot) => {
      const prospectos = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          nombre: data.nombre,
          whatsapp: data.whatsapp,
          correo: data.correo,
          registradoEn: data.registradoEn?.toDate ? data.registradoEn.toDate() : new Date(data.registradoEn),
          pagoConfirmado: data.pagoConfirmado || false,
          retoGuerreroActivo: data.retoGuerreroActivo || false,
          retoGuerreroInicio: data.retoGuerreroInicio?.toDate ? data.retoGuerreroInicio.toDate() : null,
          ultimaActividad: data.ultimaActividad?.toDate ? data.ultimaActividad.toDate() : null,
          source: data.source || "directo",
          interfaz_origen: data.interfaz_origen || undefined,
        } as Prospecto;
      });
      onData(prospectos);
    }, onError);
  } else {
    onData(getLocalProspectos());
    return () => {};
  }
}

export async function verificarAccesoProspecto(email: string): Promise<{
  tieneAcceso: boolean;
  razon: "pago" | "reto_activo" | "sin_acceso" | "reto_fallido";
  diasRestantes?: number;
}> {
  const prospecto = await getProspectoByEmail(email);
  
  if (!prospecto) {
    return { tieneAcceso: false, razon: "sin_acceso" };
  }
  
  if (prospecto.pagoConfirmado) {
    return { tieneAcceso: true, razon: "pago" };
  }
  
  if (prospecto.retoGuerreroActivo && prospecto.retoGuerreroInicio) {
    const diasDesdeInicio = Math.floor(
      (Date.now() - prospecto.retoGuerreroInicio.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diasDesdeInicio > 7) {
      await updateProspecto(email, { retoGuerreroActivo: false });
      return { tieneAcceso: false, razon: "sin_acceso" };
    }
    
    if (prospecto.ultimaActividad) {
      const diasSinActividad = Math.floor(
        (Date.now() - prospecto.ultimaActividad.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasSinActividad >= 1) {
        await updateProspecto(email, { retoGuerreroActivo: false });
        return { tieneAcceso: false, razon: "reto_fallido" };
      }
    }
    
    return { 
      tieneAcceso: true, 
      razon: "reto_activo",
      diasRestantes: 7 - diasDesdeInicio
    };
  }
  
  return { tieneAcceso: false, razon: "sin_acceso" };
}

export async function registrarActividadProspecto(email: string): Promise<void> {
  await updateProspecto(email, { ultimaActividad: new Date() });
}

// ============================================================
// HISTORIAL SISTÉMICO - Todos los textos del usuario
// ============================================================

export interface HistorialSistemicoEntry {
  id: string;
  userId: string;
  modulo: string;
  texto: string;
  contexto?: string;
  puntos: number;
  createdAt: Date;
}

const HISTORIAL_KEY = "sistemicar_historial_sistemico";

function getLocalHistorial(): HistorialSistemicoEntry[] {
  try {
    const data = localStorage.getItem(HISTORIAL_KEY);
    if (!data) return [];
    return JSON.parse(data).map((h: any) => ({
      ...h,
      createdAt: new Date(h.createdAt)
    }));
  } catch {
    return [];
  }
}

function saveLocalHistorial(entries: HistorialSistemicoEntry[]): void {
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(entries));
}

export async function addHistorialSistemico(
  userId: string,
  data: Omit<HistorialSistemicoEntry, "id" | "userId" | "createdAt">
): Promise<void> {
  const entry: HistorialSistemicoEntry = {
    id: `hist_${Date.now()}`,
    userId,
    ...data,
    createdAt: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "historialSistemico");
      await addDoc(collection(db, path), {
        ...entry,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding historial to Firebase:", error);
      const locals = getLocalHistorial();
      locals.unshift(entry);
      saveLocalHistorial(locals);
    }
  } else {
    const locals = getLocalHistorial();
    locals.unshift(entry);
    saveLocalHistorial(locals);
  }
}

export function subscribeToHistorialSistemico(
  userId: string,
  onData: (entries: HistorialSistemicoEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "historialSistemico");
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    return onSnapshot(q,
      (snapshot) => {
        const entries: HistorialSistemicoEntry[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            modulo: data.modulo,
            texto: data.texto,
            contexto: data.contexto,
            puntos: data.puntos || 0,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        });
        onData(entries);
      },
      onError
    );
  } else {
    try {
      onData(getLocalHistorial().filter(h => h.userId === userId));
    } catch (error) {
      onError(error as Error);
    }
    return () => {};
  }
}

// ========== PRINCIPIOS MAESTROS ==========

export interface PrincipioMaestro {
  id: string;
  texto: string;
  fuente: string; // "destilacion" | "sello_soberania"
  moduloOrigen: string; // "espejo" | "alquimia" | "planificacion" | etc
  contexto?: string;
  createdAt: Date;
}

const PRINCIPIOS_KEY = "sistemicar_principios_maestros";

function getLocalPrincipios(): PrincipioMaestro[] {
  try {
    const data = localStorage.getItem(PRINCIPIOS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    })).sort((a: PrincipioMaestro, b: PrincipioMaestro) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveLocalPrincipios(items: PrincipioMaestro[]): void {
  localStorage.setItem(PRINCIPIOS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("principios-updated"));
}

export async function addPrincipioMaestro(
  data: Omit<PrincipioMaestro, "id" | "createdAt">
): Promise<PrincipioMaestro> {
  const newItem: PrincipioMaestro = {
    id: `pm_${Date.now()}`,
    ...data,
    createdAt: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = `artifacts/sistemicar-v2-5/principios_maestros`;
      const docRef = await addDoc(collection(db, path), {
        ...newItem,
        createdAt: serverTimestamp()
      });
      newItem.id = docRef.id;
    } catch (error) {
      console.error("Error adding principio maestro:", error);
      const locals = getLocalPrincipios();
      locals.unshift(newItem);
      saveLocalPrincipios(locals);
    }
  } else {
    const locals = getLocalPrincipios();
    locals.unshift(newItem);
    saveLocalPrincipios(locals);
  }

  return newItem;
}

export async function deletePrincipioMaestro(principioId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = `artifacts/sistemicar-v2-5/principios_maestros`;
      await deleteDoc(doc(db, path, principioId));
    } catch (error) {
      console.error("Error deleting principio:", error);
      const locals = getLocalPrincipios().filter(p => p.id !== principioId);
      saveLocalPrincipios(locals);
    }
  } else {
    const locals = getLocalPrincipios().filter(p => p.id !== principioId);
    saveLocalPrincipios(locals);
  }
}

export function subscribeToPrincipiosMaestros(
  onData: (items: PrincipioMaestro[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = `artifacts/sistemicar-v2-5/principios_maestros`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    return onSnapshot(q,
      (snapshot) => {
        const items: PrincipioMaestro[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date()
        })) as PrincipioMaestro[];
        saveLocalPrincipios(items);
        onData(items);
      },
      (error) => {
        console.error("Error subscribing to principios:", error);
        onData(getLocalPrincipios());
        onError(error);
      }
    );
  } else {
    onData(getLocalPrincipios());
    const handler = () => onData(getLocalPrincipios());
    window.addEventListener("principios-updated", handler);
    return () => window.removeEventListener("principios-updated", handler);
  }
}

export async function markAsPrincipioMaestro(
  userId: string,
  logId: string,
  texto: string,
  modulo: string
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "energyLogs");
      await updateDoc(doc(db, path, logId), { es_principio_maestro: true });
    } catch (error) {
      console.error("Error marking as principio:", error);
    }
  }

  await addPrincipioMaestro({
    texto,
    fuente: "sello_soberania",
    moduloOrigen: modulo
  });
}

// ========== WEEKLY AUDIT (WORKER DEL DOMINGO) ==========

export interface WeeklyAuditLog {
  id: string;
  misionTitulo: string;
  fatigue_layer: number; // 1-4
  delay_at_close: number; // minutes
  transmutation_answer: string;
  expressCount: number;
  timestamp: Date;
  status: "cumplido" | "archivado";
  bonusPS: number;
  penaltyPS: number;
}

const WEEKLY_AUDIT_KEY = "sistemicar_weekly_audit";

function getLocalWeeklyAudit(): WeeklyAuditLog[] {
  try {
    const data = localStorage.getItem(WEEKLY_AUDIT_KEY);
    if (!data) return [];
    return JSON.parse(data).map((l: any) => ({
      ...l,
      timestamp: new Date(l.timestamp)
    }));
  } catch {
    return [];
  }
}

function saveLocalWeeklyAudit(logs: WeeklyAuditLog[]): void {
  localStorage.setItem(WEEKLY_AUDIT_KEY, JSON.stringify(logs));
}

export async function addWeeklyAuditLog(
  userId: string,
  data: Omit<WeeklyAuditLog, "id" | "timestamp">
): Promise<void> {
  const entry: WeeklyAuditLog = {
    id: `wa_${Date.now()}`,
    ...data,
    timestamp: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "weekly_audit");
      await addDoc(collection(db, path), {
        ...entry,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving weekly audit:", error);
      const locals = getLocalWeeklyAudit();
      locals.push(entry);
      saveLocalWeeklyAudit(locals);
    }
  } else {
    const locals = getLocalWeeklyAudit();
    locals.push(entry);
    saveLocalWeeklyAudit(locals);
  }
}

export interface IntrospectionEntry {
  id: string;
  segmentoNombre: string;
  segmentoDuracionMin: number;
  capasActivas: number[];
  respuestas: { capa: number; pregunta: string; respuesta: string; charCount: number; multiplicador: number }[];
  totalPS: number;
  ai_feedback_status: "pending" | "processed";
  timestamp: Date;
}

export async function saveIntrospectionEntry(
  userId: string,
  data: Omit<IntrospectionEntry, "id" | "timestamp">
): Promise<void> {
  const entry: IntrospectionEntry = {
    id: `intro_${Date.now()}`,
    ...data,
    timestamp: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "introspection_logs");
      await addDoc(collection(db, path), {
        ...entry,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving introspection:", error);
      const locals = JSON.parse(localStorage.getItem("local_introspection") || "[]");
      locals.push(entry);
      localStorage.setItem("local_introspection", JSON.stringify(locals));
    }
  } else {
    const locals = JSON.parse(localStorage.getItem("local_introspection") || "[]");
    locals.push(entry);
    localStorage.setItem("local_introspection", JSON.stringify(locals));
  }
}

// ============================================================
// PLANILLA v5.5 - Sistema de Segmentos con Persistencia
// ============================================================

export interface EventoLog {
  componente: string;
  hora: string;
  timestamp: number;
}

export interface SegmentoV5 {
  id: string;
  nombre: string;
  horaInicio: string; // formato "HH:mm"
  horaFin: string; // formato "HH:mm"
  color: string;
  icono: string;
  estado: 'pendiente' | 'activo' | 'cerrado_manual' | 'entropia';
  eventos: EventoLog[];
  psGanados: number;
  activadoAt?: number; // timestamp when activated
  cerradoAt?: number; // timestamp when closed
  reflexion?: string;
  centinelaEnabled?: boolean; // undefined/true = activo (backward compat); false = desactivado
}

export interface Planilla {
  id: string;
  fecha: string; // formato "YYYY-MM-DD"
  segmentos: SegmentoV5[];
  createdAt: any;
  updatedAt: any;
}

const PLANILLA_LOCAL_KEY = "sistemicar_planilla_v5";

function getLocalPlanilla(fecha: string): Planilla | null {
  try {
    const data = localStorage.getItem(`${PLANILLA_LOCAL_KEY}_${fecha}`);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveLocalPlanilla(planilla: Planilla): void {
  localStorage.setItem(`${PLANILLA_LOCAL_KEY}_${planilla.fecha}`, JSON.stringify(planilla));
}

function getTodayDateString(): string {
  const now = new Date();
  // Adjust for Lima timezone (UTC-5)
  const limaOffset = -5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const limaMinutes = utcMinutes + limaOffset;
  const limaDate = new Date(now);
  if (limaMinutes < 0) {
    limaDate.setUTCDate(limaDate.getUTCDate() - 1);
  }
  return limaDate.toISOString().split("T")[0];
}

export async function getPlanillaHoy(userId: string): Promise<Planilla> {
  const fecha = getTodayDateString();

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "planillas");
      const q = query(collection(db, path), where("fecha", "==", fecha));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const planilla: Planilla = {
          id: snapshot.docs[0].id,
          fecha: data.fecha,
          segmentos: data.segmentos || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        saveLocalPlanilla(planilla);
        return planilla;
      }
    } catch (error) {
      console.error("Error getting planilla from Firebase:", error);
    }
  }

  const local = getLocalPlanilla(fecha);
  if (local) return local;

  const newPlanilla: Planilla = {
    id: `planilla_${fecha}_${Date.now()}`,
    fecha,
    segmentos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveLocalPlanilla(newPlanilla);
  return newPlanilla;
}

export async function savePlanilla(userId: string, planilla: Planilla): Promise<void> {
  planilla.updatedAt = new Date().toISOString();
  saveLocalPlanilla(planilla);

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "planillas");
      const q = query(collection(db, path), where("fecha", "==", planilla.fecha));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, path), {
          ...planilla,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, path, snapshot.docs[0].id), {
          segmentos: planilla.segmentos,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving planilla to Firebase:", error);
    }
  }
}

export async function addSegmentoToPlanilla(userId: string, segmento: SegmentoV5): Promise<Planilla> {
  const planilla = await getPlanillaHoy(userId);
  planilla.segmentos.push(segmento);
  await savePlanilla(userId, planilla);
  return planilla;
}

export async function updateSegmentoInPlanilla(userId: string, segmentoId: string, updates: Partial<SegmentoV5>): Promise<Planilla> {
  const planilla = await getPlanillaHoy(userId);
  const idx = planilla.segmentos.findIndex(s => s.id === segmentoId);
  if (idx !== -1) {
    planilla.segmentos[idx] = { ...planilla.segmentos[idx], ...updates };
  }
  await savePlanilla(userId, planilla);
  return planilla;
}

export async function addEventoToSegmento(userId: string, segmentoId: string, evento: EventoLog): Promise<void> {
  const planilla = await getPlanillaHoy(userId);
  const idx = planilla.segmentos.findIndex(s => s.id === segmentoId);
  if (idx !== -1) {
    planilla.segmentos[idx].eventos.push(evento);
    await savePlanilla(userId, planilla);
  }
}

export function subscribeToPlanilla(
  userId: string,
  fecha: string,
  onData: (planilla: Planilla) => void,
  onError: (error: Error) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    const local = getLocalPlanilla(fecha);
    if (local) onData(local);
    return () => {};
  }

  try {
    const localPlanillaImmediate = getLocalPlanilla(fecha);
    if (localPlanillaImmediate) onData(localPlanillaImmediate);

    const path = getPrivatePath(userId, "planillas");
    const q = query(collection(db, path), where("fecha", "==", fecha));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const planilla: Planilla = {
          id: snapshot.docs[0].id,
          fecha: data.fecha,
          segmentos: data.segmentos || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        saveLocalPlanilla(planilla);
        onData(planilla);
      } else {
        const newPlanilla: Planilla = {
          id: `planilla_${fecha}_${Date.now()}`,
          fecha,
          segmentos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onData(newPlanilla);
      }
    }, onError);
  } catch (error) {
    onError(error as Error);
    return () => {};
  }
}

export function getWeeklyAuditLogs(userId: string): Promise<WeeklyAuditLog[]> {
  return new Promise((resolve) => {
    if (isFirebaseConfigured() && db) {
      const path = getPrivatePath(userId, "weekly_audit");
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      getDocs(query(collection(db, path), orderBy("timestamp", "desc")))
        .then(snapshot => {
          const logs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate() || new Date()
          })) as WeeklyAuditLog[];
          resolve(logs.filter(l => l.timestamp >= weekAgo));
        })
        .catch(() => resolve(getLocalWeeklyAudit()));
    } else {
      resolve(getLocalWeeklyAudit());
    }
  });
}

// ========== ADN SOBERANO (GENOMA SISTEMICAR) ==========

export interface GenomeLaw {
  id: string;
  tesis_convencional: string;
  antitesis_gilson: string;
  ley_sistemicar: string;
  texto_original: string;
  fuente_modulo: string;
  categoria: string;
  identidad_sugerida: string;
  status: "candidato" | "validado" | "rechazado";
  persistencia_perpetua: boolean;
  createdAt: Date;
}

const GENOME_KEY = "sistemicar_genome";

function getLocalGenome(): GenomeLaw[] {
  try {
    const data = localStorage.getItem(GENOME_KEY);
    if (!data) return [];
    return JSON.parse(data).map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt)
    })).sort((a: GenomeLaw, b: GenomeLaw) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveLocalGenome(items: GenomeLaw[]): void {
  localStorage.setItem(GENOME_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("genome-updated"));
}

export async function saveGenomeLaw(
  data: Omit<GenomeLaw, "id" | "createdAt">
): Promise<GenomeLaw> {
  const newItem: GenomeLaw = {
    id: `gl_${Date.now()}`,
    ...data,
    createdAt: new Date()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const path = `artifacts/sistemicar-v2-5/sistemicar_genome`;
      const docRef = await addDoc(collection(db, path), {
        ...newItem,
        createdAt: serverTimestamp()
      });
      newItem.id = docRef.id;
    } catch (error) {
      console.error("Error saving genome law:", error);
      const locals = getLocalGenome();
      locals.unshift(newItem);
      saveLocalGenome(locals);
    }
  } else {
    const locals = getLocalGenome();
    locals.unshift(newItem);
    saveLocalGenome(locals);
  }

  return newItem;
}

export async function updateGenomeLawStatus(
  lawId: string,
  status: "candidato" | "validado" | "rechazado"
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = `artifacts/sistemicar-v2-5/sistemicar_genome`;
      await updateDoc(doc(db, path, lawId), { status, persistencia_perpetua: status === "validado" });
    } catch (error) {
      console.error("Error updating genome law status:", error);
    }
  }
  const locals = getLocalGenome().map(g => g.id === lawId ? { ...g, status, persistencia_perpetua: status === "validado" } : g);
  saveLocalGenome(locals);
}

export async function deleteGenomeLaw(lawId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = `artifacts/sistemicar-v2-5/sistemicar_genome`;
      const lawDoc = await getDoc(doc(db, path, lawId));
      if (lawDoc.exists() && lawDoc.data()?.persistencia_perpetua) {
        console.warn("Cannot delete a law with perpetual persistence");
        return;
      }
      await deleteDoc(doc(db, path, lawId));
    } catch (error) {
      console.error("Error deleting genome law:", error);
    }
  }
  const locals = getLocalGenome().filter(g => g.id !== lawId);
  saveLocalGenome(locals);
}

export function subscribeToGenomeLaws(
  onData: (items: GenomeLaw[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = `artifacts/sistemicar-v2-5/sistemicar_genome`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    return onSnapshot(q,
      (snapshot) => {
        const items: GenomeLaw[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date()
        })) as GenomeLaw[];
        saveLocalGenome(items);
        onData(items);
      },
      (error) => {
        console.error("Error subscribing to genome:", error);
        onData(getLocalGenome());
        onError(error);
      }
    );
  } else {
    onData(getLocalGenome());
    const handler = () => onData(getLocalGenome());
    window.addEventListener("genome-updated", handler);
    return () => window.removeEventListener("genome-updated", handler);
  }
}

export async function getValidatedGenomeLaws(): Promise<GenomeLaw[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = `artifacts/sistemicar-v2-5/sistemicar_genome`;
      const q = query(collection(db, path), where("status", "==", "validado"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as GenomeLaw[];
    } catch (error) {
      console.error("Error getting validated genome laws:", error);
      return getLocalGenome().filter(g => g.status === "validado");
    }
  }
  return getLocalGenome().filter(g => g.status === "validado");
}

// ============ ESPEJO SESSIONS ============

export interface EspejoSession {
  id: string;
  userId: string;
  fecha: Date;
  modo: "captura" | "arquitecto";
  contexto?: string;
  pacienteId?: string;
  tipo_sesion?: "autonoma" | "asistida" | "ducha_mental";
  timestamp_inicio?: number;
  timestamp_fin?: number;
  contenido: {
    percibo?: string;
    reconozco?: string;
    cuento_con?: string;
    transformo?: string;
    preparacion?: string;
    fragmentos?: string[];
    registro_carga?: string;
    diagnostico_clinico?: string;
    protocolo_calibracion?: string;
    afloramiento?: string;
    disociacion?: string;
    recursos?: string;
    comparativa?: string;
  };
  puntos: number;
  mapaVoltaje?: {
    voltaje_total: number;
    ejes_voltaje: {
      percibo?: number;
      reconozco?: number;
      cuento_con?: number;
      transformo?: number;
      registro_carga?: number;
      diagnostico_clinico?: number;
      protocolo_calibracion?: number;
    };
    diagnostico: string;
    frecuencia_dominante: string;
    recomendacion: string;
    codigo_diagnostico?: string;
    interfaz_primaria?: string;
    interfaz_secundaria?: string;
    vibracion_final?: number;
  };
  vibracion_final?: number;
  createdAt: Date;
}

export interface SelfExpediente {
  codigoActual?: string;
  nivelMadurez?: string;
  sesionesCount: number;
  puntosSoberania: number;
  ultimaSesion?: Date | null;
  ultimoCodigo?: string;
  actualizadoAt?: Date;
}

export async function addEspejoSession(
  userId: string,
  session: Omit<EspejoSession, "id" | "userId" | "createdAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "espejoSessions");
    const docRef = await addDoc(collection(db, path), {
      userId,
      ...session,
      fecha: session.fecha,
      createdAt: serverTimestamp()
    });
    const sessionId = docRef.id;

    const selfPath = getPrivatePath(userId, "mi_expediente");
    const selfRef = doc(db, selfPath, "perfil");
    const selfSnap = await getDoc(selfRef);
    const prev = selfSnap.exists() ? selfSnap.data() : { sesionesCount: 0, puntosSoberania: 0 };
    const newCodigo = session.mapaVoltaje?.codigo_diagnostico || prev.ultimoCodigo;
    await setDoc(selfRef, {
      sesionesCount: (prev.sesionesCount || 0) + 1,
      puntosSoberania: (prev.puntosSoberania || 0) + (session.puntos || 0),
      ultimaSesion: session.fecha,
      ultimoCodigo: newCodigo || null,
      actualizadoAt: serverTimestamp()
    }, { merge: true });

    if (session.pacienteId) {
      const pacPath = getPrivatePath(userId, "pacientes");
      const pacRef = doc(db, pacPath, session.pacienteId);
      const pacSnap = await getDoc(pacRef);
      if (pacSnap.exists()) {
        const pd = pacSnap.data();
        await updateDoc(pacRef, {
          sesionesCount: (pd.sesionesCount || 0) + 1,
          puntosSoberania: (pd.puntosSoberania || 0) + (session.puntos || 0),
          ultimaSesion: session.fecha,
          actualizadoAt: serverTimestamp()
        });
      }
    }

    return sessionId;
  } else {
    const newId = `espejo_${Date.now()}`;
    const sessions = JSON.parse(localStorage.getItem("sistemicar_espejo_sesiones") || "[]");
    sessions.unshift({ id: newId, userId, ...session, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_espejo_sesiones", JSON.stringify(sessions.slice(0, 50)));
    window.dispatchEvent(new CustomEvent("espejo-updated"));
    return newId;
  }
}

export function subscribeSelfExpediente(
  userId: string,
  onData: (data: SelfExpediente | null) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const selfPath = getPrivatePath(userId, "mi_expediente");
    return onSnapshot(doc(db, selfPath, "perfil"), (snap) => {
      if (!snap.exists()) { onData(null); return; }
      const d = snap.data();
      onData({
        codigoActual: d.codigoActual,
        nivelMadurez: d.nivelMadurez,
        sesionesCount: d.sesionesCount || 0,
        puntosSoberania: d.puntosSoberania || 0,
        ultimaSesion: d.ultimaSesion?.toDate ? d.ultimaSesion.toDate() : d.ultimaSesion ? new Date(d.ultimaSesion) : null,
        ultimoCodigo: d.ultimoCodigo,
        actualizadoAt: d.actualizadoAt?.toDate ? d.actualizadoAt.toDate() : undefined
      });
    }, onError);
  }
  onData(null);
  return () => {};
}

export function subscribeToEspejoSessions(
  userId: string,
  onData: (sessions: EspejoSession[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "espejoSessions");
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as EspejoSession;
      });
      onData(sessions);
    }, onError);
  } else {
    const getLocal = () => {
      const raw = localStorage.getItem("sistemicar_espejo_sesiones");
      if (!raw) return [];
      return JSON.parse(raw).map((s: any) => ({ ...s, fecha: new Date(s.fecha), createdAt: new Date(s.createdAt || s.fecha) }));
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("espejo-updated", handler);
    return () => window.removeEventListener("espejo-updated", handler);
  }
}

// ============ ESPEJO CREDITS ============

export async function getEspejoCredits(userId: string): Promise<number> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "espejoCredits");
    const snapshot = await getDocs(query(collection(db, path)));
    if (snapshot.empty) {
      const localCredits = parseInt(localStorage.getItem("sistemicar_espejo_creditos") || "0");
      if (localCredits > 0) {
        await setEspejoCredits(userId, localCredits);
        return localCredits;
      }
      return 0;
    }
    return snapshot.docs[0].data().credits || 0;
  }
  return parseInt(localStorage.getItem("sistemicar_espejo_creditos") || "0");
}

export async function setEspejoCredits(userId: string, credits: number): Promise<void> {
  localStorage.setItem("sistemicar_espejo_creditos", credits.toString());
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "espejoCredits");
    const snapshot = await getDocs(query(collection(db, path)));
    if (snapshot.empty) {
      await addDoc(collection(db, path), { credits, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, path, snapshot.docs[0].id), { credits, updatedAt: serverTimestamp() });
    }
  }
  window.dispatchEvent(new CustomEvent("espejo-credits-updated"));
}

export function subscribeToEspejoCredits(
  userId: string,
  onData: (credits: number) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "espejoCredits");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const local = parseInt(localStorage.getItem("sistemicar_espejo_creditos") || "0");
        onData(local);
      } else {
        const credits = snapshot.docs[0].data().credits || 0;
        localStorage.setItem("sistemicar_espejo_creditos", credits.toString());
        onData(credits);
      }
    }, onError);
  } else {
    const getLocal = () => parseInt(localStorage.getItem("sistemicar_espejo_creditos") || "0");
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("espejo-credits-updated", handler);
    return () => window.removeEventListener("espejo-credits-updated", handler);
  }
}

export async function adminSetEspejoCredits(targetUserId: string, credits: number): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error("Firebase not configured");
  const path = getPrivatePath(targetUserId, "espejoCredits");
  const snapshot = await getDocs(query(collection(db, path)));
  if (snapshot.empty) {
    await addDoc(collection(db, path), { credits, updatedAt: serverTimestamp() });
  } else {
    await updateDoc(doc(db, path, snapshot.docs[0].id), { credits, updatedAt: serverTimestamp() });
  }
}

// ============ SEMILLAS (Automatizador) ============

export interface Semilla {
  id: string;
  semilla: string;
  interfaz: string;
  capitulo: string;
  guiones: { titulo: string; hook: string; valor: string; cta: string }[];
  keywords_seo: string[];
  fecha: Date;
  createdAt: Date;
}

export async function addSemilla(
  userId: string,
  data: Omit<Semilla, "id" | "createdAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "semillas");
    const docRef = await addDoc(collection(db, path), {
      ...data,
      fecha: data.fecha,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const newId = `semilla_${Date.now()}`;
    const items = JSON.parse(localStorage.getItem("sistemicar_semillas") || "[]");
    items.unshift({ id: newId, ...data, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_semillas", JSON.stringify(items.slice(0, 100)));
    window.dispatchEvent(new CustomEvent("semillas-updated"));
    return newId;
  }
}

export function subscribeToSemillas(
  userId: string,
  onData: (semillas: Semilla[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "semillas");
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const semillas = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as Semilla;
      });
      onData(semillas);
    }, onError);
  } else {
    const getLocal = () => {
      const raw = localStorage.getItem("sistemicar_semillas");
      if (!raw) return [];
      return JSON.parse(raw).map((s: any) => ({ ...s, fecha: new Date(s.fecha), createdAt: new Date(s.createdAt || s.fecha) }));
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("semillas-updated", handler);
    return () => window.removeEventListener("semillas-updated", handler);
  }
}

// ============ SISTEMA DE CONVICCIÓN ============

const CONVICCION_KEY = "sistemicar_conviccion_check";

export async function getConviccionCheck(userId: string): Promise<number> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "conviccion");
    const snapshot = await getDocs(query(collection(db, path)));
    if (snapshot.empty) {
      return parseInt(localStorage.getItem(CONVICCION_KEY) || "0");
    }
    return snapshot.docs[0].data().level || 0;
  }
  return parseInt(localStorage.getItem(CONVICCION_KEY) || "0");
}

export async function incrementConviccionCheck(userId: string): Promise<number> {
  const current = await getConviccionCheck(userId);
  const newLevel = Math.min(current + 1, 4);
  localStorage.setItem(CONVICCION_KEY, newLevel.toString());
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "conviccion");
    const snapshot = await getDocs(query(collection(db, path)));
    if (snapshot.empty) {
      await addDoc(collection(db, path), { level: newLevel, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, path, snapshot.docs[0].id), { level: newLevel, updatedAt: serverTimestamp() });
    }
  }
  window.dispatchEvent(new CustomEvent("conviccion-updated"));
  return newLevel;
}

export function subscribeToConviccion(
  userId: string,
  onData: (level: number) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "conviccion");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const local = parseInt(localStorage.getItem(CONVICCION_KEY) || "0");
        onData(local);
      } else {
        const level = snapshot.docs[0].data().level || 0;
        localStorage.setItem(CONVICCION_KEY, level.toString());
        onData(level);
      }
    }, onError);
  } else {
    const getLocal = () => parseInt(localStorage.getItem(CONVICCION_KEY) || "0");
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("conviccion-updated", handler);
    return () => window.removeEventListener("conviccion-updated", handler);
  }
}

// ============ EXPEDIENTE CLÍNICO (Persistencia Firebase) ============

export interface ExpedienteClinico {
  id: string;
  fecha: Date;
  seccion_afectada: string[];
  codigo_diagnostico: string;
  interfaz_primaria: string;
  interfaz_secundaria: string;
  respuestas: Record<string, string>;
  estado_habito: boolean;
  vibracion_final: number;
  timestamp_inicio: number;
  timestamp_fin: number;
  userId: string;
  createdAt: Date;
}

export async function addExpedienteClinico(
  userId: string,
  expediente: Omit<ExpedienteClinico, "id" | "userId" | "createdAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "expedienteClinico");
    const docRef = await addDoc(collection(db, path), {
      ...expediente,
      userId,
      fecha: expediente.fecha,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const newId = `exp_${Date.now()}`;
    const stored = JSON.parse(localStorage.getItem("sistemicar_expedientes") || "[]");
    stored.unshift({ id: newId, userId, ...expediente, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_expedientes", JSON.stringify(stored.slice(0, 100)));
    window.dispatchEvent(new CustomEvent("expediente-updated"));
    return newId;
  }
}

export function subscribeToExpedientes(
  userId: string,
  onData: (expedientes: ExpedienteClinico[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "expedienteClinico");
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const expedientes = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as ExpedienteClinico;
      });
      expedientes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(expedientes);
    }, onError);
  } else {
    const getLocal = (): ExpedienteClinico[] => {
      const raw = localStorage.getItem("sistemicar_expedientes");
      if (!raw) return [];
      return JSON.parse(raw).map((e: any) => ({
        ...e,
        fecha: new Date(e.fecha),
        createdAt: new Date(e.createdAt || e.fecha)
      }));
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("expediente-updated", handler);
    return () => window.removeEventListener("expediente-updated", handler);
  }
}

export async function updateEstadoHabito(
  userId: string,
  expedienteId: string,
  completado: boolean
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "expedienteClinico");
    await updateDoc(doc(db, path, expedienteId), {
      estado_habito: completado
    });
  } else {
    const stored = JSON.parse(localStorage.getItem("sistemicar_expedientes") || "[]");
    const updated = stored.map((e: any) =>
      e.id === expedienteId ? { ...e, estado_habito: completado } : e
    );
    localStorage.setItem("sistemicar_expedientes", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("expediente-updated"));
  }
}

export async function getExpedientesRecientes(
  userId: string,
  count: number = 5
): Promise<ExpedienteClinico[]> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "expedienteClinico");
    const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
      } as ExpedienteClinico;
    });
  } else {
    const raw = localStorage.getItem("sistemicar_expedientes");
    if (!raw) return [];
    const all = JSON.parse(raw).map((e: any) => ({
      ...e,
      fecha: new Date(e.fecha),
      createdAt: new Date(e.createdAt || e.fecha)
    })) as ExpedienteClinico[];
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all.slice(0, count);
  }
}

export interface BloqueoEje3 {
  codigo: string;
  veces: number;
  hasta: number;
  activadoAt: number;
}

export async function detectarBucleSabotaje(
  userId: string
): Promise<{ bloqueado: boolean; codigo: string; veces: number; hasta: number } | null> {
  const expedientes = await getExpedientesRecientes(userId, 5);
  if (expedientes.length < 3) return null;

  const conteo: Record<string, number> = {};
  for (const exp of expedientes) {
    const code = exp.codigo_diagnostico?.trim();
    if (code) {
      conteo[code] = (conteo[code] || 0) + 1;
    }
  }

  for (const [codigo, veces] of Object.entries(conteo)) {
    if (veces >= 3) {
      const hasta = Date.now() + 12 * 60 * 60 * 1000;
      await setBloqueoEje3(userId, codigo, hasta);
      return { bloqueado: true, codigo, veces, hasta };
    }
  }

  return null;
}

export async function getBloqueoEje3(userId: string): Promise<BloqueoEje3 | null> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "bloqueoEje3");
    const docRef = doc(db, path, "current");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BloqueoEje3;
      if (data.hasta > Date.now()) {
        return data;
      }
      return null;
    }
    return null;
  } else {
    const raw = localStorage.getItem(`sistemicar_bloqueo_eje3_${userId}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as BloqueoEje3;
    if (data.hasta > Date.now()) {
      return data;
    }
    localStorage.removeItem(`sistemicar_bloqueo_eje3_${userId}`);
    return null;
  }
}

export async function setBloqueoEje3(
  userId: string,
  codigo: string,
  hasta: number
): Promise<void> {
  const bloqueo: BloqueoEje3 = {
    codigo,
    veces: 3,
    hasta,
    activadoAt: Date.now()
  };

  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "bloqueoEje3");
    await setDoc(doc(db, path, "current"), bloqueo);
  } else {
    localStorage.setItem(`sistemicar_bloqueo_eje3_${userId}`, JSON.stringify(bloqueo));
  }
}

export async function adminSetEspejoCreditsByEmail(email: string, credits: number): Promise<string> {
  if (!isFirebaseConfigured() || !db) throw new Error("Firebase not configured");
  const normalizedEmail = email.toLowerCase().trim();
  const result = await findUserByEmail(normalizedEmail);
  if (result) {
    await adminSetEspejoCredits(result.uid, credits);
    return result.uid;
  }
  const usersRef = collection(db, "artifacts/sistemicar-v2-5/users");
  const usersSnapshot = await getDocs(usersRef);
  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    if (userData.email?.toLowerCase() === normalizedEmail) {
      await adminSetEspejoCredits(uid, credits);
      return uid;
    }
  }
  const emailBasedUid = `email_${normalizedEmail.replace(/[^a-z0-9]/g, "_")}`;
  await adminSetEspejoCredits(emailBasedUid, credits);
  const prospecto = await getProspectoByEmail(normalizedEmail);
  if (!prospecto) {
    await addDoc(collection(db, "prospectos"), {
      nombre: normalizedEmail.split("@")[0],
      whatsapp: "",
      correo: normalizedEmail,
      pagoConfirmado: true,
      registradoEn: serverTimestamp()
    });
  }
  return emailBasedUid;
}

export async function findUserByEmail(email: string): Promise<{ uid: string; email: string; rank: string; totalCP: number } | null> {
  if (!isFirebaseConfigured() || !db) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const OWNER_EMAIL = "gilsonarevalo.leo@gmail.com";
  if (normalizedEmail === OWNER_EMAIL) {
    const { auth } = await import("./firebase");
    const currentUser = auth?.currentUser;
    if (currentUser && currentUser.email?.toLowerCase() === OWNER_EMAIL) {
      return {
        uid: currentUser.uid,
        email: OWNER_EMAIL,
        rank: "owner",
        totalCP: 9999
      };
    }
  }
  try {
    const q = query(collection(db, "prospectos"), where("correo", "==", normalizedEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const usersRef = collection(db, "artifacts/sistemicar-v2-5/users");
      const usersSnapshot = await getDocs(usersRef);
      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        try {
          const progressionPath = `artifacts/sistemicar-v2-5/users/${uid}/progression`;
          const progSnapshot = await getDocs(collection(db, progressionPath));
          if (!progSnapshot.empty) {
            const progData = progSnapshot.docs[0].data();
            const pEmail = progData.email || userDoc.data()?.email;
            if (pEmail && pEmail.toLowerCase() === normalizedEmail) {
              return {
                uid,
                email: normalizedEmail,
                rank: progData.rank || "iniciado",
                totalCP: progData.totalCP || progData.points || 0
              };
            }
          }
        } catch {}
      }
      return {
        uid: snapshot.docs[0].id,
        email: normalizedEmail,
        rank: data.pagoConfirmado ? "espejo" : "iniciado",
        totalCP: 0
      };
    }
  } catch (e) {
    console.error("Error searching prospectos:", e);
  }
  try {
    const usersRef = collection(db, "artifacts/sistemicar-v2-5/users");
    const usersSnapshot = await getDocs(usersRef);
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        const progressionPath = `artifacts/sistemicar-v2-5/users/${uid}/progression`;
        const progSnapshot = await getDocs(collection(db, progressionPath));
        if (!progSnapshot.empty) {
          const progData = progSnapshot.docs[0].data();
          const userEmail = progData.email || userDoc.data()?.email;
          if (userEmail && userEmail.toLowerCase() === normalizedEmail) {
            return {
              uid,
              email: userEmail,
              rank: progData.rank || "iniciado",
              totalCP: progData.totalCP || progData.points || 0
            };
          }
        }
      } catch {}
    }
  } catch (e) {
    console.error("Error searching users:", e);
  }
  return null;
}

// ========== FÁBRICA SENSORIAL ==========

export interface ShortYT {
  titulo: string;
  guion: string;
  hook: string;
}

export interface MasterclassYT {
  interfaz: string;
  nombre_interfaz: string;
  guion_extendido: string;
  thumbnail_prompt: string;
  titulos: { miedo: string; poder: string; tecnico: string };
  descripcion_seo: string;
  shorts: ShortYT[];
  timing: { orden_publicacion: number; dia_semana: string; razon: string };
  tracking_url: string;
  fecha_generacion: string;
  video_url?: string;
}

export interface LoteMasterclass {
  id: string;
  masterclasses: MasterclassYT[];
  total: number;
  fecha_generacion: string;
  createdAt: Date;
}

export async function addLoteMasterclass(
  userId: string,
  data: Omit<LoteMasterclass, "id" | "createdAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = `artifacts/sistemicar-v2-5/users/${userId}/youtubeEducator/masterclasses`;
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `mc_${Date.now()}`;
    const existing = JSON.parse(localStorage.getItem("sistemicar_masterclasses") || "[]");
    existing.unshift({ ...data, id, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_masterclasses", JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("masterclass-updated"));
    return id;
  }
}

export function subscribeToLotesMasterclass(
  userId: string,
  onData: (lotes: LoteMasterclass[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = `artifacts/sistemicar-v2-5/users/${userId}/youtubeEducator/masterclasses`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const lotes = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as LoteMasterclass;
      });
      onData(lotes);
    }, onError);
  } else {
    const getLocal = () => {
      const raw = localStorage.getItem("sistemicar_masterclasses");
      if (!raw) return [];
      return JSON.parse(raw).map((l: any) => ({ ...l, createdAt: new Date(l.createdAt) }));
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("masterclass-updated", handler);
    return () => window.removeEventListener("masterclass-updated", handler);
  }
}

export async function addSingleMasterclass(
  userId: string,
  masterclass: MasterclassYT
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const colRef = collection(db, "users", userId, "youtubeEducator", "main", "masterclassSingles");
    const docRef = await addDoc(colRef, {
      ...masterclass,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `mc_single_${Date.now()}`;
    const existing = JSON.parse(localStorage.getItem("sistemicar_masterclass_singles") || "[]");
    existing.unshift({ ...masterclass, id, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_masterclass_singles", JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("masterclass-singles-updated"));
    return id;
  }
}

export function subscribeToSingleMasterclasses(
  userId: string,
  onData: (masterclasses: MasterclassYT[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const colRef = collection(db, "users", userId, "youtubeEducator", "main", "masterclassSingles");
    const q = query(colRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const docData = d.data();
        return { id: d.id, ...docData } as MasterclassYT;
      });
      onData(data);
    }, onError);
  } else {
    const getLocal = () => {
      const raw = localStorage.getItem("sistemicar_masterclass_singles");
      if (!raw) return [];
      return JSON.parse(raw);
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("masterclass-singles-updated", handler);
    return () => window.removeEventListener("masterclass-singles-updated", handler);
  }
}

export async function updateMasterclassVideoUrl(
  userId: string,
  interfazId: string,
  videoUrl: string
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const colRef = collection(db, "users", userId, "youtubeEducator", "main", "masterclassSingles");
    const q = query(colRef, where("interfaz", "==", interfazId), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      await updateDoc(snapshot.docs[0].ref, { video_url: videoUrl });
    }
  }
  const existing = JSON.parse(localStorage.getItem("sistemicar_mc_video_urls") || "{}");
  existing[interfazId] = videoUrl;
  localStorage.setItem("sistemicar_mc_video_urls", JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent("masterclass-singles-updated"));
}

export async function addSinglePieza(
  userId: string,
  pieza: PiezaSensorial
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const colRef = collection(db, "users", userId, "fabricaSensorial", "main", "piezaSingles");
    const docRef = await addDoc(colRef, {
      ...pieza,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `pieza_single_${Date.now()}`;
    const existing = JSON.parse(localStorage.getItem("sistemicar_pieza_singles") || "[]");
    existing.unshift({ ...pieza, id, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_pieza_singles", JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("pieza-singles-updated"));
    return id;
  }
}

export function subscribeToSinglePiezas(
  userId: string,
  onData: (piezas: PiezaSensorial[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const colRef = collection(db, "users", userId, "fabricaSensorial", "main", "piezaSingles");
    const q = query(colRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const docData = d.data();
        return { id: d.id, ...docData } as PiezaSensorial;
      });
      onData(data);
    }, onError);
  } else {
    const getLocal = () => {
      const raw = localStorage.getItem("sistemicar_pieza_singles");
      if (!raw) return [];
      return JSON.parse(raw);
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("pieza-singles-updated", handler);
    return () => window.removeEventListener("pieza-singles-updated", handler);
  }
}

export interface PiezaSensorial {
  interfaz: string;
  nombre_interfaz: string;
  titulo_pieza: string;
  guion_narrador: string;
  subtitulos: { texto: string; segundos: number }[];
  descripcion_visual: string;
  image_prompt: string;
  caption_instagram: string;
  caption_tiktok: string;
  binaural_hz: number;
  hashtags: string[];
  tracking_url: string;
  formato: string;
  duracion_estimada: number;
  fecha_pieza: string;
}

export interface LoteFabrica {
  id: string;
  piezas: PiezaSensorial[];
  total_piezas: number;
  fecha_generacion: string;
  createdAt: Date;
}

export async function addLoteFabrica(
  userId: string,
  data: Omit<LoteFabrica, "id" | "createdAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = `artifacts/sistemicar-v2-5/users/${userId}/fabricaSensorial/lotes`;
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `lote_${Date.now()}`;
    const existing = JSON.parse(localStorage.getItem("sistemicar_lotes_fabrica") || "[]");
    existing.unshift({ ...data, id, createdAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_lotes_fabrica", JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("lotes-fabrica-updated"));
    return id;
  }
}

export function subscribeToLotesFabrica(
  userId: string,
  onData: (lotes: LoteFabrica[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = `artifacts/sistemicar-v2-5/users/${userId}/fabricaSensorial/lotes`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const lotes = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        } as LoteFabrica;
      });
      onData(lotes);
    }, onError);
  } else {
    const getLocal = () => {
      const raw = localStorage.getItem("sistemicar_lotes_fabrica");
      if (!raw) return [];
      return JSON.parse(raw).map((l: any) => ({ ...l, createdAt: new Date(l.createdAt) }));
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("lotes-fabrica-updated", handler);
    return () => window.removeEventListener("lotes-fabrica-updated", handler);
  }
}

// ============================================================
// PLANTILLAS DE RUTINA - Sistema de Rutinas Automáticas
// ============================================================

export interface SegmentoTemplate {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  color: string;
  icono: string;
}

export interface PlantillaRutina {
  id: string;
  nombre: string;
  tipo: "semana_laboral" | "fin_de_semana" | "dia_especial";
  diasActivos: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  segmentos: SegmentoTemplate[];
  creadaAt: any;
}

const PLANTILLAS_LOCAL_KEY = "sistemicar_plantillas_rutina_v1";

function getLocalPlantillas(): PlantillaRutina[] {
  try {
    const data = localStorage.getItem(PLANTILLAS_LOCAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLocalPlantillas(plantillas: PlantillaRutina[]): void {
  try { localStorage.setItem(PLANTILLAS_LOCAL_KEY, JSON.stringify(plantillas)); } catch { }
}

export async function getPlantillasRutina(userId: string): Promise<PlantillaRutina[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "plantillasRutina");
      const snapshot = await getDocs(collection(db, path));
      if (!snapshot.empty) {
        const plantillas = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlantillaRutina));
        saveLocalPlantillas(plantillas);
        return plantillas;
      }
    } catch { }
  }
  return getLocalPlantillas();
}

export function subscribePlantillasRutina(
  userId: string,
  onData: (plantillas: PlantillaRutina[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    onData(getLocalPlantillas());
    return () => {};
  }
  try {
    onData(getLocalPlantillas());
    const path = getPrivatePath(userId, "plantillasRutina");
    return onSnapshot(collection(db, path), (snapshot) => {
      const plantillas = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlantillaRutina));
      saveLocalPlantillas(plantillas);
      onData(plantillas);
    });
  } catch { return () => {}; }
}

export async function addPlantillaRutina(userId: string, plantilla: Omit<PlantillaRutina, "id" | "creadaAt">): Promise<PlantillaRutina> {
  const id = `rutina_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nueva: PlantillaRutina = { ...plantilla, id, creadaAt: new Date().toISOString() };
  const current = getLocalPlantillas();
  saveLocalPlantillas([...current, nueva]);

  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "plantillasRutina");
      await setDoc(doc(db, path, id), { ...plantilla, creadaAt: serverTimestamp() });
    } catch { }
  }
  return nueva;
}

export async function deletePlantillaRutina(userId: string, plantillaId: string): Promise<void> {
  const current = getLocalPlantillas().filter(p => p.id !== plantillaId);
  saveLocalPlantillas(current);
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "plantillasRutina");
      await deleteDoc(doc(db, path, plantillaId));
    } catch { }
  }
}

export async function applyPlantillaToday(userId: string, plantilla: PlantillaRutina): Promise<Planilla> {
  const fecha = getTodayDateString();
  const segmentos: SegmentoV5[] = plantilla.segmentos.map((t) => ({
    id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    nombre: t.nombre,
    horaInicio: t.horaInicio,
    horaFin: t.horaFin,
    color: t.color,
    icono: t.icono,
    estado: "pendiente",
    eventos: [],
    psGanados: 0,
  }));
  const planilla: Planilla = {
    id: `planilla_${fecha}_${Date.now()}`,
    fecha,
    segmentos,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await savePlanilla(userId, planilla);
  return planilla;
}

const MURO_LS_KEY = "sistemicar_muro_soberano_firmado";

export async function getMuroFirmado(userId: string): Promise<boolean> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(userId, "muroSoberano");
    const docRef = doc(db, path, "estado");
    try {
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().firmado === true) {
        try { localStorage.setItem(MURO_LS_KEY, "true"); } catch { }
        return true;
      }
    } catch { }
  }
  try { return localStorage.getItem(MURO_LS_KEY) === "true"; } catch { return false; }
}

export async function setMuroFirmado(userId: string): Promise<void> {
  try { localStorage.setItem(MURO_LS_KEY, "true"); } catch { }
  if (isFirebaseConfigured() && db) {
    try {
      const path = getPrivatePath(userId, "muroSoberano");
      await setDoc(doc(db, path, "estado"), { firmado: true, firmadoAt: serverTimestamp() });
    } catch { }
  }
}

// ============================================================
// TALLER DE LIBROS — Serie Espejo (10 libros × 10 capítulos × 3 carriles)
// ============================================================

export interface SubInterfazLibro {
  id: string;
  titulo: string;
  falla: string;
  descripcion: string;
  orden: number;
}

export interface FichaAuditResult {
  materialFound: boolean;
  ganchoFound: boolean;
  passed: boolean;
  retried: boolean;
}

export interface CapituloCarriles {
  interfazId: string;
  subInterfazId: string;
  subInterfazTitulo: string;
  carril1: string;
  carril2: string;
  carril3: string;
  status: "pendiente" | "generando" | "listo" | "revisado";
  generadoAt?: any;
  fichaAudit?: Record<string, FichaAuditResult>;
  cerebro_v2?: boolean;
}

const TALLER_ESPEJO_BASE = (userId: string) =>
  `artifacts/sistemicar-v2-5/users/${userId}/tallerLibros/espejo`;

export async function saveSubInterfacesLibro(
  userId: string,
  interfazId: string,
  subInterfaces: SubInterfazLibro[]
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const docPath = `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/data`;
    await setDoc(doc(db, docPath), {
      interfazId,
      subInterfaces,
      updatedAt: serverTimestamp()
    });
  } else {
    const key = `sistemicar_taller_subs_${interfazId}`;
    localStorage.setItem(key, JSON.stringify(subInterfaces));
    window.dispatchEvent(new CustomEvent(`taller-subs-updated`));
  }
}

export function subscribeToSubInterfacesLibro(
  userId: string,
  interfazId: string,
  onData: (subs: SubInterfazLibro[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const docPath = `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/data`;
    return onSnapshot(doc(db, docPath), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData(data.subInterfaces || []);
      } else {
        onData([]);
      }
    }, onError);
  } else {
    const key = `sistemicar_taller_subs_${interfazId}`;
    const getLocal = () => {
      try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("taller-subs-updated", handler);
    return () => window.removeEventListener("taller-subs-updated", handler);
  }
}

export function subscribeToAllSubInterfacesLibro(
  userId: string,
  onData: (allSubs: Record<string, SubInterfazLibro[]>) => void,
  onError: (error: Error) => void
): () => void {
  const ALL_IDS = ["M01","M02","M03","M04","M05","M06","M07","M08","M09","M10"];
  if (isFirebaseConfigured() && db) {
    const result: Record<string, SubInterfazLibro[]> = {};
    let pending = ALL_IDS.length;
    const unsubs: (() => void)[] = [];
    ALL_IDS.forEach(interfazId => {
      const docPath = `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/data`;
      const unsub = onSnapshot(doc(db!, docPath), (snap) => {
        result[interfazId] = snap.exists() ? (snap.data().subInterfaces || []) : [];
        onData({ ...result });
        pending--;
      }, onError);
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  } else {
    const getLocal = (): Record<string, SubInterfazLibro[]> => {
      const res: Record<string, SubInterfazLibro[]> = {};
      ALL_IDS.forEach(id => {
        try {
          const raw = localStorage.getItem(`sistemicar_taller_subs_${id}`);
          if (raw) res[id] = JSON.parse(raw);
        } catch { /* ignore */ }
      });
      return res;
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("taller-subs-updated", handler);
    return () => window.removeEventListener("taller-subs-updated", handler);
  }
}

export async function saveCapituloStatusLibro(
  userId: string,
  interfazId: string,
  subInterfazId: string,
  status: CapituloCarriles["status"],
  subInterfazTitulo?: string
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const capitulosPath = `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/data/capitulos`;
    await setDoc(doc(db, capitulosPath, subInterfazId), {
      interfazId,
      subInterfazId,
      ...(subInterfazTitulo ? { subInterfazTitulo } : {}),
      status,
      generadoAt: serverTimestamp()
    }, { merge: true });
  } else {
    const key = `sistemicar_taller_cap_${interfazId}_${subInterfazId}`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
    localStorage.setItem(key, JSON.stringify({
      ...existing,
      interfazId, subInterfazId,
      ...(subInterfazTitulo ? { subInterfazTitulo } : {}),
      status,
      generadoAt: new Date().toISOString()
    }));
    window.dispatchEvent(new CustomEvent(`taller-cap-updated`));
  }
}

export async function saveCapituloCarrilesLibro(
  userId: string,
  interfazId: string,
  subInterfazId: string,
  carriles: Pick<CapituloCarriles, "subInterfazTitulo" | "carril1" | "carril2" | "carril3">,
  fichaAudit?: Record<string, FichaAuditResult>,
  cerebro_v2?: boolean
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const capitulosPath = `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/data/capitulos`;
    await setDoc(doc(db, capitulosPath, subInterfazId), {
      interfazId,
      subInterfazId,
      ...carriles,
      status: "listo",
      generadoAt: serverTimestamp(),
      ...(fichaAudit ? { fichaAudit } : {}),
      ...(cerebro_v2 ? { cerebro_v2: true } : {})
    }, { merge: true });
  } else {
    const key = `sistemicar_taller_cap_${interfazId}_${subInterfazId}`;
    const existing = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
    localStorage.setItem(key, JSON.stringify({
      ...existing,
      interfazId, subInterfazId, ...carriles, status: "listo",
      generadoAt: new Date().toISOString(),
      ...(fichaAudit ? { fichaAudit } : {}),
      ...(cerebro_v2 ? { cerebro_v2: true } : {})
    }));
    window.dispatchEvent(new CustomEvent(`taller-cap-updated`));
  }
}

export function subscribeToCapitulosLibro(
  userId: string,
  interfazId: string,
  onData: (capitulos: Record<string, CapituloCarriles>) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const capitulosPath = `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/data/capitulos`;
    return onSnapshot(collection(db, capitulosPath), (snapshot) => {
      const result: Record<string, CapituloCarriles> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        result[d.id] = {
          interfazId: data.interfazId || interfazId,
          subInterfazId: data.subInterfazId || d.id,
          subInterfazTitulo: data.subInterfazTitulo || "",
          carril1: data.carril1 || "",
          carril2: data.carril2 || "",
          carril3: data.carril3 || "",
          status: data.status || "listo",
          generadoAt: data.generadoAt,
          ...(data.fichaAudit ? { fichaAudit: data.fichaAudit } : {}),
          ...(data.cerebro_v2 ? { cerebro_v2: true } : {}),
        };
      });
      onData(result);
    }, onError);
  } else {
    const PREFIX = `sistemicar_taller_cap_${interfazId}_`;
    const getLocal = (): Record<string, CapituloCarriles> => {
      const result: Record<string, CapituloCarriles> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          try {
            const d = JSON.parse(localStorage.getItem(k) || "{}") as CapituloCarriles;
            result[d.subInterfazId || k.replace(PREFIX, "")] = d;
          } catch { /* ignore */ }
        }
      }
      return result;
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("taller-cap-updated", handler);
    return () => window.removeEventListener("taller-cap-updated", handler);
  }
}

export function subscribeToAllCapitulosLibro(
  userId: string,
  onData: (capitulos: Record<string, CapituloCarriles>) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    return onSnapshot(collectionGroup(db, "capitulos"), (snapshot) => {
      const result: Record<string, CapituloCarriles> = {};
      snapshot.docs.forEach(d => {
        if (!d.ref.path.includes(`/users/${userId}/`)) return;
        const data = d.data();
        result[d.ref.path] = {
          interfazId: data.interfazId,
          subInterfazId: data.subInterfazId || d.id,
          subInterfazTitulo: data.subInterfazTitulo || "",
          carril1: data.carril1 || "",
          carril2: data.carril2 || "",
          carril3: data.carril3 || "",
          status: data.status || "listo",
          generadoAt: data.generadoAt,
          ...(data.fichaAudit ? { fichaAudit: data.fichaAudit } : {}),
          ...(data.cerebro_v2 ? { cerebro_v2: true } : {}),
        };
      });
      onData(result);
    }, onError);
  } else {
    const PREFIX = `sistemicar_taller_cap_`;
    const getAll = (): Record<string, CapituloCarriles> => {
      const result: Record<string, CapituloCarriles> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          try {
            const d = JSON.parse(localStorage.getItem(k) || "{}") as CapituloCarriles;
            result[k] = d;
          } catch { /* ignore */ }
        }
      }
      return result;
    };
    onData(getAll());
    const handler = () => onData(getAll());
    window.addEventListener("taller-cap-updated", handler);
    return () => window.removeEventListener("taller-cap-updated", handler);
  }
}

// ========== RADIOGRAFÍA DEL OPERADOR — SISTEMA DE TOKENS ==========

export interface RadiografiaTokenData {
  tokens: number;
  milestonesCrossed: number[];
  lastSubscriptionRefresh: string;
}

const RADIOGRAFIA_DEFAULT: RadiografiaTokenData = {
  tokens: 0,
  milestonesCrossed: [],
  lastSubscriptionRefresh: ""
};

export async function getRadiografiaTokens(userId: string): Promise<RadiografiaTokenData> {
  if (isFirebaseConfigured() && db) {
    try {
      const ref = doc(db, getPrivatePath(userId, "radiografiaTokens"), "data");
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data() as RadiografiaTokenData;
    } catch {}
  }
  try {
    const local = localStorage.getItem("sistemicar_radiografia_tokens");
    if (local) return JSON.parse(local);
  } catch {}
  return { ...RADIOGRAFIA_DEFAULT };
}

export async function setRadiografiaTokens(userId: string, data: RadiografiaTokenData): Promise<void> {
  try { localStorage.setItem("sistemicar_radiografia_tokens", JSON.stringify(data)); } catch {}
  if (isFirebaseConfigured() && db) {
    try {
      const ref = doc(db, getPrivatePath(userId, "radiografiaTokens"), "data");
      await setDoc(ref, data);
    } catch {}
  }
}

export function subscribeToRadiografiaTokens(
  userId: string,
  onData: (data: RadiografiaTokenData) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const ref = doc(db, getPrivatePath(userId, "radiografiaTokens"), "data");
    return onSnapshot(ref, (snap) => {
      onData(snap.exists() ? (snap.data() as RadiografiaTokenData) : { ...RADIOGRAFIA_DEFAULT });
    }, () => {
      try {
        const local = localStorage.getItem("sistemicar_radiografia_tokens");
        onData(local ? JSON.parse(local) : { ...RADIOGRAFIA_DEFAULT });
      } catch { onData({ ...RADIOGRAFIA_DEFAULT }); }
    });
  }
  try {
    const local = localStorage.getItem("sistemicar_radiografia_tokens");
    onData(local ? JSON.parse(local) : { ...RADIOGRAFIA_DEFAULT });
  } catch { onData({ ...RADIOGRAFIA_DEFAULT }); }
  return () => {};
}

export async function checkAndAwardRadiografiaMilestones(
  userId: string,
  totalPS: number,
  current: RadiografiaTokenData
): Promise<{ awarded: number; newTokens: number }> {
  const STEP = 350;
  const maxMilestone = Math.floor(totalPS / STEP) * STEP;
  const newMilestones: number[] = [];
  for (let m = STEP; m <= maxMilestone; m += STEP) {
    if (!current.milestonesCrossed.includes(m)) newMilestones.push(m);
  }
  if (newMilestones.length === 0) return { awarded: 0, newTokens: current.tokens };
  const updated: RadiografiaTokenData = {
    tokens: current.tokens + newMilestones.length,
    milestonesCrossed: [...current.milestonesCrossed, ...newMilestones],
    lastSubscriptionRefresh: current.lastSubscriptionRefresh
  };
  await setRadiografiaTokens(userId, updated);
  return { awarded: newMilestones.length, newTokens: updated.tokens };
}

export async function checkAndRefreshSubscriptionRadiografia(
  userId: string,
  plan: string | null | undefined,
  current: RadiografiaTokenData
): Promise<RadiografiaTokenData> {
  const ELIGIBLE = ["soberano_operativo", "soberano"];
  if (!plan || !ELIGIBLE.includes(plan)) return current;
  const now = new Date();
  const day = now.getDate();
  if (day !== 1 && day !== 15) return current;
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${day}`;
  if (current.lastSubscriptionRefresh === key) return current;
  const updated: RadiografiaTokenData = { ...current, tokens: current.tokens + 2, lastSubscriptionRefresh: key };
  await setRadiografiaTokens(userId, updated);
  return updated;
}

export async function consumeRadiografiaToken(userId: string): Promise<boolean> {
  const current = await getRadiografiaTokens(userId);
  if (current.tokens <= 0) return false;
  await setRadiografiaTokens(userId, { ...current, tokens: current.tokens - 1 });
  return true;
}

// ========== NOTAS DE EVOLUCIÓN DEL ALGORITMO ==========

export interface NotaEvolucion {
  tipo: string;
  titulo: string;
  cuerpo: string;
}

const TALLER_EVOLUCION_PATH = (userId: string, interfazId: string) =>
  `${TALLER_ESPEJO_BASE(userId)}/${interfazId}/evolucion`;

export async function saveNotasEvolucionLibro(
  userId: string,
  interfazId: string,
  subInterfazId: string,
  coordenada: string,
  notas: NotaEvolucion[]
): Promise<void> {
  if (!notas) return;
  const payload = { subInterfazId, coordenada, notas, savedAt: new Date().toISOString() };
  if (isFirebaseConfigured() && db) {
    const docPath = `${TALLER_EVOLUCION_PATH(userId, interfazId)}/${subInterfazId}`;
    await setDoc(doc(db, docPath), payload, { merge: true });
  } else {
    const key = `sistemicar_notas_evolucion_${interfazId}_${subInterfazId}`;
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("taller-notas-updated"));
  }
}

export function subscribeToNotasEvolucionLibro(
  userId: string,
  interfazId: string,
  onData: (notas: Record<string, { coordenada: string; notas: NotaEvolucion[] }>) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const colPath = TALLER_EVOLUCION_PATH(userId, interfazId);
    return onSnapshot(collection(db, colPath), (snap) => {
      const result: Record<string, { coordenada: string; notas: NotaEvolucion[] }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        result[d.id] = { coordenada: data.coordenada || d.id, notas: data.notas || [] };
      });
      onData(result);
    }, onError);
  } else {
    const PREFIX = `sistemicar_notas_evolucion_${interfazId}_`;
    const getLocal = (): Record<string, { coordenada: string; notas: NotaEvolucion[] }> => {
      const result: Record<string, { coordenada: string; notas: NotaEvolucion[] }> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) {
          try {
            const d = JSON.parse(localStorage.getItem(k) || "{}");
            const subId = k.replace(PREFIX, "");
            result[subId] = { coordenada: d.coordenada || subId, notas: d.notas || [] };
          } catch { /* ignore */ }
        }
      }
      return result;
    };
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("taller-notas-updated", handler);
    return () => window.removeEventListener("taller-notas-updated", handler);
  }
}

export async function getNotasEvolucionParaDoctor(
  userId: string,
  interfazId: string
): Promise<NotaEvolucion[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const colPath = TALLER_EVOLUCION_PATH(userId, interfazId);
      const snap = await getDocs(collection(db, colPath));
      const allNotas: NotaEvolucion[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (Array.isArray(data.notas)) allNotas.push(...data.notas);
      });
      return allNotas.slice(-20);
    } catch { return []; }
  } else {
    const PREFIX = `sistemicar_notas_evolucion_${interfazId}_`;
    const allNotas: NotaEvolucion[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        try {
          const d = JSON.parse(localStorage.getItem(k) || "{}");
          if (Array.isArray(d.notas)) allNotas.push(...d.notas);
        } catch { /* ignore */ }
      }
    }
    return allNotas.slice(-20);
  }
}

// ============ EXPEDIENTES DE PACIENTES ============

export interface Paciente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  codigoActual?: string;
  nivelMadurez?: string;
  notasGenerales?: string;
  sesionesCount?: number;
  puntosSoberania?: number;
  ultimaSesion?: Date | null;
  creadoAt: Date;
  actualizadoAt?: Date;
}

export interface NotaClinica {
  id: string;
  texto: string;
  pacienteId: string;
  fecha: Date;
  creadoAt: Date;
}

const ADMIN_EMAIL = "gilsonarevalo.leo@gmail.com";

export async function addPaciente(
  doctorUserId: string,
  data: Omit<Paciente, "id" | "creadoAt" | "actualizadoAt">
): Promise<string> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "pacientes");
    const docRef = await addDoc(collection(db, path), {
      ...data,
      creadoAt: serverTimestamp(),
      actualizadoAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `pac_${Date.now()}`;
    const all = JSON.parse(localStorage.getItem("sistemicar_pacientes") || "[]");
    all.unshift({ id, ...data, creadoAt: new Date().toISOString(), actualizadoAt: new Date().toISOString() });
    localStorage.setItem("sistemicar_pacientes", JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("pacientes-updated"));
    return id;
  }
}

export async function updatePaciente(
  doctorUserId: string,
  pacienteId: string,
  data: Partial<Omit<Paciente, "id" | "creadoAt">>
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "pacientes");
    await updateDoc(doc(db, path, pacienteId), {
      ...data,
      actualizadoAt: serverTimestamp()
    });
  } else {
    const all = JSON.parse(localStorage.getItem("sistemicar_pacientes") || "[]");
    const idx = all.findIndex((p: any) => p.id === pacienteId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...data, actualizadoAt: new Date().toISOString() };
      localStorage.setItem("sistemicar_pacientes", JSON.stringify(all));
      window.dispatchEvent(new CustomEvent("pacientes-updated"));
    }
  }
}

export async function getPacientes(doctorUserId: string): Promise<Paciente[]> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "pacientes");
    const snap = await getDocs(query(collection(db, path), orderBy("creadoAt", "desc")));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        creadoAt: data.creadoAt?.toDate ? data.creadoAt.toDate() : new Date(data.creadoAt || Date.now()),
        actualizadoAt: data.actualizadoAt?.toDate ? data.actualizadoAt.toDate() : undefined,
        ultimaSesion: data.ultimaSesion?.toDate ? data.ultimaSesion.toDate() : data.ultimaSesion ? new Date(data.ultimaSesion) : null,
      } as Paciente;
    });
  } else {
    return JSON.parse(localStorage.getItem("sistemicar_pacientes") || "[]").map((p: any) => ({
      ...p,
      creadoAt: new Date(p.creadoAt),
      actualizadoAt: p.actualizadoAt ? new Date(p.actualizadoAt) : undefined,
      ultimaSesion: p.ultimaSesion ? new Date(p.ultimaSesion) : null
    }));
  }
}

export function subscribeToPacientes(
  doctorUserId: string,
  onData: (pacientes: Paciente[]) => void,
  onError: (e: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "pacientes");
    const q = query(collection(db, path), orderBy("creadoAt", "desc"));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          creadoAt: data.creadoAt?.toDate ? data.creadoAt.toDate() : new Date(data.creadoAt || Date.now()),
          actualizadoAt: data.actualizadoAt?.toDate ? data.actualizadoAt.toDate() : undefined,
          ultimaSesion: data.ultimaSesion?.toDate ? data.ultimaSesion.toDate() : data.ultimaSesion ? new Date(data.ultimaSesion) : null,
        } as Paciente;
      });
      onData(list);
    }, onError);
  } else {
    const getLocal = () => JSON.parse(localStorage.getItem("sistemicar_pacientes") || "[]").map((p: any) => ({
      ...p,
      creadoAt: new Date(p.creadoAt),
      actualizadoAt: p.actualizadoAt ? new Date(p.actualizadoAt) : undefined,
      ultimaSesion: p.ultimaSesion ? new Date(p.ultimaSesion) : null
    }));
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("pacientes-updated", handler);
    return () => window.removeEventListener("pacientes-updated", handler);
  }
}

export async function getPaciente(doctorUserId: string, pacienteId: string): Promise<Paciente | null> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "pacientes");
    const snap = await getDoc(doc(db, path, pacienteId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      creadoAt: data.creadoAt?.toDate ? data.creadoAt.toDate() : new Date(data.creadoAt || Date.now()),
      actualizadoAt: data.actualizadoAt?.toDate ? data.actualizadoAt.toDate() : undefined,
      ultimaSesion: data.ultimaSesion?.toDate ? data.ultimaSesion.toDate() : data.ultimaSesion ? new Date(data.ultimaSesion) : null,
    } as Paciente;
  } else {
    const all = JSON.parse(localStorage.getItem("sistemicar_pacientes") || "[]");
    const p = all.find((x: any) => x.id === pacienteId);
    if (!p) return null;
    return { ...p, creadoAt: new Date(p.creadoAt) };
  }
}

export async function deletePaciente(doctorUserId: string, pacienteId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "pacientes");
    await deleteDoc(doc(db, path, pacienteId));
  } else {
    const all = JSON.parse(localStorage.getItem("sistemicar_pacientes") || "[]");
    localStorage.setItem("sistemicar_pacientes", JSON.stringify(all.filter((p: any) => p.id !== pacienteId)));
    window.dispatchEvent(new CustomEvent("pacientes-updated"));
  }
}

export async function addNotaClinica(
  doctorUserId: string,
  pacienteId: string,
  texto: string
): Promise<string> {
  const nota = { texto, pacienteId, fecha: new Date() };
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, `pacientes/${pacienteId}/notas`);
    const docRef = await addDoc(collection(db, path), {
      ...nota,
      fecha: serverTimestamp(),
      creadoAt: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `nota_${Date.now()}`;
    const key = `sistemicar_notas_pac_${pacienteId}`;
    const all = JSON.parse(localStorage.getItem(key) || "[]");
    all.unshift({ id, ...nota, creadoAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("notas-updated"));
    return id;
  }
}

export function subscribeToNotasClinicas(
  doctorUserId: string,
  pacienteId: string,
  onData: (notas: NotaClinica[]) => void,
  onError: (e: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, `pacientes/${pacienteId}/notas`);
    const q = query(collection(db, path), orderBy("creadoAt", "desc"));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha || Date.now()),
          creadoAt: data.creadoAt?.toDate ? data.creadoAt.toDate() : new Date(data.creadoAt || Date.now()),
        } as NotaClinica;
      });
      onData(list);
    }, onError);
  } else {
    const key = `sistemicar_notas_pac_${pacienteId}`;
    const getLocal = () => JSON.parse(localStorage.getItem(key) || "[]").map((n: any) => ({
      ...n,
      fecha: new Date(n.fecha),
      creadoAt: new Date(n.creadoAt)
    }));
    onData(getLocal());
    const handler = () => onData(getLocal());
    window.addEventListener("notas-updated", handler);
    return () => window.removeEventListener("notas-updated", handler);
  }
}

export async function deleteNotaClinica(
  doctorUserId: string,
  pacienteId: string,
  notaId: string
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, `pacientes/${pacienteId}/notas`);
    await deleteDoc(doc(db, path, notaId));
  } else {
    const key = `sistemicar_notas_pac_${pacienteId}`;
    const all = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(all.filter((n: any) => n.id !== notaId)));
    window.dispatchEvent(new CustomEvent("notas-updated"));
  }
}

export function subscribeToEspejoSessionsByPaciente(
  doctorUserId: string,
  pacienteId: string,
  onData: (sessions: EspejoSession[]) => void,
  onError: (e: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const path = getPrivatePath(doctorUserId, "espejoSessions");
    const q = query(
      collection(db, path),
      where("pacienteId", "==", pacienteId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha || Date.now()),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as EspejoSession;
      });
      onData(list);
    }, onError);
  } else {
    const raw = localStorage.getItem("sistemicar_espejo_sesiones");
    const all = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s: any) => s.pacienteId === pacienteId).map((s: any) => ({
      ...s,
      fecha: new Date(s.fecha),
      createdAt: new Date(s.createdAt || s.fecha)
    }));
    onData(filtered);
    return () => {};
  }
}
