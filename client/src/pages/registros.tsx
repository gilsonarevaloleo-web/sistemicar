import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Battery,
  Car,
  Wallet,
  Dna,
  Clipboard,
  BookOpen,
  TrendingUp,
  X,
  FileJson,
  Brain,
  Zap,
  Clock,
  Target,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  subscribeToEnergyLogs,
  EnergyLog,
  subscribeToVehicles,
  Vehicle,
  VehicleHistoryEntry,
  loadVehicleHistoryFromFirebase,
  subscribeToHopeLogs,
  HopeLog,
  subscribeToGenomeLaws,
  GenomeLaw,
  subscribeToPrincipiosMaestros,
  PrincipioMaestro,
  subscribeToExpedientes,
  ExpedienteClinico,
  subscribeToCodices,
  SavedCodice,
  subscribeToDailyPoints,
  DailyPS,
  loadSovereigntyPuntosMes,
  loadBossStepsHistory,
  BossStep,
} from "@/lib/persistence";
import { useAuthContext } from "@/App";
import { toast } from "sonner";

const GOLD = "#D4AF37";
const CYAN = "#00FFC3";
const RED = "#FF3131";

type Area = "energia" | "flota" | "deposito" | "adn" | "espejo" | "sabiduria" | "puntos" | "situacional";

interface AreaConfig {
  id: Area;
  label: string;
  emoji: string;
  color: string;
}

const AREAS: AreaConfig[] = [
  { id: "energia",     label: "Energía",              emoji: "🔋", color: "#3B82F6" },
  { id: "flota",       label: "Flota",                emoji: "🚗", color: "#06B6D4" },
  { id: "situacional", label: "Intel. Enfoque",   emoji: "🧠", color: "#A855F7" },
  { id: "deposito",    label: "Depósito",             emoji: "💰", color: "#F97316" },
  { id: "adn",         label: "ADN Soberano",         emoji: "🧬", color: CYAN },
  { id: "espejo",      label: "Espejo Clínico",       emoji: "📋", color: GOLD },
  { id: "sabiduria",   label: "Sabiduría",            emoji: "📚", color: "#22C55E" },
  { id: "puntos",      label: "Puntos PS",            emoji: "📈", color: "#F59E0B" },
];

const MAX_PER_AREA = 200;

const ENERGY_TYPE_LABELS: Record<string, string> = {
  enfoque:    "ENFOQUE",
  conflicto:  "CONFLICTO",
  pasos:      "PASOS",
  alcance:    "ALCANCE",
  percibo:    "PERCIBO",
  reconozco:  "RECONOZCO",
  cuento_con: "CUENTO CON",
  transformo: "TRANSFORMO",
  mastery:    "ENFOQUE",
  flow:       "PASOS",
  conflict:   "CONFLICTO",
  trivial:    "ALCANCE",
};

function fmtDate(d: Date | number | undefined): string {
  if (d == null) return "—";
  try {
    return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch { return "—"; }
}

function fmtDateTime(d: Date | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {text}
    </span>
  );
}

function RowField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] text-slate-600 uppercase tracking-widest">{label}</p>
      <p className="text-xs text-slate-300" style={color ? { color } : {}}>{value || "—"}</p>
    </div>
  );
}

