import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

class HistorialErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Historial Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020202" }}>
          <div className="text-center space-y-4 p-6">
            <p className="text-red-400 text-lg">Ocurrió un error al cargar el historial</p>
            <p className="text-slate-500 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import {
  Brain,
  Flame,
  Zap,
  Coffee,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  Filter,
  Eye,
  Compass,
  Heart,
  Target,
  Wrench,
  Check,
  Share2,
  BookOpen,
  Lightbulb,
  Trophy,
  Sparkles,
  Trash2,
  Star,
  Copy,
  ClipboardCheck,
} from "lucide-react";
import * as api from "@/lib/api";
import { ShareModal } from "@/components/share-modal";
import {
  subscribeToCodices,
  deleteCodice,
  SavedCodice,
  subscribeToProgression,
  UserProgression,
  subscribeToEnergyLogs,
  EnergyLog,
  subscribeToVehicles,
  Vehicle,
  subscribeToAcervo,
  AcervoEntry,
  markAsPrincipioMaestro,
  subscribeToAlquimiaEntries,
  AlquimiaEntry,
} from "@/lib/persistence";
import { CapsulaPoder, CapsulaDato, CopiadoEstructurado } from "@/components/capsulas/CapsulaPoder";
import { useAuthContext } from "@/App";
import { toast } from "sonner";
import { isOwner } from "@/lib/owner";
import { getUserEmail } from "@/lib/firebase";

const categoriaConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  reflexion: { label: "Reflexión", icon: BookOpen, color: "text-blue-400", bgColor: "bg-blue-500" },
  leccion: { label: "Lección", icon: Lightbulb, color: "text-amber-400", bgColor: "bg-amber-500" },
  victoria: { label: "Victoria", icon: Trophy, color: "text-emerald-400", bgColor: "bg-emerald-500" },
  insight: { label: "Insight", icon: Sparkles, color: "text-purple-400", bgColor: "bg-purple-500" },
};

type ShareItem = {
  type: "espejo" | "planeacion" | "esperanza" | "deposito" | "alquimia";
  text: string;
  subtype?: string;
  points?: number;
  date?: string;
};

const energyConfig: Record<string, { label: string; color: string; hexColor: string; bgColor: string; icon: any; cp: number }> = {
  enfoque: { label: "ENFOQUE", color: "text-[#A855F7]", hexColor: "#A855F7", bgColor: "bg-[#A855F7]", icon: Brain, cp: 5 },
  pasos: { label: "PASOS", color: "text-[#3B82F6]", hexColor: "#3B82F6", bgColor: "bg-[#3B82F6]", icon: Flame, cp: 15 },
  conflicto: { label: "CONFLICTO", color: "text-[#EF4444]", hexColor: "#EF4444", bgColor: "bg-[#EF4444]", icon: Zap, cp: 10 },
  alcance: { label: "ALCANCE", color: "text-[#7C3AED]", hexColor: "#7C3AED", bgColor: "bg-[#7C3AED]", icon: Coffee, cp: 20 },
  mastery: { label: "ENFOQUE", color: "text-[#A855F7]", hexColor: "#A855F7", bgColor: "bg-[#A855F7]", icon: Brain, cp: 5 },
  flow: { label: "PASOS", color: "text-[#3B82F6]", hexColor: "#3B82F6", bgColor: "bg-[#3B82F6]", icon: Flame, cp: 15 },
  conflict: { label: "CONFLICTO", color: "text-[#EF4444]", hexColor: "#EF4444", bgColor: "bg-[#EF4444]", icon: Zap, cp: 10 },
  trivial: { label: "ALCANCE", color: "text-[#7C3AED]", hexColor: "#7C3AED", bgColor: "bg-[#7C3AED]", icon: Coffee, cp: 20 },
};

