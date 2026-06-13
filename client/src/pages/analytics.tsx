import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Clock,
  Trophy,
  Sparkles,
  Calendar,
  Target,
  Flame,
  Crown,
  Zap,
  Brain,
  Coffee,
  Award,
  Star,
  Activity,
  BarChart3,
  Loader2,
  Layers,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useAuthContext } from "@/App";
import {
  subscribeToEnergyLogs,
  subscribeToVehicles,
  subscribeToProgression,
  subscribeToMisiones,
  EnergyLog,
  Vehicle,
  UserProgression,
  Mision,
  calculateTotalCP,
} from "@/lib/persistence";
import { analyzeUnified, UnifiedAnalysisResult } from "@/lib/gemini";
import {
  getPlanillaDailySnapshots,
  aggregateCartografiaSemanal,
  aggregateEspectroSemanal,
  decisionesFromSnapshot,
  type PlanillaDailySnapshot,
} from "@/lib/termodinamicaAtencional";
import { RUTA_BANDA_META } from "@/lib/rutaEnfoque";
import { JORNADA_MODULE } from "@/lib/jornadaBrand";

type TabType = "soberania" | "tendencias" | "circadiano" | "logros" | "coach" | "atencional";

const COLORS = {
  enfoque: "#A855F7",
  pasos: "#3B82F6",
  conflicto: "#EF4444",
  alcance: "#7C3AED",
};

const VIOLET = "#9B59B6";
const GOLD = "#D4AF37";
const EMERALD = "#50C878";

const achievements = [
  { id: "centurion", name: "Centurión", desc: "Alcanza 100 puntos CP", icon: "🏆", requirement: 100, type: "cp" },
  { id: "guerrero", name: "Guerrero", desc: "Alcanza 300 puntos CP", icon: "⚔️", requirement: 300, type: "cp" },
  { id: "leyenda", name: "Leyenda", desc: "Alcanza 750 puntos CP", icon: "👑", requirement: 750, type: "cp" },
  { id: "titan", name: "Titán", desc: "Alcanza 1500 puntos CP", icon: "🔱", requirement: 1500, type: "cp" },
  { id: "arconte", name: "Arconte", desc: "Alcanza 2500 puntos CP", icon: "⚡", requirement: 2500, type: "cp" },
  { id: "soberano", name: "Soberano", desc: "Alcanza 5000 puntos CP", icon: "🌟", requirement: 5000, type: "cp" },
  { id: "inmortal", name: "Inmortal", desc: "Alcanza 10000 puntos CP", icon: "💎", requirement: 10000, type: "cp" },
  { id: "transcendente", name: "Transcendente", desc: "Alcanza 25000 puntos CP", icon: "🌌", requirement: 25000, type: "cp" },
  { id: "enfocado", name: "Enfocado", desc: "15 registros de ENFOQUE", icon: "🎯", requirement: 15, type: "enfoque" },
  { id: "cazador", name: "Cazador de Jefes", desc: "5 Pasos Jefe completados", icon: "🏅", requirement: 5, type: "boss" },
  { id: "alquimista", name: "Alquimista", desc: "Registra 5 CONFLICTOS", icon: "🔥", requirement: 5, type: "conflicto" },
  { id: "secuencial", name: "Secuencial", desc: "10 registros de PASOS", icon: "🔵", requirement: 10, type: "pasos" },
  { id: "expansor", name: "Expansor", desc: "8 registros de ALCANCE", icon: "🌌", requirement: 8, type: "alcance" },
  { id: "constante", name: "Constante", desc: "40 registros totales", icon: "⭐", requirement: 40, type: "total" },
  { id: "retador", name: "Retador", desc: "3 misiones DIFÍCILES completadas", icon: "💪", requirement: 3, type: "reto" },
  { id: "consistente", name: "Consistente", desc: "7 días de actividad", icon: "📅", requirement: 7, type: "dias" },
];