function RecordCard({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div
      className="p-3 rounded-xl border border-white/5 space-y-2"
      style={{ backgroundColor: "rgba(255,255,255,0.025)" }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <p className="text-xs text-slate-600 text-center py-6">{text}</p>;
}

function AreaHeader({
  area,
  totalCount,
  filteredCount,
  isSearching,
  open,
  onToggle,
  onDownload,
}: {
  area: AreaConfig;
  totalCount: number;
  filteredCount: number;
  isSearching: boolean;
  open: boolean;
  onToggle: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 cursor-pointer select-none"
      style={{ borderBottom: open ? `1px solid ${area.color}22` : "none" }}
      onClick={onToggle}
      data-testid={`area-header-${area.id}`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: `${area.color}18`, border: `1px solid ${area.color}40` }}
      >
        <span>{area.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-wide" style={{ color: area.color }}>{area.label}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
          {isSearching
            ? `${filteredCount} de ${totalCount} registros`
            : `${totalCount} registros`}
        </p>
      </div>
      <button
        className="p-2 rounded-lg transition-colors hover:bg-white/10"
        style={{ color: area.color }}
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        data-testid={`download-${area.id}`}
        title="Descargar JSON (todos los registros)"
      >
        <FileJson size={15} />
      </button>
      {open
        ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
        : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
    </div>
  );
}

export default function Registros() {
  const [, navigate] = useLocation();
  const { user } = useAuthContext();

  const [openAreas, setOpenAreas] = useState<Set<Area>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGorda, setExpandedGorda] = useState<Set<number>>(new Set());
  const [expandedSit, setExpandedSit] = useState<Set<string>>(new Set());

  const [energyLogs,   setEnergyLogs]   = useState<EnergyLog[]>([]);
  const [vehicles,     setVehicles]     = useState<Vehicle[]>([]);
  const [gordaRecord,  setGordaRecord]  = useState<VehicleHistoryEntry[]>([]);
  const [hopeLogs,     setHopeLogs]     = useState<HopeLog[]>([]);
  const [genomeLaws,   setGenomeLaws]   = useState<GenomeLaw[]>([]);
  const [principios,   setPrincipios]   = useState<PrincipioMaestro[]>([]);
  const [expedientes,  setExpedientes]  = useState<ExpedienteClinico[]>([]);
  const [codices,      setCodices]      = useState<SavedCodice[]>([]);
  const [bossSteps,    setBossSteps]    = useState<BossStep[]>([]);
  const [dailyPS,      setDailyPS]      = useState<DailyPS[]>([]);
  const [dailyTotal,   setDailyTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const uid = user.uid;
    const unsubs: (() => void)[] = [];
    let pending = 7;
    const done = () => { pending--; if (pending <= 0) setLoading(false); };

    unsubs.push(subscribeToEnergyLogs(uid, (d) => { setEnergyLogs(d); done(); }, () => done()));
    unsubs.push(subscribeToVehicles(uid, (d) => { setVehicles(d); done(); }, () => done()));
    unsubs.push(subscribeToHopeLogs(uid, (d) => { setHopeLogs(d); done(); }, () => done()));
    unsubs.push(subscribeToGenomeLaws((d) => { setGenomeLaws(d); done(); }, () => done()));
    unsubs.push(subscribeToPrincipiosMaestros((d) => { setPrincipios(d); done(); }, () => done()));
    unsubs.push(subscribeToExpedientes(uid, (d) => { setExpedientes(d); done(); }, () => done()));
    unsubs.push(subscribeToCodices(uid, (d) => { setCodices(d); done(); }, () => done()));

    const dpUnsub = subscribeToDailyPoints(uid, (d) => setDailyTotal(d.total), () => {});
    unsubs.push(dpUnsub);

    loadVehicleHistoryFromFirebase(uid).then(setGordaRecord).catch(() => {});
    loadSovereigntyPuntosMes(uid).then(setDailyPS).catch(() => {});
    loadBossStepsHistory(uid, 200).then(setBossSteps).catch(() => {});

    const timeout = setTimeout(() => setLoading(false), 6000);
    return () => {
      clearTimeout(timeout);
      unsubs.forEach(u => { try { u?.(); } catch (_) {} });
    };
  }, [user?.uid]);

  const q = searchQuery.toLowerCase().trim();
  const isSearching = q.length > 0;

  const validatedGenome = useMemo(
    () => genomeLaws.filter(g => g.status === "validado"),
    [genomeLaws]
  );

  const filteredEnergy     = useMemo(() => (isSearching ? energyLogs.filter(e => e.text?.toLowerCase().includes(q) || (ENERGY_TYPE_LABELS[e.type] || e.type).toLowerCase().includes(q)) : energyLogs).slice(0, MAX_PER_AREA), [energyLogs, q, isSearching]);
  const filteredVehicles   = useMemo(() => (isSearching ? vehicles.filter(v => v.titulo?.toLowerCase().includes(q) || (v.status || "").toLowerCase().includes(q)) : vehicles).slice(0, MAX_PER_AREA), [vehicles, q, isSearching]);
  const filteredGorda      = useMemo(() => (isSearching ? gordaRecord.filter(g => g.titulo?.toLowerCase().includes(q)) : gordaRecord).slice(0, MAX_PER_AREA), [gordaRecord, q, isSearching]);
  const filteredHope       = useMemo(() => (isSearching ? hopeLogs.filter(h => h.text?.toLowerCase().includes(q) || (h.type || "").toLowerCase().includes(q)) : hopeLogs).slice(0, MAX_PER_AREA), [hopeLogs, q, isSearching]);
  const filteredGenome     = useMemo(() => (isSearching ? validatedGenome.filter(g => g.ley_sistemicar?.toLowerCase().includes(q) || (g.categoria || "").toLowerCase().includes(q) || g.tesis_convencional?.toLowerCase().includes(q)) : validatedGenome).slice(0, MAX_PER_AREA), [validatedGenome, q, isSearching]);
  const filteredPrincipios = useMemo(() => (isSearching ? principios.filter(p => p.texto?.toLowerCase().includes(q) || (p.moduloOrigen || "").toLowerCase().includes(q)) : principios).slice(0, MAX_PER_AREA), [principios, q, isSearching]);
  const filteredExpedientes= useMemo(() => (isSearching ? expedientes.filter(e => (e.codigo_diagnostico || "").toLowerCase().includes(q) || (e.interfaz_primaria || "").toLowerCase().includes(q) || (e.seccion_afectada?.join(" ") || "").toLowerCase().includes(q)) : expedientes).slice(0, MAX_PER_AREA), [expedientes, q, isSearching]);
  const filteredCodices    = useMemo(() => (isSearching ? codices.filter(c => c.titulo?.toLowerCase().includes(q) || c.contenido?.toLowerCase().includes(q) || (c.categoria || "").toLowerCase().includes(q)) : codices).slice(0, MAX_PER_AREA), [codices, q, isSearching]);
  const filteredBossSteps  = useMemo(() => (isSearching ? bossSteps.filter(b => b.text?.toLowerCase().includes(q) || (b.status || "").toLowerCase().includes(q)) : bossSteps).slice(0, MAX_PER_AREA), [bossSteps, q, isSearching]);
  const filteredDailyPS    = useMemo(() => isSearching ? dailyPS.filter(d => d.label.includes(q) || String(d.total).includes(q)) : dailyPS, [dailyPS, q, isSearching]);

  const allSituacionales = useMemo(
    () => vehicles.filter(v => v.tipoFlota === "situacion"),
    [vehicles]
  );
  const filteredSituacionales = useMemo(
    () => (isSearching
      ? allSituacionales.filter(v => v.titulo?.toLowerCase().includes(q) || v.criterioDetalle?.toLowerCase().includes(q) || (v.subTareas || []).some(s => s.texto.toLowerCase().includes(q)))
      : allSituacionales
    ).slice(0, MAX_PER_AREA),
    [allSituacionales, q, isSearching]
  );

  const sitMetrics = useMemo(() => {
    const all = allSituacionales;
    const total = all.length;
    const cumplidos = all.filter(v => v.status === "cumplido").length;
    const archivados = all.filter(v => v.status === "archivado").length;
    const activos = all.filter(v => v.status === "activo").length;

    const withSubs = all.filter(v => v.subTareas && v.subTareas.length > 0);
    const totalCarga = withSubs.reduce((a, v) => a + (v.subTareas?.length || 0), 0);
    const totalEjecutadas = withSubs.reduce((a, v) => a + (v.subTareas?.filter(s => s.completada).length || 0), 0);
    const avgCarga = withSubs.length > 0 ? totalCarga / withSubs.length : 0;
    const ratioEjecucion = totalCarga > 0 ? totalEjecutadas / totalCarga : 0;

    const totalDetalles = withSubs.reduce((a, v) => a + (v.subTareas || []).reduce((b, st) => b + (st.detalles?.length || 0), 0), 0);
    const detallesEntregados = withSubs.reduce((a, v) => a + (v.subTareas || []).reduce((b, st) => b + (st.detalles?.filter(d => d.entregado).length || 0), 0), 0);

    const hourCounts: Record<number, number> = {};
    all.forEach(v => {
      if (v.aperturaAt) {
        const h = new Date(v.aperturaAt).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    const sortedHours = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]));
    const horaPatron = sortedHours.length > 0 ? Number(sortedHours[0][0]) : null;

    const resueltos = all.filter(v => v.status === "cumplido" && v.duracionFinal);
    const avgResolucionMin = resueltos.length > 0
      ? Math.round(resueltos.reduce((a, v) => a + (v.duracionFinal! / 60), 0) / resueltos.length)
      : null;

    const cerrados = cumplidos + archivados;
    const indiceOxidacion = cerrados > 0 ? Math.round((archivados / cerrados) * 100) : 0;

    let perfilLabel = "En observación";
    let perfilColor = "#6B7280";
    let perfilDesc = "Se necesitan al menos 3 sesiones con inventario para clasificar.";
    if (withSubs.length >= 3) {
      if (avgCarga >= 4 && ratioEjecucion < 0.5) {
        perfilLabel = "VACIADO";
        perfilColor = "#00FFC3";
        perfilDesc = "Alto volumen de carga mental descargada, baja ejecución bajo restricción. Sistema expandido y activo.";
      } else if (avgCarga >= 4 && ratioEjecucion >= 0.5) {
        perfilLabel = "SOBERANO OPERATIVO";
        perfilColor = "#D4AF37";
        perfilDesc = "Vacía mucho y ejecuta mucho. Estado de voltaje máximo.";
      } else if (avgCarga <= 2 && ratioEjecucion >= 0.8) {
        perfilLabel = "CONTROL RESTRINGIDO";
        perfilColor = "#F97316";
        perfilDesc = "Abre solo lo que puede controlar. Patrón a ampliar.";
      } else if (avgCarga < 2 && ratioEjecucion < 0.5) {
        perfilLabel = "SISTEMA CONTRAÍDO";
        perfilColor = "#FF3131";
        perfilDesc = "Bajo voltaje sistémico. Requiere activación de apertura.";
      } else {
        perfilLabel = "PERFIL MIXTO";
        perfilColor = "#8B5CF6";
        perfilDesc = "Patrón en formación. Continúa registrando para clasificar.";
      }
    }

    return {
      total, cumplidos, archivados, activos, cerrados,
      totalCarga, totalEjecutadas, avgCarga, ratioEjecucion,
      totalDetalles, detallesEntregados,
      horaPatron, avgResolucionMin, indiceOxidacion,
      perfilLabel, perfilColor, perfilDesc, withSubsCount: withSubs.length,
    };
  }, [allSituacionales]);

  const counts = {
    energia:     { filtered: filteredEnergy.length,                                       total: Math.min(energyLogs.length, MAX_PER_AREA) },
    flota:       { filtered: filteredVehicles.length + filteredGorda.length,              total: Math.min(vehicles.length, MAX_PER_AREA) + Math.min(gordaRecord.length, MAX_PER_AREA) },
    situacional: { filtered: filteredSituacionales.length,                                total: Math.min(allSituacionales.length, MAX_PER_AREA) },
    deposito:    { filtered: filteredHope.length,                                         total: Math.min(hopeLogs.length, MAX_PER_AREA) },
    adn:         { filtered: filteredGenome.length + filteredPrincipios.length,           total: Math.min(validatedGenome.length, MAX_PER_AREA) + Math.min(principios.length, MAX_PER_AREA) },
    espejo:      { filtered: filteredExpedientes.length,                                  total: Math.min(expedientes.length, MAX_PER_AREA) },
    sabiduria:   { filtered: filteredCodices.length + filteredBossSteps.length,          total: Math.min(codices.length, MAX_PER_AREA) + Math.min(bossSteps.length, MAX_PER_AREA) },
    puntos:      { filtered: filteredDailyPS.length,                                      total: dailyPS.length },
  };

  const totalGlobal = isSearching
    ? Object.values(counts).reduce((a, b) => a + b.filtered, 0)
    : Object.values(counts).reduce((a, b) => a + b.total, 0);

  const toggle = (area: Area) => {
    setOpenAreas(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const downloadArea = (area: Area) => {
    const isoDate = new Date().toISOString().slice(0, 10);
    const dataMap: Record<Area, unknown> = {
      energia:     energyLogs,
      flota:       { vehiculos: vehicles, gordaRecord },
      situacional: { vehiculos: allSituacionales, metricas: sitMetrics },
      deposito:    hopeLogs,
      adn:         { leyesADN: validatedGenome, principiosMaestros: principios },
      espejo:      expedientes,
      sabiduria:   { codices, bossSteps },
      puntos:      { dailyPS, totalHoy: dailyTotal },
    };
    downloadJson(dataMap[area], `sistemicar_${area}_${isoDate}.json`);
    toast.success("JSON descargado");
  };

  const downloadAll = () => {
    downloadJson({
      generadoEn: new Date().toISOString(),
      userId: user?.uid,
      areas: {
        energia:     energyLogs,
        flota:       { vehiculos: vehicles, gordaRecord },
        situacional: { vehiculos: allSituacionales, metricas: sitMetrics },
        deposito:    hopeLogs,
        adn:         { leyesADN: validatedGenome, principiosMaestros: principios },
        espejo:      expedientes,
        sabiduria:   { codices, bossSteps },
        puntos:      { dailyPS, totalHoy: dailyTotal },
      },
    }, `sistemicar_registros_global_${new Date().toISOString().slice(0, 10)}.json`);
    toast.success("Exportación global descargada");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020202" }}>
        <div className="text-center space-y-4">
          <p className="text-slate-400">Inicia sesión para ver tus registros</p>
          <button onClick={() => navigate("/bienvenida")} className="px-6 py-3 font-bold rounded-xl text-black" style={{ backgroundColor: GOLD }}>
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020202" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "#050505", color: "#fff" }}>
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3 py-4">
          <button
            onClick={() => navigate("/menu")}
            className="p-2 rounded-xl border transition-colors hover:bg-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
            data-testid="button-back-registros"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight" style={{ color: GOLD }}>Centro de Registros</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {totalGlobal} registro{totalGlobal !== 1 ? "s" : ""}
              {isSearching ? " encontrados" : " totales"}
            </p>
          </div>
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.03]"
            style={{ backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}44`, color: GOLD }}
            data-testid="button-download-global"
          >
            <Download size={14} />
            Global
          </button>
        </header>

        {/* Buscador */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar en todos los registros..."
            className="w-full pl-9 pr-9 py-3 rounded-xl text-sm border text-white placeholder-slate-600 focus:outline-none transition-colors"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: isSearching ? `${GOLD}60` : "rgba(255,255,255,0.1)" }}
            data-testid="input-busqueda-global"
          />
          {isSearching && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              data-testid="button-clear-search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Acordeones */}
        {AREAS.map((area) => {
          const open = openAreas.has(area.id);
          const { total, filtered } = counts[area.id];

          return (
            <motion.div
              key={area.id}
              layout
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: open ? `${area.color}40` : "rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <AreaHeader
                area={area}
                totalCount={total}
                filteredCount={filtered}
                isSearching={isSearching}
                open={open}
                onToggle={() => toggle(area.id)}
                onDownload={() => downloadArea(area.id)}
              />

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-2">

                      {/* ===== ENERGÍA ===== */}
                      {area.id === "energia" && (
                        filteredEnergy.length === 0
                          ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin registros de energía"} />
                          : filteredEnergy.map(log => (
                            <RecordCard key={log.id} testId={`energia-${log.id}`}>
                              <div className="flex items-start gap-2 justify-between">
                                <Badge text={ENERGY_TYPE_LABELS[log.type] || log.type} color="#A855F7" />
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px] font-bold" style={{ color: GOLD }}>+{log.points} PS</span>
                                  <span className="text-[10px] text-slate-600">{fmtDateTime(log.timestamp)}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{log.text}</p>
                            </RecordCard>
                          ))
                      )}

                      {/* ===== FLOTA ===== */}
                      {area.id === "flota" && (
                        <>
                          {filteredVehicles.length === 0 && filteredGorda.length === 0
                            ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin registros de flota"} />
                            : (
                              <>
                                {filteredVehicles.length > 0 && (
                                  <>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1">Vehículos activos / cerrados</p>
                                    {filteredVehicles.map(v => (
                                      <RecordCard key={v.id} testId={`vehiculo-${v.id}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <p className="text-xs font-bold text-white flex-1 min-w-0">{v.titulo}</p>
                                          <Badge
                                            text={v.status === "cumplido" ? "CUMPLIDO" : v.status === "archivado" ? "ARCHIVADO" : "ACTIVO"}
                                            color={v.status === "cumplido" ? "#22C55E" : v.status === "archivado" ? "#6B7280" : "#06B6D4"}
                                          />
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                                          {v.tipoFlota && <span>Flota: {v.tipoFlota}</span>}
                                          {v.tipoReloj && <span>Reloj: {v.tipoReloj}</span>}
                                          {v.duracionFinal != null && <span>{Math.round(v.duracionFinal / 60)}min</span>}
                                          <span>{fmtDate(v.createdAt)}</span>
                                        </div>
                                        {v.tipoFlota === "descanso" && (() => {
                                          const TIPO_COLORS: Record<string, string> = { intercepcion: "#00FFC3", microcarga: "#10b981", reset_profundo: "#8B5CF6", punto_cero: "#D4AF37" };
                                          const TIPO_LABELS: Record<string, string> = { intercepcion: "INTERCEPCIÓN", microcarga: "MICRO-CARGA", reset_profundo: "RESET PROFUNDO", punto_cero: "PUNTO CERO" };
                                          const ETIQUETA_COLORS: Record<string, string> = { recuperado: "#10b981", parcial: "#f59e0b", fragmentado: "#ef4444" };
                                          const ETIQUETA_LABELS: Record<string, string> = { recuperado: "RECUPERADO", parcial: "PARCIAL", fragmentado: "FRAGMENTADO" };
                                          const tipoColor = v.tipoDescanso ? (TIPO_COLORS[v.tipoDescanso] || "#22C55E") : "#22C55E";
                                          const esPuntoCero = v.tipoDescanso === "punto_cero";
                                          const ep = v.etapasPuntoCero || { etapa1: false, etapa2: false, etapa3: false, etapa4: false };
                                          const epCompletados = [ep.etapa1, ep.etapa2, ep.etapa3, ep.etapa4].filter(Boolean).length;
                                          const mp = v.microPasos || { hidratacion: false, respiracion: false, pantallaZero: false };
                                          const mpCompletados = [mp.hidratacion, mp.respiracion, mp.pantallaZero].filter(Boolean).length;
                                          const etiqueta = v.etiquetaSalida;
                                          const notaSalida = v.notaSalida;
                                          const eficienciaSec = v.primerAccionAt && v.aperturaAt ? Math.round((v.primerAccionAt - v.aperturaAt) / 1000) : null;
                                          return (
                                            <div className="mt-2 space-y-1.5 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                {v.tipoDescanso && (
                                                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tipoColor}15`, color: tipoColor }}>
                                                    {TIPO_LABELS[v.tipoDescanso] || v.tipoDescanso}
                                                  </span>
                                                )}
                                                {etiqueta && (
                                                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ETIQUETA_COLORS[etiqueta] || "#6b7280"}15`, color: ETIQUETA_COLORS[etiqueta] || "#6b7280" }}>
                                                    {ETIQUETA_LABELS[etiqueta] || etiqueta}
                                                  </span>
                                                )}
                                                {esPuntoCero ? (
                                                  <span className="text-[8px]" style={{ color: tipoColor }}>○ {epCompletados}/4 etapas</span>
                                                ) : (
                                                  <span className="text-[8px] text-slate-500">⚡ {mpCompletados}/3 micro-pasos</span>
                                                )}
                                                {eficienciaSec !== null && (
                                                  <span className="text-[8px]" style={{ color: tipoColor }}>
                                                    {esPuntoCero ? "1ª etapa" : "1er MP"}: {eficienciaSec < 60 ? `${eficienciaSec}s` : `${Math.round(eficienciaSec / 60)}m`}
                                                  </span>
                                                )}
                                              </div>
                                              {notaSalida && <p className="text-[9px] text-slate-500 italic">"{notaSalida}"</p>}
                                            </div>
                                          );
                                        })()}
                                      </RecordCard>
                                    ))}
                                  </>
                                )}
                                {filteredGorda.length > 0 && (
                                  <>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1 mt-2">Gorda de Récord</p>
                                    {filteredGorda.map((g, idx) => {
                                      const isExpanded = expandedGorda.has(idx);
                                      const hasSubs = g.subResumen && g.subResumen.length > 0;
                                      const statusColor = g.status === "incumplido" || g.status === "fallado" ? RED : "#22C55E";
                                      const statusLabel = g.status === "incumplido" ? "INCUMPLIDO" : g.status === "fallado" ? "FALLADO" : "CUMPLIDO";
                                      return (
                                        <RecordCard key={`gorda-${idx}`} testId={`gorda-${idx}`}>
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs text-slate-300 flex-1 min-w-0">{g.titulo}</p>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              <Badge text={statusLabel} color={statusColor} />
                                              <span className="text-[10px] text-slate-500">{fmtDate(g.fecha)}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4 text-[10px] text-slate-500 flex-wrap">
                                            {g.tipoReloj && <span>Tipo: {g.tipoReloj}</span>}
                                            {g.minPerUnit > 0 && <span>{g.minPerUnit.toFixed(1)} min/u</span>}
                                            {g.totalMin > 0 && <span>{Math.round(g.totalMin)} min</span>}
                                            {g.cumplidos != null && <span style={{ color: "#22C55E" }}>{g.cumplidos} ✓</span>}
                                            {g.fallados != null && g.fallados > 0 && <span style={{ color: RED }}>{g.fallados} ✗</span>}
                                            {g.totalSubs != null && <span>de {g.totalSubs} subs</span>}
                                          </div>
                                          {hasSubs && (
                                            <button
                                              onClick={() => setExpandedGorda(prev => {
                                                const next = new Set(prev);
                                                if (next.has(idx)) next.delete(idx); else next.add(idx);
                                                return next;
                                              })}
                                              className="flex items-center gap-1 text-[10px] transition-colors hover:text-slate-300"
                                              style={{ color: GOLD }}
                                              data-testid={`gorda-toggle-${idx}`}
                                            >
                                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                              {isExpanded ? "Ocultar sub-tareas" : `Ver ${g.subResumen!.length} sub-tareas`}
                                            </button>
                                          )}
                                          {hasSubs && isExpanded && (
                                            <div className="mt-1 space-y-1 pl-2 border-l-2" style={{ borderColor: `${GOLD}30` }}>
                                              {g.subResumen!.map((sv, si) => (
                                                <div key={si} className="flex items-center justify-between gap-2 py-0.5">
                                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <span
                                                      className="text-[11px] flex-shrink-0"
                                                      style={{ color: sv.status === "cumplido" ? "#22C55E" : RED }}
                                                    >
                                                      {sv.status === "cumplido" ? "✓" : "✗"}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400 truncate">{sv.titulo}</p>
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[10px] text-slate-600 flex-shrink-0">
                                                    {sv.cantidadObjetivo != null && sv.cantidadLograda != null && (
                                                      <span>{sv.cantidadLograda}/{sv.cantidadObjetivo}</span>
                                                    )}
                                                    {sv.duracionMin != null && sv.duracionMin > 0 && (
                                                      <span>{sv.duracionMin}min</span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </RecordCard>
                                      );
                                    })}
                                  </>
                                )}
                              </>
                            )
                          }
                        </>
                      )}

                      {/* ===== INTELIGENCIA SITUACIONAL ===== */}
                      {area.id === "situacional" && (
                        <>
                          {filteredSituacionales.length === 0
                            ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin vehículos de enfoque registrados"} />
                            : (
                              <>
                                {/* Métricas v6 — 4 capas */}
                                {!isSearching && sitMetrics.total > 0 && (
                                  <div className="space-y-2 mb-3">

                                    {/* Capa 1 — Observación neutra */}
                                    <div
                                      className="p-3 rounded-xl space-y-2"
                                      style={{ backgroundColor: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <Brain size={13} style={{ color: "#A855F7" }} />
                                        <p className="text-[9px] uppercase tracking-widest" style={{ color: "#A855F7" }}>Capa 1 — Observación</p>
                                      </div>
                                      <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center">
                                          <p className="text-xl font-black text-white">{sitMetrics.total}</p>
                                          <p className="text-[9px] text-slate-500 uppercase">Total</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-xl font-black" style={{ color: "#22C55E" }}>{sitMetrics.cumplidos}</p>
                                          <p className="text-[9px] text-slate-500 uppercase">Cerrados</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-xl font-black" style={{ color: "#06B6D4" }}>{sitMetrics.activos}</p>
                                          <p className="text-[9px] text-slate-500 uppercase">Activos</p>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-xl font-black" style={{ color: "#6B7280" }}>{sitMetrics.archivados}</p>
                                          <p className="text-[9px] text-slate-500 uppercase">Archivados</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Capa 2 — Patrón de frecuencia */}
                                    <div
                                      className="p-3 rounded-xl space-y-2"
                                      style={{ backgroundColor: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)" }}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <Zap size={13} style={{ color: "#A855F7" }} />
                                        <p className="text-[9px] uppercase tracking-widest" style={{ color: "#A855F7" }}>Capa 2 — Patrón</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-0.5">
                                          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Carga mental / sesión</p>
                                          <p className="text-sm font-bold text-white">
                                            {sitMetrics.withSubsCount > 0
                                              ? `${sitMetrics.avgCarga.toFixed(1)} ítems`
                                              : "—"}
                                          </p>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Ejecutados / total carga</p>
                                          <p className="text-sm font-bold" style={{ color: CYAN }}>
                                            {sitMetrics.totalCarga > 0
                                              ? `${sitMetrics.totalEjecutadas} / ${sitMetrics.totalCarga}`
                                              : "—"}
                                          </p>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Hora pico de apertura</p>
                                          <p className="text-sm font-bold text-white">
                                            {sitMetrics.horaPatron !== null
                                              ? `${String(sitMetrics.horaPatron).padStart(2, "0")}:00 h`
                                              : "—"}
                                          </p>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Resolución promedio</p>
                                          <p className="text-sm font-bold text-white">
                                            {sitMetrics.avgResolucionMin !== null
                                              ? `${sitMetrics.avgResolucionMin} min`
                                              : "—"}
                                          </p>
                                        </div>
                                        {sitMetrics.totalDetalles > 0 && (
                                          <div className="col-span-2 flex items-center justify-between pt-1.5" style={{ borderTop: "1px solid rgba(0,255,195,0.12)" }}>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[11px]">⚡</span>
                                              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Energía Desplegada</p>
                                            </div>
                                            <p className="text-sm font-bold" style={{ color: "#00FFC3" }}>
                                              {sitMetrics.detallesEntregados} / {sitMetrics.totalDetalles} <span className="text-[9px] font-normal text-slate-500">detalles</span>
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {sitMetrics.cerrados > 0 && (
                                        <div className="mt-1">
                                          <div className="flex items-center justify-between text-[9px] mb-1">
                                            <span className="text-slate-600 uppercase tracking-widest">Índice de oxidación</span>
                                            <span style={{ color: sitMetrics.indiceOxidacion > 50 ? RED : "#22C55E" }}>
                                              {sitMetrics.indiceOxidacion}%
                                            </span>
                                          </div>
                                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                              className="h-full rounded-full transition-all"
                                              style={{
                                                width: `${sitMetrics.indiceOxidacion}%`,
                                                backgroundColor: sitMetrics.indiceOxidacion > 50 ? RED : "#22C55E",
                                              }}
                                            />
                                          </div>
                                          <p className="text-[8px] text-slate-600 mt-0.5">% archivados sin resolución sobre total cerrados</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Capa 3 — Mapa de perfil */}
                                    <div
                                      className="p-3 rounded-xl"
                                      style={{
                                        backgroundColor: `${sitMetrics.perfilColor}09`,
                                        border: `1px solid ${sitMetrics.perfilColor}30`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <Target size={13} style={{ color: sitMetrics.perfilColor }} />
                                        <p className="text-[9px] uppercase tracking-widest" style={{ color: sitMetrics.perfilColor }}>Capa 3 — Perfil Sistémico</p>
                                      </div>
                                      <p className="text-sm font-black mb-1" style={{ color: sitMetrics.perfilColor }}>
                                        {sitMetrics.perfilLabel}
                                      </p>
                                      <p className="text-[11px] text-slate-400 leading-relaxed">{sitMetrics.perfilDesc}</p>
                                    </div>

                                    {/* Capa 4 — Nota clínica */}
                                    <div
                                      className="p-3 rounded-xl"
                                      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    >
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <Clock size={13} className="text-slate-500" />
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Capa 4 — Nota Clínica</p>
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">
                                        {sitMetrics.withSubsCount === 0
                                          ? "El inventario de carga mental aún no tiene datos. Registra sub-tareas en tus próximos vehículos situacionales para activar el análisis de patrón."
                                          : sitMetrics.totalCarga > 0 && sitMetrics.totalEjecutadas === 0
                                          ? "Hay carga mental registrada pero sin ejecución bajo restricción. Esto puede indicar inicio de práctica o contextos de baja presión temporal."
                                          : sitMetrics.avgCarga >= 4
                                          ? "Alto volumen de descarga mental por sesión. El vaciado no es un problema — es evidencia de un sistema activo que procesa información compleja."
                                          : "Patrón de apertura situacional en observación. Continúa registrando para que el algoritmo genere un diagnóstico de mayor precisión."}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Separador */}
                                <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1 mb-1">
                                  {isSearching ? "Resultados" : "Inventario de Sesiones"}
                                </p>

                                {/* Tarjetas de vehículos */}
                                {filteredSituacionales.map(v => {
                                  const isExpanded = expandedSit.has(v.id);
                                  const subs = v.subTareas || [];
                                  const ejecutadas = subs.filter(s => s.completada).length;
                                  const statusColor = v.status === "cumplido" ? "#22C55E" : v.status === "archivado" ? "#6B7280" : "#A855F7";
                                  const statusLabel = v.status === "cumplido" ? "CERRADO" : v.status === "archivado" ? "ARCHIVADO" : "ACTIVO";
                                  const horaApertura = v.aperturaAt ? new Date(v.aperturaAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;
                                  const fechaApertura = v.aperturaAt ? fmtDate(new Date(v.aperturaAt)) : fmtDate(v.createdAt);

                                  return (
                                    <RecordCard key={v.id} testId={`sit-${v.id}`}>
                                      {/* Header */}
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-bold text-white flex-1 min-w-0 leading-snug">{v.titulo}</p>
                                        <Badge text={statusLabel} color={statusColor} />
                                      </div>

                                      {/* Meta row */}
                                      <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
                                        {horaApertura && (
                                          <span className="flex items-center gap-1">
                                            <Clock size={9} />
                                            {fechaApertura} · {horaApertura}
                                          </span>
                                        )}
                                        {!horaApertura && <span>{fechaApertura}</span>}
                                        {v.duracionFinal != null && v.status === "cumplido" && (
                                          <span className="flex items-center gap-1" style={{ color: "#22C55E" }}>
                                            ⏱ {Math.round(v.duracionFinal / 60)} min
                                          </span>
                                        )}
                                        {v.segmentosCruzados != null && v.segmentosCruzados > 0 && (
                                          <span>{v.segmentosCruzados} seg.</span>
                                        )}
                                        {v.intensidadEnergetica && (
                                          <span className="uppercase"
                                            style={{
                                              color: v.intensidadEnergetica === "limite" ? RED
                                                : v.intensidadEnergetica === "concentrado" ? GOLD
                                                : CYAN,
                                            }}
                                          >
                                            {v.intensidadEnergetica}
                                          </span>
                                        )}
                                      </div>

                                      {/* Criterio de cierre */}
                                      {v.criterioDetalle && (
                                        <div>
                                          <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Criterio de Cierre</p>
                                          <p className="text-[11px] text-slate-400 leading-relaxed">{v.criterioDetalle}</p>
                                        </div>
                                      )}

                                      {/* Inventario de carga mental — resumen */}
                                      {subs.length > 0 && (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                              <Brain size={10} style={{ color: "#A855F7" }} />
                                              <p className="text-[9px] uppercase tracking-widest" style={{ color: "#A855F7" }}>
                                                Inventario de Carga
                                              </p>
                                            </div>
                                            <p className="text-[9px] text-slate-500">
                                              {subs.length} ítems
                                              {ejecutadas > 0 && (
                                                <span style={{ color: CYAN }}> · {ejecutadas} ejecutados</span>
                                              )}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => setExpandedSit(prev => {
                                              const next = new Set(prev);
                                              if (next.has(v.id)) next.delete(v.id); else next.add(v.id);
                                              return next;
                                            })}
                                            className="flex items-center gap-1 text-[10px] transition-colors hover:text-slate-300"
                                            style={{ color: "#A855F7" }}
                                            data-testid={`sit-toggle-${v.id}`}
                                          >
                                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                            {isExpanded ? "Ocultar inventario" : `Ver ${subs.length} ítems`}
                                          </button>
                                          {isExpanded && (
                                            <div className="space-y-1 pl-2 border-l-2" style={{ borderColor: "rgba(168,85,247,0.25)" }}>
                                              {subs.map(s => {
                                                const detallesTotal = s.detalles?.length || 0;
                                                const detallesEnt = s.detalles?.filter(d => d.entregado).length || 0;
                                                return (
                                                  <div key={s.id} className="py-0.5">
                                                    <div className="flex items-start gap-2">
                                                      {s.completada
                                                        ? <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color: CYAN }} />
                                                        : <Circle size={11} className="flex-shrink-0 mt-0.5 text-slate-600" />}
                                                      <p className={`text-[11px] leading-relaxed flex-1 ${s.completada ? "" : "text-slate-500"}`}
                                                        style={s.completada ? { color: "rgba(0,255,195,0.85)" } : {}}>
                                                        {s.texto}
                                                      </p>
                                                      <div className="flex items-center gap-2 flex-shrink-0">
                                                        {detallesTotal > 0 && (
                                                          <span className="text-[8px] font-bold" style={{ color: "#00FFC3" }}>⚡{detallesEnt}/{detallesTotal}</span>
                                                        )}
                                                        {s.creadaAt > 0 && (
                                                          <span className="text-[9px] text-slate-700">
                                                            {new Date(s.creadaAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                              {ejecutadas === 0 && subs.length >= 3 && (
                                                <p className="text-[9px] text-slate-600 italic pt-1 pl-0.5">
                                                  Carga descargada sin ejecución — patrón de vaciado puro.
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </RecordCard>
                                  );
                                })}
                              </>
                            )
                          }
                        </>
                      )}

                      {/* ===== DEPÓSITO ===== */}
                      {area.id === "deposito" && (
                        filteredHope.length === 0
                          ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin registros en depósito"} />
                          : filteredHope.map(h => (
                            <RecordCard key={h.id} testId={`hope-${h.id}`}>
                              <div className="flex items-start justify-between gap-2">
                                <Badge text={h.type || "depósito"} color="#F97316" />
                                <span className="text-[10px] text-slate-600 flex-shrink-0">{fmtDate(h.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{h.text}</p>
                              {h.referenceDate && (
                                <p className="text-[10px] text-slate-600">Ref: {fmtDate(h.referenceDate)}</p>
                              )}
                            </RecordCard>
                          ))
                      )}

                      {/* ===== ADN SOBERANO ===== */}
                      {area.id === "adn" && (
                        <>
                          {filteredGenome.length === 0 && filteredPrincipios.length === 0
                            ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin leyes ADN validadas ni principios maestros"} />
                            : (
                              <>
                                {filteredGenome.length > 0 && (
                                  <>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1">Leyes ADN Validadas</p>
                                    {filteredGenome.map(g => (
                                      <RecordCard key={g.id} testId={`genome-${g.id}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <Badge text="VALIDADO" color={CYAN} />
                                          <span className="text-[10px] text-slate-600 flex-shrink-0">{g.categoria}</span>
                                        </div>
                                        <p className="text-xs font-bold" style={{ color: CYAN }}>{g.ley_sistemicar}</p>
                                        {g.tesis_convencional && (
                                          <RowField label="Tesis convencional" value={g.tesis_convencional} />
                                        )}
                                        <span className="text-[9px] text-slate-600">{fmtDate(g.createdAt)}</span>
                                      </RecordCard>
                                    ))}
                                  </>
                                )}
                                {filteredPrincipios.length > 0 && (
                                  <>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1 mt-2">Principios Maestros</p>
                                    {filteredPrincipios.map(p => (
                                      <RecordCard key={p.id} testId={`principio-${p.id}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <Badge text={p.moduloOrigen} color={GOLD} />
                                          <span className="text-[10px] text-slate-600 flex-shrink-0">{fmtDate(p.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">{p.texto}</p>
                                      </RecordCard>
                                    ))}
                                  </>
                                )}
                              </>
                            )
                          }
                        </>
                      )}

                      {/* ===== ESPEJO CLÍNICO ===== */}
                      {area.id === "espejo" && (
                        filteredExpedientes.length === 0
                          ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin sesiones clínicas registradas"} />
                          : filteredExpedientes.map(e => (
                            <RecordCard key={e.id} testId={`expediente-${e.id}`}>
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <Badge text={e.codigo_diagnostico || "—"} color={GOLD} />
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {e.interfaz_primaria && <Badge text={e.interfaz_primaria} color="#6B7280" />}
                                  <span className="text-[10px] text-slate-600">{fmtDate(e.fecha)}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {e.seccion_afectada?.length > 0 && (
                                  <RowField label="Sección" value={e.seccion_afectada.join(", ")} />
                                )}
                                <RowField
                                  label="Vibración"
                                  value={e.vibracion_final != null ? `${e.vibracion_final}/10` : "—"}
                                  color={CYAN}
                                />
                                {e.interfaz_secundaria && (
                                  <RowField label="Interfaz 2" value={e.interfaz_secundaria} />
                                )}
                                <RowField
                                  label="Hábito"
                                  value={e.estado_habito ? "Completado" : "Pendiente"}
                                  color={e.estado_habito ? "#22C55E" : "#6B7280"}
                                />
                              </div>
                            </RecordCard>
                          ))
                      )}

                      {/* ===== SABIDURÍA ===== */}
                      {area.id === "sabiduria" && (
                        <>
                          {filteredCodices.length === 0 && filteredBossSteps.length === 0
                            ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin códices ni boss steps"} />
                            : (
                              <>
                                {filteredCodices.length > 0 && (
                                  <>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1">Códices</p>
                                    {filteredCodices.map(c => (
                                      <RecordCard key={c.id} testId={`codice-${c.id}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <Badge text={c.categoria || "insight"} color="#22C55E" />
                                          <span className="text-[10px] text-slate-600 flex-shrink-0">{fmtDate(c.createdAt)}</span>
                                        </div>
                                        <p className="text-xs font-bold text-white">{c.titulo}</p>
                                        {c.contenido && (
                                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{c.contenido}</p>
                                        )}
                                      </RecordCard>
                                    ))}
                                  </>
                                )}
                                {filteredBossSteps.length > 0 && (
                                  <>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-600 px-1 mt-2">Boss Steps</p>
                                    {filteredBossSteps.map(b => (
                                      <RecordCard key={b.id} testId={`boss-${b.id}`}>
                                        <div className="flex items-start justify-between gap-2">
                                          <p className="text-xs text-slate-300 flex-1 min-w-0">{b.text}</p>
                                          <Badge
                                            text={b.status === "defeated" ? "VENCIDO" : b.status === "archived" ? "ARCHIVADO" : "ACTIVO"}
                                            color={b.status === "defeated" ? "#22C55E" : b.status === "archived" ? "#6B7280" : RED}
                                          />
                                        </div>
                                        <span className="text-[10px] text-slate-600">{fmtDateTime(b.createdAt)}</span>
                                      </RecordCard>
                                    ))}
                                  </>
                                )}
                              </>
                            )
                          }
                        </>
                      )}

                      {/* ===== PUNTOS PS (30 días) ===== */}
                      {area.id === "puntos" && (
                        <>
                          <div
                            className="flex items-center gap-3 p-3 rounded-xl mb-2"
                            style={{ backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}30` }}
                          >
                            <TrendingUp size={20} style={{ color: GOLD }} />
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-500">PS acumulados hoy</p>
                              <p className="text-2xl font-black" style={{ color: GOLD }}>{dailyTotal}</p>
                            </div>
                          </div>
                          {filteredDailyPS.length === 0
                            ? <EmptyMsg text={isSearching ? "Sin coincidencias" : "Sin datos de puntos"} />
                            : (
                              <div className="space-y-1">
                                {filteredDailyPS.map(d => {
                                  const max = Math.max(...filteredDailyPS.map(x => x.total), 1);
                                  const pct = Math.round((d.total / max) * 100);
                                  return (
                                    <div
                                      key={d.isoDate}
                                      className="flex items-center gap-3 py-0.5"
                                      data-testid={`daily-ps-${d.isoDate}`}
                                    >
                                      <span className="text-[11px] text-slate-500 w-12 text-right flex-shrink-0">{d.label}</span>
                                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{ width: `${pct}%`, backgroundColor: d.total > 0 ? GOLD : "transparent" }}
                                        />
                                      </div>
                                      <span
                                        className="text-[11px] font-bold w-10 text-right flex-shrink-0"
                                        style={{ color: d.total > 0 ? GOLD : "#374151" }}
                                      >
                                        {d.total}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          }
                        </>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

      </div>
    </div>
  );
}
