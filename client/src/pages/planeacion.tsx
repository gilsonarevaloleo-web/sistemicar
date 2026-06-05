import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
  RotateCcw,
  Bell,
  BellOff,
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
  saveIntrospectionEntry,
  getPlanillaHoy,
  savePlanilla,
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
  getDailyPoints,
  getDailyPointsLocalSync,
  getYesterdayDailyPointsTotal,
  subscribeToDailyPoints,
  getLimaDateString,
  getLimaDayStart,
  getIntrospectionPsForDay,
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
  hasSoberaniaDiaAccess,
  hasPuntoCeroAccess,
  subscribeToRadiografiaTokens,
  checkAndAwardRadiografiaMilestones,
  checkAndRefreshSubscriptionRadiografia,
  getRadiografiaTokens,
  consumeRadiografiaToken,
  RadiografiaTokenData,
  getExpedientesRecientes,
  ExpedienteClinico,
  notifyVehicleClosed,
  wasVehicleRecentlyClosed,
  mergeActiveVehicleSessionState,
  isOrphanDesglosadorInterrupt,
  reconcileGhostActiveVehicles,
} from "@/lib/persistence";
import { filterVehiclesForEntropy, shouldPreserveLocalActivo } from "@/lib/ghostVehicleEngine";
import {
  computeDesglosadorSubAwardPS,
  DESGLOSADOR_CYCLE_CLOSE_BASE_PS,
  DESGLOSADOR_SUB_CUMPLIDO_PS,
  VEHICLE_ARCHIVADO_BASE_PS,
  VEHICLE_CUMPLIDO_BASE_PS,
  vehicleMissionClosePS,
} from "@/lib/sovereigntyPointsConfig";
import {
  awardDesglosadorSubPointsIfNeeded,
  settleDesglosadorCyclePoints,
  sumDesglosadorSubsPsAlreadyGranted,
  estimateDesglosadorSessionPs,
} from "@/lib/desglosadorPointsAward";
import {
  releaseCentinela,
  resetCentinelaTimerState,
  suppressCentinela,
  maybeReleaseStaleSuppression,
  resetCentinelaLaunchGate,
  type CentinelaUiState,
} from "@/lib/centinelaEngine";
import {
  createRutaEnfoqueState,
  applyRutaThresholdCrossing,
  repairRutaCruzadoAheadOfRestantes,
  formatRutaPreview,
  getRutaBandaActual,
  mergeRutaCruzadaFromSubs,
  RUTA_BANDA_META,
  type RutaBandaId,
} from "@/lib/rutaEnfoque";
import {
  enrichSubRutaCierre,
  computeRutaPrivilegioPS,
  type RutaSeguimientoPatron,
} from "@/lib/rutaSeguimiento";
import { rutaVozFluidoParts, rutaVozPartsForBanda } from "@/lib/rutaEnfoqueVoz";
import {
  RutaSeguimientoPicker,
  rutaSeguimientoPickerCanConfirm,
} from "@/components/RutaSeguimientoPicker";
import { speakUbicacionQueue, speakUbicacionSingle, warmupSpeechSynthesis, recoverSpeechQueue } from "@/lib/speechQueue";
import {
  isTikSoundEnabled,
  setTikSoundEnabled,
  isSituacionAlertsEnabled,
  setSituacionAlertsEnabled,
  isPuertaVozEnabled,
  setPuertaVozEnabled,
  isDesglosadorVoiceEnabled,
  setDesglosadorVoiceEnabled,
} from "@/lib/tikSound";
import { playSituacionCumplidoChimes } from "@/lib/situacionAlertSounds";
import {
  fireSituacion2MinAlert,
  fireSituacionCupoAlert,
  speakSituacionFilaEnFoco,
  SITUACION_CUPO_ESCALATION_MS,
  SITUACION_CUPO_ESCALATION_MAX,
} from "@/lib/situacionAlerts";
import {
  computeDesglosadorClocks,
  formatElapsedHHMMSS,
  formatHHMM,
  formatMMSS,
  getDesglosadorSessionElapsedSec,
  suggestedSec,
  computeSubCloseVerdict,
  type SubCloseVerdict,
} from "@/lib/desglosadorClock";
import DesglosadorDuracionPanel from "@/components/DesglosadorDuracionPanel";
import {
  aplicarTiempoGanadoAlCumplir,
  applyCupoManualYRedistribuir,
  computeSituacionCronometroHorarios,
  quitarMinutosHaciaFoco,
  redistribuirMinutosSituacionCronometro,
  registrarCierreFalladoCronometro,
  extraerSubTareaAReserva,
  resolveFocusSubTareaId,
  situacionFilaCronometroPendiente,
  situacionRelojDebeMostrarse,
  situacionTargetMsReloj,
  sumMinutosCronometroPendientes,
  totalBudgetMinFromCronometro,
} from "@/lib/situacionCupoDistrib";
import {
  computeEficienciaSituacionPct,
  computeSituacionBolsaGanancia,
  nextRetoNumero,
  retoSituacionLabel,
  sumMinutosRealesCronometro,
} from "@/lib/situacionGanancia";
import { SituacionBolsaGananciaPanel } from "@/components/SituacionBolsaGanancia";
import { countCasaHechas, groupCasaByTexto, type CasaTextoCount } from "@/lib/situacionCasa";
import {
  computeDesglosadorSessionDepthPS,
  depthAwardForHour,
  formatDepthAwardPreview,
  nextDepthAwardAfterHours,
} from "@/lib/desglosadorDepth";
import {
  firstPendingCronometroTexto,
  firstPendingSubVehiculoTitulo,
  reorderSubTareasCronometro,
  reorderSubVehiculos,
  type ReorderDirection,
} from "@/lib/desglosadorReorder";
import {
  addSituacionReserva,
  deleteSituacionReserva,
  getReservaActivas,
  RUTA_TACTICA_META,
  sortReservasTacticas,
  subscribeToSituacionReserva,
  updateSituacionReservaEstado,
  updateSituacionReservaRuta,
  type ReservaTacticaRuta,
  type SituacionReservaItem,
} from "@/lib/situacionReserva";
import { computeDailyPsBarModel } from "@/lib/dailyPsBar";
import { safeWithFallback } from "@/lib/asyncTimeout";
import { recordFocusBandEvent, getFocusBandEventsRecent, getFocusBandEventsForRange } from "@/lib/focusBandLedger";
import type { FocusBandEvent } from "@/lib/focusBandLedger";
import {
  buildDailySnapshot,
  savePlanillaDailySnapshot,
  inferBandaBloque,
  psEspectroBloque,
  computeTermodinamicaCompareV2,
  vehicleEnTermoJornada,
  FASE_ATENCIONAL_COLOR,
  FASE_ATENCIONAL_LABEL,
  getPlanillaDailySnapshotForDate,
  getPlanillaDailySnapshots,
  computeCombustibleDia,
} from "@/lib/termodinamicaAtencional";
import type { PlanillaDailySnapshot } from "@/lib/termodinamicaAtencional";
import { formatCombustibleResumen, formatCombustibleDetalle } from "@/lib/combustibleConciencia";
import {
  getProyectoById,
  getPeldanosByProyecto,
  markPeldanoEnCurso,
  markPeldanoConquistadoTiempo,
  markPeldanoConquistadoSituacion,
} from "@/lib/proyectos";
import type { RutasMentalesSet } from "@/lib/proyectos";
import {
  ensurePeldanoFromSegmento,
  resolveClaridadParaProyecto,
  sealPeldanosFromSegmentos,
  countSegmentosListosParaSellar,
} from "@/lib/segmentoPeldanoBridge";
import { RutasMentalesEditor } from "@/components/RutasMentalesEditor";
import {
  isWithinSegmentTimeMargin,
  segmentDurationMinutes,
  validateSegmentTimes,
  getJournalDateString,
  getJournalDayStartMs,
  getLimaDayStartMs,
} from "@/lib/segmentTime";
import {
  applyDayRolloverEntropia,
  applySegmentAttentionTick,
  classifyPuertaTiming,
  collectVozPuertaEvents,
  isWithinPuertaWindow,
  type SegmentAttentionEvent,
} from "@/lib/segmentAttentionEngine";
import {
  atencionBadgeLabel,
  computeAtencionCompare,
  computeAtencionPanoramicaDia,
  describeSegmentoAtencion,
} from "@/lib/atencionPanoramicaEngine";
import { speakPuertaSegmento } from "@/lib/puertaAtencionVoice";
import {
  computeDisciplinaDia,
  computeDisciplinaCompare,
  describeSegmentoDisciplina,
  disciplinaBadgeLabel,
  formatEstudioTipoChip,
  buildDisciplinaSerie,
} from "@/lib/disciplinaEngine";
import { scheduleSegmentNotifications, cancelAllNotifications, requestNotificationPermission, getNotificationPermission } from "@/lib/notifications";
import { auth } from "@/lib/firebase";
import { setActiveSegmento, registrarEvento, COMPONENTES } from "@/lib/evento-universal";
import { ManualTriggerButton } from "@/components/master-manual-drawer";
import { PlanificacionTutorial } from "@/components/planificacion/PlanificacionTutorial";
import { PlanificacionPrimerDia } from "@/components/planificacion/PlanificacionPrimerDia";
import { isTutorialDone } from "@/lib/planificacionOnboarding";
import { progressionToProfile } from "@/lib/planificacionProfile";
import { openDoctorIAChat } from "@/lib/doctorIaBridge";
import AnilloConciencia from "@/components/AnilloConciencia";
import BalanceConquistaPanel from "@/components/BalanceConquistaPanel";
import PlanificacionCockpit from "@/components/PlanificacionCockpit";
import ReservasTacticasDock from "@/components/ReservasTacticasDock";
import { SituacionCasaPanel } from "@/components/SituacionCasaPanel";
import { SegmentoProyectoSelect } from "@/components/planeacion/SegmentoProyectoSelect";
import { useSegmentoProyectoVinculo } from "@/hooks/useSegmentoProyectoVinculo";
import { calcularMetricasAnilloConciencia, calcularBalanceConquistaJornada, computeAnilloEstado, computeTimelineClockArcs, computeTimelineDayStats, formatMinutosJornada, nowToHalfDayLap } from "@/engines/ConcienciaEngine";

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
  tiempo: { label: "TIEMPO", sublabel: "Conquista de objetivos", color: NARANJA, icon: Clock, relojVisible: true, relojLabel: "Reloj Proyectivo", psBase: 0, psCierre: "PS al cumplir objetivo" },
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
    const history: Array<{ titulo: string; minPerUnit: number; totalMin: number; tipoReloj: string; fecha: number; excluirDeHistorial?: boolean }> = JSON.parse(data);
    const prefix = `${misionTitulo.trim()} → `;
    const matching = history.filter(h =>
      h.tipoReloj === "desglosador" &&
      h.titulo.startsWith(prefix) &&
      !h.excluirDeHistorial
    );
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

/** Opciones de energía al inicio / al cierre (Espejo). Letras ASCII: evitan "?" en móviles sin fuente Unicode. */
const ENERGIA_ESPEJO_OPTIONS = [
  { id: "fluido" as const, label: "Fluido", badge: "F", desc: "Sin presión" },
  { id: "concentrado" as const, label: "Concentrado", badge: "C", desc: "Foco activo" },
  { id: "limite" as const, label: "Al límite", badge: "L", desc: "Alta presión" },
];

/** Payload del modal «Cierre consciente» — energía al terminar (todos los tipos de vehículo). */
type CierreEnergiaModalPayload =
  | { kind: "flota"; vehicleId: string; status: "cumplido" | "archivado" }
  | { kind: "investigador"; vehicleId: string; cumplido: boolean; cantidadRealizada: number }
  | { kind: "desglosador"; vehicleId: string; subs: SubVehiculo[] }
  | { kind: "descanso"; vehicleId: string; status: "cumplido" | "archivado"; etiqueta: "recuperado" | "parcial" | "fragmentado"; nota: string };

const cleanSubTitulo = (t: string): string =>
  t.replace(/^Día\s+\d+\s*\[[^\]]+\]:\s*/i, "").trim();

function buildDesglosadorSubFromForm(
  s: { titulo: string; cantidadObjetivo: string; tiempoRecordMinPerUnit?: number; rutaEnfoqueActiva?: boolean },
  idx: number,
  idSuffix: number
): SubVehiculo {
  const cant = s.cantidadObjetivo ? Number(s.cantidadObjetivo) : undefined;
  const record = s.tiempoRecordMinPerUnit;
  const rutaEnfoque =
    s.rutaEnfoqueActiva && cant && cant > 0 && record && record > 0
      ? createRutaEnfoqueState(cant)
      : undefined;
  return {
    id: `sv_${idSuffix}_${idx}`,
    titulo: s.titulo.trim(),
    status: (idx === 0 ? "activo" : "pendiente") as SubVehiculo["status"],
    aperturaAt: idx === 0 ? Date.now() : undefined,
    cantidadObjetivo: cant,
    tiempoRecordMinPerUnit: record,
    tiempoSugeridoSeg:
      cant && record && cant > 0 ? Math.round(cant * record * 60) : undefined,
    rutaEnfoque,
  };
}

function cierrePayloadHasRutaEnfoque(p: CierreEnergiaModalPayload): boolean {
  if (p.kind === "desglosador") {
    return p.subs.some(sv => sv.rutaEnfoque?.activa && !sv.rutaDeclarada?.length);
  }
  return false;
}

function RutaEnfoqueBar({ restantes, ruta }: { restantes: number; ruta: { N: number; umbrales: { fluido: number; concentrado: number } } }) {
  const { umbrales, N } = ruta;
  const banda = getRutaBandaActual(restantes, umbrales);
  const meta = RUTA_BANDA_META[banda];
  const n = Math.max(1, N);
  const wFluido = ((n - umbrales.fluido) / n) * 100;
  const wConc = ((umbrales.fluido - umbrales.concentrado) / n) * 100;
  const wLim = (umbrales.concentrado / n) * 100;
  const markerLeft = Math.min(98, Math.max(2, ((n - Math.max(0, restantes)) / n) * 100));
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
      <motion.div
        className="relative h-2.5 rounded-full overflow-hidden flex"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        animate={banda === "limite" ? { boxShadow: ["0 0 0 rgba(248,113,113,0)", "0 0 10px rgba(248,113,113,0.35)", "0 0 0 rgba(248,113,113,0)"] } : {}}
        transition={banda === "limite" ? { duration: 1.2, repeat: Infinity } : {}}
      >
        <motion.div className="h-full" style={{ width: `${wFluido}%`, backgroundColor: "rgba(56,189,248,0.55)" }} animate={banda === "fluido" ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.55 }} transition={{ duration: 2, repeat: banda === "fluido" ? Infinity : 0 }} />
        <motion.div className="h-full" style={{ width: `${wConc}%`, backgroundColor: "rgba(168,85,247,0.55)" }} animate={banda === "concentrado" ? { opacity: [0.65, 1, 0.65] } : { opacity: 0.5 }} transition={{ duration: 1.6, repeat: banda === "concentrado" ? Infinity : 0 }} />
        <motion.div className="h-full flex-1" style={{ backgroundColor: "rgba(248,113,113,0.4)" }} animate={banda === "limite" ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.45 }} transition={{ duration: 1.2, repeat: banda === "limite" ? Infinity : 0 }} />
        <div className="absolute top-0 bottom-0 w-0.5 rounded-full" style={{ left: `${markerLeft}%`, backgroundColor: "#fff", boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
      </motion.div>
      <p className="text-[8px] text-center font-bold uppercase tracking-wider" style={{ color: meta.color }}>
        Banda actual: {meta.label} {meta.icon} · Restan {Math.max(0, Math.floor(restantes))}
      </p>
    </motion.div>
  );
}

/** PS por resistencia de profundidad (referencia por sub — solo situación/planificación). */
const computeDesglosadorDepthPS = (tiempoSugeridoSeg: number | undefined): number => {
  if (tiempoSugeridoSeg == null || !Number.isFinite(tiempoSugeridoSeg) || tiempoSugeridoSeg <= 0) return 0;
  return computeDesglosadorSessionDepthPS(tiempoSugeridoSeg);
};

type SituacionDesgloseSummary = {
  cumplidos: number;
  fallados: number;
  totalFilas: number;
  psFilas: number;
  psProfundidad: number;
  psDetalles: number;
  psTotal: number;
  minutosBloque: number;
  minutosGanados: number;
  minutosEnCola: number;
  minutosAdelanto: number;
  minutosGanadosSesion: number;
  minutosReales: number;
  eficienciaPct: number | null;
  retoNumero: number;
  casaHechas: number;
  casaPorTexto: CasaTextoCount[];
  mensaje: string;
};

function computeSituacionDesgloseSummary(vehicle: Vehicle): SituacionDesgloseSummary {
  const subs = (vehicle.subTareas || []).filter(s => s.enDesgloseCronometro);
  const cumplidos = subs.filter(s => s.resultadoSituacion === "cumplido").length;
  const fallados = subs.filter(s => s.resultadoSituacion === "fallado").length;
  const psFilas = cumplidos * 4;
  const psProfundidad = vehicle.situacionCronometro?.depthBlockPsGranted ?? 0;
  const psDetalles = subs.reduce(
    (acc, st) => acc + (st.detalles?.filter(d => d.entregado && !d.casa).length ?? 0),
    0
  );
  const sc = vehicle.situacionCronometro;
  const minutosBloque = sc?.bloqueInicioAt
    ? Math.max(1, Math.round((Date.now() - sc.bloqueInicioAt) / 60000))
    : 0;
  const bolsa = computeSituacionBolsaGanancia(vehicle.subTareas || [], sc);
  const minutosGanados = bolsa.minutosGanadosReto;
  const minutosReales = sumMinutosRealesCronometro(vehicle.subTareas || []);
  const eficienciaPct = computeEficienciaSituacionPct(minutosGanados, minutosReales);
  const psTotal = psFilas + psProfundidad + psDetalles;
  const allCasaItems = (vehicle.subTareas || []).flatMap(st => (st.detalles || []).filter(d => d.casa));
  const casaHechas = countCasaHechas(allCasaItems);
  const casaPorTexto = groupCasaByTexto(allCasaItems).filter(g => g.hechas > 0);

  let mensaje: string;
  if (cumplidos === subs.length && subs.length > 0) {
    mensaje = "Dominio total del bloque. Enumeraste, ejecutaste y cerraste con soberanía.";
  } else if (cumplidos >= fallados && cumplidos > 0) {
    mensaje = "Trabajo duro convertido en territorio conquistado. La mayoría de filas quedó cumplida.";
  } else if (cumplidos > 0) {
    mensaje = "Avance parcial en el bloque. Cada cumplido cuenta, incluso entre el ruido.";
  } else if (fallados > 0) {
    mensaje = "El bloque fue exigente; registrar lo fallado también es soberanía. Mañana afinas el desglose.";
  } else {
    mensaje = "Bloque de desglose cerrado. La claridad de enumerar ya es un acto de poder.";
  }

  return {
    cumplidos,
    fallados,
    totalFilas: subs.length,
    psFilas,
    psProfundidad,
    psDetalles,
    psTotal,
    minutosBloque,
    minutosGanados,
    minutosEnCola: bolsa.minutosEnCola,
    minutosAdelanto: bolsa.minutosAdelanto,
    minutosGanadosSesion: bolsa.minutosGanadosSesion,
    minutosReales,
    eficienciaPct,
    retoNumero: bolsa.retoNumero,
    casaHechas,
    casaPorTexto,
    mensaje,
  };
}

function situacionDesgloseBloqueListo(subTareas: SubTarea[], sc: Vehicle["situacionCronometro"]): boolean {
  if (sc?.activo !== true) return false;
  const cronSubs = subTareas.filter(s => s.enDesgloseCronometro);
  if (cronSubs.length === 0) return false;
  return !cronSubs.some(situacionFilaCronometroPendiente);
}

/** Timbres decrecientes al marcar cumplido — delegado a situacionAlertSounds. */
async function playSituacionChimes(count: number) {
  return playSituacionCumplidoChimes(count);
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
  excluirDeHistorial?: boolean;
  cumplidos?: number;
  fallados?: number;
  totalSubs?: number;
  subResumen?: Array<{
    titulo: string;
    status: "cumplido" | "fallado" | "pendiente";
    cantidadObjetivo?: number;
    cantidadLograda?: number;
    duracionMin?: number;
    rutaDeclarada?: RutaBandaId[];
  }>;
};

function isSubTareaSituacionTerminada(st: SubTarea): boolean {
  if (st.enDesgloseCronometro) {
    const r = st.resultadoSituacion ?? "pendiente";
    return r === "cumplido" || r === "fallado";
  }
  return st.completada;
}

/** Pendientes arriba, cerradas abajo — conserva el orden relativo de cada grupo. */
function sortSubTareasTrabajoPrimero(items: SubTarea[]): SubTarea[] {
  const pendientes = items.filter(s => !isSubTareaSituacionTerminada(s));
  const cerradas = items.filter(s => isSubTareaSituacionTerminada(s));
  return [...pendientes, ...cerradas];
}

function vehicleClosedAtMs(v: Vehicle): number {
  return v.cierreAt || v.aperturaAt || v.createdAt?.getTime?.() || 0;
}