const dimensionTabs = [
  { id: "espejo", label: "Espejo", desc: "Presente", icon: Eye, color: "text-blue-400", bgColor: "bg-blue-500" },
  { id: "planeacion", label: "Planeación", desc: "Futuro", icon: Compass, color: "text-cyan-400", bgColor: "bg-cyan-500" },
  { id: "alquimia", label: "Alquimia", desc: "Transmutación", icon: Sparkles, color: "text-amber-400", bgColor: "bg-amber-500" },
  { id: "deposito", label: "Depósito", desc: "Aprendizajes", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-500" },
  { id: "sabiduria", label: "Sabiduría", desc: "Códices", icon: BookOpen, color: "text-purple-400", bgColor: "bg-purple-500" },
];

const energyFilterTabs = [
  { id: "all", label: "Todos" },
  { id: "enfoque", label: "ENFOQUE", color: "#A855F7" },
  { id: "pasos", label: "PASOS", color: "#3B82F6" },
  { id: "conflicto", label: "CONFLICTO", color: "#EF4444" },
  { id: "alcance", label: "ALCANCE", color: "#7C3AED" },
];

function logToCapsulaDato(log: EnergyLog): CapsulaDato {
  const config = energyConfig[log.type] || energyConfig["enfoque"];
  return {
    id: log.id,
    tipo: "espejo",
    titulo: config.label,
    texto: log.text,
    puntos: log.points,
    fecha: new Date(log.timestamp),
    esPrincipioMaestro: (log as any).es_principio_maestro,
    badge: config.label,
    badgeColor: config.hexColor,
  };
}

function alquimiaToCapsulaDato(entry: AlquimiaEntry): CapsulaDato {
  return {
    id: entry.id,
    tipo: "alquimia",
    titulo: `"${entry.oro}"`,
    texto: `Transmutación alquímica · Score ${entry.alquimiaScore}%`,
    puntos: entry.totalPoints,
    fecha: entry.createdAt,
    expandedFields: [
      { label: "OBSERVACIÓN", value: entry.observacion, color: "#3B82F6" },
      { label: "CRISIS", value: entry.crisis, color: "#EF4444" },
      { label: "LECCIÓN", value: entry.leccion, color: "#A855F7" },
      { label: "MAESTRÍA", value: entry.maestria, color: "#D4AF37" },
    ],
    badge: `Score: ${entry.alquimiaScore}%`,
    badgeColor: entry.alquimiaScore >= 90 ? "#D4AF37" : entry.alquimiaScore >= 70 ? "#10B981" : "#6B7280",
  };
}

function vehicleToCapsulaDato(vehicle: Vehicle): CapsulaDato {
  const ejesText = vehicle.ejes
    ? Object.values(vehicle.ejes).map((e: any) => e.text).filter(Boolean).join(" · ")
    : "";
  const expandedFields = vehicle.ejes
    ? Object.entries(vehicle.ejes)
        .map(([key, eje]: [string, any]) => ({
          label: key.toUpperCase(),
          value: eje.text || "",
          color: key === "enfoque" ? "#1E90FF" : key === "conflicto" ? "#50C878" : key === "pasos" ? "#9B59B6" : "#D4AF37",
        }))
        .filter((f) => f.value)
    : [];

  return {
    id: vehicle.id,
    tipo: "planificacion",
    titulo: vehicle.titulo,
    texto: ejesText,
    puntos: vehicle.status === "cumplido" ? 30 : vehicle.status === "archivado" ? 10 : 15,
    fecha: new Date(vehicle.createdAt),
    status: vehicle.status,
    badge: vehicle.status === "cumplido" ? "COMPLETADO" : vehicle.status === "archivado" ? "ARCHIVADO" : "ACTIVO",
    badgeColor: vehicle.status === "cumplido" ? "#10B981" : vehicle.status === "archivado" ? "#6B7280" : "#06B6D4",
    expandedFields,
  };
}

function depositoToCapsulaDato(entry: AcervoEntry): CapsulaDato {
  return {
    id: entry.id,
    tipo: "deposito",
    titulo: entry.text.length > 60 ? entry.text.slice(0, 60) + "…" : entry.text,
    texto: entry.text,
    puntos: entry.points,
    fecha: new Date(entry.createdAt),
    esPrincipioMaestro: (entry as any).es_principio_maestro,
  };
}

function HistorialContent() {
  const { user, loading: authLoading } = useAuthContext();
  const userEmail = getUserEmail();
  const esOwner = isOwner(userEmail);
  const [, navigate] = useLocation();
  const [activeDimension, setActiveDimension] = useState("espejo");
  const [activeEnergyFilter, setActiveEnergyFilter] = useState("all");
  const [activeCategoriaFilter, setActiveCategoriaFilter] = useState("all");
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);
  const [savedCodices, setSavedCodices] = useState<SavedCodice[]>([]);
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [acervoEntries, setAcervoEntries] = useState<AcervoEntry[]>([]);
  const [alquimiaEntries, setAlquimiaEntries] = useState<AlquimiaEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setLoadError(null);

    const unsubscribers: (() => void)[] = [];
    let loadedCount = 0;
    const totalSubs = 6;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalSubs) {
        setDataLoading(false);
      }
    };

    const handleError = (source: string) => (err: Error) => {
      console.error(`Error loading ${source}:`, err);
      checkAllLoaded();
    };

    try {
      unsubscribers.push(
        subscribeToVehicles(user.uid, (data) => { setVehicles(data); checkAllLoaded(); }, handleError("vehicles"))
      );
      unsubscribers.push(
        subscribeToAcervo(user.uid, (data) => { setAcervoEntries(data); checkAllLoaded(); }, handleError("acervo"))
      );
      unsubscribers.push(
        subscribeToCodices(user.uid, (data) => { setSavedCodices(data); checkAllLoaded(); }, handleError("codices"))
      );
      unsubscribers.push(
        subscribeToProgression(user.uid, (prog) => { setProgression(prog); checkAllLoaded(); }, handleError("progression"))
      );
      unsubscribers.push(
        subscribeToEnergyLogs(user.uid, (data) => { setEnergyLogs(data); checkAllLoaded(); }, handleError("energyLogs"))
      );
      unsubscribers.push(
        subscribeToAlquimiaEntries(user.uid, (data) => { setAlquimiaEntries(data); checkAllLoaded(); }, handleError("alquimia"))
      );
    } catch (err) {
      console.error("Error setting up subscriptions:", err);
      setLoadError("Error al cargar datos");
      setDataLoading(false);
    }

    const timeout = setTimeout(() => {
      setDataLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      unsubscribers.forEach((unsub) => {
        try { unsub?.(); } catch (e) {}
      });
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020202" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020202" }}>
        <div className="text-center space-y-4">
          <p className="text-slate-400">Inicia sesión para ver tu historial</p>
          <button
            onClick={() => navigate("/bienvenida")}
            className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020202" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando historial...</p>
        </div>
      </div>
    );
  }

  const handleDeleteCodice = async (codiceId: string) => {
    if (!user) return;
    try {
      await deleteCodice(user.uid, codiceId);
      toast.success("Códice eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleSello = (id: string, texto: string, modulo: string) => {
    if (user) {
      markAsPrincipioMaestro(user.uid, id, texto, modulo);
      toast.success("Sellado como Principio Maestro");
    }
  };

  const handleShareCapsula = (dato: CapsulaDato) => {
    const typeMap: Record<string, ShareItem["type"]> = {
      espejo: "espejo",
      alquimia: "alquimia",
      planificacion: "planeacion",
      deposito: "deposito",
    };
    setShareItem({
      type: typeMap[dato.tipo] || "espejo",
      text: dato.texto || dato.titulo,
      points: dato.puntos,
    });
  };

  const filteredCodices = activeCategoriaFilter === "all"
    ? savedCodices
    : savedCodices.filter((c) => c.categoria === activeCategoriaFilter);

  const filterTypeMap: Record<string, string[]> = {
    enfoque: ["enfoque", "mastery"],
    pasos: ["pasos", "flow"],
    conflicto: ["conflicto", "conflict"],
    alcance: ["alcance", "trivial"],
  };

  const filteredLogs = activeEnergyFilter === "all"
    ? energyLogs
    : energyLogs.filter((log: EnergyLog) => filterTypeMap[activeEnergyFilter]?.includes(log.type) || log.type === activeEnergyFilter);

  const espejoCapsulas = filteredLogs.map(logToCapsulaDato);

  const groupedByDate = espejoCapsulas.reduce((acc: Record<string, CapsulaDato[]>, cap) => {
    const date = cap.fecha.toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(cap);
    return acc;
  }, {} as Record<string, CapsulaDato[]>);

  const energyStats = {
    enfoque: energyLogs.filter((l: EnergyLog) => l.type === "enfoque" || (l.type as string) === "mastery").length,
    pasos: energyLogs.filter((l: EnergyLog) => l.type === "pasos" || (l.type as string) === "flow").length,
    conflicto: energyLogs.filter((l: EnergyLog) => l.type === "conflicto" || (l.type as string) === "conflict").length,
    alcance: energyLogs.filter((l: EnergyLog) => l.type === "alcance" || (l.type as string) === "trivial").length,
  };

  const alquimiaCapsulas = alquimiaEntries.map(alquimiaToCapsulaDato);
  const vehicleCapsulas = vehicles.map(vehicleToCapsulaDato);
  const depositoCapsulas = acervoEntries.map(depositoToCapsulaDato);

  const activeVehicleCapsulas = vehicleCapsulas.filter((c) => c.status === "activo");
  const completedVehicleCapsulas = vehicleCapsulas.filter((c) => c.status === "cumplido" || c.status === "archivado");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">

        <header className="flex items-center gap-4 py-4">
          <button
            onClick={() => navigate("/espejo")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Historial Completo</h1>
            <p className="text-xs text-slate-500">Tus registros en las dimensiones</p>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {dimensionTabs.map((tab) => {
            const Icon = tab?.icon || Eye;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDimension(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap",
                  activeDimension === tab.id
                    ? `${tab.bgColor}/20 border-current/50`
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
                data-testid={`dimension-${tab.id}`}
              >
                <Icon size={18} className={cn(activeDimension === tab.id ? tab.color : "text-slate-500")} />
                <div className="text-left">
                  <p className={cn("text-sm font-bold", activeDimension === tab.id ? tab.color : "text-white")}>
                    {tab.label}
                  </p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ===== ESPEJO (PRESENTE) ===== */}
        {activeDimension === "espejo" && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(energyStats).map(([type, count]) => {
                const config = energyConfig[type];
                return (
                  <button
                    key={type}
                    onClick={() => setActiveEnergyFilter(activeEnergyFilter === type ? "all" : type)}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-center",
                      activeEnergyFilter === type
                        ? `${config.bgColor}/20 border-white/30`
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                    data-testid={`filter-${type}`}
                  >
                    <span className={cn("text-xl font-black", config.color)}>{count}</span>
                    <p className="text-[8px] uppercase tracking-widest text-slate-500 mt-1">
                      {config.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Filter size={14} className="text-slate-500 shrink-0" />
              {energyFilterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEnergyFilter(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                    activeEnergyFilter === tab.id
                      ? "bg-primary text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {Object.keys(groupedByDate).length === 0 ? (
              <div className="text-center py-12">
                <Eye size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">No hay registros de energía</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, dateCapsulas]) => {
                  const isCollapsed = collapsedDates.has(date);
                  const dayPoints = dateCapsulas.reduce((sum, c) => sum + (c.puntos || 0), 0);
                  return (
                    <div key={date}>
                      <div
                        className="flex items-center gap-2 sticky top-0 bg-[#050505] py-2 cursor-pointer group"
                        onClick={() => toggleDateCollapse(date)}
                        data-testid={`date-header-${date}`}
                      >
                        <span className="text-slate-500 group-hover:text-slate-400 transition-colors">
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex-1">
                          {date}
                        </h3>
                        <span className="text-[10px] text-slate-600 font-bold">
                          {dateCapsulas.length} reg · +{dayPoints} PS
                        </span>
                        <span onClick={(e) => e.stopPropagation()}>
                          <CopiadoEstructurado capsulas={dateCapsulas} dateLabel={date} />
                        </span>
                      </div>
                      {!isCollapsed && (
                        <div className="space-y-2">
                          {dateCapsulas.map((cap) => (
                            <CapsulaPoder
                              key={cap.id}
                              dato={cap}
                              esOwner={esOwner}
                              onSello={handleSello}
                              onShare={handleShareCapsula}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs text-slate-600">
                {filteredLogs.length} registro{filteredLogs.length !== 1 ? "s" : ""}
                {activeEnergyFilter !== "all" && ` de ${energyConfig[activeEnergyFilter]?.label}`}
              </p>
            </div>
          </>
        )}

        {/* ===== PLANEACIÓN (FUTURO) ===== */}
        {activeDimension === "planeacion" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                <span className="text-2xl font-black text-cyan-400">{activeVehicleCapsulas.length}</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Activos</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                <span className="text-2xl font-black text-green-400">{completedVehicleCapsulas.length}</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Completados</p>
              </div>
            </div>

            {activeVehicleCapsulas.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Vehículos Activos
                </h3>
                <div className="space-y-2">
                  {activeVehicleCapsulas.map((cap) => (
                    <CapsulaPoder
                      key={cap.id}
                      dato={cap}
                      esOwner={esOwner}
                      onShare={handleShareCapsula}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedVehicleCapsulas.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Completados / Archivados
                </h3>
                <div className="space-y-2 opacity-60">
                  {completedVehicleCapsulas.map((cap) => (
                    <CapsulaPoder
                      key={cap.id}
                      dato={cap}
                      esOwner={esOwner}
                      onShare={handleShareCapsula}
                    />
                  ))}
                </div>
              </div>
            )}

            {vehicles.length === 0 && (
              <div className="text-center py-12">
                <Compass size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">No hay vehículos registrados</p>
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs text-slate-600">
                {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""} en total
              </p>
            </div>
          </div>
        )}

        {/* ===== ALQUIMIA (TRANSMUTACIÓN) ===== */}
        {activeDimension === "alquimia" && (
          <div className="space-y-6">
            {alquimiaCapsulas.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">No hay transmutaciones registradas</p>
                <p className="text-xs text-slate-600 mt-1">Crea tu primera transmutación en Alquimia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alquimiaCapsulas.map((cap) => (
                  <CapsulaPoder
                    key={cap.id}
                    dato={cap}
                    esOwner={esOwner}
                    onShare={handleShareCapsula}
                  />
                ))}
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs text-slate-600">
                {alquimiaEntries.length} transmutaci{alquimiaEntries.length !== 1 ? "ones" : "ón"} registrada{alquimiaEntries.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* ===== DEPÓSITO (APRENDIZAJES) ===== */}
        {activeDimension === "deposito" && (
          <div className="space-y-6">
            {depositoCapsulas.length === 0 ? (
              <div className="text-center py-12">
                <Heart size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">No hay aprendizajes registrados</p>
                <p className="text-xs text-slate-600 mt-1">Registra tus aprendizajes en el Depósito</p>
              </div>
            ) : (
              <div className="space-y-2">
                {depositoCapsulas.map((cap) => (
                  <CapsulaPoder
                    key={cap.id}
                    dato={cap}
                    esOwner={esOwner}
                    onSello={handleSello}
                    onShare={handleShareCapsula}
                  />
                ))}
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs text-slate-600">
                {acervoEntries.length} aprendizaje{acervoEntries.length !== 1 ? "s" : ""} registrado{acervoEntries.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* ===== SABIDURÍA (CÓDICES) ===== */}
        {activeDimension === "sabiduria" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Filter size={14} className="text-slate-500 shrink-0" />
              <button
                onClick={() => setActiveCategoriaFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                  activeCategoriaFilter === "all"
                    ? "bg-purple-500 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                )}
                data-testid="categoria-all"
              >
                Todos
              </button>
              {(Object.keys(categoriaConfig) as Array<keyof typeof categoriaConfig>).map((cat) => {
                const cfg = categoriaConfig[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoriaFilter(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2",
                      activeCategoriaFilter === cat
                        ? `${cfg.bgColor} text-white`
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                    data-testid={`categoria-${cat}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {filteredCodices.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">No hay Códices guardados</p>
                <p className="text-xs text-slate-600 mt-1">Guarda tus Códices desde la Cámara de Sabiduría</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCodices.map((codice) => {
                  const catConfig = categoriaConfig[codice.categoria] || categoriaConfig.reflexion;
                  const CatIcon = catConfig?.icon || BookOpen;
                  const isExpanded = expandedItemId === codice.id;
                  const isLong = (codice.contenido || "").length > 100;

                  return (
                    <motion.div
                      key={codice.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent",
                        isLong && "cursor-pointer"
                      )}
                      onClick={() => isLong && setExpandedItemId(isExpanded ? null : codice.id)}
                      data-testid={`codice-${codice.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          `${catConfig.bgColor}/20`
                        )}>
                          <CatIcon size={20} className={catConfig.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold mb-1">{codice.titulo}</h4>
                          <p className={cn(
                            "text-slate-400 text-sm leading-relaxed italic",
                            !isExpanded && isLong && "line-clamp-2"
                          )}>
                            "{codice.contenido}"
                          </p>

                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {[
                              { label: "E", val: codice.ejes.enfoque, col: "bg-[#A855F7]" },
                              { label: "C", val: codice.ejes.conflicto, col: "bg-[#EF4444]" },
                              { label: "P", val: codice.ejes.pasos, col: "bg-[#3B82F6]" },
                              { label: "A", val: codice.ejes.alcance, col: "bg-[#7C3AED]" },
                            ].map((eje) => (
                              <div key={eje.label} className="text-center">
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-1">
                                  <div className={`h-full ${eje.col}`} style={{ width: `${eje.val}%` }} />
                                </div>
                                <span className="text-[8px] text-slate-600">{eje.label} {eje.val}%</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                              `${catConfig.bgColor}/20`,
                              catConfig.color
                            )}>
                              {catConfig.label}
                            </span>
                            <span className="text-[9px] text-purple-400 uppercase font-bold">
                              {codice.nivel}
                            </span>
                            <span className="text-[9px] text-slate-600">
                              {codice.createdAt.toLocaleDateString("es", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("¿Eliminar este Códice?")) {
                                  handleDeleteCodice(codice.id);
                                }
                              }}
                              className="ml-auto p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors"
                              data-testid={`delete-codice-${codice.id}`}
                            >
                              <Trash2 size={12} className="text-slate-400 hover:text-red-400" />
                            </button>
                            {isLong && (
                              <span className="text-slate-500">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs text-slate-600">
                {savedCodices.length} Códice{savedCodices.length !== 1 ? "s" : ""} guardado{savedCodices.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {shareItem && (
        <ShareModal
          isOpen={!!shareItem}
          onClose={() => setShareItem(null)}
          item={shareItem}
        />
      )}
    </div>
  );
}

export default function Historial() {
  return (
    <HistorialErrorBoundary>
      <HistorialContent />
    </HistorialErrorBoundary>
  );
}
