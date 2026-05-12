import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  Sparkles,
  Star,
  Plus,
  Trash2,
  Loader2,
  Zap,
  Eye,
  Target,
  Flame,
  Crown,
  Trophy,
  TrendingUp,
  Calendar,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/App";
import {
  subscribeToChispazos,
  addChispazo,
  toggleDeseoLoco,
  deleteChispazo,
  Chispazo,
  saveSubconsciousAnalysis,
  subscribeToSubconsciousAnalysis,
  SubconsciousAnalysis,
  subscribeToProgression,
  UserProgression,
  getClientMode,
  subscribeToEnergyLogs,
  EnergyLog,
  calculateTotalCP,
  subscribeToVehicles,
  Vehicle,
  awardSovereigntyPoints
} from "@/lib/persistence";
import { analyzeChispazos, generateSeductionMessage, analyzeUnified, UnifiedAnalysisResult } from "@/lib/gemini";
import { useLocation } from "wouter";

const VIOLET = "#9B59B6";
const INDIGO = "#6366F1";
const AZURE = "#1E90FF";
const COBALT = "#0047AB";
const GOLD = "#D4AF37";
const EMERALD = "#50C878";

interface PatternAnalysis {
  category: string;
  energy: number;
  description: string;
}

function AchievementPanel({ progression }: { progression: UserProgression | null }) {
  if (!progression) return null;

  const warriorComplete = progression.warriorChallengeCompleted;
  const warriorProgress = warriorComplete ? 3 : Math.min(progression.consecutiveMissionStreak, 3);
  const warriorPercent = warriorComplete ? 100 : (warriorProgress / 3) * 100;
  
  const hopeAvg = progression.hopeAverages.length > 0 
    ? progression.hopeAverages.reduce((sum, h) => sum + h.average, 0) / progression.hopeAverages.length 
    : 0;
  const hopePercent = Math.min(hopeAvg, 100);
  const hopeNearGoal = hopePercent >= 75 && hopePercent < 85;
  const hopeComplete = hopePercent >= 85;
  
  const disciplineDays = progression.registrationDays;
  const disciplinePercent = Math.min((disciplineDays / 21) * 100, 100);
  const disciplineComplete = disciplineDays >= 21;

  const totalMissions = progression.totalMissionsCompleted;
  const allianceUnlocked = progression.rank === "arquitecto" && hopeComplete && totalMissions >= 10;

  const achievements = [
    {
      id: "warrior",
      title: "RETO GUERRERO",
      subtitle: warriorComplete ? "Completado" : `${warriorProgress}/3 Misiones Difíciles`,
      icon: Flame,
      color: EMERALD,
      progress: warriorPercent,
      complete: warriorComplete,
      nearGoal: warriorProgress === 2,
      message: warriorProgress === 2 ? "¡Una misión más!" : warriorProgress === 1 ? "Buen inicio" : ""
    },
    {
      id: "hope",
      title: "EJE ESPERANZA",
      subtitle: hopeComplete ? "≥85% Alcanzado" : `${Math.round(hopePercent)}% Promedio`,
      icon: TrendingUp,
      color: GOLD,
      progress: (hopePercent / 85) * 100,
      complete: hopeComplete,
      nearGoal: hopeNearGoal,
      message: hopeNearGoal ? `¡${Math.round(85 - hopePercent)}% para Alianza!` : ""
    },
    {
      id: "discipline",
      title: "DISCIPLINA",
      subtitle: disciplineComplete ? "21 Días Maestría" : `${disciplineDays}/21 Días`,
      icon: Calendar,
      color: AZURE,
      progress: disciplinePercent,
      complete: disciplineComplete,
      nearGoal: disciplineDays >= 14 && disciplineDays < 21,
      message: disciplineDays >= 14 ? `¡${21 - disciplineDays} días más!` : ""
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-3xl mb-6"
      style={{ 
        backgroundColor: "rgba(255,255,255,0.02)",
        border: `1px solid ${GOLD}30`
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} style={{ color: GOLD }} />
        <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: GOLD }}>
          Sistema de Logros
        </h3>
      </div>

      <div className="space-y-4">
        {achievements.map((ach, i) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className={cn("p-2 rounded-lg", ach.complete && "animate-pulse")}
                style={{ backgroundColor: `${ach.color}20` }}
              >
                <ach.icon size={16} style={{ color: ach.complete ? ach.color : `${ach.color}80` }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: ach.complete ? ach.color : "#fff" }}>
                    {ach.title}
                  </span>
                  {ach.complete && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${ach.color}30`, color: ach.color }}
                    >
                      LOGRADO
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{ach.subtitle}</span>
              </div>
            </div>
            
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(ach.progress, 100)}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                className={cn("h-full rounded-full", ach.nearGoal && "animate-pulse")}
                style={{ 
                  backgroundColor: ach.color,
                  boxShadow: ach.nearGoal ? `0 0 10px ${ach.color}` : "none"
                }}
              />
            </div>
            
            {ach.nearGoal && ach.message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold mt-1 text-right"
                style={{ color: ach.color }}
              >
                {ach.message}
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {allianceUnlocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 rounded-2xl text-center"
          style={{ 
            background: `linear-gradient(135deg, ${GOLD}20 0%, ${EMERALD}15 100%)`,
            border: `1px solid ${GOLD}50`
          }}
        >
          <Crown size={24} className="mx-auto mb-2" style={{ color: GOLD }} />
          <p className="text-sm font-black" style={{ color: GOLD }}>ALIANZA DESBLOQUEADA</p>
          <p className="text-[10px] text-slate-400 mt-1">Misión de Expansión: 30% comisión por referidos</p>
        </motion.div>
      )}

      {progression.rank === "iniciado" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Lock size={14} className="text-slate-600" />
          <p className="text-[10px] text-slate-500">
            Completa el Reto Guerrero para desbloquear más logros
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Radar() {
  const { user } = useAuthContext();
  const [chispazos, setChispazos] = useState<Chispazo[]>([]);
  const [newText, setNewText] = useState("");
  const [isDeseoLocoNew, setIsDeseoLocoNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [savedAnalysis, setSavedAnalysis] = useState<SubconsciousAnalysis | null>(null);
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, navigate] = useLocation();
  const [seductionMessage, setSeductionMessage] = useState<string>("");
  const [clientMode, setClientMode] = useState<"gratuito" | "pago" | "reto">("gratuito");
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [unifiedAnalysis, setUnifiedAnalysis] = useState<UnifiedAnalysisResult | null>(null);
  const [analyzingUnified, setAnalyzingUnified] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChispazos(
      user.uid,
      (data) => setChispazos(data),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToSubconsciousAnalysis(
      user.uid,
      (analysis) => {
        setSavedAnalysis(analysis);
        if (analysis && !showPatterns) {
          setPatterns(analysis.patterns);
        }
      },
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProgression(
      user.uid,
      (prog) => setProgression(prog),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToEnergyLogs(
      user.uid,
      (data) => setEnergyLogs(data),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToVehicles(
      user.uid,
      (data) => setVehicles(data),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!progression) return;
    const mode = getClientMode(progression);
    setClientMode(mode);
    
    const recentLogs = energyLogs.slice(0, 10);
    const positiveTypes = ["enfoque", "pasos"];
    const positiveCount = recentLogs.filter(l => positiveTypes.includes(l.type)).length;
    const hopePercent = Math.round((positiveCount / Math.max(recentLogs.length, 1)) * 100);
    const currentCP = calculateTotalCP(energyLogs);
    
    generateSeductionMessage({
      mode,
      hopePercent,
      totalCP: progression.totalCP || currentCP,
      registrationDays: progression.registrationDays || 0
    }, chispazos.length > 0 ? `${chispazos.length} chispazos registrados` : undefined).then(message => {
      setSeductionMessage(message);
    });
  }, [progression, energyLogs, chispazos]);

  const handleAdd = async () => {
    if (!user || !newText.trim()) return;
    setSaving(true);
    try {
      const id = await addChispazo(user.uid, newText.trim(), isDeseoLocoNew);
      
      await awardSovereigntyPoints(user.uid, 2, "Radar: Chispazo");
      
      setNewIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        setNewIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 3000);
      setNewText("");
      setIsDeseoLocoNew(false);
      toast.success("Chispazo registrado", {
        style: { backgroundColor: "#1a1a1a", border: `1px solid ${VIOLET}`, color: VIOLET }
      });
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    if (!user) return;
    await toggleDeseoLoco(user.uid, id);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteChispazo(user.uid, id);
    toast.success("Chispazo eliminado");
  };

  const analyzePatterns = async () => {
    if (chispazos.length < 3) {
      toast.error("Necesitas al menos 3 chispazos para analizar patrones");
      return;
    }
    setAnalyzing(true);
    try {
      const newPatterns = await analyzeChispazos(
        chispazos.map(c => ({
          text: c.text,
          isDeseoLoco: c.isDeseoLoco
        }))
      );
      
      if (newPatterns.length > 0) {
        setPatterns(newPatterns);
        setShowPatterns(true);
        
        if (user) {
          await saveSubconsciousAnalysis(user.uid, newPatterns, chispazos.length);
          toast.success("Análisis guardado en tu bóveda", {
            style: { backgroundColor: "#1a1a1a", border: `1px solid ${COBALT}`, color: COBALT }
          });
        }
      } else {
        toast.error("No se pudieron detectar patrones");
      }
    } catch {
      toast.error("Error al analizar");
    }
    setAnalyzing(false);
  };

  const runUnifiedAnalysis = async () => {
    const totalData = chispazos.length + energyLogs.length + vehicles.length;
    if (totalData < 3) {
      toast.error("Necesitas más registros para el análisis profundo (chispazos, energía o misiones)");
      return;
    }

    setAnalyzingUnified(true);
    try {
      const recentLogs = energyLogs.slice(0, 10);
      const positiveTypes = ["enfoque", "pasos"];
      const positiveCount = recentLogs.filter(l => positiveTypes.includes(l.type)).length;
      const hopePercent = Math.round((positiveCount / Math.max(recentLogs.length, 1)) * 100);

      const result = await analyzeUnified({
        chispazos: chispazos.slice(0, 10).map(c => ({ text: c.text, isDeseoLoco: c.isDeseoLoco })),
        energyLogs: energyLogs.slice(0, 10).map(e => ({ type: e.type, text: e.text, points: e.points })),
        misiones: vehicles.slice(0, 10).map(v => {
          const retoCount = Object.values(v.ejes).filter(e => e.trifecta === "reto").length;
          return {
            titulo: v.titulo,
            estado: v.status,
            dificultad: retoCount >= 1 ? "DIFÍCIL" : "NORMAL"
          };
        }),
        hopePercent,
        totalCP: progression?.totalCP || calculateTotalCP(energyLogs),
        registrationDays: progression?.registrationDays || 0
      });

      setUnifiedAnalysis(result);
      toast.success("Análisis profundo completado", {
        style: { backgroundColor: "#1a1a1a", border: `1px solid ${VIOLET}`, color: VIOLET }
      });
    } catch (error) {
      console.error("Unified analysis error:", error);
      toast.error("Error en el análisis");
    }
    setAnalyzingUnified(false);
  };


  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${INDIGO}15` }}>
            <Brain size={16} style={{ color: INDIGO }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: INDIGO }}>
              Radar del Subconsciente
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">CHISPAZOS</h1>
          <p className="text-sm text-slate-500">La voz sin filtro de tu interior</p>
        </motion.div>

        <AchievementPanel progression={progression} />

        {/* Análisis Unificado - Fusión de todos los datos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl"
          style={{ 
            backgroundColor: "rgba(255,255,255,0.02)",
            border: `1px solid ${VIOLET}30`
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye size={18} style={{ color: VIOLET }} />
              <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: VIOLET }}>
                Análisis Profundo
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span>{chispazos.length} chispazos</span>
              <span>•</span>
              <span>{energyLogs.length} registros</span>
              <span>•</span>
              <span>{vehicles.length} misiones</span>
            </div>
          </div>

          {!unifiedAnalysis ? (
            <div className="text-center py-4">
              <p className="text-xs text-slate-500 mb-4">
                Fusiona todos tus registros para revelar patrones ocultos
              </p>
              <button
                onClick={runUnifiedAnalysis}
                disabled={analyzingUnified || (chispazos.length + energyLogs.length + vehicles.length) < 3}
                className="px-6 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: VIOLET, color: "#fff" }}
              >
                {analyzingUnified ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Analizando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Brain size={16} />
                    Analizar Todo
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Balance de los 4 Ejes */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "enfoque", label: "ENFOQUE", color: "#A855F7" },
                  { key: "conflicto", label: "CONFLICTO", color: "#EF4444" },
                  { key: "pasos", label: "PASOS", color: "#3B82F6" },
                  { key: "alcance", label: "ALCANCE", color: "#7C3AED" }
                ].map(eje => {
                  const value = unifiedAnalysis.ejesBalance[eje.key as keyof typeof unifiedAnalysis.ejesBalance];
                  const isHipertrofiado = unifiedAnalysis.hipertrofiado?.toLowerCase().includes(eje.key);
                  const isAtrofiado = unifiedAnalysis.atrofiado?.toLowerCase().includes(eje.key);
                  return (
                    <div 
                      key={eje.key} 
                      className={cn(
                        "p-3 rounded-xl relative",
                        isHipertrofiado && "ring-2 ring-amber-500/50",
                        isAtrofiado && "ring-2 ring-red-500/50"
                      )}
                      style={{ backgroundColor: `${eje.color}15` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase" style={{ color: eje.color }}>
                          {eje.label}
                        </span>
                        <span className="text-xs font-black" style={{ color: eje.color }}>
                          {value}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: eje.color }}
                        />
                      </div>
                      {isHipertrofiado && (
                        <span className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                          ALTO
                        </span>
                      )}
                      {isAtrofiado && (
                        <span className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                          BAJO
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mensaje Clave */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/30">
                <p className="text-sm text-white/90 italic text-center" style={{ fontFamily: "Georgia, serif" }}>
                  "{unifiedAnalysis.mensajeClave}"
                </p>
              </div>

              {/* Recomendación */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} style={{ color: GOLD }} />
                  <span className="text-[10px] font-bold uppercase" style={{ color: GOLD }}>
                    Misión Sugerida
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {unifiedAnalysis.recomendacion}
                </p>
              </div>

              {/* Botón para re-analizar */}
              <button
                onClick={() => { setUnifiedAnalysis(null); runUnifiedAnalysis(); }}
                disabled={analyzingUnified}
                className="w-full py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <Zap size={12} />
                Actualizar Análisis
              </button>
            </div>
          )}
        </motion.div>

        {/* Mensaje de Seducción Personalizado */}
        {seductionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-2xl border backdrop-blur-xl mb-6",
              clientMode === "gratuito" && "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30",
              clientMode === "pago" && "bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30",
              clientMode === "reto" && "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/30"
            )}
            data-testid="radar-seduction-message"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                clientMode === "gratuito" && "bg-purple-500/20",
                clientMode === "pago" && "bg-blue-500/20",
                clientMode === "reto" && "bg-amber-500/20"
              )}>
                <Sparkles size={16} className={cn(
                  clientMode === "gratuito" && "text-purple-400",
                  clientMode === "pago" && "text-blue-400",
                  clientMode === "reto" && "text-amber-400"
                )} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/90 leading-relaxed">
                  {seductionMessage}
                </p>
                {clientMode === "pago" && (
                  <button
                    onClick={() => navigate("/esperanza")}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                    data-testid="radar-link-to-acervo"
                  >
                    Fortalecer en Acervo
                  </button>
                )}
                {clientMode === "reto" && (
                  <button
                    onClick={() => navigate("/socios")}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    data-testid="radar-link-to-alliance"
                  >
                    Ver Propuesta de Alianza
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl backdrop-blur-xl"
          style={{ 
            backgroundColor: "rgba(255,255,255,0.03)",
            border: `1px solid rgba(99, 102, 241, 0.2)`
          }}
        >
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Escribe lo que tu subconsciente susurra... sin importar si parece posible o no."
            className="w-full p-3 rounded-xl text-sm text-white placeholder-slate-600 resize-none backdrop-blur-sm"
            style={{ 
              backgroundColor: "rgba(255,255,255,0.05)",
              fontFamily: "Georgia, serif",
              fontStyle: "italic"
            }}
            rows={3}
          />
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setIsDeseoLocoNew(!isDeseoLocoNew)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all",
                isDeseoLocoNew 
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50" 
                  : "bg-white/5 text-slate-500 border border-white/10"
              )}
            >
              <Star size={14} className={isDeseoLocoNew ? "fill-indigo-400" : ""} />
              Deseo Loco
            </button>
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: INDIGO, color: "#fff" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Registrar
            </button>
          </div>
        </motion.div>

        {chispazos.length >= 3 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={analyzePatterns}
            disabled={analyzing}
            className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
            style={{ 
              background: `linear-gradient(135deg, ${AZURE}20 0%, ${VIOLET}20 100%)`,
              border: `1px solid ${AZURE}30`
            }}
          >
            {analyzing ? (
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${COBALT}30` }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: COBALT }}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <Brain size={14} style={{ color: "#fff" }} />
                </motion.div>
                <div className="flex flex-col items-start">
                  <motion.span 
                    className="text-sm font-bold"
                    style={{ color: COBALT }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Análisis en Curso
                  </motion.span>
                  <span className="text-[10px] text-slate-500">Procesando tu subconsciente...</span>
                </div>
              </div>
            ) : (
              <>
                <Eye size={16} style={{ color: AZURE }} />
                <span style={{ color: AZURE }}>Revelar Patrones Ocultos</span>
              </>
            )}
          </motion.button>
        )}

        <AnimatePresence>
          {showPatterns && patterns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} style={{ color: AZURE }} />
                Energía Latente Detectada
              </h3>
              {patterns.map((pattern, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="relative p-4 rounded-2xl backdrop-blur-lg overflow-hidden"
                  style={{ 
                    backgroundColor: `${AZURE}08`,
                    border: `1px solid ${AZURE}40`
                  }}
                >
                  <motion.div
                    className="absolute inset-0 -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${AZURE}15 0%, transparent 50%, ${VIOLET}10 100%)`
                    }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{pattern.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-28 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pattern.energy}%` }}
                          transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ 
                            background: `linear-gradient(90deg, ${AZURE} 0%, ${VIOLET} 100%)`,
                            boxShadow: `0 0 10px ${AZURE}80`
                          }}
                        />
                      </div>
                      <motion.span 
                        className="text-xs font-black"
                        style={{ color: AZURE }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 + 1 }}
                      >
                        {pattern.energy}%
                      </motion.span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                    {pattern.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {chispazos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Susurros Capturados ({chispazos.length})
            </h3>
            <div className="grid gap-4">
              {chispazos.map((chispazo, index) => {
                const isNew = newIds.has(chispazo.id);
                
                return (
                  <motion.div
                    key={chispazo.id}
                    initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      rotate: index % 5 === 0 ? 1 : index % 5 === 1 ? -1 : index % 5 === 2 ? 2 : index % 5 === 3 ? -2 : 0
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative p-4 rounded-3xl backdrop-blur-xl transition-all"
                    style={{ 
                      backgroundColor: chispazo.isDeseoLoco 
                        ? "rgba(99, 102, 241, 0.15)" 
                        : "rgba(255,255,255,0.03)",
                      border: chispazo.isDeseoLoco 
                        ? `2px solid rgba(139, 92, 246, 0.5)` 
                        : "1px solid rgba(255,255,255,0.05)",
                      boxShadow: chispazo.isDeseoLoco 
                        ? `0 0 30px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(99, 102, 241, 0.1)`
                        : "none"
                    }}
                  >
                    {isNew && (
                      <motion.div
                        className="absolute -inset-4 rounded-3xl -z-10"
                        style={{ 
                          background: `radial-gradient(circle, ${VIOLET}50 0%, transparent 60%)`,
                          filter: "blur(25px)"
                        }}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    {chispazo.isDeseoLoco && !isNew && (
                      <motion.div
                        className="absolute -inset-2 rounded-3xl -z-10"
                        style={{ 
                          background: `radial-gradient(ellipse, ${INDIGO}30 0%, transparent 70%)`,
                          filter: "blur(15px)"
                        }}
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    )}
                    
                    <p className="text-sm text-white mb-3" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                      "{chispazo.text}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggle(chispazo.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all",
                          chispazo.isDeseoLoco 
                            ? "bg-indigo-500/30 text-indigo-300" 
                            : "bg-white/5 text-slate-500"
                        )}
                      >
                        <Star size={10} className={chispazo.isDeseoLoco ? "fill-indigo-400" : ""} />
                        {chispazo.isDeseoLoco ? "Deseo Loco" : "Normal"}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600">
                          {new Date(chispazo.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDelete(chispazo.id)}
                          className="p-1 rounded-full hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={12} className="text-slate-600 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {chispazos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div 
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${INDIGO}10` }}
            >
              <Zap size={32} style={{ color: INDIGO }} />
            </div>
            <p className="text-slate-500 text-sm">
              Tu radar está vacío.<br />
              Captura los susurros de tu subconsciente.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
