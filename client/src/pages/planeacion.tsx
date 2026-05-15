import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Target,
  Zap,
  Footprints,
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Flag,
  Plus,
  Archive,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Rocket,
  Layers,
  Play,
  Square,
  Timer,
  AlertTriangle,
  Eye,
  Skull,
  Brain,
  Lock,
  Unlock,
  Activity,
  Flame,
  Menu,
  Coffee,
  Pause,
  Sun,
  Heart,
  MessageSquare,
  Trophy,
  Award,
  TrendingUp,
  ListTodo,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  Scan,
  FileSearch,
  RefreshCw,
  Moon,
  Droplets,
  Wind,
  MonitorOff,
  Battery,
  Circle,
  RotateCcw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useAuthContext } from "@/App";
import {
  subscribeToVehicles,
  addVehicle,
  updateVehicleStatus,
  updateVehicle,
  Vehicle,
  VehicleStatus,
  VehicleAxis,
  TrifectaState,
  CriterioFin,
  TipoTerminoRapido,
  TipoFlota,
  ParentesisRecarga,
  saveMision,
  MisionScores,
  recordMissionResult,
  subscribeToProgression,
  UserProgression,
  subscribeToEnergyLogs,
  EnergyLog,
  awardSovereigntyPoints,
  incrementModulePoints,
  calculateVehiclePoints,
  calculateArchivePoints,
  addPrincipioMaestro,
  saveIntrospectionEntry,
  getPlanillaHoy,
  savePlanilla,
  addSegmentoToPlanilla,
  updateSegmentoInPlanilla,
  addEventoToSegmento,
  subscribeToPlanilla,
  SegmentoV5,
  Planilla,
  EventoLog,
  SubTarea,
  DetalleSubTarea,
  SubVehiculo,
  saveLocalVehicles,
  getLocalVehicles,
  EnergiaOscuraEntry,
  CierreJornadaLog,
  saveCierreJornada,
  getLastCierreJornada,
  getTodayCierreJornada,
  saveVehicleHistoryFirebase,
  loadVehicleHistoryFromFirebase,
  mergeVehicleHistories,
  VehicleHistoryEntry,
  PlantillaRutina,
  SegmentoTemplate,
  subscribePlantillasRutina,
  addPlantillaRutina,
  deletePlantillaRutina,
  applyPlantillaToday,
  hasDesglosadorAccess,
  hasArquitectoAccess,
  hasPuntoCeroAccess,
  subscribeToRadiografiaTokens,
  checkAndAwardRadiografiaMilestones,
  checkAndRefreshSubscriptionRadiografia,
  getRadiografiaTokens,
  consumeRadiografiaToken,
  RadiografiaTokenData,
  getExpedientesRecientes,
  ExpedienteClinico,
  hasActiveCentinelaInFirestore,
  notifyVehicleClosed,
  wasVehicleRecentlyClosed,
} from "@/lib/persistence";
import { scheduleSegmentNotifications, cancelAllNotifications, requestNotificationPermission, getNotificationPermission } from "@/lib/notifications";
import { auth } from "@/lib/firebase";
import { setActiveSegmento, registrarEvento, COMPONENTES } from "@/lib/evento-universal";
import { ManualTriggerButton } from "@/components/master-manual-drawer";
import { RelojResistencia } from "@/components/RelojResistencia";
import AnilloConciencia from "@/components/AnilloConciencia";
import { calcularAnilloSoberania } from "@/engines/ConcienciaEngine";

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";
const EMERALD = "#50C878";
const VIOLET = "#9B59B6";
const SLATE = "#64748b";
const BLOOD = "#991b1b";
const PIZARRA = "#1e293b";

const NARANJA = "#f97316";
const PLATA = "#94a3b8";
const VERDE = "#22c55e";
const GRIS = "#6b7280";
const CYAN = "#00FFC3";

const FLOTA_CONFIG: Record<TipoFlota, { label: string; sublabel: string; color: string; icon: typeof Target; relojVisible: boolean; relojLabel: string; psBase: number; psCierre: string }> = {
  tiempo: { label: "TIEMPO", sublabel: "Conquista de objetivos", color: NARANJA, icon: Clock, relojVisible: true, relojLabel: "Reloj Proyectivo", psBase: 0, psCierre: "PS por calidad de ejes" },
  situacion: { label: "SITUACIÓN", sublabel: "Gestión de imprevistos", color: PLATA, icon: Flag, relojVisible: true, relojLabel: "Cronómetro", psBase: 0, psCierre: "3-7 PS por esfuerzo activo" },
  descanso: { label: "DESCANSO", sublabel: "Recarga consciente", color: VERDE, icon: Coffee, relojVisible: false, relojLabel: "Oculto", psBase: 0, psCierre: "PS por conciencia de recarga" },
  verdad: { label: "VERDAD", sublabel: "Sinceridad ante el vacío", color: GRIS, icon: MessageSquare, relojVisible: false, relojLabel: "Oculto", psBase: 0, psCierre: "PS por consciencia de verdad" }
};

const getHistoricalVehicleData = (missionTitle: string): { lastMinPerUnit?: number; bestMinPerUnit?: number; lastTotalMin?: number; count: number } => {
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return { count: 0 };
    const history: Array<{ titulo: string; minPerUnit: number; totalMin: number; tipoReloj: string; fecha: number }> = JSON.parse(data);
    const matching = history.filter(h => h.titulo.toLowerCase() === missionTitle.toLowerCase());
    if (matching.length === 0) return { count: 0 };
    const sorted = matching.sort((a, b) => b.fecha - a.fecha);
    const best = matching.reduce((min, h) => h.minPerUnit < min ? h.minPerUnit : min, Infinity);
    return {
      lastMinPerUnit: sorted[0].minPerUnit,
      bestMinPerUnit: best,
      lastTotalMin: sorted[0].totalMin,
      count: matching.length
    };
  } catch { return { count: 0 }; }
};

const getDesglosadorHistorico = (misionTitulo: string): string[] => {
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return [];
    const history: Array<{ titulo: string; minPerUnit: number; totalMin: number; tipoReloj: string; fecha: number }> = JSON.parse(data);
    const prefix = `${misionTitulo.trim()} → `;
    const matching = history.filter(h => h.tipoReloj === "desglosador" && h.titulo.startsWith(prefix));
    if (matching.length === 0) return [];
    // Agrupa por sesión (≤1h entre entradas consecutivas)
    const sorted = [...matching].sort((a, b) => a.fecha - b.fecha);
    const sessions: Array<typeof sorted> = [];
    let current: typeof sorted = [];
    for (const entry of sorted) {
      if (current.length === 0) { current.push(entry); continue; }
      if (entry.fecha - current[current.length - 1].fecha <= 3600000) {
        current.push(entry);
      } else {
        sessions.push(current);
        current = [entry];
      }
    }
    if (current.length > 0) sessions.push(current);
    if (sessions.length === 0) return [];
    // Tomar la sesión más reciente
    const lastSession = sessions[sessions.length - 1];
    // Extraer subtítulos en orden ascendente de fecha
    return lastSession.map(e => e.titulo.slice(prefix.length).trim()).filter(Boolean);
  } catch { return []; }
};

const getDesglosadorMisionTitles = (query: string, limit = 6): string[] => {
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return [];
    const history: Array<{ titulo: string; tipoReloj: string; fecha: number }> = JSON.parse(data);
    const q = query.toLowerCase().trim();
    const seen = new Set<string>();
    return history
      .filter(h => h.tipoReloj === "desglosador" && h.titulo.includes(" → "))
      .sort((a, b) => b.fecha - a.fecha)
      .map(h => h.titulo.split(" → ")[0].trim())
      .filter(t => {
        if (!t || !t.toLowerCase().includes(q)) return false;
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  } catch { return []; }
};

const getDesglosadorMisionData = (query: string, limit = 6): Array<{ titulo: string; subs: Array<{ nombre: string; duracionMin: number | null }> }> => {
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return [];
    const history: Array<{ titulo: string; tipoReloj: string; fecha: number; totalMin?: number }> = JSON.parse(data);
    const q = query.toLowerCase().trim();
    const seen = new Set<string>();
    const parentTitles: string[] = [];
    history
      .filter(h => h.tipoReloj === "desglosador" && h.titulo.includes(" → "))
      .sort((a, b) => b.fecha - a.fecha)
      .forEach(h => {
        const parent = h.titulo.split(" → ")[0].trim();
        if (!parent || !parent.toLowerCase().includes(q)) return;
        const key = parent.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        if (parentTitles.length < limit) parentTitles.push(parent);
      });
    return parentTitles.map(titulo => {
      const prefix = `${titulo} → `;
      const matching = history.filter(h => h.tipoReloj === "desglosador" && h.titulo.startsWith(prefix));
      const sorted = [...matching].sort((a, b) => a.fecha - b.fecha);
      const sessions: Array<typeof sorted> = [];
      let current: typeof sorted = [];
      for (const entry of sorted) {
        if (current.length === 0) { current.push(entry); continue; }
        if (entry.fecha - current[current.length - 1].fecha <= 3600000) {
          current.push(entry);
        } else {
          sessions.push(current);
          current = [entry];
        }
      }
      if (current.length > 0) sessions.push(current);
      const lastSession = sessions[sessions.length - 1] ?? [];
      const subs = lastSession.map(e => ({
        nombre: e.titulo.slice(prefix.length).trim(),
        duracionMin: e.totalMin != null ? e.totalMin : null
      }));
      return { titulo, subs };
    });
  } catch { return []; }
};

const getRecordSuggestions = (query: string, limit = 5): Array<{ titulo: string; minPerUnit: number }> => {
  if (!query.trim() || query.trim().length < 2) return [];
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return [];
    const history: Array<{ titulo: string; minPerUnit: number; tipoReloj: string }> = JSON.parse(data);
    const q = query.toLowerCase().trim();
    const matching = history.filter(h => h.titulo.toLowerCase().includes(q) && h.minPerUnit > 0);
    const map = new Map<string, { titulo: string; sum: number; count: number }>();
    for (const h of matching) {
      const key = h.titulo.toLowerCase().trim();
      const ex = map.get(key);
      if (ex) { ex.sum += h.minPerUnit; ex.count++; }
      else map.set(key, { titulo: h.titulo, sum: h.minPerUnit, count: 1 });
    }
    return [...map.values()]
      .map(e => ({ titulo: e.titulo, minPerUnit: e.sum / e.count }))
      .sort((a, b) => a.minPerUnit - b.minPerUnit)
      .slice(0, limit);
  } catch { return []; }
};

/** Opciones de energía al inicio / al cierre (Espejo). */
const ENERGIA_ESPEJO_OPTIONS = [
  { id: "fluido" as const, label: "Fluido", icon: "〜", desc: "Sin presión" },
  { id: "concentrado" as const, label: "Concentrado", icon: "◉", desc: "Foco activo" },
  { id: "limite" as const, label: "Al Límite", icon: "▲", desc: "Alta presión" },
];

/** Payload del modal único «¿Con qué energía terminas?» (todos los tipos de vehículo). */
type CierreEnergiaModalPayload =
  | { kind: "flota"; vehicleId: string; status: "cumplido" | "archivado" }
  | { kind: "investigador"; vehicleId: string; cumplido: boolean; cantidadRealizada: number }
  | { kind: "desglosador"; vehicleId: string; subs: SubVehiculo[] }
  | { kind: "descanso"; vehicleId: string; status: "cumplido" | "archivado"; etiqueta: "recuperado" | "parcial" | "fragmentado"; nota: string };

const cleanSubTitulo = (t: string): string =>
  t.replace(/^Día\s+\d+\s*\[[^\]]+\]:\s*/i, "").trim();

/** PS por resistencia de profundidad: +5 por cada hora completa de referencia (1 h → 5, 2 h → 10, …). */
const computeDesglosadorDepthPS = (tiempoSugeridoSeg: number | undefined): number => {
  if (tiempoSugeridoSeg == null || !Number.isFinite(tiempoSugeridoSeg) || tiempoSugeridoSeg <= 0) return 0;
  const fullHours = Math.floor(tiempoSugeridoSeg / 3600);
  return Math.max(0, 5 * fullHours);
};

/** +5 PS por cada hora completa de duración real del bloque (situación cronometrada o desglosador de tiempo). */
const computeBloqueDepthPS = (elapsedSec: number): number => {
  if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) return 0;
  return 5 * Math.floor(elapsedSec / 3600);
};

function situacionFilaCronometroPendiente(st: SubTarea): boolean {
  return !!st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") === "pendiente";
}

/** Opción B: reparte `remainingMin` entre filas pendientes del cronómetro, proporcional a cupos actuales (mín. 1 min/fila). */
function redistribuirMinutosSituacionCronometro(subTareas: SubTarea[], remainingMin: number): SubTarea[] {
  const pendingIdx = subTareas
    .map((st, i) => ({ st, i }))
    .filter(({ st }) => situacionFilaCronometroPendiente(st));
  if (pendingIdx.length === 0) return subTareas;
  const n = pendingIdx.length;
  const total = Math.max(n, Math.round(remainingMin));
  const weights = pendingIdx.map(({ st }) => Math.max(1, st.minutosCupo ?? 1));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const floors = weights.map(w => Math.max(1, Math.floor((total * w) / sumW)));
  const alloc = [...floors];
  let diff = total - alloc.reduce((a, b) => a + b, 0);
  let j = 0;
  while (diff > 0) {
    alloc[j % alloc.length] += 1;
    diff -= 1;
    j += 1;
  }
  j = 0;
  while (diff < 0 && j < n * 100) {
    const idx = j % alloc.length;
    if (alloc[idx] > 1) {
      alloc[idx] -= 1;
      diff += 1;
    }
    j += 1;
  }
  const next = [...subTareas];
  pendingIdx.forEach(({ st, i }, k) => {
    next[i] = { ...st, minutosCupo: alloc[k] };
  });
  return next;
}

function sumMinutosCronometroPendientes(subTareas: SubTarea[] | undefined): number {
  return (subTareas || []).filter(situacionFilaCronometroPendiente).reduce((a, st) => a + (st.minutosCupo ?? 0), 0);
}

/** Timbres decrecientes por orden de lista (1.ª → N, 2.ª → N−1…). Wake Lock breve para no dormir al oír. */
async function playSituacionChimes(count: number) {
  const n = Math.min(12, Math.max(1, Math.floor(count)));
  const spacingMs = 240;
  const beepMs = 150;
  const freq = 880;
  const totalMs = n * (spacingMs + beepMs) + 500;
  let wake: { release: () => Promise<void> } | null = null;
  if ("wakeLock" in navigator) {
    try {
      wake = await (navigator as unknown as { wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock.request("screen");
      window.setTimeout(() => { wake?.release().catch(() => {}); }, totalMs);
    } catch { /* permiso o no soportado */ }
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  await ctx.resume().catch(() => {});
  for (let i = 0; i < n; i++) {
    const t0 = ctx.currentTime + (i * (spacingMs + beepMs)) / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + beepMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + beepMs / 1000 + 0.02);
  }
  window.setTimeout(() => { ctx.close().catch(() => {}); }, totalMs);
}

const getSubVehicleRecordSuggestions = (query: string, limit = 5): Array<{ titulo: string; minPerUnit: number }> => {
  if (!query.trim() || query.trim().length < 2) return [];
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return [];
    const history: Array<{ titulo: string; minPerUnit: number; tipoReloj: string }> = JSON.parse(data);
    const q = query.toLowerCase().trim();
    const map = new Map<string, { titulo: string; sum: number; count: number }>();
    for (const h of history) {
      if (h.minPerUnit <= 0 || !isFinite(h.minPerUnit)) continue;
      const rawClean = h.titulo.includes(" → ")
        ? h.titulo.split(" → ").slice(1).join(" → ").trim()
        : h.titulo;
      const cleanTitle = cleanSubTitulo(rawClean);
      if (!cleanTitle.toLowerCase().includes(q)) continue;
      const key = cleanTitle.toLowerCase().trim();
      const ex = map.get(key);
      if (ex) { ex.sum += h.minPerUnit; ex.count++; }
      else map.set(key, { titulo: cleanTitle, sum: h.minPerUnit, count: 1 });
    }
    return [...map.values()]
      .map(e => ({ titulo: e.titulo, minPerUnit: e.sum / e.count }))
      .sort((a, b) => a.minPerUnit - b.minPerUnit)
      .slice(0, limit);
  } catch { return []; }
};

type VehicleHistoryOpts = {
  status?: "cumplido" | "incumplido" | "fallado";
  cumplidos?: number;
  fallados?: number;
  totalSubs?: number;
  subResumen?: Array<{
    titulo: string;
    status: "cumplido" | "fallado" | "pendiente";
    cantidadObjetivo?: number;
    cantidadLograda?: number;
    duracionMin?: number;
  }>;
};

const saveVehicleHistory = (
  titulo: string,
  minPerUnit: number,
  totalMin: number,
  tipoReloj: string,
  userId?: string,
  opts?: VehicleHistoryOpts
) => {
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    const history: VehicleHistoryEntry[] = data ? JSON.parse(data) : [];
    const newEntry: VehicleHistoryEntry = { titulo, minPerUnit, totalMin, tipoReloj, fecha: Date.now(), ...opts };
    history.push(newEntry);
    if (history.length > 200) history.splice(0, history.length - 200);
    localStorage.setItem("sistemicar_vehicle_history", JSON.stringify(history));
    if (userId) {
      saveVehicleHistoryFirebase(userId, history).catch(e => console.warn("[vehicleHistory] Firebase save error:", e));
      if (auth.currentUser) {
        auth.currentUser.getIdToken().then(token =>
          fetch("/api/vehicle-history", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({
              entries: [{
                titulo: newEntry.titulo,
                minPerUnit: newEntry.minPerUnit,
                totalMin: newEntry.totalMin,
                tipoReloj: newEntry.tipoReloj,
                fecha: newEntry.fecha,
                status: newEntry.status,
                subResumen: newEntry.subResumen ? JSON.stringify(newEntry.subResumen) : undefined,
              }],
            }),
          })
        ).then(r => {
          if (!r.ok) console.warn("[vehicleHistory] Backend save non-2xx:", r.status);
        }).catch(e => console.warn("[vehicleHistory] Backend save error:", e));
      }
    }
  } catch {}
};

type VehicleRecord = {
  titulo: string;
  bestMinPerUnit: number;
  bestTotalMin: number;
  bestDate: number;
  count: number;
  history: Array<{ minPerUnit: number; totalMin: number; fecha: number; tipoReloj: string }>;
  voltaje: "Máximo" | "Alto" | "Medio" | "Bajo";
};

const getBovedaRecords = (): VehicleRecord[] => {
  try {
    const data = localStorage.getItem("sistemicar_vehicle_history");
    if (!data) return [];
    const history: Array<{ titulo: string; minPerUnit: number; totalMin: number; tipoReloj: string; fecha: number }> = JSON.parse(data);
    const grouped: Record<string, typeof history> = {};
    history.forEach(h => {
      const key = h.titulo.toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h);
    });
    return Object.entries(grouped)
      .filter(([_, entries]) => entries.length > 0)
      .map(([_, entries]) => {
        const sorted = [...entries].sort((a, b) => a.minPerUnit - b.minPerUnit);
        const best = sorted[0];
        const chronological = [...entries].sort((a, b) => a.fecha - b.fecha);
        const improvement = chronological.length >= 2 ? ((chronological[0].minPerUnit - best.minPerUnit) / chronological[0].minPerUnit) * 100 : 0;
        const voltaje: VehicleRecord["voltaje"] = improvement >= 30 ? "Máximo" : improvement >= 15 ? "Alto" : improvement >= 5 ? "Medio" : "Bajo";
        return {
          titulo: entries[0].titulo,
          bestMinPerUnit: best.minPerUnit,
          bestTotalMin: best.totalMin,
          bestDate: best.fecha,
          count: entries.length,
          history: chronological.map(h => ({ minPerUnit: h.minPerUnit, totalMin: h.totalMin, fecha: h.fecha, tipoReloj: h.tipoReloj })),
          voltaje
        };
      })
      .sort((a, b) => b.bestDate - a.bestDate);
  } catch { return []; }
};

const VOLTAJE_CONFIG = {
  "Máximo": { color: "#D4AF37", glow: "#D4AF3740", label: "VOLTAJE MÁXIMO" },
  "Alto": { color: "#50C878", glow: "#50C87840", label: "VOLTAJE ALTO" },
  "Medio": { color: "#1E90FF", glow: "#1E90FF40", label: "VOLTAJE MEDIO" },
  "Bajo": { color: "#64748b", glow: "#64748b40", label: "VOLTAJE BAJO" }
};

const MODULE_THRESHOLDS_PLAN = [
  { pts: 10, label: "Iniciado" },
  { pts: 50, label: "Centurión" },
  { pts: 150, label: "Guerrero" },
  { pts: 500, label: "Soberano" },
];

function getNextModuleThresholdPlan(pts: number) {
  let currentLabel = "—";
  let currentPts = 0;
  for (const t of MODULE_THRESHOLDS_PLAN) {
    if (pts >= t.pts) { currentLabel = t.label; currentPts = t.pts; }
  }
  const nextT = MODULE_THRESHOLDS_PLAN.find(t => pts < t.pts) || null;
  const pct = nextT ? Math.min(((pts - currentPts) / (nextT.pts - currentPts)) * 100, 100) : 100;
  return { current: currentLabel, next: nextT?.label || null, ptsToNext: nextT ? nextT.pts - pts : 0, pct };
}

function PlanModuleMilestoneBar({ pts }: { pts: number }) {
  const { current, next, ptsToNext, pct } = getNextModuleThresholdPlan(pts);
  const color = GOLD;
  return (
    <div className="px-3 py-2.5 rounded-xl border" style={{ backgroundColor: `${color}08`, borderColor: `${color}20` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
          {current} — PLANIFICACIÓN
        </span>
        {next ? (
          <span className="text-[9px] text-slate-500">
            Faltan <span className="font-bold text-white">{ptsToNext}</span> pts → {next}
          </span>
        ) : (
          <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
            nivel máximo
          </span>
        )}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}50`, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

const EJES_CONFIG = {
  enfoque: {
    label: "FRICCIÓN DE INERCIA",
    icon: Target,
    color: AZURE,
    desc: "Capa 1 - Observatorio de arranque",
    placeholder: "¿Qué distracción intentó frenar el arranque? ¿Qué pensamiento de resistencia hubo? ¿Cómo fue el primer paso físico? ¿Cuánto duró la inercia?"
  },
  conflicto: {
    label: "NUDO DE FRUSTRACIÓN",
    icon: Zap,
    color: EMERALD,
    desc: "Capa 2 - Observatorio de quiebre",
    placeholder: "¿Qué imprevisto rompió la fluidez? ¿Qué emoción sentiste al fallar? ¿Cómo reaccionaste al error? ¿Ajustaste el plan o te estresaste?"
  },
  pasos: {
    label: "ANCLA DE ABURRIMIENTO",
    icon: Footprints,
    color: VIOLET,
    desc: "Capa 3 - Observatorio de monotonía",
    placeholder: "¿En qué momento perdiste el interés? ¿Qué 'dopamina barata' buscó tu cerebro? ¿Cómo recuperaste el enfoque? ¿Fue aburrimiento técnico o mental?"
  },
  limite: {
    label: "UMBRAL DE FATIGA",
    icon: Shield,
    color: GOLD,
    desc: "Capa 4 - Observatorio de límite",
    placeholder: "¿Es cansancio físico real o mental? ¿Cómo varió tu velocidad al final? ¿Qué principio aplicaste para no rendirte? ¿Qué aprendiste de tu límite hoy?"
  }
};

const TRIFECTA_OPTIONS: { id: TrifectaState; label: string; color: string; minDetails: number }[] = [
  { id: "omitir", label: "OMITIR", color: "#374151", minDetails: 0 },
  { id: "blando", label: "BLANDO", color: "#6b7280", minDetails: 1 },
  { id: "intermedio", label: "INTERMEDIO", color: AZURE, minDetails: 2 },
  { id: "reto", label: "RETO", color: GOLD, minDetails: 3 }
];

function countDetails(text: string): number {
  if (!text.trim()) return 0;
  const lines = text.split(/[\n.,;]/).filter(line => line.trim().length > 5);
  return Math.min(lines.length, 3);
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function checkAltaIntrospeccion(ejes: Record<string, { text: string; trifecta: string }>): boolean {
  return Object.values(ejes).every(eje => countWords(eje.text) >= 10);
}

function getAutoTrifecta(text: string): TrifectaState {
  const count = countDetails(text);
  if (count >= 3) return "reto";
  if (count >= 2) return "intermedio";
  if (count >= 1) return "blando";
  return "omitir";
}

const PREGUNTAS_INTROSPECTION: Record<number, string[]> = {
  1: [
    "¿Qué distracción específica intentó retenerte?",
    "¿Qué pensamiento exacto te permitió romper la inercia?",
    "¿En qué parte del cuerpo sentiste la pesadez?",
    "¿Del 1 al 10, qué tan nublado estaba el objetivo?"
  ],
  2: [
    "¿Qué evento disparó la sensación de pérdida de control?",
    "¿Tu impulso fue abandonar o forzar el resultado?",
    "¿La frustración era externa o por una expectativa propia?",
    "¿Cómo recalibraste el segmento para seguir?"
  ],
  3: [
    "¿A qué mundo imaginario intentó escaparse tu mente?",
    "¿En qué momento sentiste que lo que hacías no tenía sentido?",
    "¿Qué valor del Master Plan recordaste para seguir?",
    "¿El tiempo pasó lento o dejaste de estar presente?"
  ],
  4: [
    "¿En qué minuto exacto se degradó tu lógica?",
    "¿Usaste el \"tic-tap\" o la culpa para el sprint final?",
    "¿La última tarea se hizo con excelencia o solo por cumplir?",
    "¿Te sientes vaciado con orgullo o agotado?"
  ]
};

function selectRandomQuestion(capa: number): string {
  const preguntas = PREGUNTAS_INTROSPECTION[capa];
  if (!preguntas || preguntas.length === 0) return "";
  return preguntas[Math.floor(Math.random() * preguntas.length)];
}

function getCapasActivas(duracionMin: number): number[] {
  if (duracionMin >= 120) return [1, 2, 3, 4];
  return [1, 2];
}

function calcularMultiplicador(charCount: number): number {
  if (charCount > 150) return 1.5;
  return 1.0;
}

function parseTimeString(t: string): { h: number; m: number } | null {
  const match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return { h: parseInt(match[1]), m: parseInt(match[2]) };
}

function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeStringToMinutes(t: string): number {
  const parsed = parseTimeString(t);
  if (!parsed) return 0;
  return parsed.h * 60 + parsed.m;
}

type StepType = "titulo" | "criterio" | "enfoque" | "conflicto" | "pasos" | "limite" | "confirmar";
const STEPS: StepType[] = ["titulo", "criterio", "enfoque", "conflicto", "pasos", "limite", "confirmar"];

const SEGMENT_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const SEGMENT_ICONS = ["brain", "target", "flame", "shield", "zap", "activity", "eye", "layers"];

const MONITOR_STATES = {
  OMISION: {
    label: "LA OMISIÓN",
    desc: "No hay segmento activo. El tiempo pasa sin registro.",
    color: BLOOD,
    icon: Skull
  },
  PESO_TIEMPO: {
    label: "EL PESO DEL TIEMPO",
    desc: "El segmento lleva demasiado sin cierre. La entropía se acerca.",
    color: "#f59e0b",
    icon: AlertTriangle
  },
  TRAICION: {
    label: "LA TRAICIÓN SILENCIOSA",
    desc: "Cerraste por entropía. 0 PS. El sistema no perdona la omisión.",
    color: "#7f1d1d",
    icon: Lock
  }
};

export default function Planeacion() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try { return getLocalVehicles(); } catch { return []; }
  });
  const optimisticVehiclesRef = useRef<Vehicle[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);

  const desglosadorUnlocked = hasDesglosadorAccess(
    progression?.subscriptionPlan ?? progression?.rank,
    user?.email
  );
  const arquitectoUnlocked = hasArquitectoAccess(
    progression?.subscriptionPlan ?? progression?.rank,
    user?.email
  );
  const puntoCeroUnlocked = hasPuntoCeroAccess(
    progression?.subscriptionPlan ?? progression?.rank,
    user?.email
  );
  const [showDesglosadorCTA, setShowDesglosadorCTA] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [criterioFin, setCriterioFin] = useState<CriterioFin>("tiempo");
  const [criterioDetalle, setCriterioDetalle] = useState("");
  const [ejes, setEjes] = useState<Record<keyof typeof EJES_CONFIG, VehicleAxis>>({
    enfoque: { text: "", trifecta: "blando" },
    conflicto: { text: "", trifecta: "blando" },
    pasos: { text: "", trifecta: "blando" },
    limite: { text: "", trifecta: "blando" }
  });
  const [selectedTerminoType, setSelectedTerminoType] = useState<TipoTerminoRapido | null>(null);
  const [terminoDetalle, setTerminoDetalle] = useState("");
  const [vehicleMode, setVehicleMode] = useState<"selector" | "express" | "profundo" | "flota">("selector");
  const [tipoFlotaSeleccionado, setTipoFlotaSeleccionado] = useState<TipoFlota | null>(null);
  const [relojTiempo, setRelojTiempo] = useState<"proyectivo" | "produccion" | "manual" | "investigador" | "desglosador">("proyectivo");
  const [intensidadEnergetica, setIntensidadEnergetica] = useState<"fluido" | "concentrado" | "limite" | null>(null);
  const [cantidadInvestigador, setCantidadInvestigador] = useState("");
  const [horaFinProyectiva, setHoraFinProyectiva] = useState("");
  const [cantidadProduccion, setCantidadProduccion] = useState("");
  const [tiempoProduccion, setTiempoProduccion] = useState("");
  const [showTituloProdSuggestions, setShowTituloProdSuggestions] = useState(false);
  const [showDesglosadorTitleSuggestions, setShowDesglosadorTitleSuggestions] = useState(false);
  const [desglosadorSubs, setDesglosadorSubs] = useState<Array<{ tempId: string; titulo: string; cantidadObjetivo: string; tiempoRecordMinPerUnit?: number }>>([{ tempId: "sub_0", titulo: "", cantidadObjetivo: "" }]);
  const [historialSubs, setHistorialSubs] = useState<string[]>([]);
  const [sugerenciasIA, setSugerenciasIA] = useState<string[]>([]);
  const [sugerenciasIALoading, setSugerenciasIALoading] = useState(false);
  const [sugerenciasIASeleccionadas, setSugerenciasIASeleccionadas] = useState<Set<string>>(new Set());
  const [activeSubSuggestionIdx, setActiveSubSuggestionIdx] = useState<number | null>(null);
  const [duracionDescansoH, setDuracionDescansoH] = useState("");
  const [duracionDescansoM, setDuracionDescansoM] = useState("");
  const [tipoDescanso, setTipoDescanso] = useState<"intercepcion" | "microcarga" | "reset_profundo" | "punto_cero" | null>(null);
  const [transmutationText, setTransmutationText] = useState("");
  const [showHistorialCompleto, setShowHistorialCompleto] = useState(false);
  const [goldenFlash, setGoldenFlash] = useState(false);
  const [recordBanner, setRecordBanner] = useState<{ mejora: number; titulo: string } | null>(null);
  const [showBoveda, setShowBoveda] = useState(false);
  const [selectedBovedaRecord, setSelectedBovedaRecord] = useState<VehicleRecord | null>(null);
  const [tikSoundEnabled, setTikSoundEnabled] = useState(() => localStorage.getItem("sistemicar_tik_sound") !== "off");

  const [anilloTick, setAnilloTick] = useState(0);

  // ── RADIOGRAFÍA DEL OPERADOR ──
  const [radiografiaTokens, setRadiografiaTokens] = useState<RadiografiaTokenData>({ tokens: 0, milestonesCrossed: [], lastSubscriptionRefresh: "" });
  const [showRadiografia, setShowRadiografia] = useState(false);
  const [generandoRadiografia, setGenerandoRadiografia] = useState(false);
  const [radiografiaReport, setRadiografiaReport] = useState<any>(null);
  const [gordaHistory, setGordaHistory] = useState<VehicleHistoryEntry[]>([]);

  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const [showCrearSegmento, setShowCrearSegmento] = useState(false);
  const segmentosListEndRef = useRef<HTMLDivElement | null>(null);
  const labIntroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nuevoSegNombre, setNuevoSegNombre] = useState("");
  const [nuevoSegHoraInicio, setNuevoSegHoraInicio] = useState("");
  const [nuevoSegHoraFin, setNuevoSegHoraFin] = useState("");
  const [nuevoSegColor, setNuevoSegColor] = useState(SEGMENT_COLORS[0]);
  const [nuevoSegIcono, setNuevoSegIcono] = useState(SEGMENT_ICONS[0]);
  const [nuevoSegCentinelaEnabled, setNuevoSegCentinelaEnabled] = useState(true);
  const [expandedSegId, setExpandedSegId] = useState<string | null>(null);
  // --- RUTINAS ---
  const [plantillasRutina, setPlantillasRutina] = useState<PlantillaRutina[]>([]);
  const [rutinaBanner, setRutinaBanner] = useState<PlantillaRutina | null>(null);
  const [showRutinasPanel, setShowRutinasPanel] = useState(false);
  const [showGuardarRutina, setShowGuardarRutina] = useState(false);
  const [nuevaRutinaNombre, setNuevaRutinaNombre] = useState("");
  const [nuevaRutinaTipo, setNuevaRutinaTipo] = useState<PlantillaRutina["tipo"]>("semana_laboral");
  const [nuevaRutinaDias, setNuevaRutinaDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());
  const [showLabIntrospeccion, setShowLabIntrospeccion] = useState(false);
  const [closedSegmentDuration, setClosedSegmentDuration] = useState(0);
  const [closedSegmentName, setClosedSegmentName] = useState("");
  const [, setSegmentTick] = useState(0);
  const [showLabConciencia, setShowLabConciencia] = useState(false);
  const [showCierreJornada, setShowCierreJornada] = useState(false);
  const [cierreEnergiaPending, setCierreEnergiaPending] = useState<CierreEnergiaModalPayload | null>(null);
  const [cierreEnergiaSeleccion, setCierreEnergiaSeleccion] = useState<"fluido" | "concentrado" | "limite" | null>(null);
  const [showDeposito, setShowDeposito] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkNightBlocking = async () => {
      const hour = new Date().getHours();
      if (hour >= 22) {
        const todayCierre = await getTodayCierreJornada(user.uid);
        if (!todayCierre) {
          setShowCierreJornada(true);
        }
      }
    };
    checkNightBlocking();
    const interval = setInterval(checkNightBlocking, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setAnilloTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    if (labIntroTimeoutRef.current) {
      clearTimeout(labIntroTimeoutRef.current);
      labIntroTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadVehicleHistoryFromFirebase(user.uid).then(remote => {
      if (remote.length === 0) return;
      try {
        const localData = localStorage.getItem("sistemicar_vehicle_history");
        const local = localData ? JSON.parse(localData) : [];
        const merged = mergeVehicleHistories(local, remote);
        localStorage.setItem("sistemicar_vehicle_history", JSON.stringify(merged));
      } catch (e) {
        console.warn("[vehicleHistory] merge local error:", e);
      }
    }).catch(e => console.warn("[vehicleHistory] load error:", e));
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
    auth.currentUser.getIdToken()
      .then(token => fetch(`/api/vehicle-history`, {
        headers: { "Authorization": `Bearer ${token}` },
      }))
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.records?.length) return;
        try {
          const localData = localStorage.getItem("sistemicar_vehicle_history");
          const local: VehicleHistoryEntry[] = localData ? JSON.parse(localData) : [];
          const remote: VehicleHistoryEntry[] = (data.records as Array<{ titulo: string; minPerUnit: number; totalMin: number; tipoReloj: string; fecha: number; status?: string; subResumen?: string }>).map(rec => ({
            titulo: rec.titulo,
            minPerUnit: rec.minPerUnit,
            totalMin: rec.totalMin,
            tipoReloj: rec.tipoReloj,
            fecha: rec.fecha,
            status: rec.status,
            subResumen: rec.subResumen ? (() => { try { return JSON.parse(rec.subResumen!); } catch { return undefined; } })() : undefined,
          }));
          const merged = mergeVehicleHistories(local, remote);
          localStorage.setItem("sistemicar_vehicle_history", JSON.stringify(merged));
        } catch (e) {
          console.warn("[vehicleHistory] backend merge error:", e);
        }
      })
      .catch(e => console.warn("[vehicleHistory] backend load error:", e));
  }, [user?.uid]);

  // ── RADIOGRAFÍA — cargar historial local ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sistemicar_vehicle_history");
      if (raw) setGordaHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // ── RADIOGRAFÍA — suscribir tokens ──
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToRadiografiaTokens(user.uid, (data) => setRadiografiaTokens(data));
    return unsub;
  }, [user?.uid]);

  // ── RADIOGRAFÍA — verificar hitos PS y refresco por suscripción ──
  useEffect(() => {
    if (!user || !progression) return;
    const ps = progression.sovereigntyPoints || 0;
    getRadiografiaTokens(user.uid).then(current => {
      checkAndAwardRadiografiaMilestones(user.uid, ps, current).then(({ awarded }) => {
        if (awarded > 0) toast.success(`🔬 +${awarded} Radiografía desbloqueada — ${ps} PS alcanzados`);
      });
      const plan = (progression as any).subscriptionPlan || (progression as any).rank || null;
      checkAndRefreshSubscriptionRadiografia(user.uid, plan, current);
    });
  }, [user?.uid, progression?.sovereigntyPoints]);

  const segmentoActivo = useMemo(() => {
    if (!planilla) return null;
    return planilla.segmentos.find(s => s.estado === "activo") || null;
  }, [planilla]);

  const monitorState = useMemo(() => {
    if (!planilla || planilla.segmentos.length === 0) return null;
    const lastEntropia = planilla.segmentos.filter(s => s.estado === "entropia").slice(-1)[0];
    if (lastEntropia) return "TRAICION";
    if (!segmentoActivo) {
      const hasPendientes = planilla.segmentos.some(s => s.estado === "pendiente");
      if (hasPendientes) return "OMISION";
    }
    if (segmentoActivo && segmentoActivo.activadoAt) {
      const elapsed = (Date.now() - segmentoActivo.activadoAt) / 60000;
      const scheduled = timeStringToMinutes(segmentoActivo.horaFin) - timeStringToMinutes(segmentoActivo.horaInicio);
      if (scheduled > 0 && elapsed > scheduled * 1.5) return "PESO_TIEMPO";
    }
    return null;
  }, [planilla, segmentoActivo]);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setTitulo(vehicle.titulo);
    setCriterioFin(vehicle.criterioFin);
    setCriterioDetalle(vehicle.criterioDetalle);
    setEjes(vehicle.ejes);
    setCurrentStep(0);
    setIsCreating(true);
    const isExpress = vehicle.tipoTerminoRapido || Object.values(vehicle.ejes).every(e => e.trifecta === "omitir");
    setVehicleMode(isExpress ? "express" : "profundo");
  };

  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeToVehicles(user.uid, (data) => {
      const firebaseIds = new Set(data.map(v => v.id));
      optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(ov => !firebaseIds.has(ov.id));
      const pending = optimisticVehiclesRef.current;
      // Protect against Firebase snapshots arriving after optimistic local close.
      // For ANY vehicle: if locally closed but Firebase still shows "activo", use local status.
      // For desglosador: also preserve in-session subVehiculos.
      const protectedData = data.map(v => {
        const local = vehiclesRef.current.find(lv => lv.id === v.id);
        if (local && local.status !== "activo" && v.status === "activo") {
          return {
            ...v,
            status: local.status,
            ...(local.cierreAt != null ? { cierreAt: local.cierreAt } : {}),
            ...(local.duracionFinal != null ? { duracionFinal: local.duracionFinal } : {}),
            ...(local.cierreManual != null ? { cierreManual: local.cierreManual } : {}),
            ...(local.intensidadEnergeticaFin ? { intensidadEnergeticaFin: local.intensidadEnergeticaFin } : {}),
            situacionCronometro: local.situacionCronometro ?? null,
            situacionCupoAnchor: local.situacionCupoAnchor ?? null,
          };
        }
        if (v.tipoReloj === "desglosador" && local) {
          // Preservar subVehiculos de sesión activa (nunca se escriben a Firebase hasta globalClose)
          if (v.status === "activo" && local.subVehiculos) {
            return { ...v, subVehiculos: local.subVehiculos };
          }
        }
        return v;
      });
      let merged = pending.length > 0 ? [...pending, ...protectedData] : protectedData;
      if (pending.length > 0) {
        console.log(`[Vehicles] Fusionando ${pending.length} vehículo(s) optimista(s) con ${data.length} de Firebase`);
      }
      // Final safety net: if a vehicle was active in the last known state but is now
      // completely absent from merged (not even as cumplido), keep it. This handles the
      // edge case where a stale snapshot bypasses the persistence-layer guards and would
      // otherwise silently erase a vehicle from the UI.
      const mergedIds = new Set(merged.map(v => v.id));
      const rescued = vehiclesRef.current.filter(
        v =>
          v.status === "activo" &&
          !v.autoVerdad &&
          !mergedIds.has(v.id) &&
          !closingInProgressRef.current.has(v.id) &&
          !wasVehicleRecentlyClosed(v.id)
      );
      if (rescued.length > 0) {
        console.warn(`[Vehicles] Rescatando ${rescued.length} activo(s) ausentes del snapshot:`, rescued.map(v => `${v.id}:${v.titulo}`));
        merged = [...rescued, ...merged];
      }
      setVehicles(merged);
    }, (e) => console.error(e));
    const unsub2 = subscribeToProgression(user.uid, (prog) => setProgression(prog), (e) => console.error(e));
    const unsub3 = subscribeToEnergyLogs(user.uid, (data) => setEnergyLogs(data), (e) => console.error(e));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getPlanillaHoy(user.uid).then(p => setPlanilla(p));
    const fecha = new Date().toISOString().split("T")[0];
    const unsub = subscribeToPlanilla(user.uid, fecha, (p) => setPlanilla(p), (e) => console.error(e));
    return unsub;
  }, [user]);

  // Cargar plantillas de rutina
  useEffect(() => {
    if (!user) return;
    const unsub = subscribePlantillasRutina(user.uid, (data) => setPlantillasRutina(data));
    return unsub;
  }, [user]);

  // Detectar si hay rutina para hoy y mostrar banner cuando no hay segmentos
  useEffect(() => {
    if (!planilla || planilla.segmentos.length > 0 || plantillasRutina.length === 0) {
      setRutinaBanner(null);
      return;
    }
    const hoy = new Date().getDay(); // 0=Dom..6=Sab
    const match = plantillasRutina.find(p => p.diasActivos.includes(hoy));
    setRutinaBanner(match || null);
  }, [planilla, plantillasRutina]);

  // Programar notificaciones cuando cambia la planilla
  useEffect(() => {
    if (!planilla) return;
    scheduleSegmentNotifications(planilla.segmentos);
    return () => cancelAllNotifications();
  }, [planilla]);

  useEffect(() => {
    if (segmentoActivo && user) {
      setActiveSegmento(user.uid, segmentoActivo.id);
    } else {
      setActiveSegmento("", null);
    }
  }, [segmentoActivo, user]);

  const prevSegmentoIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentSegId = segmentoActivo?.id || null;
    const prevSegId = prevSegmentoIdRef.current;
    if (prevSegId && currentSegId && prevSegId !== currentSegId && user) {
      const vehiculosActivos = vehicles.filter(v => v.status === "activo" && !v.autoVerdad);
      vehiculosActivos.forEach(v => {
        const nuevoConteo = (v.segmentosCruzados || 0) + 1;
        updateVehicle(user.uid, v.id, { segmentosCruzados: nuevoConteo }).catch(() => {});
        v.segmentosCruzados = nuevoConteo;
      });
      if (vehiculosActivos.length > 0) {
        setVehicles([...vehicles]);
      }
    }
    prevSegmentoIdRef.current = currentSegId;
  }, [segmentoActivo?.id, user]);

  useEffect(() => {
    if (!user || !planilla) return;

    const checkPuertaAtencion = () => {
      const now = getCurrentTimeMinutes();
      let changed = false;

      planilla.segmentos.forEach(seg => {
        if (seg.estado === "pendiente") {
          const inicio = timeStringToMinutes(seg.horaInicio);
          if (now >= inicio + 6) {
            seg.estado = "activo";
            seg.activadoAt = Date.now();
            changed = true;
            toast.info(`Segmento iniciado: ${seg.nombre}`, {
              description: "Activado automáticamente — sin PS. La ventana ±5 min ya cerró.",
              style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}40`, color: EMERALD }
            });
          }
        }

        if (seg.estado === "activo" && seg.horaFin) {
          const fin = timeStringToMinutes(seg.horaFin);
          if (now >= fin + 5) {
            seg.estado = "entropia";
            seg.cerradoAt = Date.now();
            seg.psGanados = 0;
            changed = true;
            toast.error(`ENTROPÍA: ${seg.nombre}`, {
              description: "0 PS. No cerraste a tiempo. El sistema no perdona la omisión.",
              style: { backgroundColor: "#1a0000", border: `2px solid ${BLOOD}`, color: BLOOD },
              duration: 6000
            });
          }
        }
      });

      if (changed) {
        savePlanilla(user.uid, { ...planilla });
        setPlanilla({ ...planilla });
      }
      // Always tick so the close-window button updates reactively every 30s
      setSegmentTick(t => t + 1);
    };

    const interval = setInterval(checkPuertaAtencion, 30000);
    checkPuertaAtencion();
    return () => clearInterval(interval);
  }, [user, planilla]);

  const lastAutoVerdadCheck = useRef<number>(0);
  const noVehicleSince = useRef<number>(0);
  const sentinelSuppressed = useRef<boolean>(false);
  const vehiclesRef = useRef(vehicles);
  const closingInProgressRef = useRef<Set<string>>(new Set());
  vehiclesRef.current = vehicles;

  const NO_VEHICLE_SINCE_KEY = "sistemicar_no_vehicle_since";

  const checkAutoVerdadRef = useRef<(() => Promise<void>) | null>(null);
  const checkTraslado50Ref = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!user || !planilla) return;
    // Fix 3: Al montar, limpiar NO_VEHICLE_SINCE_KEY si ya hay vehículos activos en localStorage
    const localVehicles = getLocalVehicles();
    const hasLocalActivos = localVehicles.some(v => v.status === "activo" && !v.autoVerdad);
    if (hasLocalActivos) {
      noVehicleSince.current = 0;
      localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
    }
    const checkAutoVerdad = async () => {
      if (sentinelSuppressed.current) return;
      const now = Date.now();
      if (now - lastAutoVerdadCheck.current < 5000) return;
      lastAutoVerdadCheck.current = now;

      const currentVehicles = vehiclesRef.current;
      const segActivo = planilla.segmentos.find(s => s.estado === "activo");
      const hasActiveSegment = !!segActivo;
      const hasActiveVehicles =
        currentVehicles.some(v => v.status === "activo" && !v.autoVerdad) ||
        optimisticVehiclesRef.current.some(v => v.status === "activo" && !v.autoVerdad);
      const hasAutoVerdadActive = currentVehicles.some(v => v.status === "activo" && v.autoVerdad);

      // Si el segmento activo tiene Centinela desactivado, reiniciar timer silenciosamente
      if (hasActiveSegment && segActivo && segActivo.centinelaEnabled === false) {
        noVehicleSince.current = 0;
        localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
        console.log("[Centinela] Desactivado para segmento:", segActivo.nombre);
        return;
      }

      if (hasActiveVehicles || !hasActiveSegment) {
        noVehicleSince.current = 0;
        localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
        return;
      }

      if (hasAutoVerdadActive) return;

      const remoteCentinela = await hasActiveCentinelaInFirestore(user.uid);
      if (remoteCentinela) {
        noVehicleSince.current = 0;
        localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
        return;
      }

      const persistedSince = parseInt(localStorage.getItem(NO_VEHICLE_SINCE_KEY) || "0");
      const MAX_SINCE_AGE = 4 * 3600 * 1000; // 4 horas — timestamps más antiguos se ignoran
      const persistedSinceValid = persistedSince > 0 && (now - persistedSince) < MAX_SINCE_AGE;
      if (noVehicleSince.current === 0) {
        if (persistedSinceValid) {
          noVehicleSince.current = persistedSince;
        } else {
          if (persistedSince > 0) {
            // Timestamp obsoleto de sesión anterior — limpiar para evitar falso disparo
            localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
          }
          noVehicleSince.current = now;
          localStorage.setItem(NO_VEHICLE_SINCE_KEY, now.toString());
          return;
        }
      }

      const sinceMoment = noVehicleSince.current;
      if (now - sinceMoment < 120000) return;

      if (sentinelSuppressed.current) return;

      const centinelaAperturaAt = noVehicleSince.current || sinceMoment;
      await addVehicle(user.uid, {
        titulo: "Modo Centinela",
        criterioFin: "circunstancia",
        criterioDetalle: "Modo Verdad",
        tiempoInicio: new Date(centinelaAperturaAt),
        ejes: {
          enfoque: { text: "", trifecta: "omitir" },
          conflicto: { text: "", trifecta: "omitir" },
          pasos: { text: "", trifecta: "omitir" },
          limite: { text: "", trifecta: "omitir" }
        },
        tipoTerminoRapido: "omitido",
        tipoFlota: "verdad",
        aperturaAt: centinelaAperturaAt,
        autoVerdad: true
      });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚡ SISTEMICAR — Modo Centinela Activado", {
          body: "Ningún vehículo activo. El centinela registra el vacío.",
          icon: "/favicon.ico",
          silent: false
        });
      }
      noVehicleSince.current = 0;
      localStorage.removeItem(NO_VEHICLE_SINCE_KEY);
    };
    checkAutoVerdadRef.current = checkAutoVerdad;
    const interval = setInterval(checkAutoVerdad, 30000);
    checkAutoVerdad();
    return () => clearInterval(interval);
  }, [user, planilla]);

  useEffect(() => {
    if (!user) return;

    const checkTraslado50 = async () => {
      const now = Date.now();
      const currentVehicles = vehiclesRef.current;

      const proyectivos = currentVehicles.filter(v => {
        if (v.status !== "activo") return false;
        if (v.tipoFlota !== "tiempo") return false;
        if (!v.aperturaAt) return false;
        const matchHora = v.criterioDetalle?.match(/^(\d{1,2}):(\d{2})$/);
        return !!matchHora;
      });

      for (const v of proyectivos) {
        const matchHora = v.criterioDetalle!.match(/^(\d{1,2}):(\d{2})$/)!;
        const target = new Date();
        target.setHours(parseInt(matchHora[1]), parseInt(matchHora[2]), 0, 0);
        const targetMs = target.getTime();
        const durationMs = targetMs - v.aperturaAt!;
        if (durationMs <= 0) continue;
        const autoCloseMs = targetMs + Math.floor(durationMs * 0.5);
        if (now >= autoCloseMs) {
          try {
            await updateVehicle(user.uid, v.id, {
              cierreAt: now,
              duracionFinal: Math.round((now - v.aperturaAt!) / 60000),
              energiaOscura: true,
              cierreManual: false
            });
            await updateVehicleStatus(user.uid, v.id, "archivado");
            toast.error(`ENTROPÍA: "${v.titulo}"`, {
              description: `Cierre automático al 50% del margen. Debía cerrar a las ${v.criterioDetalle}. La omisión tiene consecuencias.`,
              style: { backgroundColor: "#1a0000", border: `2px solid ${BLOOD}`, color: "#fca5a5" },
              duration: 9000
            });
          } catch (err) {
            console.error("[Traslado50] Error cerrando vehículo:", err);
          }
        }
      }
    };
    checkTraslado50Ref.current = checkTraslado50;

    const interval = setInterval(checkTraslado50, 60000);
    checkTraslado50();
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || !planilla) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const checkExpiredCentinela = async () => {
      const todaySt = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
      const activeCentinela = vehiclesRef.current.find(v => v.autoVerdad && v.status === "activo");
      if (!activeCentinela || !activeCentinela.aperturaAt) return;
      const age = Date.now() - activeCentinela.aperturaAt;
      const isExpired = activeCentinela.aperturaAt < todaySt || age > 8 * 3600 * 1000;
      if (!isExpired) return;
      const dur = Math.round(age / 60000);
      try {
        await updateVehicle(user.uid, activeCentinela.id, { cierreAt: Date.now(), duracionFinal: dur });
        await updateVehicleStatus(user.uid, activeCentinela.id, "archivado");
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("⚡ SISTEMICAR — Centinela Cerrado", {
            body: `Sesión anterior cerrada automáticamente. Duración registrada: ${dur} min.`,
            icon: "/favicon.ico",
            silent: false
          });
        }
        console.log("[Centinela] Auto-cerrado. Duración:", dur, "min");
      } catch (e) {
        console.error("[Centinela autoclose]", e);
      }
    };

    checkExpiredCentinela();

    const onVisible = async () => {
      if (document.visibilityState === "visible") {
        console.log("[Sistemicar] App volvió al foco — verificando centinela y traslado50");
        await checkExpiredCentinela();
        lastAutoVerdadCheck.current = 0;
        // Delay para que Firebase reconecte y envíe snapshot antes de evaluar Centinela
        setTimeout(() => {
          checkAutoVerdadRef.current?.();
        }, 3000);
        checkTraslado50Ref.current?.();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, planilla]);

  useEffect(() => {
    if (relojTiempo !== "desglosador" || titulo.trim().length < 3) {
      setHistorialSubs([]);
      return;
    }
    const subs = getDesglosadorHistorico(titulo.trim());
    setHistorialSubs(subs);
  }, [titulo, relojTiempo]);

  const resetForm = () => {
    setTitulo("");
    setCriterioFin("tiempo");
    setCriterioDetalle("");
    setEjes({
      enfoque: { text: "", trifecta: "blando" },
      conflicto: { text: "", trifecta: "blando" },
      pasos: { text: "", trifecta: "blando" },
      limite: { text: "", trifecta: "blando" }
    });
    setCurrentStep(0);
    setIsCreating(false);
    setEditingVehicle(null);
    setVehicleMode("selector");
    setSelectedTerminoType(null);
    setTerminoDetalle("");
    setTipoFlotaSeleccionado(null);
    setRelojTiempo("proyectivo");
    setIntensidadEnergetica(null);
    setHoraFinProyectiva("");
    setCantidadProduccion("");
    setTiempoProduccion("");
    setShowTituloProdSuggestions(false);
    setShowDesglosadorTitleSuggestions(false);
    setCantidadInvestigador("");
    setDesglosadorSubs([{ tempId: "sub_0", titulo: "", cantidadObjetivo: "" }]);
    setHistorialSubs([]);
    setSugerenciasIA([]);
    setSugerenciasIALoading(false);
    setSugerenciasIASeleccionadas(new Set());
    setDuracionDescansoH("");
    setDuracionDescansoM("");
    setTipoDescanso(null);
  };

  const isNearDescanso = (): boolean => {
    if (!planilla) return false;
    const nowMin = getCurrentTimeMinutes();
    return planilla.segmentos.some(seg => {
      const isDescanso = seg.nombre.toLowerCase().includes("descanso") || seg.nombre.toLowerCase().includes("almuerzo") || seg.nombre.toLowerCase().includes("comida") || seg.nombre.toLowerCase().includes("break");
      if (!isDescanso) return false;
      const segStart = timeStringToMinutes(seg.horaInicio);
      return segStart - nowMin > 0 && segStart - nowMin <= 15;
    });
  };

  const getDescansoBlocks = (): { horaInicio: string; horaFin: string; duracionMin: number }[] => {
    if (!planilla) return [];
    return planilla.segmentos
      .filter(seg => seg.nombre.toLowerCase().includes("descanso") || seg.nombre.toLowerCase().includes("almuerzo") || seg.nombre.toLowerCase().includes("comida") || seg.nombre.toLowerCase().includes("break"))
      .map(seg => ({
        horaInicio: seg.horaInicio,
        horaFin: seg.horaFin,
        duracionMin: timeStringToMinutes(seg.horaFin) - timeStringToMinutes(seg.horaInicio)
      }));
  };

  const handleFlotaSave = async () => {
    if (!user || !titulo.trim() || !tipoFlotaSeleccionado) return;
    setSaving(true);
    console.log(`[handleFlotaSave] Iniciando creación: "${titulo}" tipo: ${tipoFlotaSeleccionado}`);
    try {
      const flotaConfig = FLOTA_CONFIG[tipoFlotaSeleccionado];
      let detalle = "";
      let criterio: CriterioFin = "circunstancia";
      let tipoTermino: TipoTerminoRapido = "situacion";

      if (tipoFlotaSeleccionado === "tiempo") {
        criterio = "tiempo";
        tipoTermino = "hora";
        if (relojTiempo === "proyectivo") {
          detalle = horaFinProyectiva;
        } else if (relojTiempo === "produccion") {
          detalle = `${cantidadProduccion} x ${tiempoProduccion}min`;
        } else if (relojTiempo === "investigador") {
          detalle = `${cantidadInvestigador} unidades`;
        } else {
          detalle = "";
        }
      } else if (tipoFlotaSeleccionado === "situacion") {
        criterio = "circunstancia";
        tipoTermino = "situacion";
        detalle = terminoDetalle;
      } else if (tipoFlotaSeleccionado === "descanso") {
        criterio = "circunstancia";
        tipoTermino = "omitido";
        const _totalMinDescanso = (Number(duracionDescansoH) || 0) * 60 + (Number(duracionDescansoM) || 0);
        detalle = _totalMinDescanso > 0 ? `${_totalMinDescanso} min` : "Recarga consciente";

      } else {
        criterio = "circunstancia";
        tipoTermino = "omitido";
        detalle = "Modo Verdad";
      }

      const bonoTemple = isNearDescanso();

      sentinelSuppressed.current = true;
      noVehicleSince.current = 0;
      localStorage.removeItem("sistemicar_no_vehicle_since");

      const autoVerdadVehicles = vehicles.filter(v => v.status === "activo" && v.autoVerdad);
      if (autoVerdadVehicles.length > 0) {
        const centinelaCierreAt = Date.now();
        // Optimistic: archive centinela immediately in local state + localStorage
        setVehicles(prev => {
          const updated = prev.map(v =>
            (v.autoVerdad && v.status === "activo")
              ? { ...v, status: "archivado" as VehicleStatus, cierreAt: centinelaCierreAt }
              : v
          );
          vehiclesRef.current = updated;
          saveLocalVehicles(updated);
          return updated;
        });
        const archivePromises = autoVerdadVehicles.map(av => {
          const avDuracion = Math.round((centinelaCierreAt - (av.aperturaAt || centinelaCierreAt)) / 60000);
          return updateVehicle(user.uid, av.id, { cierreAt: centinelaCierreAt, duracionFinal: avDuracion })
            .then(() => updateVehicleStatus(user.uid, av.id, "archivado"))
            .catch(e => console.error(`[handleFlotaSave] Error archivando centinela ${av.id}:`, e));
        });
        Promise.all(archivePromises).catch(() => {});
      }

      let estadoEnergia: "optima" | "baja" | undefined;
      let energiaDiffPct: number | undefined;
      let rendimientoConsciente: "igual" | "mejor" | "peor" | undefined;
      let recordSugerido: number | undefined;
      let tiempoElegido: number | undefined;
      if (tipoFlotaSeleccionado === "tiempo" && (relojTiempo === "produccion" || relojTiempo === "investigador")) {
        const hist = getHistoricalVehicleData(titulo.trim());
        if (hist.count > 0 && hist.bestMinPerUnit) {
          recordSugerido = hist.bestMinPerUnit;
          if (relojTiempo === "produccion" && tiempoProduccion) {
            const currentMinPerUnit = Number(tiempoProduccion);
            tiempoElegido = currentMinPerUnit;
            if (currentMinPerUnit > hist.bestMinPerUnit) {
              estadoEnergia = "baja";
              energiaDiffPct = Math.round(((currentMinPerUnit - hist.bestMinPerUnit) / hist.bestMinPerUnit) * 100);
              rendimientoConsciente = "peor";
            } else if (currentMinPerUnit < hist.bestMinPerUnit) {
              estadoEnergia = "optima";
              energiaDiffPct = 0;
              rendimientoConsciente = "mejor";
            } else {
              estadoEnergia = "optima";
              energiaDiffPct = 0;
              rendimientoConsciente = "igual";
            }
          }
        }
      }

      const segActualNombre = segmentoActivo?.nombre || undefined;

      console.log(`[handleFlotaSave] Creando vehículo en Firebase...`);
      const newVehicleId = await addVehicle(user.uid, {
        titulo: titulo.trim(),
        criterioFin: criterio,
        criterioDetalle: detalle,
        tiempoInicio: new Date(),
        ejes: {
          enfoque: { text: "", trifecta: "omitir" },
          conflicto: { text: "", trifecta: "omitir" },
          pasos: { text: "", trifecta: "omitir" },
          limite: { text: "", trifecta: "omitir" }
        },
        tipoTerminoRapido: tipoTermino,
        tipoFlota: tipoFlotaSeleccionado,
        aperturaAt: Date.now(),
        bonoTemple,
        tipoReloj: tipoFlotaSeleccionado === "tiempo" ? relojTiempo : undefined,
        cantidadObjetivo: relojTiempo === "investigador" ? Number(cantidadInvestigador) : (relojTiempo === "produccion" ? Number(cantidadProduccion) : undefined),
        subVehiculos: relojTiempo === "desglosador" ? desglosadorSubs.filter(s => s.titulo.trim()).map((s, idx) => ({
          id: `sv_${Date.now()}_${idx}`,
          titulo: s.titulo.trim(),
          status: idx === 0 ? "activo" as const : "pendiente" as const,
          aperturaAt: idx === 0 ? Date.now() : undefined,
          cantidadObjetivo: s.cantidadObjetivo ? Number(s.cantidadObjetivo) : undefined,
          tiempoRecordMinPerUnit: s.tiempoRecordMinPerUnit,
          tiempoSugeridoSeg: (s.cantidadObjetivo && s.tiempoRecordMinPerUnit && Number(s.cantidadObjetivo) > 0)
            ? Math.round(Number(s.cantidadObjetivo) * s.tiempoRecordMinPerUnit * 60)
            : undefined,
        })) : undefined,
        estadoEnergia,
        energiaDiffPct,
        segmentoOrigen: segActualNombre,
        segmentosCruzados: 0,
        rendimientoConsciente,
        recordSugerido,
        tiempoElegido,
        intensidadEnergetica: intensidadEnergetica || undefined,
        tipoDescanso: tipoFlotaSeleccionado === "descanso" ? (tipoDescanso || "microcarga") : undefined,
        microPasos: tipoFlotaSeleccionado === "descanso" && tipoDescanso !== "punto_cero" ? { hidratacion: false, respiracion: false, pantallaZero: false } : undefined,
        etapasPuntoCero: tipoFlotaSeleccionado === "descanso" && tipoDescanso === "punto_cero" ? { etapa1: false, etapa2: false, etapa3: false, etapa4: false } : undefined,
      });
      console.log(`[handleFlotaSave] addVehicle retornó id: ${newVehicleId}`);

      if (relojTiempo === "desglosador" && user) {
        const filteredSubs = desglosadorSubs.filter(s => s.titulo.trim());
        if (filteredSubs[0]?.titulo.trim()) {
          toast.info("Profundidad en bloque", {
            description: "Cada hora completa de duración real del desglosador suma +5 PS al activar una nueva subtarea (no al crear el vehículo).",
            style: { backgroundColor: PIZARRA, border: `1px solid rgba(212,175,55,0.35)`, color: GOLD },
            duration: 4500,
          });
        }
      }

      if (bonoTemple) {
        awardSovereigntyPoints(user.uid, 10, "VOLUNTAD SOBRE EL HORARIO: " + titulo.trim()).catch(() => {});
        toast.success("VOLUNTAD SOBRE EL HORARIO +10 PS", {
          description: "Iniciaste en los últimos 15 min antes del descanso",
          style: { backgroundColor: PIZARRA, border: `2px solid ${NARANJA}`, color: NARANJA },
          duration: 4000
        });
      }

      sentinelSuppressed.current = false;
      console.log(`[handleFlotaSave] Vehículo creado exitosamente: "${titulo}"`);

      const optimisticVehicle: Vehicle = {
        id: newVehicleId,
        titulo: titulo.trim(),
        criterioFin: criterio,
        criterioDetalle: detalle,
        tiempoInicio: new Date(),
        createdAt: new Date(),
        userId: user.uid,
        status: "activo" as VehicleStatus,
        ejes: {
          enfoque: { text: "", trifecta: "omitir" },
          conflicto: { text: "", trifecta: "omitir" },
          pasos: { text: "", trifecta: "omitir" },
          limite: { text: "", trifecta: "omitir" }
        },
        tipoTerminoRapido: tipoTermino,
        tipoFlota: tipoFlotaSeleccionado,
        aperturaAt: Date.now(),
        bonoTemple,
        tipoReloj: tipoFlotaSeleccionado === "tiempo" ? relojTiempo : undefined,
        cantidadObjetivo: relojTiempo === "investigador" ? Number(cantidadInvestigador) : (relojTiempo === "produccion" ? Number(cantidadProduccion) : undefined),
        subVehiculos: relojTiempo === "desglosador" ? desglosadorSubs.filter(s => s.titulo.trim()).map((s, idx) => ({
          id: `sv_${Date.now()}_${idx}`,
          titulo: s.titulo.trim(),
          status: idx === 0 ? "activo" as const : "pendiente" as const,
          aperturaAt: idx === 0 ? Date.now() : undefined,
          cantidadObjetivo: s.cantidadObjetivo ? Number(s.cantidadObjetivo) : undefined,
          tiempoRecordMinPerUnit: s.tiempoRecordMinPerUnit,
          tiempoSugeridoSeg: (s.cantidadObjetivo && s.tiempoRecordMinPerUnit && Number(s.cantidadObjetivo) > 0)
            ? Math.round(Number(s.cantidadObjetivo) * s.tiempoRecordMinPerUnit * 60)
            : undefined,
        })) : undefined,
        energiaDiffPct,
        segmentoOrigen: segActualNombre,
        segmentosCruzados: 0,
        rendimientoConsciente,
        recordSugerido,
        tiempoElegido,
        intensidadEnergetica: intensidadEnergetica || undefined,
        tipoDescanso: tipoFlotaSeleccionado === "descanso" ? (tipoDescanso || "microcarga") : undefined,
        microPasos: tipoFlotaSeleccionado === "descanso" && tipoDescanso !== "punto_cero" ? { hidratacion: false, respiracion: false, pantallaZero: false } : undefined,
        etapasPuntoCero: tipoFlotaSeleccionado === "descanso" && tipoDescanso === "punto_cero" ? { etapa1: false, etapa2: false, etapa3: false, etapa4: false } : undefined,
      };
      optimisticVehiclesRef.current = [...optimisticVehiclesRef.current.filter(v => v.id !== newVehicleId), optimisticVehicle];
      setVehicles(prev => {
        const withoutDupe = prev.filter(v => v.id !== newVehicleId);
        console.log(`[handleFlotaSave] OPTIMISTIC UPDATE: Agregando "${titulo}" al estado. Antes: ${withoutDupe.length}, Después: ${withoutDupe.length + 1}`);
        return [optimisticVehicle, ...withoutDupe];
      });

      toast.success(`"${titulo}" lanzado · ${flotaConfig.label}`, {
        description: flotaConfig.psCierre,
        style: { backgroundColor: PIZARRA, border: `1px solid ${flotaConfig.color}`, color: flotaConfig.color }
      });
      registrarEvento(COMPONENTES.PLANIFICACION);
      resetForm();
    } catch {
      sentinelSuppressed.current = false;
      toast.error("Error al guardar vehículo");
    }
    setSaving(false);
  };

  const addSegmento = async () => {
    if (!user || !nuevoSegNombre.trim() || !nuevoSegHoraInicio || !nuevoSegHoraFin) return;
    const seg: SegmentoV5 = {
      id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nombre: nuevoSegNombre.trim(),
      horaInicio: nuevoSegHoraInicio,
      horaFin: nuevoSegHoraFin,
      color: nuevoSegColor,
      icono: nuevoSegIcono,
      estado: "pendiente",
      eventos: [],
      psGanados: 0,
      centinelaEnabled: nuevoSegCentinelaEnabled
    };
    let updated: Planilla;
    try {
      updated = await addSegmentoToPlanilla(user.uid, seg);
    } catch {
      toast.error("No se pudo programar el segmento", {
        description: "Revisa la conexión e intenta de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    setPlanilla(updated);
    setNuevoSegCentinelaEnabled(true);
    setNuevoSegNombre("");
    setNuevoSegHoraInicio("");
    setNuevoSegHoraFin("");
    setNuevoSegColor(SEGMENT_COLORS[0]);
    setNuevoSegIcono(SEGMENT_ICONS[0]);
    setShowCrearSegmento(false);
    setExpandedSegId("segmentos");
    window.setTimeout(() => {
      segmentosListEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
    registrarEvento(COMPONENTES.PLANIFICACION);
    awardSovereigntyPoints(user.uid, 1, "Segmento creado: " + seg.nombre)
      .then(() => {
        toast.success("Segmento programado · +1 PS", {
          description: `${seg.nombre} · ${seg.horaInicio} – ${seg.horaFin}`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${VIOLET}`, color: VIOLET },
          action: {
            label: "Añadir otro",
            onClick: () => setShowCrearSegmento(true),
          },
        });
      })
      .catch(() => {
        toast.success("Segmento guardado", {
          description: `${seg.nombre} · ${seg.horaInicio} – ${seg.horaFin} · Los PS se sincronizarán al reconectar.`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          action: {
            label: "Añadir otro",
            onClick: () => setShowCrearSegmento(true),
          },
        });
      });
  };

  const guardarComoRutina = async () => {
    if (!user || !planilla || !nuevaRutinaNombre.trim()) return;
    const segs: SegmentoTemplate[] = planilla.segmentos.map(s => ({
      nombre: s.nombre,
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
      color: s.color,
      icono: s.icono,
    }));
    await addPlantillaRutina(user.uid, {
      nombre: nuevaRutinaNombre.trim(),
      tipo: nuevaRutinaTipo,
      diasActivos: nuevaRutinaDias,
      segmentos: segs,
    });
    toast.success("Rutina guardada", {
      description: `${segs.length} segmentos guardados como "${nuevaRutinaNombre.trim()}"`,
      style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
    });
    setNuevaRutinaNombre("");
    setShowGuardarRutina(false);
  };

  const cargarRutina = async (plantilla: PlantillaRutina) => {
    if (!user) return;
    const nuevaPlanilla = await applyPlantillaToday(user.uid, plantilla);
    setPlanilla(nuevaPlanilla);
    setRutinaBanner(null);
    toast.success(`Rutina cargada: ${plantilla.nombre}`, {
      description: `${plantilla.segmentos.length} segmentos programados`,
      style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
    });
  };

  const eliminarRutina = async (plantillaId: string) => {
    if (!user) return;
    await deletePlantillaRutina(user.uid, plantillaId);
    toast.success("Rutina eliminada", {
      style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
    });
  };

  const activarSegmento = async (segId: string) => {
    if (!user || !planilla) return;
    const seg = planilla.segmentos.find(s => s.id === segId);
    if (!seg) return;
    const updated = await updateSegmentoInPlanilla(user.uid, segId, {
      estado: "activo",
      activadoAt: Date.now(),
      psGanados: (seg.psGanados || 0) + 2
    });
    setPlanilla(updated);
    await awardSovereigntyPoints(user.uid, 2, "Segmento activado: " + seg.nombre);
    toast.success("+2 PS Puerta de Atención abierta", {
      description: seg.nombre,
      style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD }
    });
    registrarEvento(COMPONENTES.PLANIFICACION);
  };

  const cerrarSegmentoManual = async (segId: string, opts?: { forceOutsideWindow?: boolean }) => {
    if (!user || !planilla) return;
    const seg = planilla.segmentos.find(s => s.id === segId);
    if (!seg || seg.estado !== "activo") return;

    let psCierre = 2;
    if (seg.horaFin && !opts?.forceOutsideWindow) {
      const nowMin = getCurrentTimeMinutes();
      const finMin = timeStringToMinutes(seg.horaFin);
      const dentroVentana = nowMin >= finMin - 5 && nowMin <= finMin + 5;
      if (!dentroVentana) {
        toast.warning("La puerta está sellada", {
          description: `El cierre con intención (+2 PS) está disponible entre 5 min antes y 5 min después de ${seg.horaFin}. Puedes usar «Forzar cierre» si necesitas registrar ya.`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}40`, color: BLOOD },
          duration: 6000,
        });
        return;
      }
    }
    if (opts?.forceOutsideWindow) {
      if (
        !window.confirm(
          "Cerrar fuera de la ventana de la llave: +1 PS (registro honesto), no +2 PS de cierre con intención en horario. ¿Continuar?"
        )
      ) {
        return;
      }
      psCierre = 1;
    }

    const duration = seg.activadoAt ? Math.round((Date.now() - seg.activadoAt) / 60000) : 0;
    setClosedSegmentDuration(duration);
    setClosedSegmentName(seg.nombre);

    const updated = await updateSegmentoInPlanilla(user.uid, segId, {
      estado: "cerrado_manual",
      cerradoAt: Date.now(),
      psGanados: (seg.psGanados || 0) + psCierre
    });
    setPlanilla(updated);
    toast.success(psCierre === 2 ? "+2 PS Cierre Consciente" : "+1 PS Cierre registrado", {
      description: seg.nombre + (psCierre === 2 ? " · Puerta cerrada con intención" : " · Fuera de ventana de llave"),
      style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD }
    });
    awardSovereigntyPoints(user.uid, psCierre, (psCierre === 2 ? "Cierre consciente: " : "Cierre fuera de ventana: ") + seg.nombre).catch(() => {});
    incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
    if (labIntroTimeoutRef.current) {
      clearTimeout(labIntroTimeoutRef.current);
      labIntroTimeoutRef.current = null;
    }
    labIntroTimeoutRef.current = window.setTimeout(() => {
      labIntroTimeoutRef.current = null;
      setShowLabIntrospeccion(true);
    }, 1800);
    registrarEvento(COMPONENTES.PLANIFICACION);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const isAltaIntrospeccion = checkAltaIntrospeccion(ejes);
      if (editingVehicle) {
        const { updateVehicle } = await import("@/lib/persistence");
        await updateVehicle(user.uid, editingVehicle.id, { titulo, criterioFin, criterioDetalle, ejes });
        toast.success("Vehículo actualizado", { style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD } });
      } else {
        await addVehicle(user.uid, { titulo, criterioFin, criterioDetalle, tiempoInicio: new Date(), ejes, aperturaAt: Date.now() });
        toast.success("Vehículo lanzado", { style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD } });
      }
      if (isAltaIntrospeccion) {
        await awardSovereigntyPoints(user.uid, 15, "Alta Introspección: " + titulo);
        toast.success("+15 PS Alta Introspección", {
          description: "Los 4 ejes completados con más de 10 palabras cada uno",
          style: { backgroundColor: PIZARRA, border: `2px solid ${VIOLET}`, color: VIOLET },
          duration: 4000
        });
      }
      registrarEvento(COMPONENTES.PLANIFICACION);
      resetForm();
    } catch {
      toast.error("Error al guardar vehículo");
    }
    setSaving(false);
  };

  const TERMINO_OPTIONS: { id: TipoTerminoRapido; label: string; sublabel: string; puntosCumple: number; puntosNoCumple: number; color: string }[] = [
    { id: "hora", label: "Hora de Término", sublabel: "Define cuándo termina", puntosCumple: 10, puntosNoCumple: 5, color: GOLD },
    { id: "situacion", label: "Situación de Término", sublabel: "Define qué circunstancia termina", puntosCumple: 5, puntosNoCumple: 2, color: AZURE },
    { id: "omitido", label: "Omitir", sublabel: "Sin criterio específico", puntosCumple: 1, puntosNoCumple: 0, color: "#6b7280" }
  ];

  const handleQuickSaveAndNew = async (tipoTermino: TipoTerminoRapido, detalle?: string) => {
    if (!user || !titulo.trim()) return;
    setSaving(true);
    try {
      const terminoInfo = TERMINO_OPTIONS.find(t => t.id === tipoTermino);
      await addVehicle(user.uid, {
        titulo: titulo.trim(),
        criterioFin: tipoTermino === "hora" ? "tiempo" : "circunstancia",
        criterioDetalle: detalle || "",
        tiempoInicio: new Date(),
        ejes: {
          enfoque: { text: "", trifecta: "omitir" },
          conflicto: { text: "", trifecta: "omitir" },
          pasos: { text: "", trifecta: "omitir" },
          limite: { text: "", trifecta: "omitir" }
        },
        tipoTerminoRapido: tipoTermino,
        aperturaAt: Date.now()
      });
      toast.success(`"${titulo}" agregado (+${terminoInfo?.puntosCumple || 0} PS al completar)`, {
        style: { backgroundColor: PIZARRA, border: `1px solid ${terminoInfo?.color || AZURE}`, color: terminoInfo?.color || AZURE }
      });
      registrarEvento(COMPONENTES.PLANIFICACION);
      setTitulo("");
      setTerminoDetalle("");
      setSelectedTerminoType(null);
    } catch {
      toast.error("Error al guardar vehículo");
    }
    setSaving(false);
  };

  const handleQuickEditEje = async (vehicleId: string, ejeKey: string, newText: string, newTrifecta: TrifectaState) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    try {
      const { updateVehicle } = await import("@/lib/persistence");
      const updatedEjes = { ...vehicle.ejes, [ejeKey]: { text: newText, trifecta: newTrifecta } };
      await updateVehicle(user.uid, vehicleId, { ejes: updatedEjes });
      toast.success("Eje actualizado", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${EJES_CONFIG[ejeKey as keyof typeof EJES_CONFIG]?.color || GOLD}`, color: EJES_CONFIG[ejeKey as keyof typeof EJES_CONFIG]?.color || GOLD }
      });
    } catch {
      toast.error("Error al actualizar eje");
    }
  };

  const handleArchiveWithReflection = async (vehicleId: string, reflections: Record<string, string>) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const reflectionCount = Object.values(reflections).filter(r => r.trim().length > 5).length;
    const reflectionBonus = reflectionCount * 2;
    const trifectaToScore = (t: TrifectaState): number => {
      switch (t) { case "reto": return 100; case "intermedio": return 75; case "blando": return 50; default: return 0; }
    };
    const scores: MisionScores = {
      enfoque: trifectaToScore(vehicle.ejes.enfoque.trifecta),
      conflicto: trifectaToScore(vehicle.ejes.conflicto.trifecta),
      pasos: trifectaToScore(vehicle.ejes.pasos.trifecta),
      limite: trifectaToScore(vehicle.ejes.limite.trifecta)
    };
    const totalScore = (scores.enfoque + scores.conflicto + scores.pasos + scores.limite) / 4;
    const comentario = Object.entries(reflections).filter(([_, text]) => text.trim().length > 5).map(([key, text]) => `[${EJES_CONFIG[key as keyof typeof EJES_CONFIG]?.label}] ${text}`).join(" | ") || vehicle.criterioDetalle?.trim() || null;
    await saveMision(user.uid, { titulo: vehicle.titulo, estado: "archivado", scores, soberaniaMomento: Math.round(totalScore), comentario });
    const retoCount = Object.values(vehicle.ejes).filter(e => e.trifecta === "reto").length;
    const intermedioCount = Object.values(vehicle.ejes).filter(e => e.trifecta === "intermedio").length;
    const blandoCount = Object.values(vehicle.ejes).filter(e => e.trifecta === "blando").length;
    const isHardMission = retoCount >= 1;
    const isMediumMission = intermedioCount >= 1 || (blandoCount >= 2 && !isHardMission);
    let baseCPArchivado = 0;
    if (isHardMission) { baseCPArchivado = 15 + (retoCount - 1) * 5 + intermedioCount * 3; }
    else if (isMediumMission) { baseCPArchivado = 5 + intermedioCount * 2; }
    const totalCP = baseCPArchivado + reflectionBonus;
    await recordMissionResult(user.uid, false, false, totalCP);
    await updateVehicleStatus(user.uid, vehicleId, "archivado");
    const isPanorama = Object.values(vehicle.ejes).every(e => e.trifecta === "omitir");
    const vehicleAxes = { enfoque: vehicle.ejes.enfoque.trifecta, conflicto: vehicle.ejes.conflicto.trifecta, pasos: vehicle.ejes.pasos.trifecta, alcance: vehicle.ejes.limite.trifecta };
    const potentialPoints = calculateVehiclePoints(vehicleAxes, isPanorama);
    const archiveJustifications = { enfoque: reflections["enfoque"] || "", conflicto: reflections["conflicto"] || "", pasos: reflections["pasos"] || "", alcance: reflections["limite"] || "" };
    const archivePoints = calculateArchivePoints(potentialPoints, archiveJustifications);
    if (archivePoints > 0) { await awardSovereigntyPoints(user.uid, archivePoints, "Archivado: " + vehicle.titulo); }
    if (reflectionCount > 0) {
      toast.success(`+${totalCP} PS (Reflexión profunda)`, { description: `Base: ${baseCPArchivado} PS + Reflexión: +${reflectionBonus} PS`, style: { backgroundColor: PIZARRA, border: `2px solid ${VIOLET}`, color: VIOLET }, duration: 4000 });
    } else {
      toast.info(`Archivado +${totalCP} PS`, { style: { backgroundColor: PIZARRA, border: `1px solid #6b7280`, color: "#6b7280" } });
    }
  };

  const handleStatusChange = async (vehicleId: string, status: "cumplido" | "archivado", intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { console.warn("[handleStatusChange] Vehículo no encontrado:", vehicleId); return; }

    const safeFb = async (label: string, fn: () => Promise<any>) => {
      try { await fn(); } catch (e) { console.error(`[handleStatusChange] ${label}:`, e); }
    };

    const trifectaToScore = (t: TrifectaState): number => {
      switch (t) { case "reto": return 100; case "intermedio": return 75; case "blando": return 50; default: return 0; }
    };
    const scores: MisionScores = {
      enfoque: trifectaToScore(vehicle.ejes.enfoque.trifecta),
      conflicto: trifectaToScore(vehicle.ejes.conflicto.trifecta),
      pasos: trifectaToScore(vehicle.ejes.pasos.trifecta),
      limite: trifectaToScore(vehicle.ejes.limite.trifecta)
    };
    const totalScore = (scores.enfoque + scores.conflicto + scores.pasos + scores.limite) / 4;
    const comentario = vehicle.criterioDetalle?.trim() || null;
    await safeFb("saveMision", () => saveMision(user.uid, { titulo: vehicle.titulo, estado: status, scores, soberaniaMomento: Math.round(totalScore), comentario }));
    const retoCount = Object.values(vehicle.ejes).filter(e => e.trifecta === "reto").length;
    const intermedioCount = Object.values(vehicle.ejes).filter(e => e.trifecta === "intermedio").length;
    const blandoCount = Object.values(vehicle.ejes).filter(e => e.trifecta === "blando").length;
    const isHardMission = retoCount >= 1;
    const isMediumMission = intermedioCount >= 1 || (blandoCount >= 2 && !isHardMission);
    const isSuccess = status === "cumplido" && isHardMission;
    let missionCP = 0;
    let cpMessage = "";
    if (status === "cumplido") {
      if (isHardMission) { missionCP = 35 + (retoCount - 1) * 10 + intermedioCount * 5; cpMessage = "¡VICTORIA ÉPICA! Te atreviste y CONQUISTASTE"; }
      else if (isMediumMission) { missionCP = 20 + intermedioCount * 3; cpMessage = "¡Misión Cumplida! Avanzaste con constancia"; }
      else { missionCP = 10; cpMessage = "Misión básica completada"; }
    } else {
      if (isHardMission) { missionCP = 15 + (retoCount - 1) * 5 + intermedioCount * 3; cpMessage = "El coraje de intentar un RETO tiene valor"; }
      else if (isMediumMission) { missionCP = 5 + intermedioCount * 2; cpMessage = "Archivado - Aprendizaje obtenido"; }
      else { missionCP = 0; cpMessage = "Archivado sin puntos"; }
    }
    let layerBonus = 0;
    let layerPenalty = 0;
    if (status === "cumplido" && currentLayer >= 3) { layerBonus = 25; missionCP += layerBonus; cpMessage += " · +25 PS Músculo Atencional"; }
    if (status === "archivado" && currentLayer <= 1 && !isHardMission) { layerPenalty = 5; missionCP = Math.max(0, missionCP - layerPenalty); cpMessage += " · -5 PS Desatención"; }
    let missionResult = { challengeCompleted: false, newRank: null as string | null, streak: 0 };
    try { missionResult = await recordMissionResult(user.uid, isSuccess, status === "cumplido", missionCP); } catch (e) { console.error("[handleStatusChange] recordMissionResult:", e); }
    await safeFb("updateStatus", () => updateVehicleStatus(user.uid, vehicleId, status));
    if (intensidadEnergeticaFin) {
      await safeFb("updateEnergiaFin", () => updateVehicle(user.uid, vehicleId, { intensidadEnergeticaFin }));
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, intensidadEnergeticaFin } : v));
      vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, intensidadEnergeticaFin } : v);
    }
    if (currentLayer >= 3 || status === "archivado") {
      try {
        const { addWeeklyAuditLog } = await import("@/lib/persistence");
        await addWeeklyAuditLog(user.uid, { misionTitulo: vehicle.titulo, fatigue_layer: currentLayer, delay_at_close: currentDelayMinutes, transmutation_answer: transmutationText || "", expressCount: todayExpressCount, status, bonusPS: layerBonus, penaltyPS: layerPenalty });
      } catch (e) { console.error("Error logging weekly audit:", e); }
    }
    if (transmutationText && transmutationText.trim().length > 10 && status === "cumplido" && currentLayer >= 3) {
      try {
        await addPrincipioMaestro({ texto: transmutationText.trim(), fuente: "sello_soberania", moduloOrigen: "planificacion" });
        toast.success("Transmutación sellada como Principio Maestro", { style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }, duration: 3000 });
      } catch (e) { console.error("Error sealing principio:", e); }
    }
    setTransmutationText("");
    const isPanorama = Object.values(vehicle.ejes).every(e => e.trifecta === "omitir");
    const vehicleAxes = { enfoque: vehicle.ejes.enfoque.trifecta, conflicto: vehicle.ejes.conflicto.trifecta, pasos: vehicle.ejes.pasos.trifecta, alcance: vehicle.ejes.limite.trifecta };
    if (status === "cumplido" && !vehicle.autoVerdad) {
      const sovereigntyPts = calculateVehiclePoints(vehicleAxes, isPanorama);
      if (sovereigntyPts > 0) { await safeFb("awardPS", () => awardSovereigntyPoints(user.uid, sovereigntyPts, "Planificación: " + vehicle.titulo)); }
      incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
    }
    if (vehicle.tipoFlota === "situacion" && status === "cumplido" && !vehicle.autoVerdad) {
      const durationMin = vehicle.aperturaAt ? Math.floor((Date.now() - vehicle.aperturaAt) / 60000) : 0;
      const isMicroSituacion = durationMin < 10;
      const situacionPS = isMicroSituacion ? 1 : 3 + Math.min(Math.floor(durationMin / 5), 4);
      await safeFb("situacionPS", () => awardSovereigntyPoints(user.uid, situacionPS, `Situación: ${vehicle.titulo}`));
      const durLabel = durationMin < 1 ? "< 1 min" : `${durationMin} min`;
      if (isMicroSituacion) {
        toast.info(`+${situacionPS} PS · Micro-situación registrada`, {
          description: `Duración: ${durLabel} · Menos de 10 min → 1 PS`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${GRIS}`, color: GRIS },
          duration: 4000,
        });
      } else {
        toast.success(`+${situacionPS} PS · Esfuerzo consciente`, {
          description: `Esfuerzo activo: ${durLabel} → ${situacionPS} PS`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
          duration: 4000,
        });
      }
    }
    registrarEvento(COMPONENTES.PLANIFICACION);
    if (missionResult.challengeCompleted) {
      toast.success("¡RETO DE GUERRERO COMPLETADO!", { description: `Has ascendido al rango de Guerrero (+${missionCP} PS)`, style: { backgroundColor: PIZARRA, border: `2px solid ${GOLD}`, color: GOLD }, duration: 5000 });
    } else if (missionResult.newRank) {
      toast.success(`¡Ascenso a ${missionResult.newRank === "operador" ? "Operador" : "Arquitecto"}! +${missionCP} PS`, { style: { backgroundColor: PIZARRA, border: `2px solid ${GOLD}`, color: GOLD }, duration: 4000 });
    } else if (status === "cumplido") {
      toast.success(`+${missionCP} PS`, { description: cpMessage + (missionResult.streak > 0 ? ` · Racha: ${missionResult.streak}/3` : ""), style: { backgroundColor: PIZARRA, border: `1px solid ${isHardMission ? GOLD : EMERALD}`, color: isHardMission ? GOLD : EMERALD } });
    } else {
      if (missionCP > 0) { toast.success(`Archivado +${missionCP} PS`, { description: cpMessage, style: { backgroundColor: PIZARRA, border: `1px solid #f59e0b`, color: "#f59e0b" } }); }
      else { toast.info("Vehículo Archivado", { description: cpMessage, style: { backgroundColor: PIZARRA, border: `1px solid #6b7280`, color: "#6b7280" } }); }
    }
  };

  const handleMicroPasoToggle = async (vehicleId: string, paso: "hidratacion" | "respiracion" | "pantallaZero") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const mp = vehicle.microPasos || { hidratacion: false, respiracion: false, pantallaZero: false };
    if (mp[paso]) return;
    const isFirstPaso = !mp.hidratacion && !mp.respiracion && !mp.pantallaZero;
    const now = Date.now();
    const updatedMp = { ...mp, [paso]: true };
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, microPasos: updatedMp, primerAccionAt: isFirstPaso ? now : v.primerAccionAt } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, microPasos: updatedMp, primerAccionAt: isFirstPaso ? now : v.primerAccionAt } : v);
    updateVehicle(user.uid, vehicleId, isFirstPaso ? { microPasos: updatedMp, primerAccionAt: now } : { microPasos: updatedMp }).catch(() => {});
    awardSovereigntyPoints(user.uid, 1, `Micro-paso (${paso}): ${vehicle.titulo}`).catch(() => {});
    const PASO_LABELS: Record<string, string> = { hidratacion: "Hidratación", respiracion: "Respiración", pantallaZero: "Pantalla Cero" };
    toast.success(`+1 PS · ${PASO_LABELS[paso]}`, { description: "Micro-paso de recarga completado", style: { backgroundColor: PIZARRA, border: `1px solid ${CYAN}`, color: CYAN }, duration: 2500 });
  };

  const GOLD_PC = "#D4AF37";
  const handleEtapaPuntoCeroToggle = (vehicleId: string, etapa: "etapa1" | "etapa2" | "etapa3" | "etapa4") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const ep = vehicle.etapasPuntoCero || { etapa1: false, etapa2: false, etapa3: false, etapa4: false };
    if (ep[etapa]) return;
    if (etapa === "etapa2" && !ep.etapa1) return;
    if (etapa === "etapa3" && !ep.etapa2) return;
    if (etapa === "etapa4" && !ep.etapa3) return;
    // Note: etapa4 color-confirmation (7 arcoíris) is UI-only local state (coloresConfirmados),
    // intentionally session-local and not persisted. Handler enforces etapa3 prerequisite only.
    const isFirstEtapa = !ep.etapa1 && !ep.etapa2 && !ep.etapa3 && !ep.etapa4;
    const now = Date.now();
    const updatedEp = { ...ep, [etapa]: true };
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, etapasPuntoCero: updatedEp, primerAccionAt: isFirstEtapa ? now : v.primerAccionAt } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, etapasPuntoCero: updatedEp, primerAccionAt: isFirstEtapa ? now : v.primerAccionAt } : v);
    updateVehicle(user.uid, vehicleId, isFirstEtapa ? { etapasPuntoCero: updatedEp, primerAccionAt: now } : { etapasPuntoCero: updatedEp }).catch(() => {});
    awardSovereigntyPoints(user.uid, 1, `Etapa Punto Cero (${etapa}): ${vehicle.titulo}`).catch(() => {});
    const ETAPA_LABELS: Record<string, string> = { etapa1: "Tensión y quietud", etapa2: "Identificación del Pensamiento", etapa3: "Ritmo y apnea", etapa4: "Alimento de Colores" };
    toast.success(`+1 PS · ${ETAPA_LABELS[etapa]}`, { description: "Etapa Punto Cero completada", style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD_PC}`, color: GOLD_PC }, duration: 2500 });
  };

  const handleDescansoClose = async (vehicleId: string, closingStatus: "cumplido" | "archivado", etiqueta: "recuperado" | "parcial" | "fragmentado", nota: string, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    if (closingInProgressRef.current.has(vehicleId)) return;
    closingInProgressRef.current.add(vehicleId);
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { closingInProgressRef.current.delete(vehicleId); return; }
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: closingStatus, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, status: closingStatus, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) } : v);
    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    const aperturaAt = vehicle.aperturaAt || Date.now();
    const cierreAt = Date.now();
    const duracionMin = Math.round((cierreAt - aperturaAt) / 60000);
    const TIPO_BASE: Record<string, number> = { intercepcion: 3, microcarga: 5, reset_profundo: 8, punto_cero: 12 };
    const psBase = vehicle.tipoDescanso ? (TIPO_BASE[vehicle.tipoDescanso] || 5) : 5;
    const psEtiqueta = etiqueta === "recuperado" ? 2 : 0;
    const psTotal = psBase + psEtiqueta;
    const ETIQUETA_LABELS: Record<string, string> = { recuperado: "RECUPERADO", parcial: "PARCIAL", fragmentado: "FRAGMENTADO" };
    const ETIQUETA_COLOR: Record<string, string> = { recuperado: "#10b981", parcial: "#f59e0b", fragmentado: "#ef4444" };
    const descansoMatch = vehicle.criterioDetalle?.match(/([\d.]+)\s*min/i);
    const descansoDurMin = descansoMatch ? parseFloat(descansoMatch[1]) : 0;
    const descansoTargetMs = descansoDurMin > 0 ? aperturaAt + (descansoDurMin + 5) * 60000 : 0;
    const dentroVentana = descansoTargetMs === 0 || cierreAt <= descansoTargetMs;
    updateVehicle(user.uid, vehicleId, { status: closingStatus, cierreAt, duracionFinal: duracionMin, cierreManual: dentroVentana, etiquetaSalida: etiqueta, notaSalida: nota, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) }).catch(() => {}).finally(() => { closingInProgressRef.current.delete(vehicleId); });
    awardSovereigntyPoints(user.uid, psTotal, `Descanso cerrado (${ETIQUETA_LABELS[etiqueta]}): ${vehicle.titulo}`).catch(() => {});
    incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
    const esPuntoCero = vehicle.tipoDescanso === "punto_cero";
    const ep = vehicle.etapasPuntoCero || { etapa1: false, etapa2: false, etapa3: false, etapa4: false };
    const epAcreditados = esPuntoCero ? [ep.etapa1, ep.etapa2, ep.etapa3, ep.etapa4].filter(Boolean).length : 0;
    const mp = vehicle.microPasos || { hidratacion: false, respiracion: false, pantallaZero: false };
    const mpAcreditados = esPuntoCero ? 0 : [mp.hidratacion, mp.respiracion, mp.pantallaZero].filter(Boolean).length;
    const etapasLabel = esPuntoCero ? `Etapas (ya acreditadas): +${epAcreditados} PS · Total sesión: +${psTotal + epAcreditados} PS` : `Micro-pasos acreditados: +${mpAcreditados} PS`;
    const toastMsg = dentroVentana
      ? esPuntoCero
        ? `+${psTotal} PS · Puerta sellada. Polo Neutro alcanzado.`
        : `+${psTotal} PS · Puerta sellada. ${ETIQUETA_LABELS[etiqueta]}.`
      : `+${psTotal} PS · ${ETIQUETA_LABELS[etiqueta]}`;
    const borderColor = esPuntoCero ? GOLD_PC : ETIQUETA_COLOR[etiqueta];
    if (dentroVentana) {
      toast.success(toastMsg, {
        description: `Base: +${psBase} · Etiqueta: +${psEtiqueta} · ${etapasLabel}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${borderColor}`, color: borderColor }, duration: 5000
      });
    } else {
      toast.info(toastMsg, {
        description: `Base: +${psBase} · Tolerancia superada · ${etapasLabel}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${borderColor}`, color: borderColor }, duration: 4000
      });
    }
  };

  const handleFlotaStatusChange = async (vehicleId: string, status: "cumplido" | "archivado", intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { console.warn("[handleFlotaStatusChange] Vehículo no encontrado:", vehicleId); return; }
    if (closingInProgressRef.current.has(vehicleId)) return;
    closingInProgressRef.current.add(vehicleId);

    const tipoFlota = vehicle.tipoFlota;
    const aperturaAt = vehicle.aperturaAt || vehicle.createdAt?.getTime() || Date.now();
    const cierreAt = Date.now();
    const duracionMs = cierreAt - aperturaAt;
    const parentesisTotal = (vehicle.parentesisRecarga || []).reduce((sum, p) => sum + p.duracionMin * 60000, 0);
    const duracionNeta = Math.max(0, duracionMs - parentesisTotal);
    const duracionMin = Math.round(duracionNeta / 60000);
    const isCierreManual = status === "cumplido";

    const situacionCloseExtras =
      tipoFlota === "situacion"
        ? { situacionCronometro: null as const, situacionCupoAnchor: null as const }
        : {};

    notifyVehicleClosed(vehicleId);

    const optimisticClose = {
      status,
      cierreAt,
      duracionFinal: duracionMin,
      cierreManual: isCierreManual,
      ...situacionCloseExtras,
      ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
    };

    // Optimistic UI + localStorage inmediatos — no esperar a Firebase
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, ...optimisticClose } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, ...optimisticClose } : v));
    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    saveLocalVehicles(vehiclesRef.current);

    // Helper: fire-and-forget (no await) — no bloqueamos la UI
    const safeFire = (fn: () => Promise<any>) => { fn().catch(() => {}); };

    // Base update: cierreAt + duracionFinal + cierreManual (always needed)
    const baseUpdate = {
      cierreAt,
      duracionFinal: duracionMin,
      cierreManual: isCierreManual,
      ...situacionCloseExtras,
      ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
    };

    try {
      if (tipoFlota === "verdad") {
        safeFire(() => updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }));
        if (vehicle.autoVerdad) {
          toast.info("Centinela cerrado", { description: `Duración: ${duracionMin} min`, style: { backgroundColor: PIZARRA, border: `1px solid ${GRIS}`, color: GRIS }, duration: 3000 });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("⚡ SISTEMICAR — Centinela Cerrado", {
              body: `Sesión registrada. Duración: ${duracionMin} min.`,
              icon: "/favicon.ico",
              silent: false
            });
          }
        } else {
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("Verdad Consciente registrada", { description: `Duración: ${duracionMin} min`, style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD }, duration: 4000 });
        }
      } else if (vehicle.tipoReloj === "investigador") {
        safeFire(() => Promise.all([
          updateVehicle(user.uid, vehicleId, { ...baseUpdate, status: "cumplido" }),
          awardSovereigntyPoints(user.uid, 10, (vehicle.datoConfiable !== false ? "Medición válida: " : "Medición con inconveniente: ") + vehicle.titulo)
        ]));
        incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
      } else if (tipoFlota === "tiempo" || vehicle.tipoTerminoRapido === "hora") {
        const timeMatch = vehicle.criterioDetalle?.match(/^(\d{1,2}):(\d{2})$/);
        const prodMatch = vehicle.criterioDetalle?.match(/^([\d.]+)\s*x\s*([\d.]+)\s*min$/i);
        const isTimerExpired = timeMatch ? (() => {
          const targetMin = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
          const nowMin = getCurrentTimeMinutes();
          return nowMin > targetMin;
        })() : prodMatch ? (() => {
          const totalMinProd = parseFloat(prodMatch[1]) * parseFloat(prodMatch[2]);
          const targetMs = aperturaAt + totalMinProd * 60000;
          return Date.now() > targetMs;
        })() : false;

        if (isTimerExpired && vehicle.justificacion) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, 10, "Tiempo excedido con justificación: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+10 PS Soberanía Recuperada", { description: `Tiempo excedido pero justificado. Energía canalizada.`, style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }, duration: 4000 });
        } else if (isTimerExpired && !vehicle.justificacion) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status, energiaOscura: true }),
            awardSovereigntyPoints(user.uid, 5, "Tiempo excedido sin justificación: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+5 PS (Energía Oscura activa)", { description: `Tiempo excedido. Justifica para recuperar soberanía.`, style: { backgroundColor: PIZARRA, border: `2px solid ${BLOOD}`, color: "#ef4444" }, duration: 5000 });
        } else {
          await handleStatusChange(vehicleId, status, intensidadEnergeticaFin);
        }
      } else if (tipoFlota === "descanso") {
        const descansoMatch = vehicle.criterioDetalle?.match(/([\d.]+)\s*min/i);
        const descansoDurMin = descansoMatch ? parseFloat(descansoMatch[1]) : 0;
        const descansoTargetMs = descansoDurMin > 0 ? aperturaAt + (descansoDurMin + 5) * 60000 : 0;
        const isDescansoExpired = descansoTargetMs > 0 && cierreAt > descansoTargetMs;

        if (isCierreManual && !isDescansoExpired) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, 10, "Recarga consciente dentro de tolerancia: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+10 PS Recarga Consciente", { description: `Duración: ${duracionMin} min · Dentro de tolerancia`, style: { backgroundColor: PIZARRA, border: `1px solid ${VERDE}`, color: VERDE }, duration: 4000 });
        } else if (isCierreManual && isDescansoExpired && vehicle.justificacion) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, 10, "Recarga justificada: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+10 PS Soberanía Recuperada", { description: `Duración: ${duracionMin} min · Justificación aceptada`, style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }, duration: 4000 });
        } else if (isCierreManual && isDescansoExpired) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status, energiaOscura: true }),
            awardSovereigntyPoints(user.uid, 5, "Descanso en deuda: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+5 PS (Descanso en deuda)", { description: `Duración: ${duracionMin} min · Tolerancia superada. Justifica para +10 PS`, style: { backgroundColor: PIZARRA, border: `2px solid ${BLOOD}`, color: "#ef4444" }, duration: 5000 });
        } else {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, 5, "Descanso cerrado: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.info("Descanso cerrado (+5 PS)", { description: `Duración: ${duracionMin} min`, style: { backgroundColor: PIZARRA, border: `1px solid ${GRIS}`, color: GRIS } });
        }
      } else if (tipoFlota === "situacion" && (vehicle.segmentosCruzados || 0) > 0) {
        if (vehicle.justificacion) {
          const psBase = 10;
          const psRecuperado = Math.round(psBase * 0.5);
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, psRecuperado, `Cruce justificado (${vehicle.segmentosCruzados} seg): ${vehicle.titulo}`)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success(`+${psRecuperado} PS Cruce Justificado`, {
            description: `Cruzó ${vehicle.segmentosCruzados} segmento(s). Justificación aceptada.`,
            style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }, duration: 4000
          });
        } else {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status, energiaOscura: true })
          ]));
          toast.info(`Cruce sin justificar (${vehicle.segmentosCruzados} seg)`, {
            description: `Dato registrado para Doctor IA. Justifica para recuperar PS.`,
            style: { backgroundColor: PIZARRA, border: `2px solid ${BLOOD}`, color: "#ef4444" }, duration: 5000
          });
        }
      } else {
        await handleStatusChange(vehicleId, status, intensidadEnergeticaFin);
      }

      const isWithin5Min = segmentoActivo && segmentoActivo.horaFin && (() => {
        const finMin = timeStringToMinutes(segmentoActivo.horaFin);
        const nowMin = getCurrentTimeMinutes();
        return finMin - nowMin >= 0 && finMin - nowMin <= 5;
      })();

      if (isCierreManual && isWithin5Min) {
        toast.success("Puerta sellada. Voltaje recuperado.", { style: { backgroundColor: PIZARRA, border: `2px solid ${GOLD}`, color: GOLD }, duration: 5000 });
      }

      if (vehicle.tipoReloj === "produccion" || vehicle.tipoReloj === "investigador") {
        const cantidad = vehicle.cantidadObjetivo || 0;
        const isDatoConfiable = vehicle.datoConfiable !== false;
        if (cantidad > 0 && duracionMin > 0 && isDatoConfiable && status === "cumplido") {
          const minPerUnit = duracionMin / cantidad;
          const prevHistory = getHistoricalVehicleData(vehicle.titulo);
          saveVehicleHistory(vehicle.titulo, minPerUnit, duracionMin, vehicle.tipoReloj, user.uid, { status: "cumplido" });
          safeFire(() => updateVehicle(user.uid, vehicleId, { resultadoPorUnidad: Math.round((duracionNeta / 1000) / cantidad) }));

          if (prevHistory.count > 0 && prevHistory.bestMinPerUnit && minPerUnit < prevHistory.bestMinPerUnit) {
            const mejoraPct = Math.round(((prevHistory.bestMinPerUnit - minPerUnit) / prevHistory.bestMinPerUnit) * 100);
            if (mejoraPct > 0) {
              setGoldenFlash(true);
              setTimeout(() => setGoldenFlash(false), 3000);
              setRecordBanner({ mejora: mejoraPct, titulo: vehicle.titulo });
              setTimeout(() => setRecordBanner(null), 8000);
              safeFire(() => awardSovereigntyPoints(user.uid, 3, "Eficiencia Pura: Récord en " + vehicle.titulo));
              toast.success("RÉCORD DE SOBERANÍA DETECTADO", {
                description: `Has optimizado tu procesamiento en un ${mejoraPct}%. +3 PS de bono por Eficiencia Pura.`,
                style: { backgroundColor: "#1a1a0a", border: `2px solid ${GOLD}`, color: GOLD, boxShadow: `0 0 30px ${GOLD}40` },
                duration: 6000
              });
            }
          }
        } else if (status === "archivado" || (status === "cumplido" && cantidad > 0 && !isDatoConfiable)) {
          // Registrar archivados/descartados para trazabilidad completa
          saveVehicleHistory(vehicle.titulo, 0, duracionMin, vehicle.tipoReloj, user.uid, { status: "incumplido" });
          if (!isDatoConfiable) {
            toast.info("Dato descartado del historial", {
              description: "Marcado como incumplido. Este tiempo no se usará para sugerencias futuras.",
              style: { backgroundColor: PIZARRA, border: `1px solid ${NARANJA}`, color: NARANJA }, duration: 4000
            });
          }
        }
      }

      registrarEvento(COMPONENTES.PLANIFICACION);
    } catch (err: any) {
      console.error("[handleFlotaStatusChange] ERROR:", err);
    } finally {
      closingInProgressRef.current.delete(vehicleId);
    }
  };

  const handleInvestigadorClose = async (vehicleId: string, cumplido: boolean, cantidadRealizada: number, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { console.warn("[investigadorClose] Vehículo no encontrado:", vehicleId); return; }

    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    setVehicles(prev => prev.map(v => v.id === vehicleId
      ? { ...v, status: "cumplido", datoConfiable: cumplido, cierreAt: Date.now(), cierreManual: true, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) }
      : v
    ));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId
      ? { ...v, status: "cumplido", datoConfiable: cumplido, cierreAt: Date.now(), cierreManual: true, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) }
      : v
    );

    const cierreAt = Date.now();
    const aperturaAt = vehicle.aperturaAt || vehicle.createdAt?.getTime() || 0;
    if (!aperturaAt) {
      console.warn("[investigadorClose] Advertencia: aperturaAt y createdAt ausentes. duracionFinal será 0.", vehicleId);
    }
    const duracionFinal = aperturaAt > 0 ? Math.round((cierreAt - aperturaAt) / 60000) : 0;

    const extraUpdates: Record<string, unknown> = {};
    if (cumplido && cantidadRealizada > 0 && duracionFinal > 0) {
      const minPerUnit = duracionFinal / cantidadRealizada;
      extraUpdates.resultadoPorUnidad = Number(minPerUnit.toFixed(2));
      extraUpdates.cantidadObjetivo = cantidadRealizada;
    }

    try {
      await updateVehicle(user.uid, vehicleId, {
        datoConfiable: cumplido,
        cierreAt,
        duracionFinal,
        cierreManual: true,
        ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
        ...(extraUpdates as object)
      });
      await updateVehicleStatus(user.uid, vehicleId, "cumplido");

      if (cumplido && cantidadRealizada > 0 && duracionFinal > 0) {
        const minPerUnit = duracionFinal / cantidadRealizada;
        const prevHistory = getHistoricalVehicleData(vehicle.titulo);
        saveVehicleHistory(vehicle.titulo, minPerUnit, duracionFinal, "investigador", user.uid, { status: "cumplido" });

        if (prevHistory.count > 0 && prevHistory.bestMinPerUnit && minPerUnit < prevHistory.bestMinPerUnit) {
          const mejoraPct = Math.round(((prevHistory.bestMinPerUnit - minPerUnit) / prevHistory.bestMinPerUnit) * 100);
          if (mejoraPct > 0) {
            setGoldenFlash(true);
            setTimeout(() => setGoldenFlash(false), 3000);
            setRecordBanner({ mejora: mejoraPct, titulo: vehicle.titulo });
            setTimeout(() => setRecordBanner(null), 8000);
            awardSovereigntyPoints(user.uid, 3, "Récord Investigador: " + vehicle.titulo)
              .catch(e => console.warn("[investigadorClose] recordPS falló:", e));
          }
        }
      } else if (!cumplido && duracionFinal > 0) {
        saveVehicleHistory(vehicle.titulo, 0, duracionFinal, "investigador", user.uid, { status: "incumplido" });
      }

      awardSovereigntyPoints(user.uid, 10,
        (cumplido ? "Medición válida: " : "Medición con inconveniente: ") + vehicle.titulo
      ).catch(e => console.warn("[investigadorClose] awardPS falló (no crítico):", e));
      incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
      registrarEvento(COMPONENTES.PLANIFICACION);
      toast.success(cumplido ? "+10 PS Medición Válida" : "+10 PS Registro Honesto", {
        description: cumplido
          ? `Dato registrado. ${cantidadRealizada > 0 && duracionFinal > 0 ? `${(duracionFinal / cantidadRealizada).toFixed(1)} min/unidad guardado en Bóveda.` : "Guardado para sugerencias futuras."}`
          : "Inconveniente reportado. Dato descartado del historial.",
        style: {
          backgroundColor: PIZARRA,
          border: `1px solid ${cumplido ? EMERALD : NARANJA}`,
          color: cumplido ? EMERALD : NARANJA
        },
        duration: 4000
      });
    } catch (err) {
      console.error("[investigadorClose] Error detallado:", err);
      toast.error("Error al cerrar el vehículo. Intenta de nuevo.");
    }
  };

  const handleDesglosadorUpdate = (vehicleId: string, updatedSubs: SubVehiculo[]) => {
    if (!user) return;
    const prevVehicle = vehiclesRef.current.find(v => v.id === vehicleId);
    const oldSubs = prevVehicle?.subVehiculos || [];
    let depthGranted = prevVehicle?.desglosadorBloqueDepthPsGranted ?? 0;
    for (const sv of updatedSubs) {
      if (sv.status !== "activo" || !sv.aperturaAt) continue;
      const old = oldSubs.find(s => s.id === sv.id);
      const isNewActivation = !old || old.status !== "activo" || old.aperturaAt !== sv.aperturaAt;
      if (!isNewActivation) continue;
      const aperturaMs = prevVehicle?.aperturaAt ?? (prevVehicle?.createdAt?.getTime?.() ?? 0);
      const elapsedSec = aperturaMs > 0 ? Math.floor((Date.now() - aperturaMs) / 1000) : 0;
      const totalDepthPs = computeBloqueDepthPS(elapsedSec);
      const delta = totalDepthPs - depthGranted;
      if (delta <= 0) continue;
      depthGranted = totalDepthPs;
      awardSovereigntyPoints(user.uid, delta, `Profundidad desglosador (bloque): ${cleanSubTitulo(sv.titulo)}`).catch(e =>
        console.warn("[handleDesglosadorUpdate] depth PS falló:", e)
      );
      toast.success(`+${delta} PS · profundidad de bloque`, {
        description: `${cleanSubTitulo(sv.titulo)} · +5 PS por cada hora completa en el desglosador`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
        duration: 3200,
      });
    }
    // Compute new vehicles array directly (no side effects inside setter)
    const newVehicles = vehicles.map(v => v.id === vehicleId ? { ...v, subVehiculos: updatedSubs, desglosadorBloqueDepthPsGranted: depthGranted } : v);
    // Update React state — pure, no side effects inside
    setVehicles(newVehicles);
    // Keep ref in sync for the Firebase listener protection
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subVehiculos: updatedSubs } : v);
    // Persist to localStorage outside the setter, wrapped in try/catch so storage
    // quota errors on mobile never prevent the UI from updating
    try {
      saveLocalVehicles(newVehicles);
    } catch (e) {
      console.warn("[Desglosador] localStorage save failed (quota?), UI still updated:", e);
    }
    // No Firebase write — subVehiculos are session state; only written on global close
  };

  const handleDesglosadorGlobalClose = async (vehicleId: string, subs: SubVehiculo[], intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const cierreAt = Date.now();
    const aperturaAt = vehicle.aperturaAt || vehicle.createdAt?.getTime() || 0;
    const duracionFinal = aperturaAt > 0 ? Math.round((cierreAt - aperturaAt) / 60000) : 0;
    const cumplidos = subs.filter(s => s.status === "cumplido").length;
    const fallados = subs.filter(s => s.status === "fallado").length;
    const closedSubs = subs.filter(s => s.status === "cumplido" || s.status === "fallado");

    // Save individual cumplido sub-vehicles for min/unit benchmarks
    for (const sv of subs) {
      if (sv.status === "cumplido" && sv.cantidadLograda && sv.cantidadLograda > 0 && sv.duracionFinal && sv.duracionFinal > 0) {
        const minPerUnit = (sv.duracionFinal / 60) / sv.cantidadLograda;
        const tituloCompleto = `${vehicle.titulo} → ${sv.titulo}`;
        saveVehicleHistory(tituloCompleto, minPerUnit, sv.duracionFinal / 60, "desglosador", user.uid, { status: "cumplido" });
      }
    }

    // Save a cycle-level summary entry with full subResumen for traceability
    if (closedSubs.length > 0) {
      saveVehicleHistory(
        vehicle.titulo,
        0,
        duracionFinal,
        "desglosador_ciclo",
        user.uid,
        {
          status: "cumplido",
          cumplidos,
          fallados,
          totalSubs: subs.length,
          subResumen: closedSubs.map(sv => ({
            titulo: sv.titulo,
            status: sv.status as "cumplido" | "fallado",
            cantidadObjetivo: sv.cantidadObjetivo,
            cantidadLograda: sv.cantidadLograda,
            duracionMin: sv.duracionFinal != null ? Math.round(sv.duracionFinal / 60) : undefined,
          })),
        }
      );
    }

    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    setVehicles(prev => prev.map(v => v.id === vehicleId
      ? { ...v, status: "cumplido", cierreAt, cierreManual: true, subVehiculos: subs, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) }
      : v
    ));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId
      ? { ...v, status: "cumplido", cierreAt, cierreManual: true, subVehiculos: subs, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) }
      : v
    );

    try {
      const fallados = subs.filter(s => s.status === "fallado").length;
      const subPoints = (cumplidos * 2) + (fallados * 1);
      const totalPS = 10 + subPoints;
      await updateVehicle(user.uid, vehicleId, { cierreAt, duracionFinal, cierreManual: true, subVehiculos: subs, ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}) });
      await updateVehicleStatus(user.uid, vehicleId, "cumplido");
      await awardSovereigntyPoints(user.uid, totalPS, `Ciclo Desglosador completado: ${vehicle.titulo}`)
        .catch(e => console.warn("[desglosadorClose] awardPS falló:", e));
      registrarEvento(COMPONENTES.PLANIFICACION);
      toast.success(`+${totalPS} PS — Ciclo cerrado`, {
        description: `Base +10 · ${cumplidos} cumplido${cumplidos !== 1 ? "s" : ""} (+${cumplidos * 2} PS) · ${fallados} fallado${fallados !== 1 ? "s" : ""} (+${fallados} PS).${duracionFinal > 0 ? ` ${duracionFinal} min total.` : ""}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
        duration: 4000
      });
    } catch (err) {
      console.error("[desglosadorGlobalClose] Error:", err);
      toast.error("Error al cerrar el ciclo. Intenta de nuevo.");
    }
  };

  const handleJustificar = async (vehicleId: string, justificacion: string) => {
    if (!user) return;
    await updateVehicle(user.uid, vehicleId, { justificacion, energiaOscura: false });
    await awardSovereigntyPoints(user.uid, 5, "Justificación aceptada: soberanía recuperada");
    toast.success("+5 PS adicionales por justificación", {
      description: "Soberanía recuperada. La sombra ha sido procesada.",
      style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }
    });
  };

  // ── RADIOGRAFÍA — generar reporte ──
  const handleGenerarRadiografia = async () => {
    if (!user || radiografiaTokens.tokens <= 0) return;
    setGenerandoRadiografia(true);
    try {
      let expedientesData: ExpedienteClinico[] = [];
      try { expedientesData = await getExpedientesRecientes(user.uid, 10); } catch {}
      const response = await fetch("/api/radiografia/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gordaRecord: gordaHistory.filter(g => !g.titulo?.includes(" → ")).slice(0, 50),
          expedientes: expedientesData.map(e => ({
            codigo: (e as any).codigo_diagnostico || "",
            interfaz: (e as any).interfaz_primaria || "",
            seccion: (e as any).seccion_afectada || "",
            vibracion: (e as any).vibracion_final || 0,
            fecha: (e as any).fecha?.toISOString?.() || ""
          })),
          totalPS: progression?.sovereigntyPoints || 0,
        })
      });
      if (!response.ok) throw new Error("Error del servidor");
      const data = await response.json();
      await consumeRadiografiaToken(user.uid);
      setRadiografiaReport(data.report);
      toast.success("Radiografía generada — perfil conductual listo");
    } catch {
      toast.error("Error generando Radiografía. Intenta de nuevo.");
    } finally {
      setGenerandoRadiografia(false);
    }
  };

  // ── RADIOGRAFÍA — métricas parciales (cliente) ──
  const radiografiaParcial = useMemo(() => {
    const base = gordaHistory.filter(g => !g.titulo?.includes(" → "));
    const incumplidos = base.filter(g => g.status === "incumplido" || g.status === "fallado");
    const cumplidos = base.filter(g => !g.status || g.status === "cumplido");
    const total = base.length;
    const ratioPct = total > 0 ? Math.round((incumplidos.length / total) * 100) : 0;
    const byType: Record<string, number> = {};
    incumplidos.forEach(g => { const t = g.tipoReloj || "otro"; byType[t] = (byType[t] || 0) + 1; });
    const tipoDom = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const tipoLabel: Record<string, string> = { produccion: "Producción", situacional: "Situacional", descanso: "Descanso", verdad: "Verdad", desglosador: "Desglosador", desglosador_ciclo: "Ciclo" };
    return { cumplidos: cumplidos.length, incumplidos: incumplidos.length, total, ratioPct, tipoDom: tipoDom ? (tipoLabel[tipoDom] || tipoDom) : null, suficiente: total >= 5 };
  }, [gordaHistory]);

  /** Ancla el temporizador auditivo del cupo a la primera subtarea pendiente con minutosCupo > 0. */
  const handleSyncSituacionCupoAnchor = useCallback(async (vehicleId: string, opts?: { forceResetSameRow?: boolean }) => {
    if (!user) return;
    const v = vehiclesRef.current.find(x => x.id === vehicleId);
    if (!v || v.tipoFlota !== "situacion" || v.status !== "activo") return;
    const list = v.subTareas || [];
    const cronActivo = v.situacionCronometro?.activo === true;
    const first = list.find(st => {
      if (!((st.minutosCupo ?? 0) > 0)) return false;
      if (cronActivo) return situacionFilaCronometroPendiente(st);
      return !st.enDesgloseCronometro && !st.completada;
    });
    const cur = v.situacionCupoAnchor;
    if (!first) {
      if (cur != null) {
        setVehicles(prev => prev.map(x => (x.id === vehicleId ? { ...x, situacionCupoAnchor: undefined } : x)));
        vehiclesRef.current = vehiclesRef.current.map(x => (x.id === vehicleId ? { ...x, situacionCupoAnchor: undefined } : x));
        try {
          await updateVehicle(user.uid, vehicleId, { situacionCupoAnchor: null });
        } catch (err) {
          console.error("[handleSyncSituacionCupoAnchor] clear", err);
        }
      }
      return;
    }
    if (cur?.subTareaId === first.id && !opts?.forceResetSameRow) return;
    const next = { subTareaId: first.id, startedAt: Date.now() };
    setVehicles(prev => prev.map(x => (x.id === vehicleId ? { ...x, situacionCupoAnchor: next } : x)));
    vehiclesRef.current = vehiclesRef.current.map(x => (x.id === vehicleId ? { ...x, situacionCupoAnchor: next } : x));
    try {
      await updateVehicle(user.uid, vehicleId, { situacionCupoAnchor: next });
    } catch (err) {
      console.error("[handleSyncSituacionCupoAnchor] set", err);
    }
  }, [user]);

  const handleAddSubTarea = async (vehicleId: string, texto: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const newSubTarea = { id: `st_${Date.now()}`, texto, completada: false, creadaAt: Date.now() };
    const subTareas = [...(vehicle.subTareas || []), newSubTarea];
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
      void handleSyncSituacionCupoAnchor(vehicleId);
    } catch (e) {
      console.error("[handleAddSubTarea]", e);
    }
  };

  const handleToggleSubTarea = async (vehicleId: string, subTareaId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const targetSub = (vehicle.subTareas || []).find(st => st.id === subTareaId);
    if (targetSub?.enDesgloseCronometro) return;
    const isChecking = targetSub ? !targetSub.completada : false;
    const list = vehicle.subTareas || [];
    const idx = list.findIndex(st => st.id === subTareaId);
    const chimesOnComplete = isChecking && vehicle.tipoFlota === "situacion" && idx >= 0 ? Math.max(1, list.length - idx) : 0;
    const subTareas = list.map(st => st.id === subTareaId ? { ...st, completada: !st.completada } : st);
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
      void handleSyncSituacionCupoAnchor(vehicleId);
      if (chimesOnComplete > 0) void playSituacionChimes(chimesOnComplete);
      if (isChecking && vehicle.tipoFlota === "situacion" && targetSub) {
        try {
          await awardSovereigntyPoints(user.uid, 2, `Sub-tarea (lista libre): ${targetSub.texto}`);
          toast.success("+2 PS · Sub-tarea (lista libre)", {
            style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
            duration: 2000,
          });
        } catch { console.error("[handleToggleSubTarea] awardSovereigntyPoints falló"); }
      }
    } catch (e) { console.error("[handleToggleSubTarea]", e); }
  };

  const handleSetSubTareaMinutosCupo = async (vehicleId: string, subTareaId: string, minutos: number | undefined) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas) return;
    const subTareas = vehicle.subTareas.map(st => {
      if (st.id !== subTareaId) return st;
      if (minutos === undefined || minutos <= 0 || !Number.isFinite(minutos)) {
        const next = { ...st };
        delete (next as { minutosCupo?: number }).minutosCupo;
        return next;
      }
      return { ...st, minutosCupo: Math.round(Math.min(999, Math.max(0, minutos))) };
    });
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    try {
      const vAfter = vehiclesRef.current.find(x => x.id === vehicleId);
      const sc = vAfter?.situacionCronometro;
      let situacionCronometroPatch: Vehicle["situacionCronometro"] | undefined;
      if (sc?.activo && vAfter?.subTareas) {
        const sum = sumMinutosCronometroPendientes(vAfter.subTareas);
        const base = sc.bloqueInicioAt ?? Date.now();
        situacionCronometroPatch = { ...sc, horaFinMs: base + sum * 60000 };
      }
      await updateVehicle(user.uid, vehicleId, { subTareas, ...(situacionCronometroPatch ? { situacionCronometro: situacionCronometroPatch } : {}) });
      if (situacionCronometroPatch) {
        setVehicles(prev => prev.map(x => (x.id === vehicleId ? { ...x, situacionCronometro: situacionCronometroPatch! } : x)));
        vehiclesRef.current = vehiclesRef.current.map(x => (x.id === vehicleId ? { ...x, situacionCronometro: situacionCronometroPatch! } : x));
      }
      const first = (vAfter?.subTareas || []).find(st => {
        if (!((st.minutosCupo ?? 0) > 0)) return false;
        if (sc?.activo) return situacionFilaCronometroPendiente(st);
        return !st.enDesgloseCronometro && !st.completada;
      });
      void handleSyncSituacionCupoAnchor(vehicleId, first?.id === subTareaId ? { forceResetSameRow: true } : undefined);
    } catch (err) {
      console.error("[handleSetSubTareaMinutosCupo]", err);
    }
  };

  const handleExtendSituacionCupo = async (vehicleId: string, subTareaId: string, delta: number) => {
    if (!user || delta <= 0) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.tipoFlota !== "situacion") return;
    const list = vehicle.subTareas;
    const idx = list.findIndex(st => st.id === subTareaId);
    if (idx === -1) return;
    const cronActivo = vehicle.situacionCronometro?.activo === true;
    const donorIdx = list.findIndex((st, i) => {
      if (i <= idx) return false;
      if (cronActivo) return situacionFilaCronometroPendiente(st) && (st.minutosCupo ?? 0) >= delta;
      return !st.completada && (st.minutosCupo ?? 0) >= delta;
    });
    if (donorIdx === -1) {
      toast.error("Sin cupo en la siguiente fila", {
        description: `Necesitas ≥${delta} min en una subtarea posterior pendiente.`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    const cur = list[idx];
    const donor = list[donorIdx];
    const subTareas = list.map((st, i) => {
      if (i === idx) return { ...st, minutosCupo: (cur.minutosCupo ?? 0) + delta };
      if (i === donorIdx) return { ...st, minutosCupo: Math.max(0, (donor.minutosCupo ?? 0) - delta) };
      return st;
    });
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
      toast.success(`+${delta} min`, {
        description: `Tomado de la subtarea ${donorIdx + 1}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 2500,
      });
      void handleSyncSituacionCupoAnchor(vehicleId);
    } catch (e) {
      console.error("[handleExtendSituacionCupo]", e);
    }
  };

  const handleMoveSubTareasToCronometro = async (vehicleId: string, ids: string[]) => {
    if (!user || ids.length === 0) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.tipoFlota !== "situacion") return;
    const idSet = new Set(ids);
    const libreOrdered = vehicle.subTareas.filter(st => !idSet.has(st.id));
    const lifted = vehicle.subTareas.filter(st => idSet.has(st.id)).map(st => ({
      ...st,
      enDesgloseCronometro: true,
      resultadoSituacion: "pendiente" as const,
      minutosCupo: st.minutosCupo && st.minutosCupo > 0 ? st.minutosCupo : 10,
    }));
    const subTareas = [...libreOrdered, ...lifted];
    const prevSc = vehicle.situacionCronometro;
    const firstActivation = prevSc?.activo !== true;
    const bloqueInicioAt = firstActivation ? Date.now() : (prevSc?.bloqueInicioAt ?? Date.now());
    const sum = sumMinutosCronometroPendientes(subTareas);
    const situacionCronometro = {
      activo: true,
      bloqueInicioAt,
      horaFinMs: bloqueInicioAt + sum * 60000,
      depthBlockPsGranted: prevSc?.depthBlockPsGranted ?? 0,
    };
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void handleSyncSituacionCupoAnchor(vehicleId);
      toast.success("Desglose con tiempo", {
        description: `${lifted.length} subtarea(s) · Σ ${sum} min`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 3200,
      });
    } catch (e) {
      console.error("[handleMoveSubTareasToCronometro]", e);
    }
  };

  const handleSituacionCronometroSetHoraFin = async (vehicleId: string, hhmm: string) => {
    if (!user) return;
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.situacionCronometro?.activo !== true) return;
    const now = new Date();
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const mi = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    const target = new Date(now);
    target.setHours(h, mi, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const horaFinMs = target.getTime();
    const remainingMin = Math.max(1, Math.round((horaFinMs - Date.now()) / 60000));
    const subTareas = redistribuirMinutosSituacionCronometro(vehicle.subTareas, remainingMin);
    const situacionCronometro = { ...vehicle.situacionCronometro!, horaFinMs };
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void handleSyncSituacionCupoAnchor(vehicleId);
      toast.success("Hora fin ajustada · cupos redistribuidos", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${VERDE}`, color: VERDE },
        duration: 2800,
      });
    } catch (e) {
      console.error("[handleSituacionCronometroSetHoraFin]", e);
    }
  };

  const handleSituacionCronometroCumplido = async (vehicleId: string, subTareaId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.tipoFlota !== "situacion" || vehicle.situacionCronometro?.activo !== true) return;
    const list = vehicle.subTareas;
    const targetSub = list.find(st => st.id === subTareaId);
    if (!targetSub?.enDesgloseCronometro || (targetSub.resultadoSituacion ?? "pendiente") !== "pendiente") return;
    const listCronOrder = list.filter(st => st.enDesgloseCronometro);
    const idx = listCronOrder.findIndex(st => st.id === subTareaId);
    const chimesOnComplete = idx >= 0 ? Math.max(1, listCronOrder.length - idx) : 1;
    const subTareas = list.map(st =>
      st.id === subTareaId ? { ...st, completada: true, resultadoSituacion: "cumplido" as const } : st
    );
    const sc = vehicle.situacionCronometro!;
    const bloqueInicio = sc.bloqueInicioAt ?? vehicle.aperturaAt ?? Date.now();
    const elapsedSec = Math.floor((Date.now() - bloqueInicio) / 1000);
    const totalDepthPs = computeBloqueDepthPS(elapsedSec);
    const prevGranted = sc.depthBlockPsGranted ?? 0;
    const deltaDepth = totalDepthPs - prevGranted;
    const situacionCronometro = { ...sc, depthBlockPsGranted: totalDepthPs };
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void playSituacionChimes(chimesOnComplete);
      void handleSyncSituacionCupoAnchor(vehicleId);
      await awardSovereigntyPoints(user.uid, 4, `Sub-tarea (cronómetro): ${targetSub.texto}`);
      if (deltaDepth > 0) await awardSovereigntyPoints(user.uid, deltaDepth, `Profundidad bloque situación: ${vehicle.titulo}`);
      if (deltaDepth > 0) {
        toast.success(`+4 PS · +${deltaDepth} PS profundidad (bloque)`, {
          style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
          duration: 2800,
        });
      } else {
        toast.success("+4 PS · Cumplido (cronómetro)", {
          style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
          duration: 2200,
        });
      }
    } catch (e) {
      console.error("[handleSituacionCronometroCumplido]", e);
    }
  };

  const handleSituacionCronometroFallado = async (vehicleId: string, subTareaId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.tipoFlota !== "situacion" || vehicle.situacionCronometro?.activo !== true) return;
    const targetSub = vehicle.subTareas.find(st => st.id === subTareaId);
    if (!targetSub?.enDesgloseCronometro || (targetSub.resultadoSituacion ?? "pendiente") !== "pendiente") return;
    const subTareas = vehicle.subTareas.map(st =>
      st.id === subTareaId ? { ...st, completada: false, resultadoSituacion: "fallado" as const } : st
    );
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas } : v));
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
      void handleSyncSituacionCupoAnchor(vehicleId);
      toast.info("Fallado (sin PS de fila)", { description: targetSub.texto, duration: 2200 });
    } catch (e) {
      console.error("[handleSituacionCronometroFallado]", e);
    }
  };

  const handleQuitarSubTareaDeCronometro = async (vehicleId: string, subTareaId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas) return;
    const st = vehicle.subTareas.find(s => s.id === subTareaId);
    if (!st?.enDesgloseCronometro || (st.resultadoSituacion ?? "pendiente") !== "pendiente") return;
    const subTareas = vehicle.subTareas.map(s => {
      if (s.id !== subTareaId) return s;
      const next = { ...s, enDesgloseCronometro: false };
      delete (next as { resultadoSituacion?: string }).resultadoSituacion;
      return next;
    });
    const stillCron = subTareas.some(s => s.enDesgloseCronometro);
    const sc = vehicle.situacionCronometro;
    let situacionCronometro: Vehicle["situacionCronometro"] | undefined;
    if (stillCron && sc?.activo) {
      const sum = sumMinutosCronometroPendientes(subTareas);
      const base = sc.bloqueInicioAt ?? Date.now();
      situacionCronometro = { ...sc, horaFinMs: base + sum * 60000 };
    } else {
      situacionCronometro = { activo: false, depthBlockPsGranted: sc?.depthBlockPsGranted ?? 0 };
    }
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void handleSyncSituacionCupoAnchor(vehicleId);
    } catch (e) {
      console.error("[handleQuitarSubTareaDeCronometro]", e);
    }
  };

  const handleAddDetalle = async (vehicleId: string, subTareaId: string, texto: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const nuevoDetalle: DetalleSubTarea = { id: `dt_${Date.now()}`, texto, entregado: false, creadaAt: Date.now() };
    const subTareas = (vehicle.subTareas || []).map(st =>
      st.id === subTareaId ? { ...st, detalles: [...(st.detalles || []), nuevoDetalle] } : st
    );
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    try { await updateVehicle(user.uid, vehicleId, { subTareas }); } catch (e) { console.error("[handleAddDetalle]", e); }
  };

  const handleEntregarDetalle = async (vehicleId: string, subTareaId: string, detalleId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const targetSub = (vehicle.subTareas || []).find(st => st.id === subTareaId);
    const targetDetalle = (targetSub?.detalles || []).find(d => d.id === detalleId);
    if (!targetDetalle || targetDetalle.entregado) return;
    const subTareas = (vehicle.subTareas || []).map(st =>
      st.id === subTareaId
        ? { ...st, detalles: (st.detalles || []).map(d => d.id === detalleId ? { ...d, entregado: true } : d) }
        : st
    );
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
      try {
        await awardSovereigntyPoints(user.uid, 1, `Detalle: ${targetDetalle.texto}`);
        toast.success("⚡ +1 PS · Detalle entregado", {
          style: { backgroundColor: PIZARRA, border: `1px solid ${CYAN}`, color: CYAN },
          duration: 1800
        });
      } catch { console.error("[handleEntregarDetalle] awardSovereigntyPoints falló"); }
    } catch (e) { console.error("[handleEntregarDetalle]", e); }
  };

  const canProceed = () => {
    const step = STEPS[currentStep];
    switch (step) {
      case "titulo": return titulo.trim().length >= 3;
      case "criterio": return criterioDetalle.trim().length >= 3;
      case "enfoque": return ejes.enfoque.trifecta === "omitir" || ejes.enfoque.text.trim().length > 0;
      case "conflicto": return ejes.conflicto.trifecta === "omitir" || ejes.conflicto.text.trim().length > 0;
      case "pasos": return ejes.pasos.trifecta === "omitir" || ejes.pasos.text.trim().length > 0;
      case "limite": return ejes.limite.trifecta === "omitir" || ejes.limite.text.trim().length > 0;
      case "confirmar": return true;
      default: return false;
    }
  };

  const activeVehicles = vehicles.filter(v => v.status === "activo");
  const completedVehicles = vehicles.filter(v => v.status === "cumplido" || v.status === "archivado");
  const expressVehiclesActivos = activeVehicles.filter(v => v.tipoTerminoRapido);
  const panoramicaActivos = expressVehiclesActivos.filter(v => v.tipoTerminoRapido === "omitido");
  const operativaActivos = expressVehiclesActivos.filter(v => v.tipoTerminoRapido !== "omitido");
  const panoramicaHistorial = completedVehicles.filter(v => v.tipoTerminoRapido === "omitido");
  const operativaHistorial = completedVehicles.filter(v => v.tipoTerminoRapido !== "omitido");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayExpressCount = vehicles.filter(v => {
    if (!v.tipoTerminoRapido) return false;
    const created = v.createdAt ? new Date(typeof v.createdAt === 'object' && (v.createdAt as any).seconds ? (v.createdAt as any).seconds * 1000 : v.createdAt) : null;
    return created && created >= todayStart;
  }).length;

  const getDelayMinutes = (): number => {
    const debtVehicles = expressVehiclesActivos.filter(v => v.tipoTerminoRapido !== "omitido");
    const lastVehicle = debtVehicles[0];
    if (!lastVehicle || !lastVehicle.tiempoInicio) return 0;
    const inicio = typeof lastVehicle.tiempoInicio === 'object' && (lastVehicle.tiempoInicio as any).seconds
      ? new Date((lastVehicle.tiempoInicio as any).seconds * 1000)
      : new Date(lastVehicle.tiempoInicio as any);
    return Math.max(0, Math.round((Date.now() - inicio.getTime()) / 60000));
  };
  const currentDelayMinutes = getDelayMinutes();

  const calculateLayer = (): number => {
    if (currentDelayMinutes > 60) return 4;
    if (todayExpressCount >= 5 || currentDelayMinutes > 30) return 3;
    if ((todayExpressCount >= 3 && todayExpressCount <= 4) || (currentDelayMinutes >= 15 && currentDelayMinutes <= 30)) return 2;
    return 1;
  };
  const currentLayer = calculateLayer();

  const recentSituacionCount = operativaActivos.filter(v => {
    if (v.tipoTerminoRapido !== "situacion") return false;
    const created = v.createdAt ? new Date(typeof v.createdAt === 'object' && (v.createdAt as any).seconds ? (v.createdAt as any).seconds * 1000 : v.createdAt) : null;
    if (!created) return false;
    return (Date.now() - created.getTime()) < 15 * 60 * 1000;
  }).length;

  const segmentoActivoMinutes = segmentoActivo?.activadoAt ? Math.round((Date.now() - segmentoActivo.activadoAt) / 60000) : 0;

  const sortedOperativaActivos = [...operativaActivos].sort((a, b) => {
    const isHoraA = a.tipoTerminoRapido === "hora";
    const isHoraB = b.tipoTerminoRapido === "hora";
    if (isHoraA && !isHoraB) return -1;
    if (!isHoraA && isHoraB) return 1;
    if (isHoraA && isHoraB) {
      const now = getCurrentTimeMinutes();
      const diffA = Math.abs(timeStringToMinutes(a.criterioDetalle) - now);
      const diffB = Math.abs(timeStringToMinutes(b.criterioDetalle) - now);
      return diffA - diffB;
    }
    return 0;
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const tikTapIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTikTap = useCallback(() => {
    if (!tikSoundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, [tikSoundEnabled]);

  useEffect(() => {
    const hasDelay = currentDelayMinutes > 0;
    const modalOpen = isCreating || expandedId !== null;
    if (hasDelay && modalOpen) {
      const interval = 2000 + Math.random() * 1000;
      tikTapIntervalRef.current = setInterval(playTikTap, interval);
    }
    return () => { if (tikTapIntervalRef.current) { clearInterval(tikTapIntervalRef.current); tikTapIntervalRef.current = null; } };
  }, [currentDelayMinutes, isCreating, expandedId, playTikTap]);

  const segmentoActualIdx = planilla ? planilla.segmentos.findIndex(s => s.estado === "activo") : -1;
  const segmentoNumero = segmentoActualIdx >= 0 ? segmentoActualIdx + 1 : null;

  const renderStepProfundo = () => {
    const step = STEPS[currentStep];
    if (step === "titulo") {
      return (
        <motion.div key="titulo" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4">
          <h2 className="text-lg font-black text-white">Nombra tu Misión</h2>
          <p className="text-sm text-slate-500 italic" style={{ fontFamily: "Georgia, serif" }}>"El nombre define la intención. Sé preciso."</p>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Dominar React en 30 días" className="w-full p-4 rounded-2xl bg-[#0a0a0a] border text-white placeholder:text-slate-600 focus:outline-none text-sm" style={{ borderColor: titulo ? GOLD : "rgba(255,255,255,0.1)" }} />
        </motion.div>
      );
    }
    if (step === "criterio") {
      return (
        <motion.div key="criterio" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4">
          <h2 className="text-lg font-black text-white">Criterio de Fin</h2>
          <p className="text-sm text-slate-500 italic" style={{ fontFamily: "Georgia, serif" }}>"¿Cómo sabrás que has terminado?"</p>
          <div className="flex gap-3">
            <button onClick={() => setCriterioFin("tiempo")} className={cn("flex-1 p-4 rounded-2xl border-2 flex items-center gap-2 transition-all", criterioFin === "tiempo" ? "scale-[1.02]" : "opacity-60")} style={{ borderColor: criterioFin === "tiempo" ? GOLD : "rgba(255,255,255,0.1)", backgroundColor: criterioFin === "tiempo" ? `${GOLD}10` : "transparent" }}>
              <Clock size={20} style={{ color: GOLD }} /><span className="text-sm font-bold text-white">Tiempo</span>
            </button>
            <button onClick={() => setCriterioFin("circunstancia")} className={cn("flex-1 p-4 rounded-2xl border-2 flex items-center gap-2 transition-all", criterioFin === "circunstancia" ? "scale-[1.02]" : "opacity-60")} style={{ borderColor: criterioFin === "circunstancia" ? AZURE : "rgba(255,255,255,0.1)", backgroundColor: criterioFin === "circunstancia" ? `${AZURE}10` : "transparent" }}>
              <Flag size={20} style={{ color: AZURE }} /><span className="text-sm font-bold text-white">Circunstancia</span>
            </button>
          </div>
          <input value={criterioDetalle} onChange={(e) => setCriterioDetalle(e.target.value)} placeholder={criterioFin === "tiempo" ? "Ej: En 2 semanas" : "Ej: Cuando complete 10 proyectos"} className="w-full p-4 rounded-2xl bg-[#0a0a0a] border text-white placeholder:text-slate-600 focus:outline-none text-sm" style={{ borderColor: criterioDetalle ? (criterioFin === "tiempo" ? GOLD : AZURE) : "rgba(255,255,255,0.1)" }} />
        </motion.div>
      );
    }
    if (step === "enfoque" || step === "conflicto" || step === "pasos" || step === "limite") {
      const ejeKey = step as keyof typeof EJES_CONFIG;
      const config = EJES_CONFIG[ejeKey];
      const Icon = config.icon;
      const ejeData = ejes[ejeKey];
      const detailCount = countDetails(ejeData.text);
      const autoLevel = getAutoTrifecta(ejeData.text);
      return (
        <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${config.color}20` }}><Icon size={20} style={{ color: config.color }} /></div>
            <div><h2 className="text-lg font-black" style={{ color: config.color }}>{config.label}</h2><p className="text-xs text-slate-500">{config.desc}</p></div>
          </div>
          <div className="flex gap-1">
            {TRIFECTA_OPTIONS.map((opt) => {
              const isAuto = autoLevel === opt.id;
              return (<div key={opt.id} className={cn("flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-wide text-center transition-all", isAuto ? "scale-105 ring-2 ring-offset-1 ring-offset-black" : "opacity-40")} style={{ backgroundColor: isAuto ? opt.color : "rgba(255,255,255,0.05)", color: isAuto ? (opt.id === "reto" ? "#000" : "#fff") : "#555", boxShadow: isAuto ? `0 0 0 2px ${opt.color}` : "none" }}>{opt.label}</div>);
            })}
          </div>
          <p className="text-[10px] text-center text-slate-500">
            {detailCount === 0 && "Escribe para subir de nivel"}
            {detailCount === 1 && "1 detalle = BLANDO. Agrega más para subir."}
            {detailCount === 2 && "2 detalles = INTERMEDIO. Uno más para RETO."}
            {detailCount >= 3 && "3+ detalles = RETO. Máxima conciencia."}
          </p>
          {countWords(ejeData.text) > 0 && (
            <p className="text-[9px] text-center" style={{ color: countWords(ejeData.text) >= 10 ? EMERALD : "#6b7280" }}>
              {countWords(ejeData.text)} palabras {countWords(ejeData.text) >= 10 ? "· Alta Introspección activa" : `· ${10 - countWords(ejeData.text)} más para bono +15 PS`}
            </p>
          )}
          <textarea value={ejeData.text} onChange={(e) => { const newText = e.target.value; const newTrifecta = getAutoTrifecta(newText); setEjes(prev => ({ ...prev, [ejeKey]: { text: newText, trifecta: newTrifecta } })); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} placeholder={config.placeholder} rows={4} className="w-full p-4 rounded-2xl bg-[#0a0a0a] border text-white placeholder:text-slate-600 focus:outline-none text-sm resize-none overflow-hidden italic" style={{ borderColor: detailCount > 0 ? config.color : "rgba(255,255,255,0.1)", fontFamily: "Georgia, serif", minHeight: "120px" }} />
        </motion.div>
      );
    }
    if (step === "confirmar") {
      return (
        <motion.div key="confirmar" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4">
          <h2 className="text-lg font-black text-white text-center">Confirmar Lanzamiento</h2>
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border space-y-3" style={{ borderColor: `${GOLD}30` }}>
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500 uppercase">Misión</span><span className="text-sm font-bold text-white">{titulo}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500 uppercase">Criterio</span><span className="text-sm text-white">{criterioDetalle}</span></div>
            <div className="border-t pt-3 mt-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {Object.entries(EJES_CONFIG).map(([key, config]) => {
                const ejeData = ejes[key as keyof typeof EJES_CONFIG];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <config.icon size={14} style={{ color: config.color }} />
                    <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", ejeData.trifecta === "reto" ? "bg-amber-500/20 text-amber-400" : ejeData.trifecta === "intermedio" ? "bg-blue-500/20 text-blue-400" : ejeData.trifecta === "omitir" ? "bg-slate-700/30 text-slate-500" : "bg-slate-600/20 text-slate-400")}>{ejeData.trifecta}</span>
                    <span className="text-[9px] text-slate-600 ml-auto">{countWords(ejeData.text)}w</span>
                  </div>
                );
              })}
              {checkAltaIntrospeccion(ejes) && (
                <div className="mt-3 p-2 rounded-xl text-center" style={{ backgroundColor: `${VIOLET}15`, border: `1px solid ${VIOLET}30` }}>
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: VIOLET }}>Alta Introspección +15 PS</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const getSegIcon = (icono: string) => {
    switch (icono) {
      case "brain": return Brain;
      case "target": return Target;
      case "flame": return Flame;
      case "shield": return Shield;
      case "zap": return Zap;
      case "activity": return Activity;
      case "eye": return Eye;
      case "layers": return Layers;
      default: return Brain;
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto space-y-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${BLOOD}20` }}>
            <Rocket size={16} style={{ color: BLOOD }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BLOOD }}>Planificación v5.5</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">PLANIFICACIÓN</h1>
            <ManualTriggerButton manualType="planificacion" />
          </div>
          <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">Sistema de Segmentos · Puerta de Atención</p>
        </motion.div>

        {/* MONITOR DE ESTADOS */}
        {monitorState && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-xl border-2" style={{ backgroundColor: `${MONITOR_STATES[monitorState].color}10`, borderColor: MONITOR_STATES[monitorState].color }}>
            <div className="flex items-center gap-3">
              {(() => { const Icon = MONITOR_STATES[monitorState].icon; return <Icon size={20} style={{ color: MONITOR_STATES[monitorState].color }} />; })()}
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: MONITOR_STATES[monitorState].color }}>{MONITOR_STATES[monitorState].label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{MONITOR_STATES[monitorState].desc}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* BARRA PS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl border relative overflow-hidden" style={{ backgroundColor: PIZARRA, borderColor: goldenFlash ? GOLD : `${GOLD}20`, boxShadow: goldenFlash ? `0 0 30px ${GOLD}50, 0 0 60px ${GOLD}20` : "none", transition: "all 0.5s ease" }}>
          <AnimatePresence>
            {goldenFlash && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 0.6, 0.3, 0.6, 0], scale: [0.8, 1.1, 1, 1.1, 0.8] }} transition={{ duration: 2.5, times: [0, 0.2, 0.5, 0.7, 1] }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: `radial-gradient(circle at center, ${GOLD}30 0%, transparent 70%)`, zIndex: 1 }} />
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-2 relative" style={{ zIndex: 2 }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Puntos de Soberanía</span>
            <motion.span animate={goldenFlash ? { scale: [1, 1.3, 1.1, 1.25, 1], textShadow: [`0 0 0px ${GOLD}`, `0 0 20px ${GOLD}`, `0 0 10px ${GOLD}`, `0 0 25px ${GOLD}`, `0 0 0px ${GOLD}`] } : {}} transition={{ duration: 2 }} className="text-lg font-black" style={{ color: GOLD }}>{progression?.sovereigntyPoints || 0} PS</motion.span>
          </div>
          <div className="h-2 rounded-full overflow-hidden relative" style={{ backgroundColor: "rgba(255,255,255,0.1)", zIndex: 2 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((progression?.sovereigntyPoints || 0) / 1000) * 100, 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${BLOOD} 0%, ${GOLD} 100%)` }} />
          </div>
        </motion.div>

        {/* RADIOGRAFÍA DEL OPERADOR — mini barra de progreso de tokens */}
        {(() => {
          const ps = progression?.sovereigntyPoints || 0;
          const STEP = 350;
          const nextMilestone = (Math.floor(ps / STEP) + 1) * STEP;
          const prevMilestone = nextMilestone - STEP;
          const pct = Math.min(((ps - prevMilestone) / STEP) * 100, 100);
          const hasTokens = radiografiaTokens.tokens > 0;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border cursor-pointer overflow-hidden"
              style={{ backgroundColor: "rgba(0,255,195,0.04)", borderColor: hasTokens ? "#00FFC340" : "rgba(0,255,195,0.12)" }}
              onClick={() => setShowRadiografia(v => !v)}
              data-testid="radiografia-toggle"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <Scan size={12} style={{ color: "#00FFC3" }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#00FFC3" }}>Radiografía del Operador</span>
                </div>
                {hasTokens ? (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: "#00FFC320", color: "#00FFC3" }}>
                    {radiografiaTokens.tokens} disponible{radiografiaTokens.tokens !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500">{nextMilestone - ps} PS restantes</span>
                )}
              </div>
              {!hasTokens && (
                <div className="h-1 w-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full"
                    style={{ background: "linear-gradient(90deg, #00FFC340, #00FFC3)" }}
                  />
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* BÓVEDA DE LOGROS — HITO PLANIFICACIÓN */}
        <PlanModuleMilestoneBar pts={progression?.ptsPlanificacion || 0} />

        {/* ANILLO DE CONCIENCIA */}
        {(() => {
          const segs = planilla?.segmentos || [];
          const vRaw = vehicles.filter(v => !v.autoVerdad);
          const { planificacionPct } = calcularAnilloSoberania(segs, vRaw);
          const _todayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
          const _todayVehicles = vehicles.filter(v => !v.autoVerdad && (
            v.status === "activo" ||
            ((v.status === "cumplido" || v.status === "archivado") && ((v.cierreAt || v.aperturaAt || 0) >= _todayStart))
          ));
          const minutosPlaneados = segs.reduce((acc: number, s: any) => {
            const [hi, mi] = (s.horaInicio || "0:0").split(":").map(Number);
            const [hf, mf] = (s.horaFin || "0:0").split(":").map(Number);
            const ini = hi * 60 + mi;
            const fin = hf * 60 + mf;
            const dur = fin >= ini ? fin - ini : fin + 1440 - ini;
            return acc + Math.max(0, dur);
          }, 0);
          const horasCubiertas = Math.round(minutosPlaneados / 60);

          const _openedToday = _todayVehicles.length;
          const _conquiMax = Math.max(segs.length, 10);
          const _minutosEnVehiculos = _todayVehicles.reduce((acc: number, v: any) => {
            if (v.status === "activo" && v.aperturaAt) return acc + Math.max(0, (Date.now() - v.aperturaAt) / 60000);
            if (v.duracionFinal != null) return acc + v.duracionFinal;
            if (v.cierreAt && v.aperturaAt) return acc + Math.max(0, (v.cierreAt - v.aperturaAt) / 60000);
            return acc;
          }, 0);
          const _tiempoPct = minutosPlaneados > 0 ? Math.min(100, (_minutosEnVehiculos / minutosPlaneados) * 100) : 0;
          const _cantidadPct = Math.min(100, (_openedToday / _conquiMax) * 100);
          const conquistaPct = 0.6 * _tiempoPct + 0.4 * _cantidadPct;

          const centinelaActivo = vehicles.find(v => v.autoVerdad && v.status === "activo");
          const centinelaMinActivo = centinelaActivo && centinelaActivo.aperturaAt
            ? Math.round((Date.now() - centinelaActivo.aperturaAt) / 60000)
            : 0;
          const centinelasCerrados = vehicles.filter(v => v.autoVerdad && v.status !== "activo");
          const totalEntropiaMin = centinelasCerrados.reduce((s: number, v: any) => s + (v.duracionFinal || 0), 0) + centinelaMinActivo;
          const jornadaMin = minutosPlaneados || 1440;
          const entropiaPct = Math.min(100, (totalEntropiaMin / jornadaMin) * 100);

          const segConquistados = segs.filter((s: any) => s.estado === "cerrado_manual").length;
          const segFallados = segs.filter((s: any) => s.estado === "entropia").length;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center p-3 rounded-xl border"
              style={{ backgroundColor: "rgba(10,10,10,0.8)", borderColor: "rgba(212,175,55,0.15)" }}
            >
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-center mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                ANILLO DE CONCIENCIA
              </p>
              <AnilloConciencia planificacionPct={planificacionPct} conquistaPct={conquistaPct} entropiaPct={entropiaPct} size={130} segmentos={segs} />
              <div className="mt-2 grid grid-cols-3 gap-1 w-full text-center">
                <div>
                  <p className="text-[7px] text-slate-500 uppercase">Hrs Plan</p>
                  <p className="text-xs font-black" style={{ color: "#D4AF37" }}>{horasCubiertas}h</p>
                </div>
                <div>
                  <p className="text-[7px] uppercase font-bold" style={{ color: "#00FFC3" }}>✓ Seg.</p>
                  <p className="text-xs font-black" style={{ color: "#00FFC3" }}>{segConquistados}/{segs.length}</p>
                </div>
                <div>
                  <p className="text-[7px] uppercase font-bold" style={{ color: "#FF3131" }}>✗ Fall.</p>
                  <p className="text-xs font-black" style={{ color: "#FF3131" }}>{segFallados}</p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        <AnimatePresence>
          {recordBanner && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="p-4 rounded-xl border-2 relative overflow-hidden" style={{ backgroundColor: "#1a1a0a", borderColor: GOLD, boxShadow: `0 0 25px ${GOLD}30, inset 0 0 30px ${GOLD}08` }}>
              <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${GOLD}15 0%, transparent 60%)` }} />
              <div className="relative" style={{ zIndex: 2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${GOLD}20`, boxShadow: `0 0 12px ${GOLD}30` }}>
                    <Brain size={16} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD }}>Doctor IA</p>
                    <p className="text-[8px] text-slate-500">Récord de Soberanía Detectado</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                  Has optimizado tu procesamiento en un <span className="font-black" style={{ color: GOLD, textShadow: `0 0 8px ${GOLD}40` }}>{recordBanner.mejora}%</span>. Tu capacidad de solución está escalando. <span className="font-bold" style={{ color: GOLD }}>+3 PS de bono por Eficiencia Pura.</span>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>{recordBanner.titulo}</span>
                  <span className="text-[8px] text-slate-600">Registro superado</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RADIOGRAFÍA DEL OPERADOR — panel expandible */}
        <AnimatePresence>
          {showRadiografia && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "#050D0A", borderColor: "#00FFC330" }}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSearch size={14} style={{ color: "#00FFC3" }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#00FFC3" }}>Radiografía del Operador</span>
                  </div>
                  {radiografiaReport && (
                    <button
                      onClick={() => { setRadiografiaReport(null); }}
                      className="text-[8px] text-slate-600 hover:text-slate-400"
                    >
                      Nueva
                    </button>
                  )}
                </div>

                {/* MÉTRICA 1 — siempre visible (datos reales del historial) */}
                <div className="p-3 rounded-lg border" style={{ backgroundColor: "rgba(0,255,195,0.05)", borderColor: "#00FFC320" }}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: "#00FFC370" }}>
                    01 — Patrón de Boicot
                  </p>
                  {radiografiaParcial.total < 5 ? (
                    <p className="text-[10px] text-slate-500">Necesitas al menos 5 vehículos cerrados para detectar el patrón. ({radiografiaParcial.total}/5)</p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        <span className="font-black" style={{ color: radiografiaParcial.ratioPct >= 40 ? "#FF3131" : radiografiaParcial.ratioPct >= 20 ? "#F97316" : "#00FFC3" }}>{radiografiaParcial.ratioPct}%</span>{" "}
                        de tus {radiografiaParcial.total} vehículos cerrados son incumplidos
                        {radiografiaParcial.tipoDom && <span style={{ color: "#F97316" }}> — tipo dominante: <strong>{radiografiaParcial.tipoDom}</strong></span>}.
                      </p>
                      <p className="text-[8px] text-slate-500 mt-1">
                        {radiografiaParcial.cumplidos} cumplidos · {radiografiaParcial.incumplidos} incumplidos
                      </p>
                    </>
                  )}
                </div>

                {/* MÉTRICAS 2-6 — disponibles en reporte completo */}
                {!radiografiaReport && (
                  <div className="space-y-2">
                    {[
                      { n: "02", label: "Interfaz Clínica Dominante", preview: "Tu programa central activa M0█ — presente en el █3% de tus sesiones del Espejo" },
                      { n: "03", label: "Brecha Percepción/Realidad", preview: "Estimas █.█ min/unidad pero tu historial registra █.█ — brecha de ██%" },
                      { n: "04", label: "Curva de Soberanía", preview: "Tendencia: ██████████ — tu voltaje PS muestra █ patrón de █████████" },
                      { n: "05", label: "Ratio Desglosador", preview: "Completas el ██% de subs en ciclos — el ██% de los fallos ocurren en las ██ primeras" },
                      { n: "06", label: "Bucle Programático", preview: "Código ██-████ se repite █ veces — bucle activo en Sección ██████" },
                    ].map(m => (
                      <div key={m.n} className="p-3 rounded-lg border relative overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.05)" }}>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-40" style={{ color: "#00FFC3" }}>
                          {m.n} — {m.label}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed" style={{ filter: "blur(3.5px)", userSelect: "none" }}>
                          {m.preview}
                        </p>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Lock size={10} className="text-slate-700 opacity-60" />
                        </div>
                      </div>
                    ))}

                    {/* CTA generar */}
                    <div className="pt-1">
                      {radiografiaTokens.tokens > 0 ? (
                        <button
                          onClick={handleGenerarRadiografia}
                          disabled={generandoRadiografia}
                          data-testid="radiografia-generar-btn"
                          className="w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                          style={{ backgroundColor: "#00FFC315", border: "1px solid #00FFC340", color: "#00FFC3", opacity: generandoRadiografia ? 0.6 : 1 }}
                        >
                          {generandoRadiografia ? (
                            <><RefreshCw size={12} className="animate-spin" />Procesando datos...</>
                          ) : (
                            <><Scan size={12} />Generar Radiografía — 1 token</>
                          )}
                        </button>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-[9px] text-slate-600">Alcanza 350 PS para desbloquear tu primer token</p>
                          <p className="text-[8px] text-slate-700 mt-0.5">Plan Soberano Operativo recibe 2 tokens/mes</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* REPORTE COMPLETO */}
                {radiografiaReport && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    {([
                      { key: "interfazDominante", n: "02", label: "Interfaz Clínica Dominante", getContent: (r: any) => r?.interfazDominante ? `${r.interfazDominante.interfaz} — ${r.interfazDominante.label}` : "" },
                      { key: "brechaPercepcion", n: "03", label: "Brecha Percepción/Realidad", getContent: (r: any) => r?.brechaPercepcion?.descripcion || "" },
                      { key: "curvaSoberania", n: "04", label: "Curva de Soberanía", getContent: (r: any) => r?.curvaSoberania ? `${r.curvaSoberania.label} — ${r.curvaSoberania.tendencia}` : "" },
                      { key: "ratioDesglosador", n: "05", label: "Ratio Desglosador", getContent: (r: any) => r?.ratioDesglosador?.descripcion || "" },
                      { key: "bucleProgramatico", n: "06", label: "Bucle Programático", getContent: (r: any) => r?.bucleProgramatico?.descripcion || "" },
                    ] as const).map(m => (
                      <div key={m.key} className="p-3 rounded-lg border" style={{ backgroundColor: "rgba(0,255,195,0.04)", borderColor: "#00FFC318" }}>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: "#00FFC370" }}>
                          {m.n} — {m.label}
                        </p>
                        <p className="text-[10px] text-slate-300 leading-relaxed">{m.getContent(radiografiaReport)}</p>
                      </div>
                    ))}

                    {/* Recomendación clínica */}
                    {radiografiaReport.recomendacionClinical && (
                      <div className="p-3 rounded-lg border-2 mt-2" style={{ backgroundColor: "rgba(212,175,55,0.05)", borderColor: `${GOLD}40` }}>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: GOLD }}>Protocolo Clínico — Próximos 7 días</p>
                        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Georgia, serif" }}>
                          {radiografiaReport.recomendacionClinical}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MONITOR MÚSCULO ATENCIONAL */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl border" style={{ backgroundColor: PIZARRA, borderColor: `${BLOOD}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={12} style={{ color: BLOOD }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: BLOOD }}>Monitor de Músculo Atencional</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <span className="text-lg font-black" style={{ color: AZURE }}>{todayExpressCount}</span>
              <p className="text-[8px] text-slate-500 uppercase">Misiones</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              {segmentoActivo ? (
                <><span className="text-lg font-black" style={{ color: EMERALD }}>S{segmentoNumero}</span><p className="text-[8px] text-slate-400 truncate max-w-[80px] mx-auto">{segmentoActivo.nombre}</p></>
              ) : (
                <><span className="text-lg font-black text-slate-600">—</span><p className="text-[8px] text-slate-500 uppercase">Sin Segmento</p></>
              )}
            </div>
            <div className="text-center p-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <span className="text-lg font-black" style={{ color: currentDelayMinutes > 30 ? BLOOD : currentDelayMinutes > 15 ? "#f59e0b" : EMERALD }}>{currentDelayMinutes}m</span>
              <p className="text-[8px] text-slate-500 uppercase">Retraso</p>
            </div>
          </div>
        </motion.div>

        {/* BÓVEDA DE RÉCORDS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => setShowBoveda(true)} className="w-full p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01]" style={{ backgroundColor: PIZARRA, borderColor: `${GOLD}25`, boxShadow: `0 0 15px ${GOLD}08` }} data-testid="btn-boveda-records">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${GOLD}15`, boxShadow: `0 0 10px ${GOLD}20` }}>
                <Trophy size={14} style={{ color: GOLD }} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD }}>Bóveda de Récords</p>
                <p className="text-[8px] text-slate-600">Tiempos de Oro · Energía Real Verificada</p>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: GOLD }} />
          </button>
        </motion.div>

        <AnimatePresence>
          {showBoveda && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-lg mx-4 my-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${GOLD}20`, boxShadow: `0 0 20px ${GOLD}30` }}>
                      <Trophy size={20} style={{ color: GOLD }} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">BÓVEDA DE RÉCORDS</h2>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">Tiempos de Oro · Certificados</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowBoveda(false); setSelectedBovedaRecord(null); }} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors" data-testid="btn-close-boveda">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>

                {selectedBovedaRecord ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <button onClick={() => setSelectedBovedaRecord(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                      <ChevronLeft size={14} /> Volver a la Bóveda
                    </button>

                    <div className="p-4 rounded-xl border-2 relative overflow-hidden" style={{ backgroundColor: PIZARRA, borderColor: VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].color, boxShadow: `0 0 25px ${VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].glow}` }}>
                      <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].color}10 0%, transparent 60%)` }} />
                      <div className="relative" style={{ zIndex: 2 }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-black text-white">{selectedBovedaRecord.titulo}</h3>
                            <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].color }}>{VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black" style={{ color: VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].color, textShadow: `0 0 15px ${VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].glow}` }}>{selectedBovedaRecord.bestMinPerUnit.toFixed(1)}</p>
                            <p className="text-[8px] text-slate-500 uppercase">min/unidad</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                            <p className="text-sm font-black" style={{ color: GOLD }}>{selectedBovedaRecord.count}</p>
                            <p className="text-[7px] text-slate-500 uppercase">Ejecuciones</p>
                          </div>
                          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                            <p className="text-sm font-black" style={{ color: EMERALD }}>{selectedBovedaRecord.bestTotalMin}m</p>
                            <p className="text-[7px] text-slate-500 uppercase">Mejor Tiempo</p>
                          </div>
                          <div className="p-2 rounded-lg text-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                            <p className="text-sm font-black" style={{ color: AZURE }}>{new Date(selectedBovedaRecord.bestDate).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</p>
                            <p className="text-[7px] text-slate-500 uppercase">Fecha Récord</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border" style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: `${VOLTAJE_CONFIG[selectedBovedaRecord.voltaje].color}20` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Award size={10} style={{ color: GOLD }} />
                            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: GOLD }}>Certificado por SISTEMICAR</p>
                          </div>
                          <p className="text-[7px] text-slate-500 uppercase tracking-wider">Energía Real Verificada · {new Date(selectedBovedaRecord.bestDate).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                      </div>
                    </div>

                    {selectedBovedaRecord.history.length >= 2 && (
                      <div className="p-4 rounded-xl border" style={{ backgroundColor: PIZARRA, borderColor: `${GOLD}20` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp size={12} style={{ color: GOLD }} />
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD }}>Gráfica de Ascenso</span>
                        </div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedBovedaRecord.history.map((h, i) => ({ name: `#${i + 1}`, valor: Number(h.minPerUnit.toFixed(2)), fecha: new Date(h.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                              <Tooltip contentStyle={{ backgroundColor: PIZARRA, border: `1px solid ${GOLD}30`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: GOLD, fontWeight: 800, fontSize: 10 }} formatter={(value: number) => [`${value} min/u`, "Eficiencia"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.fecha || ""} />
                              <Line type="monotone" dataKey="valor" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: GOLD, stroke: "#fff", strokeWidth: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[8px] text-slate-600 text-center mt-2">Evolución de min/unidad · Línea descendente = mayor eficiencia</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const records = getBovedaRecords();
                      if (records.length === 0) return (
                        <div className="p-8 rounded-xl border text-center" style={{ backgroundColor: PIZARRA, borderColor: `${GOLD}15` }}>
                          <Trophy size={32} className="mx-auto mb-3 opacity-20" style={{ color: GOLD }} />
                          <p className="text-sm text-slate-400">La Bóveda está vacía</p>
                          <p className="text-[10px] text-slate-600 mt-1">Completa misiones de producción o investigación para registrar tus primeros récords</p>
                        </div>
                      );
                      return records.map((record, idx) => {
                        const vConfig = VOLTAJE_CONFIG[record.voltaje];
                        return (
                          <motion.button key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => setSelectedBovedaRecord(record)} className="w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all hover:scale-[1.01]" style={{ backgroundColor: PIZARRA, borderColor: `${vConfig.color}25`, boxShadow: `0 0 10px ${vConfig.glow}` }} data-testid={`boveda-record-${idx}`}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${vConfig.color}15` }}>
                              <Trophy size={16} style={{ color: vConfig.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{record.titulo}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${vConfig.color}15`, color: vConfig.color }}>{vConfig.label}</span>
                                <span className="text-[8px] text-slate-600">{record.count} ejecuciones</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-black" style={{ color: vConfig.color }}>{record.bestMinPerUnit.toFixed(1)}</p>
                              <p className="text-[7px] text-slate-500 uppercase">min/u</p>
                            </div>
                            <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
                          </motion.button>
                        );
                      });
                    })()}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BANNER: AUTO-CARGA DE RUTINA */}
        {rutinaBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border p-3 flex items-center justify-between gap-3"
            style={{ backgroundColor: `${GOLD}10`, borderColor: `${GOLD}40` }}
            data-testid="banner-rutina"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ color: GOLD, fontSize: 16 }}>⚡</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold truncate" style={{ color: GOLD }}>Rutina detectada: {rutinaBanner.nombre}</p>
                <p className="text-[9px]" style={{ color: `${GOLD}80` }}>{rutinaBanner.segmentos.length} segmentos · {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][new Date().getDay()]}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setRutinaBanner(null)} className="px-2 py-1 rounded text-[9px] font-bold" style={{ color: SLATE, backgroundColor: "rgba(255,255,255,0.04)" }}>Omitir</button>
              <button onClick={() => cargarRutina(rutinaBanner)} className="px-3 py-1 rounded text-[9px] font-bold" style={{ backgroundColor: GOLD, color: "#000" }} data-testid="btn-cargar-rutina">Cargar</button>
            </div>
          </motion.div>
        )}

        {/* ACORDEÓN: SEGMENTOS DEL DÍA (Puerta de Atención) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border overflow-hidden" style={{ backgroundColor: PIZARRA, borderColor: `${BLOOD}25` }}>
          <button onClick={() => setExpandedSegId(expandedSegId === "segmentos" ? null : "segmentos")} className="w-full p-4 flex items-center justify-between" data-testid="accordion-segmentos">
            <div className="flex items-center gap-2">
              <Layers size={14} style={{ color: BLOOD }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BLOOD }}>Segmentos del Día</span>
              {planilla && <span className="text-[9px] px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: `${BLOOD}20`, color: BLOOD }}>{planilla.segmentos.length}</span>}
            </div>
            {expandedSegId === "segmentos" ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          <AnimatePresence>
            {expandedSegId === "segmentos" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
                    <div className="flex gap-1.5">
                      <button onClick={() => setShowRutinasPanel(!showRutinasPanel)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors" style={{ backgroundColor: `${GOLD}15`, color: GOLD }} data-testid="btn-rutinas-panel">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Rutinas
                        {plantillasRutina.length > 0 && <span className="text-[8px] px-1 rounded-full" style={{ backgroundColor: `${GOLD}30` }}>{plantillasRutina.length}</span>}
                      </button>
                      {planilla && planilla.segmentos.length > 0 && (
                        <button onClick={() => setShowGuardarRutina(!showGuardarRutina)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: SLATE }} data-testid="btn-guardar-rutina">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          Guardar como rutina
                        </button>
                      )}
                    </div>
                    <button onClick={() => setShowCrearSegmento(!showCrearSegmento)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors" style={{ backgroundColor: `${BLOOD}20`, color: BLOOD }}>
                      <Plus size={12} /> Nuevo Segmento
                    </button>
                  </div>

                  {/* PANEL: GUARDAR COMO RUTINA */}
                  {showGuardarRutina && planilla && planilla.segmentos.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: `${GOLD}08`, borderColor: `${GOLD}30` }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Guardar rutina · {planilla.segmentos.length} segmentos actuales</p>
                      <input value={nuevaRutinaNombre} onChange={e => setNuevaRutinaNombre(e.target.value)} placeholder="Nombre de la rutina (ej: Semana de costura)" className="w-full p-2.5 rounded-lg bg-black/60 border text-white text-xs placeholder:text-slate-600 focus:outline-none" style={{ borderColor: nuevaRutinaNombre ? GOLD : "rgba(255,255,255,0.1)" }} />
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase mb-1.5">Días activos</p>
                        <div className="flex gap-1">
                          {["D","L","M","X","J","V","S"].map((d, i) => (
                            <button key={i} onClick={() => setNuevaRutinaDias(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                              className="w-7 h-7 rounded-full text-[9px] font-black transition-all"
                              style={{ backgroundColor: nuevaRutinaDias.includes(i) ? GOLD : "rgba(255,255,255,0.06)", color: nuevaRutinaDias.includes(i) ? "#000" : SLATE }}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowGuardarRutina(false)} className="flex-1 py-1.5 rounded text-[9px] text-slate-400 bg-white/5">Cancelar</button>
                        <button onClick={guardarComoRutina} disabled={!nuevaRutinaNombre.trim() || nuevaRutinaDias.length === 0} className="flex-1 py-1.5 rounded text-[9px] font-black disabled:opacity-40" style={{ backgroundColor: GOLD, color: "#000" }}>Guardar</button>
                      </div>
                    </motion.div>
                  )}

                  {/* PANEL: GESTIÓN DE RUTINAS */}
                  {showRutinasPanel && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: `${GOLD}20` }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Mis Rutinas</p>
                        {notifPermission !== "granted" && notifPermission !== "unsupported" && (
                          <button onClick={async () => { const ok = await requestNotificationPermission(); setNotifPermission(ok ? "granted" : "denied"); }}
                            className="text-[8px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${VIOLET}20`, color: VIOLET }}>
                            🔔 Activar alertas
                          </button>
                        )}
                        {notifPermission === "granted" && <span className="text-[8px]" style={{ color: EMERALD }}>🔔 Alertas activas</span>}
                      </div>

                      {/* Vista semanal */}
                      <div className="flex gap-0.5 mb-2">
                        {["D","L","M","X","J","V","S"].map((d, i) => {
                          const hoy = new Date().getDay();
                          const matching = plantillasRutina.find(p => p.diasActivos.includes(i));
                          return (
                            <div key={i} className="flex-1 rounded py-1 flex flex-col items-center gap-0.5" style={{ backgroundColor: i === hoy ? `${GOLD}15` : "rgba(255,255,255,0.03)", border: i === hoy ? `1px solid ${GOLD}40` : "1px solid transparent" }}>
                              <span className="text-[8px] font-black" style={{ color: i === hoy ? GOLD : SLATE }}>{d}</span>
                              {matching ? (
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} title={matching.nombre} />
                              ) : (
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {plantillasRutina.length === 0 ? (
                        <p className="text-[9px] text-slate-600 text-center py-1">Sin rutinas guardadas</p>
                      ) : (
                        <div className="space-y-1.5">
                          {plantillasRutina.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold truncate" style={{ color: "#e2e8f0" }}>{r.nombre}</p>
                                <p className="text-[8px]" style={{ color: SLATE }}>
                                  {r.segmentos.length} seg · {["D","L","M","X","J","V","S"].filter((_, i) => r.diasActivos.includes(i)).join(" ")}
                                </p>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button onClick={() => cargarRutina(r)} className="px-2 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: `${GOLD}20`, color: GOLD }} data-testid={`btn-cargar-${r.id}`}>Cargar</button>
                                <button onClick={() => eliminarRutina(r.id)} className="px-2 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: `${BLOOD}15`, color: BLOOD }}>×</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {showCrearSegmento && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderColor: `${BLOOD}30` }}>
                      <input value={nuevoSegNombre} onChange={(e) => setNuevoSegNombre(e.target.value)} placeholder="Nombre del segmento" className="w-full p-3 rounded-lg bg-black/60 border text-white text-sm placeholder:text-slate-600 focus:outline-none" style={{ borderColor: nuevoSegNombre ? BLOOD : "rgba(255,255,255,0.1)" }} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase mb-1 block">Hora Inicio</label>
                          <input type="time" value={nuevoSegHoraInicio} onChange={(e) => setNuevoSegHoraInicio(e.target.value)} className="w-full p-2 rounded-lg bg-black/60 border text-white text-sm focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase mb-1 block">Hora Fin</label>
                          <input type="time" value={nuevoSegHoraFin} onChange={(e) => setNuevoSegHoraFin(e.target.value)} className="w-full p-2 rounded-lg bg-black/60 border text-white text-sm focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase mb-1 block">Color</label>
                        <div className="flex gap-1.5">
                          {SEGMENT_COLORS.map(c => (
                            <button key={c} onClick={() => setNuevoSegColor(c)} className="w-6 h-6 rounded-full transition-all" style={{ backgroundColor: c, border: nuevoSegColor === c ? "2px solid white" : "2px solid transparent", transform: nuevoSegColor === c ? "scale(1.2)" : "scale(1)" }} />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setNuevoSegCentinelaEnabled(v => !v)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold"
                        style={{
                          borderColor: nuevoSegCentinelaEnabled ? `${nuevoSegColor}60` : "rgba(255,255,255,0.1)",
                          backgroundColor: nuevoSegCentinelaEnabled ? `${nuevoSegColor}12` : "rgba(255,255,255,0.03)",
                          color: nuevoSegCentinelaEnabled ? nuevoSegColor : "rgba(255,255,255,0.25)"
                        }}
                        data-testid="toggle-nuevo-seg-centinela"
                      >
                        <Shield size={11} />
                        Centinela {nuevoSegCentinelaEnabled ? "ACTIVO" : "INACTIVO"}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => setShowCrearSegmento(false)} className="flex-1 py-2 rounded-lg text-xs text-slate-400 bg-white/5">Cancelar</button>
                        <button onClick={addSegmento} disabled={!nuevoSegNombre.trim() || !nuevoSegHoraInicio || !nuevoSegHoraFin} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50" style={{ backgroundColor: BLOOD, color: "#fff" }}>Programar</button>
                      </div>
                    </motion.div>
                  )}

                  {planilla && planilla.segmentos.length > 0 ? (
                    <div className="space-y-1.5">
                      {planilla.segmentos.map((seg) => {
                        const isActive = seg.estado === "activo";
                        const isClosed = seg.estado === "cerrado_manual";
                        const isEntropia = seg.estado === "entropia";
                        const nowMinSeg = getCurrentTimeMinutes();
                        const inicioMinSeg = timeStringToMinutes(seg.horaInicio);
                        const activarVentanaAbierta = nowMinSeg >= inicioMinSeg - 5 && nowMinSeg <= inicioMinSeg + 5;
                        const finMinSeg = seg.horaFin ? timeStringToMinutes(seg.horaFin) : null;
                        const cierreVentanaAbierta =
                          finMinSeg == null ? true : nowMinSeg >= finMinSeg - 5 && nowMinSeg <= finMinSeg + 5;
                        return (
                          <div key={seg.id} className="p-3 rounded-xl border transition-all" style={{
                            backgroundColor: isActive ? `${EMERALD}08` : isEntropia ? `${BLOOD}08` : isClosed ? "rgba(100,116,139,0.05)" : "rgba(107,114,128,0.03)",
                            borderColor: isActive ? `${EMERALD}40` : isEntropia ? `${BLOOD}40` : isClosed ? "rgba(100,116,139,0.2)" : "rgba(107,114,128,0.15)"
                          }}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: isActive ? EMERALD : isEntropia ? BLOOD : isClosed ? SLATE : seg.color }} />
                                <div>
                                  <p className="text-xs font-bold" style={{ color: isActive ? EMERALD : isEntropia ? BLOOD : isClosed ? SLATE : "#e2e8f0" }}>{seg.nombre}</p>
                                  <p className="text-[9px] text-slate-600">{seg.horaInicio} - {seg.horaFin}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  {isEntropia && <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: `${BLOOD}20`, color: BLOOD }}>ENTROPÍA</span>}
                                  {isClosed && <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: "rgba(100,116,139,0.2)", color: SLATE }}>CERRADO</span>}
                                  {isActive && cierreVentanaAbierta && (
                                    <button onClick={() => cerrarSegmentoManual(seg.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors" style={{ backgroundColor: `${BLOOD}20`, color: BLOOD }} data-testid={`button-close-segment-${seg.id}`}>
                                      <Square size={10} /> Cerrar (+2 PS)
                                    </button>
                                  )}
                                  {isActive && !cierreVentanaAbierta && seg.horaFin && (
                                    <button type="button" onClick={() => cerrarSegmentoManual(seg.id, { forceOutsideWindow: true })} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors" style={{ backgroundColor: "rgba(100,116,139,0.15)", color: SLATE }} data-testid={`button-force-close-segment-${seg.id}`}>
                                      <Square size={10} /> Forzar cierre (+1 PS)
                                    </button>
                                  )}
                                  {isActive && !cierreVentanaAbierta && seg.horaFin && (
                                    <span className="text-[7px] text-slate-500 text-right max-w-[11rem] leading-tight">
                                      Llave +2 PS: ±5 min de {seg.horaFin}
                                    </span>
                                  )}
                                  {seg.estado === "pendiente" && (
                                    activarVentanaAbierta ? (
                                      <button onClick={() => activarSegmento(seg.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-colors" style={{ backgroundColor: `${EMERALD}20`, color: EMERALD }} data-testid={`button-start-segment-${seg.id}`}>
                                        <Play size={10} /> Activar +2 PS
                                      </button>
                                    ) : (
                                      <div className="flex flex-col items-end gap-0.5 max-w-[10.5rem]">
                                        <span className="text-[7px] text-slate-500 text-right leading-tight">
                                          Activar disponible ±5 min de {seg.horaInicio}
                                        </span>
                                        <span className="text-[8px] px-2 py-0.5 rounded-lg" style={{ color: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.04)" }} title={`Ventana: ${seg.horaInicio} ± 5 min`}>
                                          🔒 Esperando horario
                                        </span>
                                      </div>
                                    )
                                  )}
                                  {seg.psGanados > 0 && <span className="text-[9px] font-black" style={{ color: GOLD }}>+{seg.psGanados} PS</span>}
                                </div>
                              </div>
                            </div>
                            {isActive && seg.eventos.length > 0 && (
                              <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                <p className="text-[8px] text-slate-600 uppercase mb-1">Eventos registrados:</p>
                                <div className="flex flex-wrap gap-1">
                                  {seg.eventos.slice(-5).map((ev, i) => (
                                    <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: SLATE }}>{ev.componente} · {ev.hora}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!isClosed && !isEntropia && (
                              <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                                <button
                                  onClick={async () => {
                                    if (!user || !planilla) return;
                                    const newVal = seg.centinelaEnabled === false ? true : false;
                                    setPlanilla({
                                      ...planilla,
                                      segmentos: planilla.segmentos.map(s =>
                                        s.id === seg.id ? { ...s, centinelaEnabled: newVal } : s
                                      )
                                    });
                                    try {
                                      const updated = await updateSegmentoInPlanilla(user.uid, seg.id, { centinelaEnabled: newVal });
                                      setPlanilla(updated);
                                    } catch {
                                      setPlanilla(planilla);
                                    }
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-all"
                                  style={{
                                    borderColor: seg.centinelaEnabled === false ? "rgba(255,255,255,0.08)" : `${seg.color}40`,
                                    backgroundColor: seg.centinelaEnabled === false ? "rgba(255,255,255,0.03)" : `${seg.color}12`,
                                    color: seg.centinelaEnabled === false ? "rgba(255,255,255,0.3)" : seg.color
                                  }}
                                  data-testid={`toggle-centinela-${seg.id}`}
                                >
                                  <Shield size={13} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-left">
                                    Centinela
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: seg.centinelaEnabled === false ? "rgba(255,255,255,0.06)" : `${seg.color}25`,
                                      color: seg.centinelaEnabled === false ? "rgba(255,255,255,0.25)" : seg.color
                                    }}>
                                    {seg.centinelaEnabled === false ? "INACTIVO" : "ACTIVO"}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={segmentosListEndRef} className="h-0 w-full scroll-mt-4" aria-hidden />
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 text-center py-2">Sin segmentos programados</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ACORDEÓN: LABORATORIO DE CONCIENCIA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border overflow-hidden" style={{ backgroundColor: PIZARRA, borderColor: `${VIOLET}25` }}>
          <button onClick={() => setShowLabConciencia(!showLabConciencia)} className="w-full p-4 flex items-center justify-between" data-testid="accordion-laboratorio">
            <div className="flex items-center gap-2">
              <Brain size={14} style={{ color: VIOLET }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: VIOLET }}>Laboratorio de Conciencia</span>
            </div>
            {showLabConciencia ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          <AnimatePresence>
            {showLabConciencia && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {[
                      { label: "Capa Fatiga", value: currentLayer, color: currentLayer >= 3 ? BLOOD : currentLayer >= 2 ? "#f59e0b" : EMERALD },
                      { label: "Retraso", value: `${currentDelayMinutes}m`, color: currentDelayMinutes > 30 ? BLOOD : EMERALD },
                      { label: "Segmento Activo", value: segmentoActivoMinutes ? `${segmentoActivoMinutes}m` : "—", color: AZURE },
                      { label: "Situaciones", value: recentSituacionCount, color: recentSituacionCount >= 3 ? BLOOD : AZURE }
                    ].map((item, i) => (
                      <div key={i} className="p-2 rounded-lg text-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                        <span className="text-sm font-black" style={{ color: item.color }}>{item.value}</span>
                        <p className="text-[8px] text-slate-500 uppercase">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {currentLayer >= 2 && (
                    <div className="p-3 rounded-xl border" style={{ backgroundColor: `${BLOOD}08`, borderColor: `${BLOOD}30` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={12} style={{ color: BLOOD }} />
                        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: BLOOD }}>
                          {currentLayer >= 4 ? "RENDICIÓN INMINENTE" : currentLayer >= 3 ? "DESCENSO POR MONOTONÍA" : "FRACTURA DE ENFOQUE"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                        {currentLayer >= 4 ? "ALERTA: Registro rendición inminente. Si te detienes, confirmas que tu fatiga es tu dueña."
                          : currentLayer >= 3 ? "Registro descenso por monotonía. Tu voluntad es frágil ante la rutina. El aburrimiento es el filtro de los débiles."
                          : "Detecto una fractura de enfoque. ¿Es un obstáculo más fuerte que tu propósito?"}
                      </p>
                    </div>
                  )}
                  {planilla && planilla.segmentos.filter(s => s.estado === "entropia").length > 0 && (
                    <div className="p-3 rounded-xl border" style={{ backgroundColor: "#1a000010", borderColor: "#7f1d1d" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Lock size={12} style={{ color: "#7f1d1d" }} />
                        <span className="text-[9px] font-black uppercase" style={{ color: "#7f1d1d" }}>SEGMENTOS EN ENTROPÍA: {planilla.segmentos.filter(s => s.estado === "entropia").length}</span>
                      </div>
                      <p className="text-[9px] text-slate-500">Cada entropía = 0 PS. El sistema registra tu omisión.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!isCreating ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">La Flota</p>
                <button
                  onClick={() => {
                    const next = !tikSoundEnabled;
                    setTikSoundEnabled(next);
                    localStorage.setItem("sistemicar_tik_sound", next ? "on" : "off");
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border transition-all"
                  style={{ borderColor: tikSoundEnabled ? `${GOLD}40` : "rgba(255,255,255,0.08)", backgroundColor: tikSoundEnabled ? `${GOLD}10` : "rgba(0,0,0,0.2)" }}
                  title={tikSoundEnabled ? "Silenciar tick del reloj" : "Activar tick del reloj"}
                  data-testid="button-tik-sound-toggle"
                >
                  {tikSoundEnabled ? <Volume2 size={10} style={{ color: GOLD }} /> : <VolumeX size={10} style={{ color: "#475569" }} />}
                  <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: tikSoundEnabled ? GOLD : "#475569" }}>
                    Tick {tikSoundEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FLOTA_CONFIG) as [TipoFlota, typeof FLOTA_CONFIG["tiempo"]][]).map(([tipo, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={tipo} onClick={() => { setIsCreating(true); setVehicleMode("flota"); setTipoFlotaSeleccionado(tipo); }} className="p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-[1.02]" style={{ borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }} data-testid={`button-flota-${tipo}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cfg.color}20` }}>
                        <Icon size={20} style={{ color: cfg.color }} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[9px] text-slate-500 text-center leading-tight">{cfg.sublabel}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>{cfg.relojVisible ? cfg.relojLabel : "Reloj Oculto"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {activeVehicles.length > 0 && (
              <AccordionSection title="VEHÍCULOS ACTIVOS" icon={Zap} color={BLOOD} count={activeVehicles.length}>
                {[...sortedOperativaActivos, ...panoramicaActivos.filter(v => !sortedOperativaActivos.includes(v)), ...activeVehicles.filter(v => !v.tipoTerminoRapido)].filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} onOpenCierreEnergia={(p) => { setCierreEnergiaSeleccion(null); setCierreEnergiaPending(p); }} onComplete={() => { setCierreEnergiaSeleccion(null); setCierreEnergiaPending({ kind: "flota", vehicleId: v.id, status: "cumplido" }); }} onArchive={() => { setCierreEnergiaSeleccion(null); setCierreEnergiaPending({ kind: "flota", vehicleId: v.id, status: "archivado" }); }} onQuickEditEje={(ejeKey, newText, newTrifecta) => handleQuickEditEje(v.id, ejeKey, newText, newTrifecta)} onDetail={() => handleEdit(v)} fatigueLayer={currentLayer} transmutationText={transmutationText} onTransmutationChange={setTransmutationText} showTransmutation={currentLayer >= 3} recentSituacionCount={recentSituacionCount} segmentoActivoMinutes={segmentoActivoMinutes} segmentoNumero={segmentoNumero} planilla={planilla} monitorState={monitorState} onJustificar={handleJustificar} onAddSubTarea={handleAddSubTarea} onToggleSubTarea={handleToggleSubTarea} onSetSubTareaMinutosCupo={handleSetSubTareaMinutosCupo} onExtendSituacionCupo={handleExtendSituacionCupo} onSyncSituacionCupoAnchor={handleSyncSituacionCupoAnchor} onMoveSubTareasToCronometro={handleMoveSubTareasToCronometro} onSituacionCronometroSetHoraFin={handleSituacionCronometroSetHoraFin} onSituacionCronometroCumplido={handleSituacionCronometroCumplido} onSituacionCronometroFallado={handleSituacionCronometroFallado} onQuitarSubTareaDeCronometro={handleQuitarSubTareaDeCronometro} onAddDetalle={handleAddDetalle} onEntregarDetalle={handleEntregarDetalle} arquitectoUnlocked={arquitectoUnlocked} onInvestigadorClose={handleInvestigadorClose} onDesglosadorUpdate={handleDesglosadorUpdate} onDesglosadorGlobalClose={handleDesglosadorGlobalClose} onDescansoClose={handleDescansoClose} onMicroPasoToggle={handleMicroPasoToggle} onEtapaPuntoCeroToggle={handleEtapaPuntoCeroToggle} />
                ))}
              </AccordionSection>
            )}

            {(() => {
              const todayStart = new Date(); todayStart.setHours(0,0,0,0);
              const todayStartMs = todayStart.getTime();
              const vehiculosHoy = completedVehicles.filter(v => !v.autoVerdad && (() => {
                const t = Math.max(v.createdAt?.getTime?.() || 0, v.aperturaAt || 0, v.cierreAt || 0);
                return t >= todayStartMs;
              })());
              const vehiculosAnteriores = completedVehicles.filter(v => !v.autoVerdad && (() => {
                const t = Math.max(v.createdAt?.getTime?.() || 0, v.aperturaAt || 0, v.cierreAt || 0);
                return t > 0 && t < todayStartMs;
              })()).sort((a, b) => {
                const tA = Math.max(a.cierreAt || 0, a.aperturaAt || 0, a.createdAt?.getTime?.() || 0);
                const tB = Math.max(b.cierreAt || 0, b.aperturaAt || 0, b.createdAt?.getTime?.() || 0);
                return tB - tA;
              });
              const gruposPorFecha: Record<string, typeof vehiculosAnteriores> = {};
              vehiculosAnteriores.forEach(v => {
                const ts = Math.max(v.cierreAt || 0, v.aperturaAt || 0, v.createdAt?.getTime?.() || 0);
                const d = new Date(ts);
                const key = `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`;
                if (!gruposPorFecha[key]) gruposPorFecha[key] = [];
                gruposPorFecha[key].push(v);
              });
              if (vehiculosHoy.length === 0 && vehiculosAnteriores.length === 0) return null;
              return (
                <AccordionSection title="HISTORIAL" subtitle="Hoy" icon={Flag} color={SLATE} count={vehiculosHoy.length}>
                  {vehiculosHoy.slice(0, 5).map((v) => (
                    <VehicleCard key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} minimal planilla={planilla} monitorState={monitorState} />
                  ))}
                  {vehiculosAnteriores.length > 0 && (
                    <button
                      onClick={() => setShowHistorialCompleto(p => !p)}
                      className="w-full py-2 mt-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                      style={{ color: showHistorialCompleto ? BLOOD : "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.08)", border: "1px solid" }}
                      data-testid="button-historial-completo"
                    >
                      {showHistorialCompleto ? "▲ Ocultar días anteriores" : `▼ Ver días anteriores (${vehiculosAnteriores.length})`}
                    </button>
                  )}
                  {showHistorialCompleto && Object.entries(gruposPorFecha).map(([fecha, lista]) => (
                    <div key={fecha}>
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                        <span className="text-[9px] font-black tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>{fecha}</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                      </div>
                      {lista.map(v => (
                        <VehicleCard key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} minimal planilla={planilla} monitorState={monitorState} />
                      ))}
                    </div>
                  ))}
                </AccordionSection>
              );
            })()}

            {/* CIERRE DE JORNADA & DEPÓSITO */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowDeposito(!showDeposito)} className="py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: `${AZURE}10`, color: AZURE, border: `1px solid ${AZURE}25` }} data-testid="button-deposito">
                <Zap size={14} /> DEPÓSITO
              </button>
              <button onClick={async () => {
                if (user) {
                  const todayCierre = await getTodayCierreJornada(user.uid);
                  if (todayCierre) {
                    toast.info("Jornada ya sellada", {
                      description: `Sellada hoy con ${todayCierre.totalPS} PS`,
                      style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }
                    });
                    return;
                  }
                }
                setShowCierreJornada(true);
              }} className="py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}25` }} data-testid="button-cierre-jornada">
                <Flag size={14} /> CIERRE DE JORNADA
              </button>
            </div>

            {showDeposito && <DepositoEnergeticoSection vehicles={vehicles} planilla={planilla} />}
          </>
        ) : vehicleMode === "flota" && tipoFlotaSeleccionado ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {(() => {
              const cfg = FLOTA_CONFIG[tipoFlotaSeleccionado];
              const Icon = cfg.icon;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cfg.color}20` }}><Icon size={16} style={{ color: cfg.color }} /></div>
                      <div><span className="text-sm font-black uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span><p className="text-[9px] text-slate-500">{cfg.sublabel}</p></div>
                    </div>
                    <button onClick={resetForm} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X size={16} className="text-slate-500" /></button>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Nombre de la Misión</label>
                    <div className="relative">
                      <input value={titulo} onChange={(e) => { setTitulo(e.target.value); if (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "produccion") setShowTituloProdSuggestions(e.target.value.trim().length >= 2); if (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "desglosador") setShowDesglosadorTitleSuggestions(e.target.value.trim().length >= 2); }} onFocus={() => { if (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "produccion" && titulo.trim().length >= 2) setShowTituloProdSuggestions(true); if (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "desglosador" && titulo.trim().length >= 2) setShowDesglosadorTitleSuggestions(true); }} onBlur={() => setTimeout(() => { setShowTituloProdSuggestions(false); setShowDesglosadorTitleSuggestions(false); }, 150)} placeholder={tipoFlotaSeleccionado === "descanso" ? "Ej: Almuerzo" : tipoFlotaSeleccionado === "verdad" ? "Ej: Momento de sinceridad" : "Ej: Llamar a 3 clientes"} className="w-full p-4 rounded-xl bg-[#0a0a0a] border text-white placeholder:text-slate-600 focus:outline-none text-sm" style={{ borderColor: titulo ? cfg.color : "rgba(255,255,255,0.1)" }} autoFocus data-testid="input-mission-name" />
                      {tipoFlotaSeleccionado === "tiempo" && relojTiempo === "produccion" && showTituloProdSuggestions && (() => {
                        const sugs = getRecordSuggestions(titulo, 5);
                        if (sugs.length === 0) return null;
                        return (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden" style={{ backgroundColor: "#0f0f0f", borderColor: `${cfg.color}40`, boxShadow: `0 4px 20px ${cfg.color}20` }}>
                            {sugs.map((s, i) => {
                              const best = getHistoricalVehicleData(s.titulo).bestMinPerUnit ?? s.minPerUnit;
                              return (
                                <button key={i} onMouseDown={(e) => { e.preventDefault(); setTitulo(s.titulo); setTiempoProduccion(best.toFixed(1)); setShowTituloProdSuggestions(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/5" data-testid={`suggestion-produccion-${i}`}>
                                  <span className="text-sm text-white/90 truncate">{s.titulo}</span>
                                  <span className="text-[10px] font-bold ml-3 shrink-0 font-mono" style={{ color: cfg.color }}>{best.toFixed(1)} MIN/U</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {tipoFlotaSeleccionado === "tiempo" && relojTiempo === "desglosador" && showDesglosadorTitleSuggestions && (() => {
                        const sugs = getDesglosadorMisionData(titulo, 6);
                        if (sugs.length === 0) return null;
                        return (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border overflow-hidden" style={{ backgroundColor: "#0f0f0f", borderColor: `${GOLD}40`, boxShadow: `0 4px 20px ${GOLD}20` }}>
                            {sugs.map((s, i) => (
                              <button key={i} onMouseDown={(e) => { e.preventDefault(); setTitulo(s.titulo); setShowDesglosadorTitleSuggestions(false); }} className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-white/5" data-testid={`suggestion-desglosador-title-${i}`}>
                                <div className="flex items-center gap-2">
                                  <ListTodo size={10} style={{ color: GOLD }} />
                                  <span className="text-sm text-white/90 truncate">{s.titulo}</span>
                                </div>
                                {s.subs.length > 0 && (
                                  <div className="pl-4 flex flex-wrap gap-x-1 items-center mt-0.5">
                                    {s.subs.map((sub, j) => (
                                      <span key={j} className="text-[8px] font-mono whitespace-nowrap" style={{ color: "rgba(212,175,55,0.55)" }}>
                                        {j > 0 && <span style={{ color: "rgba(255,255,255,0.2)" }}>→ </span>}
                                        {sub.nombre}{sub.duracionMin != null ? ` · ${Math.round(sub.duracionMin)}m` : ""}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {titulo.trim().length >= 3 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      {tipoFlotaSeleccionado === "tiempo" && (
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider text-center">Tipo de Reloj</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "proyectivo" as const, label: "Proyectivo", desc: "Hora Fin", icon: Clock, premium: false },
                              { id: "produccion" as const, label: "Producción", desc: "Cant × Tiempo", icon: Target, premium: false },
                              { id: "manual" as const, label: "Manual", desc: "Reloj de Juicio", icon: Timer, premium: false },
                              { id: "investigador" as const, label: "Investigador", desc: "Cantidad · Libre", icon: Activity, premium: false },
                              { id: "desglosador" as const, label: "Desglosador", desc: "Ciclo de Misión", icon: ListTodo, premium: true }
                            ].map(opt => {
                              const isDesglosadorLocked = opt.premium && !desglosadorUnlocked;
                              if (isDesglosadorLocked) {
                                return (
                                  <div key={opt.id} className="relative">
                                    <button
                                      onClick={() => setShowDesglosadorCTA(v => !v)}
                                      className="w-full p-3 rounded-xl border text-center transition-all relative overflow-hidden"
                                      style={{ borderColor: `${GOLD}40`, backgroundColor: "rgba(212,175,55,0.04)", cursor: "pointer" }}
                                      data-testid={`button-reloj-${opt.id}-locked`}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
                                        <div className="flex flex-col items-center gap-0.5">
                                          <Lock size={12} style={{ color: "#D4AF37" }} />
                                          <span className="text-[6px] font-black uppercase tracking-widest" style={{ color: "#D4AF37" }}>Plan Operativo</span>
                                        </div>
                                      </div>
                                      <opt.icon size={14} className="mx-auto mb-1 opacity-30" style={{ color: "#6b7280" }} />
                                      <span className="text-[9px] font-bold block opacity-30" style={{ color: "#6b7280" }}>{opt.label}</span>
                                      <span className="text-[8px] text-slate-700">{opt.desc}</span>
                                    </button>
                                    {showDesglosadorCTA && (
                                      <div
                                        className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 rounded-xl border p-3 shadow-xl text-center"
                                        style={{ backgroundColor: "#0A0A0A", borderColor: `${GOLD}60` }}
                                      >
                                        <p className="text-[9px] text-slate-400 mb-2">Requiere Plan<br /><span className="font-black" style={{ color: GOLD }}>Soberano Operativo</span></p>
                                        <button
                                          onClick={() => { setShowDesglosadorCTA(false); navigate("/pagos"); }}
                                          className="w-full py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-black transition-all"
                                          style={{ background: GOLD }}
                                          data-testid="button-desglosador-unlock-cta"
                                        >
                                          Desbloquear → Ver planes
                                        </button>
                                        <button
                                          onClick={() => setShowDesglosadorCTA(false)}
                                          className="mt-1 text-[8px] text-slate-600 hover:text-slate-400"
                                        >
                                          Cerrar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <button key={opt.id} onClick={() => setRelojTiempo(opt.id)} className="p-3 rounded-xl border text-center transition-all" style={{ borderColor: relojTiempo === opt.id ? cfg.color : "rgba(255,255,255,0.1)", backgroundColor: relojTiempo === opt.id ? `${cfg.color}10` : "transparent" }} data-testid={`button-reloj-${opt.id}`}>
                                  <opt.icon size={14} className="mx-auto mb-1" style={{ color: relojTiempo === opt.id ? cfg.color : "#6b7280" }} />
                                  <span className="text-[9px] font-bold block" style={{ color: relojTiempo === opt.id ? cfg.color : "#6b7280" }}>{opt.label}</span>
                                  <span className="text-[8px] text-slate-600">{opt.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                          {relojTiempo === "proyectivo" && (
                            <div className="p-3 rounded-xl border" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}30` }}>
                              <label className="text-[9px] text-slate-400 uppercase mb-2 block">Hora de Fin</label>
                              <input type="time" value={horaFinProyectiva} onChange={(e) => setHoraFinProyectiva(e.target.value)} className="w-full bg-black/30 text-white text-sm p-3 rounded-lg border border-white/10 focus:outline-none" data-testid="input-hora-fin" />
                            </div>
                          )}
                          {relojTiempo === "produccion" && (
                            <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}30` }}>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase mb-1 block">Cantidad</label>
                                  <input type="number" value={cantidadProduccion} onChange={(e) => setCantidadProduccion(e.target.value)} placeholder="Ej: 5" className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:outline-none" data-testid="input-cantidad" />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase mb-1 block">Min/unidad</label>
                                  <input type="number" value={tiempoProduccion} onChange={(e) => setTiempoProduccion(e.target.value)} placeholder={(() => { if (titulo.trim().length >= 3) { const h = getHistoricalVehicleData(titulo.trim()); if (h.bestMinPerUnit) return `Mejor: ${h.bestMinPerUnit.toFixed(1)}`; } return "Ej: 10"; })()} className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/10 focus:outline-none" data-testid="input-tiempo-produccion" />
                                </div>
                              </div>
                              {cantidadProduccion && tiempoProduccion && Number(cantidadProduccion) > 0 && Number(tiempoProduccion) > 0 && (() => {
                                const totalMin = Number(cantidadProduccion) * Number(tiempoProduccion);
                                const now = new Date();
                                const target = new Date(now.getTime() + totalMin * 60000);
                                const horaObj = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
                                const horas = Math.floor(totalMin / 60);
                                const mins = totalMin % 60;
                                const duracionStr = horas > 0 ? `${horas}h ${mins}min` : `${mins} min`;
                                return (
                                  <div className="mt-2 p-3 rounded-xl text-center" style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}>
                                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>Hora Objetivo Calculada</p>
                                    <p className="text-2xl font-black tracking-wider" style={{ color: cfg.color, fontFamily: "JetBrains Mono, monospace", textShadow: `0 0 15px ${cfg.color}40` }}>{horaObj}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{cantidadProduccion} × {tiempoProduccion} min = <span className="font-bold text-white">{duracionStr}</span></p>
                                  </div>
                                );
                              })()}
                              {titulo.trim().length >= 3 && (() => {
                                const hist = getHistoricalVehicleData(titulo.trim());
                                if (hist.count === 0) return null;
                                const bestTime = hist.bestMinPerUnit!;
                                const tiempoActual = Number(tiempoProduccion);
                                const isOverride = tiempoActual > 0 && tiempoActual > bestTime;
                                return (
                                  <div className="mt-2 p-3 rounded-xl border space-y-2" style={{ backgroundColor: isOverride ? "rgba(239,68,68,0.05)" : `${GOLD}08`, borderColor: isOverride ? "rgba(239,68,68,0.3)" : `${GOLD}30` }}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Trophy size={12} style={{ color: GOLD }} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>Tu Récord ({hist.count}x)</span>
                                      </div>
                                      <span className="text-lg font-black" style={{ color: GOLD, fontFamily: "JetBrains Mono, monospace" }}>{bestTime.toFixed(1)}</span>
                                    </div>
                                    <button onClick={() => setTiempoProduccion(bestTime.toFixed(1))} className="w-full py-2.5 rounded-lg text-[10px] font-bold transition-all" style={{ backgroundColor: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }} data-testid="button-use-best-time">
                                      Usar mi récord: {bestTime.toFixed(1)} min/u
                                    </button>
                                    {isOverride && (
                                      <p className="text-[9px] text-red-400/70 text-center italic">Pusiste {tiempoActual} min/u — mayor que tu récord. Dato registrado.</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          {relojTiempo === "investigador" && (
                            <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}30` }}>
                              <label className="text-[9px] text-slate-400 uppercase mb-1 block">¿Cuántas unidades completarás?</label>
                              <input type="number" value={cantidadInvestigador} onChange={(e) => setCantidadInvestigador(e.target.value)} placeholder="Ej: 10" className="w-full bg-black/30 text-white text-sm p-3 rounded-lg border border-white/10 focus:outline-none" data-testid="input-cantidad-investigador" />
                              {cantidadInvestigador && Number(cantidadInvestigador) > 0 && (
                                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}>
                                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>MODO INVESTIGADOR</p>
                                  <p className="text-lg font-black" style={{ color: cfg.color, fontFamily: "JetBrains Mono, monospace" }}>{cantidadInvestigador} unidades</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Cronómetro libre · Se medirá tu ritmo real</p>
                                </div>
                              )}
                              {titulo.trim().length >= 3 && (() => {
                                const hist = getHistoricalVehicleData(titulo.trim());
                                if (hist.count === 0) return null;
                                return (
                                  <div className="mt-2 p-2 rounded-lg border" style={{ backgroundColor: "rgba(96,165,250,0.05)", borderColor: "rgba(96,165,250,0.2)" }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Activity size={10} className="text-blue-400" />
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-blue-400">Dato anterior ({hist.count}x)</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Última vez: <span className="font-bold text-white">{(hist.lastMinPerUnit! * 60).toFixed(0)} seg/unidad</span></p>
                                    {hist.bestMinPerUnit && hist.bestMinPerUnit !== hist.lastMinPerUnit && (
                                      <p className="text-[10px] text-slate-400">Mejor registro: <span className="font-bold text-emerald-400">{(hist.bestMinPerUnit * 60).toFixed(0)} seg/unidad</span></p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          {relojTiempo === "desglosador" && (
                            <div className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}30`, borderStyle: "dashed" }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ListTodo size={11} style={{ color: cfg.color }} />
                                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>Plan de Ataque</span>
                                </div>
                                <span className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, opacity: 0.7 }}>Planificación</span>
                              </div>
                              <p className="text-[8px] text-slate-500 leading-snug">
                                Resistencia de profundidad: <span className="font-bold" style={{ color: cfg.color }}>+5 PS por cada hora completa</span> de referencia (cantidad × récord min/unidad en cada sub-tarea al activarla). Menos de 1 h de referencia → 0 PS.
                              </p>

                              {/* Secuencia histórica */}
                              {historialSubs.length > 0 && sugerenciasIA.length === 0 && (
                                <div className="rounded-lg border p-2.5 space-y-2" style={{ borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}06` }}>
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={9} style={{ color: cfg.color }} />
                                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>Tu secuencia habitual</span>
                                  </div>
                                  <ol className="space-y-0.5">
                                    {historialSubs.map((s, i) => (
                                      <li key={i} className="text-[9px] text-slate-400 flex items-center gap-1">
                                        <span className="text-[8px] font-bold" style={{ color: cfg.color }}>{i + 1}.</span> {s}
                                      </li>
                                    ))}
                                  </ol>
                                  <button
                                    onClick={() => {
                                      const newSubs = historialSubs.map((s, i) => ({ tempId: `hist_${i}_${Date.now()}`, titulo: s, cantidadObjetivo: "" }));
                                      setDesglosadorSubs(newSubs.length > 0 ? newSubs : [{ tempId: "sub_0", titulo: "", cantidadObjetivo: "" }]);
                                    }}
                                    className="w-full py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 transition-all"
                                    style={{ backgroundColor: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}50` }}
                                    data-testid="button-usar-secuencia-historica"
                                  >
                                    <Clock size={10} /> Usar esta secuencia
                                  </button>
                                </div>
                              )}

                              {/* Sugerencias IA */}
                              {sugerenciasIA.length > 0 && (
                                <div className="rounded-lg border p-2.5 space-y-2" style={{ borderColor: "#00FFC330", backgroundColor: "#00FFC308" }}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles size={9} style={{ color: "#00FFC3" }} />
                                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#00FFC3" }}>Sugerencias IA</span>
                                    </div>
                                    <button onClick={() => { setSugerenciasIA([]); setSugerenciasIASeleccionadas(new Set()); }} className="text-[8px] text-slate-500 hover:text-slate-300" data-testid="button-cerrar-sugerencias-ia">✕</button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sugerenciasIA.map((s, i) => {
                                      const selected = sugerenciasIASeleccionadas.has(s);
                                      return (
                                        <button
                                          key={i}
                                          onClick={() => setSugerenciasIASeleccionadas(prev => {
                                            const next = new Set(prev);
                                            if (next.has(s)) next.delete(s); else next.add(s);
                                            return next;
                                          })}
                                          className="px-2 py-1 rounded-md text-[9px] font-bold border transition-all"
                                          style={{
                                            borderColor: selected ? "#00FFC3" : "#00FFC330",
                                            backgroundColor: selected ? "#00FFC315" : "transparent",
                                            color: selected ? "#00FFC3" : "#6b7280"
                                          }}
                                          data-testid={`chip-sugerencia-ia-${i}`}
                                        >
                                          {s}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {desglosadorSubs.some(s => s.titulo.trim()) && (
                                    <p className="text-[8px] text-slate-500">Se añadirán al final de tu lista actual.</p>
                                  )}
                                  <button
                                    onClick={() => {
                                      const toAdd = sugerenciasIA.filter(s => sugerenciasIASeleccionadas.has(s));
                                      if (toAdd.length === 0) return;
                                      const existingWithText = desglosadorSubs.filter(s => s.titulo.trim());
                                      const newFromIA = toAdd.map((s, i) => ({ tempId: `ia_${i}_${Date.now()}`, titulo: s, cantidadObjetivo: "" }));
                                      const combined = [...existingWithText, ...newFromIA];
                                      setDesglosadorSubs(combined.length > 0 ? combined : [{ tempId: "sub_0", titulo: "", cantidadObjetivo: "" }]);
                                      setSugerenciasIA([]);
                                      setSugerenciasIASeleccionadas(new Set());
                                    }}
                                    disabled={sugerenciasIASeleccionadas.size === 0}
                                    className="w-full py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                                    style={{ backgroundColor: "#00FFC320", color: "#00FFC3", border: "1px solid #00FFC350" }}
                                    data-testid="button-aplicar-sugerencias-ia"
                                  >
                                    <CheckCircle2 size={10} /> Aplicar selección ({sugerenciasIASeleccionadas.size})
                                  </button>
                                </div>
                              )}

                              <div className="space-y-2">
                                {desglosadorSubs.map((sv, idx) => (
                                  <div key={sv.tempId} className="flex items-center gap-1.5">
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        onClick={() => {
                                          if (idx === 0) return;
                                          setDesglosadorSubs(prev => {
                                            const next = [...prev];
                                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                            return next;
                                          });
                                        }}
                                        disabled={idx === 0}
                                        className="p-0.5 rounded disabled:opacity-20 hover:bg-white/10 transition-colors"
                                        style={{ color: cfg.color }}
                                        data-testid={`button-sub-up-${idx}`}
                                      >
                                        <ChevronUp size={10} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (idx === desglosadorSubs.length - 1) return;
                                          setDesglosadorSubs(prev => {
                                            const next = [...prev];
                                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                            return next;
                                          });
                                        }}
                                        disabled={idx === desglosadorSubs.length - 1}
                                        className="p-0.5 rounded disabled:opacity-20 hover:bg-white/10 transition-colors"
                                        style={{ color: cfg.color }}
                                        data-testid={`button-sub-down-${idx}`}
                                      >
                                        <ChevronDown size={10} />
                                      </button>
                                    </div>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-black" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>{idx + 1}</div>
                                    <div className="flex-1 relative">
                                      <input
                                        value={sv.titulo}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setDesglosadorSubs(prev => prev.map(s => s.tempId === sv.tempId ? { ...s, titulo: val, tiempoRecordMinPerUnit: undefined } : s));
                                          if (val.trim().length >= 2) setActiveSubSuggestionIdx(idx);
                                          else setActiveSubSuggestionIdx(null);
                                        }}
                                        onFocus={() => { if (sv.titulo.trim().length >= 2) setActiveSubSuggestionIdx(idx); }}
                                        onBlur={() => {
                                          // Auto-cargar récord histórico sin requerir clic en dropdown
                                          if (sv.titulo.trim().length >= 2 && !sv.tiempoRecordMinPerUnit) {
                                            const sug = getSubVehicleRecordSuggestions(sv.titulo);
                                            if (sug.length > 0) {
                                              const exact = sug.find(s => s.titulo.toLowerCase() === sv.titulo.trim().toLowerCase());
                                              const match = exact ?? sug[0];
                                              const record = getHistoricalVehicleData(match.titulo).bestMinPerUnit ?? match.minPerUnit;
                                              if (record > 0) {
                                                setDesglosadorSubs(prev => prev.map(s => s.tempId === sv.tempId ? { ...s, tiempoRecordMinPerUnit: record } : s));
                                              }
                                            }
                                          }
                                          setTimeout(() => setActiveSubSuggestionIdx(null), 150);
                                        }}
                                        placeholder={`Sub-tarea ${idx + 1}...`}
                                        className="w-full bg-black/30 text-white text-xs p-2 rounded-lg border border-white/10 focus:outline-none"
                                        data-testid={`input-desglosador-sub-${idx}`}
                                      />
                                      {activeSubSuggestionIdx === idx && (() => {
                                        const sug = getSubVehicleRecordSuggestions(sv.titulo);
                                        if (sug.length === 0) return null;
                                        return (
                                          <div className="absolute left-0 right-0 top-full mt-0.5 rounded-lg border overflow-hidden z-50" style={{ backgroundColor: "#0f0f0f", borderColor: `${cfg.color}40`, boxShadow: `0 4px 20px rgba(0,0,0,0.8)` }}>
                                            {sug.map((s, si) => (
                                              <button
                                                key={si}
                                                onMouseDown={e => {
                                                  e.preventDefault();
                                                  const best = s.minPerUnit;
                                                  setDesglosadorSubs(prev => prev.map(sub => sub.tempId === sv.tempId
                                                    ? { ...sub, titulo: s.titulo, cantidadObjetivo: "", tiempoRecordMinPerUnit: best > 0 ? best : undefined }
                                                    : sub
                                                  ));
                                                  setActiveSubSuggestionIdx(null);
                                                }}
                                                onTouchStart={e => {
                                                  e.preventDefault();
                                                  const best = s.minPerUnit;
                                                  setDesglosadorSubs(prev => prev.map(sub => sub.tempId === sv.tempId
                                                    ? { ...sub, titulo: s.titulo, cantidadObjetivo: "", tiempoRecordMinPerUnit: best > 0 ? best : undefined }
                                                    : sub
                                                  ));
                                                  setActiveSubSuggestionIdx(null);
                                                }}
                                                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left transition-colors hover:bg-white/5"
                                                data-testid={`suggestion-sub-${idx}-${si}`}
                                              >
                                                <span className="text-[10px] text-white truncate mr-2">{s.titulo}</span>
                                                <span className="text-[9px] font-black flex-shrink-0" style={{ color: cfg.color }}>{s.minPerUnit.toFixed(1)} MIN/U</span>
                                              </button>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                      {sv.tiempoRecordMinPerUnit && sv.tiempoRecordMinPerUnit > 0 && (
                                        <p className="text-[8px] mt-0.5 px-1" style={{ color: cfg.color }}>
                                          Récord: {sv.tiempoRecordMinPerUnit.toFixed(1)} MIN/U — escribe cuántas unidades
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                      <input
                                        type="number"
                                        value={sv.cantidadObjetivo}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setDesglosadorSubs(prev => prev.map(s => {
                                            if (s.tempId !== sv.tempId) return s;
                                            // Si aún no hay récord cargado, intentar cargarlo ahora (más confiable que onBlur en móvil)
                                            let record = s.tiempoRecordMinPerUnit;
                                            if (!record && s.titulo.trim().length >= 2) {
                                              const sug = getSubVehicleRecordSuggestions(s.titulo);
                                              if (sug.length > 0) {
                                                const exact = sug.find(x => x.titulo.toLowerCase() === s.titulo.trim().toLowerCase());
                                                const match = exact ?? sug[0];
                                                const best = match.minPerUnit;
                                                if (best > 0) record = best;
                                              }
                                            }
                                            return { ...s, cantidadObjetivo: val, tiempoRecordMinPerUnit: record };
                                          }));
                                        }}
                                        placeholder="Cant."
                                        className="w-14 bg-black/30 text-white text-xs p-2 rounded-lg border border-white/10 focus:outline-none text-center"
                                        data-testid={`input-desglosador-cant-${idx}`}
                                      />
                                      {sv.tiempoRecordMinPerUnit && sv.tiempoRecordMinPerUnit > 0 && sv.cantidadObjetivo && parseFloat(sv.cantidadObjetivo) > 0 && (
                                        <span className="text-[8px] font-mono" style={{ color: "#D4AF37" }}>
                                          ≈{Math.round(parseFloat(sv.cantidadObjetivo) * sv.tiempoRecordMinPerUnit)}m
                                        </span>
                                      )}
                                    </div>
                                    {desglosadorSubs.length > 1 && (
                                      <button onClick={() => setDesglosadorSubs(prev => prev.filter(s => s.tempId !== sv.tempId))} className="p-1 rounded" style={{ color: "#ef4444" }} data-testid={`button-remove-sub-${idx}`}>
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {(() => {
                                const totalMin = desglosadorSubs.reduce((acc, s) => {
                                  if (s.tiempoRecordMinPerUnit && s.tiempoRecordMinPerUnit > 0 && s.cantidadObjetivo && parseFloat(s.cantidadObjetivo) > 0) {
                                    return acc + Math.round(parseFloat(s.cantidadObjetivo) * s.tiempoRecordMinPerUnit);
                                  }
                                  return acc;
                                }, 0);
                                if (totalMin <= 0) return null;
                                const finDate = new Date(Date.now() + totalMin * 60000);
                                const finStr = finDate.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true });
                                return (
                                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg mt-1" style={{ backgroundColor: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)" }}>
                                    <span className="text-[8px] font-mono" style={{ color: "#D4AF37" }}>TOTAL ESTIMADO</span>
                                    <span className="text-[9px] font-black font-mono" style={{ color: "#D4AF37" }}>{totalMin} min · Fin ≈ {finStr}</span>
                                  </div>
                                );
                              })()}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDesglosadorSubs(prev => [...prev, { tempId: `sub_${Date.now()}`, titulo: "", cantidadObjetivo: "" }])}
                                  className="flex-1 py-2 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all"
                                  style={{ backgroundColor: `${cfg.color}10`, color: cfg.color, border: `1px dashed ${cfg.color}40` }}
                                  data-testid="button-add-sub"
                                >
                                  <PlusCircle size={11} /> Agregar sub-tarea
                                </button>
                                {titulo.trim().length >= 3 && sugerenciasIA.length === 0 && (
                                  <button
                                    onClick={async () => {
                                      setSugerenciasIALoading(true);
                                      try {
                                        const res = await fetch("/api/desglosador-sugerir", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ titulo: titulo.trim(), historico: historialSubs })
                                        });
                                        const data = await res.json();
                                        const sug: string[] = Array.isArray(data.sugerencias) ? data.sugerencias : [];
                                        setSugerenciasIA(sug);
                                        setSugerenciasIASeleccionadas(new Set(sug));
                                      } catch {
                                        toast.error("No se pudo contactar al servicio IA.");
                                      } finally {
                                        setSugerenciasIALoading(false);
                                      }
                                    }}
                                    disabled={sugerenciasIALoading}
                                    className="py-2 px-3 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 whitespace-nowrap"
                                    style={{ backgroundColor: "#00FFC310", color: "#00FFC3", border: "1px solid #00FFC330" }}
                                    data-testid="button-sugerir-ia-desglosador"
                                  >
                                    {sugerenciasIALoading ? (
                                      <span className="inline-block w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00FFC3", borderTopColor: "transparent" }} />
                                    ) : (
                                      <Sparkles size={10} />
                                    )}
                                    Sugerir IA
                                  </button>
                                )}
                              </div>
                              <p className="text-[8px] text-slate-600 text-center">El "Cant." va al Récord de Producción al cerrar</p>
                            </div>
                          )}
                        </div>
                      )}

                      {tipoFlotaSeleccionado === "situacion" && (
                        <div className="p-3 rounded-xl border" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}30` }}>
                          <label className="text-[9px] text-slate-400 uppercase mb-2 block">¿Qué circunstancia marca el fin?</label>
                          <input value={terminoDetalle} onChange={(e) => setTerminoDetalle(e.target.value)} placeholder="Ej: Cuando complete 3 llamadas..." className="w-full bg-black/30 text-white text-sm p-3 rounded-lg border border-white/10 focus:outline-none" data-testid="input-situacion-detalle" />
                        </div>
                      )}

                      {tipoFlotaSeleccionado === "descanso" && (() => {
                        const TIPO_DESCANSO_CONFIG = {
                          intercepcion: { label: "INTERCEPCIÓN", sublabel: "Pausa técnica", rango: "5–15 min", default: "10", color: CYAN, Icon: Zap, ps: 3 },
                          microcarga: { label: "MICRO-CARGA", sublabel: "Siesta activa", rango: "15–45 min", default: "20", color: "#10b981", Icon: Battery, ps: 5 },
                          reset_profundo: { label: "RESET PROFUNDO", sublabel: "Dormir / restablecer", rango: "45+ min", default: "60", color: "#8B5CF6", Icon: Moon, ps: 8 },
                          punto_cero: { label: "PUNTO CERO", sublabel: "Polo Neutro", rango: "10–30 min", default: "20", color: "#D4AF37", Icon: Circle, ps: 12 },
                        } as const;
                        const tipoActivo = tipoDescanso || null;
                        const colorActivo = tipoActivo ? TIPO_DESCANSO_CONFIG[tipoActivo].color : VERDE;
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              {(Object.entries(TIPO_DESCANSO_CONFIG) as ["intercepcion" | "microcarga" | "reset_profundo" | "punto_cero", typeof TIPO_DESCANSO_CONFIG["intercepcion"]][]).map(([key, conf]) => {
                                const active = tipoActivo === key;
                                const isPuntoCero = key === "punto_cero";
                                if (isPuntoCero && !puntoCeroUnlocked) return null;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setTipoDescanso(key); setDuracionDescansoH(""); setDuracionDescansoM(conf.default); }}
                                    className="p-2 rounded-xl border text-center transition-all"
                                    style={{ backgroundColor: active ? `${conf.color}15` : "rgba(255,255,255,0.03)", borderColor: active ? conf.color : "rgba(255,255,255,0.1)", boxShadow: active ? `0 0 12px ${conf.color}30` : "none" }}
                                    data-testid={`button-tipo-descanso-${key}`}
                                  >
                                    <conf.Icon size={14} style={{ color: active ? conf.color : "#64748b", margin: "0 auto 4px" }} />
                                    <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: active ? conf.color : "#64748b" }}>{conf.label}</p>
                                    <p className="text-[7px] text-slate-500 mt-0.5">{conf.rango}</p>
                                    <p className="text-[7px] font-bold mt-1" style={{ color: active ? conf.color : "#475569" }}>+{conf.ps} PS</p>
                                  </button>
                                );
                              })}
                            </div>
                            {tipoActivo && (
                              <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: `${colorActivo}08`, borderColor: `${colorActivo}30` }}>
                                <label className="text-[9px] uppercase tracking-wider mb-1 block" style={{ color: colorActivo }}>Duración</label>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 flex-1">
                                    <input type="number" min="0" max="23" value={duracionDescansoH} onChange={e => setDuracionDescansoH(e.target.value)} placeholder="0" className="w-full bg-black/30 text-white text-sm p-3 rounded-lg border border-white/10 focus:outline-none text-center" data-testid="input-descanso-horas" />
                                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: colorActivo }}>h</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-1">
                                    <input type="number" min="0" max="59" value={duracionDescansoM} onChange={e => setDuracionDescansoM(e.target.value)} placeholder={TIPO_DESCANSO_CONFIG[tipoActivo].default} className="w-full bg-black/30 text-white text-sm p-3 rounded-lg border border-white/10 focus:outline-none text-center" data-testid="input-descanso-duracion" />
                                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: colorActivo }}>min</span>
                                  </div>
                                </div>
                                {((Number(duracionDescansoH) || 0) * 60 + (Number(duracionDescansoM) || 0)) > 0 && (() => {
                                  const totalMin = (Number(duracionDescansoH) || 0) * 60 + (Number(duracionDescansoM) || 0);
                                  const now = new Date();
                                  const target = new Date(now.getTime() + totalMin * 60000);
                                  const tolerancia = new Date(now.getTime() + (totalMin + 5) * 60000);
                                  const fmtH = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                  return (
                                    <div className="p-3 rounded-xl text-center" style={{ backgroundColor: `${colorActivo}10`, border: `1px solid ${colorActivo}30` }}>
                                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: colorActivo }}>Recarga hasta</p>
                                      <p className="text-xl font-black" style={{ color: colorActivo, fontFamily: "JetBrains Mono, monospace" }}>{fmtH(target)}</p>
                                      <p className="text-[9px] text-slate-500 mt-1">Tolerancia hasta {fmtH(tolerancia)} (+5 min)</p>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {isNearDescanso() && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-xl border-2" style={{ backgroundColor: `${NARANJA}10`, borderColor: NARANJA }}>
                          <div className="flex items-center gap-2">
                            <Flame size={14} style={{ color: NARANJA }} />
                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: NARANJA }}>VOLUNTAD SOBRE EL HORARIO</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">Inicias cerca de un descanso programado. +10 PS de Temple.</p>
                        </motion.div>
                      )}

                      <div className="p-3 rounded-xl text-center" style={{ backgroundColor: `${cfg.color}08`, border: `1px solid ${cfg.color}30` }}>
                        <span className="text-xs font-black" style={{ color: cfg.color }}>{cfg.psCierre}</span>
                        <p className="text-[8px] text-slate-500 mt-1">{cfg.relojVisible ? `Reloj visible: ${cfg.relojLabel}` : tipoFlotaSeleccionado === "descanso" ? "Reloj opcional · Activable durante la recarga" : "Reloj oculto · No aplica en este modo"}</p>
                      </div>

                      <div className="p-3 rounded-xl border" style={{ backgroundColor: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-2.5">¿Con qué energía entras?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {ENERGIA_ESPEJO_OPTIONS.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setIntensidadEnergetica(prev => prev === opt.id ? null : opt.id)}
                              className="py-2.5 rounded-lg flex flex-col items-center gap-0.5 transition-all"
                              style={{
                                backgroundColor: intensidadEnergetica === opt.id ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${intensidadEnergetica === opt.id ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.07)"}`,
                                color: intensidadEnergetica === opt.id ? "#8B5CF6" : "#555"
                              }}
                              data-testid={`button-intensidad-${opt.id}`}
                            >
                              <span className="text-sm leading-none">{opt.icon}</span>
                              <span className="text-[8px] font-black uppercase tracking-wider mt-1">{opt.label}</span>
                              <span className="text-[7px] opacity-60 mt-0.5">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                        {!intensidadEnergetica && (
                          <p className="text-[7px] text-slate-600 text-center mt-1.5">Opcional · Alimenta el Espejo</p>
                        )}
                      </div>

                      <button onClick={handleFlotaSave} disabled={saving || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "proyectivo" && !horaFinProyectiva) || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "produccion" && (!cantidadProduccion || !tiempoProduccion)) || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "investigador" && !cantidadInvestigador) || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "desglosador" && !desglosadorSubs.some(s => s.titulo.trim())) || (tipoFlotaSeleccionado === "situacion" && !terminoDetalle.trim()) || (tipoFlotaSeleccionado === "descanso" && !tipoDescanso)} className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50" style={{ backgroundColor: cfg.color, color: tipoFlotaSeleccionado === "verdad" ? "#fff" : "#000", boxShadow: `0 0 20px ${cfg.color}40` }} data-testid="button-launch-flota">
                        Lanzar Vehículo
                      </button>
                    </motion.div>
                  )}
                  <button onClick={resetForm} className="w-full py-2 text-xs text-slate-500 hover:text-slate-400">Cancelar</button>
                </>
              );
            })()}
          </motion.div>
        ) : vehicleMode === "express" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Zap size={20} style={{ color: BLOOD }} /><span className="text-sm font-bold" style={{ color: BLOOD }}>VEHÍCULO EXPRESS</span></div>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X size={16} className="text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Nombre de la Misión</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Llamar a 3 clientes" className="w-full p-4 rounded-xl bg-[#0a0a0a] border text-white placeholder:text-slate-600 focus:outline-none text-sm" style={{ borderColor: titulo ? BLOOD : "rgba(255,255,255,0.1)" }} autoFocus data-testid="input-mission-name" />
              </div>
              {titulo.trim().length >= 3 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <p className="text-xs text-slate-400 text-center">¿Cómo medirás el término?</p>
                  {!selectedTerminoType ? (
                    <>
                      {TERMINO_OPTIONS.map((opt) => (
                        <button key={opt.id} onClick={() => { if (opt.id === "omitido") { handleQuickSaveAndNew(opt.id); } else { setSelectedTerminoType(opt.id); setTerminoDetalle(""); } }} className="w-full p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01]" style={{ borderColor: `${opt.color}40`, backgroundColor: `${opt.color}08` }} data-testid={`button-termino-${opt.id}`}>
                          <div className="text-left">
                            <div className="flex items-center gap-2" style={{ color: opt.color }}>
                              {opt.id === "hora" && <Clock size={14} />}
                              {opt.id === "situacion" && <Flag size={14} />}
                              {opt.id === "omitido" && <X size={14} />}
                              <span>{opt.label}</span>
                            </div>
                            <span className="text-[10px] opacity-70" style={{ color: opt.color }}>{opt.sublabel}</span>
                          </div>
                          <div className="text-right" style={{ color: opt.color }}>
                            <span className="text-xs font-black">+{opt.puntosCumple} PS</span>
                            <div className="text-[9px] opacity-60">({opt.puntosNoCumple} si no cumple)</div>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="p-4 rounded-xl border" style={{ backgroundColor: selectedTerminoType === "hora" ? `${GOLD}08` : `${AZURE}08`, borderColor: selectedTerminoType === "hora" ? `${GOLD}40` : `${AZURE}40` }}>
                        <div className="flex items-center gap-2 mb-3">
                          {selectedTerminoType === "hora" ? <Clock size={16} style={{ color: GOLD }} /> : <Flag size={16} style={{ color: AZURE }} />}
                          <span className="text-sm font-bold" style={{ color: selectedTerminoType === "hora" ? GOLD : AZURE }}>{selectedTerminoType === "hora" ? "¿A qué hora termina?" : "¿Qué circunstancia marca el fin?"}</span>
                        </div>
                        <input type={selectedTerminoType === "hora" ? "time" : "text"} value={terminoDetalle} onChange={(e) => setTerminoDetalle(e.target.value)} placeholder={selectedTerminoType === "hora" ? "" : "Ej: Cuando complete 3 llamadas..."} className="w-full bg-black/30 text-white text-sm p-3 rounded-lg border border-white/10 focus:outline-none focus:border-white/30" autoFocus data-testid="input-termino-detalle" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedTerminoType(null); setTerminoDetalle(""); }} className="flex-1 py-3 rounded-xl text-sm text-slate-400 bg-white/5">Atrás</button>
                        <button onClick={() => handleQuickSaveAndNew(selectedTerminoType, terminoDetalle)} disabled={saving || !terminoDetalle.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50" style={{ backgroundColor: selectedTerminoType === "hora" ? GOLD : AZURE, color: "#000" }} data-testid="button-launch-vehicle">Lanzar Vehículo</button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
            <button onClick={resetForm} className="w-full py-2 text-xs text-slate-500 hover:text-slate-400">Cancelar</button>
          </motion.div>
        ) : null}

        {cierreEnergiaPending && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.82)" }} role="dialog" aria-modal="true" aria-labelledby="cierre-energia-titulo">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl border p-5 space-y-4" style={{ backgroundColor: PIZARRA, borderColor: "rgba(139,92,246,0.35)" }}>
              <div className="text-center space-y-1">
                <p id="cierre-energia-titulo" className="text-sm font-bold text-white">Cierre consciente</p>
                <p className="text-[9px] text-slate-500">¿Con qué energía terminas? (tiempo, situación, verdad, descanso, investigador, desglosador). Opcional · alimenta el Espejo.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ENERGIA_ESPEJO_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCierreEnergiaSeleccion(prev => prev === opt.id ? null : opt.id)}
                    className="py-2.5 rounded-lg flex flex-col items-center gap-0.5 transition-all"
                    style={{
                      backgroundColor: cierreEnergiaSeleccion === opt.id ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${cierreEnergiaSeleccion === opt.id ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.08)"}`,
                      color: cierreEnergiaSeleccion === opt.id ? "#a78bfa" : "#64748b",
                    }}
                  >
                    <span className="text-sm leading-none">{opt.icon}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setCierreEnergiaPending(null); setCierreEnergiaSeleccion(null); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = cierreEnergiaPending;
                    if (!p || !user) return;
                    const sel = cierreEnergiaSeleccion ?? undefined;
                    if (p.kind === "flota") void handleFlotaStatusChange(p.vehicleId, p.status, sel);
                    else if (p.kind === "investigador") void handleInvestigadorClose(p.vehicleId, p.cumplido, p.cantidadRealizada, sel);
                    else if (p.kind === "desglosador") void handleDesglosadorGlobalClose(p.vehicleId, p.subs, sel);
                    else void handleDescansoClose(p.vehicleId, p.status, p.etiqueta, p.nota, sel);
                    setCierreEnergiaPending(null);
                    setCierreEnergiaSeleccion(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{ backgroundColor: VIOLET, color: "#fff" }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showLabIntrospeccion && (
          <LabIntrospeccionModal
            segmentoNombre={closedSegmentName}
            segmentoDuracionMin={closedSegmentDuration}
            onClose={() => setShowLabIntrospeccion(false)}
            onSeal={async (totalPS, respuestas, capasActivas) => {
              if (user && totalPS > 0) {
                await awardSovereigntyPoints(user.uid, totalPS, "Laboratorio de Introspección: " + closedSegmentName);
                toast.success(`+${totalPS} PS Introspección`, { style: { backgroundColor: PIZARRA, border: `2px solid ${VIOLET}`, color: VIOLET }, duration: 4000 });
              }
              if (user) {
                try {
                  await saveIntrospectionEntry(user.uid, { segmentoNombre: closedSegmentName, segmentoDuracionMin: closedSegmentDuration, capasActivas, respuestas, totalPS, ai_feedback_status: "pending" });
                } catch (e) { console.error("Error saving introspection:", e); }
              }
              setShowLabIntrospeccion(false);
            }}
          />
        )}

        {showCierreJornada && (() => {
          const _cjTodayStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
          const _cjTodayVehicles = vehicles.filter(v => {
            const ts = v.cierreAt || v.aperturaAt || v.createdAt?.getTime?.() || 0;
            return ts >= _cjTodayStart;
          });
          const _cjEstimatedPS = _cjTodayVehicles
            .filter(v => v.status !== "activo")
            .reduce((sum, v) => {
              if (v.autoVerdad) return sum;
              const isCumplido = v.status === "cumplido";
              const base = 2;
              if (v.tipoReloj === "desglosador") return sum + base + (isCumplido ? base : 0);
              return sum + base + (isCumplido ? base : 0);
            }, 0)
            + (planilla?.segmentos || []).reduce((sum: number, s: any) => sum + (s.psGanados || 0), 0);
          return (
          <CierreJornadaModal
            vehicles={_cjTodayVehicles}
            todayPoints={_cjEstimatedPS}
            onClose={() => setShowCierreJornada(false)}
            onSeal={async (cierre) => {
              if (user) {
                await saveCierreJornada(user.uid, cierre);
                toast.success("Jornada Sellada", {
                  description: `${(cierre as any).porcentajeDiaIdeal || cierre.porcentajeSoberania}% Día Ideal · ${cierre.totalPS} PS`,
                  style: { backgroundColor: PIZARRA, border: `2px solid ${GOLD}`, color: GOLD }
                });
              }
              setShowCierreJornada(false);
            }}
            userId={user?.uid || ""}
          />
          );
        })()}
      </div>
    </div>
  );
}

function AccordionSection({ title, subtitle, icon: Icon, color, count, children }: {
  title: string; subtitle?: string; icon: any; color: string; count: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border overflow-hidden" style={{ backgroundColor: PIZARRA, borderColor: `${color}20` }}>
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</span>
          {subtitle && <span className="text-[8px] px-2 py-0.5 rounded-full ml-1 bg-slate-700/30 text-slate-500 uppercase tracking-wider">{subtitle}</span>}
          <span className="text-[9px] px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: `${color}20`, color }}>{count} activo{count !== 1 ? "s" : ""}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function calculateVehicleScore(vehicle: Vehicle): {
  difficulty: "facil" | "media" | "dificil";
  potentialCPCumplido: number;
  potentialCPArchivado: number;
  scorePercent: number;
  retoCount: number;
  blandoCount: number;
} {
  // Desglosador: base fija 10 PS, el bono por sub-vehículos es dinámico y no computable a priori
  if (vehicle.tipoReloj === "desglosador") {
    return { difficulty: "facil", potentialCPCumplido: 10, potentialCPArchivado: 0, scorePercent: 0, retoCount: 0, blandoCount: 0 };
  }

  const ejes = Object.values(vehicle.ejes);
  const retoCount = ejes.filter(e => e.trifecta === "reto").length;
  const blandoCount = ejes.filter(e => e.trifecta === "blando").length;
  const isHard = retoCount >= 1;
  const isMedium = blandoCount >= 2 && !isHard;
  let difficulty: "facil" | "media" | "dificil" = "facil";
  let potentialCPCumplido = 0;
  let potentialCPArchivado = 0;
  const isSituacion = vehicle.tipoFlota === "situacion";
  if (isHard) { difficulty = "dificil"; potentialCPCumplido += 35 + (retoCount - 1) * 10; potentialCPArchivado += 15 + (retoCount - 1) * 5; }
  else if (isMedium) { difficulty = "media"; potentialCPCumplido += 20; potentialCPArchivado += 5; }
  else if (!isSituacion) { potentialCPCumplido = 10; }
  const maxScore = 4 * 100;
  const currentScore = (retoCount * 100) + (blandoCount * 50);
  const scorePercent = Math.round((currentScore / maxScore) * 100);
  return { difficulty, potentialCPCumplido, potentialCPArchivado, scorePercent, retoCount, blandoCount };
}

function VehicleCard({
  vehicle, expanded, onToggle, onComplete, onArchive, onArchiveWithReflection, onQuickEditEje, onDetail, minimal = false,
  fatigueLayer, transmutationText, onTransmutationChange, showTransmutation, recentSituacionCount, segmentoActivoMinutes, segmentoNumero,
  planilla, monitorState,
  onJustificar, onAddSubTarea, onToggleSubTarea, onSetSubTareaMinutosCupo, onExtendSituacionCupo, onSyncSituacionCupoAnchor, onAddDetalle, onEntregarDetalle, arquitectoUnlocked,
  onMoveSubTareasToCronometro, onSituacionCronometroSetHoraFin, onSituacionCronometroCumplido, onSituacionCronometroFallado, onQuitarSubTareaDeCronometro,
  onInvestigadorClose, onDesglosadorUpdate, onDesglosadorGlobalClose,
  onDescansoClose, onMicroPasoToggle, onEtapaPuntoCeroToggle, onOpenCierreEnergia
}: {
  vehicle: Vehicle; expanded: boolean; onToggle: () => void; onComplete?: () => void; onArchive?: () => void;
  onArchiveWithReflection?: (reflections: Record<string, string>) => void; onQuickEditEje?: (ejeKey: string, newText: string, newTrifecta: TrifectaState) => void;
  onDetail?: () => void; minimal?: boolean; fatigueLayer?: number; transmutationText?: string; onTransmutationChange?: (text: string) => void;
  showTransmutation?: boolean; recentSituacionCount?: number; segmentoActivoMinutes?: number; segmentoNumero?: number | null;
  planilla?: Planilla | null; monitorState?: string | null;
  onJustificar?: (vehicleId: string, justificacion: string) => void;
  onAddSubTarea?: (vehicleId: string, texto: string) => void;
  onToggleSubTarea?: (vehicleId: string, subTareaId: string) => void;
  onSetSubTareaMinutosCupo?: (vehicleId: string, subTareaId: string, minutos: number | undefined) => void;
  onExtendSituacionCupo?: (vehicleId: string, subTareaId: string, delta: number) => void;
  onSyncSituacionCupoAnchor?: (vehicleId: string) => void;
  onMoveSubTareasToCronometro?: (vehicleId: string, subTareaIds: string[]) => void;
  onSituacionCronometroSetHoraFin?: (vehicleId: string, hhmm: string) => void;
  onSituacionCronometroCumplido?: (vehicleId: string, subTareaId: string) => void;
  onSituacionCronometroFallado?: (vehicleId: string, subTareaId: string) => void;
  onQuitarSubTareaDeCronometro?: (vehicleId: string, subTareaId: string) => void;
  onAddDetalle?: (vehicleId: string, subTareaId: string, texto: string) => void;
  onEntregarDetalle?: (vehicleId: string, subTareaId: string, detalleId: string) => void;
  arquitectoUnlocked?: boolean;
  onInvestigadorClose?: (vehicleId: string, cumplido: boolean, cantidadRealizada: number, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => void;
  onDesglosadorUpdate?: (vehicleId: string, updatedSubs: SubVehiculo[]) => void;
  onDesglosadorGlobalClose?: (vehicleId: string, subs: SubVehiculo[], intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => void;
  onDescansoClose?: (vehicleId: string, status: "cumplido" | "archivado", etiqueta: "recuperado" | "parcial" | "fragmentado", nota: string, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => void;
  onMicroPasoToggle?: (vehicleId: string, paso: "hidratacion" | "respiracion" | "pantallaZero") => void;
  onEtapaPuntoCeroToggle?: (vehicleId: string, etapa: "etapa1" | "etapa2" | "etapa3" | "etapa4") => void;
  onOpenCierreEnergia?: (payload: CierreEnergiaModalPayload) => void;
}) {
  const [showReflectionMode, setShowReflectionMode] = useState(false);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [editingEje, setEditingEje] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingTrifecta, setEditingTrifecta] = useState<TrifectaState>("blando");
  const [timerDisplay, setTimerDisplay] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const [debtDisplay, setDebtDisplay] = useState("");
  const [targetTimeLabel, setTargetTimeLabel] = useState("");
  const [coloresConfirmados, setColoresConfirmados] = useState<boolean[]>(Array(7).fill(false));
  const [colorInmersion, setColorInmersion] = useState<{ color: string; zona: string; idx: number } | null>(null);
  const [inmersionCount, setInmersionCount] = useState(3);
  const [showDescansoReloj, setShowDescansoReloj] = useState(false);
  const [showJustificacion, setShowJustificacion] = useState(false);
  const [justificacionText, setJustificacionText] = useState("");
  const [newSubTarea, setNewSubTarea] = useState("");
  const [cantidadRealizada, setCantidadRealizada] = useState("");
  const [remainingUnits, setRemainingUnits] = useState<number | null>(null);
  const [subVehicleRestante, setSubVehicleRestante] = useState<number | null>(null);
  const [subTimerDisplay, setSubTimerDisplay] = useState("");
  const [subTimerIsCountdown, setSubTimerIsCountdown] = useState(false);
  const [subTimerExpired, setSubTimerExpired] = useState(false);
  const [desglosadorSummary, setDesglosadorSummary] = useState(false);
  const [subTasksCollapsed, setSubTasksCollapsed] = useState(false);
  const [expandedDetalleStId, setExpandedDetalleStId] = useState<string | null>(null);
  const [situacionLibreSeleccion, setSituacionLibreSeleccion] = useState<Set<string>>(() => new Set());
  const [newDetalleTexts, setNewDetalleTexts] = useState<Record<string, string>>({});
  const [showEtiquetaSalida, setShowEtiquetaSalida] = useState(false);
  const [etiquetaSalidaLocal, setEtiquetaSalidaLocal] = useState<"recuperado" | "parcial" | "fragmentado" | null>(null);
  const [notaSalidaLocal, setNotaSalidaLocal] = useState("");
  const [pendingDescansoStatus, setPendingDescansoStatus] = useState<"cumplido" | "archivado" | null>(null);
  const [showMicroPasos, setShowMicroPasos] = useState(false);
  const [horaFinProyectada, setHoraFinProyectada] = useState<string | null>(null);
  const [horaFinRemainSec, setHoraFinRemainSec] = useState<number | null>(null);
  const [horaFinDeltaSec, setHoraFinDeltaSec] = useState<number>(0);
  const [liveAccumDeltaSec, setLiveAccumDeltaSec] = useState<number>(0);
  const [tiempoGanado, setTiempoGanado] = useState<number>(0);
  const [tiempoGanadoKey, setTiempoGanadoKey] = useState<number>(0);
  const [showTiempoGanado, setShowTiempoGanado] = useState(false);
  const [futuroSubLabel, setFuturoSubLabel] = useState<string>("—");
  const [futuroCicloLabel, setFuturoCicloLabel] = useState<string>("—");
  const tiempoGanadoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevRemainingRef = useRef<number | null>(null);
  const prevSubRestanteRef = useRef<number | null>(null);
  const chimeCtxRef = useRef<AudioContext | null>(null);
  const alarmCtxRef = useRef<AudioContext | null>(null);
  const prevTimerExpiredRef = useRef<boolean>(false);
  const situacionCupoFireKeyRef = useRef<string | null>(null);
  const situacion2MinWarnKeyRef = useRef<string | null>(null);
  const [situacionCupoUiTick, setSituacionCupoUiTick] = useState(0);

  const playChime = useCallback(() => {
    if (localStorage.getItem("sistemicar_tik_sound") === "off") return;
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!chimeCtxRef.current) chimeCtxRef.current = new AudioCtx();
      const ctx = chimeCtxRef.current;
      if (ctx.state === "suspended") { ctx.resume(); return; }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
    } catch (err) {
      console.debug("[investigador chime] audio error:", err);
    }
  }, []);

  const playWarDrum = useCallback(() => {
    if (localStorage.getItem("sistemicar_tik_sound") === "off") return;
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.debug("[war drum] audio error:", err);
    }
  }, []);

  const playAlarm = useCallback(() => {
    if (localStorage.getItem("sistemicar_tik_sound") === "off") return;
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!alarmCtxRef.current || alarmCtxRef.current.state === "closed") alarmCtxRef.current = new AudioCtx();
      const ctx = alarmCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const freqs = [440, 880, 1320];
      const cycleLen = freqs.length;
      const stepGap = 0.3;
      const cycleGap = 0.2;
      const totalCycles = 3;
      for (let c = 0; c < totalCycles; c++) {
        freqs.forEach((freq, i) => {
          const t = ctx.currentTime + c * (cycleLen * stepGap + cycleGap) + i * stepGap;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.55, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
          osc.start(t); osc.stop(t + 0.27);
        });
      }
    } catch (err) {
      console.debug("[alarm] audio error:", err);
    }
  }, []);

  const situacionSubWatchKey = useMemo(() => {
    if (vehicle.tipoFlota !== "situacion") return "";
    const sc = vehicle.situacionCronometro;
    return (
      (vehicle.subTareas || [])
        .map(s => `${s.id}:${s.completada ? 1 : 0}:${s.minutosCupo ?? 0}:${s.enDesgloseCronometro ? 1 : 0}:${s.resultadoSituacion ?? ""}`)
        .join("|") + `|sc:${sc?.activo ? 1 : 0}:${sc?.horaFinMs ?? 0}`
    );
  }, [vehicle.tipoFlota, vehicle.subTareas, vehicle.situacionCronometro]);

  useEffect(() => {
    if (!onSyncSituacionCupoAnchor || vehicle.tipoFlota !== "situacion" || vehicle.status !== "activo") return;
    onSyncSituacionCupoAnchor(vehicle.id);
  }, [vehicle.id, vehicle.status, vehicle.tipoFlota, situacionSubWatchKey, onSyncSituacionCupoAnchor]);

  useEffect(() => {
    if (vehicle.tipoFlota !== "situacion" || vehicle.status !== "activo") return;
    const id = window.setInterval(() => setSituacionCupoUiTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [vehicle.tipoFlota, vehicle.status]);

  useEffect(() => {
    if (vehicle.tipoFlota !== "situacion" || vehicle.status !== "activo") return;
    const anchor = vehicle.situacionCupoAnchor;
    if (!anchor?.subTareaId) return;
    const sub = (vehicle.subTareas || []).find(s => s.id === anchor.subTareaId);
    if (!sub || !(sub.minutosCupo && sub.minutosCupo > 0)) return;
    if (sub.enDesgloseCronometro && (sub.resultadoSituacion ?? "pendiente") !== "pendiente") return;
    if (!sub.enDesgloseCronometro && sub.completada) return;
    const limitMs = sub.minutosCupo * 60 * 1000;
    const fireKey = `${anchor.subTareaId}-${anchor.startedAt}-${sub.minutosCupo}`;
    const run = () => {
      const elapsed = Date.now() - anchor.startedAt;
      if (elapsed < limitMs) return;
      if (situacionCupoFireKeyRef.current === fireKey) return;
      situacionCupoFireKeyRef.current = fireKey;
      playAlarm();
      if (navigator.vibrate) navigator.vibrate([200, 80, 200]);
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`⏱ Cupo · ${vehicle.titulo}`, {
            body: `La fila «${sub.texto.slice(0, 48)}${sub.texto.length > 48 ? "…" : ""}» alcanzó su cupo.`,
            icon: "/favicon.ico",
            tag: `situacion-cupo-${vehicle.id}-${fireKey}`,
          });
        } catch { /* empty */ }
      }
    };
    run();
    const intervalId = window.setInterval(run, 2000);
    return () => clearInterval(intervalId);
  }, [vehicle.tipoFlota, vehicle.status, vehicle.situacionCupoAnchor, vehicle.subTareas, vehicle.titulo, vehicle.id, playAlarm]);

  useEffect(() => {
    if (vehicle.tipoFlota !== "situacion" || vehicle.status !== "activo") return;
    const anchor = vehicle.situacionCupoAnchor;
    if (!anchor?.subTareaId) return;
    const sub = (vehicle.subTareas || []).find(s => s.id === anchor.subTareaId);
    if (!sub || !(sub.minutosCupo && sub.minutosCupo >= 2)) return;
    if (sub.enDesgloseCronometro && (sub.resultadoSituacion ?? "pendiente") !== "pendiente") return;
    if (!sub.enDesgloseCronometro && sub.completada) return;
    const limitSec = sub.minutosCupo * 60;
    const elapsedSec = Math.max(0, Math.floor((Date.now() - anchor.startedAt) / 1000));
    const remainSec = Math.max(0, limitSec - elapsedSec);
    if (remainSec !== 120 && remainSec !== 119 && remainSec !== 118) return;
    const warnKey = `2m-${anchor.subTareaId}-${anchor.startedAt}-${sub.minutosCupo}`;
    if (situacion2MinWarnKeyRef.current === warnKey) return;
    situacion2MinWarnKeyRef.current = warnKey;
    void playSituacionChimes(3);
  }, [vehicle.tipoFlota, vehicle.status, vehicle.situacionCupoAnchor, vehicle.subTareas, vehicle.id, situacionCupoUiTick]);

  useEffect(() => {
    const wasExpired = prevTimerExpiredRef.current;
    prevTimerExpiredRef.current = timerExpired;
    if (!wasExpired && timerExpired && vehicle.status === "activo") {
      playAlarm();
      if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`⏱ ${vehicle.titulo}`, {
            body: "Tiempo completado. Cierra el vehículo para registrar tus puntos.",
            icon: "/favicon.ico",
            tag: `alarm-${vehicle.id}`,
          });
        } catch { }
      }
    }
  }, [timerExpired, vehicle.status, vehicle.titulo, vehicle.id, playAlarm]);

  useEffect(() => {
    if (vehicle.tipoReloj !== "investigador") return;
    if (remainingUnits === null) { prevRemainingRef.current = null; return; }
    if (prevRemainingRef.current !== null && remainingUnits < prevRemainingRef.current) {
      playChime();
    }
    prevRemainingRef.current = remainingUnits;
  }, [remainingUnits, playChime, vehicle.tipoReloj]);

  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador") return;
    if (subVehicleRestante === null) { prevSubRestanteRef.current = null; return; }
    if (prevSubRestanteRef.current !== null && subVehicleRestante < prevSubRestanteRef.current) {
      playChime();
    }
    prevSubRestanteRef.current = subVehicleRestante;
  }, [subVehicleRestante, playChime, vehicle.tipoReloj]);

  const tipoFlota = vehicle.tipoFlota;
  const flotaConfig = tipoFlota ? FLOTA_CONFIG[tipoFlota] : null;
  const DESCANSO_TIPO_COLOR: Record<string, string> = { intercepcion: "#00FFC3", microcarga: "#10b981", reset_profundo: "#8B5CF6", punto_cero: "#D4AF37" };
  const flotaColor = tipoFlota === "descanso" && vehicle.tipoDescanso
    ? DESCANSO_TIPO_COLOR[vehicle.tipoDescanso] || VERDE
    : (flotaConfig?.color || (vehicle.tipoTerminoRapido === "hora" ? NARANJA : vehicle.tipoTerminoRapido === "situacion" ? PLATA : GRIS));

  useEffect(() => {
    if (tipoFlota !== "descanso" || vehicle.status !== "activo") return;
    const aperturaMs = vehicle.aperturaAt || Date.now();
    const elapsed = Date.now() - aperturaMs;
    const delay = Math.max(0, 30000 - elapsed);
    const timer = setTimeout(() => setShowMicroPasos(true), delay);
    return () => clearTimeout(timer);
  }, [tipoFlota, vehicle.status, vehicle.aperturaAt]);

  useEffect(() => {
    if (vehicle.status !== "activo") return;
    const aperturaMs = vehicle.aperturaAt || (vehicle.tiempoInicio ? (typeof vehicle.tiempoInicio === 'object' && (vehicle.tiempoInicio as any).seconds ? (vehicle.tiempoInicio as any).seconds * 1000 : new Date(vehicle.tiempoInicio as any).getTime()) : Date.now());
    const parentesisExtra = (vehicle.parentesisRecarga || []).reduce((sum, p) => sum + p.duracionMin, 0);
    const fmtTime = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
    const fmtHHMM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    let targetMs: number | null = null;
    let matchProd: RegExpMatchArray | null = null;

    if ((tipoFlota === "tiempo" || vehicle.tipoTerminoRapido === "hora") && vehicle.criterioDetalle) {
      const matchHora = vehicle.criterioDetalle.match(/^(\d{1,2}):(\d{2})$/);
      matchProd = vehicle.criterioDetalle.match(/^([\d.]+)\s*x\s*([\d.]+)\s*min$/i);
      if (matchHora) {
        const target = new Date(); target.setHours(parseInt(matchHora[1]), parseInt(matchHora[2]), 0, 0);
        target.setMinutes(target.getMinutes() + parentesisExtra);
        targetMs = target.getTime();
        setTargetTimeLabel(fmtHHMM(target));
      } else if (matchProd) {
        const totalMin = parseFloat(matchProd[1]) * parseFloat(matchProd[2]);
        targetMs = aperturaMs + (totalMin + parentesisExtra) * 60000;
        setTargetTimeLabel(fmtHHMM(new Date(targetMs)));
      }
    }

    if (tipoFlota === "descanso" && vehicle.criterioDetalle) {
      const matchDur = vehicle.criterioDetalle.match(/([\d.]+)\s*min/i);
      if (matchDur) {
        const durMin = parseFloat(matchDur[1]) + 5;
        targetMs = aperturaMs + (durMin + parentesisExtra) * 60000;
        setTargetTimeLabel(fmtHHMM(new Date(targetMs)));
      }
    }

    if (tipoFlota === "situacion" && vehicle.situacionCronometro?.activo) {
      const sc = vehicle.situacionCronometro;
      const subs = vehicle.subTareas || [];
      const sumMin = sumMinutosCronometroPendientes(subs);
      if (sumMin > 0 && sc) {
        const tMs = sc.horaFinMs ?? (sc.bloqueInicioAt ?? aperturaMs) + sumMin * 60000;
        targetMs = tMs;
        setTargetTimeLabel(fmtHHMM(new Date(tMs)));
      }
    }

    const computeTimer = () => {
      if (tipoFlota === "verdad") {
        const elapsed = Math.max(0, Math.floor((Date.now() - aperturaMs) / 1000));
        setTimerDisplay(fmtTime(elapsed));
        return;
      }
      if (targetMs !== null) {
        const now = Date.now();
        const diff = targetMs - now;
        if (diff > 0) {
          setTimerExpired(false);
          setDebtDisplay("");
          setTimerDisplay(fmtTime(Math.floor(diff / 1000)));
        } else {
          setTimerExpired(true);
          setTimerDisplay("00:00:00");
          setDebtDisplay(fmtTime(Math.floor(Math.abs(diff) / 1000)));
        }
        if (matchProd) {
          const cantObj = parseFloat(matchProd[1]);
          const minPerUnit = parseFloat(matchProd[2]);
          const elapsedMin = (Date.now() - aperturaMs) / 60000;
          const done = Math.floor(elapsedMin / minPerUnit);
          setRemainingUnits(Math.max(0, cantObj - done));
        }
        return;
      }
      if (vehicle.tipoReloj === "investigador" && vehicle.cantidadObjetivo) {
        const hist = getHistoricalVehicleData(vehicle.titulo);
        const recordMpu = hist.bestMinPerUnit ?? hist.lastMinPerUnit;
        if (recordMpu) {
          const elapsedMin = (Date.now() - aperturaMs) / 60000;
          const done = Math.floor(elapsedMin / recordMpu);
          setRemainingUnits(Math.max(0, vehicle.cantidadObjetivo - done));
        }
      }
      const elapsed = Math.max(0, Math.floor((Date.now() - aperturaMs) / 1000));
      setTimerDisplay(fmtTime(elapsed));
    };

    computeTimer();

    const onFocus = () => computeTimer();
    document.addEventListener("visibilitychange", onFocus);

    if (!expanded) return () => document.removeEventListener("visibilitychange", onFocus);

    const interval = setInterval(computeTimer, 1000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [expanded, vehicle.status, vehicle.tipoTerminoRapido, vehicle.criterioDetalle, vehicle.tiempoInicio, tipoFlota, vehicle.aperturaAt, vehicle.parentesisRecarga, vehicle.tipoReloj, vehicle.cantidadObjetivo, vehicle.titulo, vehicle.situacionCronometro, vehicle.subTareas]);

  // Timer for active sub-vehicle in desglosador mode
  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo") return;
    const activeSub = (vehicle.subVehiculos || []).find(s => s.status === "activo");
    if (!activeSub?.aperturaAt) return;
    const fmtElapsed = (totalSec: number) => { const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
    const fmtMM = (sec: number) => { const m = Math.floor(Math.abs(sec) / 60); const s = Math.abs(sec) % 60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
    const objSecs = (activeSub.cantidadObjetivo && activeSub.tiempoRecordMinPerUnit)
      ? Math.round(activeSub.cantidadObjetivo * activeSub.tiempoRecordMinPerUnit * 60)
      : activeSub.tiempoSugeridoSeg ?? null;
    setSubTimerIsCountdown(objSecs !== null);
    if (activeSub.cantidadObjetivo && activeSub.tiempoRecordMinPerUnit) {
      setSubVehicleRestante(activeSub.cantidadObjetivo);
    } else {
      setSubVehicleRestante(null);
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - activeSub.aperturaAt!) / 1000);
      if (objSecs !== null) {
        const remaining = objSecs - elapsed;
        setSubTimerExpired(remaining <= 0);
        setSubTimerDisplay(fmtMM(remaining));
      } else {
        setSubTimerExpired(false);
        setSubTimerDisplay(fmtElapsed(elapsed));
      }
      if (activeSub.cantidadObjetivo && activeSub.tiempoRecordMinPerUnit) {
        const elapsedMin = elapsed / 60;
        const done = Math.floor(elapsedMin / activeSub.tiempoRecordMinPerUnit);
        setSubVehicleRestante(Math.max(0, activeSub.cantidadObjetivo - done));
      }
      // Reloj de Futuro — recalculated each tick
      const allSubsF = vehicle.subVehiculos || [];
      const terminadosF = allSubsF.filter(s => s.status === "cumplido" || s.status === "fallado");
      const pendientesF = allSubsF.filter(s => s.status === "pendiente");
      const deltaDataF = terminadosF.filter(s => s.duracionFinal !== undefined && s.tiempoSugeridoSeg !== undefined);
      const deltaTotalSecF = deltaDataF.reduce((acc, s) => acc + (s.duracionFinal! - s.tiempoSugeridoSeg!), 0);
      const anySuggested = allSubsF.some(s => s.tiempoSugeridoSeg !== undefined);
      // futuroSubLabel — usa objSecs (tiempo propio de la sub activa, no heredado)
      if (activeSub.aperturaAt && objSecs) {
        const d = new Date(activeSub.aperturaAt + objSecs * 1000);
        setFuturoSubLabel(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
      } else {
        setFuturoSubLabel("—");
        if (!anySuggested) setFuturoCicloLabel("—");
      }
      // Reloj Futuro del ciclo: usa objSecs como tiempo de la sub activa (correcto, propio)
      if (objSecs !== null) {
        const remainActiveF = Math.max(0, objSecs - elapsed);
        const remainPendF = pendientesF.reduce((acc, sv) => acc + (sv.tiempoSugeridoSeg ?? 0), 0);
        const totalRemainF = remainActiveF + remainPendF + deltaTotalSecF;
        const projDate = new Date(Date.now() + Math.max(0, totalRemainF) * 1000);
        const horaFin = `${String(projDate.getHours()).padStart(2, "0")}:${String(projDate.getMinutes()).padStart(2, "0")}`;
        setHoraFinProyectada(horaFin);
        setFuturoCicloLabel(horaFin);
        setHoraFinRemainSec(Math.max(0, totalRemainF));
        // Delta acumulado en tiempo real: subs terminadas + overshoot/undershoot de la activa
        const liveAccum = deltaTotalSecF + (elapsed - objSecs);
        setHoraFinDeltaSec(liveAccum);
        setLiveAccumDeltaSec(liveAccum);
      } else if (anySuggested) {
        const remainPendF = pendientesF.reduce((acc, sv) => acc + (sv.tiempoSugeridoSeg ?? 0), 0);
        const totalRemainF = remainPendF + deltaTotalSecF;
        const projDate = new Date(Date.now() + Math.max(0, totalRemainF) * 1000);
        const horaFin = `${String(projDate.getHours()).padStart(2, "0")}:${String(projDate.getMinutes()).padStart(2, "0")}`;
        setHoraFinProyectada(horaFin);
        setFuturoCicloLabel(horaFin);
        setHoraFinRemainSec(Math.max(0, totalRemainF));
        setHoraFinDeltaSec(deltaTotalSecF);
        setLiveAccumDeltaSec(deltaTotalSecF);
      } else {
        // Ningún sub tiene tiempoSugeridoSeg → sin proyección posible
        setHoraFinProyectada(null);
        setFuturoCicloLabel("—");
        setHoraFinRemainSec(null);
        setHoraFinDeltaSec(0);
        setLiveAccumDeltaSec(0);
      }
    };
    update();
    const iv = setInterval(update, 1000);
    return () => { clearInterval(iv); setHoraFinProyectada(null); setFuturoSubLabel("—"); setFuturoCicloLabel("—"); };
  }, [vehicle.tipoReloj, vehicle.status, vehicle.subVehiculos]);

  // Cleanup tiempoGanadoTimerRef on unmount to prevent stale setState
  useEffect(() => {
    return () => { if (tiempoGanadoTimerRef.current) { clearTimeout(tiempoGanadoTimerRef.current); tiempoGanadoTimerRef.current = null; } };
  }, []);

  const handleStartEditEje = (key: string) => { const ejeData = vehicle.ejes[key as keyof typeof vehicle.ejes]; setEditingEje(key); setEditingText(ejeData.text); setEditingTrifecta(ejeData.trifecta); };
  const handleSaveEjeEdit = () => { if (editingEje && onQuickEditEje) onQuickEditEje(editingEje, editingText, editingTrifecta); setEditingEje(null); setEditingText(""); };
  const handleCancelEjeEdit = () => { setEditingEje(null); setEditingText(""); };

  const reflectionCount = Object.values(reflections).filter(r => r.trim().length > 5).length;
  const reflectionBonus = reflectionCount * 2;
  const statusColors = { activo: GOLD, cumplido: EMERALD, archivado: "#6b7280" };
  const { difficulty, potentialCPCumplido, potentialCPArchivado, scorePercent, retoCount } = calculateVehicleScore(vehicle);
  const difficultyConfig = {
    facil: { label: "FÁCIL", color: "#6b7280", bgColor: "rgba(107,114,128,0.2)" },
    media: { label: "MEDIA", color: AZURE, bgColor: "rgba(30,144,255,0.2)" },
    dificil: { label: "DIFÍCIL", color: GOLD, bgColor: "rgba(212,175,55,0.2)" }
  };

  const completedSubTareas = (vehicle.subTareas || []).filter(st => {
    if (st.enDesgloseCronometro) return st.resultadoSituacion === "cumplido" || st.resultadoSituacion === "fallado";
    return st.completada;
  }).length;

  const isSituacionFlota = vehicle.tipoFlota === "situacion";
  const effectivePotentialCP = potentialCPCumplido;

  useEffect(() => {
    if (!colorInmersion) return;
    setInmersionCount(3);
    const timer = setTimeout(() => {
      setColoresConfirmados(prev => { const n = [...prev]; n[colorInmersion.idx] = true; return n; });
      setColorInmersion(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [colorInmersion]);

  useEffect(() => {
    if (!colorInmersion) return;
    const interval = setInterval(() => {
      setInmersionCount(prev => Math.max(1, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [colorInmersion]);

  return (
    <motion.div layout className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#0a0a0a", borderColor: vehicle.energiaOscura ? "#991b1b" : `${statusColors[vehicle.status]}30`, boxShadow: vehicle.energiaOscura ? "0 0 20px rgba(153,27,27,0.4)" : "none" }}>

      <AnimatePresence>
        {colorInmersion && (
          <motion.div
            key="color-inmersion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              setColoresConfirmados(prev => { const n = [...prev]; n[colorInmersion.idx] = true; return n; });
              setColorInmersion(null);
            }}
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 9999, backgroundColor: `${colorInmersion.color}E0`, cursor: "pointer" }}
            data-testid={`overlay-inmersion-${vehicle.id}`}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 select-none"
            >
              <div className="w-32 h-32 rounded-full" style={{ backgroundColor: colorInmersion.color, boxShadow: `0 0 60px ${colorInmersion.color}, 0 0 120px ${colorInmersion.color}80` }} />
              <p className="text-5xl font-black uppercase tracking-widest text-white" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)", fontFamily: "Playfair Display, serif" }}>{colorInmersion.zona.toUpperCase()}</p>
              <p className="text-sm text-white/60 uppercase tracking-[0.25em]">Inhálalo · Introdúcelo a su zona</p>
              <motion.p
                key={inmersionCount}
                initial={{ opacity: 0, scale: 1.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-4xl font-black text-white/80 tabular-nums"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)", fontFamily: "Playfair Display, serif" }}
                data-testid={`inmersion-countdown-${vehicle.id}`}
              >
                {inmersionCount}
              </motion.p>
              <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} data-testid={`inmersion-progress-track-${vehicle.id}`}>
                <motion.div
                  key={colorInmersion.idx + "-" + colorInmersion.zona}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
                  data-testid={`inmersion-progress-bar-${vehicle.id}`}
                />
              </div>
              <p className="text-xs text-white/30">Toca para continuar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onToggle} className="w-full p-3 text-left" data-testid={`card-vehicle-${vehicle.id}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[vehicle.status] }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-white">{vehicle.titulo}</p>
                {tipoFlota && flotaConfig ? (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: `${flotaColor}20`, color: flotaColor }}>{flotaConfig.label}</span>
                ) : vehicle.tipoTerminoRapido && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{
                    backgroundColor: vehicle.tipoTerminoRapido === "hora" ? "rgba(239, 68, 68, 0.2)" : vehicle.tipoTerminoRapido === "situacion" ? "rgba(168, 85, 247, 0.2)" : "rgba(107, 114, 128, 0.2)",
                    color: vehicle.tipoTerminoRapido === "hora" ? "#ef4444" : vehicle.tipoTerminoRapido === "situacion" ? "#a855f7" : "#6b7280"
                  }}>{vehicle.tipoTerminoRapido === "hora" ? "HORA" : vehicle.tipoTerminoRapido === "situacion" ? "SITUACIÓN" : "OMITIR"}</span>
                )}
                {vehicle.bonoTemple && <span className="text-[7px] font-black px-1 py-0.5 rounded-full" style={{ backgroundColor: `${NARANJA}20`, color: NARANJA }}>TEMPLE</span>}
                {vehicle.energiaOscura && <span className="text-[7px] font-black px-1 py-0.5 rounded-full" style={{ backgroundColor: "rgba(153,27,27,0.3)", color: "#ef4444", boxShadow: "0 0 8px rgba(153,27,27,0.5)" }} data-testid={`badge-energia-oscura-${vehicle.id}`}>ENERGÍA OSCURA</span>}
                {vehicle.intensidadEnergetica && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)" }}>
                    {vehicle.intensidadEnergetica === "fluido" ? "〜 FLUIDO" : vehicle.intensidadEnergetica === "concentrado" ? "◉ CONCENTRADO" : "▲ AL LÍMITE"}
                  </span>
                )}
                {vehicle.intensidadEnergeticaFin && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.35)" }} title="Energía al cerrar">
                    FIN · {vehicle.intensidadEnergeticaFin === "fluido" ? "〜" : vehicle.intensidadEnergeticaFin === "concentrado" ? "◉" : "▲"}
                  </span>
                )}
                {vehicle.tipoReloj === "manual" && vehicle.status === "activo" && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(153,27,27,0.25)", color: "#dc2626", border: "1px solid rgba(153,27,27,0.5)", boxShadow: "0 0 6px rgba(220,38,38,0.3)" }}>⚖ JUICIO</span>
                )}
                {vehicle.tipoReloj === "investigador" && vehicle.status === "activo" && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(30,144,255,0.15)", color: "#60a5fa", border: "1px solid rgba(30,144,255,0.3)" }}>⚗ INVESTIGADOR</span>
                )}
                {segmentoNumero != null && vehicle.status === "activo" && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${EMERALD}20`, color: EMERALD }}>S{segmentoNumero}</span>}
              </div>
              <p className="text-[10px] text-slate-500">
                {vehicle.tipoReloj === "manual" ? "Reloj de Juicio — abierto sin límite" : vehicle.criterioDetalle}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: difficultyConfig[difficulty].bgColor, color: difficultyConfig[difficulty].color }}>{difficultyConfig[difficulty].label}</span>
              {retoCount > 0 && <span className="text-[9px] text-amber-400">{retoCount} RETO{retoCount > 1 ? "S" : ""}</span>}
            </div>
            <div className="flex items-center gap-1">
              <Zap size={10} style={{ color: difficultyConfig[difficulty].color }} />
              {vehicle.status === "activo" ? (
                isSituacionFlota ? (
                  <span className="text-xs font-black" style={{ color: PLATA }}>
                    {effectivePotentialCP > 0 ? `${effectivePotentialCP}+` : "3-7"} PS
                    {potentialCPArchivado > 0 && <span className="text-[9px] text-amber-500 ml-1">({potentialCPArchivado} si archiva)</span>}
                  </span>
                ) : (
                  <span className="text-xs font-black" style={{ color: difficultyConfig[difficulty].color }}>{effectivePotentialCP} PS{potentialCPArchivado > 0 && <span className="text-[9px] text-amber-500 ml-1">({potentialCPArchivado} si archiva)</span>}</span>
                )
              ) : (
                <span className="text-xs font-black" style={{ color: vehicle.status === "cumplido" ? EMERALD : "#f59e0b" }}>+{vehicle.status === "cumplido" ? effectivePotentialCP : potentialCPArchivado} PS</span>
              )}
            </div>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${scorePercent}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: difficultyConfig[difficulty].color, boxShadow: `0 0 6px ${difficultyConfig[difficulty].color}80` }} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {vehicle.status === "activo" && vehicle.tipoReloj === "manual" && (
                <div className="pt-3">
                  <RelojResistencia
                    onComplete={() => { if (onComplete) onComplete(); }}
                  />
                </div>
              )}

              {vehicle.tipoReloj === "desglosador" && vehicle.status === "activo" && (() => {
                const subs = vehicle.subVehiculos || [];
                const activeSub = subs.find(s => s.status === "activo");
                const cumplidos = subs.filter(s => s.status === "cumplido").length;
                const fallados = subs.filter(s => s.status === "fallado").length;
                const terminados = subs.filter(s => s.status === "cumplido" || s.status === "fallado");
                const pendientes = subs.filter(s => s.status === "pendiente");
                const done = subs.every(s => s.status === "cumplido" || s.status === "fallado");
                const fmtSec = (sec: number) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };

                if (desglosadorSummary || done) {
                  const totalRealSec = subs.reduce((acc, s) => acc + (s.duracionFinal || 0), 0);
                  const totalSugeridoSec = subs.reduce((acc, s) => acc + (s.tiempoSugeridoSeg || 0), 0);
                  const hasSugerido = totalSugeridoSec > 0;
                  const deltaTotalSec = totalRealSec - totalSugeridoSec;
                  const deltaGanando = hasSugerido && deltaTotalSec < -5;
                  const deltaPerdiendo = hasSugerido && deltaTotalSec > 5;
                  const deltaColor = deltaGanando ? "#00C851" : deltaPerdiendo ? "#FF3131" : "#D4AF37";
                  const deltaLabel = deltaGanando ? `↓ ${fmtSec(Math.abs(deltaTotalSec))} ganado` : deltaPerdiendo ? `↑ ${fmtSec(deltaTotalSec)} extra` : "→ en tiempo";
                  const psBase = 10;
                  const psCumplidos = cumplidos * 2;
                  const psFallados = fallados;
                  const totalPS = psBase + psCumplidos + psFallados;
                  return (
                    <div className="pt-3">
                      <div className="p-4 rounded-xl border-2 space-y-3" style={{ backgroundColor: "rgba(212,175,55,0.05)", borderColor: "#D4AF37", boxShadow: "0 0 20px rgba(212,175,55,0.15)" }}>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy size={14} style={{ color: "#D4AF37" }} />
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#D4AF37" }}>CICLO COMPLETADO</span>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>+{totalPS} PS</span>
                        </div>

                        {/* Top stats */}
                        <div className="grid grid-cols-2 gap-1.5 text-center sm:grid-cols-4">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(0,200,81,0.1)" }}>
                            <p className="text-base font-black" style={{ color: "#00C851" }}>{cumplidos}</p>
                            <p className="text-[7px] text-slate-400 uppercase">Cumplidos</p>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                            <p className="text-base font-black text-red-400">{fallados}</p>
                            <p className="text-[7px] text-slate-400 uppercase">Fallados</p>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.1)" }}>
                            <p className="text-base font-black" style={{ color: "#D4AF37" }}>{fmtSec(totalRealSec)}</p>
                            <p className="text-[7px] text-slate-400 uppercase">Real</p>
                          </div>
                          {hasSugerido ? (
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${deltaColor}15` }}>
                              <p className="text-[11px] font-black" style={{ color: deltaColor }}>{deltaLabel}</p>
                              <p className="text-[7px] text-slate-400 uppercase">Delta</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(100,116,139,0.08)" }}>
                              <p className="text-base font-black text-slate-500">—</p>
                              <p className="text-[7px] text-slate-500 uppercase">Sin ref</p>
                            </div>
                          )}
                        </div>

                        {/* Time vs Suggested breakdown (if available) */}
                        {hasSugerido && (
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sugerido</span>
                            <span className="text-[10px] font-mono" style={{ color: "#8B5CF6" }}>{fmtSec(totalSugeridoSec)}</span>
                            <span className="text-[8px] text-slate-600">vs</span>
                            <span className="text-[10px] font-mono text-white">{fmtSec(totalRealSec)}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Real</span>
                          </div>
                        )}

                        {/* PS breakdown */}
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#D4AF37" }}>PS</span>
                          <span className="text-[8px] text-slate-400 flex-1">Base +{psBase} · {cumplidos}×cumplido +{psCumplidos} · {fallados}×fallado +{psFallados}</span>
                          <span className="text-[10px] font-black" style={{ color: "#D4AF37" }}>={totalPS}</span>
                        </div>

                        {/* Per-sub breakdown */}
                        <div className="space-y-1.5">
                          {subs.map((sv) => {
                            const subDelta = sv.duracionFinal !== undefined && sv.tiempoSugeridoSeg !== undefined
                              ? sv.duracionFinal - sv.tiempoSugeridoSeg : null;
                            const subGanando = subDelta !== null && subDelta < -5;
                            const subPerdiendo = subDelta !== null && subDelta > 5;
                            const subDeltaColor = subGanando ? "#00C851" : subPerdiendo ? "#FF3131" : "#94a3b8";
                            return (
                              <div key={sv.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: sv.status === "cumplido" ? "rgba(0,200,81,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${sv.status === "cumplido" ? "rgba(0,200,81,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                                <div className="flex items-center gap-2 py-1.5 px-2">
                                  {sv.status === "cumplido" ? <CheckCircle2 size={10} style={{ color: "#00C851" }} /> : <XCircle size={10} className="text-red-400" />}
                                  <span className="text-[10px] font-bold text-white flex-1 truncate">{cleanSubTitulo(sv.titulo)}</span>
                                  {sv.cantidadLograda !== undefined && (
                                    <span className="text-[8px] font-mono px-1 rounded" style={{ backgroundColor: "rgba(212,175,55,0.12)", color: "#D4AF37" }}>
                                      {sv.cantidadLograda}/{sv.cantidadObjetivo}
                                    </span>
                                  )}
                                  {sv.duracionFinal !== undefined && (
                                    <span className="text-[8px] font-mono text-slate-400">{fmtSec(sv.duracionFinal)}</span>
                                  )}
                                  {subDelta !== null && (
                                    <span className="text-[8px] font-black" style={{ color: subDeltaColor }}>
                                      {subGanando ? `−${fmtSec(Math.abs(subDelta))}` : subPerdiendo ? `+${fmtSec(subDelta)}` : "≈"}
                                    </span>
                                  )}
                                </div>
                                {sv.tiempoSugeridoSeg !== undefined && sv.duracionFinal !== undefined && (
                                  <div className="flex items-center gap-1 px-2 pb-1.5">
                                    <span className="text-[7px] text-slate-600">ref {fmtSec(sv.tiempoSugeridoSeg)}</span>
                                    <span className="text-[7px] text-slate-700">→</span>
                                    <span className="text-[7px] text-slate-500">real {fmtSec(sv.duracionFinal)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const resetSubs = subs.map((sv, i) => ({
                                ...sv,
                                status: i === 0 ? "activo" as const : "pendiente" as const,
                                aperturaAt: i === 0 ? Date.now() : undefined,
                                cierreAt: undefined,
                                duracionFinal: undefined,
                                cantidadLograda: undefined,
                              }));
                              if (onDesglosadorUpdate) onDesglosadorUpdate(vehicle.id, resetSubs);
                              setDesglosadorSummary(false);
                            }}
                            className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                            style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)" }}
                            data-testid={`button-desglosador-nuevo-ciclo-${vehicle.id}`}
                          >
                            <RotateCcw size={11} /> Nuevo Ciclo
                          </button>
                          <button
                            onClick={() => {
                              if (onOpenCierreEnergia) onOpenCierreEnergia({ kind: "desglosador", vehicleId: vehicle.id, subs });
                              else onDesglosadorGlobalClose?.(vehicle.id, subs);
                            }}
                            className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            style={{ backgroundColor: "#D4AF37", color: "#000", boxShadow: "0 0 16px rgba(212,175,55,0.25)" }}
                            data-testid={`button-desglosador-global-close-${vehicle.id}`}
                          >
                            Cerrar · +{totalPS} PS
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="pt-3 space-y-3">
                    {/* Progress header with collapse toggle */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <ListTodo size={12} style={{ color: flotaColor }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: flotaColor }}>MODO EJECUCIÓN</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-slate-400">{cumplidos + fallados}/{subs.length}</span>
                        <span className="text-[8px] font-mono" style={{ color: futuroCicloLabel === "—" ? "rgba(100,116,139,0.5)" : "#F97316" }}>🏁 CICLO: {futuroCicloLabel}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSubTasksCollapsed(c => !c); }}
                          className="p-1 rounded-md transition-colors hover:bg-white/10"
                          data-testid={`button-collapse-subtasks-${vehicle.id}`}
                          title={subTasksCollapsed ? "Expandir subtareas" : "Colapsar subtareas"}
                        >
                          {subTasksCollapsed ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronUp size={12} className="text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {!subTasksCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          {/* Active sub-vehicle — protagonist */}
                          {activeSub && (
                            <div className="rounded-xl border-2 overflow-hidden" style={{
                              borderColor: flotaColor,
                              backgroundColor: `${flotaColor}08`,
                              boxShadow: `0 0 16px ${flotaColor}20`
                            }}>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-black" style={{ backgroundColor: flotaColor, color: "#000" }}>
                                    <Play size={10} />
                                  </div>
                                  <span className="text-sm font-black text-white flex-1">{cleanSubTitulo(activeSub.titulo)}</span>
                                  {activeSub.cantidadObjetivo && (
                                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${flotaColor}15`, color: flotaColor }}>
                                      obj: {activeSub.cantidadObjetivo}
                                    </span>
                                  )}
                                  {activeSub.tiempoSugeridoSeg && (
                                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)" }}>
                                      ref {fmtSec(activeSub.tiempoSugeridoSeg)}
                                    </span>
                                  )}
                                </div>
                                {/* Active sub timer */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-2 py-3 rounded-lg" style={{ backgroundColor: subTimerExpired ? "rgba(255,49,49,0.08)" : `${flotaColor}10` }}>
                                    <Timer size={12} style={{ color: subTimerExpired ? "#FF3131" : flotaColor }} />
                                    <span className="text-2xl font-black tracking-wider" style={{ color: subTimerExpired ? "#FF3131" : flotaColor, fontFamily: "JetBrains Mono, monospace" }}>
                                      {subTimerIsCountdown && subTimerExpired ? `+${subTimerDisplay}` : subTimerDisplay || "00:00:00"}
                                    </span>
                                  </div>
                                  {activeSub.cantidadObjetivo && activeSub.tiempoRecordMinPerUnit && (
                                    <p className="text-[8px] text-center font-mono" style={{ color: `${flotaColor}80` }}>
                                      {activeSub.cantidadObjetivo} u × {activeSub.tiempoRecordMinPerUnit.toFixed(1)} MIN/U = {Math.round(activeSub.cantidadObjetivo * activeSub.tiempoRecordMinPerUnit)} min obj
                                    </p>
                                  )}
                                  {/* Lucha Consciente — delta acumulado en tiempo real */}
                                  {(liveAccumDeltaSec < -5 || liveAccumDeltaSec > 5) && (
                                    <div className="flex items-center justify-center gap-2 py-1.5 rounded-lg" style={{
                                      backgroundColor: liveAccumDeltaSec < 0 ? "rgba(0,200,81,0.08)" : "rgba(255,49,49,0.08)",
                                      border: `1px solid ${liveAccumDeltaSec < 0 ? "rgba(0,200,81,0.25)" : "rgba(255,49,49,0.25)"}`,
                                    }}>
                                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: liveAccumDeltaSec < 0 ? "#00C851" : "#FF3131" }}>
                                        {liveAccumDeltaSec < 0 ? "↓" : "↑"}
                                      </span>
                                      <span className="text-[13px] font-black" style={{ color: liveAccumDeltaSec < 0 ? "#00C851" : "#FF3131", fontFamily: "JetBrains Mono, monospace" }}>
                                        {Math.floor(Math.abs(liveAccumDeltaSec) / 60)}m {String(Math.abs(liveAccumDeltaSec) % 60).padStart(2, "0")}s
                                      </span>
                                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: liveAccumDeltaSec < 0 ? "#00C851" : "#FF3131" }}>
                                        {liveAccumDeltaSec < 0 ? "ganando" : "perdiendo"}
                                      </span>
                                    </div>
                                  )}
                                  {/* Reloj del Futuro — siempre visible, "—" si sin datos */}
                                  <div className="flex justify-between items-center px-1 pt-0.5">
                                    <div>
                                      <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: "#00FFC3", opacity: 0.6 }}>TERMINA A LAS</p>
                                      <p className="text-[11px] font-black" style={{ color: futuroSubLabel === "—" ? "rgba(100,116,139,0.6)" : "#00FFC3", fontFamily: "JetBrains Mono, monospace" }}>{futuroSubLabel}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[7px] font-black uppercase tracking-widest text-slate-500">CICLO GLOBAL</p>
                                      <p className="text-[11px] font-black" style={{ color: futuroCicloLabel === "—" ? "rgba(100,116,139,0.6)" : "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>{futuroCicloLabel}</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Cantidad lograda input if applicable */}
                                {activeSub.cantidadObjetivo && (
                                  <div className="space-y-2">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">Cant. lograda</span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => setCantidadRealizada(v => String(Math.max(0, Number(v) - 1)))}
                                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl transition-all active:scale-95"
                                          style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.35)" }}
                                          data-testid={`button-sub-decrement-${activeSub.id}`}
                                        >−</button>
                                        <input
                                          type="number"
                                          value={cantidadRealizada}
                                          onChange={e => setCantidadRealizada(e.target.value)}
                                          placeholder="0"
                                          className="flex-1 bg-black/30 text-white text-sm p-2 rounded border border-white/10 focus:outline-none text-center font-bold"
                                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                                          data-testid={`input-sub-cantidad-${activeSub.id}`}
                                        />
                                        <button
                                          onClick={() => setCantidadRealizada(v => String(Number(v) + 1))}
                                          className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl transition-all active:scale-95"
                                          style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.35)" }}
                                          data-testid={`button-sub-increment-${activeSub.id}`}
                                        >+</button>
                                      </div>
                                    </div>
                                    {subVehicleRestante !== null && activeSub.tiempoRecordMinPerUnit ? (
                                      <div className="text-center py-1">
                                        <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#8B5CF6", fontFamily: "monospace", opacity: 0.7 }}>RESTANTE</p>
                                        <span className="text-3xl font-black tracking-wider" style={{ color: subVehicleRestante === 0 ? "#22C55E" : "#8B5CF6", fontFamily: "JetBrains Mono, monospace", textShadow: subVehicleRestante === 0 ? "0 0 12px rgba(34,197,94,0.5)" : "0 0 12px rgba(139,92,246,0.5)" }}>
                                          {subVehicleRestante}
                                        </span>
                                        <p className="text-[8px] mt-0.5" style={{ color: "rgba(139,92,246,0.5)", fontFamily: "monospace" }}>
                                          Ritmo: {activeSub.tiempoRecordMinPerUnit.toFixed(1)} min/unidad (récord)
                                        </p>
                                        {subVehicleRestante === 0 && (
                                          <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#22C55E", fontFamily: "monospace" }}>OBJETIVO ALCANZADO</p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center py-1">
                                        <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#8B5CF6", fontFamily: "monospace", opacity: 0.7 }}>RESTANTE</p>
                                        <span className="text-3xl font-black tracking-wider" style={{ color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace", textShadow: "0 0 12px rgba(139,92,246,0.5)" }}>
                                          {Math.max(0, activeSub.cantidadObjetivo - (Number(cantidadRealizada) || 0))}
                                        </span>
                                        <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                                          Sin récord · primer ciclo
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {/* Cumplido / Fallado buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playWarDrum();
                                      const now = Date.now();
                                      const allSubs = [...(vehicle.subVehiculos || [])];
                                      const idx = allSubs.findIndex(s => s.id === activeSub.id);
                                      if (idx === -1) return;
                                      const duracionCompletado = allSubs[idx].aperturaAt ? Math.floor((now - allSubs[idx].aperturaAt!) / 1000) : undefined;
                                      // Celebración de tiempo ganado — usa el tiempoSugeridoSeg propio (calculado al lanzar)
                                      const propioSugeridoSeg = allSubs[idx].tiempoSugeridoSeg;
                                      if (duracionCompletado !== undefined && propioSugeridoSeg !== undefined && duracionCompletado < propioSugeridoSeg) {
                                        const ganado = propioSugeridoSeg - duracionCompletado;
                                        if (tiempoGanadoTimerRef.current) clearTimeout(tiempoGanadoTimerRef.current);
                                        setTiempoGanado(ganado);
                                        setTiempoGanadoKey(k => k + 1);
                                        setShowTiempoGanado(true);
                                        tiempoGanadoTimerRef.current = setTimeout(() => { setShowTiempoGanado(false); tiempoGanadoTimerRef.current = null; }, 4000);
                                      }
                                      allSubs[idx] = {
                                        ...allSubs[idx],
                                        status: "cumplido",
                                        cierreAt: now,
                                        duracionFinal: duracionCompletado,
                                        ...(activeSub.cantidadObjetivo ? { cantidadLograda: Number(cantidadRealizada) || 0 } : {})
                                      };
                                      const nextPending = allSubs.findIndex((s, i) => i > idx && s.status === "pendiente");
                                      if (nextPending !== -1) allSubs[nextPending] = {
                                        ...allSubs[nextPending],
                                        status: "activo",
                                        aperturaAt: now,
                                        // tiempoSugeridoSeg ya está calculado desde el récord propio al lanzar
                                      };
                                      if (onDesglosadorUpdate) onDesglosadorUpdate(vehicle.id, allSubs);
                                      const allDone = allSubs.every(s => s.status === "cumplido" || s.status === "fallado");
                                      if (allDone) setDesglosadorSummary(true);
                                      setCantidadRealizada("");
                                    }}
                                    className="py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                    style={{ backgroundColor: "rgba(0,200,81,0.15)", color: "#00C851", border: "1px solid rgba(0,200,81,0.3)" }}
                                    data-testid={`button-sub-cumplido-${activeSub.id}`}
                                  >
                                    <CheckCircle2 size={12} /> Cumplido
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playWarDrum();
                                      const now = Date.now();
                                      const allSubs = [...(vehicle.subVehiculos || [])];
                                      const idx = allSubs.findIndex(s => s.id === activeSub.id);
                                      if (idx === -1) return;
                                      const duracionFallado = allSubs[idx].aperturaAt ? Math.floor((now - allSubs[idx].aperturaAt!) / 1000) : undefined;
                                      allSubs[idx] = {
                                        ...allSubs[idx],
                                        status: "fallado",
                                        cierreAt: now,
                                        duracionFinal: duracionFallado
                                      };
                                      const nextPending = allSubs.findIndex((s, i) => i > idx && s.status === "pendiente");
                                      if (nextPending !== -1) allSubs[nextPending] = {
                                        ...allSubs[nextPending],
                                        status: "activo",
                                        aperturaAt: now,
                                        // tiempoSugeridoSeg ya está calculado desde el récord propio al lanzar
                                      };
                                      if (onDesglosadorUpdate) onDesglosadorUpdate(vehicle.id, allSubs);
                                      const allDone = allSubs.every(s => s.status === "cumplido" || s.status === "fallado");
                                      if (allDone) setDesglosadorSummary(true);
                                      setCantidadRealizada("");
                                    }}
                                    className="py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                    style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                                    data-testid={`button-sub-fallado-${activeSub.id}`}
                                  >
                                    <XCircle size={12} /> Fallado
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pending sub-vehicles — compact */}
                          {pendientes.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-1">Pendientes ({pendientes.length})</p>
                              {pendientes.map((sv) => (
                                <div key={sv.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", opacity: 0.55 }}>
                                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border" style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                                  <span className="text-[10px] text-slate-400 flex-1">{cleanSubTitulo(sv.titulo)}</span>
                                  {sv.cantidadObjetivo && <span className="text-[8px] text-slate-600 font-mono">/{sv.cantidadObjetivo}</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Projection panel — shown while active sub exists */}
                          {activeSub && (() => {
                            const activeElapsed = activeSub.aperturaAt ? Math.floor((Date.now() - activeSub.aperturaAt) / 1000) : 0;
                            const completedDurs = terminados.filter(s => s.duracionFinal).map(s => s.duracionFinal!);
                            const avgDur = completedDurs.length > 0 ? Math.round(completedDurs.reduce((a, b) => a + b, 0) / completedDurs.length) : 0;
                            const projectedActiveDur = activeSub.tiempoSugeridoSeg ?? avgDur;
                            const projectedRemaining = Math.max(0, projectedActiveDur - activeElapsed) + avgDur * pendientes.length;
                            const deltaData = terminados.filter(s => s.duracionFinal !== undefined && s.tiempoSugeridoSeg !== undefined);
                            const deltaTotalSec = deltaData.reduce((acc, s) => acc + (s.duracionFinal! - s.tiempoSugeridoSeg!), 0);
                            const hasRef = terminados.some(s => s.tiempoSugeridoSeg !== undefined);
                            const ganando = deltaTotalSec < -5;
                            const perdiendo = deltaTotalSec > 5;
                            const deltaColor = ganando ? "#00C851" : perdiendo ? "#FF3131" : "#D4AF37";
                            const deltaLabel = ganando ? "↓ ganando" : perdiendo ? "↑ perdiendo" : "→ estable";
                            // Reloj de Futuro — usa estado calculado cada tick desde el timer
                            const futureClockColor = perdiendo && deltaTotalSec > 300 ? "#FF3131" : "#F97316";
                            const noSuggested = !subs.some(s => s.tiempoSugeridoSeg !== undefined);
                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: `${futureClockColor}08`, borderColor: `${futureClockColor}30` }}>
                                  <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: futureClockColor }}>🔮 FIN PROYECTADO</p>
                                  {horaFinProyectada && !noSuggested ? (
                                    <>
                                      <motion.p
                                        key={horaFinProyectada}
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                                        className="text-base font-black leading-tight"
                                        style={{ color: futureClockColor, fontFamily: "JetBrains Mono, monospace" }}
                                      >
                                        {horaFinProyectada}
                                      </motion.p>
                                      {horaFinRemainSec !== null && (
                                        <p className="text-[7px] text-slate-500 mt-0.5">en {(() => { const h = Math.floor(horaFinRemainSec / 3600); const m = Math.floor((horaFinRemainSec % 3600) / 60); return h > 0 ? `${h}h ${String(m).padStart(2,'0')}min` : `${m}min ${String(horaFinRemainSec % 60).padStart(2,'0')}s`; })()}</p>
                                      )}
                                      {horaFinDeltaSec !== 0 && (
                                        <p className="text-[7px] font-bold mt-0.5" style={{ color: horaFinDeltaSec < 0 ? "#00C851" : "#FF3131" }}>
                                          {horaFinDeltaSec < 0 ? `−${Math.floor(Math.abs(horaFinDeltaSec)/60).toString().padStart(2,'0')}:${String(Math.abs(horaFinDeltaSec)%60).padStart(2,'0')} · ganando` : `+${Math.floor(horaFinDeltaSec/60).toString().padStart(2,'0')}:${String(horaFinDeltaSec%60).padStart(2,'0')} · perdiendo`}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="relative inline-flex items-center justify-center">
                                        <Clock size={16} style={{ color: "rgba(100,116,139,0.4)" }} />
                                        <span className="absolute text-[10px] font-black" style={{ color: "rgba(100,116,139,0.5)" }}>✕</span>
                                      </div>
                                      <p className="text-[7px] text-slate-600">Sin proyección</p>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.25)" }}>
                                  <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: "#8B5CF6" }}>📈 PROYECCIÓN</p>
                                  <p className="text-base font-black" style={{ color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>
                                    {projectedRemaining > 0 ? `+${fmtSec(projectedRemaining)}` : fmtSec(0)}
                                  </p>
                                  {hasRef ? (
                                    <p className="text-[7px] font-bold mt-0.5" style={{ color: deltaColor }}>
                                      {deltaData.length > 0 ? `${deltaTotalSec <= 0 ? "−" : "+"}${fmtSec(Math.abs(deltaTotalSec))} · ` : ""}{deltaLabel}
                                    </p>
                                  ) : (
                                    <p className="text-[7px] text-slate-500 mt-0.5">sin ref. aún</p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Terminados group — always below pending */}
                          {terminados.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 px-1">
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Terminados ({terminados.length})</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                              </div>
                              {terminados.map((sv) => {
                                const isCumplido = sv.status === "cumplido";
                                const deltaSv = sv.duracionFinal && sv.tiempoSugeridoSeg ? sv.duracionFinal - sv.tiempoSugeridoSeg : null;
                                return (
                                  <div key={sv.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: isCumplido ? "rgba(0,200,81,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${isCumplido ? "rgba(0,200,81,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                                    {isCumplido ? <CheckCircle2 size={10} style={{ color: "#00C851" }} /> : <XCircle size={10} className="text-red-400" />}
                                    <span className="text-[10px] font-bold text-slate-300 flex-1">{cleanSubTitulo(sv.titulo)}</span>
                                    {sv.cantidadLograda !== undefined && <span className="text-[8px]" style={{ color: "#D4AF37" }}>{sv.cantidadLograda}/{sv.cantidadObjetivo}</span>}
                                    {sv.duracionFinal && <span className="text-[8px] text-slate-500 font-mono">{fmtSec(sv.duracionFinal)}</span>}
                                    {deltaSv !== null && (
                                      <span className="text-[7px] font-black" style={{ color: deltaSv <= 0 ? "#00C851" : "#FF3131" }}>
                                        {deltaSv <= 0 ? `−${fmtSec(Math.abs(deltaSv))}` : `+${fmtSec(deltaSv)}`}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}

              {vehicle.status === "activo" && timerDisplay && tipoFlota !== "verdad" && (tipoFlota !== "descanso" || showDescansoReloj) && vehicle.tipoReloj !== "manual" && (tipoFlota !== "situacion" || (vehicle.situacionCronometro?.activo === true && sumMinutosCronometroPendientes(vehicle.subTareas || []) > 0)) && (
                <div className="pt-3">
                  <div className="p-3 rounded-xl border text-center" style={{
                    backgroundColor: timerExpired ? "rgba(153,27,27,0.15)" : `${VERDE}08`,
                    borderColor: timerExpired ? "#991b1b" : `${VERDE}40`,
                    boxShadow: timerExpired ? "0 0 20px rgba(153,27,27,0.3)" : `0 0 15px ${VERDE}15`
                  }}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Timer size={12} style={{ color: timerExpired ? "#ef4444" : VERDE }} />
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: timerExpired ? "#ef4444" : VERDE }}>
                        {vehicle.tipoReloj === "investigador" ? "CRONÓMETRO LIBRE" : timerExpired ? (tipoFlota === "descanso" ? "DESCANSO EN DEUDA" : "TIEMPO EN DEUDA") : "CUENTA REGRESIVA"}
                      </span>
                    </div>
                    {!timerExpired ? (
                      <span className="text-2xl font-black tracking-wider" style={{ color: VERDE, fontFamily: "JetBrains Mono, monospace" }}>{timerDisplay}</span>
                    ) : (
                      <div>
                        <span className="text-sm text-slate-600 line-through" style={{ fontFamily: "JetBrains Mono, monospace" }}>00:00:00</span>
                        {debtDisplay && (
                          <div className="mt-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-red-500 block mb-0.5">DEUDA ACUMULADA</span>
                            <span className="text-2xl font-black tracking-wider" style={{ color: "#ef4444", fontFamily: "JetBrains Mono, monospace", textShadow: "0 0 15px rgba(239,68,68,0.4)" }}>+{debtDisplay}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {targetTimeLabel && (
                      <p className="text-[9px] mt-1" style={{ color: timerExpired ? "#ef4444" : VERDE }}>
                        Objetivo: {targetTimeLabel} {tipoFlota === "descanso" && "(+5 min tolerancia)"}
                      </p>
                    )}
                    {(vehicle.parentesisRecarga || []).length > 0 && (
                      <p className="text-[8px] mt-1" style={{ color: VERDE }}>Paréntesis: +{(vehicle.parentesisRecarga || []).reduce((s, p) => s + p.duracionMin, 0)} min</p>
                    )}
                  </div>
                  {(vehicle.tipoReloj === "produccion" || vehicle.tipoReloj === "investigador") && remainingUnits !== null && (
                    <div className="mt-2 pt-2 border-t text-center" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
                      <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#8B5CF6", fontFamily: "monospace", opacity: 0.7 }}>RESTANTE</p>
                      <span className="text-3xl font-black tracking-wider" style={{ color: remainingUnits === 0 ? "#22C55E" : "#8B5CF6", fontFamily: "JetBrains Mono, monospace", textShadow: remainingUnits === 0 ? "0 0 12px rgba(34,197,94,0.5)" : "0 0 12px rgba(139,92,246,0.5)" }}>
                        {remainingUnits}
                      </span>
                      {remainingUnits === 0 && (
                        <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#22C55E", fontFamily: "monospace" }}>OBJETIVO ALCANZADO</p>
                      )}
                      {vehicle.tipoReloj === "investigador" && (() => {
                        const hist = getHistoricalVehicleData(vehicle.titulo);
                        const mpu = hist.bestMinPerUnit ?? hist.lastMinPerUnit;
                        return mpu ? (
                          <p className="text-[8px] mt-1" style={{ color: "rgba(139,92,246,0.6)", fontFamily: "monospace" }}>
                            Ritmo: {mpu.toFixed(1)} min/unidad (récord)
                          </p>
                        ) : null;
                      })()}
                    </div>
                  )}
                  {vehicle.tipoReloj === "investigador" && vehicle.cantidadObjetivo && remainingUnits === null && (() => {
                    const hist = getHistoricalVehicleData(vehicle.titulo);
                    const mpu = hist.bestMinPerUnit ?? hist.lastMinPerUnit;
                    if (mpu) return null;
                    return (
                      <div className="mt-2 pt-2 border-t text-center" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
                        <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                          Sin récord · primer ciclo
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {timerExpired && vehicle.status === "activo" && (tipoFlota === "tiempo" || vehicle.tipoTerminoRapido === "hora") && (
                <div className="p-3 rounded-xl border-2" style={{ backgroundColor: "rgba(153,27,27,0.15)", borderColor: "#991b1b", boxShadow: "0 0 20px rgba(153,27,27,0.3)" }} data-testid={`sombra-${vehicle.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Skull size={14} style={{ color: "#991b1b" }} />
                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#991b1b" }}>ESPEJO DE LA SOMBRA</span>
                  </div>
                  <p className="text-[10px] text-red-300 italic leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>El tiempo ha devorado tu intención. Tu energía se dispersa. ¿Eres el amo o el esclavo de este segmento?</p>
                  {!showJustificacion ? (
                    <button onClick={() => setShowJustificacion(true)} className="mt-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all" style={{ backgroundColor: "rgba(153,27,27,0.3)", color: "#fca5a5", border: "1px solid #991b1b" }} data-testid={`button-justificar-toggle-${vehicle.id}`}>Justificar exceso</button>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <textarea value={justificacionText} onChange={(e) => setJustificacionText(e.target.value)} placeholder="¿Qué causó el desvío? Sé honesto..." className="w-full p-2 rounded-lg bg-black/60 border text-white text-xs resize-none placeholder:text-slate-600" style={{ borderColor: "#991b1b" }} rows={2} data-testid={`textarea-justificacion-${vehicle.id}`} />
                      <button onClick={() => { if (onJustificar && justificacionText.trim()) { onJustificar(vehicle.id, justificacionText.trim()); setShowJustificacion(false); setJustificacionText(""); } }} disabled={!justificacionText.trim()} className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50" style={{ backgroundColor: "#991b1b", color: "#fca5a5" }} data-testid={`button-reclamar-soberania-${vehicle.id}`}>Reclamar Soberanía</button>
                    </div>
                  )}
                </div>
              )}

              {timerExpired && vehicle.status === "activo" && tipoFlota === "descanso" && vehicle.tipoDescanso !== "reset_profundo" && vehicle.tipoDescanso !== "punto_cero" && (
                <div className="p-3 rounded-xl border-2" style={{ backgroundColor: "rgba(153,27,27,0.15)", borderColor: "#991b1b", boxShadow: "0 0 20px rgba(153,27,27,0.3)" }} data-testid={`sombra-descanso-${vehicle.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Skull size={14} style={{ color: "#991b1b" }} />
                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#991b1b" }}>DESCANSO EN DEUDA</span>
                  </div>
                  <p className="text-[10px] text-red-300 italic leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>El descanso se ha extendido más allá de su ventana. La tolerancia ha sido superada.</p>
                  {!showJustificacion ? (
                    <button onClick={() => setShowJustificacion(true)} className="mt-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all" style={{ backgroundColor: "rgba(153,27,27,0.3)", color: "#fca5a5", border: "1px solid #991b1b" }}>Justificar exceso</button>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <textarea value={justificacionText} onChange={(e) => setJustificacionText(e.target.value)} placeholder="¿Por qué se extendió el descanso?" className="w-full p-2 rounded-lg bg-black/60 border text-white text-xs resize-none placeholder:text-slate-600" style={{ borderColor: "#991b1b" }} rows={2} />
                      <button onClick={() => { if (onJustificar && justificacionText.trim()) { onJustificar(vehicle.id, justificacionText.trim()); setShowJustificacion(false); setJustificacionText(""); } }} disabled={!justificacionText.trim()} className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50" style={{ backgroundColor: "#991b1b", color: "#fca5a5" }}>Reclamar Soberanía</button>
                    </div>
                  )}
                </div>
              )}

              {tipoFlota === "situacion" && vehicle.status === "activo" && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: "rgba(148,163,184,0.08)", borderColor: "rgba(148,163,184,0.3)" }} data-testid={`subtareas-${vehicle.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flag size={12} style={{ color: PLATA }} />
                      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: PLATA }}>Desglosar Situación</span>
                      {(vehicle.subTareas || []).length > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(148,163,184,0.2)", color: PLATA }}>{completedSubTareas}/{(vehicle.subTareas || []).length}</span>}
                    </div>
                    {(vehicle.subTareas || []).length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSubTasksCollapsed(c => !c); }}
                        className="p-1 rounded-md transition-colors hover:bg-white/10"
                        data-testid={`button-collapse-subtareas-${vehicle.id}`}
                      >
                        {subTasksCollapsed ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronUp size={11} className="text-slate-400" />}
                      </button>
                    )}
                  </div>
                  <p className="text-[7px] text-slate-600 leading-snug mb-2 px-0.5 border-l-2 pl-2" style={{ borderColor: "rgba(148,163,184,0.35)" }}>
                    Lista libre: +2 PS al completar (sin tiempo madre). Selecciona filas y «Llevar al desglose con tiempo»: +4 PS por fila, +5′ desde la siguiente pendiente del cronómetro, 3 pitidos a 2 min del cupo de la fila en foco, timbres al marcar cumplido (orden). Ajustar hora fin redistribuye los MIN (opción B).
                  </p>
                  {(() => {
                    void situacionCupoUiTick;
                    const anchor = vehicle.situacionCupoAnchor;
                    const subs = vehicle.subTareas || [];
                    if (!anchor?.subTareaId || subs.length === 0) return null;
                    const st = subs.find(s => s.id === anchor.subTareaId);
                    if (!st || !(st.minutosCupo && st.minutosCupo > 0)) return null;
                    if (st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") !== "pendiente") return null;
                    if (!st.enDesgloseCronometro && st.completada) return null;
                    const limitSec = st.minutosCupo * 60;
                    const elapsedSec = Math.max(0, Math.floor((Date.now() - anchor.startedAt) / 1000));
                    const remainSec = Math.max(0, limitSec - elapsedSec);
                    const rm = Math.floor(remainSec / 60);
                    const rs = remainSec % 60;
                    const cronList = subs.filter(s => s.enDesgloseCronometro);
                    const idx = (st.enDesgloseCronometro ? cronList : subs).findIndex(s => s.id === st.id) + 1;
                    return (
                      <p className="text-[8px] font-mono mb-1.5" style={{ color: "rgba(212,175,55,0.9)" }} data-testid={`situacion-cupo-countdown-${vehicle.id}`}>
                        Fila foco #{idx} · {String(rm).padStart(2, "0")}:{String(rs).padStart(2, "0")} / {st.minutosCupo} min
                      </p>
                    );
                  })()}
                  {vehicle.situacionCronometro?.activo === true && (
                    <p className="text-[7px] font-mono mb-1.5" style={{ color: "rgba(148,163,184,0.75)" }}>
                      Σ cupos pendientes (cronómetro): {sumMinutosCronometroPendientes(vehicle.subTareas || [])} min
                      {vehicle.situacionCronometro?.horaFinMs != null && (
                        <span className="ml-2">· fin {new Date(vehicle.situacionCronometro.horaFinMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </p>
                  )}
                  {vehicle.situacionCronometro?.activo === true && onSituacionCronometroSetHoraFin && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap" onClick={e => e.stopPropagation()}>
                      <span className="text-[7px] font-black uppercase text-slate-500">Nueva hora fin</span>
                      <input
                        type="text"
                        placeholder="HH:MM"
                        className="w-16 px-1 py-0.5 rounded text-[9px] bg-black/50 border text-white font-mono"
                        style={{ borderColor: "rgba(148,163,184,0.35)" }}
                        onBlur={(e) => {
                          const t = e.target.value.trim();
                          if (t) onSituacionCronometroSetHoraFin(vehicle.id, t);
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2 mb-2">
                    <input value={newSubTarea} onChange={(e) => setNewSubTarea(e.target.value)} placeholder="Nueva sub-tarea..." className="flex-1 p-2 rounded-lg bg-black/40 border text-white text-[10px] placeholder:text-slate-600 focus:outline-none" style={{ borderColor: "rgba(148,163,184,0.2)" }} data-testid={`input-subtarea-${vehicle.id}`} />
                    <button onClick={() => { if (onAddSubTarea && newSubTarea.trim()) { onAddSubTarea(vehicle.id, newSubTarea.trim()); setNewSubTarea(""); } }} disabled={!newSubTarea.trim()} className="px-2 py-1 rounded-lg transition-all disabled:opacity-30" style={{ backgroundColor: "rgba(148,163,184,0.2)", color: PLATA }} data-testid={`button-add-subtarea-${vehicle.id}`}><Plus size={14} /></button>
                  </div>
                  <AnimatePresence>
                    {!subTasksCollapsed && (vehicle.subTareas || []).length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          {(() => {
                            const all = vehicle.subTareas || [];
                            const subsLibre = all.filter(s => !s.enDesgloseCronometro);
                            const subsCron = all.filter(s => s.enDesgloseCronometro);
                            return (
                              <>
                                {onMoveSubTareasToCronometro && subsLibre.some(s => !s.completada) && (
                                  <button
                                    type="button"
                                    disabled={situacionLibreSeleccion.size === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMoveSubTareasToCronometro(vehicle.id, [...situacionLibreSeleccion]);
                                      setSituacionLibreSeleccion(new Set());
                                    }}
                                    className="w-full py-1.5 mb-1 rounded-lg text-[8px] font-black uppercase tracking-wider disabled:opacity-40"
                                    style={{ backgroundColor: "rgba(212,175,55,0.15)", color: GOLD, border: "1px solid rgba(212,175,55,0.35)" }}
                                  >
                                    Llevar al desglose con tiempo ({situacionLibreSeleccion.size} sel.)
                                  </button>
                                )}
                                {subsLibre.length > 0 && (
                                  <p className="text-[7px] font-black uppercase tracking-wider text-slate-500 px-0.5">Lista libre · +2 PS</p>
                                )}
                                {subsLibre.map((st, stIdx) => {
                            const detalles = st.detalles || [];
                            const entregados = detalles.filter(d => d.entregado).length;
                            const isDetalleExpanded = expandedDetalleStId === st.id;
                            return (
                              <div key={st.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                                <div className="flex flex-col gap-1 p-1.5">
                                  <div className="flex items-center gap-2">
                                    {onMoveSubTareasToCronometro && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSituacionLibreSeleccion(prev => {
                                            const n = new Set(prev);
                                            if (n.has(st.id)) n.delete(st.id);
                                            else n.add(st.id);
                                            return n;
                                          });
                                        }}
                                        className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                                        style={{
                                          borderColor: situacionLibreSeleccion.has(st.id) ? CYAN : "rgba(148,163,184,0.4)",
                                          backgroundColor: situacionLibreSeleccion.has(st.id) ? "rgba(0,255,195,0.12)" : "transparent",
                                        }}
                                        title="Seleccionar para cronómetro"
                                      >
                                        {situacionLibreSeleccion.has(st.id) ? <Check size={10} style={{ color: CYAN }} /> : null}
                                      </button>
                                    )}
                                    <button onClick={() => onToggleSubTarea?.(vehicle.id, st.id)} className="flex items-center gap-2 flex-1 text-left min-w-0" data-testid={`subtarea-${st.id}`}>
                                      <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" style={{ borderColor: st.completada ? VERDE : "rgba(148,163,184,0.4)", backgroundColor: st.completada ? `${VERDE}20` : "transparent" }}>
                                        {st.completada && <Check size={10} style={{ color: VERDE }} />}
                                      </div>
                                      <span className={`text-[10px] leading-tight flex-1 min-w-0 ${st.completada ? "line-through text-slate-600" : "text-slate-300"}`}>
                                        <span className="text-[8px] mr-1" style={{ color: PLATA }}>{stIdx + 1}.</span>
                                        {st.texto}
                                      </span>
                                    </button>
                                    {arquitectoUnlocked && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setExpandedDetalleStId(isDetalleExpanded ? null : st.id); }}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex-shrink-0 transition-all"
                                        style={{ backgroundColor: detalles.length > 0 ? "rgba(0,255,195,0.1)" : "rgba(148,163,184,0.1)", color: detalles.length > 0 ? CYAN : PLATA, border: `1px solid ${detalles.length > 0 ? "rgba(0,255,195,0.3)" : "rgba(148,163,184,0.2)"}` }}
                                        data-testid={`button-toggle-detalles-${st.id}`}
                                      >
                                        ⚡ {detalles.length} · {entregados} PS
                                        {isDetalleExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {arquitectoUnlocked && isDetalleExpanded && (
                                  <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(0,255,195,0.1)" }}>
                                    <div className="flex gap-1.5 mt-2 mb-1.5">
                                      <input
                                        value={newDetalleTexts[st.id] || ""}
                                        onChange={(e) => setNewDetalleTexts(prev => ({ ...prev, [st.id]: e.target.value }))}
                                        onKeyDown={(e) => { if (e.key === "Enter" && (newDetalleTexts[st.id] || "").trim()) { onAddDetalle?.(vehicle.id, st.id, (newDetalleTexts[st.id] || "").trim()); setNewDetalleTexts(prev => ({ ...prev, [st.id]: "" })); } }}
                                        placeholder="Agregar detalle energético..."
                                        className="flex-1 px-2 py-1 rounded bg-black/40 border text-white text-[9px] placeholder:text-slate-700 focus:outline-none"
                                        style={{ borderColor: "rgba(0,255,195,0.2)", fontFamily: "JetBrains Mono, monospace" }}
                                        data-testid={`input-detalle-${st.id}`}
                                      />
                                      <button
                                        onClick={() => { const t = (newDetalleTexts[st.id] || "").trim(); if (t) { onAddDetalle?.(vehicle.id, st.id, t); setNewDetalleTexts(prev => ({ ...prev, [st.id]: "" })); } }}
                                        disabled={!(newDetalleTexts[st.id] || "").trim()}
                                        className="px-1.5 rounded transition-all disabled:opacity-30"
                                        style={{ backgroundColor: "rgba(0,255,195,0.15)", color: CYAN }}
                                        data-testid={`button-add-detalle-${st.id}`}
                                      ><Plus size={11} /></button>
                                    </div>
                                    {detalles.length > 0 && (
                                      <div className="space-y-1">
                                        {detalles.map((d, dIdx) => (
                                          <button
                                            key={d.id}
                                            onClick={() => !d.entregado && onEntregarDetalle?.(vehicle.id, st.id, d.id)}
                                            disabled={d.entregado}
                                            className="w-full flex items-center gap-2 p-1 rounded text-left transition-all"
                                            style={{ backgroundColor: d.entregado ? "rgba(212,175,55,0.08)" : "rgba(0,255,195,0.05)", cursor: d.entregado ? "default" : "pointer" }}
                                            data-testid={`detalle-${d.id}`}
                                          >
                                            <span className="text-[9px] w-3 flex-shrink-0" style={{ color: d.entregado ? GOLD : CYAN, fontFamily: "JetBrains Mono, monospace" }}>{dIdx + 1}.</span>
                                            <span className={`text-[9px] flex-1 min-w-0 leading-tight ${d.entregado ? "line-through" : ""}`} style={{ color: d.entregado ? GOLD : "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>{d.texto}</span>
                                            {d.entregado
                                              ? <span className="text-[7px] font-bold flex-shrink-0" style={{ color: GOLD }}>+1 PS</span>
                                              : <span className="text-[7px] flex-shrink-0" style={{ color: CYAN }}>entregar</span>
                                            }
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {detalles.length === 0 && (
                                      <p className="text-[8px] text-center py-1" style={{ color: "rgba(0,255,195,0.3)", fontFamily: "JetBrains Mono, monospace" }}>— sin detalles aún —</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                                {subsCron.length > 0 && (
                                  <p className="text-[7px] font-black uppercase tracking-wider text-slate-500 px-0.5 mt-2">Desglose con tiempo · +4 PS</p>
                                )}
                                {subsCron.map((st, stIdx) => {
                                  const pend = (st.resultadoSituacion ?? "pendiente") === "pendiente";
                                  const detallesCron = st.detalles || [];
                                  const entregadosCron = detallesCron.filter(d => d.entregado).length;
                                  const isDetalleExpandedCron = expandedDetalleStId === st.id;
                                  const lineDone = st.resultadoSituacion === "cumplido" || st.resultadoSituacion === "fallado";
                                  const ok = st.resultadoSituacion === "cumplido";
                                  const bad = st.resultadoSituacion === "fallado";
                                  return (
                                    <div key={st.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: bad ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)", border: bad ? "1px solid rgba(239,68,68,0.2)" : undefined }}>
                                      <div className="flex flex-col gap-1 p-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-[10px] leading-tight flex-1 min-w-0 ${lineDone ? (ok ? "line-through text-slate-600" : "line-through text-red-300/80") : "text-slate-300"}`}>
                                            <span className="text-[8px] mr-1" style={{ color: PLATA }}>{stIdx + 1}.</span>
                                            {st.texto}
                                          </span>
                                          {pend && (
                                            <div className="flex gap-1 flex-shrink-0 flex-wrap">
                                              <button type="button" onClick={(e) => { e.stopPropagation(); onSituacionCronometroCumplido?.(vehicle.id, st.id); }} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ backgroundColor: "rgba(0,200,81,0.15)", color: VERDE, border: "1px solid rgba(0,200,81,0.4)" }}>Cumplido</button>
                                              <button type="button" onClick={(e) => { e.stopPropagation(); onSituacionCronometroFallado?.(vehicle.id, st.id); }} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}>Fallado</button>
                                              {onQuitarSubTareaDeCronometro && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); onQuitarSubTareaDeCronometro(vehicle.id, st.id); }} className="px-1 py-0.5 rounded text-[7px] text-slate-500 border border-slate-600/40">Quitar</button>
                                              )}
                                            </div>
                                          )}
                                          {arquitectoUnlocked && (
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); setExpandedDetalleStId(isDetalleExpandedCron ? null : st.id); }}
                                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex-shrink-0 transition-all"
                                              style={{ backgroundColor: detallesCron.length > 0 ? "rgba(0,255,195,0.1)" : "rgba(148,163,184,0.1)", color: detallesCron.length > 0 ? CYAN : PLATA, border: `1px solid ${detallesCron.length > 0 ? "rgba(0,255,195,0.3)" : "rgba(148,163,184,0.2)"}` }}
                                              data-testid={`button-toggle-detalles-cron-${st.id}`}
                                            >
                                              ⚡ {detallesCron.length} · {entregadosCron} PS
                                              {isDetalleExpandedCron ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                            </button>
                                          )}
                                        </div>
                                        {pend && (onSetSubTareaMinutosCupo || onExtendSituacionCupo) && (
                                          <div className="flex items-center gap-1.5 pl-1 flex-wrap" onClick={e => e.stopPropagation()}>
                                            <span className="text-[7px] font-black uppercase tracking-wider text-slate-500">Min</span>
                                            <input
                                              type="number"
                                              min={0}
                                              max={999}
                                              key={`cupo-cron-${st.id}-${st.minutosCupo ?? "x"}`}
                                              defaultValue={st.minutosCupo ?? ""}
                                              onBlur={(e) => {
                                                const raw = e.target.value.trim();
                                                const n = raw === "" ? undefined : Math.max(0, Math.min(999, parseInt(raw, 10)));
                                                if (raw !== "" && !Number.isFinite(n!)) return;
                                                const prev = st.minutosCupo;
                                                if (raw === "" && (prev === undefined || prev === 0)) return;
                                                if (raw !== "" && n === prev) return;
                                                onSetSubTareaMinutosCupo?.(vehicle.id, st.id, raw === "" ? undefined : n);
                                              }}
                                              className="w-11 px-1 py-0.5 rounded text-[9px] bg-black/50 border text-white text-center font-mono"
                                              style={{ borderColor: "rgba(148,163,184,0.35)" }}
                                              data-testid={`input-subtarea-cupo-cron-${st.id}`}
                                            />
                                            {onExtendSituacionCupo && (
                                              <button
                                                type="button"
                                                onClick={() => onExtendSituacionCupo(vehicle.id, st.id, 5)}
                                                className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide"
                                                style={{ backgroundColor: "rgba(212,175,55,0.12)", color: GOLD, border: "1px solid rgba(212,175,55,0.35)" }}
                                                title="Añade 5 min quitándolos de la siguiente fila con cupo"
                                                data-testid={`button-extend-cupo-cron-${st.id}`}
                                              >
                                                +5′
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {arquitectoUnlocked && isDetalleExpandedCron && (
                                        <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(0,255,195,0.1)" }}>
                                          <div className="flex gap-1.5 mt-2 mb-1.5">
                                            <input
                                              value={newDetalleTexts[st.id] || ""}
                                              onChange={(e) => setNewDetalleTexts(prev => ({ ...prev, [st.id]: e.target.value }))}
                                              onKeyDown={(e) => { if (e.key === "Enter" && (newDetalleTexts[st.id] || "").trim()) { onAddDetalle?.(vehicle.id, st.id, (newDetalleTexts[st.id] || "").trim()); setNewDetalleTexts(prev => ({ ...prev, [st.id]: "" })); } }}
                                              placeholder="Agregar detalle energético..."
                                              className="flex-1 px-2 py-1 rounded bg-black/40 border text-white text-[9px] placeholder:text-slate-700 focus:outline-none"
                                              style={{ borderColor: "rgba(0,255,195,0.2)", fontFamily: "JetBrains Mono, monospace" }}
                                              data-testid={`input-detalle-cron-${st.id}`}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => { const t = (newDetalleTexts[st.id] || "").trim(); if (t) { onAddDetalle?.(vehicle.id, st.id, t); setNewDetalleTexts(prev => ({ ...prev, [st.id]: "" })); } }}
                                              disabled={!(newDetalleTexts[st.id] || "").trim()}
                                              className="px-1.5 rounded transition-all disabled:opacity-30"
                                              style={{ backgroundColor: "rgba(0,255,195,0.15)", color: CYAN }}
                                              data-testid={`button-add-detalle-cron-${st.id}`}
                                            ><Plus size={11} /></button>
                                          </div>
                                          {detallesCron.length > 0 && (
                                            <div className="space-y-1">
                                              {detallesCron.map((d, dIdx) => (
                                                <button
                                                  key={d.id}
                                                  type="button"
                                                  onClick={() => !d.entregado && onEntregarDetalle?.(vehicle.id, st.id, d.id)}
                                                  disabled={d.entregado}
                                                  className="w-full flex items-center gap-2 p-1 rounded text-left transition-all"
                                                  style={{ backgroundColor: d.entregado ? "rgba(212,175,55,0.08)" : "rgba(0,255,195,0.05)", cursor: d.entregado ? "default" : "pointer" }}
                                                  data-testid={`detalle-cron-${d.id}`}
                                                >
                                                  <span className="text-[9px] w-3 flex-shrink-0" style={{ color: d.entregado ? GOLD : CYAN, fontFamily: "JetBrains Mono, monospace" }}>{dIdx + 1}.</span>
                                                  <span className={`text-[9px] flex-1 min-w-0 leading-tight ${d.entregado ? "line-through" : ""}`} style={{ color: d.entregado ? GOLD : "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>{d.texto}</span>
                                                  {d.entregado
                                                    ? <span className="text-[7px] font-bold flex-shrink-0" style={{ color: GOLD }}>+1 PS</span>
                                                    : <span className="text-[7px] flex-shrink-0" style={{ color: CYAN }}>entregar</span>}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                          {detallesCron.length === 0 && (
                                            <p className="text-[8px] text-center py-1" style={{ color: "rgba(0,255,195,0.3)", fontFamily: "JetBrains Mono, monospace" }}>— sin detalles aún —</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {tipoFlota === "descanso" && vehicle.status === "activo" && (() => {
                const TIPO_LABELS: Record<string, string> = { intercepcion: "INTERCEPCIÓN", microcarga: "MICRO-CARGA", reset_profundo: "RESET PROFUNDO", punto_cero: "PUNTO CERO" };
                const TIPO_SUBLABELS: Record<string, string> = { intercepcion: "Pausa técnica", microcarga: "Siesta activa", reset_profundo: "Reset profundo", punto_cero: "Polo Neutro" };
                const tipoLabel = vehicle.tipoDescanso ? TIPO_LABELS[vehicle.tipoDescanso] : "RECARGA ACTIVA";
                const tipoSublabel = vehicle.tipoDescanso ? TIPO_SUBLABELS[vehicle.tipoDescanso] : "Recarga en curso";
                const primerAccionMs = vehicle.primerAccionAt;
                const aperturaMs = vehicle.aperturaAt || Date.now();
                const eficienciaSec = primerAccionMs ? Math.round((primerAccionMs - aperturaMs) / 1000) : null;
                const esPuntoCero = vehicle.tipoDescanso === "punto_cero";

                if (esPuntoCero) {
                  const ep = vehicle.etapasPuntoCero || { etapa1: false, etapa2: false, etapa3: false, etapa4: false };
                  const epCompletados = [ep.etapa1, ep.etapa2, ep.etapa3, ep.etapa4].filter(Boolean).length;
                  const ARCOIRIS = [
                    { color: "#FF3131", zona: "Raíz" },
                    { color: "#FF8C00", zona: "Sacro" },
                    { color: "#FFD700", zona: "Plexo Solar" },
                    { color: "#22C55E", zona: "Corazón" },
                    { color: "#3B82F6", zona: "Garganta" },
                    { color: "#6366F1", zona: "Tercer Ojo" },
                    { color: "#8B5CF6", zona: "Corona" },
                  ];
                  const etapasCfg = [
                    { key: "etapa1" as const, num: 1, label: "Tensión y quietud del cuerpo", instruccion: "Antes de la quietud: tensá el cuerpo por zonas en este orden — empezá por la cabeza; seguí bajando por el torso y las piernas hasta que el penúltimo foco sean los pies y el último las manos. Soltá todo y sentí el alivio agradable. Recién entonces quedate en quietud física total.", Icon: Circle },
                    { key: "etapa2" as const, num: 2, label: "Identificación del Pensamiento", instruccion: "¿Qué estoy pensando? Lo identifico → apago ese movimiento mental.", Icon: Brain },
                    { key: "etapa3" as const, num: 3, label: "Ritmo, polos y apnea", instruccion: "Primero: tomá conciencia del ritmo de tu respiración tal como está, sin corregirla. Después: jugá con polos opuestos (inhalá lleno / exhalá vacío, o el par que uses en tu práctica). Al final: retené la respiración unos segundos a tu medida y mantené sin aire con calma.", Icon: Wind },
                    { key: "etapa4" as const, num: 4, label: "Alimento de Colores", instruccion: "Toca cada color para inhalarlo e introducirlo a su zona.", Icon: Sparkles },
                  ];
                  const todosColoresConfirmados = coloresConfirmados.every(Boolean);
                  return (
                    <div className="space-y-2" data-testid={`descanso-msg-${vehicle.id}`}>
                      <div className="p-3 rounded-xl border" style={{ backgroundColor: `${flotaColor}08`, borderColor: `${flotaColor}30` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Circle size={14} style={{ color: flotaColor }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: flotaColor }}>PUNTO CERO</span>
                          <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${flotaColor}15`, color: flotaColor }}>{epCompletados}/4 PS</span>
                          <button onClick={() => setShowDescansoReloj(v => !v)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all" style={{ backgroundColor: showDescansoReloj ? `${flotaColor}20` : "transparent", borderColor: showDescansoReloj ? flotaColor : "rgba(255,255,255,0.15)", color: showDescansoReloj ? flotaColor : "#64748b" }} data-testid={`toggle-reloj-descanso-${vehicle.id}`} title={showDescansoReloj ? "Ocultar reloj" : "Ver reloj"}>
                            <Clock size={10} />
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 italic">Polo Neutro{showDescansoReloj ? " · Reloj activo" : " · Reloj oculto"}</p>
                        {eficienciaSec !== null && (
                          <p className="text-[8px] mt-1" style={{ color: flotaColor }}>⚡ Primera etapa: {eficienciaSec < 60 ? `${eficienciaSec}s` : `${Math.round(eficienciaSec / 60)}m`} desde apertura</p>
                        )}
                      </div>
                      {showMicroPasos && (
                        <div className="space-y-1.5">
                          {etapasCfg.map(({ key, num, label, instruccion, Icon: EtapaIcon }) => {
                            const checked = ep[key];
                            const isColorEtapa = key === "etapa4";
                            const colorCount = coloresConfirmados.filter(Boolean).length;
                            const prevRequired = key === "etapa2" ? !ep.etapa1 : key === "etapa3" ? !ep.etapa2 : key === "etapa4" ? (!ep.etapa3 || !todosColoresConfirmados) : false;
                            const isLocked = !checked && prevRequired;
                            return (
                              <div key={key}>
                                <button
                                  onClick={() => {
                                    if (checked || isLocked) return;
                                    onEtapaPuntoCeroToggle?.(vehicle.id, key);
                                  }}
                                  disabled={checked || isLocked}
                                  className="w-full flex items-start gap-3 p-2.5 rounded-xl border transition-all text-left"
                                  style={{ backgroundColor: checked ? `${flotaColor}10` : "rgba(255,255,255,0.03)", borderColor: checked ? flotaColor : (isLocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"), cursor: (checked || isLocked) ? "default" : "pointer", opacity: isLocked ? 0.4 : 1 }}
                                  data-testid={`etapa-pc-${key}-${vehicle.id}`}
                                >
                                  <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: checked ? flotaColor : "rgba(255,255,255,0.2)", backgroundColor: checked ? `${flotaColor}20` : "transparent" }}>
                                    {checked ? <Check size={9} style={{ color: flotaColor }} /> : <EtapaIcon size={9} style={{ color: isLocked ? "#334155" : "#64748b" }} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold" style={{ color: checked ? flotaColor : "#64748b" }}>{label}</p>
                                    <p className="text-[8px] text-slate-600 mt-0.5">{instruccion}</p>
                                  </div>
                                  {checked
                                    ? <span className="text-[8px] font-bold flex-shrink-0" style={{ color: flotaColor }}>+1 PS</span>
                                    : isColorEtapa && ep.etapa3
                                      ? <span className="text-[8px] flex-shrink-0" style={{ color: todosColoresConfirmados ? flotaColor : "#64748b" }}>{colorCount}/7</span>
                                      : <span className="text-[8px] text-slate-600 flex-shrink-0">activar</span>
                                  }
                                </button>
                                {isColorEtapa && !checked && ep.etapa3 && (
                                  <div className="grid grid-cols-4 gap-2 mt-2 px-1">
                                    {ARCOIRIS.map(({ color, zona }, idx) => {
                                      const confirmado = coloresConfirmados[idx];
                                      return (
                                        <button
                                          key={zona}
                                          onClick={e => { e.stopPropagation(); if (!confirmado) setColorInmersion({ color, zona, idx }); }}
                                          disabled={confirmado}
                                          className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all"
                                          style={{ backgroundColor: confirmado ? `${color}25` : `${color}12`, borderColor: confirmado ? color : `${color}35`, cursor: confirmado ? "default" : "pointer", boxShadow: confirmado ? `0 0 10px ${color}50` : `0 0 4px ${color}20` }}
                                          data-testid={`color-pc-${idx}-${vehicle.id}`}
                                        >
                                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: confirmado ? color : `${color}40`, boxShadow: confirmado ? `0 0 8px ${color}` : "none" }}>
                                            {confirmado && <Check size={10} color="#fff" />}
                                          </div>
                                          <span className="text-[7px] font-bold text-center leading-tight" style={{ color: confirmado ? color : `${color}90` }}>{zona}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {isColorEtapa && checked && (
                                  <div className="flex gap-1 flex-wrap mt-1.5 px-1">
                                    {ARCOIRIS.map(({ color, zona }) => (
                                      <span key={zona} className="text-[7px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>✓ {zona}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!showMicroPasos && (
                        <p className="text-[8px] text-center text-slate-600">Las etapas aparecerán en unos segundos...</p>
                      )}
                    </div>
                  );
                }

                const mp = vehicle.microPasos || { hidratacion: false, respiracion: false, pantallaZero: false };
                const microPasosCfg = [
                  { key: "hidratacion" as const, label: "Hidratación", desc: "¿Tomaste agua?", Icon: Droplets },
                  { key: "respiracion" as const, label: "Respiración", desc: "3 respiraciones profundas", Icon: Wind },
                  { key: "pantallaZero" as const, label: "Pantalla cero", desc: "¿Sin dispositivo?", Icon: MonitorOff },
                ];
                const mpCompletados = [mp.hidratacion, mp.respiracion, mp.pantallaZero].filter(Boolean).length;
                return (
                  <div className="space-y-2" data-testid={`descanso-msg-${vehicle.id}`}>
                    <div className="p-3 rounded-xl border" style={{ backgroundColor: `${flotaColor}08`, borderColor: `${flotaColor}30` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Battery size={14} style={{ color: flotaColor }} />
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: flotaColor }}>{tipoLabel}</span>
                        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${flotaColor}15`, color: flotaColor }}>{mpCompletados}/3 PS</span>
                        <button onClick={() => setShowDescansoReloj(v => !v)} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all" style={{ backgroundColor: showDescansoReloj ? `${flotaColor}20` : "transparent", borderColor: showDescansoReloj ? flotaColor : "rgba(255,255,255,0.15)", color: showDescansoReloj ? flotaColor : "#64748b" }} data-testid={`toggle-reloj-descanso-${vehicle.id}`} title={showDescansoReloj ? "Ocultar reloj" : "Ver reloj"}>
                          <Clock size={10} />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 italic">{tipoSublabel}{showDescansoReloj ? " · Reloj activo" : " · Reloj oculto"}</p>
                      {eficienciaSec !== null && (
                        <p className="text-[8px] mt-1" style={{ color: flotaColor }}>⚡ Primer micro-paso: {eficienciaSec < 60 ? `${eficienciaSec}s` : `${Math.round(eficienciaSec / 60)}m`} desde apertura</p>
                      )}
                    </div>
                    {showMicroPasos && (
                      <div className="space-y-1.5">
                        {microPasosCfg.map(({ key, label, desc, Icon }) => {
                          const checked = mp[key];
                          return (
                            <button
                              key={key}
                              onClick={() => !checked && onMicroPasoToggle?.(vehicle.id, key)}
                              disabled={checked}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left"
                              style={{ backgroundColor: checked ? `${flotaColor}10` : "rgba(255,255,255,0.03)", borderColor: checked ? flotaColor : "rgba(255,255,255,0.08)", cursor: checked ? "default" : "pointer" }}
                              data-testid={`micro-paso-${key}-${vehicle.id}`}
                            >
                              <div className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0" style={{ borderColor: checked ? flotaColor : "rgba(255,255,255,0.2)", backgroundColor: checked ? `${flotaColor}20` : "transparent" }}>
                                {checked ? <Check size={11} style={{ color: flotaColor }} /> : <Icon size={11} className="text-slate-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold" style={{ color: checked ? flotaColor : "#64748b" }}>{label}</p>
                                <p className="text-[8px] text-slate-600">{desc}</p>
                              </div>
                              {checked
                                ? <span className="text-[8px] font-bold flex-shrink-0" style={{ color: flotaColor }}>+1 PS</span>
                                : <span className="text-[8px] text-slate-600 flex-shrink-0">toca para activar</span>
                              }
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {!showMicroPasos && (
                      <p className="text-[8px] text-center text-slate-600">Los micro-pasos aparecerán en unos segundos...</p>
                    )}
                  </div>
                );
              })()}

              {tipoFlota === "verdad" && vehicle.status === "activo" && (
                <div className="p-3 rounded-xl border" style={{ backgroundColor: "rgba(107,114,128,0.08)", borderColor: "rgba(107,114,128,0.3)" }} data-testid={`verdad-msg-${vehicle.id}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Eye size={14} style={{ color: GRIS }} />
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: GRIS }}>MODO CENTINELA</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[8px] px-2 py-1 rounded-full font-black uppercase" style={{ backgroundColor: vehicle.autoVerdad ? `${BLOOD}20` : `${EMERALD}20`, color: vehicle.autoVerdad ? BLOOD : EMERALD }}>{vehicle.autoVerdad ? "VERDAD INCONSCIENTE" : "VERDAD CONSCIENTE"}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center" style={{ fontFamily: "Georgia, serif" }}>{vehicle.autoVerdad ? "Tiempo perdido detectado. No hay actividad consciente registrada." : "Registro voluntario de pausa o reflexión."}</p>
                  {timerDisplay && (
                    <div className="mt-2 text-center">
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{vehicle.autoVerdad ? "Tiempo perdido" : "Duración"}</p>
                      <span className="text-lg font-black tracking-wider" style={{ color: vehicle.autoVerdad ? BLOOD : EMERALD, fontFamily: "JetBrains Mono, monospace" }}>{timerDisplay}</span>
                    </div>
                  )}
                </div>
              )}

              {vehicle.status !== "activo" && vehicle.duracionFinal != null && vehicle.duracionFinal > 0 && (
                <div className="pt-3">
                  <div className="p-3 rounded-xl border text-center" style={{
                    backgroundColor: `${flotaColor}08`,
                    borderColor: `${flotaColor}30`,
                    boxShadow: vehicle.cierreManual ? `0 0 20px ${flotaColor}30` : "none"
                  }}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Timer size={12} style={{ color: flotaColor }} />
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: flotaColor }}>DURACIÓN FINAL</span>
                      {vehicle.cierreManual && <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>CONSAGRADO</span>}
                    </div>
                    <span className="text-2xl font-black tracking-wider" style={{ color: flotaColor, fontFamily: "JetBrains Mono, monospace", textShadow: vehicle.cierreManual ? `0 0 15px ${flotaColor}40` : "none" }}>
                      {Math.floor(vehicle.duracionFinal / 60) > 0 ? `${Math.floor(vehicle.duracionFinal / 60)}h ` : ""}{vehicle.duracionFinal % 60}min
                    </span>
                    {vehicle.cantidadObjetivo && vehicle.cantidadObjetivo > 0 && vehicle.duracionFinal != null && vehicle.duracionFinal > 0 && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: `${flotaColor}20` }}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: flotaColor }}>RENDIMIENTO</p>
                        <div className="flex items-center justify-center gap-4">
                          <div>
                            <p className="text-[8px] text-slate-500">Unidades</p>
                            <p className="text-sm font-black" style={{ color: flotaColor }}>{vehicle.cantidadObjetivo}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500">Tiempo/unidad</p>
                            <p className="text-sm font-black" style={{ color: flotaColor }}>{(vehicle.duracionFinal / vehicle.cantidadObjetivo).toFixed(1)} min</p>
                          </div>
                          {vehicle.resultadoPorUnidad && (
                            <div>
                              <p className="text-[8px] text-slate-500">Precisión</p>
                              <p className="text-sm font-black" style={{ color: flotaColor }}>{Math.floor(vehicle.resultadoPorUnidad / 60)}m {vehicle.resultadoPorUnidad % 60}s</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {vehicle.segmentosCruzados && vehicle.segmentosCruzados > 0 && vehicle.status === "activo" && (
                <div className="p-2 rounded-xl border" style={{ backgroundColor: `${GOLD}08`, borderColor: `${GOLD}30` }}>
                  <div className="flex items-center gap-2">
                    <Zap size={12} style={{ color: GOLD }} />
                    <span className="text-[9px] font-bold" style={{ color: GOLD }}>CRUCE DE SEGMENTOS: {vehicle.segmentosCruzados}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5">Dato registrado para evaluación del Doctor IA</p>
                </div>
              )}
              <div className="pt-2 space-y-2">
                {Object.entries(EJES_CONFIG).map(([key, config]) => {
                  const ejeData = vehicle.ejes[key as keyof typeof vehicle.ejes];
                  if (ejeData.trifecta === "omitir") return null;
                  const isEditing = editingEje === key;
                  return (
                    <div key={key} className="p-2 rounded-lg relative" style={{ backgroundColor: `${config.color}10` }}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-1"><config.icon size={10} style={{ color: config.color }} /><span className="text-[9px] font-bold uppercase" style={{ color: config.color }}>Editando {config.label}</span></div>
                          <div className="flex gap-1">
                            {TRIFECTA_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setEditingTrifecta(opt.id)} className={cn("flex-1 py-1 rounded-full text-[8px] font-black uppercase tracking-wide transition-all", editingTrifecta === opt.id ? "scale-105" : "opacity-50")} style={{ backgroundColor: editingTrifecta === opt.id ? opt.color : "rgba(255,255,255,0.05)", color: editingTrifecta === opt.id ? (opt.id === "reto" ? "#000" : "#fff") : "#666" }}>{opt.label}</button>))}
                          </div>
                          {editingTrifecta !== "omitir" && <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full p-2 rounded-lg bg-black/40 border text-white text-xs resize-none" style={{ borderColor: config.color }} rows={2} autoFocus />}
                          <div className="flex gap-2">
                            <button onClick={handleSaveEjeEdit} className="flex-1 py-1 rounded-full text-[9px] font-bold flex items-center justify-center gap-1" style={{ backgroundColor: config.color, color: "#000" }}><Check size={10} /> Guardar</button>
                            <button onClick={handleCancelEjeEdit} className="py-1 px-3 rounded-full text-[9px] font-bold text-slate-400 bg-white/5"><X size={10} /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <config.icon size={10} style={{ color: config.color }} />
                            <span className="text-[9px] font-bold uppercase" style={{ color: config.color }}>{config.label}</span>
                            <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase", ejeData.trifecta === "reto" ? "bg-amber-500/20 text-amber-400" : "bg-slate-600/20 text-slate-400")}>{ejeData.trifecta}</span>
                            {!minimal && vehicle.status === "activo" && onQuickEditEje && <button onClick={(e) => { e.stopPropagation(); handleStartEditEje(key); }} className="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors"><Pencil size={9} style={{ color: config.color }} /></button>}
                          </div>
                          <p className="text-xs text-slate-300 italic" style={{ fontFamily: "Georgia, serif" }}>{ejeData.text}</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {!minimal && vehicle.status === "activo" && !showReflectionMode && (
                <div className="space-y-2 pt-1">
                  {onDetail && <button onClick={onDetail} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: `${AZURE}15`, color: AZURE, border: `1px solid ${AZURE}30` }} data-testid={`button-detail-${vehicle.id}`}><Pencil size={14} /> DETALLAR 4 EJES</button>}
                  {vehicle.tipoReloj === "investigador" && onInvestigadorClose ? (
                    <>
                      {(() => {
                        const histInvest = getHistoricalVehicleData(vehicle.titulo);
                        const cantNum = Number(cantidadRealizada);
                        const cantValida = cantNum > 0;
                        return (
                          <div className="p-3 rounded-xl border space-y-3" style={{ backgroundColor: "rgba(212,175,55,0.05)", borderColor: `${GOLD}30` }}>
                            <p className="text-[9px] font-black uppercase tracking-widest text-center" style={{ color: GOLD }}>RESULTADO DE MEDICIÓN</p>

                            <div>
                              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: GOLD }}>Unidades completadas</p>
                              <input
                                type="number"
                                min="0"
                                value={cantidadRealizada}
                                onChange={e => setCantidadRealizada(e.target.value)}
                                placeholder={vehicle.cantidadObjetivo ? String(vehicle.cantidadObjetivo) : "0"}
                                className="w-full rounded-lg px-3 py-2 text-sm text-center font-bold outline-none"
                                style={{ backgroundColor: "rgba(212,175,55,0.08)", border: `1px solid ${GOLD}40`, color: GOLD }}
                                data-testid={`input-cantidadrealizada-${vehicle.id}`}
                              />
                              {histInvest.count > 0 && histInvest.bestMinPerUnit && (
                                <p className="text-[9px] text-center mt-1" style={{ color: GOLD }}>
                                  Récord bóveda: {histInvest.bestMinPerUnit.toFixed(1)} min/unidad ({histInvest.count} mediciones)
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  if (!cantValida) return;
                                  if (onOpenCierreEnergia) onOpenCierreEnergia({ kind: "investigador", vehicleId: vehicle.id, cumplido: true, cantidadRealizada: cantNum });
                                  else onInvestigadorClose?.(vehicle.id, true, cantNum);
                                }}
                                disabled={!cantValida}
                                className="py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: `${EMERALD}15`, color: EMERALD, border: `1px solid ${EMERALD}40`, boxShadow: cantValida ? `0 0 12px ${EMERALD}15` : "none" }}
                                data-testid={`button-investigador-cumplido-${vehicle.id}`}
                              >
                                <Check size={16} />
                                <span className="font-black">CUMPLIDO</span>
                                <span className="text-[8px] opacity-70">+10 PS · Dato válido</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (!cantValida) return;
                                  if (onOpenCierreEnergia) onOpenCierreEnergia({ kind: "investigador", vehicleId: vehicle.id, cumplido: false, cantidadRealizada: cantNum });
                                  else onInvestigadorClose?.(vehicle.id, false, cantNum);
                                }}
                                disabled={!cantValida}
                                className="py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: `${NARANJA}15`, color: NARANJA, border: `1px solid ${NARANJA}40`, boxShadow: cantValida ? `0 0 12px ${NARANJA}15` : "none" }}
                                data-testid={`button-investigador-incumplido-${vehicle.id}`}
                              >
                                <AlertTriangle size={16} />
                                <span className="font-black">INCUMPLIDO</span>
                                <span className="text-[8px] opacity-70">+10 PS · Dato descartado</span>
                              </button>
                            </div>
                            {!cantValida && (
                              <p className="text-[9px] text-center" style={{ color: NARANJA }}>Ingresa las unidades para continuar</p>
                            )}
                            <p className="text-[8px] text-slate-500 text-center">Después se abre el mismo paso de energía al cerrar que en el resto de vehículos.</p>
                          </div>
                        );
                      })()}
                    </>
                  ) : tipoFlota === "descanso" ? (
                    showEtiquetaSalida ? (
                      <div className="space-y-3 p-3 rounded-xl border" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderColor: `${flotaColor}30` }}>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: flotaColor }}>¿Cómo saliste?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { key: "recuperado" as const, label: "RECUPERADO", desc: "Con voltaje", color: "#10b981", bonus: "+2 PS" },
                            { key: "parcial" as const, label: "PARCIAL", desc: "Algo de recarga", color: "#f59e0b", bonus: "0 PS" },
                            { key: "fragmentado" as const, label: "FRAGMENTADO", desc: "No descansé", color: "#ef4444", bonus: "—" },
                          ]).map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => setEtiquetaSalidaLocal(opt.key)}
                              className="p-2 rounded-xl border text-center transition-all"
                              style={{ backgroundColor: etiquetaSalidaLocal === opt.key ? `${opt.color}20` : "rgba(255,255,255,0.03)", borderColor: etiquetaSalidaLocal === opt.key ? opt.color : "rgba(255,255,255,0.1)" }}
                              data-testid={`etiqueta-${opt.key}-${vehicle.id}`}
                            >
                              <p className="text-[8px] font-black uppercase" style={{ color: etiquetaSalidaLocal === opt.key ? opt.color : "#64748b" }}>{opt.label}</p>
                              <p className="text-[7px] text-slate-500 mt-0.5">{opt.desc}</p>
                              <p className="text-[7px] font-bold mt-1" style={{ color: etiquetaSalidaLocal === opt.key ? opt.color : "#475569" }}>{opt.bonus}</p>
                            </button>
                          ))}
                        </div>
                        <input
                          value={notaSalidaLocal}
                          onChange={e => setNotaSalidaLocal(e.target.value.slice(0, 80))}
                          placeholder="Nota de cierre (opcional, máx 80 chars)"
                          className="w-full bg-black/30 text-white text-[9px] p-2 rounded-lg border border-white/10 focus:outline-none"
                          data-testid={`nota-salida-${vehicle.id}`}
                        />
                        <p className="text-[8px] text-slate-500 text-center leading-snug">El siguiente paso pregunta con qué energía terminaste (mismo modal que en el resto de vehículos).</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (!etiquetaSalidaLocal || !pendingDescansoStatus) return;
                              if (onOpenCierreEnergia) {
                                onOpenCierreEnergia({
                                  kind: "descanso",
                                  vehicleId: vehicle.id,
                                  status: pendingDescansoStatus,
                                  etiqueta: etiquetaSalidaLocal,
                                  nota: notaSalidaLocal,
                                });
                                setShowEtiquetaSalida(false);
                                setEtiquetaSalidaLocal(null);
                                setNotaSalidaLocal("");
                                setPendingDescansoStatus(null);
                              } else {
                                onDescansoClose?.(vehicle.id, pendingDescansoStatus, etiquetaSalidaLocal, notaSalidaLocal);
                              }
                            }}
                            disabled={!etiquetaSalidaLocal}
                            className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                            style={{ backgroundColor: etiquetaSalidaLocal ? flotaColor : "rgba(255,255,255,0.1)", color: etiquetaSalidaLocal ? "#000" : "#64748b" }}
                            data-testid={`button-confirmar-cierre-${vehicle.id}`}
                          >
                            Continuar · energía al cerrar
                          </button>
                          <button onClick={() => { setShowEtiquetaSalida(false); setEtiquetaSalidaLocal(null); setNotaSalidaLocal(""); setPendingDescansoStatus(null); }} className="px-3 py-2 rounded-lg text-slate-500 bg-white/5 text-[9px]"><X size={12} /></button>
                        </div>
                      </div>
                    ) : timerExpired && vehicle.tipoDescanso !== "reset_profundo" && vehicle.tipoDescanso !== "punto_cero" ? (
                      <>
                        <button onClick={() => { setShowEtiquetaSalida(true); setPendingDescansoStatus("cumplido"); }} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: "rgba(153,27,27,0.15)", color: "#fca5a5", border: "1px solid #991b1b" }} data-testid={`button-archive-${vehicle.id}`}><X size={14} /> CERRAR · TOLERANCIA SUPERADA</button>
                        <p className="text-[9px] text-center text-slate-500">Selecciona tu etiqueta de salida para cerrar</p>
                      </>
                    ) : (
                      <button onClick={() => { setShowEtiquetaSalida(true); setPendingDescansoStatus("cumplido"); }} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: `${flotaColor}15`, color: flotaColor, border: `1px solid ${flotaColor}30` }} data-testid={`button-complete-${vehicle.id}`}><Check size={14} /> CERRAR DESCANSO</button>
                    )
                  ) : tipoFlota === "situacion" ? (
                    <>
                      <button onClick={onComplete} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: `${EMERALD}15`, color: EMERALD, border: `1px solid ${EMERALD}30` }} data-testid={`button-complete-${vehicle.id}`}><Check size={14} /> CUMPLIDO (3-7 PS + subtareas +4)</button>
                      <button onClick={onArchive} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }} data-testid={`button-archive-${vehicle.id}`}><X size={14} /> INCUMPLIDO</button>
                    </>
                  ) : timerExpired && (tipoFlota === "tiempo" || vehicle.tipoTerminoRapido === "hora") ? (
                    <>
                      <button onClick={onArchive} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: "rgba(153,27,27,0.15)", color: "#ef4444", border: "1px solid rgba(153,27,27,0.5)" }} data-testid={`button-archive-${vehicle.id}`}><X size={14} /> CERRAR · TIEMPO EXCEDIDO</button>
                      <p className="text-[9px] text-center text-slate-500">Justifica arriba para recuperar puntos</p>
                    </>
                  ) : (
                    <>
                      <button onClick={onComplete} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: `${EMERALD}15`, color: EMERALD, border: `1px solid ${EMERALD}30` }} data-testid={`button-complete-${vehicle.id}`}><Check size={14} /> CUMPLIDO (+{potentialCPCumplido} PS)</button>
                      {vehicle.tipoTerminoRapido && (
                        <button onClick={onArchive} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }} data-testid={`button-archive-${vehicle.id}`}><X size={14} /> INCUMPLIDO</button>
                      )}
                    </>
                  )}
                  {!vehicle.tipoTerminoRapido && !tipoFlota && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={onArchive} className="py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280" }}><Archive size={12} /> Archivar</button>
                      <button onClick={() => setShowReflectionMode(true)} className="py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all" style={{ backgroundColor: `${VIOLET}15`, color: VIOLET, border: `1px solid ${VIOLET}30` }}><Zap size={12} /> + Reflexión</button>
                    </div>
                  )}
                </div>
              )}

              {!minimal && vehicle.status === "activo" && showReflectionMode && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: `${VIOLET}08`, borderColor: `${VIOLET}25` }}>
                    <div className="flex items-center gap-2 mb-2"><Zap size={14} style={{ color: VIOLET }} /><span className="text-xs font-bold" style={{ color: VIOLET }}>REFLEXIÓN DE CONSCIENCIA</span></div>
                    <p className="text-[10px] text-slate-400 mb-3">¿Por qué no se cumplió? Reflexiona en cada eje para ganar +2 PS extra por eje.</p>
                    {Object.entries(EJES_CONFIG).map(([key, config]) => {
                      const ejeData = vehicle.ejes[key as keyof typeof vehicle.ejes];
                      if (ejeData.trifecta === "omitir") return null;
                      return (
                        <div key={key} className="mb-2">
                          <div className="flex items-center gap-2 mb-1"><config.icon size={10} style={{ color: config.color }} /><span className="text-[9px] font-bold uppercase" style={{ color: config.color }}>{config.label}</span>{reflections[key]?.trim().length > 5 && <Check size={10} className="text-green-400 ml-auto" />}</div>
                          <input value={reflections[key] || ""} onChange={(e) => setReflections(prev => ({ ...prev, [key]: e.target.value }))} placeholder={`¿Qué aprendiste sobre tu ${config.label.toLowerCase()}?`} className="w-full p-2 rounded-lg bg-black/40 border text-white text-[10px] placeholder:text-slate-600" style={{ borderColor: reflections[key]?.trim().length > 5 ? config.color : "rgba(255,255,255,0.1)" }} />
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                      <span className="text-[10px] text-slate-400">Reflexiones: {reflectionCount}/4</span>
                      <span className="text-xs font-bold" style={{ color: VIOLET }}>+{potentialCPArchivado + reflectionBonus} PS</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if (onArchiveWithReflection) onArchiveWithReflection(reflections); setShowReflectionMode(false); setReflections({}); }} className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all" style={{ backgroundColor: VIOLET, color: "#fff" }}><Zap size={14} /> Archivar con Reflexión</button>
                    <button onClick={() => { setShowReflectionMode(false); setReflections({}); }} className="py-2.5 px-4 rounded-lg text-slate-400 bg-white/5"><X size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Toast Celebración de Tiempo Ganado — no bloquea la UI */}
      <AnimatePresence>
        {showTiempoGanado && tiempoGanado > 0 && (() => {
          const mins = Math.floor(tiempoGanado / 60);
          const secs = tiempoGanado % 60;
          const label = mins > 0 ? `+${mins} MIN ${String(secs).padStart(2,'0')} SEG` : `+${secs} SEG`;
          const frase = tiempoGanado < 30
            ? "El sistema detecta una compresión mínima. Repite."
            : tiempoGanado < 90
              ? "Tu hardware operó por encima del registro base. Ese tiempo es tuyo."
              : tiempoGanado < 180
                ? "Compresión de rendimiento confirmada. El cerebro ya lo registró."
                : tiempoGanado < 360
                  ? "Soberanía de tiempo ejecutada. El Chófer no pudo con el Pasajero hoy."
                  : tiempoGanado < 720
                    ? "Transmutación de tiempo validada. Voltaje del sistema elevado."
                    : "ACELERACIÓN SISTÉMICA. Tu sistema operó en modo Soberano.";
          return (
            <motion.div
              key={`tiempo-ganado-toast-${tiempoGanadoKey}`}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "fixed",
                bottom: "1.5rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                width: "min(26rem, 94vw)",
                pointerEvents: "none",
              }}
            >
              <motion.div
                style={{
                  backgroundColor: "#0A0A0A",
                  border: "1.5px solid #00FFC3",
                  borderRadius: "1rem",
                  padding: "1.5rem 1.75rem",
                  textAlign: "center",
                  boxShadow: "0 0 40px rgba(0,255,195,0.2)",
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                animate={{ boxShadow: ["0 0 20px rgba(0,255,195,0.12)", "0 0 52px rgba(0,255,195,0.32)", "0 0 20px rgba(0,255,195,0.12)"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                onClick={() => setShowTiempoGanado(false)}
              >
                <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#00FFC3", opacity: 0.65 }}>TIEMPO RECUPERADO</p>
                <p className="text-3xl font-black mb-3" style={{ color: "#00FFC3", fontFamily: "JetBrains Mono, monospace", textShadow: "0 0 20px rgba(0,255,195,0.55)" }}>{label}</p>
                <p className="text-sm font-semibold mb-4" style={{ color: "#D4AF37", fontFamily: "Georgia, serif", lineHeight: 1.7, whiteSpace: "normal", wordBreak: "break-word" }}>{frase}</p>
                <div style={{ height: "2px", backgroundColor: "rgba(0,255,195,0.12)", borderRadius: "9999px", overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", backgroundColor: "#00FFC3", borderRadius: "9999px", originX: 0 }}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 4, ease: "linear" }}
                  />
                </div>
                <p className="text-[8px] text-slate-600 mt-1.5">Toca para cerrar</p>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

function DepositoEnergeticoSection({ vehicles, planilla }: { vehicles: Vehicle[]; planilla?: Planilla | null }) {
  const flotaTypes: TipoFlota[] = ["tiempo", "situacion", "descanso", "verdad"];
  const flotaStats = flotaTypes.map(tipo => {
    const all = vehicles.filter(v => v.tipoFlota === tipo);
    const completed = all.filter(v => v.status === "cumplido");
    const pct = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;
    const totalMin = all.reduce((sum, v) => sum + (v.duracionFinal || 0), 0);
    const activeMin = all.filter(v => v.status === "activo" && v.aperturaAt).reduce((sum, v) => {
      const elapsed = Math.round((Date.now() - (v.aperturaAt || 0)) / 60000);
      return sum + elapsed;
    }, 0);
    return { tipo, all: all.length, completed: completed.length, pct, totalMin: totalMin + activeMin };
  });
  const totalAll = vehicles.length;
  const totalCompleted = vehicles.filter(v => v.status === "cumplido").length;
  const hasEnergiaOscura = vehicles.some(v => v.energiaOscura === true);
  const flotaColors: Record<TipoFlota, string> = { tiempo: NARANJA, situacion: PLATA, descanso: VERDE, verdad: GRIS };
  const flotaLabels: Record<TipoFlota, string> = { tiempo: "TIEMPO", situacion: "SITUACIÓN", descanso: "DESCANSO", verdad: "VERDAD" };

  const verdadVehicles = vehicles.filter(v => v.tipoFlota === "verdad");
  const verdadInconsciente = verdadVehicles.filter(v => v.autoVerdad);
  const verdadConsciente = verdadVehicles.filter(v => !v.autoVerdad);
  const tiempoInconsciente = verdadInconsciente.reduce((sum, v) => {
    if (v.duracionFinal) return sum + v.duracionFinal;
    if (v.status === "activo" && v.aperturaAt) return sum + Math.round((Date.now() - v.aperturaAt) / 60000);
    return sum;
  }, 0);
  const tiempoConsciente = verdadConsciente.reduce((sum, v) => {
    if (v.duracionFinal) return sum + v.duracionFinal;
    if (v.status === "activo" && v.aperturaAt) return sum + Math.round((Date.now() - v.aperturaAt) / 60000);
    return sum;
  }, 0);
  const totalTimeAll = flotaStats.reduce((sum, s) => sum + s.totalMin, 0);

  const calcConciencia = () => {
    const signals: number[] = [];

    if (totalAll > 0) {
      const cerradosConscientes = vehicles.filter(v => v.status === "cumplido" || v.status === "archivado").length;
      const activos = vehicles.filter(v => v.status === "activo").length;
      if (cerradosConscientes + activos > 0) {
        signals.push(Math.round((cerradosConscientes / (cerradosConscientes + activos)) * 100));
      }

      const conEnergiaOscura = vehicles.filter(v => v.energiaOscura === true).length;
      const sinEnergiaOscura = totalAll - conEnergiaOscura;
      signals.push(Math.round((sinEnergiaOscura / totalAll) * 100));

      const vehiculosCumplidos = vehicles.filter(v => v.status === "cumplido").length;
      const vehiculosArchivados = vehicles.filter(v => v.status === "archivado").length;
      const totalCerrados = vehiculosCumplidos + vehiculosArchivados;
      if (totalCerrados > 0) {
        signals.push(Math.round((vehiculosCumplidos / totalCerrados) * 100));
      }

      const conJustificacion = vehicles.filter(v => v.justificacion && v.justificacion.trim().length > 0).length;
      const necesitanJustificacion = vehicles.filter(v => v.energiaOscura === true || v.justificacion).length;
      if (necesitanJustificacion > 0) {
        signals.push(Math.round((conJustificacion / necesitanJustificacion) * 100));
      }
    }

    if (verdadVehicles.length > 0) {
      const tiempoTotal = tiempoConsciente + tiempoInconsciente;
      if (tiempoTotal > 0) {
        signals.push(Math.round((tiempoConsciente / tiempoTotal) * 100));
      }
    }

    if (planilla && planilla.segmentos.length > 0) {
      const segsPasados = planilla.segmentos.filter(s => s.estado === "cerrado_manual" || s.estado === "entropia");
      if (segsPasados.length > 0) {
        const cerradosManual = segsPasados.filter(s => s.estado === "cerrado_manual").length;
        signals.push(Math.round((cerradosManual / segsPasados.length) * 100));
      }
    }

    const situacionales = vehicles.filter(v => v.tipoFlota === "situacion");
    if (situacionales.length > 0) {
      let situacionalScore = 0;
      situacionales.forEach(v => {
        const tieneSubTareas = (v.subTareas || []).length > 0;
        const duracionMin = v.duracionFinal || (v.aperturaAt ? Math.round((Date.now() - v.aperturaAt) / 60000) : 0);
        if (tieneSubTareas) {
          situacionalScore += 100;
        } else if (duracionMin > 30) {
          situacionalScore += Math.max(0, 100 - Math.min(80, (duracionMin - 30) * 2));
        } else {
          situacionalScore += 80;
        }
      });
      signals.push(Math.round(situacionalScore / situacionales.length));
    }

    if (signals.length === 0) return 0;
    return Math.round(signals.reduce((a, b) => a + b, 0) / signals.length);
  };

  const concienciaPct = calcConciencia();

  const fmtMin = (min: number) => {
    if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
    return `${min}m`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border overflow-hidden p-4 space-y-4" style={{ backgroundColor: PIZARRA, borderColor: `${AZURE}25` }} data-testid="deposito-energetico-section">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={14} style={{ color: AZURE }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: AZURE }}>Cilindro de Fusión</span>
      </div>
      <div className="space-y-3 relative">
        {hasEnergiaOscura && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(153,27,27,0.15) 50%, transparent 70%)",
            borderLeft: `2px solid ${BLOOD}40`,
            borderRight: `2px solid ${BLOOD}40`
          }} />
        )}
        {flotaStats.map(({ tipo, all, completed, pct, totalMin }) => {
          const color = flotaColors[tipo];
          return (
            <div key={tipo} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{flotaLabels[tipo]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold" style={{ color: tipo === "verdad" ? BLOOD : color }}>{fmtMin(totalMin)}</span>
                  <span className="text-[9px] font-bold" style={{ color }}>{completed}/{all}</span>
                </div>
              </div>
              <div className="h-5 rounded-full overflow-hidden relative" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full relative" style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  transition: "all 1000ms ease-out",
                  boxShadow: pct > 0 ? `0 0 12px ${color}60, inset 0 1px 2px rgba(255,255,255,0.2)` : "none"
                }}>
                  {pct > 0 && <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`, animation: "pulse 2s ease-in-out infinite" }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(verdadInconsciente.length > 0 || verdadConsciente.length > 0) && (
        <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: `${GRIS}20` }}>
          <div className="flex items-center gap-2 mb-1">
            <Eye size={10} style={{ color: GRIS }} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: GRIS }}>Desglose Centinela</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg text-center" style={{ backgroundColor: `${BLOOD}10`, border: `1px solid ${BLOOD}20` }}>
              <p className="text-sm font-black" style={{ color: BLOOD }}>{fmtMin(tiempoInconsciente)}</p>
              <p className="text-[7px] text-slate-500 uppercase">Inconsciente</p>
              <p className="text-[7px]" style={{ color: BLOOD }}>{verdadInconsciente.length} eventos</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ backgroundColor: `${EMERALD}10`, border: `1px solid ${EMERALD}20` }}>
              <p className="text-sm font-black" style={{ color: EMERALD }}>{fmtMin(tiempoConsciente)}</p>
              <p className="text-[7px] text-slate-500 uppercase">Consciente</p>
              <p className="text-[7px]" style={{ color: EMERALD }}>{verdadConsciente.length} eventos</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">% Conciencia del Usuario</p>
        <span className="text-4xl font-black" style={{
          color: concienciaPct > 80 ? GOLD : concienciaPct > 50 ? EMERALD : BLOOD,
          textShadow: `0 0 20px ${concienciaPct > 80 ? GOLD : concienciaPct > 50 ? EMERALD : BLOOD}40`,
          fontFamily: "'Playfair Display', Georgia, serif"
        }} data-testid="text-conciencia-pct">{concienciaPct}%</span>
        <p className="text-[8px] text-slate-600 mt-1 italic">Puertas · Justificaciones · Desglose · Verdad · Disciplina</p>
        {totalTimeAll > 0 && <p className="text-[9px] text-slate-600 mt-1">Tiempo total registrado: {fmtMin(totalTimeAll)}</p>}
      </div>
      {hasEnergiaOscura && (
        <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: `${BLOOD}10`, borderColor: `${BLOOD}40` }}>
          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: BLOOD }}>Grietas de Energía Oscura detectadas</span>
        </div>
      )}
    </motion.div>
  );
}

function CierreJornadaModal({
  vehicles, todayPoints, onClose, onSeal, userId
}: {
  vehicles: Vehicle[];
  todayPoints: number;
  onClose: () => void;
  onSeal: (cierre: CierreJornadaLog) => void;
  userId: string;
}) {
  const totalVehicles = vehicles.length;
  const completedVehicles = vehicles.filter(v => v.status === "cumplido").length;
  const porcentajeDiaIdeal = totalVehicles > 0 ? Math.round((completedVehicles / totalVehicles) * 100) : 0;
  const energiaOscuraVehicles = vehicles.filter(v => v.energiaOscura === true);
  const flotaTypes: TipoFlota[] = ["tiempo", "situacion", "descanso", "verdad"];
  const flotaLabels: Record<TipoFlota, string> = { tiempo: "TIEMPO", situacion: "SITUACIÓN", descanso: "DESCANSO", verdad: "VERDAD" };

  const getMotivationalPhrase = () => {
    if (porcentajeDiaIdeal >= 90) return "Dominio absoluto. El guerrero se forja en la constancia.";
    if (porcentajeDiaIdeal >= 80) return "Jornada sólida. La disciplina habla por ti.";
    if (porcentajeDiaIdeal >= 60) return "Avance real. Mañana, más profundo.";
    if (porcentajeDiaIdeal >= 40) return "Hay terreno ganado. Reconoce lo hecho, corrige lo pendiente.";
    return "La verdad duele, pero ilumina. Mañana es otro campo de batalla.";
  };

  const selloTexto = getMotivationalPhrase();

  const todayFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const handleSeal = () => {
    const cierre: CierreJornadaLog = {
      id: "cj_" + Date.now(),
      fecha: new Date().toISOString().split("T")[0],
      totalPS: todayPoints,
      porcentajeSoberania: porcentajeDiaIdeal,
      segmentosCerradosManual: completedVehicles,
      segmentosTotales: totalVehicles,
      energiaOscuraEntries: [],
      energiaOscuraTotal: energiaOscuraVehicles.length,
      energiaRecuperada: 0,
      fugasVoltaje: 0,
      selloEmitido: true,
      bloqueadoNocturno: new Date().getHours() >= 22,
      timestamp: Date.now()
    };
    (cierre as any).vehiculosCumplidos = completedVehicles;
    (cierre as any).vehiculosTotales = totalVehicles;
    (cierre as any).porcentajeDiaIdeal = porcentajeDiaIdeal;
    (cierre as any).energiaOscuraDetectada = energiaOscuraVehicles.length;
    (cierre as any).selloTexto = selloTexto;
    (cierre as any).cierreAt = Date.now();
    onSeal(cierre);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.95)" }} data-testid="cierre-jornada-modal">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border p-4 space-y-3" style={{ backgroundColor: "#0a0a0a", borderColor: `${GOLD}30` }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black uppercase tracking-wider" style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}>Cierre de Jornada</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5"><X size={18} className="text-slate-500" /></button>
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: BLOOD }}>Balance de Voltaje</p>
          <div className="grid grid-cols-2 gap-2">
            {flotaTypes.map(tipo => {
              const cfg = FLOTA_CONFIG[tipo];
              const all = vehicles.filter(v => v.tipoFlota === tipo || (tipo === "verdad" && v.autoVerdad));
              const done = all.filter(v => v.status === "cumplido" || v.status === "archivado").length;
              const cumplidos = all.filter(v => v.status === "cumplido").length;
              return (
                <div key={tipo} className="p-3 rounded-xl border text-center" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}25` }} data-testid={`card-balance-${tipo}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-lg font-black" style={{ color: cfg.color }}>{done}/{all.length}</span>
                  {tipo !== "verdad" && tipo !== "descanso" && cumplidos < done && (
                    <span className="text-[8px] block" style={{ color: "rgba(255,255,255,0.3)" }}>✓{cumplidos} Cumplidos</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {energiaOscuraVehicles.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: BLOOD }}>Energía Oscura Scanner</p>
            <div className="space-y-1">
              {energiaOscuraVehicles.map(v => (
                <div key={v.id} className="p-2 rounded-lg border flex items-center gap-2" style={{ backgroundColor: `${BLOOD}10`, borderColor: `${BLOOD}40`, boxShadow: `0 0 12px ${BLOOD}30` }} data-testid={`oscura-vehicle-${v.id}`}>
                  <Skull size={12} style={{ color: "#ef4444" }} />
                  <span className="text-xs text-red-300">{v.titulo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-2">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: BLOOD }}>Escalamiento Porcentual</p>
          <span className="text-4xl font-black" style={{
            color: porcentajeDiaIdeal > 80 ? GOLD : porcentajeDiaIdeal > 50 ? EMERALD : BLOOD,
            fontFamily: "'Playfair Display', Georgia, serif",
            textShadow: `0 0 30px ${porcentajeDiaIdeal > 80 ? GOLD : porcentajeDiaIdeal > 50 ? EMERALD : BLOOD}50`
          }} data-testid="text-porcentaje-dia">{porcentajeDiaIdeal}%</span>
          <p className="text-[10px] text-slate-500 mt-1">% Día Ideal</p>
        </div>

        <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: `${GOLD}08`, borderColor: `${GOLD}25` }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Total PS del Día</p>
          <span className="text-3xl font-black" style={{ color: GOLD }} data-testid="text-total-ps">{todayPoints} PS</span>
        </div>

        <div className="text-center space-y-2 p-3 rounded-xl border" style={{ backgroundColor: `${BLOOD}06`, borderColor: `${BLOOD}20` }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: BLOOD }}>Sello de Jornada</p>
          <p className="text-[10px] text-slate-400 capitalize">{todayFormatted}</p>
          <p className="text-sm italic leading-relaxed" style={{ color: porcentajeDiaIdeal > 80 ? GOLD : porcentajeDiaIdeal > 50 ? EMERALD : BLOOD, fontFamily: "'Playfair Display', Georgia, serif" }} data-testid="text-sello-motivacional">"{selloTexto}"</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button onClick={onClose} className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }} data-testid="button-cerrar-silencio">Cerrar en Silencio</button>
          <button onClick={handleSeal} className="py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all" style={{ backgroundColor: GOLD, color: "#000", boxShadow: `0 0 20px ${GOLD}40` }} data-testid="button-sellar-jornada">Sellar Jornada</button>
        </div>
      </div>
    </motion.div>
  );
}

const CAPA_CONFIG: Record<number, { label: string; icon: typeof Target; color: string }> = {
  1: { label: "CAPA 1 · INERCIA", icon: Target, color: AZURE },
  2: { label: "CAPA 2 · FRUSTRACIÓN", icon: Zap, color: EMERALD },
  3: { label: "CAPA 3 · ABURRIMIENTO", icon: Footprints, color: VIOLET },
  4: { label: "CAPA 4 · FATIGA", icon: Shield, color: GOLD }
};

function LabIntrospeccionModal({
  segmentoNombre, segmentoDuracionMin, onClose, onSeal
}: {
  segmentoNombre: string; segmentoDuracionMin: number; onClose: () => void;
  onSeal: (totalPS: number, respuestas: { capa: number; pregunta: string; respuesta: string; charCount: number; multiplicador: number }[], capasActivas: number[]) => void;
}) {
  const capasActivas = getCapasActivas(segmentoDuracionMin);
  const [selectedQuestions] = useState<Record<number, string>>(() => {
    const qs: Record<number, string> = {};
    capasActivas.forEach(capa => { qs[capa] = selectRandomQuestion(capa); });
    return qs;
  });
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const a: Record<number, string> = {};
    capasActivas.forEach(capa => { a[capa] = ""; });
    return a;
  });

  const respuestasData = capasActivas.map(capa => {
    const text = answers[capa] || "";
    const charCount = text.length;
    const multiplicador = calcularMultiplicador(charCount);
    return { capa, pregunta: selectedQuestions[capa], respuesta: text, charCount, multiplicador };
  });

  const answeredCount = respuestasData.filter(r => r.charCount > 10).length;
  const deepCount = respuestasData.filter(r => r.charCount > 25).length;
  const basePS = answeredCount * 2;
  const deepBonus = deepCount >= 2 ? 5 : 0;
  const allDeepBonus = deepCount === capasActivas.length && capasActivas.length >= 4 ? 15 : 0;
  const densityMultiplier = respuestasData.some(r => r.multiplicador > 1) ? 1.5 : 1.0;
  const rawPS = basePS + deepBonus + allDeepBonus;
  const totalPS = Math.round(rawPS * densityMultiplier);
  const hasAnyDenseResponse = respuestasData.some(r => r.charCount > 150);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border p-6 space-y-5" style={{ backgroundColor: PIZARRA, borderColor: `${VIOLET}30` }}>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${VIOLET}15` }}>
            <Zap size={16} style={{ color: VIOLET }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: VIOLET }}>Laboratorio de Introspección v3</span>
          </div>
          <p className="text-sm text-white font-bold">{segmentoNombre}</p>
          <p className="text-[10px] text-slate-500 mt-1">Duración: {segmentoDuracionMin} min · {capasActivas.length} capas activas
            {segmentoDuracionMin < 120 && <span className="text-slate-600 ml-1">(+120 min para Capas 3 y 4)</span>}
          </p>
        </div>
        <div className="space-y-4">
          {capasActivas.map((capa) => {
            const config = CAPA_CONFIG[capa];
            const Icon = config.icon;
            const text = answers[capa] || "";
            const charCount = text.length;
            const mult = calcularMultiplicador(charCount);
            return (
              <div key={capa} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${config.color}20` }}><Icon size={14} style={{ color: config.color }} /></div>
                  <span className="text-xs font-bold" style={{ color: config.color }}>{config.label}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[9px]" style={{ color: charCount > 150 ? GOLD : charCount > 50 ? AZURE : "#6b7280" }}>{charCount} chars</span>
                    {mult > 1 && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>1.5x</span>}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic" style={{ fontFamily: "Georgia, serif" }}>{selectedQuestions[capa]}</p>
                <textarea value={text} onChange={(e) => setAnswers(prev => ({ ...prev, [capa]: e.target.value }))} placeholder="Escribe tu reflexión aquí..." rows={3} className="w-full p-3 rounded-lg bg-black/40 border text-white text-sm placeholder:text-slate-600 focus:outline-none resize-none" style={{ borderColor: charCount > 150 ? config.color : charCount > 50 ? `${config.color}60` : "rgba(255,255,255,0.1)", fontFamily: "Georgia, serif" }} />
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>{charCount < 50 ? `${50 - charCount} chars más para respuesta válida` : charCount < 150 ? `${150 - charCount} chars más para multiplicador 1.5x` : "Multiplicador de Consciencia activo"}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 rounded-xl border text-center space-y-1" style={{ backgroundColor: `${VIOLET}08`, borderColor: `${VIOLET}20` }}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-black" style={{ color: VIOLET }}>{totalPS} PS</span>
            {hasAnyDenseResponse && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>BONIFICACIÓN x1.5</span>}
          </div>
          <div className="text-[9px] text-slate-500 space-x-2">
            <span>Base: {basePS}</span>
            {deepBonus > 0 && <span>· Profundidad: +{deepBonus}</span>}
            {allDeepBonus > 0 && <span>· Maestría Total: +{allDeepBonus}</span>}
            {densityMultiplier > 1 && <span>· Multiplicador: x{densityMultiplier}</span>}
          </div>
          <p className="text-[8px] text-slate-600 mt-1">Las respuestas se guardan para análisis del Doctor IA</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg text-sm text-slate-400 bg-white/5 transition-all">Omitir</button>
          <button onClick={() => onSeal(totalPS, respuestasData, capasActivas)} disabled={answeredCount === 0} className="flex-1 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50" style={{ backgroundColor: VIOLET, color: "#fff" }}>Sellar Introspección</button>
        </div>
      </motion.div>
    </div>
  );
}
