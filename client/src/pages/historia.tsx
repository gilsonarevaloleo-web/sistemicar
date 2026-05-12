import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Archive,
  ArrowLeft,
  Target,
  Zap,
  Footprints,
  Shield,
  ChevronDown,
  ChevronUp,
  Scroll,
  Crown
} from "lucide-react";
import { useAuthContext } from "@/App";
import { subscribeToMisiones, Mision } from "@/lib/persistence";

const EMERALD = "#50C878";
const RED = "#DC2626";
const GOLD = "#D4AF37";
const AZURE = "#1E90FF";
const VIOLET = "#9B59B6";

const EJES_CONFIG = {
  enfoque: { label: "ENFOQUE", icon: Target, color: "#A855F7", cp: 5 },
  conflicto: { label: "CONFLICTO", icon: Zap, color: "#EF4444", cp: 10 },
  pasos: { label: "PASOS", icon: Footprints, color: "#3B82F6", cp: 15 },
  limite: { label: "ALCANCE", icon: Shield, color: "#7C3AED", cp: 20 }
};

export default function Historia() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "cumplido" | "archivado">("all");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMisiones(
      user.uid,
      (data) => setMisiones(data),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  const filteredMisiones = filter === "all" 
    ? misiones 
    : misiones.filter(m => m.estado === filter);

  const cumplidas = misiones.filter(m => m.estado === "cumplido").length;
  const archivadas = misiones.filter(m => m.estado === "archivado").length;

  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto space-y-6">
        <header className="flex items-center gap-4 py-4">
          <button
            onClick={() => navigate("/espejo")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Scroll size={24} style={{ color: GOLD }} />
              Historia
            </h1>
            <p className="text-xs text-slate-500">Tu legado de conquistas y alcances</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-2xl border text-center cursor-pointer transition-all"
            style={{ 
              backgroundColor: `${EMERALD}10`,
              borderColor: filter === "cumplido" ? EMERALD : `${EMERALD}30`
            }}
            onClick={() => setFilter(filter === "cumplido" ? "all" : "cumplido")}
            data-testid="filter-cumplido"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy size={20} style={{ color: EMERALD }} />
              <span className="text-2xl font-black" style={{ color: EMERALD }}>{cumplidas}</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Victorias</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-2xl border text-center cursor-pointer transition-all"
            style={{ 
              backgroundColor: `${RED}10`,
              borderColor: filter === "archivado" ? RED : `${RED}30`
            }}
            onClick={() => setFilter(filter === "archivado" ? "all" : "archivado")}
            data-testid="filter-archivado"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Archive size={20} style={{ color: RED }} />
              <span className="text-2xl font-black" style={{ color: RED }}>{archivadas}</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Alcances</p>
          </motion.div>
        </div>

        {misiones.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: `${GOLD}10` }}>
            <Crown size={16} style={{ color: GOLD }} />
            <span className="text-xs text-slate-400">
              Soberanía promedio: 
              <span className="font-black ml-1" style={{ color: GOLD }}>
                {Math.round(misiones.reduce((sum, m) => sum + m.soberaniaMomento, 0) / misiones.length)}%
              </span>
            </span>
          </div>
        )}

        <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
          <AnimatePresence mode="popLayout">
            {filteredMisiones.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Scroll size={48} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">
                  {filter === "all" 
                    ? "Tu historia está por escribirse" 
                    : filter === "cumplido" 
                      ? "Aún no hay victorias registradas"
                      : "Ningún alcance reconocido"}
                </p>
              </motion.div>
            ) : (
              filteredMisiones.map((mision, index) => {
                const isExpanded = expandedId === mision.id;
                const isCumplido = mision.estado === "cumplido";
                const statusColor = isCumplido ? EMERALD : RED;

                return (
                  <motion.div
                    key={mision.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border overflow-hidden"
                    style={{ 
                      backgroundColor: "#0a0a0a",
                      borderColor: `${statusColor}40`
                    }}
                    data-testid={`mision-${mision.id}`}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : mision.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${statusColor}20` }}
                        >
                          {isCumplido ? (
                            <Trophy size={18} style={{ color: statusColor }} />
                          ) : (
                            <Archive size={18} style={{ color: statusColor }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate">{mision.titulo}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: `${statusColor}20`,
                                color: statusColor
                              }}
                            >
                              {isCumplido ? "Victoria" : "Alcance"}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              {new Date(mision.createdAt).toLocaleDateString("es", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                            style={{ 
                              borderColor: statusColor,
                              background: `linear-gradient(135deg, ${statusColor}20 0%, transparent 100%)`
                            }}
                          >
                            <span className="text-sm font-black" style={{ color: statusColor }}>
                              {mision.soberaniaMomento}%
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-500" />
                          )}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4">
                            <div className="h-px bg-white/10" />
                            
                            <div className="grid grid-cols-4 gap-2">
                              {(Object.entries(mision.scores) as [keyof typeof EJES_CONFIG, number][]).map(([key, value]) => {
                                const config = EJES_CONFIG[key];
                                const Icon = config.icon;
                                return (
                                  <div 
                                    key={key}
                                    className="p-2 rounded-xl text-center"
                                    style={{ backgroundColor: `${config.color}10` }}
                                  >
                                    <Icon size={14} className="mx-auto mb-1" style={{ color: config.color }} />
                                    <span className="text-xs font-bold" style={{ color: config.color }}>
                                      {value}
                                    </span>
                                    <p className="text-[8px] text-slate-600 uppercase">{config.label}</p>
                                  </div>
                                );
                              })}
                            </div>

                            {mision.comentario && (
                              <div 
                                className="p-3 rounded-xl"
                                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                              >
                                <p className="text-xs text-slate-400 italic" style={{ fontFamily: "Georgia, serif" }}>
                                  "{mision.comentario}"
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {filteredMisiones.length > 0 && (
          <p className="text-center text-xs text-slate-600">
            {filteredMisiones.length} misión{filteredMisiones.length !== 1 ? "es" : ""} 
            {filter !== "all" && ` (${filter === "cumplido" ? "victorias" : "alcances"})`}
          </p>
        )}
      </div>
    </div>
  );
}