const saveVehicleHistory = (
  titulo: string,
  minPerUnit: number,
  totalMin: number,
  tipoReloj: string,
  userId?: string,
  opts?: VehicleHistoryOpts
) => {
  if (opts?.excluirDeHistorial) return;
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

const STUB_EJES = { enfoque: { text: "", trifecta: "omitir" as const }, conflicto: { text: "", trifecta: "omitir" as const }, pasos: { text: "", trifecta: "omitir" as const }, limite: { text: "", trifecta: "omitir" as const } };

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
  const proyectoLaunchRef = useRef<{
    proyectoId: string;
    peldanoId: string;
    launch: "desglosador_tiempo" | "desglosador_situacion";
    plantillaSubTareas?: string[];
  } | null>(null);
  const proyectoLaunchHandledRef = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const flotaActivosRef = useRef<HTMLDivElement | null>(null);
  const prevActiveVehicleCountRef = useRef<number | null>(null);
  const scrollFlotaActivosIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      flotaActivosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);
  const [saving, setSaving] = useState(false);
  const [situacionReserva, setSituacionReserva] = useState<SituacionReservaItem[]>([]);
  const reservaActivas = useMemo(() => getReservaActivas(situacionReserva), [situacionReserva]);

  type PlanTab = "operar" | "metricas" | "meta";
  const [planLayout, setPlanLayout] = useState<"compact" | "full">(() => {
    try {
      const raw = localStorage.getItem("sistemicar-plan-layout");
      return raw === "full" ? "full" : "compact";
    } catch {
      return "compact";
    }
  });
  const [planTab, setPlanTab] = useState<PlanTab>(() => {
    try {
      const raw = localStorage.getItem("sistemicar-plan-tab");
      return raw === "metricas" || raw === "meta" ? raw : "operar";
    } catch {
      return "operar";
    }
  });
  const compactLayout = planLayout === "compact";
  const [metricasDetalleOpen, setMetricasDetalleOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("sistemicar-plan-layout", planLayout); } catch {}
  }, [planLayout]);
  useEffect(() => {
    try { localStorage.setItem("sistemicar-plan-tab", planTab); } catch {}
  }, [planTab]);

  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);

  const desglosadorUnlocked = hasDesglosadorAccess(
    progression?.subscriptionPlan,
    user?.email,
    progression?.rank,
    progression?.activeModules
  );
  const soberaniaDiaUnlocked = hasSoberaniaDiaAccess(
    progression?.subscriptionPlan,
    user?.email,
    progression?.rank,
    progression?.activeModules
  );
  const puntoCeroUnlocked = hasPuntoCeroAccess(
    progression?.subscriptionPlan,
    user?.email
  );
  const [dailyPS, setDailyPS] = useState(0);
  const [journalDayKey, setJournalDayKey] = useState(() => getJournalDayStartMs());
  const [yesterdayPS, setYesterdayPS] = useState<number | null>(null);
  const [centinelaEsperaSec, setCentinelaEsperaSec] = useState(0);
  const [centinelaBlockReason, setCentinelaBlockReason] = useState<string | null>(null);
  const [showDesglosadorCTA, setShowDesglosadorCTA] = useState(false);
  const [showPlanTutorial, setShowPlanTutorial] = useState(false);

  const planificacionProfile = useMemo(
    () => progressionToProfile(progression, user?.email),
    [progression, user?.email]
  );

  useEffect(() => {
    if (!user?.uid) return;
    if (!isTutorialDone(user.uid)) {
      setShowPlanTutorial(true);
    }
  }, [user?.uid]);

  const [titulo, setTitulo] = useState("");
  const [criterioFin, setCriterioFin] = useState<CriterioFin>("tiempo");
  const [criterioDetalle, setCriterioDetalle] = useState("");
  const [selectedTerminoType, setSelectedTerminoType] = useState<TipoTerminoRapido | null>(null);
  const [terminoDetalle, setTerminoDetalle] = useState("");
  const [vehicleMode, setVehicleMode] = useState<"selector" | "express" | "flota">("selector");
  const [tipoFlotaSeleccionado, setTipoFlotaSeleccionado] = useState<TipoFlota | null>(null);
  const [relojTiempo, setRelojTiempo] = useState<"proyectivo" | "produccion" | "investigador" | "desglosador">("proyectivo");
  const [intensidadEnergetica, setIntensidadEnergetica] = useState<"fluido" | "concentrado" | "limite" | null>(null);
  const [cantidadInvestigador, setCantidadInvestigador] = useState("");
  const [horaFinProyectiva, setHoraFinProyectiva] = useState("");
  const [cantidadProduccion, setCantidadProduccion] = useState("");
  const [tiempoProduccion, setTiempoProduccion] = useState("");
  const [showTituloProdSuggestions, setShowTituloProdSuggestions] = useState(false);
  const [showDesglosadorTitleSuggestions, setShowDesglosadorTitleSuggestions] = useState(false);
  const [desglosadorSubs, setDesglosadorSubs] = useState<Array<{ tempId: string; titulo: string; cantidadObjetivo: string; tiempoRecordMinPerUnit?: number; rutaEnfoqueActiva?: boolean }>>([{ tempId: "sub_0", titulo: "", cantidadObjetivo: "" }]);
  const [historialSubs, setHistorialSubs] = useState<string[]>([]);
  const [sugerenciasIA, setSugerenciasIA] = useState<string[]>([]);
  const [sugerenciasIALoading, setSugerenciasIALoading] = useState(false);
  const [sugerenciasIASeleccionadas, setSugerenciasIASeleccionadas] = useState<Set<string>>(new Set());
  const [activeSubSuggestionIdx, setActiveSubSuggestionIdx] = useState<number | null>(null);
  const [duracionDescansoH, setDuracionDescansoH] = useState("");
  const [duracionDescansoM, setDuracionDescansoM] = useState("");
  const [tipoDescanso, setTipoDescanso] = useState<"intercepcion" | "microcarga" | "reset_profundo" | "punto_cero" | null>(null);
  const [showHistorialCompleto, setShowHistorialCompleto] = useState(false);
  const [goldenFlash, setGoldenFlash] = useState(false);
  const [recordBanner, setRecordBanner] = useState<{ mejora: number; titulo: string } | null>(null);
  const [showBoveda, setShowBoveda] = useState(false);
  const [selectedBovedaRecord, setSelectedBovedaRecord] = useState<VehicleRecord | null>(null);
  const [tikSoundEnabled, setTikSoundEnabledState] = useState(() => isTikSoundEnabled());
  const [situacionAlertsEnabled, setSituacionAlertsEnabledState] = useState(() => isSituacionAlertsEnabled());
  const [puertaVozEnabled, setPuertaVozEnabledState] = useState(() => isPuertaVozEnabled());
  const [desglosadorVozEnabled, setDesglosadorVozEnabledState] = useState(() => isDesglosadorVoiceEnabled());

  const [anilloTick, setAnilloTick] = useState(0);
  const [conquistaPulse, setConquistaPulse] = useState(false);
  const conquistaPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerConquistaPulse = useCallback(() => {
    setConquistaPulse(true);
    if (conquistaPulseTimerRef.current) clearTimeout(conquistaPulseTimerRef.current);
    conquistaPulseTimerRef.current = setTimeout(() => setConquistaPulse(false), 800);
  }, []);

  const recordRutaBandCross = useCallback((payload: {
    vehicleId: string;
    subId: string;
    subTitulo: string;
    banda: RutaBandaId;
  }) => {
    if (!user) return;
    void recordFocusBandEvent(user.uid, {
      source: "ruta_cruce",
      banda: payload.banda,
      vehicleId: payload.vehicleId,
      subVehicleId: payload.subId,
      subTitulo: payload.subTitulo,
    });
  }, [user]);

  const recordVehiculoInicio = useCallback((vehicleId: string, banda?: "fluido" | "concentrado" | "limite") => {
    if (!user || !banda) return;
    void recordFocusBandEvent(user.uid, { source: "vehiculo_inicio", banda, vehicleId });
  }, [user]);

  const recordVehiculoCierre = useCallback((vehicleId: string, banda?: "fluido" | "concentrado" | "limite") => {
    if (!user || !banda) return;
    void recordFocusBandEvent(user.uid, { source: "vehiculo_cierre", banda, vehicleId });
  }, [user]);

  const recordDescansoCuerpo = useCallback((vehicleId: string) => {
    if (!user) return;
    void recordFocusBandEvent(user.uid, { source: "descanso_cuerpo", banda: "fluido", vehicleId });
  }, [user]);

  // ── RADIOGRAFÍA DEL OPERADOR ──
  const [radiografiaTokens, setRadiografiaTokens] = useState<RadiografiaTokenData>({ tokens: 0, milestonesCrossed: [], lastSubscriptionRefresh: "" });
  const [showRadiografia, setShowRadiografia] = useState(false);
  const [generandoRadiografia, setGenerandoRadiografia] = useState(false);
  const [radiografiaReport, setRadiografiaReport] = useState<any>(null);
  const [gordaHistory, setGordaHistory] = useState<VehicleHistoryEntry[]>([]);

  const [planilla, setPlanilla] = useState<Planilla | null>(null);
  const [planillaFecha, setPlanillaFecha] = useState(() => getJournalDateString());
  const [showCrearSegmento, setShowCrearSegmento] = useState(false);
  const [segmentoProgramando, setSegmentoProgramando] = useState(false);
  const segmentosListEndRef = useRef<HTMLDivElement | null>(null);
  const labIntroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nuevoSegNombre, setNuevoSegNombre] = useState("");
  const [nuevoSegHoraInicio, setNuevoSegHoraInicio] = useState("");
  const [nuevoSegHoraFin, setNuevoSegHoraFin] = useState("");
  const [nuevoSegColor, setNuevoSegColor] = useState(SEGMENT_COLORS[0]);
  const [nuevoSegIcono, setNuevoSegIcono] = useState(SEGMENT_ICONS[0]);
  const [nuevoSegCentinelaEnabled, setNuevoSegCentinelaEnabled] = useState(true);
  const [nuevoSegProyectoId, setNuevoSegProyectoId] = useState("");
  const [nuevoSegRutas, setNuevoSegRutas] = useState<RutasMentalesSet | null>(null);
  const [expandedSegId, setExpandedSegId] = useState<string | null>(null);
  const segmentosAutoExpandRef = useRef(false);
  // --- RUTINAS ---
  const [plantillasRutina, setPlantillasRutina] = useState<PlantillaRutina[]>([]);
  const [rutinaBanner, setRutinaBanner] = useState<PlantillaRutina | null>(null);
  const [showRutinasPanel, setShowRutinasPanel] = useState(false);
  const [showGuardarRutina, setShowGuardarRutina] = useState(false);
  const [nuevaRutinaNombre, setNuevaRutinaNombre] = useState("");
  const [nuevaRutinaTipo, setNuevaRutinaTipo] = useState<PlantillaRutina["tipo"]>("semana_laboral");
  const [nuevaRutinaDias, setNuevaRutinaDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [guardandoRutina, setGuardandoRutina] = useState(false);
  const [cargandoRutinaId, setCargandoRutinaId] = useState<string | null>(null);
  const [rutinaResaltadaId, setRutinaResaltadaId] = useState<string | null>(null);
  const rutinaItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [notifPermission, setNotifPermission] = useState<string>(getNotificationPermission());
  const [showLabIntrospeccion, setShowLabIntrospeccion] = useState(false);
  const [closedSegmentDuration, setClosedSegmentDuration] = useState(0);
  const [closedSegmentName, setClosedSegmentName] = useState("");
  const [segmentTick, setSegmentTick] = useState(0);
  const [activandoSegId, setActivandoSegId] = useState<string | null>(null);
  const [showCierreJornada, setShowCierreJornada] = useState(false);
  const [todayCierreJornada, setTodayCierreJornada] = useState<CierreJornadaLog | null>(null);
  const [cierreEnergiaPending, setCierreEnergiaPending] = useState<CierreEnergiaModalPayload | null>(null);
  const [cierreEnergiaSeleccion, setCierreEnergiaSeleccion] = useState<"fluido" | "concentrado" | "limite" | null>(null);
  const [cierreRutaSeleccion, setCierreRutaSeleccion] = useState<Set<RutaBandaId>>(new Set());
  const [cierreRutaSinUso, setCierreRutaSinUso] = useState(false);
  const [cierreRutaPatron, setCierreRutaPatron] = useState<RutaSeguimientoPatron | null>(null);
  const [showDeposito, setShowDeposito] = useState(false);
  const [situacionDesgloseCelebration, setSituacionDesgloseCelebration] = useState<{
    vehicleId: string;
    titulo: string;
    summary: SituacionDesgloseSummary;
  } | null>(null);
  const situacionBloqueCelebratedRef = useRef<Set<string>>(new Set());
  const [situacionBloqueSummaries, setSituacionBloqueSummaries] = useState<
    Record<string, SituacionDesgloseSummary>
  >({});

  const openSituacionDesgloseCelebration = useCallback(
    (vehicleId: string, titulo: string, summary: SituacionDesgloseSummary) => {
      setSituacionBloqueSummaries(prev => ({ ...prev, [vehicleId]: summary }));
      setSituacionDesgloseCelebration({ vehicleId, titulo, summary });
    },
    []
  );

  const safeAwardPS = useCallback(async (amount: number, source: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await awardSovereigntyPoints(user.uid, amount, source);
      setDailyPS(getDailyPointsLocalSync(user.uid).total);
      return true;
    } catch (e) {
      console.error("[safeAwardPS]", e);
      toast.error("PS no registrados — reintenta", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return false;
    }
  }, [user]);

  const recordBloqueCierre = useCallback((payload: {
    vehicleId: string;
    sub: SubVehiculo;
    status: string;
  }) => {
    if (!user || payload.status !== "cumplido") return;

    const vehicle = vehiclesRef.current.find(v => v.id === payload.vehicleId);
    if (vehicle?.tipoReloj === "desglosador") {
      void (async () => {
        const { sub, awarded } = await awardDesglosadorSubPointsIfNeeded(
          vehicle.titulo,
          payload.sub,
          safeAwardPS
        );
        if (awarded > 0) {
          const patchOne = (list: Vehicle[]) =>
            list.map(v => {
              if (v.id !== payload.vehicleId) return v;
              const subs = (v.subVehiculos ?? []).map(s => (s.id === sub.id ? sub : s));
              return { ...v, subVehiculos: subs };
            });
          setVehicles(patchOne);
          vehiclesRef.current = patchOne(vehiclesRef.current);
          saveLocalVehicles(vehiclesRef.current);
          const subVehiculos = vehiclesRef.current.find(v => v.id === payload.vehicleId)?.subVehiculos;
          if (subVehiculos) {
            void updateVehicle(user.uid, payload.vehicleId, { subVehiculos }).catch(e =>
              console.warn("[recordBloqueCierre] psOtorgados sync:", e)
            );
          }
          toast.success(`+${awarded} PS · ${cleanSubTitulo(sub.titulo)}`, {
            description: `Sub cumplido (+${DESGLOSADOR_SUB_CUMPLIDO_PS} base${awarded > DESGLOSADOR_SUB_CUMPLIDO_PS ? " + ruta" : ""}) · sumado a tu barra del día`,
            style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
            duration: 2800,
          });
        }
      })();
    }

    void recordFocusBandEvent(user.uid, {
      source: "bloque_cierre",
      banda: inferBandaBloque(payload.sub),
      vehicleId: payload.vehicleId,
      subVehicleId: payload.sub.id,
      subTitulo: payload.sub.titulo,
      psEspectro: psEspectroBloque(payload.sub),
    });
  }, [user, safeAwardPS]);

  const toastDailyPSTotal = useCallback(() => {
    if (!user) return;
    const { total } = getDailyPointsLocalSync(user.uid);
    toast(`PS del día: ${total}`, {
      duration: 2200,
      style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}60`, color: GOLD },
    });
  }, [user]);

  useEffect(() => {
    if (!rutinaResaltadaId || !showRutinasPanel) return;
    const el = rutinaItemRefs.current[rutinaResaltadaId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const timer = setTimeout(() => setRutinaResaltadaId(null), 2000);
    return () => clearTimeout(timer);
  }, [rutinaResaltadaId, showRutinasPanel, plantillasRutina.length]);

  useEffect(() => {
    if (!user) return;
    const checkNightBlocking = async () => {
      const hour = new Date().getHours();
      if (hour >= 22) {
        const todayCierre = await getTodayCierreJornada(user.uid);
        setTodayCierreJornada(todayCierre);
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
    const interval = setInterval(() => setAnilloTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => {
    if (conquistaPulseTimerRef.current) clearTimeout(conquistaPulseTimerRef.current);
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

  const {
    proyectosHub,
    resolverProyectoId,
    volcarMetricasAlHub,
  } = useSegmentoProyectoVinculo(user?.uid, segmentoActivo);

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
      const scheduled = segmentDurationMinutes(segmentoActivo.horaInicio, segmentoActivo.horaFin);
      if (scheduled > 0 && elapsed > scheduled * 1.5) return "PESO_TIEMPO";
    }
    return null;
  }, [planilla, segmentoActivo]);

  const anilloModel = useMemo(() => {
    void anilloTick;
    const segs = planilla?.segmentos || [];
    const nowMs = Date.now();
    const vehiculosAnillo = filterVehiclesForEntropy(vehicles, nowMs);
    const metricas = calcularMetricasAnilloConciencia({
      segmentos: segs,
      vehiculos: vehiculosAnillo,
      now: nowMs,
    });
    const anilloEstado = computeAnilloEstado({ segmentos: segs, vehiculos: vehiculosAnillo, now: nowMs });
    const pointerLap = nowToHalfDayLap(nowMs);
    const timelineArcs = computeTimelineClockArcs({ vehiculos: vehiculosAnillo, segmentos: segs, now: nowMs });
    const dayStats = computeTimelineDayStats({ vehiculos: vehiculosAnillo, segmentos: segs, now: nowMs });
    const segConquistados = segs.filter((s: any) => s.estado === "cerrado_manual").length;
    return {
      segs,
      metricas,
      anilloEstado,
      pointerLap,
      timelineArcs,
      dayStats,
      segConquistados,
    };
  }, [planilla, vehicles, anilloTick]);

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
        const local =
          vehiclesRef.current.find(lv => lv.id === v.id) ??
          getLocalVehicles().find(lv => lv.id === v.id);
        return mergeActiveVehicleSessionState(v, local);
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
      const mergedById = new Map(merged.map(v => [v.id, v]));
      const nowMs = Date.now();
      const rescueFrom = (list: Vehicle[]) =>
        list.filter(
          v =>
            v.status === "activo" &&
            !v.autoVerdad &&
            !mergedIds.has(v.id) &&
            !(v.clientRequestId && merged.some(m => m.clientRequestId === v.clientRequestId)) &&
            !closingInProgressRef.current.has(v.id) &&
            !wasVehicleRecentlyClosed(v.id) &&
            !isOrphanDesglosadorInterrupt(v, mergedById) &&
            shouldPreserveLocalActivo(v, nowMs)
        );
      const rescued = [
        ...rescueFrom(vehiclesRef.current),
        ...rescueFrom(getLocalVehicles()),
      ].filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i);
      if (rescued.length > 0) {
        console.warn(`[Vehicles] Rescatando ${rescued.length} activo(s) ausentes del snapshot:`, rescued.map(v => `${v.id}:${v.titulo}`));
        merged = [...rescued, ...merged];
      }
      setVehicles(merged);
    }, (e) => console.error(e));
    const unsub2 = subscribeToProgression(user.uid, (prog) => setProgression(prog), (e) => console.error(e));
    const unsub3 = subscribeToEnergyLogs(user.uid, (data) => setEnergyLogs(data), (e) => console.error(e));
    const unsub4 = subscribeToSituacionReserva(user.uid, setSituacionReserva, e => console.error(e));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void reconcileGhostActiveVehicles(user.uid);
    const ghostInterval = setInterval(() => {
      void reconcileGhostActiveVehicles(user.uid);
    }, 60_000);
    return () => clearInterval(ghostInterval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDailyPoints(user.uid, (data) => setDailyPS(data.total), (e) => console.error(e));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadYesterday = () => {
      getYesterdayDailyPointsTotal(user.uid)
        .then(setYesterdayPS)
        .catch(() => setYesterdayPS(0));
    };
    loadYesterday();
    const onDayChange = () => {
      setJournalDayKey(getJournalDayStartMs());
      setYesterdayPS(null);
      loadYesterday();
      void reconcileGhostActiveVehicles(user.uid);
    };
    window.addEventListener("journal-day-changed", onDayChange);
    return () => window.removeEventListener("journal-day-changed", onDayChange);
  }, [user]);

  const dailyPsBar = useMemo(
    () => computeDailyPsBarModel(dailyPS, yesterdayPS ?? 0),
    [dailyPS, yesterdayPS]
  );

  const [yesterdayTermoSnapshot, setYesterdayTermoSnapshot] = useState<PlanillaDailySnapshot | null>(null);
  const [disciplinaSnapshots, setDisciplinaSnapshots] = useState<PlanillaDailySnapshot[]>([]);
  const [focusEventsToday, setFocusEventsToday] = useState<FocusBandEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadEvents = () => {
      const fecha = getJournalDateString();
      getFocusBandEventsForRange(user.uid, fecha, fecha)
        .then(setFocusEventsToday)
        .catch(() => setFocusEventsToday([]));
    };
    loadEvents();
    window.addEventListener("focus-band-events-updated", loadEvents);
    window.addEventListener("journal-day-changed", loadEvents);
    return () => {
      window.removeEventListener("focus-band-events-updated", loadEvents);
      window.removeEventListener("journal-day-changed", loadEvents);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const yesterdayFecha = getJournalDateString(getJournalDayStartMs() - 86400000);
    getPlanillaDailySnapshotForDate(user.uid, yesterdayFecha)
      .then(setYesterdayTermoSnapshot)
      .catch(() => setYesterdayTermoSnapshot(null));
  }, [user, planillaFecha, dailyPS, vehicles]);

  useEffect(() => {
    if (!user) return;
    getPlanillaDailySnapshots(user.uid, 14)
      .then(setDisciplinaSnapshots)
      .catch(() => setDisciplinaSnapshots([]));
  }, [user, planillaFecha, dailyPS, vehicles]);

  const todayTermoLive = useMemo(() => {
    const dayStartMs = getJournalDayStartMs();
    const jornadaVehicles = filterVehiclesForEntropy(
      vehicles.filter(v => vehicleEnTermoJornada(v, dayStartMs)),
      Date.now()
    );
    const balance = calcularBalanceConquistaJornada({
      segmentos: planilla?.segmentos || [],
      vehiculos: jornadaVehicles,
      now: Date.now(),
      dayStartMs,
    });
    return buildDailySnapshot({
      fecha: getJournalDateString(),
      segmentos: planilla?.segmentos || [],
      vehicles: jornadaVehicles,
      dayStartMs,
      logs: [],
      events: focusEventsToday,
      conquistaMin: balance.conquistaMin,
      entropiaMin: balance.entropiaMin,
      vacioMin: balance.vacioMin,
    });
  }, [planilla, vehicles, focusEventsToday]);

  const termoCompare = useMemo(
    () => computeTermodinamicaCompareV2(yesterdayTermoSnapshot, todayTermoLive),
    [yesterdayTermoSnapshot, todayTermoLive]
  );

  const combustibleLive = useMemo(() => {
    const dayStartMs = getJournalDayStartMs();
    const jornadaVehicles = vehicles.filter(v => vehicleEnTermoJornada(v, dayStartMs));
    return computeCombustibleDia(jornadaVehicles, dayStartMs);
  }, [vehicles, segmentTick, anilloTick]);

  const disciplinaLive = useMemo(() => {
    const dayStartMs = getLimaDayStartMs();
    const jornadaStart = getJournalDayStartMs();
    const jornadaVehicles = vehicles.filter(v => {
      const ts = v.cierreAt || v.aperturaAt || v.createdAt?.getTime?.() || 0;
      return ts >= jornadaStart;
    });
    return computeDisciplinaDia({
      segmentos: planilla?.segmentos || [],
      vehicles: jornadaVehicles,
      dayStartMs,
    });
  }, [planilla, vehicles, segmentTick]);

  const atencionLive = useMemo(() => {
    const dayStartMs = getLimaDayStartMs();
    return computeAtencionPanoramicaDia({
      segmentos: planilla?.segmentos || [],
      nowMs: Date.now(),
      dayStartMs,
    });
  }, [planilla, segmentTick, anilloTick]);

  const atencionCompare = useMemo(
    () => computeAtencionCompare(null, atencionLive),
    [atencionLive]
  );

  const atencionBySegmentId = useMemo(
    () => new Map(atencionLive.segmentos.map(s => [s.segmentoId, s])),
    [atencionLive]
  );

  const disciplinaCompare = useMemo(
    () => computeDisciplinaCompare(yesterdayTermoSnapshot?.disciplina, disciplinaLive),
    [yesterdayTermoSnapshot, disciplinaLive]
  );

  const disciplinaBySegmentId = useMemo(
    () => new Map(disciplinaLive.segmentos.map(s => [s.segmentoId, s])),
    [disciplinaLive]
  );

  const disciplinaSerie = useMemo(
    () =>
      buildDisciplinaSerie(disciplinaSnapshots, disciplinaLive, getJournalDateString()),
    [disciplinaSnapshots, disciplinaLive]
  );

  useEffect(() => {
    if (!user) return;
    const onAward = () => {
      setGoldenFlash(true);
      setTimeout(() => setGoldenFlash(false), 2500);
      setDailyPS(getDailyPointsLocalSync(user.uid).total);
    };
    window.addEventListener("sovereignty-points-awarded", onAward);
    return () => window.removeEventListener("sovereignty-points-awarded", onAward);
  }, [user]);

  useEffect(() => {
    const warm = () => warmupSpeechSynthesis(true);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      warm();
      recoverSpeechQueue();
    };
    window.addEventListener("pointerdown", warm);
    document.addEventListener("visibilitychange", onVisible);
    warm();
    return () => {
      window.removeEventListener("pointerdown", warm);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    getPlanillaHoy(user.uid).then(p => setPlanilla(p));
    const unsub = subscribeToPlanilla(user.uid, planillaFecha, (p) => setPlanilla(p), (e) => console.error(e));
    return unsub;
  }, [user, planillaFecha]);

  useEffect(() => {
    if (planilla?.segmentos?.length && !segmentosAutoExpandRef.current) {
      segmentosAutoExpandRef.current = true;
      setExpandedSegId("segmentos");
    }
  }, [planilla?.segmentos?.length]);

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
    if (prevSegId && currentSegId && prevSegId !== currentSegId && user && planilla) {
      const nuevoSeg = planilla.segmentos.find(s => s.id === currentSegId);
      const vehiculosActivos = vehicles.filter(v => v.status === "activo" && !v.autoVerdad);
      vehiculosActivos.forEach(v => {
        const nuevoConteo = (v.segmentosCruzados || 0) + 1;
        const updates: {
          segmentosCruzados: number;
          segmentoMontadoId?: string;
          segmentoMontadoNombre?: string;
        } = { segmentosCruzados: nuevoConteo };
        if (v.tipoFlota === "situacion" && nuevoSeg) {
          updates.segmentoMontadoId = nuevoSeg.id;
          updates.segmentoMontadoNombre = nuevoSeg.nombre;
        }
        updateVehicle(user.uid, v.id, updates).catch(() => {});
        v.segmentosCruzados = nuevoConteo;
        if (updates.segmentoMontadoId) v.segmentoMontadoId = updates.segmentoMontadoId;
        if (updates.segmentoMontadoNombre) v.segmentoMontadoNombre = updates.segmentoMontadoNombre;
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
      const nowMs = Date.now();
      const fechaHoy = getJournalDateString();

      if (planilla.fecha !== fechaHoy) {
        const { segmentos: rolled, events, changed } = applyDayRolloverEntropia(planilla.segmentos, nowMs);
        if (changed) {
          const finalized: Planilla = { ...planilla, segmentos: rolled };
          savePlanilla(user.uid, finalized);
          toast.error("Jornada cerrada", {
            description: "Segmentos activos pasaron a entropía al cambiar el día (máx. 24 h por segmento).",
            style: { backgroundColor: "#1a0000", border: `2px solid ${BLOOD}`, color: BLOOD },
            duration: 6000,
          });
          for (const ev of events) {
            if (ev.type === "day_rollover_entropia") {
              toast.error(`ENTROPÍA: ${ev.nombre}`, {
                description: "0 PS. No cerraste a tiempo. El sistema no perdona la omisión.",
                style: { backgroundColor: "#1a0000", border: `2px solid ${BLOOD}`, color: BLOOD },
                duration: 6000,
              });
            }
          }
        }
        setPlanillaFecha(fechaHoy);
        return;
      }

      // Segmentos usan reloj HH:mm anclado a medianoche (Lima), no al inicio de jornada 05:00.
      const dayStart = getLimaDayStartMs(nowMs);
      const { segmentos: nextSegmentos, events, changed } = applySegmentAttentionTick(
        planilla.segmentos,
        nowMs,
        dayStart
      );

      let segmentosAfterVoz = nextSegmentos;
      const vozEvents = collectVozPuertaEvents(nextSegmentos, nowMs, dayStart);
      if (vozEvents.length > 0) {
        let vozChanged = false;
        segmentosAfterVoz = nextSegmentos.map(seg => {
          const ve = vozEvents.find(v => v.segId === seg.id);
          if (!ve) return seg;
          vozChanged = true;
          speakPuertaSegmento({ nombre: ve.nombre, ordinal: ve.ordinal, total: ve.total });
          return { ...seg, vozDisparadaAt: nowMs };
        });
        if (vozChanged) {
          const updatedVoz = { ...planilla, segmentos: segmentosAfterVoz };
          savePlanilla(user.uid, updatedVoz);
          setPlanilla(updatedVoz);
        }
      }

      for (const ev of events as SegmentAttentionEvent[]) {
        if (ev.type === "entropia") {
          const desc =
            ev.reason === "missed_puerta"
              ? "Puerta de atención no abierta en ±5 min. 0 PS."
              : ev.reason === "past_end"
                ? "No cerraste a tiempo. El sistema no perdona la omisión."
                : "Ventana de segmento perdida sin puerta consciente.";
          toast.error(`ENTROPÍA: ${ev.nombre}`, {
            description: desc,
            style: { backgroundColor: "#1a0000", border: `2px solid ${BLOOD}`, color: BLOOD },
            duration: 6000,
          });
        }
      }

      if (changed) {
        const updated = { ...planilla, segmentos: segmentosAfterVoz };
        savePlanilla(user.uid, updated);
        setPlanilla(updated);
      }
      setSegmentTick(t => t + 1);
    };

    const interval = setInterval(checkPuertaAtencion, 30000);
    const tickFast = setInterval(() => setSegmentTick(t => t + 1), 15_000);
    checkPuertaAtencion();
    return () => {
      clearInterval(interval);
      clearInterval(tickFast);
    };
  }, [user, planilla]);

  useEffect(() => {
    if (!user || !planilla) return;
    const snap = {
      indiceAtencion: atencionLive.indiceAtencion,
      ratioAntesVoz: atencionLive.ratioAntesVoz,
      puertasAbiertas: atencionLive.puertasAbiertas,
    };
    const prev = planilla.atencionSnapshot;
    if (
      prev &&
      prev.indiceAtencion === snap.indiceAtencion &&
      prev.puertasAbiertas === snap.puertasAbiertas &&
      prev.ratioAntesVoz === snap.ratioAntesVoz
    ) {
      return;
    }
    const updated = { ...planilla, atencionSnapshot: snap };
    savePlanilla(user.uid, updated).catch(() => {});
    setPlanilla(updated);
  }, [
    user?.uid,
    planilla?.fecha,
    atencionLive.indiceAtencion,
    atencionLive.puertasAbiertas,
    atencionLive.ratioAntesVoz,
  ]);

  const vehiclesRef = useRef(vehicles);
  const desglosadorSyncTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const closingInProgressRef = useRef<Set<string>>(new Set());
  const pausaInterrupcionLockRef = useRef<string | null>(null);
  vehiclesRef.current = vehicles;

  useEffect(() => {
    resetCentinelaLaunchGate();
    maybeReleaseStaleSuppression(15_000);
    setCierreEnergiaPending(null);
    setCierreEnergiaSeleccion(null);
    setCierreRutaSeleccion(new Set());
    setShowCierreJornada(false);
    setSituacionDesgloseCelebration(null);
    setSaving(false);
    setIsCreating(false);
    setVehicleMode("selector");
    setTipoFlotaSeleccionado(null);
    closingInProgressRef.current.clear();
    try {
      const layout = localStorage.getItem("sistemicar-plan-layout");
      if (layout !== "full") setPlanTab("operar");
    } catch { /* ignore */ }
    try {
      const nowMs = Date.now();
      const localRaw = getLocalVehicles();
      const byId = new Map(localRaw.map(v => [v.id, v]));
      const localActivos = localRaw.filter(
        v =>
          v.status === "activo" &&
          !v.autoVerdad &&
          !wasVehicleRecentlyClosed(v.id) &&
          !isOrphanDesglosadorInterrupt(v, byId) &&
          shouldPreserveLocalActivo(v, nowMs)
      );
      if (localActivos.length > 0) {
        setVehicles(prev => {
          const ids = new Set(prev.map(v => v.id));
          const crqs = new Set(prev.map(v => v.clientRequestId).filter(Boolean));
          const add = localActivos.filter(
            la => !ids.has(la.id) && !(la.clientRequestId && crqs.has(la.clientRequestId))
          );
          return add.length > 0 ? [...add, ...prev] : prev;
        });
      }
    } catch (e) {
      console.warn("[Planeacion] sync local activos:", e);
    }
  }, []);

  const orphanInterruptSweepRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    const byId = new Map(vehicles.map(v => [v.id, v]));
    const orphans = vehicles.filter(
      v =>
        isOrphanDesglosadorInterrupt(v, byId) &&
        !orphanInterruptSweepRef.current.has(v.id) &&
        !closingInProgressRef.current.has(v.id)
    );
    if (orphans.length === 0) return;
    const now = Date.now();
    const patches = new Map(
      orphans.map(o => {
        const patch = {
          status: "archivado" as const,
          cierreAt: now,
          duracionFinal: Math.max(1, Math.round((now - (o.aperturaAt || now)) / 60000)),
          cierreManual: false,
        };
        return [o.id, patch] as const;
      })
    );
    for (const o of orphans) {
      orphanInterruptSweepRef.current.add(o.id);
      notifyVehicleClosed(o.id);
      const patch = patches.get(o.id)!;
      void updateVehicle(user.uid, o.id, patch).catch(e => console.warn("[orphan-interrupt]", o.id, e));
      void updateVehicleStatus(user.uid, o.id, "archivado").catch(e => console.warn("[orphan-interrupt] status", o.id, e));
    }
    setVehicles(prev => prev.map(v => {
      const patch = patches.get(v.id);
      return patch ? { ...v, ...patch } : v;
    }));
    vehiclesRef.current = vehiclesRef.current.map(v => {
      const patch = patches.get(v.id);
      return patch ? { ...v, ...patch } : v;
    });
    saveLocalVehicles(vehiclesRef.current);
    releaseCentinela();
  }, [user, vehicles]);

  const persistVehiclesRef = () => {
    saveLocalVehicles(vehiclesRef.current);
  };

  const checkTraslado50Ref = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const onCentinelaUi = (e: Event) => {
      const detail = (e as CustomEvent<CentinelaUiState>).detail;
      setCentinelaEsperaSec(detail.esperaSec);
      setCentinelaBlockReason(detail.blockReason);
    };
    window.addEventListener("centinela-ui-state", onCentinelaUi);
    return () => window.removeEventListener("centinela-ui-state", onCentinelaUi);
  }, []);

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
              cierreManual: false
            });
            await updateVehicleStatus(user.uid, v.id, "archivado");
            toast.info(`Cierre automático: "${v.titulo}"`, {
              description: `Pasó el 50% del margen tras ${v.criterioDetalle}. Vehículo archivado.`,
              style: { backgroundColor: PIZARRA, border: `1px solid ${SLATE}40`, color: SLATE },
              duration: 7000
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
    if (!user) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        checkTraslado50Ref.current?.();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user]);

  useEffect(() => {
    if (relojTiempo !== "desglosador" || titulo.trim().length < 3) {
      setHistorialSubs([]);
      return;
    }
    const subs = getDesglosadorHistorico(titulo.trim());
    setHistorialSubs(subs);
  }, [titulo, relojTiempo]);

  useEffect(() => {
    if (!user || proyectoLaunchHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get("proyectoId");
    const peldanoId = params.get("peldanoId") ?? params.get("peldañoId");
    const launch = params.get("launch");
    if (!proyectoId || !peldanoId || !launch) return;
    if (launch !== "desglosador_tiempo" && launch !== "desglosador_situacion") return;

    proyectoLaunchHandledRef.current = true;

    void (async () => {
      try {
        const proyecto = await getProyectoById(user.uid, proyectoId);
        const allPeldanos = await getPeldanosByProyecto(user.uid, proyectoId);
        const peldano = allPeldanos.find(p => p.id === peldanoId);
        if (!proyecto || !peldano) {
          toast.error("Proyecto o peldaño no encontrado");
          return;
        }

        const tituloLaunch = `${proyecto.titulo} → ${peldano.titulo}`;
        proyectoLaunchRef.current = {
          proyectoId,
          peldanoId,
          launch,
          plantillaSubTareas: peldano.plantillaSubTareas,
        };

        setIsCreating(true);
        setVehicleMode("flota");
        setTitulo(tituloLaunch);

        if (launch === "desglosador_tiempo") {
          setTipoFlotaSeleccionado("tiempo");
          setRelojTiempo("desglosador");
          let subs: Array<{ tempId: string; titulo: string; cantidadObjetivo: string; tiempoRecordMinPerUnit?: number; rutaEnfoqueActiva?: boolean }>;
          if (peldano.plantillaSubs && peldano.plantillaSubs.length > 0) {
            subs = peldano.plantillaSubs.map((s, i) => ({
              tempId: `sub_${i}`,
              titulo: s.titulo,
              cantidadObjetivo: s.cantidadObjetivo != null ? String(s.cantidadObjetivo) : "",
            }));
          } else {
            const hist = getDesglosadorHistorico(tituloLaunch);
            subs = hist.length > 0
              ? hist.map((t, i) => ({ tempId: `sub_${i}`, titulo: t, cantidadObjetivo: "" }))
              : [{ tempId: "sub_0", titulo: "", cantidadObjetivo: "" }];
          }
          setDesglosadorSubs(subs);
        } else {
          setTipoFlotaSeleccionado("situacion");
          setTerminoDetalle("Al cerrar bloque de desglose");
        }

        navigate("/planeacion", { replace: true });
        toast.info(`Proyecto: ${proyecto.titulo}`, {
          description: `Peldaño «${peldano.titulo}» listo para lanzar`,
          duration: 3500,
        });
      } catch {
        toast.error("No se pudo preparar el lanzamiento desde proyecto");
      }
    })();
  }, [user, navigate]);

  const resetForm = () => {
    setTitulo("");
    setCriterioFin("tiempo");
    setCriterioDetalle("");
    setIsCreating(false);
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
    proyectoLaunchRef.current = null;
    setCierreEnergiaPending(null);
    setCierreEnergiaSeleccion(null);
    setCierreRutaSeleccion(new Set());
    setCierreRutaSinUso(false);
    setCierreRutaPatron(null);
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
        duracionMin: segmentDurationMinutes(seg.horaInicio, seg.horaFin),
      }));
  };

  const handleFlotaSave = async () => {
    if (!user) {
      toast.error("Inicia sesión para lanzar vehículos");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Escribe un título para la misión");
      return;
    }
    if (!tipoFlotaSeleccionado) return;
    setSaving(true);
    resetCentinelaLaunchGate();
    setCierreEnergiaPending(null);
    setCierreEnergiaSeleccion(null);
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
        detalle = terminoDetalle.trim() || "Al cerrar este bloque";
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

      suppressCentinela();
      resetCentinelaTimerState();

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
      const segActualId = segmentoActivo?.id;
      const launchCtx = proyectoLaunchRef.current;
      const resolvedProyectoId = resolverProyectoId(launchCtx);
      const subTareasPrefill =
        tipoFlotaSeleccionado === "situacion" && launchCtx?.plantillaSubTareas?.length
          ? launchCtx.plantillaSubTareas
              .filter(t => t.trim())
              .map((texto, i) => ({
                id: `st_${Date.now()}_${i}`,
                texto: texto.trim(),
                completada: false,
                creadaAt: Date.now(),
              }))
          : undefined;

      console.log(`[handleFlotaSave] Guardando vehículo local primero...`);
      let newVehicleId: string;
      try {
        newVehicleId = await addVehicle(user.uid, {
        titulo: titulo.trim(),
        criterioFin: criterio,
        criterioDetalle: detalle,
        tiempoInicio: new Date(),
        ejes: STUB_EJES,
        tipoTerminoRapido: tipoTermino,
        tipoFlota: tipoFlotaSeleccionado,
        aperturaAt: Date.now(),
        bonoTemple,
        tipoReloj: tipoFlotaSeleccionado === "tiempo" ? relojTiempo : undefined,
        cantidadObjetivo: relojTiempo === "investigador" ? Number(cantidadInvestigador) : (relojTiempo === "produccion" ? Number(cantidadProduccion) : undefined),
        subVehiculos: relojTiempo === "desglosador"
          ? desglosadorSubs.filter(s => s.titulo.trim()).map((s, idx) => buildDesglosadorSubFromForm(s, idx, Date.now()))
          : undefined,
        subTareas: subTareasPrefill,
        ...(launchCtx || resolvedProyectoId
          ? {
              proyectoId: launchCtx?.proyectoId ?? resolvedProyectoId,
              ...(launchCtx?.peldanoId ? { proyectoPeldanoId: launchCtx.peldanoId } : {}),
            }
          : {}),
        estadoEnergia,
        energiaDiffPct,
        segmentoOrigen: segActualNombre,
        segmentoId: segActualId,
        segmentosCruzados: 0,
        rendimientoConsciente,
        recordSugerido,
        tiempoElegido,
        intensidadEnergetica: intensidadEnergetica || undefined,
        tipoDescanso: tipoFlotaSeleccionado === "descanso" ? (tipoDescanso || "microcarga") : undefined,
        microPasos: tipoFlotaSeleccionado === "descanso" && tipoDescanso !== "punto_cero" ? { hidratacion: false, respiracion: false, pantallaZero: false } : undefined,
        etapasPuntoCero: tipoFlotaSeleccionado === "descanso" && tipoDescanso === "punto_cero" ? { etapa1: false, etapa2: false, etapa3: false, etapa4: false } : undefined,
        });
      } catch (addErr) {
        console.error("[handleFlotaSave] addVehicle:", addErr);
        toast.error("Error al guardar vehículo", {
          description: "No se pudo registrar en este dispositivo. Libera espacio del navegador e intenta de nuevo.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
          duration: 5000,
        });
        return;
      }
      console.log(`[handleFlotaSave] addVehicle retornó id: ${newVehicleId}`);

      if (launchCtx) {
        const tipoOrigen = launchCtx.launch === "desglosador_tiempo" ? "tiempo" : "situacion";
        void markPeldanoEnCurso(user.uid, launchCtx.peldanoId, newVehicleId, tipoOrigen);
        proyectoLaunchRef.current = null;
      }

      if (intensidadEnergetica) {
        recordVehiculoInicio(newVehicleId, intensidadEnergetica);
      }

      if (relojTiempo === "desglosador" && user) {
        const filteredSubs = desglosadorSubs.filter(s => s.titulo.trim());
        if (filteredSubs[0]?.titulo.trim()) {
          toast.info("Profundidad de sesión", {
            description: "Cada sub cumplido suma +2 PS (y ruta si aplica) en tu barra. Profundidad: +4, +6, +8… por hora completa de sesión.",
            style: { backgroundColor: PIZARRA, border: `1px solid rgba(212,175,55,0.35)`, color: GOLD },
            duration: 4500,
          });
        }
      }

      if (bonoTemple) {
        void safeAwardPS(10, "VOLUNTAD SOBRE EL HORARIO: " + titulo.trim());
        toast.success("VOLUNTAD SOBRE EL HORARIO +10 PS", {
          description: "Iniciaste en los últimos 15 min antes del descanso",
          style: { backgroundColor: PIZARRA, border: `2px solid ${NARANJA}`, color: NARANJA },
          duration: 4000
        });
      }

      console.log(`[handleFlotaSave] Vehículo creado exitosamente: "${titulo}"`);

      try {
      const optimisticVehicle: Vehicle = {
        id: newVehicleId,
        titulo: titulo.trim(),
        criterioFin: criterio,
        criterioDetalle: detalle,
        tiempoInicio: new Date(),
        createdAt: new Date(),
        userId: user.uid,
        status: "activo" as VehicleStatus,
        ejes: STUB_EJES,
        tipoTerminoRapido: tipoTermino,
        tipoFlota: tipoFlotaSeleccionado,
        aperturaAt: Date.now(),
        bonoTemple,
        tipoReloj: tipoFlotaSeleccionado === "tiempo" ? relojTiempo : undefined,
        cantidadObjetivo: relojTiempo === "investigador" ? Number(cantidadInvestigador) : (relojTiempo === "produccion" ? Number(cantidadProduccion) : undefined),
        subVehiculos: relojTiempo === "desglosador"
          ? desglosadorSubs.filter(s => s.titulo.trim()).map((s, idx) => buildDesglosadorSubFromForm(s, idx, Date.now()))
          : undefined,
        subTareas: subTareasPrefill,
        ...(launchCtx || resolvedProyectoId
          ? {
              proyectoId: launchCtx?.proyectoId ?? resolvedProyectoId,
              ...(launchCtx?.peldanoId ? { proyectoPeldanoId: launchCtx.peldanoId } : {}),
            }
          : {}),
        energiaDiffPct,
        segmentoOrigen: segActualNombre,
        segmentoId: segActualId,
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
      vehiclesRef.current = [optimisticVehicle, ...vehiclesRef.current.filter(v => v.id !== newVehicleId)];
      setVehicles(prev => {
        const withoutDupe = prev.filter(v => v.id !== newVehicleId);
        console.log(`[handleFlotaSave] OPTIMISTIC UPDATE: Agregando "${titulo}" al estado. Antes: ${withoutDupe.length}, Después: ${withoutDupe.length + 1}`);
        return [optimisticVehicle, ...withoutDupe];
      });
      if (!saveLocalVehicles(vehiclesRef.current)) {
        console.warn("[handleFlotaSave] Vehículo en memoria; localStorage lleno o bloqueado");
      }
      if (tipoFlotaSeleccionado === "situacion") {
        setExpandedId(newVehicleId);
      }
      setIsCreating(false);
      scrollFlotaActivosIntoView();

      toast.success(`"${titulo}" lanzado · ${flotaConfig.label}`, {
        description: flotaConfig.psCierre,
        style: { backgroundColor: PIZARRA, border: `1px solid ${flotaConfig.color}`, color: flotaConfig.color }
      });
      registrarEvento(COMPONENTES.PLANIFICACION);
      resetForm();
      } catch (uiErr) {
        console.warn("[handleFlotaSave] UI post-lanzamiento:", uiErr);
        toast.success(`"${titulo}" lanzado en este dispositivo`, {
          description: "Si no lo ves en activos, recarga la pestaña Operar.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
        });
        setIsCreating(false);
      }
    } catch (err) {
      console.error("[handleFlotaSave] Error:", err);
      toast.error("Error al guardar vehículo", {
        description: "Revisa la conexión o libera espacio en el navegador e intenta de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        duration: 5000,
      });
    } finally {
      releaseCentinela();
      setSaving(false);
    }
  };

  const resetNuevoSegmentoForm = () => {
    setNuevoSegCentinelaEnabled(true);
    setNuevoSegNombre("");
    setNuevoSegHoraInicio("");
    setNuevoSegHoraFin("");
    setNuevoSegColor(SEGMENT_COLORS[0]);
    setNuevoSegIcono(SEGMENT_ICONS[0]);
    setNuevoSegProyectoId("");
    setNuevoSegRutas(null);
  };

  useEffect(() => {
    if (!user || !nuevoSegProyectoId) {
      setNuevoSegRutas(null);
      return;
    }
    const proy = proyectosHub.find(p => p.id === nuevoSegProyectoId);
    if (!proy) return;
    void getPeldanosByProyecto(user.uid, nuevoSegProyectoId).then(peldanos => {
      const claridad = resolveClaridadParaProyecto(proy, peldanos, nuevoSegNombre.trim() || undefined);
      if (claridad) setNuevoSegRutas(claridad);
    });
  }, [nuevoSegNombre, nuevoSegProyectoId, user, proyectosHub]);

  const addSegmento = async () => {
    if (!user || !nuevoSegNombre.trim() || !nuevoSegHoraInicio || !nuevoSegHoraFin || segmentoProgramando) return;

    const validation = validateSegmentTimes(nuevoSegHoraInicio, nuevoSegHoraFin);
    if (!validation.ok) {
      toast.error("Horario de segmento inválido", {
        description: validation.error,
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }

    setSegmentoProgramando(true);

    const nombreCapturado = nuevoSegNombre.trim();
    const horaInicioCapturada = nuevoSegHoraInicio;
    const horaFinCapturada = nuevoSegHoraFin;
    const colorCapturado = nuevoSegColor;
    const iconoCapturado = nuevoSegIcono;
    const centinelaCapturado = nuevoSegCentinelaEnabled;
    const proyectoCapturado = nuevoSegProyectoId;
    const rutasCapturadas = proyectoCapturado && nuevoSegRutas ? nuevoSegRutas : undefined;

    let seg: SegmentoV5 = {
      id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nombre: nombreCapturado,
      horaInicio: horaInicioCapturada,
      horaFin: horaFinCapturada,
      color: colorCapturado,
      icono: iconoCapturado,
      estado: "pendiente",
      eventos: [],
      psGanados: 0,
      centinelaEnabled: centinelaCapturado,
      ...(proyectoCapturado ? { proyectoVinculadoId: proyectoCapturado, rutasMentales: rutasCapturadas } : {}),
    };

    const fecha = getLimaDateString();
    const planillaBase: Planilla = planilla ?? {
      id: `planilla_${fecha}_${Date.now()}`,
      fecha,
      segmentos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let planillaOptimista: Planilla = {
      ...planillaBase,
      segmentos: [...planillaBase.segmentos, seg],
      updatedAt: new Date().toISOString(),
    };

    resetNuevoSegmentoForm();
    setShowCrearSegmento(false);
    setPlanilla(planillaOptimista);
    setExpandedSegId("segmentos");
    setSegmentoProgramando(false);
    window.setTimeout(() => {
      segmentosListEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);

    toast.success("Segmento programado", {
      description: `${seg.nombre} · ${seg.horaInicio} – ${seg.horaFin}`,
      style: { backgroundColor: PIZARRA, border: `1px solid ${VIOLET}`, color: VIOLET },
      duration: 3200,
    });

    try {
      if (proyectoCapturado && rutasCapturadas) {
        const { peldanoId } = await ensurePeldanoFromSegmento(user.uid, {
          proyectoId: proyectoCapturado,
          segmento: seg,
          planillaFecha: fecha,
          rutasMentales: rutasCapturadas,
        });
        seg = { ...seg, proyectoPeldanoId: peldanoId };
        planillaOptimista = {
          ...planillaOptimista,
          segmentos: planillaOptimista.segmentos.map(s =>
            s.id === seg.id ? seg : s
          ),
        };
        setPlanilla(planillaOptimista);
      }
      await savePlanilla(user.uid, planillaOptimista);
      registrarEvento(COMPONENTES.PLANIFICACION);
      try {
        const ok = await safeAwardPS(1, "Segmento creado: " + seg.nombre);
        toast.success("+1 PS · segmento", {
          description: seg.nombre,
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          duration: 2400,
        });
        if (ok) toastDailyPSTotal();
      } catch {
        toast.info("Segmento guardado", {
          description: "Los PS se sincronizarán al reconectar.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          duration: 2800,
        });
      }
    } catch {
      setPlanilla(planillaBase);
      savePlanilla(user.uid, planillaBase).catch(() => {});
      setNuevoSegNombre(nombreCapturado);
      setNuevoSegHoraInicio(horaInicioCapturada);
      setNuevoSegHoraFin(horaFinCapturada);
      setNuevoSegColor(colorCapturado);
      setNuevoSegIcono(iconoCapturado);
      setNuevoSegCentinelaEnabled(centinelaCapturado);
      setNuevoSegProyectoId(proyectoCapturado);
      if (rutasCapturadas) setNuevoSegRutas(rutasCapturadas);
      setShowCrearSegmento(true);
      toast.error("No se pudo programar el segmento", {
        description: "Revisa la conexión e intenta de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    }
  };

  const guardarComoRutina = async () => {
    if (!user || !planilla || !nuevaRutinaNombre.trim() || guardandoRutina) return;
    if (nuevaRutinaDias.length === 0) {
      toast.error("Selecciona al menos un día activo", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    setGuardandoRutina(true);
    try {
      const segs: SegmentoTemplate[] = planilla.segmentos.map(s => ({
        nombre: s.nombre,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        color: s.color,
        icono: s.icono,
      }));
      const nombre = nuevaRutinaNombre.trim();
      const nueva = await addPlantillaRutina(user.uid, {
        nombre,
        tipo: nuevaRutinaTipo,
        diasActivos: nuevaRutinaDias,
        segmentos: segs,
      });
      setPlantillasRutina(prev => {
        if (prev.some(p => p.id === nueva.id)) return prev;
        return [nueva, ...prev];
      });
      toast.success("Rutina guardada", {
        description: `${segs.length} segmentos guardados como "${nombre}"`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
      });
      setNuevaRutinaNombre("");
      setShowGuardarRutina(false);
      setShowRutinasPanel(true);
      setRutinaResaltadaId(nueva.id);
    } catch (e) {
      console.error("[guardarComoRutina]", e);
      toast.error("No se pudo guardar la rutina", {
        description: "Revisa la conexión e intenta de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    } finally {
      setGuardandoRutina(false);
    }
  };

  const cargarRutina = async (plantilla: PlantillaRutina) => {
    if (!user || cargandoRutinaId) return;
    setCargandoRutinaId(plantilla.id);
    try {
      const nuevaPlanilla = await applyPlantillaToday(user.uid, plantilla);
      setPlanilla(nuevaPlanilla);
      setRutinaBanner(null);
      toast.success(`Rutina cargada: ${plantilla.nombre}`, {
        description: `${plantilla.segmentos.length} segmentos programados`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
      });
    } catch (e) {
      console.error("[cargarRutina]", e);
      toast.error("No se pudo cargar la rutina", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    } finally {
      setCargandoRutinaId(null);
    }
  };

  const eliminarRutina = async (plantillaId: string) => {
    if (!user) return;
    await deletePlantillaRutina(user.uid, plantillaId);
    toast.success("Rutina eliminada", {
      style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
    });
  };

  const activarSegmento = async (segId: string) => {
    if (!user) {
      toast.error("Inicia sesión para abrir la puerta");
      return;
    }
    if (!planilla) {
      toast.error("No hay planilla del día cargada");
      return;
    }
    if (activandoSegId) return;
    const seg = planilla.segmentos.find(s => s.id === segId);
    if (!seg) {
      toast.error("Segmento no encontrado");
      return;
    }
    if (seg.estado !== "pendiente") {
      toast.info("Este segmento ya no está pendiente", {
        description: seg.estado === "activo" ? "La puerta ya fue abierta." : `Estado: ${seg.estado}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
      });
      return;
    }
    const nowMs = Date.now();
    const dayStart = getLimaDayStartMs(nowMs);
    if (!isWithinPuertaWindow(nowMs, seg.horaInicio, dayStart)) {
      toast.warning("Ventana de puerta cerrada", {
        description: `Abre la puerta de atención solo ±5 min de ${seg.horaInicio}.`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}40`, color: BLOOD },
        duration: 5000,
      });
      return;
    }
    const puertaTiming = classifyPuertaTiming(nowMs, seg.horaInicio, dayStart);
    const patch = {
      estado: "activo" as const,
      activadoAt: nowMs,
      puertaTiming,
      psGanados: (seg.psGanados || 0) + 2,
    };
    const optimisticPlanilla: Planilla = {
      ...planilla,
      segmentos: planilla.segmentos.map(s => (s.id === segId ? { ...s, ...patch } : s)),
    };
    setActivandoSegId(segId);
    setPlanilla(optimisticPlanilla);
    setSegmentTick(t => t + 1);
    const rollbackSegmento = () =>
      setPlanilla(prev =>
        prev
          ? {
              ...prev,
              segmentos: prev.segmentos.map(s =>
                s.id === segId
                  ? {
                      ...s,
                      estado: "pendiente" as const,
                      activadoAt: undefined,
                      puertaTiming: undefined,
                      psGanados: seg.psGanados || 0,
                    }
                  : s
              ),
            }
          : prev
      );
    try {
      const { planilla: saved, localSaved } = await updateSegmentoInPlanilla(
        user.uid,
        segId,
        patch,
        optimisticPlanilla
      );
      if (!localSaved) {
        rollbackSegmento();
        toast.error("No se pudo guardar en el dispositivo", {
          description: "Libera espacio en el navegador o cierra pestañas y vuelve a intentar.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
          duration: 6000,
        });
        return;
      }
      setPlanilla(saved);
      setActiveSegmento(user.uid, segId);
      const ok = await safeAwardPS(2, "Puerta de atención: " + seg.nombre);
      const timingLabel = puertaTiming === "antes_voz" ? "antes de la voz" : "tras la voz";
      toast.success("+2 PS Puerta de atención abierta", {
        description: `${seg.nombre} · ${timingLabel}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
      });
      if (ok) toastDailyPSTotal();
      void registrarEvento(COMPONENTES.PLANIFICACION);
    } catch (err) {
      console.error("[activarSegmento]", err);
      rollbackSegmento();
      toast.error("No se pudo abrir la puerta", {
        description: "Algo falló al procesar la apertura. Cierra la pestaña, vuelve a abrir e intenta otra vez.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        duration: 5000,
      });
    } finally {
      setActivandoSegId(null);
    }
  };

  const cerrarSegmentoManual = async (segId: string) => {
    if (!user || !planilla) return;
    const seg = planilla.segmentos.find(s => s.id === segId);
    if (!seg || seg.estado !== "activo") return;

    if (seg.horaFin) {
      const nowMs = Date.now();
      const dayStart = getLimaDayStartMs(nowMs);
      const dentroVentana = isWithinSegmentTimeMargin(nowMs, seg.horaInicio, seg.horaFin, "fin", 5, dayStart);
      if (!dentroVentana) {
        toast.warning("La puerta está sellada", {
          description: `El cierre con intención (+2 PS) solo está disponible ±5 min de ${seg.horaFin}. Fuera de esa ventana el segmento pasará a entropía automáticamente.`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}40`, color: BLOOD },
          duration: 6000,
        });
        return;
      }
    }

    const duration = seg.activadoAt ? Math.round((Date.now() - seg.activadoAt) / 60000) : 0;
    setClosedSegmentDuration(duration);
    setClosedSegmentName(seg.nombre);

    const { planilla: updated } = await updateSegmentoInPlanilla(user.uid, segId, {
      estado: "cerrado_manual",
      cerradoAt: Date.now(),
      psGanados: (seg.psGanados || 0) + 2
    });
    setPlanilla(updated);
    toast.success("+2 PS Cierre consciente de puerta", {
      description: seg.nombre + " · Puerta cerrada con intención",
      style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD }
    });
    const ok = await safeAwardPS(2, "Cierre consciente: " + seg.nombre);
    if (ok) toastDailyPSTotal();
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

  const TERMINO_OPTIONS: { id: TipoTerminoRapido; label: string; sublabel: string; puntosCumple: number; puntosNoCumple: number; color: string }[] = [
    { id: "hora", label: "Hora de Término", sublabel: "Define cuándo termina", puntosCumple: VEHICLE_CUMPLIDO_BASE_PS, puntosNoCumple: VEHICLE_ARCHIVADO_BASE_PS, color: GOLD },
    { id: "situacion", label: "Situación de Término", sublabel: "Define qué circunstancia termina", puntosCumple: 5, puntosNoCumple: 2, color: AZURE },
    { id: "omitido", label: "Omitir", sublabel: "Sin criterio específico", puntosCumple: 1, puntosNoCumple: 0, color: "#6b7280" }
  ];

  const handleQuickSaveAndNew = async (tipoTermino: TipoTerminoRapido, detalle?: string) => {
    if (!user || !titulo.trim()) return;
    setSaving(true);
    resetCentinelaLaunchGate();
    setCierreEnergiaPending(null);
    setCierreEnergiaSeleccion(null);
    const terminoInfo = TERMINO_OPTIONS.find(t => t.id === tipoTermino);
    const detalleNorm = detalle?.trim() || (tipoTermino === "situacion" ? "Al cerrar este bloque" : "");
    let newVehicleId: string;
    try {
      newVehicleId = await addVehicle(user.uid, {
        titulo: titulo.trim(),
        criterioFin: tipoTermino === "hora" ? "tiempo" : "circunstancia",
        criterioDetalle: detalleNorm,
        tiempoInicio: new Date(),
        ejes: STUB_EJES,
        tipoTerminoRapido: tipoTermino,
        tipoFlota: tipoTermino === "situacion" ? "situacion" : tipoTermino === "hora" ? "tiempo" : undefined,
        aperturaAt: Date.now(),
      });
    } catch (err) {
      console.error("[handleQuickSaveAndNew] addVehicle:", err);
      toast.error("Error al guardar vehículo", {
        description: "No se pudo registrar en este dispositivo. Libera espacio del navegador e intenta de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      setSaving(false);
      return;
    }
    try {
      const optimisticVehicle: Vehicle = {
        id: newVehicleId,
        titulo: titulo.trim(),
        criterioFin: tipoTermino === "hora" ? "tiempo" : "circunstancia",
        criterioDetalle: detalleNorm,
        tiempoInicio: new Date(),
        createdAt: new Date(),
        userId: user.uid,
        status: "activo",
        ejes: STUB_EJES,
        tipoTerminoRapido: tipoTermino,
        tipoFlota: tipoTermino === "situacion" ? "situacion" : tipoTermino === "hora" ? "tiempo" : undefined,
        aperturaAt: Date.now(),
      };
      optimisticVehiclesRef.current = [
        ...optimisticVehiclesRef.current.filter(v => v.id !== newVehicleId),
        optimisticVehicle,
      ];
      vehiclesRef.current = [optimisticVehicle, ...vehiclesRef.current.filter(v => v.id !== newVehicleId)];
      setVehicles(prev => [optimisticVehicle, ...prev.filter(v => v.id !== newVehicleId)]);
      saveLocalVehicles(vehiclesRef.current);
      setIsCreating(false);
      setVehicleMode("selector");
      scrollFlotaActivosIntoView();
      toast.success(`"${titulo}" lanzado (+${terminoInfo?.puntosCumple || 0} PS al completar)`, {
        style: { backgroundColor: PIZARRA, border: `1px solid ${terminoInfo?.color || AZURE}`, color: terminoInfo?.color || AZURE },
      });
      registrarEvento(COMPONENTES.PLANIFICACION);
      setTitulo("");
      setTerminoDetalle("");
      setSelectedTerminoType(null);
    } catch (err) {
      console.warn("[handleQuickSaveAndNew] UI post-lanzamiento:", err);
      toast.success(`"${titulo}" lanzado en este dispositivo`, {
        description: "La lista se actualizará en un momento.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
      });
    }
    setSaving(false);
  };

  const handleStatusChange = async (vehicleId: string, status: "cumplido" | "archivado", intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { console.warn("[handleStatusChange] Vehículo no encontrado:", vehicleId); return; }
    if (vehicle.tipoReloj === "desglosador") {
      console.warn("[handleStatusChange] Desglosador: usa «Cerrar ciclo» para registrar PS por subvehículo.");
      return;
    }

    const safeFb = async (label: string, fn: () => Promise<any>) => {
      try { await fn(); } catch (e) { console.error(`[handleStatusChange] ${label}:`, e); }
    };

    const stubScores: MisionScores = { enfoque: 0, conflicto: 0, pasos: 0, limite: 0 };
    const comentario = vehicle.criterioDetalle?.trim() || null;
    await safeFb("saveMision", () => saveMision(user.uid, { titulo: vehicle.titulo, estado: status, scores: stubScores, soberaniaMomento: status === "cumplido" ? 50 : 25, comentario }));

    let missionCP = vehicleMissionClosePS(status, vehicle.tipoTerminoRapido);
    let cpMessage = "";
    if (vehicle.tipoTerminoRapido) {
      cpMessage = status === "cumplido" ? "Misión express completada" : "Misión express archivada";
    } else {
      cpMessage = status === "cumplido" ? "Objetivo cumplido" : "Archivado";
    }

    const isSuccess = status === "cumplido";
    let missionResult = { challengeCompleted: false, newRank: null as string | null, streak: 0 };
    try { missionResult = await recordMissionResult(user.uid, isSuccess, status === "cumplido", missionCP); } catch (e) { console.error("[handleStatusChange] recordMissionResult:", e); }

    const cierreAt = vehicle.cierreAt ?? Date.now();
    const aperturaAt = vehicle.aperturaAt || vehicle.createdAt?.getTime() || cierreAt;
    const duracionFinal = vehicle.duracionFinal ?? Math.max(1, Math.round((cierreAt - aperturaAt) / 60000));
    await safeFb("closeTimestamps", () =>
      updateVehicle(user.uid, vehicleId, {
        cierreAt,
        duracionFinal,
        cierreManual: status === "cumplido",
      })
    );
    setVehicles(prev => prev.map(v =>
      v.id === vehicleId ? { ...v, status, cierreAt, duracionFinal, cierreManual: status === "cumplido" } : v
    ));
    vehiclesRef.current = vehiclesRef.current.map(v =>
      v.id === vehicleId ? { ...v, status, cierreAt, duracionFinal, cierreManual: status === "cumplido" } : v
    );
    saveLocalVehicles(vehiclesRef.current);

    await safeFb("updateStatus", () => updateVehicleStatus(user.uid, vehicleId, status));
    if (intensidadEnergeticaFin) {
      await safeFb("updateEnergiaFin", () => updateVehicle(user.uid, vehicleId, { intensidadEnergeticaFin }));
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, intensidadEnergeticaFin } : v));
      vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, intensidadEnergeticaFin } : v);
      recordVehiculoCierre(vehicleId, intensidadEnergeticaFin);
    }
    if (status === "cumplido" && !vehicle.autoVerdad && missionCP > 0) {
      await safeAwardPS(missionCP, "Planificación: " + vehicle.titulo);
      incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
    }
    if (vehicle.tipoFlota === "situacion" && status === "cumplido" && !vehicle.autoVerdad) {
      const durationMin = vehicle.aperturaAt ? Math.floor((Date.now() - vehicle.aperturaAt) / 60000) : 0;
      const isMicroSituacion = durationMin < 10;
      const situacionPS = isMicroSituacion ? 1 : 3 + Math.min(Math.floor(durationMin / 5), 4);
      await safeAwardPS(situacionPS, `Situación: ${vehicle.titulo}`);
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
      toast.success(`+${missionCP} PS`, { description: cpMessage + (missionResult.streak > 0 ? ` · Racha: ${missionResult.streak}/3` : ""), style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD } });
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
    void safeAwardPS(1, `Micro-paso (${paso}): ${vehicle.titulo}`);
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
    void safeAwardPS(1, `Etapa Punto Cero (${etapa}): ${vehicle.titulo}`);
    const ETAPA_LABELS: Record<string, string> = { etapa1: "Tensión y quietud", etapa2: "Identificación del Pensamiento", etapa3: "Ritmo y apnea", etapa4: "Alimento de Colores" };
    toast.success(`+1 PS · ${ETAPA_LABELS[etapa]}`, { description: "Etapa Punto Cero completada", style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD_PC}`, color: GOLD_PC }, duration: 2500 });
  };

  const handleDescansoClose = async (vehicleId: string, closingStatus: "cumplido" | "archivado", etiqueta: "recuperado" | "parcial" | "fragmentado", nota: string, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    if (closingInProgressRef.current.has(vehicleId)) return;
    closingInProgressRef.current.add(vehicleId);
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { closingInProgressRef.current.delete(vehicleId); return; }

    const aperturaAt = vehicle.aperturaAt || Date.now();
    const cierreAt = Date.now();
    const duracionMin = Math.round((cierreAt - aperturaAt) / 60000);
    const descansoMatch = vehicle.criterioDetalle?.match(/([\d.]+)\s*min/i);
    const descansoDurMin = descansoMatch ? parseFloat(descansoMatch[1]) : 0;
    const descansoTargetMs = descansoDurMin > 0 ? aperturaAt + (descansoDurMin + 5) * 60000 : 0;
    const dentroVentana = descansoTargetMs === 0 || cierreAt <= descansoTargetMs;

    notifyVehicleClosed(vehicleId);

    const optimisticClose = {
      status: closingStatus,
      cierreAt,
      duracionFinal: duracionMin,
      cierreManual: dentroVentana,
      etiquetaSalida: etiqueta,
      notaSalida: nota,
      ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
    };

    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, ...optimisticClose } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, ...optimisticClose } : v));
    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    saveLocalVehicles(vehiclesRef.current);
    triggerConquistaPulse();

    const TIPO_BASE: Record<string, number> = { intercepcion: 3, microcarga: 5, reset_profundo: 8, punto_cero: 12 };
    const psBase = vehicle.tipoDescanso ? (TIPO_BASE[vehicle.tipoDescanso] || 5) : 5;
    const psEtiqueta = etiqueta === "recuperado" ? 2 : 0;
    const psTotal = psBase + psEtiqueta;
    const ETIQUETA_LABELS: Record<string, string> = { recuperado: "RECUPERADO", parcial: "PARCIAL", fragmentado: "FRAGMENTADO" };
    const ETIQUETA_COLOR: Record<string, string> = { recuperado: "#10b981", parcial: "#f59e0b", fragmentado: "#ef4444" };

    try {
      await updateVehicle(user.uid, vehicleId, optimisticClose);
    } catch {
      /* updateVehicle ya persiste en local si Firebase falla */
    } finally {
      closingInProgressRef.current.delete(vehicleId);
    }
    recordDescansoCuerpo(vehicleId);
    void safeAwardPS(psTotal, `Descanso cerrado (${ETIQUETA_LABELS[etiqueta]}): ${vehicle.titulo}`);
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
    if (!vehicle.autoVerdad) triggerConquistaPulse();
    if (intensidadEnergeticaFin) recordVehiculoCierre(vehicleId, intensidadEnergeticaFin);

    if (vehicle.vehiculoPadreDesglosadorId) {
      try {
        await updateVehicle(user.uid, vehicleId, {
          ...optimisticClose,
          ...situacionCloseExtras,
        });
        await updateVehicleStatus(user.uid, vehicleId, status);
      } catch (e) {
        console.warn("[handleFlotaStatusChange] persist interrupción:", e);
      }
    }

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

        if (isTimerExpired) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, 10, "Tiempo excedido: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+10 PS — Tiempo excedido", { description: "Cierre registrado fuera de ventana.", style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }, duration: 4000 });
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
        } else if (isCierreManual && isDescansoExpired) {
          safeFire(() => Promise.all([
            updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }),
            awardSovereigntyPoints(user.uid, 10, "Recarga extendida: " + vehicle.titulo)
          ]));
          incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
          toast.success("+10 PS — Descanso extendido", { description: `Duración: ${duracionMin} min · Tolerancia superada`, style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD }, duration: 4000 });
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
          const psBase = VEHICLE_CUMPLIDO_BASE_PS;
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
          safeFire(() => updateVehicle(user.uid, vehicleId, { ...baseUpdate, status }));
          toast.info(`Cruce registrado (${vehicle.segmentosCruzados} seg)`, {
            description: "Dato registrado para evaluación.",
            style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA }, duration: 4000
          });
        }
      } else {
        await handleStatusChange(vehicleId, status, intensidadEnergeticaFin);
      }

      const isWithin5Min = segmentoActivo && segmentoActivo.horaFin &&
        isWithinSegmentTimeMargin(Date.now(), segmentoActivo.horaInicio, segmentoActivo.horaFin, "fin", 5);

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
      if (!vehicle.autoVerdad && status === "cumplido") {
        const closedVehicle: Vehicle = { ...vehicle, ...optimisticClose, status };
        safeFire(() => volcarMetricasAlHub(closedVehicle, { minutos: duracionMin }));
      }
      if (vehicle.vehiculoPadreDesglosadorId && (status === "cumplido" || status === "archivado")) {
        await resumeDesglosadorTrasInterrupcion(vehicle.vehiculoPadreDesglosadorId);
      }
    } catch (err: any) {
      console.error("[handleFlotaStatusChange] ERROR:", err);
    } finally {
      closingInProgressRef.current.delete(vehicleId);
    }
  };

  const handleInvestigadorClose = async (vehicleId: string, cumplido: boolean, cantidadRealizada: number, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => {
    if (!user) return;
    if (closingInProgressRef.current.has(vehicleId)) return;
    closingInProgressRef.current.add(vehicleId);
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { closingInProgressRef.current.delete(vehicleId); return; }

    notifyVehicleClosed(vehicleId);
    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    const closePatch = {
      status: "cumplido" as const,
      datoConfiable: cumplido,
      cierreAt: Date.now(),
      cierreManual: true,
      ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
    };
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...closePatch } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, ...closePatch } : v);
    if (!saveLocalVehicles(vehiclesRef.current)) {
      console.warn("[investigadorClose] Cierre en memoria OK; localStorage no disponible");
    }
    triggerConquistaPulse();

    const cierreAt = closePatch.cierreAt;
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
        status: "cumplido",
        datoConfiable: cumplido,
        cierreAt,
        duracionFinal,
        cierreManual: true,
        ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
        ...(extraUpdates as object)
      });

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

      void awardSovereigntyPoints(user.uid, 10,
        (cumplido ? "Medición válida: " : "Medición con inconveniente: ") + vehicle.titulo
      ).catch(e => console.warn("[investigadorClose] PS falló:", e));
      incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
      registrarEvento(COMPONENTES.PLANIFICACION);
      if (intensidadEnergeticaFin) recordVehiculoCierre(vehicleId, intensidadEnergeticaFin);
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
      if (vehicle.vehiculoPadreDesglosadorId) {
        try {
          await resumeDesglosadorTrasInterrupcion(vehicle.vehiculoPadreDesglosadorId);
        } catch (e) {
          console.warn("[investigadorClose] resume desglosador:", e);
        }
      }
    } catch (err) {
      console.error("[investigadorClose] Error detallado:", err);
      toast.error("Error al sincronizar el cierre. El vehículo ya quedó cerrado en este dispositivo.", {
        description: "Si los PS no aparecen, reintenta cuando tengas conexión.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        duration: 5000,
      });
    } finally {
      closingInProgressRef.current.delete(vehicleId);
    }
  };

  const resumeDesglosadorTrasInterrupcion = async (parentId: string) => {
    if (!user) return;
    const openInterrupt = vehiclesRef.current.find(
      v =>
        v.status === "activo" &&
        !v.autoVerdad &&
        v.vehiculoPadreDesglosadorId === parentId &&
        !wasVehicleRecentlyClosed(v.id)
    );
    if (openInterrupt) {
      toast.error("Cierra la interrupción activa arriba", {
        description: "Usa Cumplido o Incumplido en el vehículo de interrupción.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        duration: 4000,
      });
      return;
    }
    const parent = vehiclesRef.current.find(v => v.id === parentId);
    if (!parent?.desglosadorPausa && !parent?.interrupcionActiva) return;

    let patch: Partial<Vehicle>;
    if (parent.desglosadorPausa) {
      const pausa = parent.desglosadorPausa;
      const subs = [...(parent.subVehiculos || [])];
      const idx = subs.findIndex(s => s.id === pausa.subActivoId);
      if (idx === -1) {
        patch = { desglosadorPausa: undefined, interrupcionActiva: false };
      } else {
        const resumedApertura = pausa.elapsedSecSnapshot != null
          ? Date.now() - pausa.elapsedSecSnapshot * 1000
          : Date.now();
        subs[idx] = { ...subs[idx], status: "activo", aperturaAt: resumedApertura };
        patch = {
          subVehiculos: subs,
          desglosadorPausa: undefined,
          interrupcionActiva: false,
        };
      }
    } else {
      patch = { desglosadorPausa: undefined, interrupcionActiva: false };
    }

    setVehicles(prev => prev.map(v => v.id === parentId ? { ...v, ...patch } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === parentId ? { ...v, ...patch } : v);
    if (!saveLocalVehicles(vehiclesRef.current)) {
      console.warn("[desglosador] resume: localStorage no disponible");
    }
    await updateVehicle(user.uid, parentId, patch).catch(e => console.warn("[desglosador] resume:", e));
    releaseCentinela();
    toast.info("Desglosador reanudado", {
      description: "Tiempo restante recuperado tras la interrupción.",
      style: { backgroundColor: PIZARRA, border: `1px solid ${VIOLET}`, color: VIOLET },
      duration: 3500,
    });
  };

  const handleDesglosadorPausaInterrupcion = async (vehicleId: string, tituloInterrupcion: string) => {
    if (!user || !tituloInterrupcion.trim()) return;
    if (pausaInterrupcionLockRef.current === vehicleId) return;

    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.tipoReloj !== "desglosador" || vehicle.interrupcionActiva) return;
    const existingInterrupt = vehiclesRef.current.find(
      v =>
        v.status === "activo" &&
        !v.autoVerdad &&
        v.vehiculoPadreDesglosadorId === vehicleId &&
        !wasVehicleRecentlyClosed(v.id)
    );
    if (existingInterrupt) {
      toast.error("Ya hay una interrupción activa", {
        description: "Ciérrala arriba antes de lanzar otra.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    const activeSub = (vehicle.subVehiculos || []).find(s => s.status === "activo");
    if (!activeSub?.aperturaAt) {
      toast.error("No hay sub activo para pausar");
      return;
    }

    pausaInterrupcionLockRef.current = vehicleId;

    const elapsedSec = Math.floor((Date.now() - activeSub.aperturaAt) / 1000);
    let restanteUnidades: number | undefined;
    if (activeSub.cantidadObjetivo && activeSub.tiempoRecordMinPerUnit) {
      const done = Math.floor((elapsedSec / 60) / activeSub.tiempoRecordMinPerUnit);
      restanteUnidades = Math.max(0, activeSub.cantidadObjetivo - done);
    }

    const pausa = {
      pausadoAt: Date.now(),
      subActivoId: activeSub.id,
      restanteUnidades,
      elapsedSecSnapshot: elapsedSec,
    };
    const pausedPatch = { desglosadorPausa: pausa, interrupcionActiva: true };

    const provisionalInterruptId = `vehicle_${Date.now()}`;
    const clientRequestId = `crq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const interruptVehicle: Vehicle = {
      id: provisionalInterruptId,
      titulo: tituloInterrupcion.trim(),
      criterioFin: "circunstancia",
      criterioDetalle: "Interrupción",
      tiempoInicio: new Date(),
      createdAt: new Date(),
      userId: user.uid,
      status: "activo",
      ejes: STUB_EJES,
      tipoTerminoRapido: "situacion",
      tipoFlota: "situacion",
      aperturaAt: Date.now(),
      excluirDeHistorial: true,
      vehiculoPadreDesglosadorId: vehicleId,
      clientRequestId,
    };

    const pausedList = vehiclesRef.current.map(v =>
      v.id === vehicleId ? { ...v, ...pausedPatch } : v
    );
    const optimisticList = [interruptVehicle, ...pausedList];
    setVehicles(optimisticList);
    vehiclesRef.current = optimisticList;
    saveLocalVehicles(optimisticList);

    setExpandedId(provisionalInterruptId);
    suppressCentinela();
    resetCentinelaTimerState();

    toast.success("Interrupción lanzada", {
      description: "Cierra la situación arriba (Cumplido o Incumplido) para reanudar el desglosador.",
      style: { backgroundColor: PIZARRA, border: `1px solid ${CYAN}`, color: CYAN },
      duration: 4500,
    });

    try {
      void updateVehicle(user.uid, vehicleId, pausedPatch).catch(e =>
        console.warn("[desglosador] pause patch:", e)
      );
      const realId = await addVehicle(user.uid, {
        titulo: tituloInterrupcion.trim(),
        criterioFin: "circunstancia",
        criterioDetalle: "Interrupción",
        tiempoInicio: new Date(),
        ejes: interruptVehicle.ejes,
        tipoTerminoRapido: "situacion",
        tipoFlota: "situacion",
        aperturaAt: Date.now(),
        excluirDeHistorial: true,
        vehiculoPadreDesglosadorId: vehicleId,
      });
      if (realId !== provisionalInterruptId) {
        const synced = vehiclesRef.current.map(v =>
          v.id === provisionalInterruptId ? { ...v, id: realId } : v
        );
        vehiclesRef.current = synced;
        setVehicles(synced);
        setExpandedId(prev => (prev === provisionalInterruptId ? realId : prev));
      }
    } catch {
      const rolledBack = vehiclesRef.current
        .filter(v => v.id !== provisionalInterruptId)
        .map(v => v.id === vehicleId
          ? { ...v, desglosadorPausa: undefined, interrupcionActiva: false }
          : v);
      setVehicles(rolledBack);
      vehiclesRef.current = rolledBack;
      saveLocalVehicles(rolledBack);
      releaseCentinela();
      toast.error("No se pudo lanzar la interrupción", {
        description: "El desglosador se reanudó. Intenta de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    } finally {
      pausaInterrupcionLockRef.current = null;
      releaseCentinela();
    }
  };

  const reconcileDesglosadorDepthPS = useCallback(async (
    vehicleId: string,
    options?: { silent?: boolean; sourceLabel?: string; resetGranted?: number }
  ): Promise<{ grantedTotal: number; awardedNow: number }> => {
    if (!user) return { grantedTotal: 0, awardedNow: 0 };
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo") {
      return {
        grantedTotal: vehicle?.desglosadorBloqueDepthPsGranted ?? 0,
        awardedNow: 0,
      };
    }

    const elapsedSec = getDesglosadorSessionElapsedSec(vehicle);
    const totalDepthPs = computeDesglosadorSessionDepthPS(elapsedSec);
    const depthGranted = options?.resetGranted ?? vehicle.desglosadorBloqueDepthPsGranted ?? 0;
    const delta = totalDepthPs - depthGranted;
    if (delta <= 0) return { grantedTotal: depthGranted, awardedNow: 0 };

    const label = options?.sourceLabel ?? "Profundidad desglosador (sesión)";
    const ok = await safeAwardPS(delta, label);
    if (!ok) return { grantedTotal: depthGranted, awardedNow: 0 };

    const newGranted = totalDepthPs;
    const patchVehicles = (list: Vehicle[]) =>
      list.map(v => v.id === vehicleId ? { ...v, desglosadorBloqueDepthPsGranted: newGranted } : v);
    setVehicles(patchVehicles);
    vehiclesRef.current = patchVehicles(vehiclesRef.current);
    try {
      saveLocalVehicles(vehiclesRef.current);
    } catch (e) {
      console.warn("[reconcileDesglosadorDepthPS] localStorage save failed:", e);
    }

    if (!options?.silent) {
      const hoursDone = Math.floor(elapsedSec / 3600);
      const hourAward = hoursDone > 0 ? depthAwardForHour(hoursDone) : delta;
      toast.success(`+${delta} PS · profundidad de sesión`, {
        description: hoursDone > 0
          ? `Hora ${hoursDone} completada · +${hourAward} PS (progresivo)`
          : `Profundidad progresiva · +${delta} PS`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
        duration: 3200,
      });
    }
    return { grantedTotal: newGranted, awardedNow: delta };
  }, [user, safeAwardPS]);

  const handleDesglosadorDepthTick = useCallback((vehicleId: string) => {
    void reconcileDesglosadorDepthPS(vehicleId, { silent: false });
  }, [reconcileDesglosadorDepthPS]);

  const desglosadorProgressScore = (subs: SubVehiculo[] | undefined): number =>
    (subs ?? []).reduce((acc, s) => {
      if (s.status === "cumplido" || s.status === "fallado") return acc + 100;
      if (s.status === "activo") return acc + 10;
      return acc;
    }, 0);

  const handleDesglosadorUpdate = (vehicleId: string, updatedSubs: SubVehiculo[], opts?: { resetDepth?: boolean; silentDepth?: boolean }) => {
    if (!user) return;
    const prevVehicle = vehiclesRef.current.find(v => v.id === vehicleId);
    if (!prevVehicle) return;
    if (prevVehicle.status !== "activo") {
      console.warn("[Desglosador] Ignorando actualización: vehículo ya cerrado", vehicleId);
      return;
    }

    const prevProgress = desglosadorProgressScore(prevVehicle.subVehiculos);
    const nextProgress = desglosadorProgressScore(updatedSubs);
    if (nextProgress < prevProgress) {
      console.warn("[Desglosador] Ignorando actualización obsoleta de subs", vehicleId);
      return;
    }

    let depthGranted = opts?.resetDepth ? 0 : (prevVehicle.desglosadorBloqueDepthPsGranted ?? 0);

    const newVehicles = vehiclesRef.current.map(v => {
      if (v.id !== vehicleId) return v;
      const patch: Partial<Vehicle> = { subVehiculos: updatedSubs, desglosadorBloqueDepthPsGranted: depthGranted };
      if (opts?.resetDepth) patch.aperturaAt = Date.now();
      return { ...v, ...patch };
    });
    setVehicles(newVehicles);
    vehiclesRef.current = newVehicles;
    try {
      saveLocalVehicles(newVehicles);
    } catch (e) {
      console.warn("[Desglosador] localStorage save failed (quota?), UI still updated:", e);
    }

    const prevTimer = desglosadorSyncTimersRef.current.get(vehicleId);
    if (prevTimer) clearTimeout(prevTimer);
    desglosadorSyncTimersRef.current.set(
      vehicleId,
      setTimeout(() => {
        desglosadorSyncTimersRef.current.delete(vehicleId);
        const latest = vehiclesRef.current.find(v => v.id === vehicleId);
        if (!latest?.subVehiculos?.length || latest.status !== "activo") return;
        void updateVehicle(user.uid, vehicleId, {
          subVehiculos: latest.subVehiculos,
          desglosadorBloqueDepthPsGranted: latest.desglosadorBloqueDepthPsGranted,
        }).catch(e => console.warn("[Desglosador] sync Firebase subs:", e));
      }, 450)
    );

    if (opts?.resetDepth) {
      void reconcileDesglosadorDepthPS(vehicleId, { silent: true, resetGranted: 0 });
    } else if (opts?.silentDepth) {
      void reconcileDesglosadorDepthPS(vehicleId, { silent: true });
    } else {
      void reconcileDesglosadorDepthPS(vehicleId, { silent: false });
    }
  };

  const handleDesglosadorReorderSubs = (vehicleId: string, movedId: string, direction: ReorderDirection) => {
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId);
    if (!vehicle?.subVehiculos || vehicle.interrupcionActiva) return;
    const next = reorderSubVehiculos(vehicle.subVehiculos, movedId, direction);
    if (!next) return;
    handleDesglosadorUpdate(vehicleId, next, { silentDepth: true });
    const nextTitulo = firstPendingSubVehiculoTitulo(next);
    toast.info("Orden actualizado", {
      description: nextTitulo ? `Próximo tras el activo: ${nextTitulo}` : "Cola de subs reordenada",
      style: { backgroundColor: PIZARRA, border: `1px solid ${VIOLET}`, color: VIOLET },
      duration: 2400,
    });
  };

  const handleDesglosadorGlobalClose = async (
    vehicleId: string,
    subs: SubVehiculo[],
    intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite",
    rutaDeclaradaGlobal?: RutaBandaId[]
  ) => {
    if (!user) return;
    if (closingInProgressRef.current.has(vehicleId)) return;
    closingInProgressRef.current.add(vehicleId);
    const pendingSubSync = desglosadorSyncTimersRef.current.get(vehicleId);
    if (pendingSubSync) {
      clearTimeout(pendingSubSync);
      desglosadorSyncTimersRef.current.delete(vehicleId);
    }
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { closingInProgressRef.current.delete(vehicleId); return; }
    const cierreAt = Date.now();
    const aperturaAt = vehicle.aperturaAt || vehicle.createdAt?.getTime() || 0;
    const duracionFinal = aperturaAt > 0 ? Math.round((cierreAt - aperturaAt) / 60000) : 0;
    const cumplidos = subs.filter(s => s.status === "cumplido").length;
    const fallados = subs.filter(s => s.status === "fallado").length;
    const closedSubs = subs.filter(s => s.status === "cumplido" || s.status === "fallado");
    const rutaCruzada = mergeRutaCruzadaFromSubs(subs);
    const subsConRuta = subs.map(sv => {
      if (!sv.rutaEnfoque?.activa || (sv.rutaDeclarada && sv.rutaDeclarada.length > 0)) return sv;
      if (!rutaDeclaradaGlobal?.length) return sv;
      return enrichSubRutaCierre(sv, rutaDeclaradaGlobal);
    });
    const psRuta = subsConRuta.reduce((sum, s) => sum + computeRutaPrivilegioPS(s), 0);

    notifyVehicleClosed(vehicleId);

    // Si quedó una interrupción situacional abierta, archivarla al cerrar el ciclo del padre.
    const childInterrupts = vehiclesRef.current.filter(
      v =>
        v.status === "activo" &&
        !v.autoVerdad &&
        v.vehiculoPadreDesglosadorId === vehicleId &&
        !wasVehicleRecentlyClosed(v.id)
    );
    if (childInterrupts.length > 0) {
      const nowChild = Date.now();
      for (const child of childInterrupts) {
        notifyVehicleClosed(child.id);
        orphanInterruptSweepRef.current.add(child.id);
      }
      const archiveChild = (v: Vehicle): Vehicle =>
        childInterrupts.some(c => c.id === v.id)
          ? {
              ...v,
              status: "archivado",
              cierreAt: nowChild,
              duracionFinal: Math.max(1, Math.round((nowChild - (v.aperturaAt || nowChild)) / 60000)),
              cierreManual: false,
            }
          : v;
      setVehicles(prev => prev.map(archiveChild));
      vehiclesRef.current = vehiclesRef.current.map(archiveChild);
      for (const child of childInterrupts) {
        void updateVehicle(user.uid, child.id, {
          status: "archivado",
          cierreAt: nowChild,
          duracionFinal: Math.max(1, Math.round((nowChild - (child.aperturaAt || nowChild)) / 60000)),
          cierreManual: false,
        }).catch(e => console.warn("[desglosadorClose] interrupción:", child.id, e));
        void updateVehicleStatus(user.uid, child.id, "archivado").catch(e =>
          console.warn("[desglosadorClose] interrupción status:", child.id, e)
        );
      }
    }

    for (const sv of subs) {
      if (sv.excluirDeHistorial) continue;
      if (sv.status === "cumplido" && sv.cantidadLograda && sv.cantidadLograda > 0 && sv.duracionFinal && sv.duracionFinal > 0) {
        const minPerUnit = (sv.duracionFinal / 60) / sv.cantidadLograda;
        const tituloCompleto = `${vehicle.titulo} → ${sv.titulo}`;
        saveVehicleHistory(tituloCompleto, minPerUnit, sv.duracionFinal / 60, "desglosador", user.uid, { status: "cumplido" });
      }
    }

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
            rutaDeclarada: sv.rutaDeclarada,
          })),
        }
      );
    }

    optimisticVehiclesRef.current = optimisticVehiclesRef.current.filter(v => v.id !== vehicleId);
    const closePatch = {
      status: "cumplido" as const,
      cierreAt,
      duracionFinal,
      cierreManual: true,
      subVehiculos: subsConRuta,
      desglosadorBloqueDepthPsGranted: vehicle.desglosadorBloqueDepthPsGranted ?? 0,
      interrupcionActiva: false,
      desglosadorPausa: undefined,
      ...(intensidadEnergeticaFin ? { intensidadEnergeticaFin } : {}),
      ...(rutaCruzada ? { rutaCruzada } : {}),
    };
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...closePatch } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, ...closePatch } : v);
    saveLocalVehicles(vehiclesRef.current);
    triggerConquistaPulse();
    try {
      await updateVehicle(user.uid, vehicleId, closePatch);
      await updateVehicleStatus(user.uid, vehicleId, "cumplido");
    } catch (persistErr) {
      console.warn("[desglosadorGlobalClose] Persistencia anticipada:", persistErr);
    }

    const { grantedTotal: depthPsGranted, awardedNow: depthPsAwardedNow } =
      await reconcileDesglosadorDepthPS(vehicleId, { silent: true });
    if (depthPsGranted !== closePatch.desglosadorBloqueDepthPsGranted) {
      const depthOnly = { desglosadorBloqueDepthPsGranted: depthPsGranted };
      setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, ...depthOnly } : v)));
      vehiclesRef.current = vehiclesRef.current.map(v =>
        v.id === vehicleId ? { ...v, ...depthOnly } : v
      );
      saveLocalVehicles(vehiclesRef.current);
    }
    const closePatchFinal = { ...closePatch, desglosadorBloqueDepthPsGranted: depthPsGranted };

    try {
      const latestSubs = vehiclesRef.current.find(v => v.id === vehicleId)?.subVehiculos ?? subsConRuta;
      const subsPsBefore = sumDesglosadorSubsPsAlreadyGranted(latestSubs);
      const { subs: subsSettled, subsPsAwarded, cycleClosePs } = await settleDesglosadorCyclePoints(
        vehicle.titulo,
        latestSubs,
        safeAwardPS
      );
      const subsPsTotal = subsPsBefore + subsPsAwarded;
      const sessionTotalPs = subsPsTotal + cycleClosePs + depthPsGranted;
      const closeDeltaPs = subsPsAwarded + cycleClosePs + depthPsAwardedNow;
      const psRutaInSubs = psRuta;

      setDailyPS(getDailyPointsLocalSync(user.uid).total);

      await updateVehicle(user.uid, vehicleId, {
        ...closePatchFinal,
        subVehiculos: subsSettled,
      });
      await updateVehicleStatus(user.uid, vehicleId, "cumplido");
      setVehicles(prev =>
        prev.map(v => (v.id === vehicleId ? { ...v, ...closePatchFinal, subVehiculos: subsSettled } : v))
      );
      vehiclesRef.current = vehiclesRef.current.map(v =>
        v.id === vehicleId ? { ...v, ...closePatchFinal, subVehiculos: subsSettled } : v
      );
      saveLocalVehicles(vehiclesRef.current);

      if (vehicle.proyectoId && vehicle.proyectoPeldanoId) {
        void markPeldanoConquistadoTiempo(
          user.uid,
          { ...vehicle, ...closePatchFinal, duracionFinal, subVehiculos: subsSettled, ...(rutaCruzada ? { rutaCruzada } : {}) },
          subsSettled,
          sessionTotalPs
        );
      }
      if (intensidadEnergeticaFin) recordVehiculoCierre(vehicleId, intensidadEnergeticaFin);
      incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
      registrarEvento(COMPONENTES.PLANIFICACION);
      setCierreEnergiaPending(null);
      setCierreEnergiaSeleccion(null);
      releaseCentinela();
      toast.success(
        closeDeltaPs > 0
          ? `+${closeDeltaPs} PS — Ciclo cerrado`
          : "Ciclo cerrado",
        {
          description: [
            childInterrupts.length > 0
              ? "Interrupción situacional cerrada automáticamente con el desglosador."
              : "",
            closeDeltaPs > 0 ? "Sumados ahora a tu barra del día." : "",
            subsPsBefore > 0 && subsPsAwarded === 0
              ? `${subsPsBefore} PS de subs ya estaban en la barra (${cumplidos} cumplido${cumplidos !== 1 ? "s" : ""}).`
              : subsPsAwarded > 0
                ? `+${subsPsAwarded} PS por ${cumplidos} sub${cumplidos !== 1 ? "s" : ""} cumplido${cumplidos !== 1 ? "s" : ""}.`
                : "",
            cycleClosePs > 0 ? `+${cycleClosePs} PS cierre de ciclo.` : "",
            depthPsAwardedNow > 0 ? `+${depthPsAwardedNow} PS profundidad de sesión.` : "",
            psRutaInSubs > 0 ? `Ruta de enfoque incluida (+${psRutaInSubs} PS en subs).` : "",
            fallados > 0 ? `${fallados} fallado${fallados !== 1 ? "s" : ""} sin PS.` : "",
            `Total sesión: ${sessionTotalPs} PS.`,
            duracionFinal > 0 ? `${duracionFinal} min total.` : "",
          ].filter(Boolean).join(" "),
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          duration: 5000,
        }
      );
    } catch (err) {
      console.error("[desglosadorGlobalClose] Error:", err);
      toast.error("Error al cerrar ciclo. El cierre local se conservó; reintenta si hace falta.");
    } finally {
      closingInProgressRef.current.delete(vehicleId);
    }
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
        persistVehiclesRef();
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
    persistVehiclesRef();
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
    persistVehiclesRef();
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
    const nowMs = Date.now();
    const subTareas = list.map(st =>
      st.id === subTareaId
        ? {
            ...st,
            completada: !st.completada,
            cerradaAt: isChecking ? nowMs : undefined,
          }
        : st
    );
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    persistVehiclesRef();
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
    const sc = vehicle.situacionCronometro;
    const cronActivo = sc?.activo === true;
    const base = sc?.bloqueInicioAt ?? Date.now();
    let subTareas: SubTarea[];

    if (cronActivo) {
      const budget = totalBudgetMinFromCronometro(vehicle.subTareas, base, sc?.horaFinMs);
      subTareas = applyCupoManualYRedistribuir(vehicle.subTareas, subTareaId, minutos, budget);
    } else {
      subTareas = vehicle.subTareas.map(st => {
        if (st.id !== subTareaId) return st;
        if (minutos === undefined || minutos <= 0 || !Number.isFinite(minutos)) {
          const next = { ...st };
          delete (next as { minutosCupo?: number; cupoFijo?: boolean }).minutosCupo;
          delete (next as { cupoFijo?: boolean }).cupoFijo;
          return next;
        }
        return { ...st, minutosCupo: Math.round(Math.min(999, Math.max(0, minutos))), cupoFijo: true };
      });
    }

    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    persistVehiclesRef();
    try {
      let situacionCronometroPatch: Vehicle["situacionCronometro"] | undefined;
      if (cronActivo && sc) {
        const sum = sumMinutosCronometroPendientes(subTareas);
        situacionCronometroPatch = { ...sc, horaFinMs: base + sum * 60000 };
      }
      await updateVehicle(user.uid, vehicleId, { subTareas, ...(situacionCronometroPatch ? { situacionCronometro: situacionCronometroPatch } : {}) });
      if (situacionCronometroPatch) {
        setVehicles(prev => prev.map(x => (x.id === vehicleId ? { ...x, situacionCronometro: situacionCronometroPatch! } : x)));
        vehiclesRef.current = vehiclesRef.current.map(x => (x.id === vehicleId ? { ...x, situacionCronometro: situacionCronometroPatch! } : x));
        persistVehiclesRef();
      }
      const vAfter = vehiclesRef.current.find(x => x.id === vehicleId);
      const first = (vAfter?.subTareas || []).find(st => {
        if (!((st.minutosCupo ?? 0) > 0)) return false;
        if (cronActivo) return situacionFilaCronometroPendiente(st);
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
      if (i === idx) return { ...st, minutosCupo: (cur.minutosCupo ?? 0) + delta, cupoFijo: true };
      if (i === donorIdx) return { ...st, minutosCupo: Math.max(0, (donor.minutosCupo ?? 0) - delta) };
      return st;
    });
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    persistVehiclesRef();
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

  const tryFinalizeSituacionDesgloseBloque = useCallback(async (
    vehicleId: string,
    subTareas: SubTarea[],
    vehicleSnapshot: Vehicle
  ): Promise<boolean> => {
    if (!user) return false;
    const sc = vehicleSnapshot.situacionCronometro;
    if (!situacionDesgloseBloqueListo(subTareas, sc)) return false;

    const bloqueKey = `${vehicleId}_${sc!.bloqueInicioAt ?? 0}`;
    if (situacionBloqueCelebratedRef.current.has(bloqueKey)) return false;

    const bloqueInicio = sc!.bloqueInicioAt ?? vehicleSnapshot.aperturaAt ?? Date.now();
    const elapsedSec = Math.floor((Date.now() - bloqueInicio) / 1000);
    const totalDepthPs = computeDesglosadorSessionDepthPS(elapsedSec);
    const prevGranted = sc!.depthBlockPsGranted ?? 0;
    const deltaDepth = totalDepthPs - prevGranted;
    const situacionCronometro: NonNullable<Vehicle["situacionCronometro"]> = {
      activo: false,
      bloqueInicioAt: sc!.bloqueInicioAt,
      depthBlockPsGranted: totalDepthPs,
      retosCompletados: (sc!.retosCompletados ?? 0) + 1,
      retoNumero: sc!.retoNumero ?? 1,
      minutosGanadosReto: sc!.minutosGanadosReto ?? 0,
      minutosGanadosSesion: sc!.minutosGanadosSesion ?? 0,
      saldoAdelantoMin: sc!.saldoAdelantoMin ?? 0,
      ...(sc!.horaFinMs != null ? { horaFinMs: sc!.horaFinMs } : {}),
    };

    situacionBloqueCelebratedRef.current.add(bloqueKey);
    const updatedVehicle: Vehicle = { ...vehicleSnapshot, subTareas, situacionCronometro };
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? updatedVehicle : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? updatedVehicle : v));
    persistVehiclesRef();

    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      if (deltaDepth > 0) {
        await awardSovereigntyPoints(user.uid, deltaDepth, `Profundidad bloque situación: ${vehicleSnapshot.titulo}`);
      }
      void handleSyncSituacionCupoAnchor(vehicleId);
      incrementModulePoints(user.uid, "planificacion", 1).catch(() => {});
      registrarEvento(COMPONENTES.PLANIFICACION);
      const summary = computeSituacionDesgloseSummary(updatedVehicle);
      openSituacionDesgloseCelebration(vehicleId, vehicleSnapshot.titulo, summary);
      if (vehicleSnapshot.proyectoId && vehicleSnapshot.proyectoPeldanoId) {
        void markPeldanoConquistadoSituacion(user.uid, updatedVehicle, {
          duracionMin: summary.minutosBloque,
          psGanados: summary.psTotal,
          subTareas,
          minutosGanados: summary.minutosGanados,
          minutosGanadosSesion: summary.minutosGanadosSesion,
          retoNumero: summary.retoNumero,
        }).then(({ ideasCreadas }) => {
          if (ideasCreadas > 0) {
            toast.info(
              `${ideasCreadas} rama${ideasCreadas !== 1 ? "s" : ""} guardada${ideasCreadas !== 1 ? "s" : ""} en Proyectos`,
              {
                description: "Ideas de profundidad pendiente — retómalas desde el Hub.",
                style: { backgroundColor: PIZARRA, border: `1px solid ${CYAN}40`, color: CYAN },
                duration: 5000,
              }
            );
          }
        });
      }
      void playSituacionChimes(3);
      setGoldenFlash(true);
      setTimeout(() => setGoldenFlash(false), 3000);
      return true;
    } catch (e) {
      console.error("[tryFinalizeSituacionDesgloseBloque]", e);
      situacionBloqueCelebratedRef.current.delete(bloqueKey);
      return false;
    }
  }, [user, openSituacionDesgloseCelebration]);

  const handleCerrarSituacionDesgloseBloque = useCallback(async (vehicleId: string) => {
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas) return;
    const finalized = await tryFinalizeSituacionDesgloseBloque(vehicleId, vehicle.subTareas, vehicle);
    if (!finalized) {
      const cached = situacionBloqueSummaries[vehicleId];
      if (cached) {
        openSituacionDesgloseCelebration(vehicleId, vehicle.titulo, cached);
      }
    }
  }, [vehicles, tryFinalizeSituacionDesgloseBloque, situacionBloqueSummaries, openSituacionDesgloseCelebration]);

  const handleMoveSubTareasToCronometro = async (vehicleId: string, ids: string[]) => {
    if (!user || ids.length === 0) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
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
    const retoNumero = firstActivation ? nextRetoNumero(prevSc) : (prevSc?.retoNumero ?? 1);
    const situacionCronometro = {
      activo: true,
      bloqueInicioAt,
      horaFinMs: bloqueInicioAt + sum * 60000,
      depthBlockPsGranted: firstActivation ? 0 : (prevSc?.depthBlockPsGranted ?? 0),
      retoNumero,
      retosCompletados: prevSc?.retosCompletados ?? 0,
      minutosGanadosReto: firstActivation ? 0 : (prevSc?.minutosGanadosReto ?? 0),
      minutosGanadosSesion: prevSc?.minutosGanadosSesion ?? 0,
      saldoAdelantoMin: firstActivation ? 0 : (prevSc?.saldoAdelantoMin ?? 0),
    };
    const firstCron = subTareas.find(st => situacionFilaCronometroPendiente(st) && (st.minutosCupo ?? 0) > 0);
    let situacionCupoAnchor = vehicle.situacionCupoAnchor ?? undefined;
    if (firstCron) {
      const curAnchor = vehicle.situacionCupoAnchor;
      const curSub = curAnchor ? subTareas.find(s => s.id === curAnchor.subTareaId) : undefined;
      const anchorStillValid =
        !!curSub &&
        situacionFilaCronometroPendiente(curSub) &&
        (curSub.minutosCupo ?? 0) > 0;
      if (firstActivation || !anchorStillValid) {
        situacionCupoAnchor = {
          subTareaId: firstCron.id,
          startedAt: firstActivation ? bloqueInicioAt : Date.now(),
        };
      }
    }
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId ? { ...v, subTareas, situacionCronometro, situacionCupoAnchor } : v
      )
    );
    vehiclesRef.current = vehiclesRef.current.map(v =>
      v.id === vehicleId ? { ...v, subTareas, situacionCronometro, situacionCupoAnchor } : v
    );
    persistVehiclesRef();
    setExpandedId(vehicleId);
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro, situacionCupoAnchor: situacionCupoAnchor ?? null });
      if (firstActivation) void requestNotificationPermission();
      void handleSyncSituacionCupoAnchor(vehicleId);
      const retoLabel = retoSituacionLabel(retoNumero);
      toast.success(firstActivation && (prevSc?.retosCompletados ?? 0) > 0 ? retoLabel : "Desglose con tiempo", {
        description:
          firstActivation && (prevSc?.retosCompletados ?? 0) > 0
            ? `${lifted.length} subtarea(s) · Σ ${sum} min · nuevo bloque`
            : `${lifted.length} subtarea(s) · Σ ${sum} min`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 3200,
      });
    } catch (e) {
      console.error("[handleMoveSubTareasToCronometro]", e);
    }
  };

  const handleReorderSubTareasCronometro = async (
    vehicleId: string,
    movedId: string,
    direction: ReorderDirection
  ) => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.situacionCronometro?.activo !== true) return;
    const next = reorderSubTareasCronometro(vehicle.subTareas, movedId, direction);
    if (!next) return;
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas: next } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas: next } : v));
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas: next });
      const nextTexto = firstPendingCronometroTexto(next);
      toast.info("Orden actualizado", {
        description: nextTexto ? `Siguiente en cronómetro: ${nextTexto}` : "Cola del desglose reordenada",
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 2400,
      });
    } catch (e) {
      console.error("[handleReorderSubTareasCronometro]", e);
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
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void handleSyncSituacionCupoAnchor(vehicleId);
      toast.success("Hora fin ajustada · cupos flexibles redistribuidos", {
        description: "Las filas con minutos fijados manualmente se conservan.",
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
    const now = Date.now();
    const sc = vehicle.situacionCronometro!;
    const bloqueInicio = sc.bloqueInicioAt ?? vehicle.aperturaAt ?? now;
    const { subTareas, minutosGanados, saldoAdelantoMin } = aplicarTiempoGanadoAlCumplir(
      list,
      subTareaId,
      vehicle.situacionCupoAnchor,
      now,
      bloqueInicio
    );
    const elapsedSec = Math.floor((now - bloqueInicio) / 1000);
    const totalDepthPs = computeDesglosadorSessionDepthPS(elapsedSec);
    const prevGranted = sc.depthBlockPsGranted ?? 0;
    const deltaDepth = totalDepthPs - prevGranted;
    const bloqueListo = !subTareas.some(situacionFilaCronometroPendiente);
    const pendingSum = sumMinutosCronometroPendientes(subTareas);
    const situacionCronometro = {
      ...sc,
      depthBlockPsGranted: totalDepthPs,
      saldoAdelantoMin: (sc.saldoAdelantoMin ?? 0) + saldoAdelantoMin,
      minutosGanadosReto: (sc.minutosGanadosReto ?? 0) + minutosGanados,
      minutosGanadosSesion: (sc.minutosGanadosSesion ?? 0) + minutosGanados,
      retoNumero: sc.retoNumero ?? 1,
      retosCompletados: sc.retosCompletados ?? 0,
      horaFinMs: pendingSum > 0 ? now + pendingSum * 60000 : now,
    };
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void playSituacionChimes(chimesOnComplete);
      void handleSyncSituacionCupoAnchor(vehicleId, { forceResetSameRow: true });
      await safeAwardPS(4, `Sub-tarea (cronómetro): ${targetSub.texto}`);
      if (deltaDepth > 0) await safeAwardPS(deltaDepth, `Profundidad bloque situación: ${vehicle.titulo}`);
      if (bloqueListo) {
        toast.info("Bloque listo — toca «Recibir cierre del bloque» para ver el desglose de PS", {
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          duration: 5500,
        });
      } else if (deltaDepth > 0) {
        toast.success(`+4 PS · +${deltaDepth} PS profundidad (bloque)`, {
          style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
          duration: 2800,
        });
      } else if (minutosGanados > 0) {
        const destinos = subTareas
          .filter(st => (st.minutosGanadosAcum ?? 0) > 0 && st.id !== subTareaId)
          .map(st => `${st.texto} +${st.minutosGanadosAcum}`)
          .slice(0, 2);
        const desc =
          destinos.length > 0
            ? `${minutosGanados} min en cola · ${destinos.join(" · ")}`
            : saldoAdelantoMin > 0
              ? `${saldoAdelantoMin} min adelantados vs hora fin`
              : `${minutosGanados} min ganados`;
        toast.success(`+4 PS · ${desc}`, {
          style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
          duration: 2600,
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
    const now = Date.now();
    const sc = vehicle.situacionCronometro!;
    const bloqueInicio = sc.bloqueInicioAt ?? vehicle.aperturaAt ?? now;
    const subTareas = registrarCierreFalladoCronometro(
      vehicle.subTareas,
      subTareaId,
      vehicle.situacionCupoAnchor,
      now,
      bloqueInicio
    );
    const pendingSum = sumMinutosCronometroPendientes(subTareas);
    const situacionCronometro =
      pendingSum > 0
        ? { ...sc, horaFinMs: now + pendingSum * 60000 }
        : sc;
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void handleSyncSituacionCupoAnchor(vehicleId, { forceResetSameRow: true });
      toast.info("Fallado (sin PS de fila)", { description: targetSub.texto, duration: 2200 });
      const bloqueListo = !subTareas.some(situacionFilaCronometroPendiente);
      if (bloqueListo) {
        toast.info("Bloque listo — toca «Recibir cierre del bloque» para ver el desglose de PS", {
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          duration: 5500,
        });
      }
    } catch (e) {
      console.error("[handleSituacionCronometroFallado]", e);
    }
  };

  const handleSituacionCronometroReservar = async (vehicleId: string, subTareaId: string) => {
    if (!user) return;
    const vehicle = vehiclesRef.current.find(v => v.id === vehicleId) || vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.tipoFlota !== "situacion" || vehicle.situacionCronometro?.activo !== true) return;
    const { subTareas, extraido } = extraerSubTareaAReserva(vehicle.subTareas, subTareaId);
    if (!extraido) return;
    const now = Date.now();
    const sc = vehicle.situacionCronometro!;
    const pendingSum = sumMinutosCronometroPendientes(subTareas);
    const situacionCronometro =
      pendingSum > 0 ? { ...sc, horaFinMs: now + pendingSum * 60000 } : sc;
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas, situacionCronometro } : v));
    persistVehiclesRef();
    try {
      const { localSaved } = await addSituacionReserva(user.uid, {
        texto: extraido.texto,
        ruta: "situacion_desglosador",
        origenVehiculoTitulo: vehicle.titulo,
        origenVehiculoId: vehicle.id,
        minutosCupo: extraido.minutosCupo,
        detalles: extraido.detalles,
      });
      if (!localSaved) {
        toast.error("No se pudo guardar la reserva en el dispositivo", {
          description: "Libera espacio en el navegador o cierra pestañas y vuelve a intentar.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
          duration: 5000,
        });
        return;
      }
      void updateVehicle(user.uid, vehicleId, { subTareas, situacionCronometro });
      void handleSyncSituacionCupoAnchor(vehicleId, { forceResetSameRow: true });
      toast.info("En reservas tácticas", {
        description: `"${extraido.texto}" — ruta S · retómala cuando tengas tiempo`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 3200,
      });
      const bloqueListo = !subTareas.some(situacionFilaCronometroPendiente);
      if (bloqueListo) {
        toast.info("Bloque listo — toca «Recibir cierre del bloque» para ver el desglose de PS", {
          style: { backgroundColor: PIZARRA, border: `1px solid ${GOLD}`, color: GOLD },
          duration: 5500,
        });
      }
    } catch (e) {
      console.error("[handleSituacionCronometroReservar]", e);
      toast.error("No se pudo reservar la tarea", {
        description: "Cierra la pestaña, vuelve a abrir e inténtalo otra vez.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        duration: 5000,
      });
    }
  };

  const pickSituacionVehicleTarget = useCallback((): Vehicle | undefined => {
    const activos = vehicles.filter(v => v.status === "activo" && v.tipoFlota === "situacion");
    if (activos.length === 0) return undefined;
    if (expandedId) {
      const ex = activos.find(v => v.id === expandedId);
      if (ex) return ex;
    }
    if (activos.length === 1) return activos[0];
    return undefined;
  }, [vehicles, expandedId]);

  const handleReservaTacticaQuickAdd = async (texto: string, ruta: ReservaTacticaRuta) => {
    if (!user) {
      toast.error("Inicia sesión para guardar reservas");
      throw new Error("no-user");
    }
    const trimmed = texto.trim();
    if (!trimmed) return;
    try {
      const { localSaved } = await addSituacionReserva(user.uid, { texto: trimmed, ruta });
      if (!localSaved) {
        toast.error("No se pudo guardar en el dispositivo", {
          description: "Libera espacio en el navegador o cierra pestañas y vuelve a intentar.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
          duration: 5000,
        });
        throw new Error("local-save-failed");
      }
      toast.success("Reserva táctica guardada", {
        description: `[${RUTA_TACTICA_META[ruta].short}] ${trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed}`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 2800,
      });
    } catch (e) {
      if ((e as Error)?.message === "local-save-failed") throw e;
      console.error("[handleReservaTacticaQuickAdd]", e);
      toast.error("No se pudo guardar la reserva", {
        description: "Algo falló al procesar la captura. Cierra la pestaña, vuelve a abrir e inténtalo otra vez.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      throw e;
    }
  };

  const handleReservaRutaChange = async (reservaId: string, ruta: ReservaTacticaRuta) => {
    if (!user) return;
    const prevRuta = situacionReserva.find(i => i.id === reservaId)?.ruta;
    setSituacionReserva(prev =>
      prev.map(i => (i.id === reservaId ? { ...i, ruta } : i))
    );
    const localSaved = await updateSituacionReservaRuta(user.uid, reservaId, ruta);
    if (!localSaved) {
      setSituacionReserva(prev =>
        prev.map(i =>
          i.id === reservaId && prevRuta ? { ...i, ruta: prevRuta } : i
        )
      );
      toast.error("No se pudo cambiar la ruta", {
        description: "Libera espacio en el navegador e inténtalo de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    }
  };

  const handleReservaEliminar = async (reservaId: string) => {
    if (!user) return;
    const backup = situacionReserva.find(i => i.id === reservaId);
    setSituacionReserva(prev => prev.filter(i => i.id !== reservaId));
    const localSaved = await deleteSituacionReserva(user.uid, reservaId);
    if (!localSaved && backup) {
      setSituacionReserva(prev => sortReservasTacticas([backup, ...prev]));
      toast.error("No se pudo eliminar la reserva", {
        description: "Libera espacio en el navegador e inténtalo de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    toast.info("Eliminada de la reserva", { duration: 1800 });
  };

  const handleReservaAListaLibre = async (reservaId: string) => {
    if (!user) return;
    const item = reservaActivas.find(r => r.id === reservaId);
    if (!item) return;
    const activos = vehicles.filter(v => v.status === "activo" && v.tipoFlota === "situacion");
    const vehicle = pickSituacionVehicleTarget();
    if (!vehicle) {
      toast.error(activos.length > 1 ? "Expande el vehículo situacional destino" : "Abre un vehículo situacional activo", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    const newSub: SubTarea = {
      id: `st_${Date.now()}`,
      texto: item.texto,
      completada: false,
      creadaAt: Date.now(),
      ...(item.minutosCupo != null && item.minutosCupo > 0 ? { minutosCupo: item.minutosCupo } : {}),
      ...(item.detalles?.length
        ? {
            detalles: item.detalles.map(d => ({
              ...d,
              id: `dt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            })),
          }
        : {}),
    };
    const subTareas = [...(vehicle.subTareas || []), newSub];
    setVehicles(prev => prev.map(v => (v.id === vehicle.id ? { ...v, subTareas } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicle.id ? { ...v, subTareas } : v));
    persistVehiclesRef();
    try {
      void updateVehicle(user.uid, vehicle.id, { subTareas });
      const localSaved = await updateSituacionReservaEstado(user.uid, reservaId, "retomada_libre", {
        retomadaAt: Date.now(),
        retomadaEnVehiculoId: vehicle.id,
      });
      if (!localSaved) {
        toast.error("No se pudo actualizar la reserva", {
          description: "Libera espacio en el navegador e inténtalo de nuevo.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        });
        return;
      }
      setSituacionReserva(prev =>
        prev.map(i =>
          i.id === reservaId
            ? {
                ...i,
                estado: "retomada_libre" as const,
                retomadaAt: Date.now(),
                retomadaEnVehiculoId: vehicle.id,
              }
            : i
        )
      );
      setExpandedId(vehicle.id);
      void handleSyncSituacionCupoAnchor(vehicle.id);
      toast.success("Retomada en lista libre", {
        description: `"${item.texto}" · marcada cumplida en reserva`,
        style: { backgroundColor: PIZARRA, border: `1px solid ${EMERALD}`, color: EMERALD },
        duration: 2800,
      });
    } catch (e) {
      console.error("[handleReservaAListaLibre]", e);
      toast.error("No se pudo retomar en lista libre", {
        description: "Comprueba que el vehículo situacional siga activo e inténtalo de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    }
  };

  const handleReservaACronometro = async (reservaId: string) => {
    if (!user) return;
    const item = reservaActivas.find(r => r.id === reservaId);
    if (!item) return;
    const activos = vehicles.filter(v => v.status === "activo" && v.tipoFlota === "situacion");
    const vehicle =
      (item.origenVehiculoId ? activos.find(v => v.id === item.origenVehiculoId) : undefined) ??
      pickSituacionVehicleTarget();
    if (!vehicle) {
      toast.error(activos.length > 1 ? "Expande el vehículo situacional destino" : "Abre un vehículo situacional activo", {
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    const newSub: SubTarea = {
      id: `st_${Date.now()}`,
      texto: item.texto,
      completada: false,
      creadaAt: Date.now(),
      ...(item.minutosCupo != null && item.minutosCupo > 0 ? { minutosCupo: item.minutosCupo } : {}),
      ...(item.detalles?.length
        ? {
            detalles: item.detalles.map(d => ({
              ...d,
              id: `dt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            })),
          }
        : {}),
    };
    const subTareas = [...(vehicle.subTareas || []), newSub];
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicle.id ? { ...v, subTareas } : v));
    setVehicles(prev => prev.map(v => (v.id === vehicle.id ? { ...v, subTareas } : v)));
    try {
      // Una sola persistencia: evita snapshot Firebase intermedio (lista libre) que pisaba el desglose con tiempo.
      await handleMoveSubTareasToCronometro(vehicle.id, [newSub.id]);
      const localSaved = await updateSituacionReservaEstado(user.uid, reservaId, "retomada_cron", {
        retomadaAt: Date.now(),
        retomadaEnVehiculoId: vehicle.id,
      });
      if (!localSaved) {
        toast.error("No se pudo actualizar la reserva", {
          description: "Libera espacio en el navegador e inténtalo de nuevo.",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        });
        return;
      }
      setSituacionReserva(prev =>
        prev.map(i =>
          i.id === reservaId
            ? {
                ...i,
                estado: "retomada_cron" as const,
                retomadaAt: Date.now(),
                retomadaEnVehiculoId: vehicle.id,
              }
            : i
        )
      );
      setExpandedId(vehicle.id);
      toast.success("Retomada en desglose con tiempo", {
        description: item.texto,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 2800,
      });
    } catch (e) {
      console.error("[handleReservaACronometro]", e);
      toast.error("No se pudo retomar en cronómetro", {
        description: "Comprueba que el vehículo situacional siga activo e inténtalo de nuevo.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
    }
  };

  const handleQuitarSituacionCupo = async (vehicleId: string, subTareaId: string, delta: number) => {
    if (!user || delta <= 0) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle?.subTareas || vehicle.tipoFlota !== "situacion") return;
    const focusId = resolveFocusSubTareaId(vehicle.subTareas, vehicle.situacionCupoAnchor);
    if (!focusId) {
      toast.error("Sin tarea en foco", {
        description: "Activa el cronómetro situacional antes de quitar minutos.",
        style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
      });
      return;
    }
    const result = quitarMinutosHaciaFoco(vehicle.subTareas, subTareaId, focusId, delta);
    if (!result.ok) {
      if (result.reason === "sin_flexibles" || result.reason === "sin_foco" || result.reason === "foco_no_pendiente") {
        toast.error("Sin filas flexibles posteriores", {
          description: "Solo se descuenta de subtareas pendientes sin minutos fijados (🔒).",
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        });
      } else {
        toast.error("Minutos insuficientes en filas flexibles", {
          description: `Disponible para descontar: ${result.disponible ?? 0} min.`,
          style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
        });
      }
      return;
    }
    const subTareas = result.subTareas;
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas } : v));
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
      const focoTexto = subTareas.find(st => st.id === focusId)?.texto ?? "foco";
      toast.success(`−${result.descontado} min cola → +${result.focoGanado} min foco`, {
        description: focoTexto,
        style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
        duration: 2800,
      });
      void handleSyncSituacionCupoAnchor(vehicleId);
    } catch (e) {
      console.error("[handleQuitarSituacionCupo]", e);
    }
  };

  const handleAddCasaItem = async (vehicleId: string, subTareaId: string, texto: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const t = texto.trim();
    if (!t) return;
    const nuevo: DetalleSubTarea = {
      id: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      texto: t,
      entregado: false,
      creadaAt: Date.now(),
      casa: true,
    };
    const subTareas = (vehicle.subTareas || []).map(st =>
      st.id === subTareaId ? { ...st, detalles: [...(st.detalles || []), nuevo] } : st
    );
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas } : v));
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
    } catch (e) {
      console.error("[handleAddCasaItem]", e);
    }
  };

  const handleToggleCasaItem = async (vehicleId: string, subTareaId: string, detalleId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const targetSub = (vehicle.subTareas || []).find(st => st.id === subTareaId);
    const target = (targetSub?.detalles || []).find(d => d.id === detalleId && d.casa);
    if (!target || target.entregado) return;
    const subTareas = (vehicle.subTareas || []).map(st =>
      st.id === subTareaId
        ? {
            ...st,
            detalles: (st.detalles || []).map(d =>
              d.id === detalleId ? { ...d, entregado: true } : d
            ),
          }
        : st
    );
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, subTareas } : v)));
    vehiclesRef.current = vehiclesRef.current.map(v => (v.id === vehicleId ? { ...v, subTareas } : v));
    persistVehiclesRef();
    try {
      await updateVehicle(user.uid, vehicleId, { subTareas });
    } catch (e) {
      console.error("[handleToggleCasaItem]", e);
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
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    persistVehiclesRef();
    try { await updateVehicle(user.uid, vehicleId, { subTareas }); } catch (e) { console.error("[handleAddDetalle]", e); }
  };

  const handleEntregarDetalle = async (vehicleId: string, subTareaId: string, detalleId: string) => {
    if (!user) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const targetSub = (vehicle.subTareas || []).find(st => st.id === subTareaId);
    const targetDetalle = (targetSub?.detalles || []).find(d => d.id === detalleId);
    if (!targetDetalle || targetDetalle.entregado || targetDetalle.casa) return;
    const subTareas = (vehicle.subTareas || []).map(st =>
      st.id === subTareaId
        ? { ...st, detalles: (st.detalles || []).map(d => d.id === detalleId ? { ...d, entregado: true } : d) }
        : st
    );
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, subTareas } : v));
    vehiclesRef.current = vehiclesRef.current.map(v => v.id === vehicleId ? { ...v, subTareas } : v);
    persistVehiclesRef();
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

  const activeVehicles = vehicles.filter(v => v.status === "activo");
  const completedVehicles = vehicles.filter(v => v.status === "cumplido" || v.status === "archivado");
  const expressVehiclesActivos = activeVehicles.filter(v => v.tipoTerminoRapido);
  const panoramicaActivos = expressVehiclesActivos.filter(v => v.tipoTerminoRapido === "omitido");
  const operativaActivos = expressVehiclesActivos.filter(v => v.tipoTerminoRapido !== "omitido");
  const panoramicaHistorial = completedVehicles.filter(v => v.tipoTerminoRapido === "omitido");
  const operativaHistorial = completedVehicles.filter(v => v.tipoTerminoRapido !== "omitido");

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
  const tikSoundEnabledRef = useRef(tikSoundEnabled);
  tikSoundEnabledRef.current = tikSoundEnabled;

  const clearTikTapInterval = useCallback(() => {
    if (tikTapIntervalRef.current) {
      clearInterval(tikTapIntervalRef.current);
      tikTapIntervalRef.current = null;
    }
  }, []);

  const playTikTap = useCallback(() => {
    if (!tikSoundEnabledRef.current || !isTikSoundEnabled()) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, []);

  useEffect(() => {
    const onTikChange = (e: Event) => {
      const on = (e as CustomEvent<{ on: boolean }>).detail?.on ?? isTikSoundEnabled();
      setTikSoundEnabledState(on);
      if (!on) clearTikTapInterval();
    };
    const onSituacionAlertsChange = (e: Event) => {
      const on = (e as CustomEvent<{ on: boolean }>).detail?.on ?? isSituacionAlertsEnabled();
      setSituacionAlertsEnabledState(on);
      if (localStorage.getItem("sistemicar_puerta_voz") == null) {
        setPuertaVozEnabledState(on);
      }
    };
    const onPuertaVozChange = (e: Event) => {
      const on = (e as CustomEvent<{ on: boolean }>).detail?.on ?? isPuertaVozEnabled();
      setPuertaVozEnabledState(on);
    };
    const onDesglosadorVozChange = (e: Event) => {
      const on = (e as CustomEvent<{ on: boolean }>).detail?.on ?? isDesglosadorVoiceEnabled();
      setDesglosadorVozEnabledState(on);
    };
    window.addEventListener("sistemicar-tik-sound-changed", onTikChange);
    window.addEventListener("sistemicar-situacion-alerts-changed", onSituacionAlertsChange);
    window.addEventListener("sistemicar-puerta-voz-changed", onPuertaVozChange);
    window.addEventListener("sistemicar-desglosador-voz-changed", onDesglosadorVozChange);
    return () => {
      window.removeEventListener("sistemicar-tik-sound-changed", onTikChange);
      window.removeEventListener("sistemicar-situacion-alerts-changed", onSituacionAlertsChange);
      window.removeEventListener("sistemicar-puerta-voz-changed", onPuertaVozChange);
      window.removeEventListener("sistemicar-desglosador-voz-changed", onDesglosadorVozChange);
    };
  }, [clearTikTapInterval]);

  const segmentoActualIdx = planilla ? planilla.segmentos.findIndex(s => s.estado === "activo") : -1;
  const segmentoNumero = segmentoActualIdx >= 0 ? segmentoActualIdx + 1 : null;

  useEffect(() => {
    if (!expandedId) return;
    const expanded = vehicles.find(v => v.id === expandedId);
    if (expanded && expanded.status !== "activo") {
      setExpandedId(null);
    }
  }, [vehicles, expandedId]);

  useEffect(() => {
    const activeCount = vehicles.filter(v => v.status === "activo").length;
    if (prevActiveVehicleCountRef.current !== null && activeCount < prevActiveVehicleCountRef.current) {
      scrollFlotaActivosIntoView();
    }
    prevActiveVehicleCountRef.current = activeCount;
  }, [vehicles, scrollFlotaActivosIntoView]);

  const renderSoundToggles = (compact?: boolean) => (
    <>
      <button
        type="button"
        onClick={() => {
          const next = !situacionAlertsEnabled;
          setSituacionAlertsEnabledState(next);
          setSituacionAlertsEnabled(next);
        }}
        className={`flex items-center gap-1 rounded-md border transition-all ${compact ? "px-2 py-1" : "px-2 py-1"}`}
        style={{
          borderColor: situacionAlertsEnabled ? `${GOLD}40` : "rgba(255,255,255,0.08)",
          backgroundColor: situacionAlertsEnabled ? `${GOLD}10` : "rgba(0,0,0,0.2)",
        }}
        title={
          situacionAlertsEnabled
            ? "Silenciar alertas situacionales"
            : "Activar alertas situacionales (sonido, vibración, notificaciones)"
        }
        data-testid="button-situacion-alerts-toggle"
      >
        {situacionAlertsEnabled ? <Bell size={10} style={{ color: GOLD }} /> : <BellOff size={10} style={{ color: "#475569" }} />}
        <span
          className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: situacionAlertsEnabled ? GOLD : "#475569" }}
        >
          Alertas {situacionAlertsEnabled ? "ON" : "OFF"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !puertaVozEnabled;
          setPuertaVozEnabledState(next);
          setPuertaVozEnabled(next);
        }}
        className={`flex items-center gap-1 rounded-md border transition-all ${compact ? "px-2 py-1" : "px-2 py-1"}`}
        style={{
          borderColor: puertaVozEnabled ? `${VIOLET}40` : "rgba(255,255,255,0.08)",
          backgroundColor: puertaVozEnabled ? `${VIOLET}10` : "rgba(0,0,0,0.2)",
        }}
        title={puertaVozEnabled ? "Silenciar voz de puertas (min 4)" : "Activar voz de puertas de atención"}
        data-testid="button-puerta-voz-toggle"
      >
        <span
          className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: puertaVozEnabled ? VIOLET : "#475569" }}
        >
          Puerta {puertaVozEnabled ? "ON" : "OFF"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !desglosadorVozEnabled;
          setDesglosadorVozEnabledState(next);
          setDesglosadorVoiceEnabled(next);
        }}
        className={`flex items-center gap-1 rounded-md border transition-all ${compact ? "px-2 py-1" : "px-2 py-1"}`}
        style={{
          borderColor: desglosadorVozEnabled ? `${CYAN}40` : "rgba(255,255,255,0.08)",
          backgroundColor: desglosadorVozEnabled ? `${CYAN}10` : "rgba(0,0,0,0.2)",
        }}
        title={
          desglosadorVozEnabled
            ? "Silenciar voz de ruta de enfoque (desglosador)"
            : "Activar voz opcional al iniciar sub con ruta de enfoque marcada"
        }
        data-testid="button-desglosador-voz-toggle"
      >
        <span
          className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: desglosadorVozEnabled ? CYAN : "#475569" }}
        >
          DSG {desglosadorVozEnabled ? "ON" : "OFF"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !tikSoundEnabled;
          setTikSoundEnabledState(next);
          setTikSoundEnabled(next);
          if (!next) clearTikTapInterval();
        }}
        className={`flex items-center gap-1 rounded-md border transition-all ${compact ? "px-2 py-1" : "px-2 py-1"}`}
        style={{
          borderColor: tikSoundEnabled ? `${GOLD}40` : "rgba(255,255,255,0.08)",
          backgroundColor: tikSoundEnabled ? `${GOLD}10` : "rgba(0,0,0,0.2)",
        }}
        title={tikSoundEnabled ? "Silenciar tick del reloj" : "Activar tick del reloj"}
        data-testid="button-tik-sound-toggle"
      >
        {tikSoundEnabled ? <Volume2 size={10} style={{ color: GOLD }} /> : <VolumeX size={10} style={{ color: "#475569" }} />}
        <span
          className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: tikSoundEnabled ? GOLD : "#475569" }}
        >
          Tick {tikSoundEnabled ? "ON" : "OFF"}
        </span>
      </button>
    </>
  );

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
    <div className="min-h-screen p-4 pb-40" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto space-y-4">
        {planLayout === "full" && (
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
        )}

        {user?.uid && planLayout === "full" && (
          <PlanificacionPrimerDia
            uid={user.uid}
            profile={planificacionProfile}
            dayStartMs={journalDayKey}
            segmentos={planilla?.segmentos ?? []}
            vehicles={vehicles}
            onOpenTutorial={() => setShowPlanTutorial(true)}
            onAskDoctor={openDoctorIAChat}
          />
        )}

        {showPlanTutorial && user?.uid && (
          <PlanificacionTutorial
            uid={user.uid}
            profile={planificacionProfile}
            onComplete={() => setShowPlanTutorial(false)}
            onAskDoctor={openDoctorIAChat}
          />
        )}

        <PlanificacionCockpit
            compact={compactLayout}
            onToggleCompact={() => setPlanLayout(v => (v === "compact" ? "full" : "compact"))}
            tab={planTab}
            onTabChange={(tab) => {
              setPlanTab(tab);
              if (planLayout === "full") setPlanLayout("compact");
            }}
            psLine={(
              <div>
                <p className="text-[10px] font-black tabular-nums" style={{ color: CYAN }} data-testid="cockpit-ps-line">
                  {dailyPsBar.todayPs} PS · {dailyPsBar.pctOfReference}%
                </p>
                <p className="text-[7px] text-slate-600 leading-snug">Refuerzo · no es producción ni decisiones</p>
              </div>
            )}
            combustibleLine={(
              <p
                className="text-[9px] font-bold tabular-nums leading-snug"
                style={{ color: "#A855F7" }}
                title={formatCombustibleDetalle(combustibleLive)}
                data-testid="cockpit-combustible-line"
              >
                {formatCombustibleResumen(combustibleLive)}
              </p>
            )}
            anillo={(
              <AnilloConciencia
                planificacionPct={anilloModel.metricas.planificacionPct}
                conquistaArcPct={anilloModel.metricas.conquistaArcPct}
                entropiaArcPct={anilloModel.metricas.entropiaArcPct}
                timelineArcs={anilloModel.timelineArcs}
                conquistaPulse={conquistaPulse}
                size={72}
                segmentos={anilloModel.segs}
                pointerDeg={anilloModel.anilloEstado.deg}
                pointerLap={anilloModel.pointerLap}
                pointerMode={anilloModel.anilloEstado.mode}
                centerGuide={anilloModel.anilloEstado.centerGuide}
              />
            )}
            segmentoChip={(
              segmentoActivo ? (
                <div className="rounded-xl border px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }} data-testid="cockpit-segmento-activo">
                  <p className="text-[9px] font-black text-white truncate">{segmentoActivo.nombre}</p>
                  <p className="text-[8px] text-slate-500">{segmentoActivo.horaInicio}–{segmentoActivo.horaFin}</p>
                </div>
              ) : (
                <div className="rounded-xl border px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }} data-testid="cockpit-sin-segmento">
                  <p className="text-[9px] font-black text-slate-300">Sin segmento activo</p>
                  <p className="text-[8px] text-slate-600">Opera desde “Segmentos del día”.</p>
                </div>
              )
            )}
          />

        {/* MONITOR DE ESTADOS */}
        {(planLayout === "full" || planTab === "meta") && monitorState && (
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

        {/* BARRA PS — total + día */}
        {(planLayout === "full" || planTab === "meta") && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl border relative overflow-hidden" style={{ backgroundColor: PIZARRA, borderColor: goldenFlash ? GOLD : `${GOLD}20`, boxShadow: goldenFlash ? `0 0 30px ${GOLD}50, 0 0 60px ${GOLD}20` : "none", transition: "all 0.5s ease" }}>
          <AnimatePresence>
            {goldenFlash && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 0.6, 0.3, 0.6, 0], scale: [0.8, 1.1, 1, 1.1, 0.8] }} transition={{ duration: 2.5, times: [0, 0.2, 0.5, 0.7, 1] }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: `radial-gradient(circle at center, ${GOLD}30 0%, transparent 70%)`, zIndex: 1 }} />
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-1 relative" style={{ zIndex: 2 }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Puntos de Soberanía</span>
            <motion.span animate={goldenFlash ? { scale: [1, 1.3, 1.1, 1.25, 1], textShadow: [`0 0 0px ${GOLD}`, `0 0 20px ${GOLD}`, `0 0 10px ${GOLD}`, `0 0 25px ${GOLD}`, `0 0 0px ${GOLD}`] } : {}} transition={{ duration: 2 }} className="text-lg font-black" style={{ color: GOLD }}>{progression?.sovereigntyPoints || 0} PS</motion.span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden relative mb-2" style={{ backgroundColor: "rgba(255,255,255,0.08)", zIndex: 2 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((progression?.sovereigntyPoints || 0) % 350) / 350 * 100, 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${BLOOD} 0%, ${GOLD} 100%)` }} />
          </div>
          <div className="flex items-center justify-between mb-0.5 relative gap-2" style={{ zIndex: 2 }}>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: CYAN }}>PS del día</span>
            <span className="text-sm font-black tabular-nums" style={{ color: CYAN }}>
              {dailyPsBar.todayPs} PS
              <span className="text-[10px] font-bold ml-1.5 opacity-80">{dailyPsBar.pctOfReference}%</span>
            </span>
          </div>
          <p className="text-[7px] text-slate-500 mb-1 relative leading-snug" style={{ zIndex: 2 }}>
            {dailyPsBar.referenceLabel}
          </p>
          <p
            className="text-[8px] font-bold mb-1.5 relative leading-snug"
            style={{ zIndex: 2, color: dailyPsBar.atOrAbove100 ? GOLD : CYAN }}
            data-testid="daily-ps-status"
          >
            {dailyPsBar.statusText}
          </p>
          <div
            className="relative h-3 rounded-full overflow-visible mb-1"
            style={{ backgroundColor: "rgba(0,255,195,0.08)", zIndex: 2 }}
            data-testid="daily-ps-bar"
          >
            <div
              className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none"
              style={{
                left: `${dailyPsBar.marker100WidthPct}%`,
                backgroundColor: dailyPsBar.atOrAbove100 ? `${GOLD}90` : "rgba(255,255,255,0.45)",
                boxShadow: dailyPsBar.atOrAbove100 ? `0 0 6px ${GOLD}80` : "none",
              }}
              title="100% = ayer"
            />
            <motion.div
              key={`${journalDayKey}-${dailyPsBar.todayPs}`}
              initial={{ width: 0 }}
              animate={{ width: `${dailyPsBar.fillWidthPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-0 bottom-0 left-0 rounded-full z-10"
              style={{
                background: dailyPsBar.atOrAbove100
                  ? `linear-gradient(90deg, ${CYAN}99 0%, ${CYAN} 70%, ${GOLD} 100%)`
                  : `linear-gradient(90deg, ${CYAN}55, ${CYAN})`,
                boxShadow: dailyPsBar.atOrAbove120 ? `0 0 12px ${GOLD}60` : `0 0 8px ${CYAN}30`,
              }}
            />
          </div>
          <div className="relative h-3 mb-0.5" style={{ zIndex: 2 }}>
            <span className="absolute left-0 top-0 text-[7px] text-slate-600">0</span>
            <span
              className="absolute top-0 text-[7px] font-bold -translate-x-1/2"
              style={{ left: `${dailyPsBar.marker100WidthPct}%`, color: dailyPsBar.atOrAbove100 ? GOLD : "rgba(255,255,255,0.45)" }}
            >
              100%
            </span>
            <span className="absolute right-0 top-0 text-[7px] text-slate-600">120%</span>
          </div>
        </motion.div>
        )}

        {/* Termodinámica — frente a ayer (tu referencia) */}
        {(planLayout === "full" || planTab === "metricas") && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border overflow-hidden"
          style={{ backgroundColor: PIZARRA, borderColor: "rgba(56,189,248,0.28)" }}
          data-testid="termo-compare-card"
        >
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#38BDF8" }}>
                Termodinámica Atencional
              </p>
              <p className="text-[7px] text-slate-500 mt-0.5 leading-snug">
                Frente a ayer · bloque = desglosador cerrado · decisiones = subs + situación · PS = refuerzo aparte
              </p>
            </div>
            {compactLayout && (
              <button
                type="button"
                onClick={() => setMetricasDetalleOpen(v => !v)}
                className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border"
                style={{ borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.45)", backgroundColor: "rgba(0,0,0,0.20)" }}
                data-testid="metricas-detalle-toggle"
                title={metricasDetalleOpen ? "Ocultar detalles" : "Ver detalles"}
              >
                {metricasDetalleOpen ? "Menos" : "Más"}
              </button>
            )}
            <div
              className="shrink-0 px-2.5 py-1.5 rounded-lg border text-center"
              style={{
                backgroundColor: `${FASE_ATENCIONAL_COLOR[termoCompare.estadoHoy]}12`,
                borderColor: `${FASE_ATENCIONAL_COLOR[termoCompare.estadoHoy]}40`,
              }}
            >
              <p className="text-[7px] text-slate-500 uppercase tracking-wider">Resistencia</p>
              <p className="text-sm font-black leading-tight" style={{ color: FASE_ATENCIONAL_COLOR[termoCompare.estadoHoy] }}>
                {FASE_ATENCIONAL_LABEL[termoCompare.estadoHoy]}
              </p>
              <p className="text-[7px] text-slate-500 mt-0.5 tabular-nums">índice {termoCompare.indiceHoy}</p>
              {termoCompare.estadoAyer && (
                <p className="text-[7px] text-slate-600 mt-0.5">
                  ayer {FASE_ATENCIONAL_LABEL[termoCompare.estadoAyer]} · {termoCompare.indiceAyer ?? "—"}
                </p>
              )}
            </div>
          </div>

          <div
            className="p-2.5 rounded-lg mb-2.5 border"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] font-bold text-white leading-snug">{termoCompare.headline}</p>
            {(planLayout === "full" || metricasDetalleOpen) && (
              <p className="text-[8px] text-slate-400 mt-1 leading-relaxed">{termoCompare.motivacion}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {termoCompare.rows.slice(0, 4).map(row => {
                const rowColor =
                  row.key === "dominio_fluido"
                    ? FASE_ATENCIONAL_COLOR.dominio_fluido
                    : row.key === "ganancia"
                      ? EMERALD
                      : row.key === "friccion"
                        ? RUTA_BANDA_META.limite.color
                        : row.key === "bloques"
                          ? "#38BDF8"
                          : GOLD;
                const rowIcon =
                  row.key === "dominio_fluido"
                    ? "F"
                    : row.key === "ganancia"
                      ? "+"
                      : row.key === "friccion"
                        ? "!"
                      : row.key === "bloques"
                        ? "#"
                        : "*";
                const improved = row.betterWhenHigher ? row.delta > 0 : row.delta < 0;
                const worsened = row.betterWhenHigher ? row.delta < 0 : row.delta > 0;
                const deltaColor = improved
                  ? EMERALD
                  : worsened
                    ? "#94a3b8"
                    : "rgba(255,255,255,0.5)";
                const deltaText =
                  row.delta === 0
                    ? "="
                    : row.delta > 0
                      ? `+${row.delta}`
                      : `${row.delta}`;
                const maxVal = Math.max(row.today, row.yesterday, 1);
                const todayPct = Math.round((row.today / maxVal) * 100);
                return (
                  <div
                    key={row.key}
                    className="px-2 py-2 rounded-lg border relative overflow-hidden"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderColor: `${rowColor}25`,
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5"
                      style={{ backgroundColor: rowColor }}
                    />
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px]" style={{ color: rowColor }}>{rowIcon}</span>
                      <p className="text-[7px] text-slate-400 truncate leading-tight">{row.label}</p>
                    </div>
                    <div className="flex items-baseline justify-between gap-1 mb-1.5">
                      <span className="text-sm font-black text-white tabular-nums">{row.today}</span>
                      <span className="text-[9px] font-bold tabular-nums" style={{ color: deltaColor }}>
                        {termoCompare.hasYesterday ? deltaText : "—"}
                      </span>
                    </div>
                    {termoCompare.hasYesterday && (
                      <div className="space-y-0.5">
                        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${todayPct}%`, backgroundColor: rowColor }} />
                        </div>
                        <p className="text-[6px] text-slate-600">ayer {row.yesterday}</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </motion.div>
        )}

        {/* Atención Panorámica — puertas conscientes */}
        {(planLayout === "full" || planTab === "metricas") && planilla && planilla.segmentos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border overflow-hidden"
            style={{ backgroundColor: PIZARRA, borderColor: "rgba(139,92,246,0.35)" }}
            data-testid="atencion-card"
          >
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: VIOLET }}>
                  Atención Panorámica
                </p>
                <p className="text-[7px] text-slate-500 mt-0.5">
                  Puertas conscientes ±5 min · voz al minuto 4 · AV = antes de voz · DV = después
                </p>
              </div>
              <div
                className="shrink-0 px-2.5 py-1.5 rounded-lg border text-center"
                style={{ backgroundColor: `${VIOLET}12`, borderColor: `${VIOLET}40` }}
              >
                <p className="text-[7px] text-slate-500 uppercase tracking-wider">Hoy</p>
                <p className="text-sm font-black leading-tight" style={{ color: VIOLET }}>
                  {atencionLive.indiceAtencion}
                </p>
              </div>
            </div>

            <div
              className="p-2.5 rounded-lg mb-2.5 border"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] font-bold text-white leading-snug">{atencionCompare.headline}</p>
              {(planLayout === "full" || metricasDetalleOpen) && (
                <p className="text-[8px] text-slate-400 mt-1 leading-relaxed">{atencionCompare.motivacion}</p>
              )}
              <div className="flex gap-3 mt-2 text-[8px] flex-wrap">
                <span className="text-slate-500">
                  Puertas: <span className="font-bold text-slate-300">{atencionLive.puertasAbiertas}</span>
                </span>
                <span className="text-slate-500">
                  Perdidas: <span className="font-bold text-slate-300">{atencionLive.puertasPerdidas}</span>
                </span>
                <span className="text-slate-500">
                  Cierres: <span className="font-bold text-slate-300">{atencionLive.cierresConscientes}</span>
                </span>
                {atencionLive.ratioAntesVoz != null && (
                  <span className="text-slate-500">
                    AV: <span className="font-bold" style={{ color: VIOLET }}>{atencionLive.ratioAntesVoz}%</span>
                  </span>
                )}
              </div>
            </div>

            <div className={`space-y-1 overflow-y-auto ${compactLayout ? "max-h-24" : "max-h-36"}`}>
              {atencionLive.segmentos.map(sa => {
                const badge = atencionBadgeLabel(sa);
                const badgeColor =
                  sa.puertaPerdida
                    ? BLOOD
                    : sa.puertaTiming === "antes_voz"
                      ? VIOLET
                      : sa.puertaTiming === "despues_voz"
                        ? GOLD
                        : sa.ventanaPuertaAbierta
                          ? CYAN
                          : "#64748b";
                return (
                  <div
                    key={sa.segmentoId}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg border"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderColor: `${badgeColor}25`,
                    }}
                    data-testid={`atencion-row-${sa.segmentoId}`}
                  >
                    <span
                      className="text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ backgroundColor: `${badgeColor}18`, color: badgeColor }}
                    >
                      {badge ?? "…"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-200 truncate">
                        {sa.nombre} · {sa.horaInicio}
                      </p>
                      <p className="text-[7px] text-slate-500 leading-snug">
                        {describeSegmentoAtencion(sa)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Disciplina — vehículos conscientes en segmento */}
        {(planLayout === "full" || planTab === "metricas") && planilla && planilla.segmentos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border overflow-hidden"
            style={{ backgroundColor: PIZARRA, borderColor: "rgba(212,175,55,0.28)" }}
            data-testid="disciplina-card"
          >
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD }}>
                  Disciplina
                </p>
                <p className="text-[7px] text-slate-500 mt-0.5">
                  Entrada al trabajo con vehículos conscientes (independiente de la puerta)
                </p>
              </div>
              <div
                className="shrink-0 px-2.5 py-1.5 rounded-lg border text-center"
                style={{
                  backgroundColor: `${GOLD}12`,
                  borderColor: `${GOLD}40`,
                }}
              >
                <p className="text-[7px] text-slate-500 uppercase tracking-wider">Hoy</p>
                <p className="text-sm font-black leading-tight" style={{ color: GOLD }}>
                  {disciplinaLive.indiceDisciplina}
                </p>
              </div>
            </div>

            {disciplinaSerie.length >= 2 && (
              <div className={`${compactLayout ? "h-20" : "h-28"} mb-2.5`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={disciplinaSerie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 8, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 8, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: PIZARRA,
                        border: `1px solid ${GOLD}30`,
                        borderRadius: 8,
                        fontSize: 10,
                      }}
                      labelStyle={{ color: GOLD, fontWeight: 800, fontSize: 9 }}
                      formatter={(value: number) => [`${value}`, "Índice"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fecha || ""}
                    />
                    <Line
                      type="monotone"
                      dataKey="indiceDisciplina"
                      stroke={GOLD}
                      strokeWidth={2}
                      dot={{ fill: GOLD, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: GOLD, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div
              className="p-2.5 rounded-lg mb-2.5 border"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] font-bold text-white leading-snug">{disciplinaCompare.headline}</p>
              {(planLayout === "full" || metricasDetalleOpen) && (
                <p className="text-[8px] text-slate-400 mt-1 leading-relaxed">{disciplinaCompare.motivacion}</p>
              )}
              <div className="flex gap-3 mt-2 text-[8px] flex-wrap">
                <span className="text-slate-500">
                  Sin entrada: <span className="font-bold text-slate-300">{disciplinaLive.sinEntrada}</span>
                </span>
                {disciplinaLive.deltaMedioDesdeInicioMin != null && (
                  <span className="text-slate-500">
                    Δ inicio: <span className="font-bold text-slate-300">+{disciplinaLive.deltaMedioDesdeInicioMin} min</span>
                  </span>
                )}
                {disciplinaLive.montajes > 0 && (
                  <span className="text-slate-500">
                    Montajes: <span className="font-bold text-slate-300">{disciplinaLive.montajes}</span>
                  </span>
                )}
              </div>
            </div>

            {disciplinaLive.estudioTipos.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {disciplinaLive.estudioTipos.map(e => (
                  <span
                    key={`${e.tipoFlota}-${e.tipoReloj}`}
                    className="text-[7px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${AZURE}18`, color: AZURE }}
                  >
                    {formatEstudioTipoChip(e)}
                  </span>
                ))}
              </div>
            )}

            <div className={`space-y-1 overflow-y-auto ${compactLayout ? "max-h-24" : "max-h-36"}`}>
              {disciplinaLive.segmentos.map(sd => {
                const badge = disciplinaBadgeLabel(sd);
                const badgeColor =
                  sd.montaje && sd.enCurso
                    ? BLOOD
                    : sd.sinEntrada
                      ? "#94a3b8"
                      : sd.scoreSegmento >= 70
                        ? EMERALD
                        : sd.scoreSegmento >= 40
                          ? GOLD
                          : "#f97316";
                return (
                  <div
                    key={sd.segmentoId}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg border"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderColor: `${badgeColor}25`,
                    }}
                    data-testid={`disciplina-row-${sd.segmentoId}`}
                  >
                    <span
                      className="text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${badgeColor}18`,
                        color: badgeColor,
                      }}
                    >
                      {badge ?? "…"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-200 truncate">
                        {sd.nombre} · {sd.horaInicio}
                      </p>
                      <p className="text-[7px] text-slate-500 leading-snug">
                        {describeSegmentoDisciplina(sd)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {(planLayout === "full" || planTab === "meta") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 p-2.5 rounded-xl border sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.08)" }}
            data-testid="sound-controls-bar"
          >
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sonido · Planificación</p>
              <p className="text-[7px] text-slate-600 leading-snug mt-0.5">
                Alertas = cupo situacional · Puerta = voz min 4 · Tick = pitido del reloj
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">{renderSoundToggles(true)}</div>
          </motion.div>
        )}

        {(planLayout === "full" || planTab === "meta") && (
          <>
            {centinelaEsperaSec > 0 && !vehicles.some(v => v.status === "activo" && !v.autoVerdad) && (
              <p className="text-[9px] text-center text-slate-500 font-mono" data-testid="centinela-espera">
                Centinela en espera… {centinelaEsperaSec}s
              </p>
            )}
            {centinelaBlockReason &&
              !vehicles.some(v => v.status === "activo" && !v.autoVerdad) &&
              !vehicles.some(v => v.autoVerdad && v.status === "activo") && (
              <p className="text-[9px] text-center text-amber-600/80 leading-snug px-2" data-testid="centinela-blocked">
                Centinela pausado: {centinelaBlockReason}
              </p>
            )}
          </>
        )}

        {/* RADIOGRAFÍA DEL OPERADOR — mini barra de progreso de tokens */}
        {(planLayout === "full" || planTab === "meta") && (() => {
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
        {(planLayout === "full" || planTab === "meta") && (
          <PlanModuleMilestoneBar pts={progression?.ptsPlanificacion || 0} />
        )}

        {/* ANILLO DE CONCIENCIA */}
        {(planLayout === "full" || planTab === "metricas") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center p-3 rounded-xl border"
            style={{ backgroundColor: "rgba(10,10,10,0.8)", borderColor: "rgba(212,175,55,0.15)" }}
            data-testid="anillo-card"
          >
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-center mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
              ANILLO DE CONCIENCIA
            </p>
            <p className="text-[7px] text-slate-600 text-center mb-2 leading-snug px-2">
              Tiempo presente · el combustible son tus decisiones cerradas (abajo)
            </p>
            <AnilloConciencia
              planificacionPct={anilloModel.metricas.planificacionPct}
              conquistaArcPct={anilloModel.metricas.conquistaArcPct}
              entropiaArcPct={anilloModel.metricas.entropiaArcPct}
              timelineArcs={anilloModel.timelineArcs}
              conquistaPulse={conquistaPulse}
              size={130}
              segmentos={anilloModel.segs}
              pointerDeg={anilloModel.anilloEstado.deg}
              pointerLap={anilloModel.pointerLap}
              pointerMode={anilloModel.anilloEstado.mode}
              centerGuide={anilloModel.anilloEstado.centerGuide}
            />
            <div className="mt-2 grid grid-cols-3 gap-1 w-full text-center">
              <div>
                <p className="text-[7px] uppercase font-bold" style={{ color: "#8B5CF6" }}>Consciente</p>
                <p className="text-xs font-black" style={{ color: "#8B5CF6" }}>{formatMinutosJornada(anilloModel.dayStats.conquistaMin)}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase font-bold" style={{ color: BLOOD }}>Inconsciente</p>
                <p className="text-xs font-black" style={{ color: anilloModel.dayStats.entropiaMin > 0 ? BLOOD : "rgba(148,163,184,0.5)" }}>
                  {formatMinutosJornada(anilloModel.dayStats.entropiaMin)}
                </p>
              </div>
              <div>
                <p className="text-[7px] text-slate-500 uppercase">Seg. cerrados</p>
                <p className="text-xs font-black" style={{ color: "#00FFC3" }}>{anilloModel.segConquistados}/{anilloModel.segs.length}</p>
              </div>
            </div>
            <div
              className="mt-2 w-full p-2 rounded-lg border text-center"
              style={{ backgroundColor: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.28)" }}
              data-testid="combustible-card"
              title={formatCombustibleDetalle(combustibleLive)}
            >
              <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: "#A855F7" }}>
                Combustible de conciencia
              </p>
              <p className="text-sm font-black mt-0.5 tabular-nums" style={{ color: "#E9D5FF" }}>
                {formatCombustibleResumen(combustibleLive)}
              </p>
              <p className="text-[7px] text-slate-500 mt-0.5 leading-snug">
                {formatCombustibleDetalle(combustibleLive)}
              </p>
            </div>
          </motion.div>
        )}

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
        {(planLayout === "full" || planTab === "operar") && rutinaBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-amber-700/30 shadow-[0_0_12px_rgba(245,158,11,0.08)] p-4 flex items-center justify-between gap-3 bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950"
            data-testid="banner-rutina"
          >
            <div className="grid grid-cols-[auto_1fr] gap-2.5 items-center min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90 ring-2 ring-gray-800 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-gray-200 truncate">
                  Rutina detectada: {rutinaBanner.nombre}
                </p>
                <p className="text-[9px] text-gray-500 tabular-nums">
                  {rutinaBanner.segmentos.length} segmentos · {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][new Date().getDay()]}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setRutinaBanner(null)}
                className="px-2.5 py-1 rounded-xl text-[9px] font-bold text-gray-500 border border-gray-800 bg-gray-900/40 hover:text-gray-300"
              >
                Omitir
              </button>
              <button
                onClick={() => cargarRutina(rutinaBanner)}
                className="px-3 py-1 rounded-xl text-[9px] font-bold text-amber-400 border border-amber-700/40 bg-amber-950/25 hover:bg-amber-950/40"
                data-testid="btn-cargar-rutina"
              >
                Cargar
              </button>
            </div>
          </motion.div>
        )}

        {/* ACORDEÓN: SEGMENTOS DEL DÍA (Puerta de Atención) */}
        {(planLayout === "full" || planTab === "operar") && (
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
                <div className="px-4 pb-4 space-y-3 border-t border-gray-800/80">
                  <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setShowRutinasPanel(!showRutinasPanel)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                          showRutinasPanel
                            ? "border-gray-600 bg-gray-800/60 text-gray-200"
                            : "border-gray-800 bg-gray-900/50 text-gray-400 hover:text-gray-200"
                        }`}
                        data-testid="btn-rutinas-panel"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Rutinas
                        {plantillasRutina.length > 0 && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700 tabular-nums">
                            {plantillasRutina.length}
                          </span>
                        )}
                      </button>
                      {planilla && planilla.segmentos.length > 0 && (
                        <button
                          onClick={() => setShowGuardarRutina(!showGuardarRutina)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                            showGuardarRutina
                              ? "border-gray-600 bg-gray-800/60 text-gray-200"
                              : "border-gray-800 bg-gray-900/50 text-gray-400 hover:text-gray-200"
                          }`}
                          data-testid="btn-guardar-rutina"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          Guardar como rutina
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCrearSegmento(true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                        showCrearSegmento
                          ? "border-gray-600 bg-gray-800/60 text-gray-200"
                          : "border-gray-700 bg-gray-900/50 text-gray-300 hover:text-gray-100"
                      }`}
                    >
                      <Plus size={12} /> Nuevo Segmento
                    </button>
                  </div>

                  {/* PANEL: GUARDAR COMO RUTINA */}
                  {showGuardarRutina && planilla && planilla.segmentos.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 p-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950"
                      data-testid="panel-guardar-rutina"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/90">
                        Guardar rutina · {planilla.segmentos.length} segmentos actuales
                      </p>
                      <input
                        value={nuevaRutinaNombre}
                        onChange={e => setNuevaRutinaNombre(e.target.value)}
                        placeholder="Nombre de la rutina (ej: Semana de costura)"
                        className="w-full p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-200 text-xs placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
                      />
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Días activos</p>
                        <div className="flex gap-1">
                          {["D","L","M","X","J","V","S"].map((d, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                setNuevaRutinaDias(prev =>
                                  prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                                )
                              }
                              className={`w-7 h-7 rounded-full text-[9px] font-black transition-all border ${
                                nuevaRutinaDias.includes(i)
                                  ? "bg-amber-400/90 text-zinc-950 border-amber-500/50"
                                  : "bg-gray-900/60 text-gray-500 border-gray-800 hover:border-gray-600"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowGuardarRutina(false)}
                          className="flex-1 py-2 rounded-xl text-[9px] font-bold text-gray-500 border border-gray-800 bg-gray-900/40 hover:bg-gray-900/60"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={guardarComoRutina}
                          disabled={!nuevaRutinaNombre.trim() || nuevaRutinaDias.length === 0 || guardandoRutina}
                          className="flex-1 py-2 rounded-xl text-[9px] font-bold text-amber-400 border border-amber-700/40 bg-amber-950/25 hover:bg-amber-950/40 disabled:opacity-40"
                        >
                          {guardandoRutina ? "Guardando…" : "Guardar"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* PANEL: GESTIÓN DE RUTINAS */}
                  {showRutinasPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 p-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950"
                      data-testid="panel-rutinas"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/90">
                          Mis Rutinas
                        </p>
                        {notifPermission !== "granted" && notifPermission !== "unsupported" && (
                          <button
                            onClick={async () => {
                              const ok = await requestNotificationPermission();
                              setNotifPermission(ok ? "granted" : "denied");
                            }}
                            className="text-[8px] px-2 py-0.5 rounded-md font-bold border border-gray-700 text-gray-400 bg-gray-900/60 hover:text-gray-200"
                          >
                            Activar alertas
                          </button>
                        )}
                        {notifPermission === "granted" && (
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider">Alertas activas</span>
                        )}
                      </div>

                      <div className="flex gap-0.5">
                        {["D","L","M","X","J","V","S"].map((d, i) => {
                          const hoy = new Date().getDay();
                          const matching = plantillasRutina.find(p => p.diasActivos.includes(i));
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-lg py-1.5 flex flex-col items-center gap-0.5 border ${
                                i === hoy
                                  ? "bg-gray-800/50 border-gray-600"
                                  : "bg-gray-900/40 border-gray-800"
                              }`}
                            >
                              <span
                                className={`text-[8px] font-black ${
                                  i === hoy ? "text-gray-200" : "text-gray-500"
                                }`}
                              >
                                {d}
                              </span>
                              {matching ? (
                                <div
                                  className="w-2 h-2 rounded-full bg-amber-400/80 ring-2 ring-gray-800"
                                  title={matching.nombre}
                                />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-800" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {plantillasRutina.length === 0 ? (
                        <p className="text-[9px] text-gray-500 text-center py-2">Sin rutinas guardadas</p>
                      ) : (
                        <div className="space-y-2">
                          {plantillasRutina.map(r => {
                            const diasLabel = ["D","L","M","X","J","V","S"]
                              .filter((_, i) => r.diasActivos.includes(i))
                              .join(" ");
                            const highlighted = rutinaResaltadaId === r.id;
                            return (
                              <div
                                key={r.id}
                                ref={el => { rutinaItemRefs.current[r.id] = el; }}
                                className={`grid grid-cols-[auto_1fr_auto] gap-3 items-center p-3 rounded-2xl border transition-all bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950 ${
                                  highlighted
                                    ? "border-amber-700/40 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                                    : "border-gray-800"
                                }`}
                              >
                                <div
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-gray-800 ${
                                    highlighted ? "bg-amber-400/90" : "bg-gray-600"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold tracking-wide text-gray-200 truncate">
                                    {r.nombre}
                                  </p>
                                  <p className="text-[8px] text-gray-500 tabular-nums">
                                    {r.segmentos.length} seg · {diasLabel}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => cargarRutina(r)}
                                    disabled={cargandoRutinaId !== null}
                                    className="px-2 py-0.5 rounded-md text-[8px] font-bold text-amber-400 border border-amber-700/40 bg-amber-950/20 hover:bg-amber-950/35 disabled:opacity-50"
                                    data-testid={`btn-cargar-${r.id}`}
                                  >
                                    {cargandoRutinaId === r.id ? "Cargando…" : "Cargar"}
                                  </button>
                                  <button
                                    onClick={() => eliminarRutina(r.id)}
                                    className="w-6 h-6 rounded-md text-[10px] font-bold text-gray-500 border border-gray-800 bg-gray-900/60 hover:text-gray-300 hover:border-gray-600"
                                    aria-label="Eliminar rutina"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {showCrearSegmento && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 p-4 rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950"
                      data-testid="panel-nuevo-segmento"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Nuevo segmento
                      </p>
                      <input
                        value={nuevoSegNombre}
                        onChange={(e) => setNuevoSegNombre(e.target.value)}
                        placeholder="Nombre del segmento (ej: Costura, Planificación)"
                        className="w-full p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">
                            Hora inicio
                          </label>
                          <input
                            type="time"
                            value={nuevoSegHoraInicio}
                            onChange={(e) => setNuevoSegHoraInicio(e.target.value)}
                            className="w-full p-2 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-200 text-sm focus:outline-none focus:border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 block">
                            Hora fin
                          </label>
                          <input
                            type="time"
                            value={nuevoSegHoraFin}
                            onChange={(e) => setNuevoSegHoraFin(e.target.value)}
                            className="w-full p-2 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-200 text-sm focus:outline-none focus:border-gray-600"
                          />
                        </div>
                      </div>
                      <p className="text-[8px] text-gray-500 leading-relaxed">
                        Duración máxima 24 h. Si la hora fin es anterior a inicio, el segmento cruza medianoche.
                      </p>
                      <SegmentoProyectoSelect
                        value={nuevoSegProyectoId}
                        onChange={setNuevoSegProyectoId}
                        proyectos={proyectosHub}
                        compact
                      />
                      {nuevoSegProyectoId && nuevoSegRutas && (
                        <RutasMentalesEditor
                          rutas={nuevoSegRutas}
                          onChange={setNuevoSegRutas}
                          etiqueta={proyectosHub.find(p => p.id === nuevoSegProyectoId)?.etiqueta}
                        />
                      )}
                      {nuevoSegProyectoId && !nuevoSegRutas && (
                        <p className="text-[8px] text-slate-500">Cargando claridad desde el proyecto…</p>
                      )}
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 block">
                          Color
                        </label>
                        <div className="flex gap-1.5">
                          {SEGMENT_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setNuevoSegColor(c)}
                              className={`w-6 h-6 rounded-full transition-all ring-2 ${
                                nuevoSegColor === c
                                  ? "ring-gray-200 scale-110"
                                  : "ring-gray-800 hover:ring-gray-600"
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setNuevoSegCentinelaEnabled(v => !v)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-gray-800 bg-gray-900/40 transition-all hover:bg-gray-900/60"
                        data-testid="toggle-nuevo-seg-centinela"
                      >
                        <Shield
                          size={11}
                          className={nuevoSegCentinelaEnabled ? "text-gray-300" : "text-gray-600"}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider flex-1 text-left text-gray-400">
                          Centinela
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                            nuevoSegCentinelaEnabled
                              ? "bg-gray-800 text-gray-300 border-gray-700"
                              : "bg-gray-900/80 text-gray-500 border-gray-800"
                          }`}
                        >
                          {nuevoSegCentinelaEnabled ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </button>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setShowCrearSegmento(false)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-500 border border-gray-800 bg-gray-900/40 hover:bg-gray-900/60"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={addSegmento}
                          disabled={
                            segmentoProgramando ||
                            !nuevoSegNombre.trim() ||
                            !nuevoSegHoraInicio ||
                            !nuevoSegHoraFin
                          }
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-200 border border-gray-600 bg-gray-800/80 hover:bg-gray-700/80 disabled:opacity-50"
                        >
                          {segmentoProgramando ? "Programando…" : "Programar"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {planilla && planilla.segmentos.length > 0 ? (
                    <div className="space-y-2">
                      {planilla.segmentos.map((seg) => {
                        void segmentTick;
                        const isActive = seg.estado === "activo";
                        const isEntropia = seg.estado === "entropia";
                        const isClosedManual = seg.estado === "cerrado_manual";
                        const isPendiente = seg.estado === "pendiente";
                        const nowMsSeg = Date.now();
                        // Segmentos están anclados a HH:mm sobre medianoche Lima (no inicio de jornada 05:00)
                        const dayStartSeg = getLimaDayStartMs(nowMsSeg);
                        const puertaVentanaAbierta = isWithinPuertaWindow(
                          nowMsSeg, seg.horaInicio, dayStartSeg
                        );
                        const activarVentanaAbierta = puertaVentanaAbierta;
                        const cierreVentanaAbierta = seg.horaFin
                          ? isWithinSegmentTimeMargin(nowMsSeg, seg.horaInicio, seg.horaFin, "fin", 5, dayStartSeg)
                          : true;
                        const discSeg = disciplinaBySegmentId.get(seg.id);
                        const discBadge = discSeg ? disciplinaBadgeLabel(discSeg) : null;
                        const atencSeg = atencionBySegmentId.get(seg.id);
                        const atencBadge = atencSeg ? atencionBadgeLabel(atencSeg) : null;
                        const dotColor = isActive
                          ? EMERALD
                          : isClosedManual
                            ? "#64748b"
                            : seg.color;
                        const estadoBadge =
                          isEntropia
                            ? "ENTROPÍA"
                            : isClosedManual
                              ? "CERRADO"
                              : isActive
                                ? "ACTIVO"
                                : isPendiente
                                  ? "PENDIENTE"
                                  : null;
                        const cardClass = [
                          "rounded-2xl border p-4 transition-all",
                          "bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950",
                          isEntropia
                            ? "border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
                            : isActive
                              ? "border-emerald-900/40 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                              : "border-gray-800",
                        ].join(" ");
                        const hasActions =
                          isEntropia ||
                          (isActive && cierreVentanaAbierta) ||
                          (isActive && !cierreVentanaAbierta && !!seg.horaFin) ||
                          isPendiente ||
                          (isActive && !!seg.puertaTiming);
                        return (
                          <div key={seg.id} className={cardClass} data-testid={`segment-card-${seg.id}`}>
                            <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                              <div className="flex items-center gap-2.5 shrink-0">
                                <div
                                  className="w-3 h-3 rounded-full ring-2 ring-gray-800/90 shrink-0"
                                  style={{ backgroundColor: dotColor }}
                                />
                                <div className="flex flex-col text-xs text-gray-500 leading-tight tabular-nums">
                                  <span>{seg.horaInicio}</span>
                                  <span>{seg.horaFin}</span>
                                </div>
                              </div>

                              <div className="min-w-0 flex items-center gap-2">
                                <p className="text-gray-200 font-semibold tracking-wide truncate">
                                  {seg.nombre}
                                </p>
                                {atencBadge && (
                                  <span
                                    className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 border border-violet-900/50 bg-violet-950/30 text-violet-300"
                                    title={atencSeg ? describeSegmentoAtencion(atencSeg) : undefined}
                                    data-testid={`segment-atencion-${seg.id}`}
                                  >
                                    {atencBadge}
                                  </span>
                                )}
                                {discBadge && (
                                  <span
                                    className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 border border-gray-800 bg-gray-900/80 text-gray-400"
                                    title={discSeg ? describeSegmentoDisciplina(discSeg) : undefined}
                                    data-testid={`segment-disciplina-${seg.id}`}
                                  >
                                    D:{discBadge}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {estadoBadge && (
                                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-gray-900/90 text-gray-400 border border-gray-800">
                                    {estadoBadge}
                                  </span>
                                )}
                                {seg.psGanados > 0 && (
                                  <span className="text-amber-400 font-bold text-xs tabular-nums whitespace-nowrap">
                                    +{seg.psGanados} PS
                                  </span>
                                )}
                              </div>
                            </div>

                            {hasActions && (
                              <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  {isEntropia && (
                                    <p className="text-[7px] text-red-400/90 leading-tight">
                                      Entropía de atención — puerta no marcada a tiempo
                                    </p>
                                  )}
                                  {isActive && seg.puertaTiming && (
                                    <p className="text-[7px] text-violet-300/80 leading-tight">
                                      Puerta abierta {seg.puertaTiming === "antes_voz" ? "antes de la voz" : "tras la voz"}
                                    </p>
                                  )}
                                  {isPendiente && !activarVentanaAbierta && (
                                    <p className="text-[7px] text-gray-500 leading-tight">
                                      Puerta de atención: ±5 min de {seg.horaInicio} · voz al min 4
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                                {isActive && cierreVentanaAbierta && (
                                  <button
                                    onClick={() => cerrarSegmentoManual(seg.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-colors border border-red-900/40 text-red-300/90 bg-red-950/20 hover:bg-red-950/35"
                                    data-testid={`button-close-segment-${seg.id}`}
                                  >
                                    <Square size={10} /> Cerrar puerta (+2 PS)
                                  </button>
                                )}
                                {isActive && !cierreVentanaAbierta && seg.horaFin && (
                                  <span className="text-[7px] text-gray-500 text-right max-w-[14rem] leading-tight">
                                    Cierre disponible ±5 min de {seg.horaFin}
                                  </span>
                                )}
                                {isPendiente &&
                                  (activarVentanaAbierta ? (
                                    <button
                                      type="button"
                                      disabled={activandoSegId === seg.id}
                                      onClick={() => void activarSegmento(seg.id)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-colors border border-violet-900/50 text-violet-300/95 bg-violet-950/25 hover:bg-violet-950/40 disabled:opacity-50"
                                      data-testid={`button-start-segment-${seg.id}`}
                                    >
                                      <Play size={10} />
                                      {activandoSegId === seg.id ? "Abriendo…" : "Abrir puerta (+2 PS)"}
                                    </button>
                                  ) : (
                                    <span
                                      className="text-[8px] px-2 py-0.5 rounded-md text-gray-500 bg-gray-900/60 border border-gray-800"
                                      title={`Ventana puerta: ${seg.horaInicio} ± 5 min`}
                                    >
                                      Esperando ventana
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isActive && seg.eventos.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-800/80">
                                <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-1.5">
                                  Eventos registrados
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {seg.eventos.slice(-5).map((ev, i) => (
                                    <span
                                      key={i}
                                      className="text-[8px] px-1.5 py-0.5 rounded-md bg-gray-900/70 text-gray-400 border border-gray-800"
                                    >
                                      {ev.componente} · {ev.hora}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!isClosedManual && !isEntropia && (
                              <div className="mt-3 pt-3 border-t border-gray-800/80">
                                <button
                                  onClick={async () => {
                                    if (!user || !planilla) return;
                                    const newVal = seg.centinelaEnabled === false ? true : false;
                                    setPlanilla({
                                      ...planilla,
                                      segmentos: planilla.segmentos.map(s =>
                                        s.id === seg.id ? { ...s, centinelaEnabled: newVal } : s
                                      ),
                                    });
                                    try {
                                      const optimistic = {
                                        ...planilla,
                                        segmentos: planilla.segmentos.map(s =>
                                          s.id === seg.id ? { ...s, centinelaEnabled: newVal } : s
                                        ),
                                      };
                                      const { planilla: updated } = await updateSegmentoInPlanilla(
                                        user.uid,
                                        seg.id,
                                        { centinelaEnabled: newVal },
                                        optimistic
                                      );
                                      setPlanilla(updated);
                                    } catch {
                                      setPlanilla(planilla);
                                    }
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-gray-800 bg-gray-900/40 transition-all hover:bg-gray-900/60"
                                  data-testid={`toggle-centinela-${seg.id}`}
                                >
                                  <Shield
                                    size={13}
                                    className={
                                      seg.centinelaEnabled === false ? "text-gray-600" : "text-gray-300"
                                    }
                                  />
                                  <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-left text-gray-400">
                                    Centinela
                                  </span>
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                      seg.centinelaEnabled === false
                                        ? "bg-gray-900/80 text-gray-500 border-gray-800"
                                        : "bg-gray-800 text-gray-300 border-gray-700"
                                    }`}
                                  >
                                    {seg.centinelaEnabled === false ? "INACTIVO" : "ACTIVO"}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {planilla.segmentos.filter(s => s.estado === "entropia").length > 0 && (
                        <div className="p-4 rounded-2xl border border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.12)] bg-gradient-to-br from-zinc-950 via-[#141416] to-zinc-950">
                          <div className="flex items-center gap-2 mb-1">
                            <Lock size={12} className="text-gray-500" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                              Segmentos en entropía: {planilla.segmentos.filter(s => s.estado === "entropia").length}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 leading-relaxed">
                            Cada entropía = 0 PS. Registro de atención perdida — entrena la conciencia panorámica.
                          </p>
                        </div>
                      )}
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
        )}

        {(planLayout === "full" || planTab === "operar") && (!isCreating ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest flex-shrink-0">La Flota</p>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">{renderSoundToggles()}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FLOTA_CONFIG) as [TipoFlota, typeof FLOTA_CONFIG["tiempo"]][]).map(([tipo, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={tipo} onClick={() => { resetCentinelaLaunchGate(); setCierreEnergiaPending(null); setCierreEnergiaSeleccion(null); setShowCierreJornada(false); setSituacionDesgloseCelebration(null); setSaving(false); setPlanTab("operar"); setIsCreating(true); setVehicleMode("flota"); setTipoFlotaSeleccionado(tipo); if (tipo === "situacion" && !terminoDetalle.trim()) setTerminoDetalle("Al cerrar este bloque"); }} className="p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-[1.02]" style={{ borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }} data-testid={`button-flota-${tipo}`}>
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

            {activeVehicles.length > 0 ? (
              <div ref={flotaActivosRef} className="scroll-mt-4">
              <AccordionSection title="VEHÍCULOS ACTIVOS" icon={Zap} color={BLOOD} count={activeVehicles.length} defaultOpen>
                {[...sortedOperativaActivos, ...panoramicaActivos.filter(v => !sortedOperativaActivos.includes(v)), ...activeVehicles.filter(v => !v.tipoTerminoRapido)].filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} onOpenCierreEnergia={(p) => { setCierreEnergiaSeleccion(null); setCierreRutaSeleccion(new Set()); setCierreRutaSinUso(false); setCierreRutaPatron(null); setCierreEnergiaPending(p); }} onComplete={() => { setCierreEnergiaSeleccion(null); setCierreEnergiaPending({ kind: "flota", vehicleId: v.id, status: "cumplido" }); }} onArchive={() => { setCierreEnergiaSeleccion(null); setCierreEnergiaPending({ kind: "flota", vehicleId: v.id, status: "archivado" }); }} segmentoNumero={segmentoNumero} planilla={planilla} onAddSubTarea={handleAddSubTarea} onToggleSubTarea={handleToggleSubTarea} onSetSubTareaMinutosCupo={handleSetSubTareaMinutosCupo} onExtendSituacionCupo={handleExtendSituacionCupo} onSyncSituacionCupoAnchor={handleSyncSituacionCupoAnchor} onMoveSubTareasToCronometro={handleMoveSubTareasToCronometro} onSituacionCronometroSetHoraFin={handleSituacionCronometroSetHoraFin} onSituacionCronometroCumplido={handleSituacionCronometroCumplido} onSituacionCronometroFallado={handleSituacionCronometroFallado} onSituacionCronometroReservar={handleSituacionCronometroReservar} onQuitarSituacionCupo={handleQuitarSituacionCupo} onCerrarSituacionDesgloseBloque={handleCerrarSituacionDesgloseBloque} situacionBloquePsTotal={situacionBloqueSummaries[v.id]?.psTotal} onVerSituacionBloquePs={() => { const s = situacionBloqueSummaries[v.id]; if (s) openSituacionDesgloseCelebration(v.id, v.titulo, s); }} onAddDetalle={handleAddDetalle} onEntregarDetalle={handleEntregarDetalle} onAddCasaItem={handleAddCasaItem} onToggleCasaItem={handleToggleCasaItem} arquitectoUnlocked={soberaniaDiaUnlocked} onInvestigadorClose={handleInvestigadorClose} onDesglosadorUpdate={handleDesglosadorUpdate} onDesglosadorGlobalClose={handleDesglosadorGlobalClose} onDesglosadorDepthTick={handleDesglosadorDepthTick} onDesglosadorPausaInterrupcion={handleDesglosadorPausaInterrupcion} onResumeDesglosador={resumeDesglosadorTrasInterrupcion} onDesglosadorReorderSubs={handleDesglosadorReorderSubs} onReorderSubTareasCronometro={handleReorderSubTareasCronometro} onDescansoClose={handleDescansoClose} onMicroPasoToggle={handleMicroPasoToggle} onEtapaPuntoCeroToggle={handleEtapaPuntoCeroToggle} onRutaBandCross={recordRutaBandCross} onBloqueCierre={recordBloqueCierre} />
                ))}
              </AccordionSection>
              </div>
            ) : (
              <div className="p-4 rounded-xl border text-center space-y-1" style={{ backgroundColor: PIZARRA, borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sin vehículos activos</p>
                <p className="text-[9px] text-slate-600">Lanza uno desde La Flota o el historial aparecerá al cerrar misiones.</p>
              </div>
            )}

            {(() => {
              const todayStart = new Date(); todayStart.setHours(0,0,0,0);
              const todayStartMs = todayStart.getTime();
              const vehiculosHoy = completedVehicles.filter(v => !v.autoVerdad && (() => {
                const t = vehicleClosedAtMs(v);
                return t >= todayStartMs;
              })()).sort((a, b) => vehicleClosedAtMs(a) - vehicleClosedAtMs(b));
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
                <AccordionSection title="HISTORIAL" subtitle="Hoy" icon={Flag} color={SLATE} count={vehiculosHoy.length} defaultOpen={false}>
                  {vehiculosHoy.slice(0, 5).map((v) => (
                    <VehicleCard key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} minimal planilla={planilla} />
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
                        <VehicleCard key={v.id} vehicle={v} expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} minimal planilla={planilla} />
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
              <button type="button" onClick={async () => {
                try {
                  if (user) {
                    setTodayCierreJornada(await getTodayCierreJornada(user.uid));
                  } else {
                    setTodayCierreJornada(null);
                  }
                } catch (e) {
                  console.error("[CierreJornada] error al consultar cierre de hoy:", e);
                  setTodayCierreJornada(null);
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
                                        className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-xl border p-3 shadow-xl text-center"
                                        style={{ backgroundColor: "#0A0A0A", borderColor: `${GOLD}60` }}
                                      >
                                        <p className="text-[10px] font-black mb-1" style={{ color: GOLD }}>Operativo — unidades y ritmo</p>
                                        <p className="text-[9px] text-slate-400 mb-2 leading-relaxed">
                                          Para producción repetitiva. Un día mal contabilizado al mes cuesta más que la suscripción.
                                        </p>
                                        <button
                                          onClick={() => { setShowDesglosadorCTA(false); navigate("/pagos?plan=operativo"); }}
                                          className="w-full py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-black transition-all"
                                          style={{ background: GOLD }}
                                          data-testid="button-desglosador-unlock-cta"
                                        >
                                          Ver módulo Operativo →
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
                                Duración del desglose en vivo: fortalece tu resistencia atencional. Profundidad: {formatDepthAwardPreview()} PS por cada hora completa en el desglosador (curva suave).
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
                                  <div key={sv.tempId} className="space-y-1">
                                  <div className="flex items-center gap-1.5">
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
                                  {sv.tiempoRecordMinPerUnit && sv.tiempoRecordMinPerUnit > 0 && sv.cantidadObjetivo && parseFloat(sv.cantidadObjetivo) > 0 && (
                                    <motion.div className="w-full pl-8 pr-1 pb-1">
                                      <label className="flex items-start gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!sv.rutaEnfoqueActiva}
                                          onChange={e => setDesglosadorSubs(prev => prev.map(s =>
                                            s.tempId === sv.tempId ? { ...s, rutaEnfoqueActiva: e.target.checked } : s
                                          ))}
                                          className="mt-0.5 accent-violet-500"
                                          data-testid={`checkbox-ruta-enfoque-${idx}`}
                                        />
                                        <span className="text-[8px] leading-snug" style={{ color: "rgba(255,255,255,0.82)" }}>
                                          <span className="font-bold text-violet-300">Ruta de enfoque (3 bandas)</span>
                                          <span className="block font-mono text-[8px] mt-0.5 font-bold" style={{ color: "rgba(255,255,255,0.68)" }}>{formatRutaPreview(parseFloat(sv.cantidadObjetivo))}</span>
                                        </span>
                                      </label>
                                    </motion.div>
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
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-2.5">Con qué energía entras</p>
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
                              <span className="text-base font-black leading-none tabular-nums">{opt.badge}</span>
                              <span className="text-[8px] font-black uppercase tracking-wider mt-1">{opt.label}</span>
                              <span className="text-[7px] opacity-60 mt-0.5">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                        {!intensidadEnergetica && (
                          <p className="text-[7px] text-slate-600 text-center mt-1.5">Opcional · Alimenta el Espejo</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleFlotaSave()}
                        disabled={saving || !titulo.trim() || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "proyectivo" && !horaFinProyectiva) || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "produccion" && (!cantidadProduccion || !tiempoProduccion)) || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "investigador" && !cantidadInvestigador) || (tipoFlotaSeleccionado === "tiempo" && relojTiempo === "desglosador" && !desglosadorSubs.some(s => s.titulo.trim())) || (tipoFlotaSeleccionado === "descanso" && !tipoDescanso)}
                        className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50"
                        style={{ backgroundColor: cfg.color, color: tipoFlotaSeleccionado === "verdad" ? "#fff" : "#000", boxShadow: `0 0 20px ${cfg.color}40` }}
                        data-testid="button-launch-flota"
                      >
                        {saving ? "Lanzando…" : "Lanzar Vehículo"}
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
        ) : isCreating ? (
          <div className="p-4 rounded-xl border text-center space-y-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <p className="text-xs text-slate-400">Formulario de lanzamiento incompleto.</p>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setVehicleMode("selector"); setTipoFlotaSeleccionado(null); }}
              className="w-full py-2.5 rounded-lg text-xs font-bold"
              style={{ backgroundColor: `${PLATA}20`, color: PLATA }}
            >
              Volver a La Flota
            </button>
          </div>
        ) : null)}

        {cierreEnergiaPending && (() => {
          const showRuta = cierrePayloadHasRutaEnfoque(cierreEnergiaPending);
          const mergedCruzada = cierreEnergiaPending.kind === "desglosador"
            ? mergeRutaCruzadaFromSubs(cierreEnergiaPending.subs)
            : null;
          const resetCierreModal = () => {
            setCierreEnergiaPending(null);
            setCierreEnergiaSeleccion(null);
            setCierreRutaSeleccion(new Set());
            setCierreRutaSinUso(false);
            setCierreRutaPatron(null);
          };
          const confirmCierreEnergia = () => {
            const p = cierreEnergiaPending;
            if (!p || !user) return;
            const sel = cierreEnergiaSeleccion ?? undefined;
            const rutaDecl = showRuta && !cierreRutaSinUso ? Array.from(cierreRutaSeleccion) : [];
            if (p.kind === "flota") void handleFlotaStatusChange(p.vehicleId, p.status, sel);
            else if (p.kind === "investigador") void handleInvestigadorClose(p.vehicleId, p.cumplido, p.cantidadRealizada, sel);
            else if (p.kind === "desglosador") void handleDesglosadorGlobalClose(p.vehicleId, p.subs, sel, rutaDecl);
            else void handleDescansoClose(p.vehicleId, p.status, p.etiqueta, p.nota, sel);
            resetCierreModal();
          };
          return (
          <motion.div
            className="fixed inset-0 z-[220] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cierre-energia-titulo"
            onClick={resetCierreModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              tabIndex={-1}
              autoFocus
              onClick={e => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmCierreEnergia();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  resetCierreModal();
                }
              }}
              className="w-full max-w-sm rounded-2xl border p-5 space-y-4 max-h-[90vh] overflow-y-auto outline-none"
              style={{ backgroundColor: PIZARRA, borderColor: "rgba(139,92,246,0.35)" }}
            >
              <div className="text-center space-y-1">
                <p id="cierre-energia-titulo" className="text-sm font-bold text-white">Cierre consciente</p>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Con qué energía terminas (opcional). Elige F fluido, C concentrado o L al límite. Alimenta tu Espejo.
                </p>
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
                    <span className="text-base font-black leading-none tabular-nums">{opt.badge}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{opt.label}</span>
                    <span className="text-[7px] opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {showRuta && (
                <div className="pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <RutaSeguimientoPicker
                    cruzadaReferencia={mergedCruzada}
                    seleccion={cierreRutaSeleccion}
                    sinUso={cierreRutaSinUso}
                    patronActivo={cierreRutaPatron}
                    onSeleccionChange={(bandas, patron) => {
                      setCierreRutaSeleccion(bandas);
                      setCierreRutaPatron(patron);
                    }}
                    onSinUsoChange={sin => {
                      setCierreRutaSinUso(sin);
                      if (sin) setCierreRutaPatron("sin_ruta");
                    }}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetCierreModal}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmCierreEnergia}
                  disabled={showRuta && !rutaSeguimientoPickerCanConfirm(cierreRutaSinUso, cierreRutaSeleccion)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40"
                  style={{ backgroundColor: VIOLET, color: "#fff" }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}

        {situacionDesgloseCelebration && (() => {
          const { titulo, summary } = situacionDesgloseCelebration;
          const ratioPct = summary.totalFilas > 0
            ? Math.round((summary.cumplidos / summary.totalFilas) * 100)
            : 0;
          return (
            <motion.div
              className="fixed inset-0 z-[225] flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="situacion-desglose-celebracion-titulo"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="w-full max-w-md rounded-2xl border p-5 space-y-4 relative overflow-hidden"
                style={{ backgroundColor: PIZARRA, borderColor: `${GOLD}55`, boxShadow: `0 0 40px ${GOLD}25, inset 0 0 60px ${GOLD}08` }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.45, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top, ${GOLD}18 0%, transparent 65%)` }}
                />
                <div className="relative text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${GOLD}20`, boxShadow: `0 0 20px ${GOLD}35` }}>
                      <Trophy size={22} style={{ color: GOLD }} />
                    </div>
                  </div>
                  <p id="situacion-desglose-celebracion-titulo" className="text-sm font-black uppercase tracking-wider" style={{ color: GOLD }}>
                    Certificado · {retoSituacionLabel(summary.retoNumero)}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed px-2">{summary.mensaje}</p>
                  <p className="text-[9px] font-bold text-slate-500 truncate px-4">{titulo}</p>
                </div>

                <div className="relative grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(0,200,81,0.08)", border: "1px solid rgba(0,200,81,0.25)" }}>
                    <p className="text-[7px] uppercase text-slate-500">Situaciones</p>
                    <p className="text-lg font-black" style={{ color: VERDE }}>{summary.cumplidos}</p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p className="text-[7px] uppercase text-slate-500">Falladas</p>
                    <p className="text-lg font-black" style={{ color: "#f87171" }}>{summary.fallados}</p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.2)" }}>
                    <p className="text-[7px] uppercase text-slate-500">Minutos</p>
                    <p className="text-lg font-black text-slate-300">{summary.minutosBloque}</p>
                  </div>
                </div>

                {(summary.minutosGanados > 0 || summary.minutosAdelanto > 0) && (
                  <div
                    className="relative rounded-xl p-3 space-y-2"
                    style={{ backgroundColor: "rgba(0,255,195,0.06)", border: `1px solid ${CYAN}35` }}
                  >
                    <p className="text-[8px] font-black uppercase tracking-wider text-center" style={{ color: CYAN }}>
                      Tiempo recuperado por eficiencia
                    </p>
                    <div className="flex justify-center items-baseline gap-2">
                      <span className="text-2xl font-black font-mono tabular-nums" style={{ color: VERDE }}>
                        +{summary.minutosGanados}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">min ganados</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 text-[8px] text-slate-500">
                      {summary.minutosEnCola > 0 && (
                        <span>En cola: {summary.minutosEnCola} min</span>
                      )}
                      {summary.minutosAdelanto > 0 && (
                        <span>Adelanto: {summary.minutosAdelanto} min</span>
                      )}
                      {summary.eficienciaPct != null && (
                        <span style={{ color: CYAN }}>Eficiencia {summary.eficienciaPct}%</span>
                      )}
                    </div>
                    {summary.minutosGanadosSesion > summary.minutosGanados && (
                      <p className="text-[7px] text-center text-slate-600">
                        Sesión acumulada: +{summary.minutosGanadosSesion} min en {summary.retoNumero} reto
                        {summary.retoNumero !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                {summary.totalFilas > 0 && (
                  <div className="relative">
                    <div className="flex justify-between text-[8px] text-slate-500 mb-1">
                      <span>Conquista del bloque</span>
                      <span style={{ color: ratioPct >= 70 ? EMERALD : GOLD }}>{ratioPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ratioPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${EMERALD}88, ${GOLD})` }}
                      />
                    </div>
                  </div>
                )}

                {summary.casaHechas > 0 && (
                  <div className="relative rounded-xl p-3 space-y-2" style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.22)" }}>
                    <div className="flex justify-between items-baseline">
                      <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: VERDE }}>
                        Casa — lo repetible que hiciste
                      </p>
                      <span className="text-base font-black font-mono tabular-nums" style={{ color: GOLD }}>
                        ×{summary.casaHechas}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {summary.casaPorTexto.slice(0, 6).map(g => (
                        <span
                          key={g.texto}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold"
                          style={{ backgroundColor: "rgba(34,197,94,0.1)", color: VERDE, border: "1px solid rgba(34,197,94,0.2)" }}
                        >
                          <span className="truncate max-w-[140px]">{g.texto}</span>
                          <span className="font-mono tabular-nums" style={{ color: GOLD }}>×{g.hechas}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[8px] text-slate-500 leading-snug">
                      Sin medir minutos — pero la cantidad cuenta. Mañana puedes superar este número.
                    </p>
                  </div>
                )}

                <div className="relative rounded-xl p-3 space-y-1.5" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD}25` }}>
                  <p className="text-[8px] font-black uppercase tracking-wider text-center mb-2" style={{ color: "rgba(212,175,55,0.7)" }}>
                    <Sparkles size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                    Energía ganada en este bloque
                  </p>
                  {summary.psFilas > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Filas cumplidas ({summary.cumplidos} × 4 PS)</span>
                      <span className="font-bold" style={{ color: EMERALD }}>+{summary.psFilas} PS</span>
                    </div>
                  )}
                  {summary.psProfundidad > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Profundidad de bloque</span>
                      <span className="font-bold" style={{ color: GOLD }}>+{summary.psProfundidad} PS</span>
                    </div>
                  )}
                  {summary.psDetalles > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Detalles entregados</span>
                      <span className="font-bold" style={{ color: CYAN }}>+{summary.psDetalles} PS</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 mt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <span className="text-[10px] font-black uppercase text-white">Total del esfuerzo</span>
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.15, 1] }}
                      transition={{ duration: 0.6 }}
                      className="text-base font-black"
                      style={{ color: GOLD, textShadow: `0 0 12px ${GOLD}50` }}
                    >
                      +{summary.psTotal} PS
                    </motion.span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSituacionDesgloseCelebration(null)}
                  className="relative w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{ backgroundColor: GOLD, color: "#000", boxShadow: `0 0 24px ${GOLD}40` }}
                  data-testid="situacion-desglose-absorber"
                >
                  Absorber victoria
                </button>
                <p className="relative text-[7px] text-center text-slate-600 leading-snug">
                  El desglose permanece en el vehículo con «Ver PS del bloque» si cierras antes de leer.
                </p>
              </motion.div>
            </motion.div>
          );
        })()}

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

        {showCierreJornada && (
          <CierreJornadaModal
            vehicles={vehicles}
            segmentos={planilla?.segmentos || []}
            todayPoints={dailyPS}
            existingCierre={todayCierreJornada}
            onClose={() => setShowCierreJornada(false)}
            onSeal={async (cierre) => {
              if (!user) {
                toast.error("Inicia sesión para sellar la jornada");
                return;
              }

              const fecha = getLimaDateString();
              const dayStartMs = getLimaDayStartMs();
              const journalStartMs = getJournalDayStartMs();
              const jornadaVehicles = vehicles.filter(v => {
                const ts = v.cierreAt || v.aperturaAt || v.createdAt?.getTime?.() || 0;
                return ts >= journalStartMs;
              });
              const balance = calcularBalanceConquistaJornada({
                segmentos: planilla?.segmentos || [],
                vehiculos: filterVehiclesForEntropy(vehicles),
                now: Date.now(),
                dayStartMs,
              });

              const fresh = getDailyPointsLocalSync(user.uid);
              const introPs = await safeWithFallback(getIntrospectionPsForDay(user.uid, fecha), 0, 3000);
              const events = await safeWithFallback(getFocusBandEventsRecent(user.uid, 1), [], 3000);
              const todayEvents = events.filter(e => e.fecha === fecha);

              const snapshot = buildDailySnapshot({
                fecha,
                segmentos: planilla?.segmentos || [],
                vehicles: jornadaVehicles,
                dayStartMs,
                logs: fresh.logs,
                introspeccionPs: introPs,
                events: todayEvents,
                conquistaMin: balance.conquistaMin,
                entropiaMin: balance.entropiaMin,
                vacioMin: balance.vacioMin,
              });

              const { localSaved: snapshotSaved } = await savePlanillaDailySnapshot(user.uid, snapshot);

              const sealed: CierreJornadaLog = {
                ...cierre,
                totalPS: fresh.total,
                fecha,
                psPanoramico: snapshot.psDesglose.panoramico,
                psEspectro: snapshot.psDesglose.espectro,
                psVehiculos: snapshot.psDesglose.vehiculos,
                psIntrospeccion: snapshot.psDesglose.introspeccion,
                profundidadMaxima: snapshot.profundidadMaxima,
                bloquesCompletados: snapshot.bloquesCompletados,
                descansosCuerpo: snapshot.espectroBloques.descansosCuerpo,
              };

              const { localSaved: cierreSaved } = await saveCierreJornada(user.uid, sealed);

              if (!snapshotSaved && !cierreSaved) {
                toast.error("No se pudo sellar la jornada", {
                  description: "Libera espacio en el navegador o cierra pestañas y vuelve a intentar.",
                  style: { backgroundColor: PIZARRA, border: `1px solid ${BLOOD}`, color: BLOOD },
                });
                return;
              }

              setTodayCierreJornada(sealed);
              setShowCierreJornada(false);

              toast.success("Jornada Sellada", {
                description: `${(sealed as any).porcentajeDiaIdeal || sealed.porcentajeSoberania}% Día Ideal · ${snapshot.decisionesDelDia ?? snapshot.subsDesglosadorCumplidos ?? 0} decisiones · ${snapshot.bloquesCompletados} bloque${snapshot.bloquesCompletados !== 1 ? "s" : ""} · ${sealed.totalPS} PS refuerzo${!snapshotSaved || !cierreSaved ? " · guardado parcial en dispositivo" : ""}`,
                style: { backgroundColor: PIZARRA, border: `2px solid ${GOLD}`, color: GOLD },
              });

              if (!snapshotSaved || !cierreSaved) {
                toast.info("Sincronización en la nube pendiente", {
                  description: "El sello quedó en tu dispositivo. La nube se actualizará cuando haya conexión estable.",
                  style: { backgroundColor: PIZARRA, border: `1px solid ${PLATA}`, color: PLATA },
                  duration: 4000,
                });
              }

              void (async () => {
                try {
                  const sealPel = await safeWithFallback(
                    sealPeldanosFromSegmentos(user.uid, {
                      fecha,
                      segmentos: planilla?.segmentos ?? [],
                      vehicles: jornadaVehicles,
                      dayStartMs,
                      events: todayEvents,
                    }),
                    { sealed: 0, peldanoIds: [] },
                    8000
                  );
                  if (sealPel.sealed > 0) {
                    toast.success(`${sealPel.sealed} peldaño(s) en Proyectos`, {
                      description: "Segmentos cerrados sellados en tu escalera.",
                      style: { backgroundColor: PIZARRA, border: `1px solid ${CYAN}`, color: CYAN },
                    });
                  }
                } catch (e) {
                  console.error("[CierreJornada] peldaños en segundo plano:", e);
                }
              })();
            }}
            userId={user?.uid || ""}
          />
        )}

        <ReservasTacticasDock
          items={reservaActivas}
          onQuickAdd={(texto, ruta) => handleReservaTacticaQuickAdd(texto, ruta)}
          onToCronometro={(id) => void handleReservaACronometro(id)}
          onToListaLibre={(id) => void handleReservaAListaLibre(id)}
          onDelete={(id) => void handleReservaEliminar(id)}
          onRutaChange={(id, ruta) => void handleReservaRutaChange(id, ruta)}
          colors={{ plata: PLATA, cyan: CYAN, gold: GOLD }}
        />
      </div>
    </div>
  );
}

function AccordionSection({ title, subtitle, icon: Icon, color, count, children, defaultOpen = true }: {
  title: string; subtitle?: string; icon: any; color: string; count: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
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

const EXPRESS_PS: Record<string, { cumple: number; arch: number }> = {
  hora: { cumple: VEHICLE_CUMPLIDO_BASE_PS, arch: VEHICLE_ARCHIVADO_BASE_PS },
  situacion: { cumple: 5, arch: 2 },
  omitido: { cumple: 1, arch: 0 },
};

function calculateVehicleScore(vehicle: Vehicle): {
  difficulty: "facil" | "media" | "dificil";
  potentialCPCumplido: number;
  potentialCPArchivado: number;
  scorePercent: number;
  retoCount: number;
  blandoCount: number;
} {
  if (vehicle.tipoReloj === "desglosador") {
    const subs = vehicle.subVehiculos ?? [];
    const depth = vehicle.desglosadorBloqueDepthPsGranted ?? 0;
    return {
      difficulty: "facil",
      potentialCPCumplido: estimateDesglosadorSessionPs(subs, depth),
      potentialCPArchivado: 0,
      scorePercent: 50,
      retoCount: 0,
      blandoCount: 0,
    };
  }
  if (vehicle.tipoFlota === "situacion") {
    return { difficulty: "facil", potentialCPCumplido: 5, potentialCPArchivado: 0, scorePercent: 50, retoCount: 0, blandoCount: 0 };
  }
  if (vehicle.tipoTerminoRapido) {
    const ps = EXPRESS_PS[vehicle.tipoTerminoRapido] ?? {
      cumple: VEHICLE_CUMPLIDO_BASE_PS,
      arch: VEHICLE_ARCHIVADO_BASE_PS,
    };
    return { difficulty: "facil", potentialCPCumplido: ps.cumple, potentialCPArchivado: ps.arch, scorePercent: 50, retoCount: 0, blandoCount: 0 };
  }
  if (vehicle.tipoFlota === "tiempo") {
    return {
      difficulty: "media",
      potentialCPCumplido: VEHICLE_CUMPLIDO_BASE_PS,
      potentialCPArchivado: VEHICLE_ARCHIVADO_BASE_PS,
      scorePercent: 50,
      retoCount: 0,
      blandoCount: 0,
    };
  }
  if (vehicle.tipoFlota === "descanso") {
    return { difficulty: "facil", potentialCPCumplido: 10, potentialCPArchivado: 5, scorePercent: 50, retoCount: 0, blandoCount: 0 };
  }
  return { difficulty: "facil", potentialCPCumplido: 10, potentialCPArchivado: 5, scorePercent: 50, retoCount: 0, blandoCount: 0 };
}

function VehicleCard({
  vehicle, expanded, onToggle, onComplete, onArchive, minimal = false,
  segmentoNumero,
  planilla,
  onAddSubTarea, onToggleSubTarea, onSetSubTareaMinutosCupo, onExtendSituacionCupo, onSyncSituacionCupoAnchor, onAddDetalle, onEntregarDetalle, onAddCasaItem, onToggleCasaItem, arquitectoUnlocked,
  onMoveSubTareasToCronometro, onSituacionCronometroSetHoraFin, onSituacionCronometroCumplido, onSituacionCronometroFallado, onSituacionCronometroReservar, onQuitarSituacionCupo, onCerrarSituacionDesgloseBloque, situacionBloquePsTotal, onVerSituacionBloquePs,
  onInvestigadorClose, onDesglosadorUpdate, onDesglosadorGlobalClose, onDesglosadorDepthTick, onDesglosadorPausaInterrupcion, onResumeDesglosador, onDesglosadorReorderSubs,
  onReorderSubTareasCronometro,
  onDescansoClose, onMicroPasoToggle, onEtapaPuntoCeroToggle, onOpenCierreEnergia,
  onRutaBandCross, onBloqueCierre
}: {
  vehicle: Vehicle; expanded: boolean; onToggle: () => void; onComplete?: () => void; onArchive?: () => void;
  minimal?: boolean; segmentoNumero?: number | null;
  planilla?: Planilla | null;
  onAddSubTarea?: (vehicleId: string, texto: string) => void;
  onToggleSubTarea?: (vehicleId: string, subTareaId: string) => void;
  onSetSubTareaMinutosCupo?: (vehicleId: string, subTareaId: string, minutos: number | undefined) => void;
  onExtendSituacionCupo?: (vehicleId: string, subTareaId: string, delta: number) => void;
  onSyncSituacionCupoAnchor?: (vehicleId: string) => void;
  onMoveSubTareasToCronometro?: (vehicleId: string, subTareaIds: string[]) => void;
  onSituacionCronometroSetHoraFin?: (vehicleId: string, hhmm: string) => void;
  onSituacionCronometroCumplido?: (vehicleId: string, subTareaId: string) => void;
  onSituacionCronometroFallado?: (vehicleId: string, subTareaId: string) => void;
  onSituacionCronometroReservar?: (vehicleId: string, subTareaId: string) => void;
  onQuitarSituacionCupo?: (vehicleId: string, subTareaId: string, minutos: number) => void;
  onCerrarSituacionDesgloseBloque?: (vehicleId: string) => void;
  situacionBloquePsTotal?: number;
  onVerSituacionBloquePs?: () => void;
  onAddDetalle?: (vehicleId: string, subTareaId: string, texto: string) => void;
  onEntregarDetalle?: (vehicleId: string, subTareaId: string, detalleId: string) => void;
  onAddCasaItem?: (vehicleId: string, subTareaId: string, texto: string) => void;
  onToggleCasaItem?: (vehicleId: string, subTareaId: string, detalleId: string) => void;
  arquitectoUnlocked?: boolean;
  onInvestigadorClose?: (vehicleId: string, cumplido: boolean, cantidadRealizada: number, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => void;
  onDesglosadorUpdate?: (vehicleId: string, updatedSubs: SubVehiculo[], opts?: { resetDepth?: boolean }) => void;
  onDesglosadorGlobalClose?: (vehicleId: string, subs: SubVehiculo[], intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite", rutaDeclarada?: RutaBandaId[]) => void;
  onDesglosadorDepthTick?: (vehicleId: string) => void;
  onDesglosadorPausaInterrupcion?: (vehicleId: string, tituloInterrupcion: string) => void | Promise<void>;
  onResumeDesglosador?: (vehicleId: string) => void;
  onDesglosadorReorderSubs?: (vehicleId: string, movedId: string, direction: ReorderDirection) => void;
  onReorderSubTareasCronometro?: (vehicleId: string, movedId: string, direction: ReorderDirection) => void;
  onDescansoClose?: (vehicleId: string, status: "cumplido" | "archivado", etiqueta: "recuperado" | "parcial" | "fragmentado", nota: string, intensidadEnergeticaFin?: "fluido" | "concentrado" | "limite") => void;
  onMicroPasoToggle?: (vehicleId: string, paso: "hidratacion" | "respiracion" | "pantallaZero") => void;
  onEtapaPuntoCeroToggle?: (vehicleId: string, etapa: "etapa1" | "etapa2" | "etapa3" | "etapa4") => void;
  onOpenCierreEnergia?: (payload: CierreEnergiaModalPayload) => void;
  onRutaBandCross?: (payload: { vehicleId: string; subId: string; subTitulo: string; banda: RutaBandaId }) => void;
  onBloqueCierre?: (payload: { vehicleId: string; sub: SubVehiculo; status: string }) => void;
}) {
  const [timerDisplay, setTimerDisplay] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const [debtDisplay, setDebtDisplay] = useState("");
  const [targetTimeLabel, setTargetTimeLabel] = useState("");
  const [coloresConfirmados, setColoresConfirmados] = useState<boolean[]>(Array(7).fill(false));
  const [colorInmersion, setColorInmersion] = useState<{ color: string; zona: string; idx: number } | null>(null);
  const [inmersionCount, setInmersionCount] = useState(3);
  const [showDescansoReloj, setShowDescansoReloj] = useState(false);
  const [newSubTarea, setNewSubTarea] = useState("");
  const [cantidadRealizada, setCantidadRealizada] = useState("");
  const [remainingUnits, setRemainingUnits] = useState<number | null>(null);
  const [subVehicleRestante, setSubVehicleRestante] = useState<number | null>(null);
  const [subTimerDisplay, setSubTimerDisplay] = useState("");
  const [subTimerIsCountdown, setSubTimerIsCountdown] = useState(false);
  const [subTimerExpired, setSubTimerExpired] = useState(false);
  const [desglosadorSummary, setDesglosadorSummary] = useState(false);
  const subtasksExpandedStorageKey = `sistemicar_subtasks_expanded_${vehicle.id}`;
  const [subTasksCollapsed, setSubTasksCollapsed] = useState(() => {
    if (vehicle.tipoFlota === "situacion" && vehicle.situacionCronometro?.activo === true) return false;
    try {
      return sessionStorage.getItem(subtasksExpandedStorageKey) === "0";
    } catch {
      return false;
    }
  });
  const [expandedDetalleStId, setExpandedDetalleStId] = useState<string | null>(null);
  const [expandedCasaStId, setExpandedCasaStId] = useState<string | null>(null);
  const [situacionLibreSeleccion, setSituacionLibreSeleccion] = useState<Set<string>>(() => new Set());
  const [newDetalleTexts, setNewDetalleTexts] = useState<Record<string, string>>({});
  const [newCasaTexts, setNewCasaTexts] = useState<Record<string, string>>({});
  const [quitarMinDraft, setQuitarMinDraft] = useState<Record<string, string>>({});
  const [showEtiquetaSalida, setShowEtiquetaSalida] = useState(false);
  const [etiquetaSalidaLocal, setEtiquetaSalidaLocal] = useState<"recuperado" | "parcial" | "fragmentado" | null>(null);
  const [notaSalidaLocal, setNotaSalidaLocal] = useState("");
  const [pendingDescansoStatus, setPendingDescansoStatus] = useState<"cumplido" | "archivado" | null>(null);
  const [showMicroPasos, setShowMicroPasos] = useState(false);
  const [horaFinProyectada, setHoraFinProyectada] = useState<string | null>(null);
  const [horaFinRemainSec, setHoraFinRemainSec] = useState<number | null>(null);
  const [horaFinDeltaSec, setHoraFinDeltaSec] = useState<number>(0);
  const [liveAccumDeltaSec, setLiveAccumDeltaSec] = useState<number>(0);
  type UltimoCierreSub = {
    subId: string;
    titulo: string;
    status: "cumplido" | "fallado";
    verdict: SubCloseVerdict;
    deltaSec: number;
    conquistaFluidezAbsoluta?: boolean;
  };
  const [ultimoCierreSub, setUltimoCierreSub] = useState<UltimoCierreSub | null>(null);
  const [futuroSubLabel, setFuturoSubLabel] = useState<string>("—");
  const [futuroCicloLabel, setFuturoCicloLabel] = useState<string>("—");

  const prevRemainingRef = useRef<number | null>(null);
  const prevSubRestanteRef = useRef<number | null>(null);
  const rutaUmbralAlertKeysRef = useRef<Set<string>>(new Set());
  const activeSubIdForRutaRef = useRef<string | null>(null);
  const prevSubRestanteRutaRef = useRef<number | null>(null);
  const chimeCtxRef = useRef<AudioContext | null>(null);
  const alarmCtxRef = useRef<AudioContext | null>(null);
  const prevTimerExpiredRef = useRef<boolean>(false);
  const situacionCupoFireKeyRef = useRef<string | null>(null);
  const situacion2MinWarnKeyRef = useRef<string | null>(null);
  const situacionFilaVoiceKeysRef = useRef<Set<string>>(new Set());
  const situacionCupoEscalationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subVehiculosRef = useRef(vehicle.subVehiculos);
  subVehiculosRef.current = vehicle.subVehiculos;
  const subTareasRef = useRef(vehicle.subTareas);
  subTareasRef.current = vehicle.subTareas;
  const situacionAnchorRef = useRef(vehicle.situacionCupoAnchor);
  situacionAnchorRef.current = vehicle.situacionCupoAnchor;
  const [situacionCupoUiTick, setSituacionCupoUiTick] = useState(0);
  const subStartVoiceRef = useRef<Set<string>>(new Set());
  const [subRutaModal, setSubRutaModal] = useState<null | {
    subId: string;
    status: "cumplido" | "fallado";
    cantidadRealizada: number;
    duracionCompletado?: number;
  }>(null);
  const [subRutaSel, setSubRutaSel] = useState<Set<RutaBandaId>>(new Set());
  const [subRutaSinUso, setSubRutaSinUso] = useState(false);
  const [subRutaPatron, setSubRutaPatron] = useState<RutaSeguimientoPatron | null>(null);

  const openSubRutaModal = (payload: NonNullable<typeof subRutaModal>) => {
    setSubRutaSel(new Set());
    setSubRutaSinUso(false);
    setSubRutaPatron(null);
    setSubRutaModal(payload);
  };

  const [showPausaForm, setShowPausaForm] = useState(false);
  const [pausaTitulo, setPausaTitulo] = useState("");
  const [pausaEnviando, setPausaEnviando] = useState(false);
  const [desglosadorReorderMode, setDesglosadorReorderMode] = useState(false);
  const [desglosadorUiTick, setDesglosadorUiTick] = useState(0);

  const playChime = useCallback(() => {
    if (!isTikSoundEnabled()) return;
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
    if (!isTikSoundEnabled()) return;
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
    if (!isTikSoundEnabled()) return;
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
    if (vehicle.tipoFlota === "situacion" && vehicle.situacionCronometro?.activo === true) {
      setSubTasksCollapsed(false);
    }
  }, [vehicle.id, vehicle.tipoFlota, vehicle.situacionCronometro?.activo]);

  useEffect(() => {
    if (vehicle.tipoFlota !== "situacion") return;
    try {
      sessionStorage.setItem(subtasksExpandedStorageKey, subTasksCollapsed ? "0" : "1");
    } catch { /* ignore */ }
  }, [subTasksCollapsed, subtasksExpandedStorageKey, vehicle.tipoFlota]);

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
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo" || !onDesglosadorDepthTick) return;
    onDesglosadorDepthTick(vehicle.id);
    const id = window.setInterval(() => onDesglosadorDepthTick(vehicle.id), 60_000);
    return () => clearInterval(id);
  }, [vehicle.id, vehicle.tipoReloj, vehicle.status, vehicle.aperturaAt, onDesglosadorDepthTick]);

  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo") return;
    const id = window.setInterval(() => setDesglosadorUiTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [vehicle.id, vehicle.tipoReloj, vehicle.status, vehicle.aperturaAt]);

  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo" || !onDesglosadorUpdate) return;
    const subs = subVehiculosRef.current ?? [];
    const hasActive = subs.some(s => s.status === "activo");
    const pendingIdx = subs.findIndex(s => s.status === "pendiente");
    const allSubsClosed = subs.length > 0 && subs.every(s => s.status === "cumplido" || s.status === "fallado");
    if (!hasActive && pendingIdx !== -1 && !allSubsClosed) {
      const now = Date.now();
      const repaired = subs.map((s, i) =>
        i === pendingIdx ? { ...s, status: "activo" as const, aperturaAt: now } : s
      );
      activeSubIdForRutaRef.current = null;
      prevSubRestanteRutaRef.current = null;
      onDesglosadorUpdate(vehicle.id, repaired);
    }
  }, [vehicle.subVehiculos, vehicle.status, vehicle.tipoReloj, vehicle.id, onDesglosadorUpdate]);

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

    const isSubStillPending = () => {
      const a = situacionAnchorRef.current;
      if (!a?.subTareaId) return false;
      const cur = (subTareasRef.current || []).find(s => s.id === a.subTareaId);
      if (!cur || !(cur.minutosCupo && cur.minutosCupo > 0)) return false;
      if (cur.enDesgloseCronometro && (cur.resultadoSituacion ?? "pendiente") !== "pendiente") return false;
      if (!cur.enDesgloseCronometro && cur.completada) return false;
      return true;
    };

    const clearEscalation = () => {
      if (situacionCupoEscalationRef.current) {
        clearInterval(situacionCupoEscalationRef.current);
        situacionCupoEscalationRef.current = null;
      }
    };

    const run = () => {
      if (!isSubStillPending()) {
        clearEscalation();
        return;
      }
      const elapsed = Date.now() - anchor.startedAt;
      if (elapsed < limitMs) return;
      if (situacionCupoFireKeyRef.current === fireKey) return;
      situacionCupoFireKeyRef.current = fireKey;
      fireSituacionCupoAlert({
        vehicleId: vehicle.id,
        vehicleTitulo: vehicle.titulo,
        subTexto: sub.texto,
        tagKey: fireKey,
      });
      clearEscalation();
      let escalationCount = 0;
      situacionCupoEscalationRef.current = window.setInterval(() => {
        if (!isSubStillPending()) {
          clearEscalation();
          return;
        }
        escalationCount += 1;
        if (escalationCount > SITUACION_CUPO_ESCALATION_MAX) {
          clearEscalation();
          return;
        }
        const cur = (subTareasRef.current || []).find(s => s.id === anchor.subTareaId);
        if (!cur) return;
        fireSituacionCupoAlert({
          vehicleId: vehicle.id,
          vehicleTitulo: vehicle.titulo,
          subTexto: cur.texto,
          tagKey: fireKey,
          escalation: true,
        });
      }, SITUACION_CUPO_ESCALATION_MS);
    };
    run();
    const intervalId = window.setInterval(run, 2000);
    return () => {
      clearInterval(intervalId);
      clearEscalation();
    };
  }, [vehicle.tipoFlota, vehicle.status, vehicle.situacionCupoAnchor, vehicle.subTareas, vehicle.titulo, vehicle.id]);

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
    fireSituacion2MinAlert({
      vehicleId: vehicle.id,
      vehicleTitulo: vehicle.titulo,
      subTexto: sub.texto,
      tagKey: warnKey,
    });
  }, [vehicle.tipoFlota, vehicle.status, vehicle.situacionCupoAnchor, vehicle.subTareas, vehicle.titulo, vehicle.id, situacionCupoUiTick]);

  useEffect(() => {
    if (vehicle.tipoFlota !== "situacion" || vehicle.status !== "activo") return;
    if (vehicle.situacionCronometro?.activo !== true) return;
    const anchor = vehicle.situacionCupoAnchor;
    if (!anchor?.subTareaId) return;
    const sub = (vehicle.subTareas || []).find(s => s.id === anchor.subTareaId);
    if (!sub || !(sub.minutosCupo && sub.minutosCupo > 0)) return;
    if (sub.enDesgloseCronometro && (sub.resultadoSituacion ?? "pendiente") !== "pendiente") return;

    const voiceKey = `${anchor.subTareaId}-${anchor.startedAt}`;
    if (situacionFilaVoiceKeysRef.current.has(voiceKey)) return;
    situacionFilaVoiceKeysRef.current.add(voiceKey);
    situacion2MinWarnKeyRef.current = null;
    situacionCupoFireKeyRef.current = null;

    const isFirstFila =
      anchor.startedAt === vehicle.situacionCronometro?.bloqueInicioAt;
    speakSituacionFilaEnFoco(sub.texto, { intro: isFirstFila });
  }, [
    vehicle.tipoFlota,
    vehicle.status,
    vehicle.situacionCronometro?.activo,
    vehicle.situacionCronometro?.bloqueInicioAt,
    vehicle.situacionCupoAnchor,
    vehicle.subTareas,
  ]);

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

  const resetDesglosadorVoiceRefs = useCallback(() => {
    subStartVoiceRef.current.clear();
    rutaUmbralAlertKeysRef.current.clear();
    activeSubIdForRutaRef.current = null;
    prevSubRestanteRutaRef.current = null;
  }, []);

  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo" || subVehicleRestante === null) return;
    const subsNow = subVehiculosRef.current ?? [];
    const activeSub = subsNow.find(s => s.status === "activo");
    if (!activeSub?.rutaEnfoque?.activa || !onDesglosadorUpdate) {
      prevSubRestanteRutaRef.current = null;
      return;
    }

    if (activeSubIdForRutaRef.current !== activeSub.id) {
      activeSubIdForRutaRef.current = activeSub.id;
      rutaUmbralAlertKeysRef.current = new Set();
      prevSubRestanteRutaRef.current = null;
      const { ruta: repaired, changed } = repairRutaCruzadoAheadOfRestantes(
        activeSub.rutaEnfoque,
        subVehicleRestante
      );
      if (changed) {
        const updated = subsNow.map(s =>
          s.id === activeSub.id ? { ...s, rutaEnfoque: repaired } : s
        );
        onDesglosadorUpdate(vehicle.id, updated);
      }
      return;
    }

    const prev = prevSubRestanteRutaRef.current;
    if (prev === null) {
      prevSubRestanteRutaRef.current = subVehicleRestante;
      return;
    }
    if (subVehicleRestante > prev) {
      prevSubRestanteRutaRef.current = subVehicleRestante;
      return;
    }

    prevSubRestanteRutaRef.current = subVehicleRestante;
    const { ruta: nextRuta, alerts } = applyRutaThresholdCrossing(
      activeSub.rutaEnfoque,
      subVehicleRestante,
      prev
    );
    for (const alert of alerts) {
      const key = `${activeSub.id}-${alert}`;
      if (rutaUmbralAlertKeysRef.current.has(key)) continue;
      rutaUmbralAlertKeysRef.current.add(key);
      onRutaBandCross?.({
        vehicleId: vehicle.id,
        subId: activeSub.id,
        subTitulo: activeSub.titulo,
        banda: alert,
      });
      if (isSituacionAlertsEnabled()) {
        void playSituacionChimes(alert === "concentrado" ? 1 : 2);
      } else {
        playChime();
      }
      speakUbicacionQueue(rutaVozPartsForBanda(alert), false, "desglosador");
    }
    const cruzadoChanged =
      nextRuta.cruzado.concentrado !== activeSub.rutaEnfoque.cruzado.concentrado ||
      nextRuta.cruzado.limite !== activeSub.rutaEnfoque.cruzado.limite;
    if (cruzadoChanged) {
      const updated = (subVehiculosRef.current ?? []).map(s =>
        s.id === activeSub.id ? { ...s, rutaEnfoque: nextRuta } : s
      );
      onDesglosadorUpdate(vehicle.id, updated);
    }
  }, [subVehicleRestante, vehicle.tipoReloj, vehicle.status, vehicle.subVehiculos, vehicle.id, onDesglosadorUpdate, playChime, onRutaBandCross]);

  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo") return;
    const activeSub = (vehicle.subVehiculos || []).find(s => s.status === "activo");
    if (!activeSub?.rutaEnfoque?.activa || !activeSub.aperturaAt) return;
    const key = `${activeSub.id}-${activeSub.aperturaAt}`;
    if (subStartVoiceRef.current.has(key)) return;
    subStartVoiceRef.current.add(key);
    speakUbicacionQueue(
      rutaVozFluidoParts(cleanSubTitulo(activeSub.titulo)),
      true,
      "desglosador"
    );
  }, [vehicle.subVehiculos, vehicle.status, vehicle.tipoReloj]);

  const finalizeSubClose = (
    activeSubId: string,
    status: "cumplido" | "fallado",
    cantidad: number,
    duracionCompletado: number | undefined,
    rutaDeclarada?: RutaBandaId[]
  ) => {
    if (!onDesglosadorUpdate) return;
    const now = Date.now();
    const allSubs = [...(vehicle.subVehiculos || [])];
    const idx = allSubs.findIndex(s => s.id === activeSubId);
    if (idx === -1) return;
    const baseSub: SubVehiculo = {
      ...allSubs[idx],
      status,
      cierreAt: now,
      duracionFinal: duracionCompletado,
      ...(status === "cumplido" && allSubs[idx].cantidadObjetivo
        ? { cantidadLograda: cantidad }
        : {}),
    };
    allSubs[idx] =
      baseSub.rutaEnfoque?.activa
        ? enrichSubRutaCierre(baseSub, rutaDeclarada ?? [])
        : baseSub;
    onBloqueCierre?.({ vehicleId: vehicle.id, sub: allSubs[idx], status });
    const closed = allSubs[idx];
    const veredicto = computeSubCloseVerdict(closed);
    setUltimoCierreSub({
      subId: closed.id,
      titulo: cleanSubTitulo(closed.titulo),
      status: status,
      verdict: veredicto.verdict,
      deltaSec: veredicto.deltaSec,
      conquistaFluidezAbsoluta: closed.conquistaFluidezAbsoluta,
    });
    const nextPending = allSubs.findIndex((s, i) => i > idx && s.status === "pendiente");
    if (nextPending !== -1) {
      allSubs[nextPending] = { ...allSubs[nextPending], status: "activo", aperturaAt: now };
      activeSubIdForRutaRef.current = null;
      prevSubRestanteRutaRef.current = null;
      rutaUmbralAlertKeysRef.current.clear();
    }
    onDesglosadorUpdate(vehicle.id, allSubs);
    const allDone = allSubs.every(s => s.status === "cumplido" || s.status === "fallado");
    if (allDone) setDesglosadorSummary(true);
    setCantidadRealizada("");
    setSubRutaModal(null);
    setSubRutaSel(new Set());
    setSubRutaSinUso(false);
    setSubRutaPatron(null);
  };

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
    if (vehicle.status === "activo") return;
    setShowEtiquetaSalida(false);
    setEtiquetaSalidaLocal(null);
    setNotaSalidaLocal("");
    setPendingDescansoStatus(null);
  }, [vehicle.status, vehicle.id]);

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

    if (tipoFlota === "situacion") {
      const tMs = situacionTargetMsReloj(vehicle, Date.now());
      if (tMs != null) {
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

    if (!expanded && !(tipoFlota === "situacion" && situacionRelojDebeMostrarse(vehicle))) {
      return () => document.removeEventListener("visibilitychange", onFocus);
    }

    const interval = setInterval(computeTimer, 1000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [expanded, vehicle.status, vehicle.tipoTerminoRapido, vehicle.criterioDetalle, vehicle.tiempoInicio, tipoFlota, vehicle.aperturaAt, vehicle.parentesisRecarga, vehicle.tipoReloj, vehicle.cantidadObjetivo, vehicle.titulo, vehicle.situacionCronometro, vehicle.situacionCupoAnchor, vehicle.subTareas]);

  // Timer for active sub-vehicle in desglosador mode — fuente única: computeDesglosadorClocks
  useEffect(() => {
    if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo") return;
    const activeSub = (vehicle.subVehiculos || []).find(s => s.status === "activo");
    if (!activeSub?.aperturaAt) return;

    const objSecs = suggestedSec(activeSub);
    setSubTimerIsCountdown(objSecs !== null);
    if (activeSub.cantidadObjetivo && activeSub.tiempoRecordMinPerUnit) {
      setSubVehicleRestante(activeSub.cantidadObjetivo);
    } else {
      setSubVehicleRestante(null);
    }

    const update = () => {
      const now = Date.now();
      const clocks = computeDesglosadorClocks(now, vehicle);

      if (objSecs !== null && clocks.subRemainingSec !== null) {
        setSubTimerExpired(clocks.subRemainingSec <= 0);
        setSubTimerDisplay(formatMMSS(clocks.subRemainingSec));
      } else {
        setSubTimerExpired(false);
        setSubTimerDisplay(formatElapsedHHMMSS(clocks.subElapsedSec));
      }

      if (clocks.unitsRemaining !== null) {
        setSubVehicleRestante(clocks.unitsRemaining);
      }

      if (clocks.subEndAt != null) {
        setFuturoSubLabel(formatHHMM(clocks.subEndAt));
      } else {
        setFuturoSubLabel("—");
      }

      if (clocks.hasProjection && clocks.cycleEndAt != null && clocks.cycleRemainSec != null) {
        const horaFin = formatHHMM(clocks.cycleEndAt);
        setHoraFinProyectada(horaFin);
        setFuturoCicloLabel(horaFin);
        setHoraFinRemainSec(clocks.cycleRemainSec);
        setHoraFinDeltaSec(clocks.liveAccumDeltaSec);
        setLiveAccumDeltaSec(clocks.liveAccumDeltaSec);
      } else {
        setHoraFinProyectada(null);
        setFuturoCicloLabel("—");
        setHoraFinRemainSec(null);
        setHoraFinDeltaSec(0);
        setLiveAccumDeltaSec(0);
      }
    };

    update();
    const iv = setInterval(update, 1000);
    return () => {
      clearInterval(iv);
      setHoraFinProyectada(null);
      setFuturoSubLabel("—");
      setFuturoCicloLabel("—");
    };
  }, [
    vehicle.tipoReloj,
    vehicle.status,
    vehicle.subVehiculos,
    vehicle.interrupcionActiva,
    vehicle.desglosadorPausa,
  ]);

  const statusColors = { activo: GOLD, cumplido: EMERALD, archivado: "#6b7280" };
  const { difficulty, potentialCPCumplido, potentialCPArchivado, scorePercent } = calculateVehicleScore(vehicle);
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
  const showSituacionCasaUi = isSituacionFlota && vehicle.status === "activo";
  const situacionTotalDetalles = (vehicle.subTareas || []).reduce(
    (n, st) => n + (st.detalles?.filter(d => !d.casa).length ?? 0),
    0
  );
  const situacionTotalCasa = (vehicle.subTareas || []).reduce(
    (n, st) => n + (st.detalles?.filter(d => d.casa).length ?? 0),
    0
  );
  const situacionHechasCasa = (vehicle.subTareas || []).reduce(
    (n, st) => n + (st.detalles?.filter(d => d.casa && d.entregado).length ?? 0),
    0
  );
  const situacionCronActivo = vehicle.situacionCronometro?.activo === true;
  const situacionCanViewDetalles = isSituacionFlota && vehicle.status === "activo" && (situacionCronActivo || situacionTotalDetalles > 0);
  const showSituacionDetallesUi = !!(arquitectoUnlocked || situacionCanViewDetalles);
  const canAddSituacionDetalles = !!(arquitectoUnlocked || (situacionCanViewDetalles && situacionCronActivo));
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
    <motion.div layout className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#0a0a0a", borderColor: `${statusColors[vehicle.status]}30` }}>

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
                {vehicle.intensidadEnergetica && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)" }}>
                    {vehicle.intensidadEnergetica === "fluido" ? "~ FLUIDO" : vehicle.intensidadEnergetica === "concentrado" ? "● CONCENTRADO" : "▲ AL LÍMITE"}
                  </span>
                )}
                {vehicle.intensidadEnergeticaFin && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.35)" }} title="Energía al cerrar">
                    FIN · {vehicle.intensidadEnergeticaFin === "fluido" ? "~" : vehicle.intensidadEnergeticaFin === "concentrado" ? "●" : "▲"}
                  </span>
                )}
                {vehicle.tipoReloj === "investigador" && vehicle.status === "activo" && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(30,144,255,0.15)", color: "#60a5fa", border: "1px solid rgba(30,144,255,0.3)" }}>⚗ INVESTIGADOR</span>
                )}
                {vehicle.vehiculoPadreDesglosadorId && vehicle.status === "activo" && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(0,255,195,0.12)", color: CYAN, border: "1px solid rgba(0,255,195,0.35)" }}>INTERRUPCIÓN</span>
                )}
                {vehicle.interrupcionActiva && vehicle.tipoReloj === "desglosador" && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: VIOLET, border: "1px solid rgba(139,92,246,0.35)" }}>EN PAUSA</span>
                )}
                {vehicle.tipoReloj === "desglosador" && vehicle.status === "activo" && (
                  <DesglosadorDuracionPanel
                    elapsedSec={getDesglosadorSessionElapsedSec(vehicle)}
                    depthPsGranted={vehicle.desglosadorBloqueDepthPsGranted ?? 0}
                    compact
                  />
                )}
                {segmentoNumero != null && vehicle.status === "activo" && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${EMERALD}20`, color: EMERALD }}>S{segmentoNumero}</span>}
                {isSituacionFlota && vehicle.status === "activo" && situacionRelojDebeMostrarse(vehicle) && timerDisplay && (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono tracking-wider"
                    style={{
                      backgroundColor: timerExpired ? "rgba(153,27,27,0.25)" : "rgba(212,175,55,0.15)",
                      color: timerExpired ? "#ef4444" : GOLD,
                      border: `1px solid ${timerExpired ? "rgba(153,27,27,0.45)" : "rgba(212,175,55,0.35)"}`,
                    }}
                    data-testid={`situacion-header-timer-${vehicle.id}`}
                  >
                    {timerDisplay}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">{vehicle.criterioDetalle}</p>
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: difficultyConfig[difficulty].bgColor, color: difficultyConfig[difficulty].color }}>{difficultyConfig[difficulty].label}</span>
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
                  const sessionElapsedSec = getDesglosadorSessionElapsedSec(vehicle);
                  const totalRealSec = subs.reduce((acc, s) => acc + (s.duracionFinal || 0), 0);
                  const totalSugeridoSec = subs.reduce((acc, s) => acc + (s.tiempoSugeridoSeg || 0), 0);
                  const hasSugerido = totalSugeridoSec > 0;
                  const deltaTotalSec = totalRealSec - totalSugeridoSec;
                  const deltaGanando = hasSugerido && deltaTotalSec < -5;
                  const deltaPerdiendo = hasSugerido && deltaTotalSec > 5;
                  const deltaColor = deltaGanando ? "#00C851" : deltaPerdiendo ? "#FF3131" : "#D4AF37";
                  const deltaLabel = deltaGanando ? `↓ ${fmtSec(Math.abs(deltaTotalSec))} ganado` : deltaPerdiendo ? `↑ ${fmtSec(deltaTotalSec)} extra` : "→ en tiempo";
                  const psProfundidad = vehicle.desglosadorBloqueDepthPsGranted ?? 0;
                  const subsPsGranted = sumDesglosadorSubsPsAlreadyGranted(subs);
                  const totalPS = estimateDesglosadorSessionPs(subs, psProfundidad);
                  const psCumplidosEst = subs
                    .filter(s => s.status === "cumplido")
                    .reduce(
                      (sum, s) => sum + (s.psOtorgados ?? computeDesglosadorSubAwardPS(s)),
                      0
                    );
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
                        <div className="grid grid-cols-2 gap-1.5 text-center sm:grid-cols-5">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(56,189,248,0.1)" }}>
                            <p className="text-base font-black font-mono" style={{ color: "#38BDF8" }}>{formatElapsedHHMMSS(sessionElapsedSec)}</p>
                            <p className="text-[7px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>Desglose</p>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(0,200,81,0.1)" }}>
                            <p className="text-base font-black" style={{ color: "#00C851" }}>{cumplidos}</p>
                            <p className="text-[7px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>Cumplidos</p>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                            <p className="text-base font-black text-red-400">{fallados}</p>
                            <p className="text-[7px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>Fallados</p>
                          </div>
                          <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.1)" }}>
                            <p className="text-base font-black" style={{ color: "#D4AF37" }}>{fmtSec(totalRealSec)}</p>
                            <p className="text-[7px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>Real</p>
                          </div>
                          {hasSugerido ? (
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${deltaColor}15` }}>
                              <p className="text-[11px] font-black" style={{ color: deltaColor }}>{deltaLabel}</p>
                              <p className="text-[7px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>Delta</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(100,116,139,0.08)" }}>
                              <p className="text-base font-black" style={{ color: "rgba(255,255,255,0.45)" }}>—</p>
                              <p className="text-[7px] uppercase font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>Sin ref</p>
                            </div>
                          )}
                        </div>

                        {/* Time vs Suggested breakdown (if available) */}
                        {hasSugerido && (
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.72)" }}>Sugerido</span>
                            <span className="text-[10px] font-mono font-bold" style={{ color: "#C4B5FD" }}>{fmtSec(totalSugeridoSec)}</span>
                            <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>vs</span>
                            <span className="text-[10px] font-mono font-bold text-white">{fmtSec(totalRealSec)}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.72)" }}>Real</span>
                          </div>
                        )}

                        {/* PS breakdown */}
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#D4AF37" }}>PS</span>
                          <span className="text-[8px] font-bold flex-1" style={{ color: "rgba(255,255,255,0.78)" }}>Subs +{psCumplidosEst}{subsPsGranted < psCumplidosEst ? ` (${subsPsGranted} ya en barra)` : ""} · cierre +{DESGLOSADOR_CYCLE_CLOSE_BASE_PS}{psProfundidad > 0 ? ` · profundidad +${psProfundidad}` : ""}{fallados > 0 ? ` · ${fallados} fallado(s) sin PS` : ""}</span>
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
                                    <span className="text-[8px] font-mono font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>{fmtSec(sv.duracionFinal)}</span>
                                  )}
                                  {subDelta !== null && (
                                    <span className="text-[8px] font-black" style={{ color: subDeltaColor }}>
                                      {subGanando ? `−${fmtSec(Math.abs(subDelta))}` : subPerdiendo ? `+${fmtSec(subDelta)}` : "≈"}
                                    </span>
                                  )}
                                </div>
                                {sv.tiempoSugeridoSeg !== undefined && sv.duracionFinal !== undefined && (
                                  <div className="flex items-center gap-1 px-2 pb-1.5">
                                    <span className="text-[7px] font-bold font-mono" style={{ color: "rgba(255,255,255,0.62)" }}>ref {fmtSec(sv.tiempoSugeridoSeg)}</span>
                                    <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.45)" }}>→</span>
                                    <span className="text-[7px] font-bold font-mono" style={{ color: "rgba(255,255,255,0.78)" }}>real {fmtSec(sv.duracionFinal)}</span>
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
                                rutaEnfoque: sv.rutaEnfoque
                                  ? { ...sv.rutaEnfoque, cruzado: { fluido: true, concentrado: false, limite: false } }
                                  : undefined,
                              }));
                              if (onDesglosadorUpdate) {
                                resetDesglosadorVoiceRefs();
                                onDesglosadorUpdate(vehicle.id, resetSubs, { resetDepth: true });
                              }
                              setDesglosadorSummary(false);
                              setUltimoCierreSub(null);
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

                const sessionElapsedSec = getDesglosadorSessionElapsedSec(vehicle);
                void desglosadorUiTick;

                return (
                  <div className="pt-3 space-y-3">
                    <DesglosadorDuracionPanel
                      elapsedSec={sessionElapsedSec}
                      depthPsGranted={vehicle.desglosadorBloqueDepthPsGranted ?? 0}
                    />

                    {/* Progress header with collapse toggle */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <ListTodo size={12} style={{ color: flotaColor }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: flotaColor }}>MODO EJECUCIÓN</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono font-bold" style={{ color: "rgba(255,255,255,0.82)" }}>{cumplidos + fallados}/{subs.length}</span>
                        <span className="text-[8px] font-mono font-bold" style={{ color: futuroCicloLabel === "—" ? "rgba(255,255,255,0.45)" : "#FDBA74" }}>🏁 CICLO: {futuroCicloLabel}</span>
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

                    {ultimoCierreSub && (() => {
                      const fmtDelta = (sec: number) => {
                        const m = Math.floor(Math.abs(sec) / 60);
                        const s = Math.abs(sec) % 60;
                        return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
                      };
                      const v = ultimoCierreSub.verdict;
                      const badgeColor =
                        v === "gain" ? "#00C851" : v === "loss" ? "#FF3131" : v === "neutral" ? GOLD : SLATE;
                      const label =
                        v === "gain"
                          ? `↓ ${fmtDelta(ultimoCierreSub.deltaSec)} · GANASTE`
                          : v === "loss"
                            ? `↑ ${fmtDelta(ultimoCierreSub.deltaSec)} · PERDISTE`
                            : v === "neutral"
                              ? "≈ EN TIEMPO"
                              : `Sin referencia · ${ultimoCierreSub.status}`;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-2 p-2.5 rounded-xl border"
                          style={{
                            backgroundColor: `${badgeColor}10`,
                            borderColor: `${badgeColor}40`,
                            boxShadow: `0 0 12px ${badgeColor}18`,
                          }}
                          data-testid="desglosador-ultimo-cierre"
                        >
                          <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: badgeColor }}>
                            Último cierre
                          </p>
                          <p className="text-[10px] font-bold text-white truncate">{ultimoCierreSub.titulo}</p>
                          <p className="text-sm font-black mt-0.5" style={{ color: badgeColor, fontFamily: "JetBrains Mono, monospace" }}>
                            {label}
                          </p>
                          {ultimoCierreSub.conquistaFluidezAbsoluta && (
                            <p className="text-[8px] font-bold mt-1" style={{ color: "#38BDF8" }}>
                              Conquista de fluidez absoluta · segmento A
                            </p>
                          )}
                        </motion.div>
                      );
                    })()}

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
                                    <p className="text-[9px] text-center font-mono font-bold leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
                                      <span style={{ color: flotaColor }}>{activeSub.cantidadObjetivo} u</span>
                                      {" × "}
                                      <span style={{ color: flotaColor }}>{activeSub.tiempoRecordMinPerUnit.toFixed(1)} MIN/U</span>
                                      {" = "}
                                      <span style={{ color: GOLD }}>{Math.round(activeSub.cantidadObjetivo * activeSub.tiempoRecordMinPerUnit)} min obj</span>
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
                                      <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: "#6EE7B7" }}>TERMINA A LAS</p>
                                      <p className="text-[11px] font-black" style={{ color: futuroSubLabel === "—" ? "rgba(255,255,255,0.45)" : "#00FFC3", fontFamily: "JetBrains Mono, monospace" }}>{futuroSubLabel}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.72)" }}>CICLO GLOBAL</p>
                                      <p className="text-[11px] font-black" style={{ color: futuroCicloLabel === "—" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.9)", fontFamily: "JetBrains Mono, monospace" }}>{futuroCicloLabel}</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Cantidad lograda input if applicable */}
                                {activeSub.cantidadObjetivo && (
                                  <div className="space-y-2">
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.78)" }}>Cant. lograda</span>
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
                                        <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "monospace" }}>RESTANTE</p>
                                        <span className="text-3xl font-black tracking-wider" style={{ color: subVehicleRestante === 0 ? "#22C55E" : "#8B5CF6", fontFamily: "JetBrains Mono, monospace", textShadow: subVehicleRestante === 0 ? "0 0 12px rgba(34,197,94,0.5)" : "0 0 12px rgba(139,92,246,0.5)" }}>
                                          {subVehicleRestante}
                                        </span>
                                        <p className="text-[8px] mt-0.5 font-mono font-bold" style={{ color: "rgba(255,255,255,0.78)" }}>
                                          Ritmo: <span style={{ color: "#C4B5FD" }}>{activeSub.tiempoRecordMinPerUnit.toFixed(1)} min/unidad</span> (récord)
                                        </p>
                                        {subVehicleRestante === 0 && (
                                          <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#22C55E", fontFamily: "monospace" }}>OBJETIVO ALCANZADO</p>
                                        )}
                                        {activeSub.rutaEnfoque?.activa && (
                                          <div className="mt-2 px-1">
                                            <RutaEnfoqueBar restantes={subVehicleRestante} ruta={activeSub.rutaEnfoque} />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center py-1">
                                        <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "monospace" }}>RESTANTE</p>
                                        <span className="text-3xl font-black tracking-wider" style={{ color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace", textShadow: "0 0 12px rgba(139,92,246,0.5)" }}>
                                          {Math.max(0, activeSub.cantidadObjetivo - (Number(cantidadRealizada) || 0))}
                                        </span>
                                        <p className="text-[8px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.62)" }}>
                                          Sin récord · primer ciclo
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!vehicle.interrupcionActiva && (
                                  <div className="mb-2">
                                    {!showPausaForm ? (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setShowPausaForm(true); }}
                                        className="w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                                        style={{ backgroundColor: "rgba(0,255,195,0.08)", color: CYAN, border: "1px solid rgba(0,255,195,0.25)" }}
                                        data-testid="button-desglosador-pausa"
                                      >
                                        Pausar e interrumpir
                                      </button>
                                    ) : (
                                      <div className="flex gap-1.5">
                                        <input
                                          value={pausaTitulo}
                                          onChange={e => setPausaTitulo(e.target.value)}
                                          placeholder="Tarea que interrumpe..."
                                          className="flex-1 px-2 py-1.5 rounded bg-black/40 border text-white text-[10px] focus:outline-none"
                                          style={{ borderColor: "rgba(0,255,195,0.25)" }}
                                          onClick={e => e.stopPropagation()}
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (pausaEnviando || !pausaTitulo.trim()) return;
                                            setPausaEnviando(true);
                                            void Promise.resolve(onDesglosadorPausaInterrupcion?.(vehicle.id, pausaTitulo.trim()))
                                              .finally(() => {
                                                setPausaEnviando(false);
                                                setPausaTitulo("");
                                                setShowPausaForm(false);
                                              });
                                          }}
                                          disabled={pausaEnviando || !pausaTitulo.trim()}
                                          className="px-2 py-1.5 rounded text-[9px] font-bold disabled:opacity-40"
                                          style={{ backgroundColor: "rgba(0,255,195,0.2)", color: CYAN }}
                                        >{pausaEnviando ? "…" : "Ir"}</button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowPausaForm(false); setPausaTitulo(""); }} className="px-2 text-slate-500 text-[9px]">✕</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {vehicle.interrupcionActiva && (
                                  <div className="mb-2 space-y-1.5">
                                    <p className="text-[8px] text-center uppercase tracking-wider" style={{ color: CYAN }}>
                                      Desglosador en pausa — cierra la interrupción arriba (Cumplido o Incumplido)
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); onResumeDesglosador?.(vehicle.id); }}
                                      className="w-full py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider"
                                      style={{ backgroundColor: "rgba(139,92,246,0.12)", color: VIOLET, border: "1px solid rgba(139,92,246,0.35)" }}
                                    >
                                      Reanudar desglosador ahora
                                    </button>
                                  </div>
                                )}
                                {/* Cumplido / Fallado buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (vehicle.interrupcionActiva) return;
                                      playWarDrum();
                                      const now = Date.now();
                                      const allSubs = [...(vehicle.subVehiculos || [])];
                                      const idx = allSubs.findIndex(s => s.id === activeSub.id);
                                      if (idx === -1) return;
                                      const duracionCompletado = allSubs[idx].aperturaAt ? Math.floor((now - allSubs[idx].aperturaAt!) / 1000) : undefined;
                                      if (activeSub.rutaEnfoque?.activa) {
                                        openSubRutaModal({ subId: activeSub.id, status: "cumplido", cantidadRealizada: Number(cantidadRealizada) || 0, duracionCompletado });
                                        return;
                                      }
                                      finalizeSubClose(activeSub.id, "cumplido", Number(cantidadRealizada) || 0, duracionCompletado);
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
                                      if (vehicle.interrupcionActiva) return;
                                      playWarDrum();
                                      const now = Date.now();
                                      const allSubs = [...(vehicle.subVehiculos || [])];
                                      const idx = allSubs.findIndex(s => s.id === activeSub.id);
                                      if (idx === -1) return;
                                      const duracionFallado = allSubs[idx].aperturaAt ? Math.floor((now - allSubs[idx].aperturaAt!) / 1000) : undefined;
                                      if (activeSub.rutaEnfoque?.activa) {
                                        openSubRutaModal({ subId: activeSub.id, status: "fallado", cantidadRealizada: Number(cantidadRealizada) || 0, duracionCompletado: duracionFallado });
                                        return;
                                      }
                                      finalizeSubClose(activeSub.id, "fallado", Number(cantidadRealizada) || 0, duracionFallado);
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
                              <div className="flex items-center justify-between px-1 gap-2">
                                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.78)" }}>
                                  Pendientes ({pendientes.length})
                                  {pendientes[0] && !vehicle.interrupcionActiva && (
                                    <span className="font-normal normal-case ml-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                                      · sigue: {cleanSubTitulo(pendientes[0].titulo)}
                                    </span>
                                  )}
                                </p>
                                {pendientes.length >= 2 && !vehicle.interrupcionActiva && onDesglosadorReorderSubs && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setDesglosadorReorderMode(m => !m); }}
                                    className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: desglosadorReorderMode ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)",
                                      color: desglosadorReorderMode ? VIOLET : "rgba(255,255,255,0.55)",
                                      border: `1px solid ${desglosadorReorderMode ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.12)"}`,
                                    }}
                                  >
                                    {desglosadorReorderMode ? "Listo" : "Reordenar cola"}
                                  </button>
                                )}
                              </div>
                              {pendientes.map((sv, pIdx) => (
                                <div key={sv.id} className="flex items-center gap-2 px-3 py-2 rounded-lg flex-wrap" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}>
                                  {desglosadorReorderMode && !vehicle.interrupcionActiva && onDesglosadorReorderSubs && (
                                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                                      <button
                                        type="button"
                                        disabled={pIdx === 0}
                                        onClick={(e) => { e.stopPropagation(); onDesglosadorReorderSubs(vehicle.id, sv.id, "up"); }}
                                        className="p-0.5 rounded disabled:opacity-25 hover:bg-white/10"
                                        title="Subir en cola"
                                      >
                                        <ChevronUp size={12} className="text-slate-400" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={pIdx === pendientes.length - 1}
                                        onClick={(e) => { e.stopPropagation(); onDesglosadorReorderSubs(vehicle.id, sv.id, "down"); }}
                                        className="p-0.5 rounded disabled:opacity-25 hover:bg-white/10"
                                        title="Bajar en cola"
                                      >
                                        <ChevronDown size={12} className="text-slate-400" />
                                      </button>
                                    </div>
                                  )}
                                  <span className="text-[7px] font-mono font-bold flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>#{pIdx + 1}</span>
                                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border" style={{ borderColor: "rgba(255,255,255,0.45)" }} />
                                  <span className="text-[10px] font-semibold flex-1 min-w-0" style={{ color: "rgba(255,255,255,0.92)" }}>{cleanSubTitulo(sv.titulo)}</span>
                                  {sv.cantidadObjetivo && sv.tiempoRecordMinPerUnit ? (
                                    <span className="text-[8px] font-mono font-bold whitespace-nowrap" style={{ color: GOLD }}>
                                      {sv.cantidadObjetivo}×{sv.tiempoRecordMinPerUnit.toFixed(1)}m/u · ≈{Math.round(sv.cantidadObjetivo * sv.tiempoRecordMinPerUnit)}m
                                    </span>
                                  ) : sv.cantidadObjetivo ? (
                                    <span className="text-[8px] font-mono font-bold" style={{ color: "rgba(255,255,255,0.82)" }}>{sv.cantidadObjetivo} u</span>
                                  ) : null}
                                  {sv.tiempoSugeridoSeg ? (
                                    <span className="text-[8px] font-mono font-bold" style={{ color: "#C4B5FD" }}>ref {fmtSec(sv.tiempoSugeridoSeg)}</span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Projection panel — shown while active sub exists */}
                          {activeSub && (() => {
                            const ganando = liveAccumDeltaSec < -5;
                            const perdiendo = liveAccumDeltaSec > 5;
                            const deltaColor = ganando ? "#00C851" : perdiendo ? "#FF3131" : "#D4AF37";
                            const deltaLabel = ganando ? "↓ ganando" : perdiendo ? "↑ perdiendo" : "→ estable";
                            const futureClockColor = perdiendo && liveAccumDeltaSec > 300 ? "#FF3131" : "#F97316";
                            const noSuggested = !subs.some(s => suggestedSec(s) != null);
                            const cycleRemain = horaFinRemainSec ?? 0;
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
                                        <p className="text-[8px] font-mono font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.72)" }}>en {(() => { const h = Math.floor(horaFinRemainSec / 3600); const m = Math.floor((horaFinRemainSec % 3600) / 60); return h > 0 ? `${h}h ${String(m).padStart(2,'0')}min` : `${m}min ${String(horaFinRemainSec % 60).padStart(2,'0')}s`; })()}</p>
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
                                      <p className="text-[7px] font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Sin proyección</p>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.25)" }}>
                                  <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: "#8B5CF6" }}>📈 PROYECCIÓN</p>
                                  <p className="text-base font-black" style={{ color: "#8B5CF6", fontFamily: "JetBrains Mono, monospace" }}>
                                    {cycleRemain > 0 ? fmtSec(cycleRemain) : fmtSec(0)}
                                  </p>
                                  {!noSuggested ? (
                                    <p className="text-[7px] font-bold mt-0.5" style={{ color: deltaColor }}>
                                      {liveAccumDeltaSec !== 0 ? `${liveAccumDeltaSec <= 0 ? "−" : "+"}${fmtSec(Math.abs(liveAccumDeltaSec))} · ` : ""}{deltaLabel}
                                    </p>
                                  ) : (
                                    <p className="text-[8px] font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>sin ref. aún</p>
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
                                <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.72)" }}>Terminados ({terminados.length})</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                              </div>
                              {terminados.map((sv) => {
                                const isCumplido = sv.status === "cumplido";
                                const deltaSv = sv.duracionFinal && sv.tiempoSugeridoSeg ? sv.duracionFinal - sv.tiempoSugeridoSeg : null;
                                const isUltimo = ultimoCierreSub?.subId === sv.id;
                                return (
                                  <div key={sv.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: isCumplido ? "rgba(0,200,81,0.06)" : "rgba(239,68,68,0.06)", border: isUltimo ? `2px solid ${isCumplido ? "#00C851" : "#ef4444"}` : `1px solid ${isCumplido ? "rgba(0,200,81,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                                    {isCumplido ? <CheckCircle2 size={10} style={{ color: "#00C851" }} /> : <XCircle size={10} className="text-red-400" />}
                                    <span className="text-[10px] font-bold flex-1" style={{ color: "rgba(255,255,255,0.9)" }}>{cleanSubTitulo(sv.titulo)}</span>
                                    {isUltimo && <span className="text-[6px] font-black uppercase px-1 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: SLATE }}>último</span>}
                                    {sv.cantidadLograda !== undefined && <span className="text-[8px] font-bold font-mono" style={{ color: GOLD }}>{sv.cantidadLograda}/{sv.cantidadObjetivo}</span>}
                                    {sv.duracionFinal && <span className="text-[8px] font-mono font-bold" style={{ color: "rgba(255,255,255,0.72)" }}>{fmtSec(sv.duracionFinal)}</span>}
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

              {vehicle.status === "activo" && timerDisplay && vehicle.tipoReloj !== "desglosador" && tipoFlota !== "verdad" && (tipoFlota !== "descanso" || showDescansoReloj) && (tipoFlota !== "situacion" || situacionRelojDebeMostrarse(vehicle)) && (
                <div className="pt-3">
                  <div className="p-3 rounded-xl border text-center" style={{
                    backgroundColor: timerExpired ? "rgba(153,27,27,0.15)" : `${VERDE}08`,
                    borderColor: timerExpired ? "#991b1b" : `${VERDE}40`,
                    boxShadow: timerExpired ? "0 0 20px rgba(153,27,27,0.3)" : `0 0 15px ${VERDE}15`
                  }}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Timer size={12} style={{ color: timerExpired ? "#ef4444" : VERDE }} />
                      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: timerExpired ? "#ef4444" : VERDE }}>
                        {vehicle.tipoReloj === "investigador" ? "CRONÓMETRO LIBRE" : timerExpired ? (tipoFlota === "descanso" ? "DESCANSO EN DEUDA" : "TIEMPO EN DEUDA") : tipoFlota === "situacion" ? "FILA EN FOCO" : "CUENTA REGRESIVA"}
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
                    Lista libre: +2 PS al completar (sin tiempo madre). Selecciona filas y «Llevar al desglose con tiempo»: +4 PS por fila, hora fin objetivo por fila (→ HH:MM), tiempo ganado al cumplir antes del cupo se reparte entre filas flexibles, 3 pitidos a 2 min del cupo en foco. Minutos fijados manualmente se conservan.
                  </p>
                  {(() => {
                    void situacionCupoUiTick;
                    const anchor = vehicle.situacionCupoAnchor;
                    const subs = vehicle.subTareas || [];
                    if (!anchor?.subTareaId || subs.length === 0) {
                      if (situacionCronActivo && subs.some(st => situacionFilaCronometroPendiente(st) && (st.minutosCupo ?? 0) > 0)) {
                        return (
                          <p className="text-[8px] font-mono mb-1.5" style={{ color: "rgba(212,175,55,0.75)" }} data-testid={`situacion-cupo-sync-${vehicle.id}`}>
                            Sincronizando reloj de fila…
                          </p>
                        );
                      }
                      return null;
                    }
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
                  {vehicle.situacionCronometro?.activo === true && onCerrarSituacionDesgloseBloque && situacionDesgloseBloqueListo(vehicle.subTareas || [], vehicle.situacionCronometro) && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCerrarSituacionDesgloseBloque(vehicle.id); }}
                      className="w-full py-2 mb-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55`, boxShadow: `0 0 16px ${GOLD}20` }}
                      data-testid={`situacion-cerrar-bloque-${vehicle.id}`}
                    >
                      <Trophy size={12} />
                      Recibir cierre del bloque · ver PS ganados
                    </button>
                  )}
                  {vehicle.situacionCronometro?.activo !== true && (situacionBloquePsTotal ?? 0) > 0 && onVerSituacionBloquePs && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onVerSituacionBloquePs(); }}
                      className="w-full py-2 mb-2 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: "rgba(212,175,55,0.1)", color: GOLD, border: "1px solid rgba(212,175,55,0.35)" }}
                      data-testid={`situacion-ver-ps-bloque-${vehicle.id}`}
                    >
                      <Sparkles size={11} />
                      Ver PS del bloque (+{situacionBloquePsTotal} PS)
                    </button>
                  )}
                  {vehicle.situacionCronometro?.activo === true && (
                    <>
                      <SituacionBolsaGananciaPanel
                        bolsa={computeSituacionBolsaGanancia(
                          vehicle.subTareas || [],
                          vehicle.situacionCronometro
                        )}
                        compact
                      />
                      <p className="text-[7px] font-mono mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
                        Σ cupos: {sumMinutosCronometroPendientes(vehicle.subTareas || [])} min
                        {vehicle.situacionCronometro?.horaFinMs != null && (
                          <span className="ml-2 opacity-70">
                            · ref fin{" "}
                            {new Date(vehicle.situacionCronometro.horaFinMs).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </p>
                    </>
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
                  {subTasksCollapsed && (vehicle.subTareas || []).length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSubTasksCollapsed(false); }}
                      className="w-full py-2.5 mb-2 rounded-lg text-[9px] font-bold uppercase tracking-wide text-left px-3"
                      style={{ backgroundColor: "rgba(0,255,195,0.08)", color: CYAN, border: "1px solid rgba(0,255,195,0.25)" }}
                      data-testid={`button-expand-subtareas-${vehicle.id}`}
                    >
                      Ver {(vehicle.subTareas || []).length} subtareas
                      {situacionHechasCasa > 0
                        ? ` · Casa ×${situacionHechasCasa}`
                        : situacionTotalCasa > 0
                          ? ` · ${situacionTotalCasa} en Casa`
                          : ""}
                      {situacionTotalDetalles > 0 ? ` · ${situacionTotalDetalles} detalles` : ""}
                      {situacionCronActivo ? " · reloj activo" : ""}
                    </button>
                  )}
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
                            const subsLibre = sortSubTareasTrabajoPrimero(all.filter(s => !s.enDesgloseCronometro));
                            const subsCron = sortSubTareasTrabajoPrimero(all.filter(s => s.enDesgloseCronometro));
                            void situacionCupoUiTick;
                            const horariosCron =
                              situacionCronActivo && subsCron.length > 0
                                ? computeSituacionCronometroHorarios(subsCron, {
                                    bloqueInicioAt:
                                      vehicle.situacionCronometro?.bloqueInicioAt ??
                                      vehicle.aperturaAt ??
                                      Date.now(),
                                    anchor: vehicle.situacionCupoAnchor,
                                    now: Date.now(),
                                    previewTiempoGanado: vehicle.situacionCronometro?.activo === true,
                                    saldoAdelantoMin: vehicle.situacionCronometro?.saldoAdelantoMin,
                                  })
                                : [];
                            const horarioById = new Map(horariosCron.map(h => [h.subTareaId, h]));
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
                            const casaItems = (st.detalles || []).filter(d => d.casa);
                            const detallesEnergia = (st.detalles || []).filter(d => !d.casa);
                            const entregados = detallesEnergia.filter(d => d.entregado).length;
                            const isDetalleExpanded = expandedDetalleStId === st.id;
                            return (
                              <div key={st.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                                <div className="flex flex-col gap-1 p-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
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
                                    {showSituacionDetallesUi && detallesEnergia.length > 0 && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setExpandedDetalleStId(isDetalleExpanded ? null : st.id); }}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex-shrink-0 transition-all"
                                        style={{ backgroundColor: "rgba(0,255,195,0.1)", color: CYAN, border: "1px solid rgba(0,255,195,0.3)" }}
                                        data-testid={`button-toggle-detalles-${st.id}`}
                                      >
                                        ⚡ {detallesEnergia.length} · {entregados} PS
                                        {isDetalleExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                      </button>
                                    )}
                                  </div>
                                  {showSituacionCasaUi && onAddCasaItem && (
                                    <SituacionCasaPanel
                                      vehicleId={vehicle.id}
                                      subTareaId={st.id}
                                      casaItems={casaItems}
                                      expanded={expandedCasaStId === st.id}
                                      onToggleExpand={() =>
                                        setExpandedCasaStId(expandedCasaStId === st.id ? null : st.id)
                                      }
                                      draft={newCasaTexts[st.id] || ""}
                                      onDraftChange={v =>
                                        setNewCasaTexts(prev => ({ ...prev, [st.id]: v }))
                                      }
                                      onAdd={texto => onAddCasaItem(vehicle.id, st.id, texto)}
                                      onToggleHecho={id => onToggleCasaItem?.(vehicle.id, st.id, id)}
                                      readOnly={st.completada}
                                    />
                                  )}
                                </div>
                                {showSituacionDetallesUi && isDetalleExpanded && (
                                  <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(0,255,195,0.1)" }}>
                                    {canAddSituacionDetalles && (
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
                                    )}
                                    {detallesEnergia.length > 0 && (
                                      <div className="space-y-1">
                                        {detallesEnergia.map((d, dIdx) => (
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
                                    {detallesEnergia.length === 0 && canAddSituacionDetalles && (
                                      <p className="text-[8px] text-center py-1" style={{ color: "rgba(0,255,195,0.3)", fontFamily: "JetBrains Mono, monospace" }}>— sin detalles energéticos —</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                                {subsCron.length > 0 && (
                                  <div className="flex items-center justify-between px-0.5 mt-2 gap-2 flex-wrap">
                                    <p className="text-[7px] font-black uppercase tracking-wider text-slate-500">
                                      Desglose con tiempo · +4 PS
                                      {(() => {
                                        const firstPend = subsCron.find(st => (st.resultadoSituacion ?? "pendiente") === "pendiente");
                                        return firstPend && vehicle.situacionCronometro?.activo ? (
                                          <span className="font-normal normal-case ml-1 text-slate-600">
                                            · sigue: {firstPend.texto}
                                          </span>
                                        ) : null;
                                      })()}
                                    </p>
                                    {(() => {
                                      const cronPendientes = subsCron.filter(st => (st.resultadoSituacion ?? "pendiente") === "pendiente");
                                      return cronPendientes.length >= 2 && vehicle.situacionCronometro?.activo && onReorderSubTareasCronometro ? (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setDesglosadorReorderMode(m => !m); }}
                                          className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                          style={{
                                            backgroundColor: desglosadorReorderMode ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)",
                                            color: desglosadorReorderMode ? VIOLET : "rgba(255,255,255,0.55)",
                                            border: `1px solid ${desglosadorReorderMode ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.12)"}`,
                                          }}
                                        >
                                          {desglosadorReorderMode ? "Listo" : "Reordenar cola"}
                                        </button>
                                      ) : null;
                                    })()}
                                  </div>
                                )}
                                {subsCron.map((st, stIdx) => {
                                  const pend = (st.resultadoSituacion ?? "pendiente") === "pendiente";
                                  const cronPendientes = subsCron.filter(s => (s.resultadoSituacion ?? "pendiente") === "pendiente");
                                  const pIdx = pend ? cronPendientes.findIndex(s => s.id === st.id) : -1;
                                  const casaItemsCron = (st.detalles || []).filter(d => d.casa);
                                  const detallesCron = (st.detalles || []).filter(d => !d.casa);
                                  const entregadosCron = detallesCron.filter(d => d.entregado).length;
                                  const isDetalleExpandedCron = expandedDetalleStId === st.id;
                                  const lineDone = st.resultadoSituacion === "cumplido" || st.resultadoSituacion === "fallado";
                                  const ok = st.resultadoSituacion === "cumplido";
                                  const bad = st.resultadoSituacion === "fallado";
                                  const horario = horarioById.get(st.id);
                                  const finLabel =
                                    horario?.finLabel ??
                                    (st.cerradaAt != null ? formatHHMM(st.cerradaAt) : null);
                                  const enFoco = horario?.enFoco ?? (pend && vehicle.situacionCupoAnchor?.subTareaId === st.id);
                                  const bonusAcum = st.minutosGanadosAcum ?? 0;
                                  return (
                                    <div key={st.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: bad ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)", border: bad ? "1px solid rgba(239,68,68,0.2)" : undefined }}>
                                      <div className="flex flex-col gap-1 p-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {pend && desglosadorReorderMode && vehicle.situacionCronometro?.activo && onReorderSubTareasCronometro && pIdx >= 0 && (
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                              <button
                                                type="button"
                                                disabled={pIdx === 0}
                                                onClick={(e) => { e.stopPropagation(); onReorderSubTareasCronometro(vehicle.id, st.id, "up"); }}
                                                className="p-0.5 rounded disabled:opacity-25 hover:bg-white/10"
                                                title="Subir en cola"
                                              >
                                                <ChevronUp size={12} className="text-slate-400" />
                                              </button>
                                              <button
                                                type="button"
                                                disabled={pIdx === cronPendientes.length - 1}
                                                onClick={(e) => { e.stopPropagation(); onReorderSubTareasCronometro(vehicle.id, st.id, "down"); }}
                                                className="p-0.5 rounded disabled:opacity-25 hover:bg-white/10"
                                                title="Bajar en cola"
                                              >
                                                <ChevronDown size={12} className="text-slate-400" />
                                              </button>
                                            </div>
                                          )}
                                          {pend && desglosadorReorderMode && pIdx >= 0 && (
                                            <span className="text-[7px] font-mono font-bold flex-shrink-0 text-slate-500">#{pIdx + 1}</span>
                                          )}
                                          <span className={`text-[10px] leading-tight flex-1 min-w-0 ${lineDone ? (ok ? "line-through text-slate-600" : "line-through text-red-300/80") : "text-slate-300"}`}>
                                            <span className="text-[8px] mr-1" style={{ color: PLATA }}>{stIdx + 1}.</span>
                                            {st.texto}
                                          </span>
                                          {!pend && finLabel && (
                                            <span
                                              className="text-[7px] font-mono font-bold flex-shrink-0"
                                              style={{ color: ok ? "rgba(148,163,184,0.85)" : "#f87171" }}
                                              data-testid={`situacion-cron-fin-${st.id}`}
                                            >
                                              {ok ? "✓" : "✗"} {finLabel}
                                            </span>
                                          )}
                                          {pend && (
                                            <div className="flex gap-1 flex-shrink-0 flex-wrap">
                                              <button type="button" onClick={(e) => { e.stopPropagation(); onSituacionCronometroCumplido?.(vehicle.id, st.id); }} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ backgroundColor: "rgba(0,200,81,0.15)", color: VERDE, border: "1px solid rgba(0,200,81,0.4)" }}>Cumplido</button>
                                              <button type="button" onClick={(e) => { e.stopPropagation(); onSituacionCronometroReservar?.(vehicle.id, st.id); }} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ backgroundColor: "rgba(148,163,184,0.12)", color: PLATA, border: "1px solid rgba(148,163,184,0.35)" }} title="Posponer — va a Reservas tácticas (ruta S, persiste al cerrar vehículo)">Reservar</button>
                                              <button type="button" onClick={(e) => { e.stopPropagation(); onSituacionCronometroFallado?.(vehicle.id, st.id); }} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}>Fallado</button>
                                            </div>
                                          )}
                                          {showSituacionDetallesUi && detallesCron.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); setExpandedDetalleStId(isDetalleExpandedCron ? null : st.id); }}
                                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex-shrink-0 transition-all"
                                              style={{ backgroundColor: "rgba(0,255,195,0.1)", color: CYAN, border: "1px solid rgba(0,255,195,0.3)" }}
                                              data-testid={`button-toggle-detalles-cron-${st.id}`}
                                            >
                                              ⚡ {detallesCron.length} · {entregadosCron} PS
                                              {isDetalleExpandedCron ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                                            </button>
                                          )}
                                        </div>
                                        {pend && (onSetSubTareaMinutosCupo || onExtendSituacionCupo || onQuitarSituacionCupo) && (
                                          <div className="flex items-center gap-1.5 pl-1 flex-wrap" onClick={e => e.stopPropagation()}>
                                            <span className="text-[7px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-0.5">
                                              Min
                                              {st.cupoFijo && <Lock size={8} style={{ color: GOLD }} title="Minutos fijados manualmente" />}
                                            </span>
                                            <input
                                              type="number"
                                              min={0}
                                              max={999}
                                              key={`cupo-cron-${st.id}-${st.minutosCupo ?? "x"}-${st.cupoFijo ? "f" : "x"}`}
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
                                              style={{ borderColor: st.cupoFijo ? `${GOLD}55` : "rgba(148,163,184,0.35)" }}
                                              title={st.cupoFijo ? "Fijado: el sobrante se reparte entre las demás filas" : "Fija minutos; el resto se reparte automáticamente"}
                                              data-testid={`input-subtarea-cupo-cron-${st.id}`}
                                            />
                                            {finLabel && (
                                              <span
                                                className="text-[7px] font-mono font-bold"
                                                style={{ color: enFoco ? GOLD : "rgba(148,163,184,0.85)" }}
                                                data-testid={`situacion-cron-objetivo-${st.id}`}
                                                title="Hora objetivo de fin de esta fila"
                                              >
                                                → {finLabel}
                                              </span>
                                            )}
                                            {bonusAcum > 0 && (
                                              <span
                                                className="text-[7px] font-black px-1 py-0.5 rounded"
                                                style={{ backgroundColor: "rgba(0,200,81,0.15)", color: "#00C851" }}
                                                data-testid={`situacion-cron-bonus-${st.id}`}
                                              >
                                                +{bonusAcum} min
                                              </span>
                                            )}
                                            {onExtendSituacionCupo && (
                                              <button
                                                type="button"
                                                onClick={() => onExtendSituacionCupo(vehicle.id, st.id, 5)}
                                                className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide"
                                                style={{ backgroundColor: "rgba(212,175,55,0.12)", color: GOLD, border: "1px solid rgba(212,175,55,0.35)" }}
                                                title="Añade 5 min tomándolos de la siguiente fila con cupo"
                                                data-testid={`button-extend-cupo-cron-${st.id}`}
                                              >
                                                +5′
                                              </button>
                                            )}
                                            {onQuitarSituacionCupo && (
                                              <>
                                                <input
                                                  type="number"
                                                  min={1}
                                                  max={999}
                                                  value={quitarMinDraft[st.id] ?? "5"}
                                                  onChange={(e) =>
                                                    setQuitarMinDraft(prev => ({ ...prev, [st.id]: e.target.value }))
                                                  }
                                                  className="w-9 px-1 py-0.5 rounded text-[9px] bg-black/50 border text-white text-center font-mono"
                                                  style={{ borderColor: "rgba(148,163,184,0.35)" }}
                                                  title="Quita min de la cola posterior y los pasa a la tarea en foco"
                                                  data-testid={`input-quitar-cupo-cron-${st.id}`}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const n = parseInt(quitarMinDraft[st.id] ?? "5", 10);
                                                    if (Number.isFinite(n) && n > 0) {
                                                      onQuitarSituacionCupo(vehicle.id, st.id, n);
                                                    }
                                                  }}
                                                  className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide"
                                                  style={{ backgroundColor: "rgba(148,163,184,0.1)", color: PLATA, border: "1px solid rgba(148,163,184,0.35)" }}
                                                  title="Quita min de la cola posterior → tarea en foco"
                                                  data-testid={`button-quitar-cupo-cron-${st.id}`}
                                                >
                                                  Quitar
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                        {showSituacionCasaUi && onAddCasaItem && (
                                          <SituacionCasaPanel
                                            vehicleId={vehicle.id}
                                            subTareaId={st.id}
                                            casaItems={casaItemsCron}
                                            expanded={expandedCasaStId === st.id}
                                            onToggleExpand={() =>
                                              setExpandedCasaStId(expandedCasaStId === st.id ? null : st.id)
                                            }
                                            draft={newCasaTexts[st.id] || ""}
                                            onDraftChange={v =>
                                              setNewCasaTexts(prev => ({ ...prev, [st.id]: v }))
                                            }
                                            onAdd={texto => onAddCasaItem(vehicle.id, st.id, texto)}
                                            onToggleHecho={id => onToggleCasaItem?.(vehicle.id, st.id, id)}
                                            readOnly={!pend}
                                          />
                                        )}
                                      </div>
                                      {showSituacionDetallesUi && isDetalleExpandedCron && (
                                        <div className="px-2 pb-2" style={{ borderTop: "1px solid rgba(0,255,195,0.1)" }}>
                                          {canAddSituacionDetalles && (
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
                                          )}
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
                                          {detallesCron.length === 0 && canAddSituacionDetalles && (
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
                  <div className="flex gap-2 mt-2">
                    <input value={newSubTarea} onChange={(e) => setNewSubTarea(e.target.value)} placeholder="Nueva sub-tarea..." className="flex-1 p-2 rounded-lg bg-black/40 border text-white text-[10px] placeholder:text-slate-600 focus:outline-none" style={{ borderColor: "rgba(148,163,184,0.2)" }} data-testid={`input-subtarea-${vehicle.id}`} />
                    <button onClick={() => { if (onAddSubTarea && newSubTarea.trim()) { onAddSubTarea(vehicle.id, newSubTarea.trim()); setNewSubTarea(""); } }} disabled={!newSubTarea.trim()} className="px-2 py-1 rounded-lg transition-all disabled:opacity-30" style={{ backgroundColor: "rgba(148,163,184,0.2)", color: PLATA }} data-testid={`button-add-subtarea-${vehicle.id}`}><Plus size={14} /></button>
                  </div>
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

              {!minimal && vehicle.status === "activo" && (
                <div className="space-y-2 pt-1">
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
                      {vehicle.vehiculoPadreDesglosadorId && (
                        <p className="text-[9px] text-center mb-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(0,255,195,0.08)", color: CYAN, border: "1px solid rgba(0,255,195,0.2)" }}>
                          Al cerrar (Cumplido o Incumplido) el desglosador retoma el tiempo congelado.
                        </p>
                      )}
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
                    <button onClick={onArchive} className="w-full py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280" }}><Archive size={12} /> Archivar</button>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {subRutaModal && (() => {
        const subForModal = (vehicle.subVehiculos || []).find(s => s.id === subRutaModal.subId);
        const cruzada = subForModal?.rutaEnfoque?.cruzado ?? null;
        const canConfirm = rutaSeguimientoPickerCanConfirm(subRutaSinUso, subRutaSel);
        return (
          <motion.div className="fixed inset-0 z-[230] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }} role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl border p-4 space-y-3 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: PIZARRA, borderColor: "rgba(139,92,246,0.35)" }}>
              <RutaSeguimientoPicker
                tituloContexto={cleanSubTitulo(subForModal?.titulo || "")}
                cruzadaReferencia={cruzada}
                seleccion={subRutaSel}
                sinUso={subRutaSinUso}
                patronActivo={subRutaPatron}
                onSeleccionChange={(bandas, patron) => {
                  setSubRutaSel(bandas);
                  setSubRutaPatron(patron);
                }}
                onSinUsoChange={sin => {
                  setSubRutaSinUso(sin);
                  if (sin) setSubRutaPatron("sin_ruta");
                }}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setSubRutaModal(null); setSubRutaSel(new Set()); setSubRutaSinUso(false); setSubRutaPatron(null); }} className="flex-1 py-2 rounded-xl text-xs text-slate-400 bg-white/5">Cancelar</button>
                <button
                  type="button"
                  disabled={!canConfirm}
                  onClick={() => finalizeSubClose(subRutaModal.subId, subRutaModal.status, subRutaModal.cantidadRealizada, subRutaModal.duracionCompletado, subRutaSinUso ? [] : [...subRutaSel])}
                  className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                  style={{ backgroundColor: "rgba(139,92,246,0.25)", color: "#c4b5fd" }}
                >
                  Confirmar sub
                </button>
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
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

      const vehiculosCumplidos = vehicles.filter(v => v.status === "cumplido").length;
      const vehiculosArchivados = vehicles.filter(v => v.status === "archivado").length;
      const totalCerrados = vehiculosCumplidos + vehiculosArchivados;
      if (totalCerrados > 0) {
        signals.push(Math.round((vehiculosCumplidos / totalCerrados) * 100));
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
        <p className="text-[8px] text-slate-600 mt-1 italic">Puertas · Desglose · Verdad · Disciplina</p>
        {totalTimeAll > 0 && <p className="text-[9px] text-slate-600 mt-1">Tiempo total registrado: {fmtMin(totalTimeAll)}</p>}
      </div>
    </motion.div>
  );
}

function CierreJornadaModal({
  vehicles, segmentos, todayPoints, existingCierre, onClose, onSeal, userId
}: {
  vehicles: Vehicle[];
  segmentos: SegmentoV5[];
  todayPoints: number;
  existingCierre?: CierreJornadaLog | null;
  onClose: () => void;
  onSeal: (cierre: CierreJornadaLog) => void | Promise<void>;
  userId: string;
}) {
  const [isSealing, setIsSealing] = useState(false);
  const alreadySealed = Boolean(existingCierre?.selloEmitido ?? existingCierre);
  const journalStartMs = getJournalDayStartMs();
  const segmentDayStartMs = getLimaDayStartMs();

  const jornadaVehicles = useMemo(
    () =>
      vehicles.filter(v => {
        const ts = v.cierreAt || v.aperturaAt || v.createdAt?.getTime?.() || 0;
        return ts >= journalStartMs;
      }),
    [vehicles, journalStartMs]
  );

  const balance = useMemo(
    () =>
      calcularBalanceConquistaJornada({
        segmentos,
        vehiculos: filterVehiclesForEntropy(vehicles),
        now: Date.now(),
        dayStartMs: segmentDayStartMs,
      }),
    [segmentos, vehicles, segmentDayStartMs]
  );

  const cumplidos = jornadaVehicles.filter(v => v.status === "cumplido").length;
  const archivados = jornadaVehicles.filter(v => v.status === "archivado").length;
  const activos = jornadaVehicles.filter(v => v.status === "activo").length;
  const cerrados = cumplidos + archivados;
  const segmentosManual = segmentos.filter(s => s.estado === "cerrado_manual").length;
  const segmentosEntropia = segmentos.filter(s => s.estado === "entropia").length;
  const peldañosListos = countSegmentosListosParaSellar(segmentos);
  const porcentajeCumplidos = cerrados > 0 ? Math.round((cumplidos / cerrados) * 100) : 0;
  const flotaTypes: TipoFlota[] = ["tiempo", "situacion", "descanso", "verdad"];
  const flotaLabels: Record<TipoFlota, string> = { tiempo: "TIEMPO", situacion: "SITUACIÓN", descanso: "DESCANSO", verdad: "VERDAD" };

  const getMotivationalPhrase = () => {
    if (cumplidos >= 5 || porcentajeCumplidos >= 90) return "Dominio absoluto. El guerrero se forja en la constancia.";
    if (cumplidos >= 3 || porcentajeCumplidos >= 70) return "Jornada sólida. La disciplina habla por ti.";
    if (cerrados > 0) return "Avance real. Reconoce lo hecho, corrige lo pendiente.";
    if (todayPoints > 0) return `Ganaste ${todayPoints} PS hoy. El esfuerzo quedó registrado.`;
    return "Cierra lo pendiente o sella para archivar el día.";
  };

  const selloTexto = getMotivationalPhrase();

  const todayFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const handleSeal = async () => {
    if (isSealing || alreadySealed) return;
    setIsSealing(true);
    try {
      const cierre: CierreJornadaLog = {
        id: "cj_" + Date.now(),
        fecha: getLimaDateString(),
        totalPS: todayPoints,
        porcentajeSoberania: porcentajeCumplidos,
        segmentosCerradosManual: segmentosManual,
        segmentosTotales: segmentos.length,
        energiaOscuraEntries: [],
        energiaOscuraTotal: 0,
        energiaRecuperada: 0,
        fugasVoltaje: 0,
        selloEmitido: true,
        bloqueadoNocturno: new Date().getHours() >= 22,
        timestamp: Date.now()
      };
      (cierre as any).vehiculosCumplidos = cumplidos;
      (cierre as any).vehiculosTotales = jornadaVehicles.length;
      (cierre as any).porcentajeDiaIdeal = porcentajeCumplidos;
      (cierre as any).selloTexto = selloTexto;
      (cierre as any).cierreAt = Date.now();
      (cierre as any).conquistaMin = balance.conquistaMin;
      (cierre as any).entropiaMin = balance.entropiaMin;
      (cierre as any).vacioMin = balance.vacioMin;
      (cierre as any).jornadaPlanMin = balance.jornadaMin;
      await Promise.resolve(onSeal(cierre));
    } finally {
      setIsSealing(false);
    }
  };

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[240] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.95)" }} data-testid="cierre-jornada-modal">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border p-4 space-y-3" style={{ backgroundColor: "#0a0a0a", borderColor: `${GOLD}30` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black uppercase tracking-wider" style={{ color: GOLD, fontFamily: "'Playfair Display', Georgia, serif" }}>Cierre de Jornada</h2>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Revisa tu balance, cierra vehículos pendientes y sella para archivar el día.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/5 shrink-0" aria-label="Cerrar"><X size={18} className="text-slate-500" /></button>
        </div>

        <BalanceConquistaPanel balance={balance} />

        <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Resumen del día (números)</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: `${GOLD}10` }}>
              <p className="text-[7px] uppercase text-slate-500">PS ganados</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: GOLD }} data-testid="text-total-ps">{todayPoints}</p>
            </div>
            <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: `${EMERALD}10` }}>
              <p className="text-[7px] uppercase text-slate-500">Vehículos cumplidos</p>
              <p className="text-2xl font-black tabular-nums text-white">{cumplidos}</p>
              <p className="text-[8px] text-slate-500">{cerrados} cerrados · {activos} activos</p>
            </div>
            <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "rgba(56,189,248,0.08)" }}>
              <p className="text-[7px] uppercase text-slate-500">Segmentos cierre manual</p>
              <p className="text-2xl font-black tabular-nums text-white">{segmentosManual}</p>
              <p className="text-[8px] text-slate-500">de {segmentos.length} · entropía {segmentosEntropia}</p>
            </div>
            <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "rgba(139,92,246,0.08)" }}>
              <p className="text-[7px] uppercase text-slate-500">Tasa cumplimiento</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: EMERALD }} data-testid="text-porcentaje-dia">
                {cerrados > 0 ? `${porcentajeCumplidos}%` : "—"}
              </p>
              <p className="text-[8px] text-slate-500">cumplidos / cerrados</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2 text-slate-400">Flota del día</p>
          <div className="grid grid-cols-2 gap-2">
            {flotaTypes.map(tipo => {
              const cfg = FLOTA_CONFIG[tipo];
              const all = jornadaVehicles.filter(v => v.tipoFlota === tipo || (tipo === "verdad" && v.autoVerdad));
              const cumpl = all.filter(v => v.status === "cumplido").length;
              const arch = all.filter(v => v.status === "archivado").length;
              const act = all.filter(v => v.status === "activo").length;
              return (
                <div key={tipo} className="p-2.5 rounded-xl border" style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}25` }} data-testid={`card-balance-${tipo}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: cfg.color }}>{cfg.label}</span>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-[6px] text-slate-600">✓</p>
                      <p className="text-sm font-black text-white tabular-nums">{cumpl}</p>
                    </div>
                    <div>
                      <p className="text-[6px] text-slate-600">Arch</p>
                      <p className="text-sm font-black text-slate-400 tabular-nums">{arch}</p>
                    </div>
                    <div>
                      <p className="text-[6px] text-slate-600">Act</p>
                      <p className="text-sm font-black tabular-nums" style={{ color: cfg.color }}>{act}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center p-3 rounded-xl border" style={{ backgroundColor: `${GOLD}06`, borderColor: `${GOLD}20` }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Sello de Jornada</p>
          <p className="text-[10px] text-slate-400 capitalize">{todayFormatted}</p>
          <p className="text-sm leading-relaxed text-slate-300 mt-1" data-testid="text-sello-motivacional">{selloTexto}</p>
        </div>

        {alreadySealed && existingCierre && (
          <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: `${GOLD}10`, borderColor: `${GOLD}35` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>Jornada ya sellada hoy</p>
            <p className="text-xs text-slate-400 mt-1">
              {(existingCierre as any).porcentajeDiaIdeal ?? existingCierre.porcentajeSoberania}% Día Ideal · {existingCierre.totalPS} PS
            </p>
          </div>
        )}

        {peldañosListos > 0 && !alreadySealed && (
          <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: "rgba(0,255,195,0.06)", borderColor: "rgba(0,255,195,0.25)" }}>
            <p className="text-[9px] font-bold" style={{ color: CYAN }}>
              {peldañosListos} peldaño{peldañosListos !== 1 ? "s" : ""} irán a Proyectos al sellar
            </p>
            <p className="text-[8px] text-slate-500 mt-0.5">Segmentos con cierre manual vinculados a tu escalera</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onClose} className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }} data-testid="button-cerrar-silencio">
            {alreadySealed ? "Cerrar" : "Cerrar en Silencio"}
          </button>
          <button
            type="button"
            onClick={handleSeal}
            disabled={isSealing || alreadySealed}
            className="py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: GOLD, color: "#000", boxShadow: `0 0 20px ${GOLD}40` }}
            data-testid="button-sellar-jornada"
          >
            {isSealing ? "Sellando…" : alreadySealed ? "Sellada" : "Sellar Jornada"}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
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