function StatMini({ icon: Icon, label, count, points, color }: { icon: any; label: string; count: number; points: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-black text-white">{count}</span>
        <span className="text-[10px] text-slate-500">{points}</span>
      </div>
    </div>
  );
}

interface SoberaniaScore {
  total: number;
  balanceEjes: number;
  consistencia: number;
  misionesReto: number;
  esperanza: number;
  nivel: "deuda" | "transmutacion" | "soberania";
}

function calculateSoberaniaScore(
  energyLogs: EnergyLog[],
  vehicles: Vehicle[],
  progression: UserProgression | null
): SoberaniaScore {
  const distribution = { enfoque: 0, conflicto: 0, pasos: 0, alcance: 0 };
  energyLogs.forEach(log => {
    const type = log.type as keyof typeof distribution;
    if (distribution[type] !== undefined) {
      distribution[type]++;
    }
  });

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const maxAxis = Math.max(...Object.values(distribution));
  const minAxis = Math.min(...Object.values(distribution));
  const balanceEjes = total > 0 ? Math.round((1 - (maxAxis - minAxis) / Math.max(total, 1)) * 100) : 50;

  const diasActivos = progression?.registrationDays || 0;
  const consistencia = Math.min(Math.round((diasActivos / 21) * 100), 100);

  const misionesCompletadas = vehicles.filter(v => v.status === "cumplido");
  const misionesDificiles = misionesCompletadas.filter(v => {
    const retoCount = Object.values(v.ejes).filter(e => e.trifecta === "reto").length;
    return retoCount >= 1;
  });
  const misionesReto = misionesCompletadas.length > 0 
    ? Math.round((misionesDificiles.length / misionesCompletadas.length) * 100)
    : 50;

  const recentLogs = energyLogs.slice(0, 20);
  const positiveTypes = ["enfoque", "pasos"];
  const positiveCount = recentLogs.filter(l => positiveTypes.includes(l.type)).length;
  const esperanza = recentLogs.length > 0 ? Math.round((positiveCount / recentLogs.length) * 100) : 50;

  const totalScore = Math.round((balanceEjes * 0.25) + (consistencia * 0.25) + (misionesReto * 0.25) + (esperanza * 0.25));

  let nivel: "deuda" | "transmutacion" | "soberania" = "deuda";
  if (totalScore >= 71) nivel = "soberania";
  else if (totalScore >= 41) nivel = "transmutacion";

  return { total: totalScore, balanceEjes, consistencia, misionesReto, esperanza, nivel };
}

const ESPECTRO_COLORS = {
  fluido: "#38BDF8",
  concentrado: "#A855F7",
  limite: "#f87171",
  descansos: "#10b981",
};

