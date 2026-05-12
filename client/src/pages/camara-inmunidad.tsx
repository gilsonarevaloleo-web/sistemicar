import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Ghost, Unlock, Zap, Lock, Flame, Archive, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuthContext } from "@/App";

type Phase = "plomo" | "vacio" | "oro" | "sellado";

interface LibertadSellada {
  id: string;
  limite: string;
  accionSoberana: string;
  fecha: string;
}

const STORAGE_KEY = "sistemicar_archivo_libertades";

function getLibertades(): LibertadSellada[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLibertad(libertad: LibertadSellada) {
  const libertades = getLibertades();
  libertades.unshift(libertad);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libertades.slice(0, 50)));
}

export default function CamaraInmunidad() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("plomo");
  const [limite, setLimite] = useState("");
  const [accionSoberana, setAccionSoberana] = useState("");
  const [libertades, setLibertades] = useState<LibertadSellada[]>([]);
  const [showArchivo, setShowArchivo] = useState(false);

  useEffect(() => {
    setLibertades(getLibertades());
  }, []);

  const handleTransmutar = () => {
    if (!limite.trim() || limite.length < 5) {
      toast.error("Identifica tu jurisdicción limitante (mín. 5 caracteres)");
      return;
    }
    setPhase("vacio");
    setTimeout(() => {
      setPhase("oro");
    }, 2500);
  };

  const handleSellar = () => {
    if (!accionSoberana.trim() || accionSoberana.length < 5) {
      toast.error("Declara tu acción soberana (mín. 5 caracteres)");
      return;
    }

    const nuevaLibertad: LibertadSellada = {
      id: `LIB-${Date.now().toString(36).toUpperCase()}`,
      limite: limite.trim(),
      accionSoberana: accionSoberana.trim(),
      fecha: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    };

    saveLibertad(nuevaLibertad);
    setLibertades(getLibertades());
    setPhase("sellado");
    
    toast.success("AUTORIDAD REGISTRADA", {
      style: { 
        backgroundColor: "#052e16", 
        border: "1px solid #22c55e", 
        color: "#22c55e",
        fontWeight: "bold",
        letterSpacing: "0.1em"
      }
    });
  };

  const resetRitual = () => {
    setPhase("plomo");
    setLimite("");
    setAccionSoberana("");
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-32">
      <div className="max-w-lg mx-auto p-4">
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate("/")}
            className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <button
            onClick={() => setShowArchivo(!showArchivo)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider"
            data-testid="button-archivo"
          >
            <Archive className="w-4 h-4" />
            ARCHIVO ({libertades.length})
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-white mb-2">
            CÁMARA DE INMUNIDAD
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest">
            DESDOBLAMIENTO SOBERANO
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "plomo" && (
            <motion.div
              key="plomo"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="space-y-6"
            >
              <div className="bg-zinc-950 rounded-2xl border-2 border-red-900/50 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-950/50 border border-red-900/50">
                    <Lock className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-red-400">
                      FASE 1: EL PLOMO
                    </h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">
                      IDENTIFICAR JURISDICCIÓN LIMITANTE
                    </p>
                  </div>
                </div>

                <textarea
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  placeholder="Escribe tu límite actual... (ej. 'No tengo dinero', 'Tengo miedo de...')"
                  className="w-full h-32 bg-black/50 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-red-700 transition-colors"
                  data-testid="input-limite"
                />

                <p className="text-xs text-zinc-600 mt-2 uppercase tracking-wider">
                  Papel 1: La realidad que te limita
                </p>
              </div>

              <motion.button
                onClick={handleTransmutar}
                disabled={!limite.trim()}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-900 to-red-800 text-white font-bold uppercase tracking-[0.2em] text-lg disabled:opacity-30 disabled:cursor-not-allowed border border-red-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-transmutar"
              >
                <div className="flex items-center justify-center gap-3">
                  <Flame className="w-6 h-6" />
                  TRANSMUTAR
                </div>
              </motion.button>
            </motion.div>
          )}

          {phase === "vacio" && (
            <motion.div
              key="vacio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden min-h-[200px] flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent" />
                
                <motion.div
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ 
                    opacity: [1, 0.7, 0.4, 0.1, 0],
                    scale: [1, 1.1, 0.9, 0.5, 0],
                    filter: ["blur(0px)", "blur(2px)", "blur(4px)", "blur(8px)", "blur(16px)"]
                  }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                  className="text-center relative z-10"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 3, -3, 0],
                      y: [0, -5, 5, -3, 3, 0]
                    }}
                    transition={{ duration: 0.5, repeat: 4 }}
                  >
                    <p className="text-xl text-red-400/80 font-medium italic">
                      "{limite}"
                    </p>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Ghost className="w-16 h-16 text-zinc-700 animate-pulse" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0.5] }}
                  transition={{ duration: 2.5 }}
                  className="absolute bottom-6 text-xs uppercase tracking-[0.3em] text-zinc-600"
                >
                  DISOLVIENDO REALIDAD...
                </motion.p>
              </div>
            </motion.div>
          )}

          {phase === "oro" && (
            <motion.div
              key="oro"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">LÍMITE DISUELTO:</p>
                <p className="text-zinc-600 line-through italic">"{limite}"</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/40 to-amber-950/30 rounded-2xl border-2 border-emerald-700/50 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-700/50">
                    <Unlock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-emerald-400">
                      FASE 3: EL ORO
                    </h2>
                    <p className="text-xs text-amber-500/80 uppercase tracking-wider">
                      DECLARACIÓN SOBERANA
                    </p>
                  </div>
                </div>

                <textarea
                  value={accionSoberana}
                  onChange={(e) => setAccionSoberana(e.target.value)}
                  placeholder="¿Qué harías si fueras INVULNERABLE? Declara tu acción en el Papel 2..."
                  className="w-full h-32 bg-black/30 border border-emerald-800/50 rounded-xl p-4 text-emerald-100 placeholder-emerald-700/50 resize-none focus:outline-none focus:border-emerald-500 transition-colors relative z-10"
                  autoFocus
                  data-testid="input-accion-soberana"
                />

                <p className="text-xs text-amber-600/80 mt-2 uppercase tracking-wider relative z-10">
                  Papel 2: Tu realidad soberana
                </p>
              </div>

              <motion.button
                onClick={handleSellar}
                disabled={!accionSoberana.trim()}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 text-white font-bold uppercase tracking-[0.2em] text-lg disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-sellar"
              >
                <div className="flex items-center justify-center gap-3">
                  <Zap className="w-6 h-6" />
                  SELLAR AUTORIDAD
                </div>
              </motion.button>
            </motion.div>
          )}

          {phase === "sellado" && (
            <motion.div
              key="sellado"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-emerald-950/50 to-zinc-900 rounded-2xl border border-emerald-700/30 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.1)_0%,_transparent_70%)]" />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-900/50 border-2 border-emerald-500 mb-6 relative z-10"
                >
                  <Shield className="w-10 h-10 text-emerald-400" />
                </motion.div>

                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-emerald-400 mb-2 relative z-10">
                  INMUNIDAD ACTIVADA
                </h2>
                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-6 relative z-10">
                  DESDOBLAMIENTO COMPLETADO
                </p>

                <div className="bg-black/30 rounded-xl p-4 border border-zinc-800 mb-4 relative z-10">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">DE:</p>
                  <p className="text-zinc-600 line-through text-sm italic mb-3">"{limite}"</p>
                  <p className="text-xs text-emerald-500 uppercase tracking-wider mb-1">A:</p>
                  <p className="text-emerald-300 text-sm font-medium">"{accionSoberana}"</p>
                </div>
              </div>

              <motion.button
                onClick={resetRitual}
                className="w-full py-4 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 font-bold uppercase tracking-[0.15em]"
                whileHover={{ scale: 1.02, borderColor: "#52525b" }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-nuevo-ritual"
              >
                NUEVO DESDOBLAMIENTO
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showArchivo && libertades.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 overflow-hidden"
            >
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-400 mb-4 flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  ARCHIVO DE LIBERTADES
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {libertades.map((lib) => (
                    <div key={lib.id} className="bg-black/50 rounded-xl p-3 border border-zinc-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{lib.fecha}</span>
                        <span className="text-[10px] text-emerald-600 font-mono">{lib.id}</span>
                      </div>
                      <p className="text-xs text-zinc-600 line-through mb-1">"{lib.limite}"</p>
                      <p className="text-xs text-emerald-400">→ {lib.accionSoberana}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