export default function Analytics() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>("soberania");
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [coachAnalysis, setCoachAnalysis] = useState<UnifiedAnalysisResult | null>(null);
  const [analyzingCoach, setAnalyzingCoach] = useState(false);
  const [dailySnapshots, setDailySnapshots] = useState<PlanillaDailySnapshot[]>([]);
  const [loadingAtencional, setLoadingAtencional] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribeToEnergyLogs(user.uid, setEnergyLogs, console.error),
      subscribeToVehicles(user.uid, setVehicles, console.error),
      subscribeToProgression(user.uid, setProgression, console.error),
      subscribeToMisiones(user.uid, setMisiones, console.error),
    ];
    return () => unsubs.forEach(u => u?.());
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingAtencional(true);
    getPlanillaDailySnapshots(user.uid, 7)
      .then(setDailySnapshots)
      .catch(console.error)
      .finally(() => setLoadingAtencional(false));
  }, [user]);

  const cp = useMemo(() => calculateTotalCP(energyLogs), [energyLogs]);
  const soberania = useMemo(() => calculateSoberaniaScore(energyLogs, vehicles, progression), [energyLogs, vehicles, progression]);

  const distribution = useMemo(() => {
    const dist = { enfoque: 0, conflicto: 0, pasos: 0, alcance: 0 };
    energyLogs.forEach(log => {
      const type = log.type as keyof typeof dist;
      if (dist[type] !== undefined) dist[type]++;
    });
    return dist;
  }, [energyLogs]);

  const circadianData = useMemo(() => {
    const hourly: Record<number, { enfoque: number; conflicto: number; pasos: number; alcance: number }> = {};
    energyLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (!hourly[hour]) hourly[hour] = { enfoque: 0, conflicto: 0, pasos: 0, alcance: 0 };
      const type = log.type as keyof typeof hourly[number];
      if (hourly[hour][type] !== undefined) hourly[hour][type]++;
    });
    return Object.entries(hourly)
      .map(([hour, data]) => ({ hour: `${hour}:00`, ...data }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [energyLogs]);

  const weeklyData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es", { weekday: "short" });
      days[key] = 0;
    }
    energyLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 6) {
        const key = d.toLocaleDateString("es", { weekday: "short" });
        if (days[key] !== undefined) days[key] += log.points;
      }
    });
    return Object.entries(days).map(([day, score]) => ({ day, score }));
  }, [energyLogs]);

  const pieData = useMemo(() => {
    return [
      { name: "ENFOQUE", value: distribution.enfoque, color: COLORS.enfoque },
      { name: "PASOS", value: distribution.pasos, color: COLORS.pasos },
      { name: "CONFLICTO", value: distribution.conflicto, color: COLORS.conflicto },
      { name: "ALCANCE", value: distribution.alcance, color: COLORS.alcance },
    ].filter(d => d.value > 0);
  }, [distribution]);

  const radarData = useMemo(() => [
    { axis: "Balance", value: soberania.balanceEjes },
    { axis: "Consistencia", value: soberania.consistencia },
    { axis: "Retos", value: soberania.misionesReto },
    { axis: "Esperanza", value: soberania.esperanza },
  ], [soberania]);

  const misionesDificilesCompletadas = vehicles.filter(v => {
    if (v.status !== "cumplido") return false;
    const retoCount = Object.values(v.ejes).filter(e => e.trifecta === "reto").length;
    return retoCount >= 1;
  }).length;

  const unlockedAchievements = useMemo(() => {
    return achievements.map(a => {
      let unlocked = false;
      if (a.type === "cp") unlocked = cp >= a.requirement;
      else if (a.type === "enfoque") unlocked = distribution.enfoque >= a.requirement;
      else if (a.type === "pasos") unlocked = distribution.pasos >= a.requirement;
      else if (a.type === "conflicto") unlocked = distribution.conflicto >= a.requirement;
      else if (a.type === "alcance") unlocked = distribution.alcance >= a.requirement;
      else if (a.type === "boss") unlocked = (progression?.totalMissionsCompleted || 0) >= a.requirement;
      else if (a.type === "total") unlocked = energyLogs.length >= a.requirement;
      else if (a.type === "reto") unlocked = misionesDificilesCompletadas >= a.requirement;
      else if (a.type === "dias") unlocked = (progression?.registrationDays || 0) >= a.requirement;
      return { ...a, unlocked };
    });
  }, [cp, distribution, energyLogs.length, progression, misionesDificilesCompletadas]);

  const unlockedCount = unlockedAchievements.filter(a => a.unlocked).length;

  const cartografiaData = useMemo(() => aggregateCartografiaSemanal(dailySnapshots), [dailySnapshots]);
  const espectroData = useMemo(() => aggregateEspectroSemanal(dailySnapshots), [dailySnapshots]);
  const ultimoSnapshot = dailySnapshots.length > 0 ? dailySnapshots[dailySnapshots.length - 1] : null;
  const bloquesLimiteSemana = useMemo(
    () => espectroData.reduce((sum, d) => sum + d.limite, 0),
    [espectroData]
  );
  const bloquesSemanaAnterior = useMemo(() => {
    if (dailySnapshots.length < 2) return null;
    const mid = Math.floor(dailySnapshots.length / 2);
    return dailySnapshots.slice(0, mid).reduce((s, snap) => s + snap.espectroBloques.limite, 0);
  }, [dailySnapshots]);

  const runCoachAnalysis = async () => {
    if (!user) return;
    setAnalyzingCoach(true);
    try {
      const recentLogs = energyLogs.slice(0, 10);
      const positiveTypes = ["enfoque", "pasos"];
      const positiveCount = recentLogs.filter(l => positiveTypes.includes(l.type)).length;
      const hopePercent = Math.round((positiveCount / Math.max(recentLogs.length, 1)) * 100);

      const result = await analyzeUnified({
        chispazos: [],
        energyLogs: energyLogs.slice(0, 10).map(e => ({ type: e.type, text: e.text, points: e.points })),
        misiones: vehicles.slice(0, 10).map(v => {
          const retoCount = Object.values(v.ejes).filter(e => e.trifecta === "reto").length;
          return { titulo: v.titulo, estado: v.status, dificultad: retoCount >= 1 ? "DIFÍCIL" : "NORMAL" };
        }),
        hopePercent,
        totalCP: cp,
        registrationDays: progression?.registrationDays || 0,
      });
      setCoachAnalysis(result);
    } catch (error) {
      console.error("Coach analysis error:", error);
    }
    setAnalyzingCoach(false);
  };

  const tabs: { id: TabType; label: string; icon?: any }[] = [
    { id: "soberania", label: "Soberanía", icon: Crown },
    { id: "tendencias", label: "Tendencias", icon: TrendingUp },
    { id: "circadiano", label: "Circadiano", icon: Clock },
    { id: "logros", label: "Logros", icon: Trophy },
    { id: "atencional", label: "Atencional", icon: Layers },
    { id: "coach", label: "Coach IA", icon: Sparkles },
  ];

  const nivelConfig = {
    deuda: { label: "DEUDA", color: "#EF4444", bg: "from-red-900/30 to-red-950/20" },
    transmutacion: { label: "EN TRANSMUTACIÓN", color: GOLD, bg: "from-amber-900/30 to-amber-950/20" },
    soberania: { label: "SOBERANÍA ACTIVA", color: EMERALD, bg: "from-emerald-900/30 to-emerald-950/20" },
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto min-h-screen pb-32" style={{ backgroundColor: "#020202" }}>
      <header className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Centro de Análisis</p>
        <div className={cn("p-5 rounded-2xl border", `bg-gradient-to-r ${nivelConfig[soberania.nivel].bg}`)} style={{ borderColor: `${nivelConfig[soberania.nivel].color}40` }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Índice de Soberanía</p>
              <p className="text-5xl font-black" style={{ color: nivelConfig[soberania.nivel].color }}>
                {soberania.total}%
              </p>
              <p className="text-xs font-bold mt-1" style={{ color: nivelConfig[soberania.nivel].color }}>
                {nivelConfig[soberania.nivel].label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">CP Total</p>
              <p className="text-3xl font-black text-white flex items-center gap-2 justify-end">
                <Zap size={20} style={{ color: GOLD }} />
                {cp}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === tab.id
                ? "bg-violet-600 text-white"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            )}
          >
            {tab.icon && <tab.icon size={12} />}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {activeTab === "soberania" && (
            <>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Activity size={16} style={{ color: VIOLET }} />
                  Componentes de Soberanía
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#ffffff20" />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                      <Radar name="Soberanía" dataKey="value" stroke={VIOLET} fill={VIOLET} fillOpacity={0.4} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Balance Ejes", value: soberania.balanceEjes, desc: "Equilibrio entre los 4 ejes", color: COLORS.enfoque },
                  { label: "Consistencia", value: soberania.consistencia, desc: "Días activos / 21 días", color: COLORS.pasos },
                  { label: "Misiones Reto", value: soberania.misionesReto, desc: "% misiones difíciles", color: COLORS.alcance },
                  { label: "Esperanza", value: soberania.esperanza, desc: "Positividad en registros", color: GOLD },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-xl" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{item.label}</p>
                    <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}%</p>
                    <p className="text-[9px] text-slate-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400 mb-2">Fórmula de Soberanía:</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  (Balance×25% + Consistencia×25% + Retos×25% + Esperanza×25%) = <span className="text-white font-bold">{soberania.total}%</span>
                </p>
              </div>
            </>
          )}

          {activeTab === "tendencias" && (
            <>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar size={16} />
                  CP - Últimos 7 Días
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="score" stroke={VIOLET} strokeWidth={3} dot={{ fill: VIOLET, strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">Distribución por Ejes</h3>
                <div className="h-48 flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-600 text-sm">Sin datos aún</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-300">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "circadiano" && (
            <>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={16} />
                  Mapa Circadiano
                </h3>
                <div className="h-56">
                  {circadianData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={circadianData}>
                        <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="enfoque" stackId="a" fill={COLORS.enfoque} />
                        <Bar dataKey="pasos" stackId="a" fill={COLORS.pasos} />
                        <Bar dataKey="conflicto" stackId="a" fill={COLORS.conflicto} />
                        <Bar dataKey="alcance" stackId="a" fill={COLORS.alcance} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                      Registra más datos para ver tu mapa circadiano
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.enfoque }} /><span className="text-slate-300">ENFOQUE</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.conflicto }} /><span className="text-slate-300">CONFLICTO</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.pasos }} /><span className="text-slate-300">PASOS</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.alcance }} /><span className="text-slate-300">ALCANCE</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatMini icon={Brain} label="ENFOQUE" count={distribution.enfoque} points="+5 CP" color="text-[#A855F7]" />
                <StatMini icon={Zap} label="CONFLICTO" count={distribution.conflicto} points="+10 CP" color="text-[#EF4444]" />
                <StatMini icon={Flame} label="PASOS" count={distribution.pasos} points="+15 CP" color="text-[#3B82F6]" />
                <StatMini icon={Coffee} label="ALCANCE" count={distribution.alcance} points="+20 CP" color="text-[#7C3AED]" />
              </div>
            </>
          )}

          {activeTab === "logros" && (() => {
            const ptsEspejo = progression?.ptsEspejo || 0;
            const ptsPlanificacion = progression?.ptsPlanificacion || 0;
            const ptsDeposito = progression?.ptsDeposito || 0;

            const MODULE_THRESHOLDS = [
              { pts: 10,  label: "Iniciado",  icon: "🌱" },
              { pts: 50,  label: "Centurión", icon: "🏆" },
              { pts: 150, label: "Guerrero",  icon: "⚔️" },
              { pts: 500, label: "Soberano",  icon: "👑" },
            ];

            const MODULES = [
              { key: "espejo", label: "Espejo",        pts: ptsEspejo,        color: "#FF3131", bg: "from-red-900/20 to-red-950/10",   border: "border-red-500/20",   icon: "🧪" },
              { key: "plan",   label: JORNADA_MODULE.title, pts: ptsPlanificacion, color: "#D4AF37", bg: "from-amber-900/20 to-amber-950/10", border: "border-amber-500/20", icon: "🗓" },
              { key: "dep",    label: "Depósito",      pts: ptsDeposito,      color: "#10B981", bg: "from-emerald-900/20 to-emerald-950/10", border: "border-emerald-500/20", icon: "💎" },
            ];

            return (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Trophy size={16} style={{ color: GOLD }} />
                      Bóveda de Logros
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Award size={14} />
                      {unlockedCount} / {achievements.length}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {unlockedAchievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          achievement.unlocked
                            ? "bg-gradient-to-br from-amber-900/30 to-amber-950/20 border-amber-500/30"
                            : "bg-slate-900/50 border-white/5 opacity-50"
                        )}
                      >
                        <div className="text-2xl mb-2">{achievement.icon}</div>
                        <h4 className={cn("font-bold text-sm", achievement.unlocked ? "text-amber-400" : "text-slate-500")}>
                          {achievement.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">{achievement.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logros por módulo */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Star size={16} style={{ color: GOLD }} />
                    Progreso por Módulo
                  </h3>
                  <div className="space-y-5">
                    {MODULES.map(mod => (
                      <div key={mod.key}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: mod.color }}>
                            {mod.icon} {mod.label}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            <span className="font-bold text-white">{mod.pts}</span> pts acumulados
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {MODULE_THRESHOLDS.map(t => {
                            const unlocked = mod.pts >= t.pts;
                            return (
                              <div
                                key={t.pts}
                                className={cn("p-3 rounded-xl border transition-all", unlocked ? `bg-gradient-to-br ${mod.bg} ${mod.border}` : "bg-slate-900/50 border-white/5 opacity-40")}
                                data-testid={`module-achievement-${mod.key}-${t.label.toLowerCase()}`}
                              >
                                <div className="text-lg mb-1">{t.icon}</div>
                                <div className="text-[11px] font-bold" style={{ color: unlocked ? mod.color : "#64748b" }}>
                                  {t.label}
                                </div>
                                <div className="text-[9px] text-zinc-500 mt-0.5">
                                  {unlocked ? "✓ Desbloqueado" : `${t.pts} pts`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "atencional" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border" style={{ backgroundColor: "rgba(56,189,248,0.08)", borderColor: "rgba(56,189,248,0.25)" }}>
                <h3 className="text-sm font-black text-white mb-1">Termodinámica Atencional</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Medición por bloques de trabajo — sin meta de tiempo. Descanso cuerpo = escucha, no penalización.
                </p>
              </div>

              {loadingAtencional ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span className="text-xs">Cargando cartografía…</span>
                </div>
              ) : dailySnapshots.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Layers size={28} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">Sin snapshots aún</p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    Sella la jornada en {JORNADA_MODULE.title} para guardar Cartografía Panorámica y Espectro de Enfoque.
                  </p>
                </div>
              ) : (
                <>
                  {ultimoSnapshot && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Profundidad ayer/hoy</p>
                        <p className="text-lg font-black" style={{ color: RUTA_BANDA_META[ultimoSnapshot.profundidadMaxima].color }}>
                          {RUTA_BANDA_META[ultimoSnapshot.profundidadMaxima].label}
                        </p>
                        <p className="text-[9px] text-slate-600 mt-1">
                          {ultimoSnapshot.bloquesCompletados} bloque{ultimoSnapshot.bloquesCompletados !== 1 ? "s" : ""}
                          {(() => {
                            const dec = decisionesFromSnapshot(ultimoSnapshot);
                            return dec > 0 ? ` · ${dec} decisión${dec !== 1 ? "es" : ""}` : "";
                          })()}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">Descansos cuerpo</p>
                        <p className="text-lg font-black" style={{ color: ESPECTRO_COLORS.descansos }}>
                          {ultimoSnapshot.espectroBloques.descansosCuerpo}
                        </p>
                        <p className="text-[9px] text-slate-600 mt-1">Recuperación consciente</p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <BarChart3 size={16} style={{ color: ESPECTRO_COLORS.fluido }} />
                      Cartografía Panorámica
                    </h3>
                    <p className="text-[9px] text-slate-500 mb-4">Segmentos: cierre manual vs entropía (7 días)</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cartografiaData}>
                          <XAxis dataKey="label" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", fontSize: "11px" }} />
                          <Bar dataKey="cerradosManual" name="Cierre manual" fill={EMERALD} stackId="seg" />
                          <Bar dataKey="entropia" name="Entropía" fill="#64748b" stackId="seg" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Layers size={16} style={{ color: ESPECTRO_COLORS.concentrado }} />
                      Espectro de Enfoque
                    </h3>
                    <p className="text-[9px] text-slate-500 mb-4">Bloques completados por régimen — no por minutos</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={espectroData}>
                          <XAxis dataKey="label" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", fontSize: "11px" }} />
                          <Bar dataKey="fluido" name="Fluido" fill={ESPECTRO_COLORS.fluido} stackId="esp" />
                          <Bar dataKey="concentrado" name="Concentrado" fill={ESPECTRO_COLORS.concentrado} stackId="esp" />
                          <Bar dataKey="limite" name="Al límite" fill={ESPECTRO_COLORS.limite} stackId="esp" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {(["fluido", "concentrado", "limite"] as const).map(k => (
                        <div key={k} className="flex items-center gap-1.5 text-[10px]">
                          <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: ESPECTRO_COLORS[k] }} />
                          <span className="text-slate-400">{RUTA_BANDA_META[k].label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ultimoSnapshot && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[9px] font-bold uppercase text-slate-500 mb-3">PS por origen (último cierre)</p>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div><span className="text-slate-500">Panorámico</span> <span className="text-white font-bold ml-1">{ultimoSnapshot.psDesglose.panoramico}</span></div>
                        <div><span className="text-slate-500">Espectro</span> <span className="text-white font-bold ml-1">{ultimoSnapshot.psDesglose.espectro}</span></div>
                        <div><span className="text-slate-500">Vehículos</span> <span className="text-white font-bold ml-1">{ultimoSnapshot.psDesglose.vehiculos}</span></div>
                      </div>
                    </div>
                  )}

                  {bloquesSemanaAnterior !== null && (
                    <div className="p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[10px] text-slate-500">
                        Bloques al límite esta semana: <span className="text-white font-bold">{bloquesLimiteSemana}</span>
                        {bloquesLimiteSemana > bloquesSemanaAnterior && (
                          <span className="text-emerald-400 ml-1">↑ vs mitad anterior ({bloquesSemanaAnterior})</span>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "coach" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} style={{ color: VIOLET }} />
                  <h3 className="text-sm font-bold" style={{ color: VIOLET }}>Coach IA</h3>
                </div>

                {!coachAnalysis ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400 mb-4">
                      Analiza todos tus datos para recibir orientación personalizada
                    </p>
                    <button
                      onClick={runCoachAnalysis}
                      disabled={analyzingCoach || energyLogs.length < 3}
                      className="px-6 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-50"
                      style={{ backgroundColor: VIOLET, color: "#fff" }}
                    >
                      {analyzingCoach ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          Analizando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Brain size={16} />
                          Consultar Coach
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "enfoque", label: "ENFOQUE", color: "#A855F7" },
                        { key: "conflicto", label: "CONFLICTO", color: "#EF4444" },
                        { key: "pasos", label: "PASOS", color: "#3B82F6" },
                        { key: "alcance", label: "ALCANCE", color: "#7C3AED" }
                      ].map(eje => {
                        const value = coachAnalysis.ejesBalance[eje.key as keyof typeof coachAnalysis.ejesBalance];
                        return (
                          <div key={eje.key} className="p-3 rounded-xl" style={{ backgroundColor: `${eje.color}15` }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase" style={{ color: eje.color }}>{eje.label}</span>
                              <span className="text-xs font-black" style={{ color: eje.color }}>{value}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className="h-full rounded-full" style={{ backgroundColor: eje.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 rounded-xl bg-black/30 border border-violet-500/20">
                      <p className="text-sm text-white/90 italic text-center" style={{ fontFamily: "Georgia, serif" }}>
                        "{coachAnalysis.mensajeClave}"
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={14} style={{ color: GOLD }} />
                        <span className="text-[10px] font-bold uppercase" style={{ color: GOLD }}>Misión Sugerida</span>
                      </div>
                      <p className="text-xs text-slate-300">{coachAnalysis.recomendacion}</p>
                    </div>

                    <button
                      onClick={runCoachAnalysis}
                      disabled={analyzingCoach}
                      className="w-full py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 bg-white/5"
                    >
                      <Zap size={12} />
                      Actualizar Análisis
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
